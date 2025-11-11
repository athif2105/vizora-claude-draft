import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, X, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { preprocessCSV } from '@/utils/csvPreprocessor';
import { connectGoogleAnalytics, listGA4Properties, testGA4Connection, fetchGA4FunnelData } from '@/services/ga.service';

interface FunnelItem {
  id: string;
  name: string;
  lastModified: string;
  steps: number;
}

interface DataTabProps {
  hasData: boolean;
  funnels: FunnelItem[];
  onImport: (data: any[], fileName: string) => void;
  importedFileName: string | null;
  hasFunnelB: boolean;
  onImportFunnelB: (data: any[], fileName: string) => void;
  funnelBFileName: string | null;
  onRemoveFunnelA?: () => void;
  onRemoveFunnelB?: () => void;
}

const DataTab: React.FC<DataTabProps> = ({
  hasData,
  funnels,
  onImport,
  importedFileName,
  hasFunnelB,
  onImportFunnelB,
  funnelBFileName,
  onRemoveFunnelA,
  onRemoveFunnelB
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const [isGAConnected, setIsGAConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ga4Properties, setGA4Properties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [funnelEvents, setFunnelEvents] = useState<string[]>(['page_view']);
  const [startDate, setStartDate] = useState('7daysAgo');
  const [endDate, setEndDate] = useState('today');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    checkGAConnection();
  }, []);

  const checkGAConnection = async () => {
    try {
      const result: any = await testGA4Connection();
      setIsGAConnected(result.connected);
      if (result.connected) {
        loadGA4Properties();
      }
    } catch (error) {
      console.error('Error checking GA connection:', error);
    }
  };

  const handleConnectGA = async () => {
    setIsConnecting(true);
    try {
      const result = await connectGoogleAnalytics();
      if (result.success) {
        toast.success('Connected to Google Analytics!');
        setIsGAConnected(true);
        loadGA4Properties();
      } else {
        toast.error('Failed to connect to Google Analytics');
      }
    } catch (error) {
      toast.error('Error connecting to Google Analytics');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadGA4Properties = async () => {
    try {
      const result: any = await listGA4Properties();
      if (result.success) {
        setGA4Properties(result.properties || []);
      }
    } catch (error) {
      console.error('Error loading GA4 properties:', error);
    }
  };

  const handleFetchGA4Data = async () => {
    if (!selectedProperty || funnelEvents.length === 0) {
      toast.error('Select property and add events');
      return;
    }

    setIsFetching(true);
    try {
      const result: any = await fetchGA4FunnelData({
        propertyId: selectedProperty,
        startDate,
        endDate,
        funnelSteps: funnelEvents.map((event, i) => ({
          name: event,
          eventName: event,
          order: i + 1
        }))
      });

      if (result.success && result.data) {
        onImport(result.data, `GA4 Funnel - ${new Date().toLocaleDateString()}`);
        toast.success('GA4 data loaded!');
      } else {
        toast.error('Failed to fetch GA4 data');
      }
    } catch (error) {
      toast.error('Error fetching GA4 data');
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const addEvent = () => {
    setFunnelEvents([...funnelEvents, '']);
  };

  const updateEvent = (index: number, value: string) => {
    const updated = [...funnelEvents];
    updated[index] = value;
    setFunnelEvents(updated);
  };

  const removeEvent = (index: number) => {
    setFunnelEvents(funnelEvents.filter((_, i) => i !== index));
  };

  const handleFileImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileBImport = () => {
    if (fileInputBRef.current) {
      fileInputBRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Single file upload - load into main view
    if (files.length === 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) return;

          const result = preprocessCSV(content);
          const displayName = result.funnelName || file.name.replace('.csv', '');
          toast.success(`Successfully imported ${displayName} (${result.data.length} rows)`);
          onImport(result.data, displayName);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to process ${file.name}: ${errorMessage}`);
          console.error('CSV preprocessing error:', error);
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
      reader.readAsText(file);
      return;
    }

    // Batch upload - save all to Firebase
    const loadingToast = toast.loading(`Processing ${files.length} files...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await readFileAsText(file);
        const result = preprocessCSV(content);
        const funnelName = result.funnelName || file.name.replace('.csv', '');

        // Import using saveFunnel service
        const { saveFunnel } = await import('@/services/funnel.service');
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

    // Dismiss loading toast
    toast.dismiss(loadingToast);

    // Show results
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully saved ${successCount} funnel${successCount > 1 ? 's' : ''}!`);
    } else if (successCount > 0) {
      toast.success(`Saved ${successCount} funnels (${failCount} failed)`);
    } else {
      toast.error('Failed to save funnels');
    }
  };

  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        const result = preprocessCSV(content);
        const displayName = result.funnelName || file.name.replace('.csv', '');
        toast.success(`Successfully imported Funnel B: ${displayName} (${result.data.length} rows)`);
        onImportFunnelB(result.data, displayName);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to process CSV: ${errorMessage}`);
        console.error('CSV preprocessing error:', error);
      } finally {
        if (fileInputBRef.current) {
          fileInputBRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsText(file);
  };

  const filteredFunnels = funnels.filter(funnel => 
    funnel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search funnels..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Funnel A Import */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
          {hasData ? 'Funnel A (Primary)' : 'Import Funnel Data'}
        </label>
        <Button
          onClick={handleFileImport}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Upload className="mr-2" size={16} />
          {hasData ? 'Re-import Funnel A' : 'Import Funnel Data'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          multiple
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          💡 Tip: Select multiple CSV files to batch upload and save them all at once
        </p>
      </div>

      {importedFileName && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="text-blue-600 dark:text-blue-400 mr-2" size={16} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Funnel A</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{importedFileName}</p>
            </div>
            <button
              onClick={onRemoveFunnelA}
              className="ml-2 p-1 hover:bg-blue-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remove Funnel A"
            >
              <X className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Funnel B Import (only show after Funnel A is imported) */}
      {hasData && (
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
            Funnel B (For Comparison)
          </label>
          <Button
            onClick={handleFileBImport}
            variant="outline"
            className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Upload className="mr-2" size={16} />
            {hasFunnelB ? 'Re-import Funnel B' : 'Import Funnel B'}
          </Button>
          <input
            type="file"
            ref={fileInputBRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileBChange}
          />
        </div>
      )}

      {funnelBFileName && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="text-purple-600 dark:text-purple-400 mr-2" size={16} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Funnel B</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{funnelBFileName}</p>
            </div>
            <button
              onClick={onRemoveFunnelB}
              className="ml-2 p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remove Funnel B"
            >
              <X className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Google Analytics Connection */}
      <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
          Google Analytics
        </label>
        {!isGAConnected ? (
          <Button
            onClick={handleConnectGA}
            disabled={isConnecting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2" size={16} />
                Connect Google Analytics
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">✓ Connected to Google Analytics</p>
            </div>
            {ga4Properties.length > 0 && (
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Select GA4 Property:</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Choose property...</option>
                  {ga4Properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>{prop.displayName}</option>
                  ))}
                </select>
                {selectedProperty && (
                  <div className="mt-4 space-y-3">
                    <label className="text-xs text-gray-600 dark:text-gray-400 block">Funnel Steps (Events):</label>
                    {funnelEvents.map((event, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={event}
                          onChange={(e) => updateEvent(index, e.target.value)}
                          placeholder={`Step ${index + 1} event`}
                          className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs"
                        />
                        {funnelEvents.length > 1 && (
                          <button onClick={() => removeEvent(index)} className="text-red-500 hover:text-red-700">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button onClick={addEvent} size="sm" variant="outline" className="w-full text-xs">
                      + Add Step
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Start:</label>
                        <select
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="today">Today</option>
                          <option value="7daysAgo">Last 7 days</option>
                          <option value="30daysAgo">Last 30 days</option>
                          <option value="90daysAgo">Last 90 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">End:</label>
                        <input
                          type="text"
                          value={endDate}
                          readOnly
                          className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleFetchGA4Data}
                      disabled={isFetching}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isFetching ? 'Fetching...' : 'Fetch GA4 Funnel Data'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Funnels</h3>
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <FileText className="mx-auto mb-2" size={24} />
          <p>No funnels found</p>
        </div>
      </div>
    </div>
  );
};

export default DataTab;