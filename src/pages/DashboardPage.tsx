import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFunnels, SavedFunnel, deleteFunnel, createShareableLink, saveFunnel } from '@/services/funnel.service';
import { getGA4SyncedFunnels, GA4SyncedFunnel, deleteGA4SyncedFunnel } from '@/services/ga4-sync.service';
import VizoraLogo from '@/components/VizoraLogo';
import ExtensionAuthButton from '@/components/ExtensionAuthButton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  User,
  Upload,
  GitCompareArrows,
  Bell,
  Search,
  Command,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Star,
  Share2,
  Trash2,
  Copy,
  FileText,
  AlertCircle,
  Flame,
  Lightbulb,
  Clock,
  ExternalLink,
  Download,
  ChevronDown,
  Check,
  Activity,
  Target,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'name-asc' | 'name-desc' | 'conversion-high' | 'conversion-low' | 'users-high' | 'users-low';
type DateFilter = 'all' | '7days' | '30days' | '90days';
type TimePeriod = 'day' | 'week' | 'month' | 'year';

const DashboardPage = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [funnels, setFunnels] = useState<SavedFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunnels, setSelectedFunnels] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFunnelForShare, setSelectedFunnelForShare] = useState<SavedFunnel | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showAnalytics, setShowAnalytics] = useState(true);

  useEffect(() => {
    if (user) {
      loadFunnels();
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadFunnels = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load regular funnels
      const userFunnels = await getUserFunnels();

      // Try to load GA4 funnels (don't fail if collection doesn't exist)
      let ga4Funnels: any[] = [];
      try {
        ga4Funnels = await getGA4SyncedFunnels(user.uid);
      } catch (ga4Error) {
        console.log('No GA4 funnels found or error loading GA4 funnels:', ga4Error);
        // Continue without GA4 funnels
      }

      // Convert GA4 funnels to SavedFunnel format
      const convertedGA4Funnels: SavedFunnel[] = ga4Funnels.map(ga4Funnel => ({
        id: ga4Funnel.id,
        userId: ga4Funnel.userId,
        name: `${ga4Funnel.name} (GA4)`, // Add GA4 label
        data: ga4Funnel.steps.map((step: any, idx: number) => ({
          id: `ga4-step-${idx}`,
          name: step.name,
          value: step.activeUsers,
          completionRate: step.completionRate,
          abandonmentRate: step.abandonmentRate,
          elapsedTime: step.elapsedTime,
          activeUsers: step.activeUsers,
          abandonments: step.abandonments,
          order: step.order
        })),
        createdAt: ga4Funnel.syncedAt,
        source: 'ga4' as any // Mark as GA4 source
      }));

      // Combine both arrays
      const allFunnels = [...userFunnels, ...convertedGA4Funnels];
      setFunnels(allFunnels);

      console.log(`Loaded ${userFunnels.length} CSV funnels and ${ga4Funnels.length} GA4 funnels`);
    } catch (error) {
      console.error('Error loading funnels:', error);
      toast.error('Failed to load funnels');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const { preprocessCSV } = await import('@/utils/csvPreprocessor');
        const { data, funnelName } = preprocessCSV(text);

        // Save to Firestore
        const name = funnelName || file.name.replace('.csv', '');
        await saveFunnel(name, data, file.name);

        toast.success(`Funnel "${name}" imported successfully!`);
        loadFunnels();
      } catch (error: any) {
        console.error('Failed to import CSV:', error);
        toast.error(`Failed to import: ${error.message}`);
      }
    };
    input.click();
  };

  const handleBatchImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length === 0) return;

      toast.loading(`Importing ${files.length} files...`);
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          const text = await file.text();
          const { preprocessCSV } = await import('@/utils/csvPreprocessor');
          const { data, funnelName } = preprocessCSV(text);

          const name = funnelName || file.name.replace('.csv', '');
          await saveFunnel(name, data, file.name);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to import ${file.name}:`, error);
          errorCount++;
        }
      }

      toast.dismiss();
      if (errorCount === 0) {
        toast.success(`Successfully imported ${successCount} funnel${successCount > 1 ? 's' : ''}!`);
      } else {
        toast.warning(`Imported ${successCount} funnel${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
      }

      loadFunnels();
    };
    input.click();
  };

  const handleGAImport = () => {
    navigate('/funnel');
    toast.info('Connect Google Analytics to import funnel data');
  };

  const handleFunnelClick = (funnel: SavedFunnel) => {
    navigate('/funnel', { state: { funnel } });
  };

  const handleCompareFunnels = () => {
    if (selectedFunnels.size !== 2) {
      toast.error('Please select exactly 2 funnels to compare');
      return;
    }
    const [id1, id2] = Array.from(selectedFunnels);
    const funnel1 = funnels.find(f => f.id === id1);
    const funnel2 = funnels.find(f => f.id === id2);
    if (funnel1 && funnel2) {
      navigate('/funnel', { state: { funnelA: funnel1, funnelB: funnel2, comparison: true } });
    }
  };

  const handleDeleteFunnel = async (funnelId: string, funnelName: string) => {
    if (!window.confirm(`Delete "${funnelName}"? This cannot be undone.`)) return;

    try {
      // Find the funnel to check its source
      const funnel = funnels.find(f => f.id === funnelId);

      if (funnel && (funnel as any).source === 'ga4') {
        // Delete GA4 funnel
        await deleteGA4SyncedFunnel(funnelId, user!.uid);
      } else {
        // Delete regular funnel
        await deleteFunnel(funnelId);
      }

      toast.success('Funnel deleted successfully');
      loadFunnels();
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedFunnels.size;
    if (!window.confirm(`Delete ${count} selected funnel${count > 1 ? 's' : ''}? This cannot be undone.`)) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete all selected funnels
      for (const funnelId of selectedFunnels) {
        try {
          const funnel = funnels.find(f => f.id === funnelId);

          if (funnel && (funnel as any).source === 'ga4') {
            await deleteGA4SyncedFunnel(funnelId, user!.uid);
          } else {
            await deleteFunnel(funnelId);
          }
          successCount++;
        } catch (error) {
          console.error(`Failed to delete funnel ${funnelId}:`, error);
          errorCount++;
        }
      }

      // Clear selection
      setSelectedFunnels(new Set());

      // Show results
      if (errorCount === 0) {
        toast.success(`Successfully deleted ${successCount} funnel${successCount > 1 ? 's' : ''}`);
      } else {
        toast.warning(`Deleted ${successCount} funnel${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
      }

      // Reload funnels
      loadFunnels();
    } catch (error: any) {
      toast.error(`Failed to delete funnels: ${error.message}`);
    }
  };

  const handleShareFunnel = async (funnel: SavedFunnel) => {
    setSelectedFunnelForShare(funnel);
    setShareDialogOpen(true);
  };

  const handleCopyShareLink = async () => {
    if (!selectedFunnelForShare) return;

    try {
      const shareLink = await createShareableLink(selectedFunnelForShare.id);
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
      setShareDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to create share link: ${error.message}`);
    }
  };

  const toggleFavorite = (funnelId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(funnelId)) {
        next.delete(funnelId);
        toast.success('Removed from favorites');
      } else {
        next.add(funnelId);
        toast.success('Added to favorites');
      }
      return next;
    });
  };

  const toggleSelectFunnel = (funnelId: string) => {
    setSelectedFunnels(prev => {
      const next = new Set(prev);
      if (next.has(funnelId)) {
        next.delete(funnelId);
      } else {
        next.add(funnelId);
      }
      return next;
    });
  };

  const totalFunnels = funnels.length;

  const avgConversionRate = useMemo(() => {
    if (funnels.length === 0) return 0;
    return funnels.reduce((sum, funnel) => {
      const firstStep = funnel.data[0]?.activeUsers || 0;
      const lastStep = funnel.data[funnel.data.length - 1]?.activeUsers || 0;
      const rate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;
      return sum + rate;
    }, 0) / funnels.length;
  }, [funnels]);

  const totalUsers = useMemo(() => {
    return funnels.reduce((sum, funnel) => {
      const firstStep = funnel.data[0]?.activeUsers || 0;
      return sum + firstStep;
    }, 0);
  }, [funnels]);

  const totalSteps = useMemo(() => {
    return funnels.reduce((sum, funnel) => {
      const uniqueSteps = new Set(funnel.data.map(d => d.name));
      return sum + uniqueSteps.size;
    }, 0);
  }, [funnels]);

  const timeSeriesData = useMemo(() => {
    const points = timePeriod === 'day' ? 24 : timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 12;
    const baseConversion = avgConversionRate;

    return Array.from({ length: points }, (_, i) => {
      const variance = (Math.random() - 0.5) * 10;
      const trend = (i / points) * 5;

      return {
        period: timePeriod === 'day' ? `${i}:00` :
                timePeriod === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] :
                timePeriod === 'month' ? `Day ${i + 1}` :
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        conversion: Math.max(0, Math.min(100, baseConversion + variance + trend)),
        users: Math.floor((totalUsers / points) + (Math.random() - 0.5) * (totalUsers / points * 0.3)),
        completions: Math.floor((totalUsers / points) * (baseConversion / 100) + (Math.random() - 0.5) * 50)
      };
    });
  }, [timePeriod, avgConversionRate, totalUsers]);

  const funnelComparisonData = useMemo(() => {
    return funnels.slice(0, 6).map(funnel => {
      const firstStep = funnel.data[0]?.activeUsers || 0;
      const lastStep = funnel.data[funnel.data.length - 1]?.activeUsers || 0;
      const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;

      return {
        name: funnel.name.length > 12 ? funnel.name.substring(0, 12) + '...' : funnel.name,
        conversion: parseFloat(conversionRate.toFixed(1)),
        users: firstStep
      };
    });
  }, [funnels]);

  const stepDistributionData = useMemo(() => {
    const stepCounts: { [key: string]: number } = {};

    funnels.forEach(funnel => {
      const uniqueSteps = new Set(funnel.data.map(d => d.name));
      const stepCount = uniqueSteps.size;
      const key = `${stepCount} Steps`;
      stepCounts[key] = (stepCounts[key] || 0) + 1;
    });

    return Object.entries(stepCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [funnels]);

  const performanceMetrics = useMemo(() => {
    return [
      {
        name: 'Conversion',
        value: avgConversionRate,
        max: 100,
        color: '#3B82F6'
      },
      {
        name: 'Completion',
        value: Math.min(100, (totalSteps / Math.max(1, totalFunnels * 5)) * 100),
        max: 100,
        color: '#10B981'
      },
      {
        name: 'Engagement',
        value: Math.min(100, (totalUsers / Math.max(1, totalFunnels * 1000)) * 100),
        max: 100,
        color: '#8B5CF6'
      }
    ];
  }, [avgConversionRate, totalSteps, totalFunnels, totalUsers]);

  const insights = useMemo(() => {
    if (funnels.length === 0) return [];

    const results = [];

    const topFunnel = [...funnels].sort((a, b) => {
      const rateA = a.data[0]?.activeUsers > 0 ? (a.data[a.data.length - 1]?.activeUsers / a.data[0].activeUsers) * 100 : 0;
      const rateB = b.data[0]?.activeUsers > 0 ? (b.data[b.data.length - 1]?.activeUsers / b.data[0].activeUsers) * 100 : 0;
      return rateB - rateA;
    })[0];

    if (topFunnel) {
      const rate = topFunnel.data[0]?.activeUsers > 0
        ? ((topFunnel.data[topFunnel.data.length - 1]?.activeUsers / topFunnel.data[0].activeUsers) * 100).toFixed(1)
        : '0.0';
      results.push({
        type: 'success' as const,
        icon: Flame,
        title: 'Top Performer',
        description: topFunnel.name,
        metric: `${rate}% conversion`,
        action: () => handleFunnelClick(topFunnel)
      });
    }

    const lowFunnel = [...funnels].sort((a, b) => {
      const rateA = a.data[0]?.activeUsers > 0 ? (a.data[a.data.length - 1]?.activeUsers / a.data[0].activeUsers) * 100 : 0;
      const rateB = b.data[0]?.activeUsers > 0 ? (b.data[b.data.length - 1]?.activeUsers / b.data[0].activeUsers) * 100 : 0;
      return rateA - rateB;
    })[0];

    if (lowFunnel && lowFunnel !== topFunnel) {
      const rate = lowFunnel.data[0]?.activeUsers > 0
        ? ((lowFunnel.data[lowFunnel.data.length - 1]?.activeUsers / lowFunnel.data[0].activeUsers) * 100).toFixed(1)
        : '0.0';
      results.push({
        type: 'warning' as const,
        icon: AlertCircle,
        title: 'Needs Attention',
        description: lowFunnel.name,
        metric: `${rate}% conversion`,
        action: () => handleFunnelClick(lowFunnel)
      });
    }

    results.push({
      type: 'info' as const,
      icon: Lightbulb,
      title: 'Insight',
      description: `${totalFunnels} active funnel${totalFunnels !== 1 ? 's' : ''}`,
      metric: `${totalUsers.toLocaleString()} users tracked`,
      action: () => {}
    });

    return results;
  }, [funnels, totalFunnels, totalUsers]);

  const filteredAndSortedFunnels = useMemo(() => {
    let result = [...funnels];

    if (searchQuery) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      result = result.filter(f => f.createdAt >= cutoff);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'conversion-high':
        case 'conversion-low': {
          const rateA = a.data[0]?.activeUsers > 0 ? (a.data[a.data.length - 1]?.activeUsers / a.data[0].activeUsers) : 0;
          const rateB = b.data[0]?.activeUsers > 0 ? (b.data[b.data.length - 1]?.activeUsers / b.data[0].activeUsers) : 0;
          return sortBy === 'conversion-high' ? rateB - rateA : rateA - rateB;
        }
        case 'users-high':
        case 'users-low': {
          const usersA = a.data[0]?.activeUsers || 0;
          const usersB = b.data[0]?.activeUsers || 0;
          return sortBy === 'users-high' ? usersB - usersA : usersA - usersB;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [funnels, searchQuery, dateFilter, sortBy]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* HEADER */}
        <header className="sticky top-0 z-50 h-[72px] bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between h-full px-8">
            <div className="flex items-center gap-6">
              <VizoraLogo />
            </div>

            <div className="flex-1 max-w-[600px] mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search funnels... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ExtensionAuthButton />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Upload size={16} className="mr-2" />
                    Import CSV
                    <ChevronDown size={16} className="ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleImportCSV}>
                    <FileText size={16} className="mr-2" />
                    Upload CSV File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBatchImport}>
                    <Copy size={16} className="mr-2" />
                    Batch Upload Multiple Files
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleGAImport}>
                    <Activity size={16} className="mr-2" />
                    Import from Google Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/sample_funnel_data.csv';
                    link.download = 'sample_funnel_data.csv';
                    link.click();
                  }}>
                    <Download size={16} className="mr-2" />
                    Download Sample CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleCompareFunnels}
                    disabled={selectedFunnels.size !== 2}
                  >
                    <GitCompareArrows size={16} className="mr-2" />
                    Compare
                    {selectedFunnels.size > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedFunnels.size}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select 2 funnels to compare</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bell size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                    <Avatar>
                      <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User size={16} className="mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Command size={16} className="mr-2" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="max-w-[1800px] mx-auto px-6 py-4">

            {/* PAGE TITLE + CONTROLS */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funnel Analytics Dashboard</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Comprehensive insights and performance metrics for your funnels
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                {showAnalytics ? <Eye size={16} className="mr-2" /> : <EyeOff size={16} className="mr-2" />}
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </Button>
            </div>

            {/* COMPACT METRICS + INSIGHTS ROW */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              {/* Metric Card 1 */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSortBy('recent')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total Funnels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {totalFunnels}
                    </span>
                    <FolderKanban size={20} className="text-gray-300 dark:text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] mt-2">
                    <TrendingUp size={10} className="mr-1" />
                    +{Math.max(0, funnels.length - Math.floor(funnels.length * 0.7))}
                  </Badge>
                </CardContent>
              </Card>

              {/* Metric Card 2 */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSortBy('conversion-high')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Avg Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {avgConversionRate.toFixed(1)}%
                    </span>
                    <TrendingUp size={20} className="text-gray-300 dark:text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] mt-2">
                    <TrendingUp size={10} className="mr-1" />
                    +5.2%
                  </Badge>
                </CardContent>
              </Card>

              {/* Metric Card 3 */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSortBy('users-high')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {totalUsers > 1000 ? `${(totalUsers / 1000).toFixed(1)}K` : totalUsers}
                    </span>
                    <Users size={20} className="text-gray-300 dark:text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] mt-2">
                    All funnels
                  </Badge>
                </CardContent>
              </Card>

              {/* Metric Card 4 */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {totalSteps}
                    </span>
                    <BarChart3 size={20} className="text-gray-300 dark:text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] mt-2">
                    Unique
                  </Badge>
                </CardContent>
              </Card>

              {/* Insight Cards (3 cards) */}
              {insights.slice(0, 3).map((insight, idx) => (
                <Card
                  key={idx}
                  className={`cursor-pointer transition-all hover:shadow-md border ${
                    insight.type === 'success'
                      ? 'border-green-200 dark:border-green-800'
                      : insight.type === 'warning'
                      ? 'border-yellow-200 dark:border-yellow-800'
                      : 'border-blue-200 dark:border-blue-800'
                  }`}
                  onClick={insight.action}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${
                        insight.type === 'success'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : insight.type === 'warning'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20'
                          : 'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        <insight.icon size={12} className={
                          insight.type === 'success'
                            ? 'text-green-600 dark:text-green-400'
                            : insight.type === 'warning'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-blue-600 dark:text-blue-400'
                        } />
                      </div>
                      <CardTitle className="text-[10px] font-semibold uppercase">{insight.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-xs text-gray-900 dark:text-white truncate">{insight.description}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">{insight.metric}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ANALYTICS SECTION */}
            {showAnalytics && (
              <div className="space-y-4 mb-4">
                {/* Time Period Selector */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="text-blue-600" size={20} />
                    Performance Analytics
                  </h2>
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 rounded-lg p-0.5 bg-white dark:bg-gray-900">
                    {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                      <Button
                        key={period}
                        variant={timePeriod === period ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTimePeriod(period)}
                        className="h-7 text-xs capitalize"
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 3x3 Analytics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Line Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-600" />
                        Conversion Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                            <XAxis dataKey="period" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '10px' }} />
                            <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '10px' }} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Line type="monotone" dataKey="conversion" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Area Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users size={14} className="text-purple-600" />
                        User Flow
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeSeriesData}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                            <XAxis dataKey="period" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '10px' }} />
                            <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '10px' }} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Area type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorUsers)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GitCompareArrows size={14} className="text-orange-600" />
                        Funnel Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={funnelComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '9px' }} angle={-45} textAnchor="end" height={60} />
                            <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '10px' }} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Bar dataKey="conversion" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pie Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target size={14} className="text-pink-600" />
                        Step Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stepDistributionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              outerRadius={70}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {stepDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gauge 1 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap size={14} style={{ color: performanceMetrics[0].color }} />
                        Conversion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            barSize={15}
                            data={[performanceMetrics[0]]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <RadialBar background dataKey="value" cornerRadius={10} fill={performanceMetrics[0].color} />
                            <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-2xl font-bold"
                              fill={theme === 'dark' ? '#FFFFFF' : '#111827'}
                            >
                              {performanceMetrics[0].value.toFixed(1)}%
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gauge 2 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap size={14} style={{ color: performanceMetrics[1].color }} />
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            barSize={15}
                            data={[performanceMetrics[1]]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <RadialBar background dataKey="value" cornerRadius={10} fill={performanceMetrics[1].color} />
                            <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-2xl font-bold"
                              fill={theme === 'dark' ? '#FFFFFF' : '#111827'}
                            >
                              {performanceMetrics[1].value.toFixed(1)}%
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gauge 3 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap size={14} style={{ color: performanceMetrics[2].color }} />
                        Engagement Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            barSize={15}
                            data={[performanceMetrics[2]]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <RadialBar background dataKey="value" cornerRadius={10} fill={performanceMetrics[2].color} />
                            <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-2xl font-bold"
                              fill={theme === 'dark' ? '#FFFFFF' : '#111827'}
                            >
                              {performanceMetrics[2].value.toFixed(1)}%
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* FUNNELS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Funnels</h2>
                <div className="flex items-center gap-2">
                  {selectedFunnels.size > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBulkDelete}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete {selectedFunnels.size} selected funnel{selectedFunnels.size > 1 ? 's' : ''}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg p-0.5">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-7"
                    >
                      <LayoutGrid size={14} />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-7"
                    >
                      <List size={14} />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Filter size={14} className="mr-1" />
                        {dateFilter === 'all' ? 'All Time' :
                         dateFilter === '7days' ? '7 Days' :
                         dateFilter === '30days' ? '30 Days' : '90 Days'}
                        <ChevronDown size={14} className="ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {(['all', '7days', '30days', '90days'] as DateFilter[]).map((filter) => (
                        <DropdownMenuCheckboxItem
                          key={filter}
                          checked={dateFilter === filter}
                          onCheckedChange={() => setDateFilter(filter)}
                        >
                          {filter === 'all' ? 'All Time' :
                           filter === '7days' ? 'Last 7 Days' :
                           filter === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <ArrowUpDown size={14} className="mr-1" />
                        Sort
                        <ChevronDown size={14} className="ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {[
                        { value: 'recent', label: 'Recently Modified' },
                        { value: 'name-asc', label: 'Name (A-Z)' },
                        { value: 'name-desc', label: 'Name (Z-A)' },
                        { value: 'conversion-high', label: 'Highest Conversion' },
                        { value: 'conversion-low', label: 'Lowest Conversion' }
                      ].map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option.value}
                          checked={sortBy === option.value}
                          onCheckedChange={() => setSortBy(option.value as SortOption)}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {filteredAndSortedFunnels.length} of {totalFunnels} funnels
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your funnels...</p>
                  </div>
                </div>
              ) : filteredAndSortedFunnels.length === 0 ? (
                <Card className="py-16">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <FolderKanban size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchQuery ? 'No funnels found' : 'No funnels yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-sm">
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : 'Get started by importing your first CSV file to create a funnel visualization'
                      }
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={handleImportCSV}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Upload size={16} className="mr-2" />
                        Import Your First Funnel
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-5 gap-3">
                  {filteredAndSortedFunnels.map((funnel) => {
                    // Use the same grouping logic as Preview tab in FunnelVisualizationPage
                    const getGroupedSteps = () => {
                      const grouped: any[] = [];
                      const seenSteps = new Set<string>();

                      funnel.data.forEach((step: any) => {
                        const stepName = step.name || step.step;
                        if (!seenSteps.has(stepName)) {
                          seenSteps.add(stepName);

                          // Find the "Total" row for this step (where country/segment = "Total")
                          const totalRow = funnel.data.find(
                            (s: any) => (s.name || s.step) === stepName &&
                            (s.country?.toLowerCase() === 'total' || s.segment?.toLowerCase() === 'total')
                          );

                          grouped.push(totalRow || step);
                        }
                      });

                      return grouped;
                    };

                    const dataToUse = getGroupedSteps();

                    // Calculate first and last step users
                    const firstStep = dataToUse[0]?.activeUsers || 0;
                    const lastStep = dataToUse[dataToUse.length - 1]?.activeUsers || 0;
                    const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;

                    const isFavorite = favorites.has(funnel.id);
                    const isSelected = selectedFunnels.has(funnel.id);

                    return (
                      <Card
                        key={funnel.id}
                        className={`group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleFunnelClick(funnel)}
                      >
                        <div className="relative h-[140px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 flex items-center justify-center">
                          <div className="flex items-end gap-1 px-4">
                            {dataToUse.slice(0, 5).map((step, idx) => {
                              const height = (step.activeUsers / (dataToUse[0]?.activeUsers || 1)) * 100;
                              return (
                                <div
                                  key={idx}
                                  className="w-8 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg"
                                  style={{ height: `${height}px` }}
                                />
                              );
                            })}
                          </div>

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <Button
                              size="sm"
                              className="bg-white text-gray-900 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFunnelClick(funnel);
                              }}
                            >
                              Open
                            </Button>
                          </div>

                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant={isSelected ? 'default' : 'secondary'}
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectFunnel(funnel.id);
                              }}
                            >
                              {isSelected && <Check size={12} />}
                            </Button>
                          </div>
                        </div>

                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 -ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(funnel.id);
                                  }}
                                >
                                  <Star
                                    size={12}
                                    className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                                  />
                                </Button>
                                {funnel.name}
                              </CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFunnelClick(funnel);
                                }}>
                                  <ExternalLink size={14} className="mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareFunnel(funnel);
                                }}>
                                  <Share2 size={14} className="mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFunnel(funnel.id, funnel.name);
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {conversionRate.toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-gray-500">Conv</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {firstStep > 1000 ? `${(firstStep / 1000).toFixed(1)}K` : firstStep}
                              </p>
                              <p className="text-[9px] text-gray-500">Users</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {dataToUse.length}
                              </p>
                              <p className="text-[9px] text-gray-500">Steps</p>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="flex items-center justify-between pt-2 text-[10px] text-gray-500">
                          <span>{formatDistanceToNow(funnel.createdAt, { addSuffix: true })}</span>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredAndSortedFunnels.map((funnel) => {
                        // Use the same grouping logic as Preview tab in FunnelVisualizationPage
                        const getGroupedSteps = () => {
                          const grouped: any[] = [];
                          const seenSteps = new Set<string>();

                          funnel.data.forEach((step: any) => {
                            const stepName = step.name || step.step;
                            if (!seenSteps.has(stepName)) {
                              seenSteps.add(stepName);

                              // Find the "Total" row for this step (where country/segment = "Total")
                              const totalRow = funnel.data.find(
                                (s: any) => (s.name || s.step) === stepName &&
                                (s.country?.toLowerCase() === 'total' || s.segment?.toLowerCase() === 'total')
                              );

                              grouped.push(totalRow || step);
                            }
                          });

                          return grouped;
                        };

                        const dataToUse = getGroupedSteps();

                        // Calculate first and last step users
                        const firstStep = dataToUse[0]?.activeUsers || 0;
                        const lastStep = dataToUse[dataToUse.length - 1]?.activeUsers || 0;
                        const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;

                        const isFavorite = favorites.has(funnel.id);
                        const isSelected = selectedFunnels.has(funnel.id);

                        return (
                          <div
                            key={funnel.id}
                            className={`flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                            onClick={() => handleFunnelClick(funnel)}
                          >
                            <Button
                              variant={isSelected ? 'default' : 'ghost'}
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectFunnel(funnel.id);
                              }}
                            >
                              {isSelected && <Check size={12} />}
                            </Button>

                            <div className="flex items-end gap-0.5 h-8 w-16">
                              {dataToUse.slice(0, 5).map((step, idx) => {
                                const height = (step.activeUsers / (dataToUse[0]?.activeUsers || 1)) * 24;
                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                                    style={{ height: `${height}px` }}
                                  />
                                );
                              })}
                            </div>

                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(funnel.id);
                                }}
                              >
                                <Star
                                  size={12}
                                  className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                                />
                              </Button>
                              <span className="font-medium text-sm truncate">{funnel.name}</span>
                            </div>

                            <div className="flex items-center gap-6 text-xs">
                              <div className="text-center min-w-[60px]">
                                <p className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {conversionRate.toFixed(1)}%
                                </p>
                                <p className="text-[10px] text-gray-500">Conv</p>
                              </div>
                              <div className="text-center min-w-[60px]">
                                <p className="font-semibold text-sm">{firstStep.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500">Users</p>
                              </div>
                              <div className="text-center min-w-[50px]">
                                <p className="font-semibold text-sm">{dataToUse.length}</p>
                                <p className="text-[10px] text-gray-500">Steps</p>
                              </div>
                            </div>

                            <span className="text-[10px] text-gray-500 min-w-[80px] text-right">
                              {formatDistanceToNow(funnel.createdAt, { addSuffix: true })}
                            </span>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFunnelClick(funnel);
                                }}>
                                  <ExternalLink size={14} className="mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareFunnel(funnel);
                                }}>
                                  <Share2 size={14} className="mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFunnel(funnel.id, funnel.name);
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>

        {/* SHARE DIALOG */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Funnel</DialogTitle>
              <DialogDescription>
                Create a shareable link for "{selectedFunnelForShare?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anyone with this link will be able to view this funnel visualization.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCopyShareLink} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Share2 size={16} className="mr-2" />
                Copy Share Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default DashboardPage;
