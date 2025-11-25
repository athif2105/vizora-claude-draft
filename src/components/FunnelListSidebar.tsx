import React, { useEffect, useState, useRef } from 'react';
import { getUserFunnels, SavedFunnel, deleteFunnel, renameFunnel, saveFunnel } from '@/services/funnel.service';
import { FileText, Loader2, X, Edit2, Check, Plus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { preprocessCSV } from '@/utils/csvPreprocessor';

interface FunnelListSidebarProps {
  onFunnelSelect: (funnel: SavedFunnel) => void;
  refreshTrigger?: number; // Add a trigger prop to force refresh
}

const FunnelListSidebar: React.FC<FunnelListSidebarProps> = ({ onFunnelSelect, refreshTrigger }) => {
  const [funnels, setFunnels] = useState<SavedFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFunnels();
  }, [refreshTrigger]); // Reload when refreshTrigger changes

  const loadFunnels = async () => {
    try {
      setLoading(true);
      const userFunnels = await getUserFunnels();
      setFunnels(userFunnels);
      setError(null);
    } catch (err: any) {
      console.error('Error loading funnels:', err);
      setError(err.message || 'Failed to load funnels');
    } finally {
      setLoading(false);
    }
  };

  const handleFunnelClick = (funnel: SavedFunnel) => {
    onFunnelSelect(funnel);
  };

  const handleDeleteFunnel = async (e: React.MouseEvent, funnelId: string, funnelName: string) => {
    e.stopPropagation(); // Prevent clicking through to select the funnel

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${funnelName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteFunnel(funnelId);
      toast.success('Funnel deleted successfully');

      // Refresh the funnel list
      loadFunnels();
    } catch (error: any) {
      console.error('Error deleting funnel:', error);
      toast.error(`Failed to delete funnel: ${error.message || 'Please try again'}`);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, funnelId: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(funnelId);
    setEditingName(currentName);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (e: React.MouseEvent, funnelId: string) => {
    e.stopPropagation();

    if (!editingName.trim()) {
      toast.error('Funnel name cannot be empty');
      return;
    }

    try {
      await renameFunnel(funnelId, editingName);
      toast.success('Funnel renamed successfully');
      setEditingId(null);
      setEditingName('');

      // Refresh the funnel list
      loadFunnels();
    } catch (error: any) {
      console.error('Error renaming funnel:', error);
      toast.error(`Failed to rename funnel: ${error.message || 'Please try again'}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, funnelId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e as any, funnelId);
    } else if (e.key === 'Escape') {
      handleCancelEdit(e as any);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadingToast = toast.loading(`Processing ${files.length} file${files.length > 1 ? 's' : ''}...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await readFileAsText(file);
        const result = preprocessCSV(content);
        const funnelName = result.funnelName || file.name.replace('.csv', '');

        await saveFunnel(funnelName, result.data, file.name);
        successCount++;
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        failCount++;
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.dismiss(loadingToast);

    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully saved ${successCount} funnel${successCount > 1 ? 's' : ''}!`);
      loadFunnels(); // Refresh the list
    } else if (successCount > 0) {
      toast.success(`Saved ${successCount} funnels (${failCount} failed)`);
      loadFunnels();
    } else {
      toast.error('Failed to save funnels');
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Filter funnels based on search term
  const filteredFunnels = funnels.filter(funnel =>
    funnel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Highlight matching text
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Saved Funnels
          </h3>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Import CSV files"
          >
            <Plus size={14} />
            Import CSV
          </button>
        </div>

        {/* Tip text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Tip: Select multiple CSV files to batch upload
        </p>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        multiple
        onChange={handleFileChange}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar inside list container */}
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search funnels..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-dark">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-sm">
            {error}
          </div>
        ) : funnels.length > 0 ? (
          filteredFunnels.length > 0 ? (
            <div className="space-y-2">
              {filteredFunnels.map((funnel) => (
                <div
                  key={funnel.id}
                  onClick={() => editingId !== funnel.id && handleFunnelClick(funnel)}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer transition-colors border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 group relative"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(funnel));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      {editingId === funnel.id ? (
                        <div className="mb-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, funnel.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleSaveEdit(e, funnel.id)}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded flex-shrink-0"
                              title="Save"
                            >
                              <Check className="text-green-600 dark:text-green-400" size={14} />
                            </button>
                            <button
                              onClick={(e) => handleCancelEdit(e)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                              title="Cancel"
                            >
                              <X className="text-gray-500 dark:text-gray-400" size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate pr-12">
                          {highlightText(funnel.name, searchTerm)}
                        </div>
                      )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {funnel.data.length} records
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDistanceToNow(funnel.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                  {editingId !== funnel.id && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartEdit(e, funnel.id, funnel.name)}
                        className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Rename funnel"
                      >
                        <Edit2 className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFunnel(e, funnel.id, funnel.name)}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="Delete funnel"
                      >
                        <X className="text-gray-500 hover:text-red-600 dark:hover:text-red-400" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8">
              <Search className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={32} />
              <p className="text-sm text-gray-500 dark:text-gray-500">No funnels match "{searchTerm}"</p>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={32} />
            <p className="text-sm text-gray-500 dark:text-gray-500">No saved funnels yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Click "Import CSV" to get started
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default FunnelListSidebar;