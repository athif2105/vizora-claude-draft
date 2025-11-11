import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import VizoraLogo from '@/components/VizoraLogo';
import { Button } from '@/components/ui/button';
import { Share, Save, GitCompareArrows, Sun, Moon, LogOut, User } from 'lucide-react';
import ControlPanel from '@/components/ControlPanel';
import FunnelListSidebar from '@/components/FunnelListSidebar';
import FunnelVisualization from '@/components/FunnelVisualization';
import ComparisonView from '@/components/ComparisonView';
import { toast } from 'sonner';
import { saveFunnel, createShareableLink, SavedFunnel } from '@/services/funnel.service';

interface FunnelStep {
  id: string;
  name: string;
  value: number;
  segment?: string;
  country?: string;
  completionRate: number;
  abandonmentRate: number;
  elapsedTime: number;
  activeUsers: number;
  abandonments: number;
  order: number;
}

const FunnelVisualizationPage = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Funnel A (primary) state
  const [hasData, setHasData] = useState(false);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const [savedFunnelId, setSavedFunnelId] = useState<string | null>(null);

  // Funnel B (comparison) state
  const [hasFunnelB, setHasFunnelB] = useState(false);
  const [funnelBData, setFunnelBData] = useState<FunnelStep[]>([]);
  const [funnelBSteps, setFunnelBSteps] = useState<FunnelStep[]>([]);
  const [funnelBFileName, setFunnelBFileName] = useState<string | null>(null);
  const [funnelBLastUpdated, setFunnelBLastUpdated] = useState<Date | undefined>(undefined);

  // Comparison mode state
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  const [dataSource, setDataSource] = useState<'csv' | 'ga'>('csv');
  const [isGAConnected, setIsGAConnected] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  const transformData = (uploadedData: any[]) => {
    return uploadedData.map((item: any, index: number) => {
      const step: FunnelStep = {
        id: `step-${index + 1}`,
        name: item.name || item.step || `Step ${index + 1}`,
        value: item.value || item.activeUsers || 0,
        completionRate: item.completionRate || 0,
        abandonmentRate: item.abandonmentRate || 0,
        elapsedTime: item.elapsedTime || 0,
        activeUsers: item.activeUsers || item.value || 0,
        abandonments: item.abandonments || 0,
        order: index + 1
      };

      // Add optional fields if they exist
      if (item.segment) step.segment = item.segment;
      if (item.country) step.country = item.country;

      return step;
    });
  };

  const handleImport = (uploadedData: any[], fileName: string) => {
    const transformedData = transformData(uploadedData);

    setHasData(true);
    setFunnelData(transformedData);
    setSteps(transformedData);
    setImportedFileName(fileName);
    setLastUpdated(new Date());
  };

  const handleImportFunnelB = (uploadedData: any[], fileName: string) => {
    const transformedData = transformData(uploadedData);

    setHasFunnelB(true);
    setFunnelBData(transformedData);
    setFunnelBSteps(transformedData);
    setFunnelBFileName(fileName);
    setFunnelBLastUpdated(new Date());
  };

  const handleRemoveFunnelA = () => {
    setHasData(false);
    setFunnelData([]);
    setSteps([]);
    setImportedFileName(null);
    setLastUpdated(undefined);
    setIsComparisonMode(false);
  };

  const handleRemoveFunnelB = () => {
    setHasFunnelB(false);
    setFunnelBData([]);
    setFunnelBSteps([]);
    setFunnelBFileName(null);
    setFunnelBLastUpdated(undefined);
    setIsComparisonMode(false);
  };

  const handleAddStep = () => {
    // In a real app, this would open a modal or form to add a new step
    console.log('Add step functionality would go here');
  };

  const handleDataSourceChange = (source: 'csv' | 'ga') => {
    setDataSource(source);
  };

  const handleSaveFunnel = async () => {
    if (!hasData || funnelData.length === 0) {
      toast.error('No funnel data to save');
      return;
    }

    try {
      const funnelName = importedFileName?.replace('.csv', '') || `Funnel ${new Date().toLocaleDateString()}`;
      const funnelId = await saveFunnel(funnelName, funnelData, importedFileName || undefined);
      setSavedFunnelId(funnelId);
      toast.success(`Funnel saved successfully!`);
      console.log('Saved funnel ID:', funnelId);

      // Refresh the sidebar to show the newly saved funnel
      setSidebarRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving funnel:', error);
      toast.error('Failed to save funnel. Please try again.');
    }
  };

  const handleShareFunnel = async () => {
    if (!hasData || funnelData.length === 0) {
      toast.error('No funnel data to share');
      return;
    }

    try {
      // If funnel not saved yet, save it first
      let funnelId = savedFunnelId;
      if (!funnelId) {
        toast.loading('Saving funnel...');
        const funnelName = importedFileName?.replace('.csv', '') || `Funnel ${new Date().toLocaleDateString()}`;
        funnelId = await saveFunnel(funnelName, funnelData, importedFileName || undefined);
        setSavedFunnelId(funnelId);

        // Wait a moment for Firestore to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.loading('Creating shareable link...');

      // Create shareable link
      const shareLink = await createShareableLink(funnelId);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      toast.dismiss();
      toast.success('Shareable link copied to clipboard!');
    } catch (error: any) {
      console.error('Error sharing funnel:', error);
      toast.dismiss();
      toast.error(`Failed to create shareable link: ${error.message || 'Please try again'}`);
    }
  };

  const handleFunnelSelect = (funnel: SavedFunnel) => {
    // Load the selected funnel
    setHasData(true);
    setFunnelData(funnel.data);
    setSteps(funnel.data);
    setImportedFileName(funnel.fileName || funnel.name);
    setLastUpdated(funnel.createdAt);
    setSavedFunnelId(funnel.id);
    toast.success(`Loaded funnel: ${funnel.name}`);
  };

  // Group data by unique step names for accurate metrics
  const getGroupedSteps = () => {
    const grouped: FunnelStep[] = [];
    const seenSteps = new Set<string>();

    funnelData.forEach((step) => {
      if (!seenSteps.has(step.name)) {
        seenSteps.add(step.name);

        // Find the "Total" row for this step (where country/segment = "Total")
        const totalRow = funnelData.find(
          s => s.name === step.name &&
          (s.country?.toLowerCase() === 'total' || s.segment?.toLowerCase() === 'total')
        );

        grouped.push(totalRow || step);
      }
    });

    return grouped;
  };

  const groupedSteps = getGroupedSteps();

  // Group Funnel B steps
  const getGroupedStepsB = () => {
    const grouped: FunnelStep[] = [];
    const seenSteps = new Set<string>();

    funnelBData.forEach((step) => {
      if (!seenSteps.has(step.name)) {
        seenSteps.add(step.name);

        const totalRow = funnelBData.find(
          s => s.name === step.name &&
          (s.country?.toLowerCase() === 'total' || s.segment?.toLowerCase() === 'total')
        );

        grouped.push(totalRow || step);
      }
    });

    return grouped;
  };

  const groupedStepsB = getGroupedStepsB();

  // Calculate metrics using grouped steps
  const conversionRate = groupedSteps.length > 0
    ? (groupedSteps[groupedSteps.length - 1].activeUsers / groupedSteps[0].activeUsers) * 100
    : 0;

  // Debug: Log conversion rate calculation
  if (groupedSteps.length > 0) {
    console.log('Conversion Rate Calculation:', {
      firstStepUsers: groupedSteps[0].activeUsers,
      lastStepUsers: groupedSteps[groupedSteps.length - 1].activeUsers,
      conversionRate: conversionRate,
      totalSteps: groupedSteps.length,
      groupedSteps: groupedSteps.map(s => ({ name: s.name, activeUsers: s.activeUsers }))
    });
  }

  const totalUsers = groupedSteps.length > 0
    ? groupedSteps.reduce((sum, step) => sum + step.activeUsers, 0)
    : 0;

  const totalSteps = groupedSteps.length;

  // Find biggest drop-off for insights
  let biggestDropOff = { fromStep: 0, toStep: 0, dropPercentage: 0 };
  for (let i = 0; i < groupedSteps.length - 1; i++) {
    const currentUsers = groupedSteps[i].activeUsers;
    const nextUsers = groupedSteps[i + 1].activeUsers;
    const dropPercentage = ((currentUsers - nextUsers) / currentUsers) * 100;

    if (dropPercentage > biggestDropOff.dropPercentage) {
      biggestDropOff = { fromStep: i + 1, toStep: i + 2, dropPercentage };
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center space-x-4">
          <VizoraLogo />
          {isComparisonMode && (
            <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700">
              Comparison Mode
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="text-gray-400 hover:text-yellow-400" size={18} />
            ) : (
              <Moon className="text-gray-600 hover:text-blue-600" size={18} />
            )}
          </button>
          {hasData && hasFunnelB && (
            <Button
              variant={isComparisonMode ? "outline" : "default"}
              size="sm"
              className={`text-xs px-3 py-1 h-8 ${isComparisonMode
                ? "border-blue-500 text-blue-400 hover:bg-blue-900/20"
                : "bg-blue-600 hover:bg-blue-700"}`}
              onClick={() => setIsComparisonMode(!isComparisonMode)}
            >
              <GitCompareArrows className="mr-1.5" size={14} />
              {isComparisonMode ? 'Exit Comparison' : 'Compare Funnels'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1 h-8 border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={handleSaveFunnel}
            disabled={!hasData}
          >
            <Save className="mr-1.5" size={14} />
            Save Funnel
          </Button>
          <Button
            variant="purple"
            size="sm"
            className="text-xs px-3 py-1 h-8"
            onClick={handleShareFunnel}
            disabled={!hasData}
          >
            <Share className="mr-1.5" size={14} />
            Share
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-700">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center ${user?.photoURL ? 'hidden' : ''}`}>
              <User className="text-white" size={16} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2 py-1 h-8 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {!isComparisonMode && (
          <>
            {/* Funnels List Sidebar */}
            <FunnelListSidebar onFunnelSelect={handleFunnelSelect} refreshTrigger={sidebarRefreshTrigger} />

            {/* Control Panel with Tabs */}
            <ControlPanel
              hasData={hasData}
              conversionRate={conversionRate}
              totalUsers={totalUsers}
              totalSteps={totalSteps}
              steps={groupedSteps}
              onImport={handleImport}
              onAddStep={handleAddStep}
              isGAConnected={isGAConnected}
              dataSource={dataSource}
              onDataSourceChange={handleDataSourceChange}
              importedFileName={importedFileName}
              lastUpdated={lastUpdated}
              biggestDropOff={biggestDropOff}
              totalRecords={funnelData.length}
              hasFunnelB={hasFunnelB}
              onImportFunnelB={handleImportFunnelB}
              funnelBFileName={funnelBFileName}
              onRemoveFunnelA={handleRemoveFunnelA}
              onRemoveFunnelB={handleRemoveFunnelB}
            />

            {/* Right Visualization Canvas */}
            <div className="flex-1 p-6 overflow-auto">
              <FunnelVisualization data={funnelData} hasData={hasData} importedFileName={importedFileName || undefined} />
            </div>
          </>
        )}

        {isComparisonMode && (
          /* Comparison View - Full Width */
          <div className="flex-1">
            <ComparisonView
              funnelAData={funnelData}
              funnelBData={funnelBData}
              funnelAName={importedFileName || 'Funnel A'}
              funnelBName={funnelBFileName || 'Funnel B'}
              funnelASteps={groupedSteps}
              funnelBSteps={groupedStepsB}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelVisualizationPage;