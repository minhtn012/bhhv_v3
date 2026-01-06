import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// Try different models if one fails: gemini-2.0-flash, gemini-1.5-flash, gemini-2.5-flash-lite
const MODEL_GEMINI = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// POST /api/health/extract-info - Trích xuất thông tin từ ảnh phiếu yêu cầu BH sức khỏe
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_GEMINI}:generateContent?key=${apiKey}`;

    const prompt = `Bạn là chuyên gia OCR phân tích phiếu yêu cầu bảo hiểm sức khỏe BHV Medical Care của Việt Nam.

QUAN TRỌNG: Đọc KỸ từng mục trên form, đặc biệt chú ý:
- Các ô checkbox có dấu ✓ hoặc X hoặc được đánh dấu
- Chữ viết tay trong các ô trống
- Phân biệt rõ các section khác nhau trên form

Form có 5 mục chính:

## MỤC 1: NGƯỜI YÊU CẦU BẢO HIỂM (thường ở đầu form)
- hoTen: Họ và tên đầy đủ
- ngaySinh: Ngày sinh (dd/mm/yyyy)
- gioiTinh: Giới tính (Nam/Nữ)
- soCCCD: Số CCCD/CMND (12 số)
- ngayCapCCCD: Ngày cấp
- noiCapCCCD: Nơi cấp
- diaChiThuongTru: Địa chỉ thường trú
- soDienThoai: Số điện thoại (10 số)
- email: Email
- ngheNghiep: Nghề nghiệp

## MỤC 2: NGƯỜI ĐƯỢC BẢO HIỂM (có thể trùng với mục 1)
- ngDuocBH_hoTen: Họ và tên
- ngDuocBH_ngaySinh: Ngày sinh (dd/mm/yyyy)
- ngDuocBH_gioiTinh: Giới tính (Nam/Nữ)
- ngDuocBH_soCCCD: Số CCCD/CMND
- ngDuocBH_soDienThoai: Số điện thoại
- ngDuocBH_email: Email
- ngDuocBH_ngheNghiep: Nghề nghiệp
- ngDuocBH_quanHe: Quan hệ với người yêu cầu (Bản thân/Vợ chồng/Cha mẹ/Con/Anh chị em/Khác)
- ngDuocBH_diaChi: Địa chỉ

## MỤC 3: GÓI BẢO HIỂM VÀ QUYỀN LỢI
- goiBaoHiem: Gói BH được chọn (tìm ô được tick: Vàng/Bạch Kim/Kim Cương)
- qlThaiSan: Quyền lợi Thai sản có được tick không? (Có/Không)
- qlNgoaiTru: Quyền lợi Ngoại trú có được tick không? (Có/Không)
- qlTuVongBenhTat: Quyền lợi Tử vong do bệnh tật có được tick không? (Có/Không)
- thoiHanTuNgay: Từ ngày (dd/mm/yyyy)
- thoiHanDenNgay: Đến ngày (dd/mm/yyyy)
- soPhiBH: Số tiền phí BH (chỉ lấy số, không dấu phẩy)
- phuongThucThanhToan: Phương thức thanh toán (Chuyển khoản/Tiền mặt)

## MỤC 4: KHAI BÁO SỨC KHỎE (5 câu hỏi a-e, mỗi câu có ô Có/Không)
CHÚ Ý: Xem kỹ dấu tick ở cột "Có" hay "Không" cho TỪNG câu hỏi
- q1TraLoi: Câu a - Đang nhập viện hoặc chờ nhập viện? (đọc ô Có hoặc Không được tick)
- q1ChiTiet: Nếu Có, đọc chi tiết viết tay bên cạnh
- q2TraLoi: Câu b - Điều trị y tế trong 12 tháng qua? (Có/Không)
- q2ChiTiet: Chi tiết nếu Có
- q3TraLoi: Câu c - Bệnh mãn tính hoặc phẫu thuật trong 3 năm? (Có/Không)
- q3ChiTiet: Chi tiết nếu Có (tên bệnh, thời gian, bệnh viện)
- q4TraLoi: Câu d - Đã yêu cầu bồi thường BH trước đây? (Có/Không)
- q4ChiTiet: Chi tiết nếu Có
- q5TraLoi: Câu e - Bị từ chối BH trước đây? (Có/Không)
- q5ChiTiet: Chi tiết nếu Có

## MỤC 5: NGƯỜI THỤ HƯỞNG (thường ở cuối form, gần phần ký tên)
- ngThuHuong_hoTen: Họ và tên người thụ hưởng
- ngThuHuong_soCCCD: Số CCCD/CMND
- ngThuHuong_quanHe: Quan hệ với người được BH (Bản thân/Vợ chồng/Cha mẹ/Con/Mẹ ruột/Khác)
- ngThuHuong_soDienThoai: Số điện thoại
- ngThuHuong_email: Email
- ngThuHuong_diaChi: Địa chỉ

HƯỚNG DẪN OUTPUT:
- Trả về JSON object duy nhất
- Nếu không tìm thấy thông tin: để null
- Các trường q1TraLoi đến q5TraLoi: chỉ trả về "Có" hoặc "Không"
- soPhiBH: trả về số nguyên (không có dấu phẩy, không có "VND")
- Không thêm markdown, không giải thích`;

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

    console.log('Calling Gemini API for health insurance OCR...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.log('Gemini API response received');

    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      let extractedText = result.candidates[0].content.parts[0].text;
      extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const extractedData = JSON.parse(extractedText);
        return NextResponse.json({
          success: true,
          data: extractedData
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

  } catch (error: unknown) {
    console.error('Extract info error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
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
