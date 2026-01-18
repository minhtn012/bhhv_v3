'use client';

import { useState, useCallback, useRef } from 'react';
import { TravelInsuredPerson } from '@/types/travel';
import { mapOCRToTravelForm, TravelOCROutput } from '@/utils/ocr-travel-mapper';

interface OCRResult {
  index: number;
  success: boolean;
  data?: Partial<TravelOCROutput>;
  error?: string;
}

interface ExtractedPerson {
  imageUrl: string;
  data: Partial<TravelInsuredPerson>;
}

interface Props {
  onImport: (persons: ExtractedPerson[]) => void;
  onClose: () => void;
}

const MAX_IMAGES = 50;

export default function TravelOCRUpload({ onImport, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'processing'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Use ref to avoid stale closure in async handleExtract
  const fileUrlsRef = useRef<string[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > MAX_IMAGES) {
      setError(`Tối đa ${MAX_IMAGES} ảnh mỗi lần upload`);
      return;
    }
    setFiles(selectedFiles);
    const urls = selectedFiles.map(f => URL.createObjectURL(f));
    setFileUrls(urls);
    fileUrlsRef.current = urls;
    setError('');
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ảnh');
      return;
    }

    setStep('processing');
    setProgress(0);
    setError('');

    try {
      const images = await Promise.all(
        files.map(async (file) => ({
          data: await fileToBase64(file),
          mimeType: file.type || 'image/jpeg',
        }))
      );

      setProgress(30);

      const response = await fetch('/api/travel/extract-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });

      setProgress(80);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Lỗi khi trích xuất');
      }

      // Map results to ExtractedPerson with imageUrl
      const persons: ExtractedPerson[] = (result.results as OCRResult[])
        .filter((r) => r.success && r.data)
        .map((r) => {
          const mapped = mapOCRToTravelForm(r.data!);
          const dob = mapped.insuredPerson.dob || '';
          return {
            imageUrl: fileUrlsRef.current[r.index] || '',
            data: {
              name: mapped.insuredPerson.name || '',
              dob,
              age: calculateAge(dob),
              gender: mapped.insuredPerson.gender || 'M',
              country: mapped.insuredPerson.country || 'VIETNAM',
              personalId: mapped.insuredPerson.personalId || '',
              relationship: 'RELATION_O' as const,
              pct: 100,
            },
          };
        });

      if (persons.length === 0) {
        throw new Error('Không trích xuất được thông tin từ ảnh nào');
      }

      setProgress(100);

      // Import directly without preview
      onImport(persons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setStep('upload');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            OCR Trích xuất từ CCCD/Passport
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 mb-4">
              {error}
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="ocr-file-input"
                />
                <label
                  htmlFor="ocr-file-input"
                  className="cursor-pointer block"
                >
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Chọn ảnh CCCD/Passport</p>
                  <p className="text-slate-400 text-sm">Tối đa {MAX_IMAGES} ảnh, mỗi ảnh = 1 người</p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-white font-medium mb-2">Đã chọn {files.length} ảnh:</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {fileUrls.map((url, i) => (
                      <div key={i} className="aspect-square bg-slate-600 rounded-lg overflow-hidden">
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-300 text-sm">
                Sau khi trích xuất, thông tin sẽ được thêm vào danh sách. Bạn có thể chỉnh sửa trực tiếp trong form.
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Đang trích xuất thông tin...</p>
              <div className="w-64 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-slate-400 text-sm mt-2">{progress}%</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white"
          >
            Hủy
          </button>
          {step === 'upload' && (
            <button
              onClick={handleExtract}
              disabled={files.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-xl disabled:cursor-not-allowed"
            >
              Trích xuất ({files.length} ảnh)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
