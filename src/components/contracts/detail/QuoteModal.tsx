import { useEffect } from 'react';
import { formatCurrency, calculateTotalVehicleValue } from '@/utils/insurance-calculator';

// Type declaration for html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}

interface Contract {
  contractNumber: string;
  chuXe: string;
  diaChi: string;
  bienSo: string;
  namSanXuat: number;
  ngayDKLD: string;
  soChoNgoi: number;
  nhanHieu: string;
  soLoai: string;
  soKhung: string;
  soMay: string;
  giaTriXe: number;
  loaiHinhKinhDoanh: string;
  giaTriPin?: number;
  loaiDongCo?: string;
  mucKhauTru: number;
  vatChatPackage: {
    tyLePhi: number;
    phiVatChat: number;
    dkbs: string[];
    customRate?: number;
    isCustomRate?: boolean;
  };
  phiTNDS: number;
  phiNNTX: number;
  tongPhi: number;
  taiTucPercentage?: number;
}

interface QuoteModalProps {
  contract: Contract | null;
  isVisible: boolean;
  onClose: () => void;
}

const getLoaiHinhText = (loaiHinh: string): string => {
  const mapping: { [key: string]: string } = {
    'khong_kd_cho_nguoi': 'Xe chở người (xe gia đình)',
    'khong_kd_cho_hang': 'Xe chở hàng (không kinh doanh vận tải)',
    'khong_kd_pickup_van': 'Xe bán tải / Van (không kinh doanh)',
    'kd_cho_hang': 'Xe tải kinh doanh',
    'kd_dau_keo': 'Xe đầu kéo',
    'kd_cho_khach_lien_tinh': 'Xe khách liên tỉnh, nội tỉnh',
    'kd_grab_be': 'Grab, Be, taxi công nghệ (< 9 chỗ)',
    'kd_taxi_tu_lai': 'Taxi, xe cho thuê tự lái',
    'kd_hop_dong_tren_9c': 'Xe khách hợp đồng (> 9 chỗ)',
    'kd_bus': 'Xe bus',
    'kd_pickup_van': 'Xe bán tải / Van (kinh doanh)',
    'kd_chuyen_dung': 'Xe chuyên dùng khác (xe cứu thương...)'
  };
  return mapping[loaiHinh] || loaiHinh;
};

