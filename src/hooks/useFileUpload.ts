import { useState, useRef } from 'react';

interface ExtractedData {
  chuXe?: string;
  diaChi?: string;
  nhanHieu?: string;
  soLoai?: string;
  soKhung?: string;
  soMay?: string;
  bienSo?: string;
  namSanXuat?: number;
  soChoNgoi?: number;
  ngayDangKyLanDau?: string;
  trongTaiHangHoa?: number;
  kinhDoanhVanTai?: string;
  loaiXe?: string;
}

export default function useFileUpload() {
  const [cavetFile, setCavetFile] = useState<File | null>(null);
  const [dangkiemFile, setDangkiemFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  
  const cavetInputRef = useRef<HTMLInputElement>(null);
  const dangkiemInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = (type: 'cavet' | 'dangkiem', file: File | null) => {
    if (type === 'cavet') {
      setCavetFile(file);
    } else {
      setDangkiemFile(file);
    }
  };

  const extractInformation = async (): Promise<ExtractedData | null> => {
    if (!cavetFile && !dangkiemFile) {
      setError('Vui lòng tải lên ít nhất một ảnh giấy tờ xe');
      return null;
    }

    setExtracting(true);
    setError('');
    
    try {
      let extractedData: ExtractedData = {};
      
      const files = [
        { type: 'cavet', file: cavetFile },
        { type: 'dangkiem', file: dangkiemFile }
      ];

      for (const item of files) {
        if (item.file) {
          const base64Data = await fileToBase64(item.file);
          const response = await fetch('/api/contracts/extract-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageData: base64Data,
              imageType: item.file.type 
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              Object.keys(result.data).forEach(key => {
                if (result.data[key] !== null && result.data[key] !== undefined) {
                  extractedData[key as keyof ExtractedData] = result.data[key];
                }
              });
            }
          } else {
            const errorData = await response.json();
            console.error('Extract error:', errorData);
          }
        }
      }

      if (Object.keys(extractedData).length === 0) {
        throw new Error('Không thể trích xuất thông tin. Vui lòng kiểm tra lại ảnh.');
      }

      return extractedData;
      
    } catch (error: any) {
      console.error('Extract error:', error);
      setError(error.message || 'Đã có lỗi xảy ra khi trích xuất thông tin');
      return null;
    } finally {
      setExtracting(false);
    }
  };

  return {
    cavetFile,
    dangkiemFile,
    extracting,
    error,
    cavetInputRef,
    dangkiemInputRef,
    handleFileUpload,
    extractInformation,
    fileToBase64
  };
}