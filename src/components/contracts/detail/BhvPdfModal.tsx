import { useState, useEffect } from 'react';

interface BhvPdfModalProps {
  isVisible: boolean;
  onClose: () => void;
  pdfBase64: string;
  contractNumber: string;
}

export default function BhvPdfModal({
  isVisible,
  onClose,
  pdfBase64,
  contractNumber
}: BhvPdfModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (isVisible && pdfBase64) {
      // Convert base64 to blob URL for iframe display
      try {
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing PDF:', error);
        setIsLoading(false);
      }
    }

    // Cleanup blob URL when component unmounts or modal closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isVisible, pdfBase64]);

  const downloadPdf = () => {
    if (pdfBase64) {
      try {
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `hop-dong-bhv-${contractNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Có lỗi xảy ra khi tải file PDF');
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              Hợp đồng BHV - {contractNumber}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Hợp đồng đã được tạo thành công trên hệ thống BHV
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadPdf}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Tải về
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Đang tải file PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border border-gray-600"
              title={`Hợp đồng BHV ${contractNumber}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400">Không thể hiển thị file PDF</p>
                <button
                  onClick={downloadPdf}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tải về để xem
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              💡 Tip: Bạn có thể tải về file PDF để lưu trữ hoặc in ấn
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadPdf}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Tải về PDF
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}