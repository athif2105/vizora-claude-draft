import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { preprocessCSV } from '@/utils/csvPreprocessor';

interface FileUploadProps {
  onFileUpload: (data: any[]) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled = false }) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          // Preprocess CSV content using the new utility
          const result = preprocessCSV(content);
          onFileUpload(result.data);
        } catch (error) {
          console.error('Error preprocessing CSV:', error);
          alert(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  return (
    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-cyan-500 transition-colors bg-gray-800/50">
      <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <div className="space-y-2">
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button 
            variant="default" 
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            disabled={disabled}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={disabled}
          />
        </label>
        <p className="text-xs text-gray-500">
          Upload your funnel data
        </p>
      </div>
    </div>
  );
};