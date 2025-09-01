import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// POST /api/contracts/extract-info - Trích xuất thông tin từ ảnh sử dụng Gemini API
export async function POST(request: NextRequest) {
  try {
    requireAuth(request); // Xác thực user

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key chưa được cấu hình' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageData, imageType } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Dữ liệu ảnh là bắt buộc' },
        { status: 400 }
      );
    }

    // Gọi Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const prompt = `Phân tích hình ảnh giấy tờ xe (đăng ký hoặc đăng kiểm) của Việt Nam và trích xuất các thông tin sau dưới dạng JSON. Chỉ trả về JSON, không giải thích gì thêm.

Các trường thông tin cần trích xuất:
- chuXe: Tên chủ xe (họ và tên)
- diaChi: Địa chỉ của chủ xe
- nhanHieu: Nhãn hiệu xe (ví dụ: Toyota, Honda, Mazda...)
- soLoai: Số loại xe (mã model)
- soKhung: Số khung xe (chassis number)
- soMay: Số máy xe (engine number)  
- bienSo: Biển số xe (license plate)
- namSanXuat: Năm sản xuất xe (chỉ số năm, ví dụ: 2020)
- soChoNgoi: Số chỗ ngồi (chỉ số, ví dụ: 5)
- ngayDangKyLanDau: Ngày đăng ký lần đầu (định dạng dd/mm/yyyy)
- trongTaiHangHoa: Khối lượng hàng chuyên chở cho phép (tính bằng kg, chỉ áp dụng cho xe tải)
- kinhDoanhVanTai: "Có" hoặc "Không" - xe có được sử dụng để kinh doanh vận tải không
- loaiXe: Loại xe (xe con, xe tải, xe khách, bán tải...)

Nếu không tìm thấy thông tin nào, hãy để giá trị là null. Đặc biệt chú ý:
- Năm sản xuất phải là số nguyên
- Số chỗ ngồi phải là số nguyên
- Trọng tải phải là số (nếu có)
- Ngày tháng phải đúng định dạng dd/mm/yyyy`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { 
            inline_data: { 
              mime_type: imageType || "image/jpeg", 
              data: imageData 
            } 
          }
        ]
      }]
    };

    console.log('Calling Gemini API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Gemini API call failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      return NextResponse.json(
        { error: `Lỗi khi gọi API Gemini: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Gemini API response:', result);

    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      let extractedText = result.candidates[0].content.parts[0].text;
      
      // Clean up the response text
      extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const extractedData = JSON.parse(extractedText);
        
        // Validate and clean the data
        const cleanedData = {
          chuXe: extractedData.chuXe || null,
          diaChi: extractedData.diaChi || null,
          nhanHieu: extractedData.nhanHieu || null,
          soLoai: extractedData.soLoai || null,
          soKhung: extractedData.soKhung || null,
          soMay: extractedData.soMay || null,
          bienSo: extractedData.bienSo ? extractedData.bienSo.toString().toUpperCase() : null,
          namSanXuat: extractedData.namSanXuat ? parseInt(extractedData.namSanXuat) : null,
          soChoNgoi: extractedData.soChoNgoi ? parseInt(extractedData.soChoNgoi) : null,
          ngayDangKyLanDau: extractedData.ngayDangKyLanDau || null,
          trongTaiHangHoa: extractedData.trongTaiHangHoa ? parseInt(extractedData.trongTaiHangHoa) : null,
          kinhDoanhVanTai: extractedData.kinhDoanhVanTai || "Không",
          loaiXe: extractedData.loaiXe || null
        };

        return NextResponse.json({
          success: true,
          data: cleanedData
        });

      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw text:', extractedText);
        
        return NextResponse.json(
          { error: 'Không thể phân tích dữ liệu từ ảnh. Vui lòng thử ảnh khác rõ nét hơn.' },
          { status: 400 }
        );
      }
      
    } else {
      console.error('Invalid API response structure:', result);
      return NextResponse.json(
        { error: 'Phản hồi từ API không hợp lệ hoặc không chứa dữ liệu.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Extract info error:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Cần đăng nhập để sử dụng tính năng này' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi trích xuất thông tin' },
      { status: 500 }
    );
  }
}