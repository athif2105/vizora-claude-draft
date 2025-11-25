import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import VizoraLogo from '@/components/VizoraLogo';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon,
  LogOut,
  User,
  Home,
  ChevronLeft,
  Database,
  BarChart3,
  Settings2,
  Layers,
  Table2,
  Filter,
  SlidersHorizontal,
  Upload,
  FileSpreadsheet,
  Pencil,
  Plus,
  X,
  Save,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

// Visualization components
import DataOverviewPanel from '@/components/visualization/DataOverviewPanel';
import ChartSelectionGrid from '@/components/visualization/ChartSelectionGrid';
import VisualizationCanvas from '@/components/visualization/VisualizationCanvas';
import ChartConfigPanel from '@/components/visualization/ChartConfigPanel';
import FileImportDialog from '@/components/visualization/FileImportDialog';
import { Dataset } from '@/utils/dataImporter';

// Types for the visualization page
export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'histogram'
  | 'boxplot'
  | 'funnel'
  | 'heatmap'
  | 'treemap';

export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: (string | number | boolean)[];
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    unique?: number;
  };
}

export interface ChartConfig {
  xAxis: string | null;
  yAxis: string | null;
  colorDimension: string | null;
  title: string;
  showLegend: boolean;
  showLabels: boolean;
  sortOrder: 'none' | 'asc' | 'desc';
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}


// Tab interface
interface VisualizationTab {
  id: string;
  name: string;
  dataset: Dataset | null;
  chartType: ChartType;
  chartConfig: ChartConfig;
}

const defaultChartConfig: ChartConfig = {
  xAxis: null,
  yAxis: null,
  colorDimension: null,
  title: '',
  showLegend: true,
  showLabels: true,
  sortOrder: 'none',
  aggregation: 'sum'
};

const createNewTab = (id: string, name: string): VisualizationTab => ({
  id,
  name,
  dataset: null,
  chartType: 'bar',
  chartConfig: { ...defaultChartConfig }
});

// LocalStorage keys
const STORAGE_KEY_TABS = 'vizora_visualization_tabs';
const STORAGE_KEY_ACTIVE_TAB = 'vizora_active_tab';
const STORAGE_KEY_TAB_COUNTER = 'vizora_tab_counter';
const STORAGE_KEY_DATASET_PREFIX = 'vizora_dataset_';

// Maximum rows to store per dataset (to avoid quota issues)
const MAX_STORED_ROWS = 5000;

// Prepare tabs for storage (separate large datasets)
const prepareTabsForStorage = (tabs: VisualizationTab[]): { tabConfigs: any[], datasetIds: string[] } => {
  const datasetIds: string[] = [];
  const tabConfigs = tabs.map(tab => {
    if (tab.dataset && tab.dataset.data && tab.dataset.data.length > 0) {
      // Store dataset separately with limited rows
      const datasetId = `${tab.id}_dataset`;
      datasetIds.push(datasetId);

      // Limit data rows to avoid quota
      const limitedData = tab.dataset.data.slice(0, MAX_STORED_ROWS);
      const limitedDataset = {
        ...tab.dataset,
        data: limitedData,
        rows: limitedData.length,
        _originalRows: tab.dataset.data.length // Track original size
      };

      try {
        localStorage.setItem(STORAGE_KEY_DATASET_PREFIX + datasetId, JSON.stringify(limitedDataset));
      } catch (e) {
        console.warn(`Dataset ${datasetId} too large, storing metadata only`);
        // Store only metadata if dataset is still too large
        localStorage.setItem(STORAGE_KEY_DATASET_PREFIX + datasetId, JSON.stringify({
          name: tab.dataset.name,
          columns: tab.dataset.columns,
          rows: 0,
          data: [],
          _tooLarge: true,
          _originalRows: tab.dataset.data.length
        }));
      }

      return {
        ...tab,
        dataset: null, // Don't include dataset in main config
        _hasDataset: true,
        _datasetId: datasetId
      };
    }
    return { ...tab, _hasDataset: false };
  });

  return { tabConfigs, datasetIds };
};