export default function QuoteModal({ contract, isVisible, onClose }: QuoteModalProps) {
  useEffect(() => {
    if (isVisible && contract) {
      // Wait for modal to render, then populate data
      setTimeout(() => {
        const qElements = {
          'q-chuXe': contract.chuXe,
          'q-diaChi': contract.diaChi,
          'q-bienSo': contract.bienSo,
          'q-namSanXuat': contract.namSanXuat.toString(),
          'q-dkld': contract.ngayDKLD,
          'q-soChoNgoi': contract.soChoNgoi.toString(),
          'q-hieuXe': contract.nhanHieu,
          'q-loaiXe': contract.soLoai,
          'q-soKhung': contract.soKhung,
          'q-soMay': contract.soMay,
          'q-giaTriXe': contract.giaTriPin && contract.giaTriPin > 0
            ? `${formatCurrency(contract.giaTriXe)}\n${formatCurrency(contract.giaTriPin)}`
            : formatCurrency(contract.giaTriXe),
          'q-mucDich': getLoaiHinhText(contract.loaiHinhKinhDoanh),
          'q-soTienBH': formatCurrency(calculateTotalVehicleValue(contract.giaTriXe, contract.giaTriPin, contract.loaiDongCo)),
          'q-mucKhauTru': formatCurrency(contract.mucKhauTru) + '/vụ',
          'q-tyLePhi': (contract.vatChatPackage.isCustomRate && contract.vatChatPackage.customRate
            ? contract.vatChatPackage.customRate
            : contract.vatChatPackage.tyLePhi).toFixed(2) + '%',
          'q-dkbs': contract.vatChatPackage.dkbs.join('<br>'),
          'q-phiVatChat': formatCurrency(contract.vatChatPackage.phiVatChat),
          'q-phiTNDS': formatCurrency(contract.phiTNDS),
          'q-phiNNTX': formatCurrency(contract.phiNNTX),
          'q-tongPhi': formatCurrency(contract.tongPhi),
          'q-tinhTrang': contract.taiTucPercentage && contract.taiTucPercentage > 0
            ? contract.taiTucPercentage.toFixed(2) + '%'
            : ''
        };

        // Update DOM elements
        Object.entries(qElements).forEach(([id, value]) => {
          const element = document.getElementById(id);
          if (element) {
            if (id === 'q-dkbs' || id === 'q-giaTriXe') {
              element.innerHTML = value.replace(/\n/g, '<br/>');
            } else {
              element.textContent = value;
            }
          }
        });
      }, 100);
    }
  }, [isVisible, contract]);

  const downloadQuote = async () => {
    if (!contract) return;
    
    const quoteElement = document.getElementById('quote-content-to-download');
    if (!quoteElement) {
      console.error('Quote element not found');
      return;
    }

    try {
      // Load html2canvas from CDN if not available
      if (typeof window.html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
          performDownload();
        };
        script.onerror = () => {
          console.error('Failed to load html2canvas');
        };
        document.head.appendChild(script);
      } else {
        performDownload();
      }
    } catch (error) {
      console.error('Error in download setup:', error);
    }

    function performDownload() {
      try {
        window.html2canvas(quoteElement, { 
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        }).then((canvas) => {
          const link = document.createElement('a');
          link.download = `BaoGia_${contract.contractNumber.replace(/\s/g, '')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }).catch((error) => {
          console.error('html2canvas error:', error);
        });
      } catch (error) {
        console.error('Error in performDownload:', error);
      }
    }
  };

  if (!isVisible || !contract) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div id="quote-content-to-download" className="p-4 bg-white">
          <header className="text-center mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src="/logo.png" 
                alt="BHV Logo" 
                className="w-16 h-16 object-contain"
                style={{ width: '64px', height: '64px' }}
              />
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#dc2626' }}>CÔNG TY BẢO HIỂM HÙNG VƯƠNG THÀNH PHỐ HỒ CHÍ MINH</h2>
                <p className="font-semibold" style={{ color: '#000', fontSize: '24px' }}>BHV TP HCM</p>
              </div>
            </div>
            <h3 className="text-lg font-bold mt-4" style={{ color: '#dc2626' }}>BẢN CHÀO PHÍ BẢO HIỂM XE CƠ GIỚI</h3>
          </header>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: '1px solid black' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Chủ xe:</td>
                <td colSpan={3} id="q-chuXe" style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Địa chỉ:</td>
                <td colSpan={3} id="q-diaChi" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Biển kiểm soát:</td>
                <td id="q-bienSo" style={{ border: '1px solid black', padding: '8px' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Năm sản xuất:</td>
                <td id="q-namSanXuat" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>ĐKLĐ:</td>
                <td id="q-dkld" style={{ border: '1px solid black', padding: '8px' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số chỗ ngồi:</td>
                <td id="q-soChoNgoi" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Hiệu xe:</td>
                <td id="q-hieuXe" style={{ border: '1px solid black', padding: '8px' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Loại xe:</td>
                <td id="q-loaiXe" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số khung:</td>
                <td id="q-soKhung" style={{ border: '1px solid black', padding: '8px' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số máy:</td>
                <td id="q-soMay" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>
                  Giá trị xe:
                  {contract?.giaTriPin && contract.giaTriPin > 0 && <><br/>giá trị pin:</>}
                </td>
                <td id="q-giaTriXe" style={{ border: '1px solid black', padding: '8px' }}>
                  {contract?.giaTriPin && contract.giaTriPin > 0 && <br/>}
                </td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Mục đích sử dụng:</td>
                <td id="q-mucDich" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Số tiền bảo hiểm:</td>
                <td id="q-soTienBH" style={{ border: '1px solid black', padding: '8px' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Mức khấu trừ:</td>
                <td id="q-mucKhauTru" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Tỷ lệ phí:</td>
                <td id="q-tyLePhi" style={{ border: '1px solid black', padding: '8px' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }} rowSpan={4}>ĐIỀU KHOẢN BỔ SUNG ÁP DỤNG:</td>
                <td id="q-dkbs" rowSpan={4} style={{ verticalAlign: 'top', border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Bảo Hiểm Vật Chất Xe:</td>
                <td id="q-phiVatChat" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Bảo Hiểm TNDS:</td>
                <td id="q-phiTNDS" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px' }}>Bảo Hiểm NNTX:</td>
                <td id="q-phiNNTX" style={{ border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#fed7aa', border: '1px solid black', padding: '8px' }}>Tổng phí (đã VAT):</td>
                <td colSpan={3} id="q-tongPhi" style={{ fontWeight: 'bold', backgroundColor: '#fed7aa', border: '1px solid black', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#fef3c7', border: '1px solid black', padding: '8px' }}>Tái Tục/ Cấp Mới</td>
                <td colSpan={3} id="q-tinhTrang" style={{ backgroundColor: '#fef3c7', border: '1px solid black', padding: '8px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600"
          >
            Đóng
          </button>
          <button
            onClick={downloadQuote}
            className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700"
          >
            Tải xuống (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}