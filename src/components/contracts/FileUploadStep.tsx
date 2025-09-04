import useFileUpload from '@/hooks/useFileUpload';

interface FileUploadStepProps {
  onExtractSuccess: (data: any) => void;
  error?: string;
}

export default function FileUploadStep({ onExtractSuccess, error }: FileUploadStepProps) {
  const {
    cavetFile,
    dangkiemFile,
    extracting,
    error: uploadError,
    cavetInputRef,
    dangkiemInputRef,
    handleFileUpload,
    extractInformation
  } = useFileUpload();

  const handleExtract = async () => {
    const extractedData = await extractInformation();
    if (extractedData) {
      onExtractSuccess(extractedData);
    }
  };

  const displayError = error || uploadError;

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Bước 1: Tải lên Giấy tờ Xe</h2>
      
      {displayError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-6">
          {displayError}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cavet Upload */}
        <div>
          <label className="block text-white font-medium mb-2">Giấy đăng ký (Cà vẹt)</label>
          <div 
            onClick={() => cavetInputRef.current?.click()}
            className="border-2 border-dashed border-gray-400 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input 
              ref={cavetInputRef}
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={(e) => handleFileUpload('cavet', e.target.files?.[0] || null)}
            />
            {cavetFile ? (
              <div>
                <img 
                  src={URL.createObjectURL(cavetFile)} 
                  alt="Cà vẹt" 
                  className="h-32 mx-auto rounded-md mb-2 object-contain"
                />
                <p className="text-white text-sm">{cavetFile.name}</p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-300">Nhấn để chọn ảnh cà vẹt</p>
              </div>
            )}
          </div>
        </div>

        {/* Dang Kiem Upload */}
        <div>
          <label className="block text-white font-medium mb-2">Giấy đăng kiểm</label>
          <div 
            onClick={() => dangkiemInputRef.current?.click()}
            className="border-2 border-dashed border-gray-400 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input 
              ref={dangkiemInputRef}
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={(e) => handleFileUpload('dangkiem', e.target.files?.[0] || null)}
            />
            {dangkiemFile ? (
              <div>
                <img 
                  src={URL.createObjectURL(dangkiemFile)} 
                  alt="Đăng kiểm" 
                  className="h-32 mx-auto rounded-md mb-2 object-contain"
                />
                <p className="text-white text-sm">{dangkiemFile.name}</p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-300">Nhấn để chọn ảnh đăng kiểm</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleExtract}
          disabled={extracting || (!cavetFile && !dangkiemFile)}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-8 rounded-xl transition-colors"
        >
          {extracting ? 'Đang trích xuất...' : 'Trích xuất thông tin'}
        </button>
      </div>
    </div>
  );
}