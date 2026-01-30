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

    const prompt = `You are an expert OCR system for INTERNATIONAL TRAVEL DOCUMENTS (Passports, Visas, Resident Cards, ID Cards from ANY country).

TASK: Extract personal information from travel document images with HIGH ACCURACY.

DOCUMENT TYPES TO RECOGNIZE:
- International Passports (any country: USA, Japan, Australia, Philippines, New Zealand, etc.)
- Visas (tourist, work, student visas)
- Resident Cards / Green Cards
- National ID Cards

FIELDS TO EXTRACT:
- documentType: "PASSPORT" | "VISA" | "RESIDENT_CARD" | "ID_CARD"
- issuingCountry: Country that issued the document (e.g., "AUSTRALIA", "JAPAN", "USA", "PHILIPPINES")
- hoTenKhongDau: Full name in LATIN characters WITHOUT diacritics (SURNAME + GIVEN NAMES). Format: "SURNAME GIVEN_NAMES"
- ngaySinh: Date of birth in dd/mm/yyyy format
- gioiTinh: Gender - "M" for Male, "F" for Female
- quocTich: Nationality/Citizenship - ONLY extract if explicitly labeled "Nationality" or "Citizenship". Return null if not found.
- soHoChieu: Passport/Document number (or USCIS# for Green Cards)
- ngayCapHC: Date of issue in dd/mm/yyyy format
- ngayHetHanHC: Date of expiry in dd/mm/yyyy format
- noiCapHC: Place of issue (if available)
- noiSinh: Place/Country of Birth - DIFFERENT from nationality!

CRITICAL INSTRUCTIONS:
1. **COUNTRY OF BIRTH ≠ NATIONALITY**:
   - "Country of Birth" / "Place of Birth" → goes to noiSinh field
   - "Nationality" / "Citizenship" → goes to quocTich field
   - These are DIFFERENT! A person born in Vietnam can be Australian citizen.
   - For RESIDENT CARDS (e.g., US Green Card): Card holder is NOT a citizen of issuing country. Leave quocTich as null.
   - For PASSPORTS: If no explicit "Nationality" field, use issuingCountry as nationality (passport = citizen of that country).

2. **MRZ PRIORITY**: If Machine Readable Zone (MRZ) is visible at bottom of document, PRIORITIZE extracting data from MRZ as it's most accurate:
   - Line 1: Document type, country code, surname, given names
   - Line 2: Document number, nationality, DOB (YYMMDD), sex, expiry (YYMMDD)

3. **DATE FORMAT CONVERSION**: Convert ALL dates to dd/mm/yyyy format:
   - "20 NOV 1998" → "20/11/1998"
   - "04 SEP 25" → "04/09/2025"
   - "25 SEP 1976" → "25/09/1976"
   - "07/14/27" (US format MM/DD/YY) → "14/07/2027"
   - MRZ format "940610" (YYMMDD) → "10/06/1994"

4. **NAME HANDLING**:
   - Combine Surname + Given names + Middle name into hoTenKhongDau
   - Remove ALL diacritics (e.g., "NGUYỄN" → "NGUYEN")
   - Format: "SURNAME GIVEN_NAMES" (e.g., "FLORES RAQUEL MELENDRES")

5. **COUNTRY CODES**: Use full country name in UPPERCASE:
   - AUS → AUSTRALIA, JPN → JAPAN, USA → USA, PHL → PHILIPPINES, NZL → NEW ZEALAND, VNM → VIETNAM

6. Return null for any field not found in the document

OUTPUT: Return ONLY a valid JSON object, no explanation.`;


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