// Load tabs from localStorage
const loadTabsFromStorage = (): { tabs: VisualizationTab[], activeTabId: string, tabCounter: number } => {
  try {
    const savedTabs = localStorage.getItem(STORAGE_KEY_TABS);
    const savedActiveTab = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
    const savedCounter = localStorage.getItem(STORAGE_KEY_TAB_COUNTER);

    if (savedTabs) {
      const parsedTabConfigs = JSON.parse(savedTabs) as any[];
      if (parsedTabConfigs.length > 0) {
        // Reconstruct tabs with their datasets
        const tabs = parsedTabConfigs.map(config => {
          if (config._hasDataset && config._datasetId) {
            const datasetJson = localStorage.getItem(STORAGE_KEY_DATASET_PREFIX + config._datasetId);
            if (datasetJson) {
              const dataset = JSON.parse(datasetJson);
              return {
                id: config.id,
                name: config.name,
                chartType: config.chartType,
                chartConfig: config.chartConfig,
                dataset: dataset._tooLarge ? null : dataset
              } as VisualizationTab;
            }
          }
          return {
            id: config.id,
            name: config.name,
            chartType: config.chartType,
            chartConfig: config.chartConfig,
            dataset: null
          } as VisualizationTab;
        });

        return {
          tabs,
          activeTabId: savedActiveTab || tabs[0].id,
          tabCounter: savedCounter ? parseInt(savedCounter) : tabs.length + 1
        };
      }
    }
  } catch (error) {
    console.error('Failed to load tabs from storage:', error);
  }

  // Return default if nothing saved
  return {
    tabs: [createNewTab('tab-1', 'Chart 1')],
    activeTabId: 'tab-1',
    tabCounter: 2
  };
};

