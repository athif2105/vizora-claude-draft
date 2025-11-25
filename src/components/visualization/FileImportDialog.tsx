import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Table2,
  Layers,
  Hash,
  Type,
  Calendar,
  ToggleLeft
} from 'lucide-react';
import { importFile, validateDataset, Dataset } from '@/utils/dataImporter';
import { toast } from 'sonner';

interface FileImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (dataset: Dataset) => void;
}

type ImportState = 'idle' | 'dragging' | 'processing' | 'preview' | 'error';

const FileImportDialog: React.FC<FileImportDialogProps> = ({
  open,
  onOpenChange,
  onImport
}) => {
  const [state, setState] = useState<ImportState>('idle');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState('idle');
    setDataset(null);
    setError(null);
    setWarnings([]);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setState('processing');
    setError(null);
    setWarnings([]);

    try {
      const importedDataset = await importFile(file);
      const validation = validateDataset(importedDataset);

      if (!validation.valid) {
        setError(validation.errors.join(' '));
        setState('error');
        return;
      }

      // Store warnings but don't block import
      if (validation.warnings.length > 0) {
        setWarnings(validation.warnings);
      }

      setDataset(importedDataset);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
      setState('error');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('idle');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    } else {
      setState('idle');
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleImportConfirm = useCallback(() => {
    if (dataset) {
      onImport(dataset);
      toast.success(`Imported "${dataset.name}" with ${dataset.rows.toLocaleString()} rows`);
      onOpenChange(false);
      resetState();
    }
  }, [dataset, onImport, onOpenChange, resetState]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetState();
  }, [onOpenChange, resetState]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <Type size={12} className="text-emerald-500" />;
      case 'number':
        return <Hash size={12} className="text-blue-500" />;
      case 'date':
        return <Calendar size={12} className="text-orange-500" />;
      case 'boolean':
        return <ToggleLeft size={12} className="text-purple-500" />;
      default:
        return <Type size={12} className="text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'number':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'date':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'boolean':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
              <Upload size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            Import Data
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to visualize your data
          </DialogDescription>
        </DialogHeader>

        {/* Idle / Dragging state - Drop zone */}
        {(state === 'idle' || state === 'dragging') && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200
              ${state === 'dragging'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className={`
                p-4 rounded-full transition-colors
                ${state === 'dragging'
                  ? 'bg-blue-100 dark:bg-blue-900/40'
                  : 'bg-slate-100 dark:bg-slate-800'
                }
              `}>
                <Upload
                  size={32}
                  className={`transition-colors ${state === 'dragging' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {state === 'dragging' ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  or click to browse
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1.5 py-1">
                  <FileText size={12} />
                  CSV
                </Badge>
                <Badge variant="outline" className="gap-1.5 py-1">
                  <FileSpreadsheet size={12} />
                  Excel
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Processing state */}
        {state === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 size={40} className="text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Processing your file...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Detecting data types and preprocessing
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Import Failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetState}
                className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <X size={16} />
              </Button>
            </div>

            <Button
              onClick={resetState}
              variant="outline"
              className="w-full mt-4 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Preview state */}
        {state === 'preview' && dataset && (
          <div className="space-y-4">
            {/* Success header */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  File parsed successfully
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Ready to import
                </p>
              </div>
            </div>

            {/* Warnings (if any) */}
            {warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                  {warnings.length} column(s) with empty values detected
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  These columns will be imported but contain no data. You can clean them up in the Analysis page.
                </p>
              </div>
            )}

            {/* Dataset info */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {dataset.name}
                  </span>
                </div>
              </div>

              <div className="p-3 grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Table2 size={12} className="text-blue-600 dark:text-blue-400" />
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">Rows</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {dataset.rows.toLocaleString()}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers size={12} className="text-purple-600 dark:text-purple-400" />
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wide font-medium">Columns</p>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {dataset.columns.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Column preview */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Detected Columns
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto">
                {dataset.columns.map((column, index) => (
                  <div
                    key={column.name}
                    className={`
                      flex items-center justify-between p-2.5 px-3
                      ${index < dataset.columns.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1 rounded ${getTypeBadgeColor(column.type)}`}>
                        {getTypeIcon(column.type)}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                        {column.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${getTypeBadgeColor(column.type)}`}
                    >
                      {column.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetState}
                className="flex-1"
              >
                Choose Different File
              </Button>
              <Button
                onClick={handleImportConfirm}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileImportDialog;
