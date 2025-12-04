import { useEffect } from 'react';
import { formatCurrency, calculateTotalVehicleValue, packageLabelsDetail } from '@/utils/insurance-calculator';
import { getVehicleTypeText } from '@/utils/vehicle-type-mapping';

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
  phiTaiTucInfo?: {
    soVu: number;
    phanTramChiPhi: number;
  };
  extraPackages?: Array<{
    code: string;
    name: string;
    value: string;
  }>;
}

interface QuoteModalProps {
  contract: Contract | null;
  isVisible: boolean;
  onClose: () => void;
}


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
          'q-mucDich': getVehicleTypeText(contract.loaiHinhKinhDoanh),
          'q-soTienBH': formatCurrency(calculateTotalVehicleValue(contract.giaTriXe, contract.giaTriPin, contract.loaiDongCo)),
          'q-mucKhauTru': formatCurrency(contract.mucKhauTru) + '/vụ',
          'q-tyLePhi': (contract.vatChatPackage.isCustomRate && contract.vatChatPackage.customRate
            ? contract.vatChatPackage.customRate
            : contract.vatChatPackage.tyLePhi).toFixed(2) + '%',
          'q-dkbs': [
            ...contract.vatChatPackage.dkbs,
            ...(contract.extraPackages || []).map(pkg => {
              // Extract BS code from name (e.g., "- BS007: Description" -> "BS007")
              const match = pkg.name.match(/BS\d{3}/);
              const code = match ? match[0] : pkg.code;
              // Find full description from packageLabelsDetail
              const detail = packageLabelsDetail.find(p => p.code === code);
              return detail ? `- ${code}: ${detail.name}` : pkg.name;
            })
          ].join('<br>'),
          'q-phiVatChat': formatCurrency(contract.vatChatPackage.phiVatChat),
          'q-phiTNDS': formatCurrency(contract.phiTNDS),
          'q-phiNNTX': formatCurrency(contract.phiNNTX),
          'q-tongPhi': formatCurrency(contract.tongPhi),
          'q-tinhTrang': contract.phiTaiTucInfo && (contract.phiTaiTucInfo.soVu > 0 || contract.phiTaiTucInfo.phanTramChiPhi > 0)
            ? `${contract.phiTaiTucInfo.soVu} vụ, ${contract.phiTaiTucInfo.phanTramChiPhi}% chi phí`
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
    } catch (error: unknown) {
      console.error('Error in download setup:', error);
    }

    function performDownload() {
      if (!quoteElement) return;

      try {
        // Clone the element to avoid modifying the original
        const clonedElement = quoteElement.cloneNode(true) as HTMLElement;
        clonedElement.style.width = '1000px'; // Fixed width for desktop layout
        clonedElement.style.position = 'absolute';
        clonedElement.style.left = '-9999px';
        clonedElement.style.top = '0';
        document.body.appendChild(clonedElement);

        window.html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: 1000,
          windowWidth: 1000
        }).then((canvas: HTMLCanvasElement) => {
          // Remove cloned element
          document.body.removeChild(clonedElement);

          const link = document.createElement('a');
          link.download = `BaoGia_${contract!.contractNumber.replace(/\s/g, '')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }).catch((error: unknown) => {
          console.error('html2canvas error:', error);
          // Clean up on error
          if (document.body.contains(clonedElement)) {
            document.body.removeChild(clonedElement);
          }
        });
      } catch (error: unknown) {
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
                style={{ width: '100px', height: '100px' }}
              />
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#dc2626' }}>CÔNG TY BẢO HIỂM HÙNG VƯƠNG THÀNH PHỐ HỒ CHÍ MINH</h2>
                <p className="font-semibold" style={{ color: '#000', fontSize: '24px' }}>BHV TP HCM</p>
                <h3 className="text-lg font-bold mt-4" style={{ color: '#dc2626' }}>BẢN CHÀO PHÍ BẢO HIỂM XE CƠ GIỚI</h3>
              </div>
            </div>
            
          </header>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', border: '1px solid black' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Chủ xe:</td>
                <td colSpan={3} id="q-chuXe" style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Địa chỉ:</td>
                <td colSpan={3} id="q-diaChi" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Biển kiểm soát:</td>
                <td id="q-bienSo" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Năm sản xuất:</td>
                <td id="q-namSanXuat" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>ĐKLĐ:</td>
                <td id="q-dkld" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Số chỗ ngồi:</td>
                <td id="q-soChoNgoi" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Hiệu xe:</td>
                <td id="q-hieuXe" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Loại xe:</td>
                <td id="q-loaiXe" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Số khung:</td>
                <td id="q-soKhung" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Số máy:</td>
                <td id="q-soMay" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>
                  Giá trị xe:
                  {contract?.giaTriPin && contract.giaTriPin > 0 && <><br/>giá trị pin:</>}
                </td>
                <td id="q-giaTriXe" style={{ border: '1px solid black', padding: '8px', color: '#000' }}>
                  {contract?.giaTriPin && contract.giaTriPin > 0 && <br/>}
                </td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Mục đích sử dụng:</td>
                <td id="q-mucDich" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Số tiền bảo hiểm:</td>
                <td id="q-soTienBH" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Mức khấu trừ:</td>
                <td id="q-mucKhauTru" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Tỷ lệ phí:</td>
                <td id="q-tyLePhi" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }} rowSpan={4}>ĐIỀU KHOẢN BỔ SUNG ÁP DỤNG:</td>
                <td id="q-dkbs" rowSpan={4} style={{ verticalAlign: 'top', border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Bảo Hiểm Vật Chất Xe:</td>
                <td id="q-phiVatChat" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Bảo Hiểm TNDS:</td>
                <td id="q-phiTNDS" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', border: '1px solid black', padding: '8px', color: '#000' }}>Bảo Hiểm NNTX:</td>
                <td id="q-phiNNTX" style={{ border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#fed7aa', border: '1px solid black', padding: '8px', color: '#000' }}>Tổng phí (đã VAT):</td>
                <td colSpan={3} id="q-tongPhi" style={{ fontWeight: 'bold', backgroundColor: '#fed7aa', border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#fef3c7', border: '1px solid black', padding: '8px', color: '#000' }}>Tái Tục/ Cấp Mới</td>
                <td colSpan={3} id="q-tinhTrang" style={{ backgroundColor: '#fef3c7', border: '1px solid black', padding: '8px', color: '#000' }}></td>
              </tr>
            </tbody>
          </table>
          <br></br>
          <span style={{ color: '#000' }}>Hiệu lực bản chào: <b>30</b> ngày kể từ ngày chào phí hoặc thời gian kế tiếp hiệu lực cũ tùy thời gian nào đến trước</span>
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