// Clean up old dataset storage
const cleanupOldDatasets = (currentDatasetIds: string[]) => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_DATASET_PREFIX)) {
      const datasetId = key.replace(STORAGE_KEY_DATASET_PREFIX, '');
      if (!currentDatasetIds.includes(datasetId)) {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

const VisualizationPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { dataset: sharedDataset, setDataset: setSharedDataset } = useData();
  const navigate = useNavigate();

  // Initialize tab state from localStorage
  const [tabs, setTabs] = useState<VisualizationTab[]>(() => loadTabsFromStorage().tabs);
  const [activeTabId, setActiveTabId] = useState(() => loadTabsFromStorage().activeTabId);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabCounter, setTabCounter] = useState(() => loadTabsFromStorage().tabCounter);

  // State for save indicator
  const [isSaved, setIsSaved] = useState(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Mark as unsaved when tabs change
  useEffect(() => {
    setIsSaved(false);
  }, [tabs]);

  // Manual save function
  const handleManualSave = useCallback(() => {
    try {
      const { tabConfigs, datasetIds } = prepareTabsForStorage(tabs);
      localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabConfigs));
      localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTabId);
      localStorage.setItem(STORAGE_KEY_TAB_COUNTER, String(tabCounter));
      cleanupOldDatasets(datasetIds);
      setIsSaved(true);
      setShowSaveSuccess(true);
      toast.success('Visualizations saved!');
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save tabs to storage:', error);
      toast.error('Failed to save - data may be too large');
    }
  }, [tabs, activeTabId, tabCounter]);

  // Auto-save tabs to localStorage periodically (every 30 seconds) and on unmount
  useEffect(() => {
    const autoSave = () => {
      try {
        const { tabConfigs, datasetIds } = prepareTabsForStorage(tabs);
        localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabConfigs));
        localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTabId);
        localStorage.setItem(STORAGE_KEY_TAB_COUNTER, String(tabCounter));
        cleanupOldDatasets(datasetIds);
        setIsSaved(true);
      } catch (error) {
        console.error('Failed to auto-save tabs:', error);
      }
    };

    // Auto-save every 30 seconds
    const interval = setInterval(autoSave, 30000);

    // Save on unmount
    return () => {
      clearInterval(interval);
      autoSave();
    };
  }, [tabs, activeTabId, tabCounter]);

  // Get current tab
  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Panel state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Current tab's data
  const currentDataset = currentTab?.dataset || null;
  const selectedChartType = currentTab?.chartType || 'bar';
  const chartConfig = currentTab?.chartConfig || defaultChartConfig;

  // Update tab's chart type
  const setSelectedChartType = useCallback((type: ChartType) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, chartType: type } : tab
    ));
  }, [activeTabId]);

  // Update tab's chart config
  const setChartConfig = useCallback((configOrUpdater: ChartConfig | ((prev: ChartConfig) => ChartConfig)) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const newConfig = typeof configOrUpdater === 'function'
        ? configOrUpdater(tab.chartConfig)
        : configOrUpdater;
      return { ...tab, chartConfig: newConfig };
    }));
  }, [activeTabId]);

  // Auto-configure chart when dataset changes
  useEffect(() => {
    if (currentDataset) {
      const stringCol = currentDataset.columns.find(c => c.type === 'string');
      const numberCol = currentDataset.columns.find(c => c.type === 'number');

      setChartConfig(prev => ({
        ...prev,
        xAxis: stringCol?.name || null,
        yAxis: numberCol?.name || null,
        title: `${numberCol?.name || 'Data'} by ${stringCol?.name || 'Category'}`,
      }));
    }
  }, [currentDataset, setChartConfig]);

  // Handle imported dataset - save to current tab and shared context
  const handleDataImport = useCallback((dataset: Dataset) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, dataset } : tab
    ));
    setSharedDataset(dataset);
  }, [activeTabId, setSharedDataset]);

  // Tab management functions
  const addNewTab = useCallback(() => {
    const newTab = createNewTab(`tab-${tabCounter}`, `Chart ${tabCounter}`);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setTabCounter(prev => prev + 1);
    toast.success('New tab created');
  }, [tabCounter]);

  const closeTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      toast.error('Cannot close the last tab');
      return;
    }
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    setTabs(prev => prev.filter(t => t.id !== tabId));

    // If closing active tab, switch to adjacent tab
    if (activeTabId === tabId) {
      const newActiveIndex = tabIndex === 0 ? 0 : tabIndex - 1;
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      setActiveTabId(remainingTabs[newActiveIndex]?.id || remainingTabs[0]?.id);
    }
  }, [tabs, activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.dataset) {
      setSharedDataset(tab.dataset);
    }
  }, [tabs, setSharedDataset]);

  const renameTab = useCallback((tabId: string, newName: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, name: newName.trim() || tab.name } : tab
    ));
    setEditingTabId(null);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleChartTypeSelect = (type: ChartType) => {
    setSelectedChartType(type);
  };

  const handleConfigChange = (newConfig: Partial<ChartConfig>) => {
    setChartConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-gray-100">
      {/* ===== TOP NAVBAR ===== */}
      <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm z-50">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft size={18} className="mr-1" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <VizoraLogo />
        </div>

        {/* Center section - Page title and Import button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full border border-blue-200/50 dark:border-blue-800/50">
            <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Visualization Studio</span>
          </div>

          {/* Import Data Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setImportDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
              >
                <Upload size={16} />
                Import Data
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import CSV or Excel file</p>
            </TooltipContent>
          </Tooltip>

          {/* Show current dataset indicator and Edit Data button */}
          {currentDataset && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 max-w-32 truncate">
                  {currentDataset.name}
                </span>
              </div>

              {/* Edit Data Button - Navigate to Analysis page */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigate('/analysis')}
                    variant="outline"
                    className="gap-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    <Pencil size={16} />
                    Edit Data
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clean, transform, and analyze your data</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleManualSave}
                className={`relative text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${!isSaved ? 'text-amber-500 dark:text-amber-400' : ''}`}
              >
                {showSaveSuccess ? (
                  <Check size={18} className="text-emerald-500" />
                ) : (
                  <Save size={18} />
                )}
                {!isSaved && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSaved ? 'All changes saved' : 'Save visualizations (unsaved changes)'}</p>
            </TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* User profile */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <User className="text-white" size={16} />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== LEFT SIDEBAR - Data Overview ===== */}
        <aside
          className={`${leftPanelCollapsed ? 'w-14' : 'w-72'} transition-all duration-300 ease-in-out flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50`}
        >
          {/* Collapse toggle */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-800/50">
            {!leftPanelCollapsed && (
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Overview</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <ChevronLeft size={16} className={`transition-transform ${leftPanelCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            <DataOverviewPanel
              collapsed={leftPanelCollapsed}
              dataset={currentDataset}
            />
          </div>
        </aside>

        {/* ===== CENTER - Visualization Canvas ===== */}
        <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {currentDataset ? (
            <>
              {/* Chart Selection Grid */}
              <ChartSelectionGrid
                selectedType={selectedChartType}
                onSelectType={handleChartTypeSelect}
              />

              {/* Main Visualization Canvas */}
              <div className="flex-1 min-h-0">
                <VisualizationCanvas
                  chartType={selectedChartType}
                  config={chartConfig}
                  dataset={currentDataset}
                />
              </div>

              {/* Tab Bar */}
              <div className="flex items-center gap-1 px-2 py-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`
                      group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all
                      ${activeTabId === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {editingTabId === tab.id ? (
                      <Input
                        autoFocus
                        defaultValue={tab.name}
                        className="h-5 w-24 text-xs px-1 bg-white dark:bg-slate-900"
                        onBlur={(e) => renameTab(tab.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameTab(tab.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingTabId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="text-xs font-medium truncate max-w-[100px]"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingTabId(tab.id);
                        }}
                      >
                        {tab.name}
                      </span>
                    )}
                    {!tab.dataset && (
                      <span className={`text-[9px] px-1 rounded ${activeTabId === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        empty
                      </span>
                    )}
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className={`
                          opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded
                          ${activeTabId === tab.id ? 'hover:bg-white/20' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}
                        `}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add New Tab Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={addNewTab}
                      className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Plus size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Tab (empty state)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : (
            /* Empty State - No data imported yet */
            <>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center mb-6">
                    <Upload size={40} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                    No Data Loaded
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Import a CSV or Excel file to start creating beautiful visualizations of your data.
                  </p>
                  <Button
                    onClick={() => setImportDialogOpen(true)}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                  >
                    <Upload size={18} />
                    Import Your Data
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                    Supports CSV, XLSX, and XLS files
                  </p>
                </div>
              </div>

              {/* Tab Bar for empty state */}
              <div className="flex items-center gap-1 px-2 py-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`
                      group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all
                      ${activeTabId === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {editingTabId === tab.id ? (
                      <Input
                        autoFocus
                        defaultValue={tab.name}
                        className="h-5 w-24 text-xs px-1 bg-white dark:bg-slate-900"
                        onBlur={(e) => renameTab(tab.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameTab(tab.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingTabId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="text-xs font-medium truncate max-w-[100px]"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingTabId(tab.id);
                        }}
                      >
                        {tab.name}
                      </span>
                    )}
                    {!tab.dataset && (
                      <span className={`text-[9px] px-1 rounded ${activeTabId === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        empty
                      </span>
                    )}
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className={`
                          opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded
                          ${activeTabId === tab.id ? 'hover:bg-white/20' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}
                        `}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add New Tab Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={addNewTab}
                      className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Plus size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Tab (empty state)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </main>

        {/* ===== RIGHT SIDEBAR - Chart Configuration ===== */}
        <aside
          className={`${rightPanelCollapsed ? 'w-14' : 'w-80'} transition-all duration-300 ease-in-out flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-800/50`}
        >
          {/* Collapse toggle */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <ChevronLeft size={16} className={`transition-transform ${rightPanelCollapsed ? '' : 'rotate-180'}`} />
            </Button>
            {!rightPanelCollapsed && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Configuration</span>
                <SlidersHorizontal size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
            )}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {currentDataset ? (
              <ChartConfigPanel
                collapsed={rightPanelCollapsed}
                config={chartConfig}
                columns={currentDataset.columns}
                data={currentDataset.data}
                chartType={selectedChartType}
                onConfigChange={handleConfigChange}
              />
            ) : (
              !rightPanelCollapsed && (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm">Import data to configure charts</p>
                </div>
              )
            )}
          </div>
        </aside>
      </div>

      {/* File Import Dialog */}
      <FileImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleDataImport}
      />
    </div>
  );
};

export default VisualizationPage;
