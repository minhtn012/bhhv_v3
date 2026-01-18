import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// Model for OCR - same as contracts/extract-info
const MODEL_GEMINI = 'gemini-2.5-flash-lite';

// Max images per request
const MAX_IMAGES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image

// POST /api/travel/extract-info - Extract info from CCCD/Passport images
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key chua duoc cau hinh' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Can it nhat 1 anh de trich xuat' },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Toi da ${MAX_IMAGES} anh moi lan upload` },
        { status: 400 }
      );
    }

    // Validate each image
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.data || !img.mimeType) {
        return NextResponse.json(
          { error: `Anh ${i + 1}: Thieu du lieu hoac mime type` },
          { status: 400 }
        );
      }
      // Check base64 size (rough estimate)
      const sizeEstimate = (img.data.length * 3) / 4;
      if (sizeEstimate > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Anh ${i + 1}: Vuot qua kich thuoc toi da 10MB` },
          { status: 400 }
        );
      }
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_GEMINI}:generateContent?key=${apiKey}`;

    const prompt = `Ban la chuyen gia OCR phan tich giay to tuy than Viet Nam (CCCD, CMND, Ho chieu/Passport).

NHIEM VU: Trich xuat thong tin ca nhan tu anh giay to.

CAC TRUONG CAN TRICH XUAT:
- hoTen: Ho va ten day du (co dau tieng Viet)
- hoTenKhongDau: Ho ten khong dau (nhu tren passport)
- ngaySinh: Ngay sinh (dd/mm/yyyy)
- gioiTinh: Gioi tinh (Nam/Nu)
- quocTich: Quoc tich
- soCCCD: So CCCD/CMND (12 so)
- soHoChieu: So ho chieu (neu la passport)
- ngayCapHC: Ngay cap ho chieu
- ngayHetHanHC: Ngay het han ho chieu
- noiCapHC: Noi cap ho chieu
- diaChi: Dia chi thuong tru (tren CCCD)

HUONG DAN:
- Neu la CCCD: Uu tien lay soCCCD, hoTen, ngaySinh, gioiTinh, diaChi
- Neu la Passport: Uu tien lay soHoChieu, hoTenKhongDau, ngaySinh, gioiTinh, quocTich
- Neu khong tim thay thong tin: de null
- Chi tra ve JSON object, khong giai thich
- Tra ve dung 1 JSON object (khong phai array)`;

    // Process each image and collect results
    const results: Array<{
      index: number;
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
    }> = [];

    // Process images in parallel (batch of 5 to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchPromises = batch.map(async (img: { data: string; mimeType: string }, batchIndex: number) => {
        const imageIndex = i + batchIndex;
        try {
          const payload = {
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: img.mimeType,
                    data: img.data
                  }
                }
              ]
            }]
          };

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API error for image ${imageIndex}:`, response.status, errorText);
            return {
              index: imageIndex,
              success: false,
              error: `Loi API: ${response.status} - ${errorText.slice(0, 100)}`
            };
          }

          const result = await response.json();

          if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            let extractedText = result.candidates[0].content.parts[0].text;
            extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
              const extractedData = JSON.parse(extractedText);
              return {
                index: imageIndex,
                success: true,
                data: extractedData
              };
            } catch {
              return {
                index: imageIndex,
                success: false,
                error: 'Khong the phan tich du lieu tu anh'
              };
            }
          } else {
            return {
              index: imageIndex,
              success: false,
              error: 'Khong nhan duoc du lieu tu API'
            };
          }
        } catch (err) {
          return {
            index: imageIndex,
            success: false,
            error: err instanceof Error ? err.message : 'Loi khong xac dinh'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Sort by index to maintain order
    results.sort((a, b) => a.index - b.index);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: images.length,
        success: successCount,
        failed: failCount
      }
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Can dang nhap de su dung tinh nang nay' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Da co loi xay ra khi trich xuat thong tin' },
      { status: 500 }
    );
  }
}
