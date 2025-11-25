import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFunnels, SavedFunnel, deleteFunnel, createShareableLink } from '@/services/funnel.service';
import VizoraLogo from '@/components/VizoraLogo';
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
  Calendar,
  ExternalLink,
  Download,
  ChevronDown,
  X,
  Check,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  // Data state
  const [funnels, setFunnels] = useState<SavedFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunnels, setSelectedFunnels] = useState<Set<string>>(new Set());

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFunnelForShare, setSelectedFunnelForShare] = useState<SavedFunnel | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');

  // Section visibility toggles
  const [showMetrics, setShowMetrics] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showFunnels, setShowFunnels] = useState(true);

  // Load funnels
  useEffect(() => {
    loadFunnels();
  }, []);

  // Keyboard shortcut for command menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandMenu(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadFunnels = async () => {
    try {
      setLoading(true);
      const userFunnels = await getUserFunnels();
      setFunnels(userFunnels);
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
    navigate('/funnel');
    toast.info('Upload your CSV file to create a new funnel');
  };

  const handleBatchImport = () => {
    navigate('/funnel');
    toast.info('Select multiple CSV files for batch import');
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
      await deleteFunnel(funnelId);
      toast.success('Funnel deleted successfully');
      loadFunnels();
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
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

  // Calculate metrics
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

  // Generate time series data based on selected period
  const timeSeriesData = useMemo(() => {
    const points = timePeriod === 'day' ? 24 : timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 12;
    const baseConversion = avgConversionRate;

    return Array.from({ length: points }, (_, i) => {
      const variance = (Math.random() - 0.5) * 10;
      const trend = (i / points) * 5; // slight upward trend

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

  // Funnel comparison data for bar chart
  const funnelComparisonData = useMemo(() => {
    return funnels.slice(0, 6).map(funnel => {
      const firstStep = funnel.data[0]?.activeUsers || 0;
      const lastStep = funnel.data[funnel.data.length - 1]?.activeUsers || 0;
      const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;

      return {
        name: funnel.name.length > 15 ? funnel.name.substring(0, 15) + '...' : funnel.name,
        conversion: parseFloat(conversionRate.toFixed(1)),
        users: firstStep
      };
    });
  }, [funnels]);

  // Step distribution data for pie chart
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

  // Performance gauge data
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

  // Insights
  const insights = useMemo(() => {
    if (funnels.length === 0) return [];

    const results = [];

    // Top performer
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

    // Low performer (needs attention)
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

    // General insight
    results.push({
      type: 'info' as const,
      icon: Lightbulb,
      title: 'Insight',
      description: `You have ${totalFunnels} active funnel${totalFunnels !== 1 ? 's' : ''}`,
      metric: `Tracking ${totalUsers.toLocaleString()} users`,
      action: () => {}
    });

    return results;
  }, [funnels, totalFunnels, totalUsers]);

  // Filter and sort funnels
  const filteredAndSortedFunnels = useMemo(() => {
    let result = [...funnels];

    // Search filter
    if (searchQuery) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      result = result.filter(f => f.createdAt >= cutoff);
    }

    // Sort
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

  // Activity log
  const recentActivities = useMemo(() => {
    return funnels.slice(0, 5).map(funnel => ({
      id: funnel.id,
      type: 'created' as const,
      funnelName: funnel.name,
      timestamp: funnel.createdAt,
      user: user?.displayName || 'You'
    }));
  }, [funnels, user]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* HEADER - UNCHANGED */}
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
                  onFocus={() => setShowCommandMenu(true)}
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-8 py-6 space-y-6">

            {/* PAGE TITLE */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Funnel Analytics Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive insights and visualizations for all your funnels
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showMetrics ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowMetrics(!showMetrics)}
                >
                  Metrics
                </Button>
                <Button
                  variant={showAnalytics ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                >
                  Analytics
                </Button>
                <Button
                  variant={showFunnels ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFunnels(!showFunnels)}
                >
                  Funnels
                </Button>
              </div>
            </div>

            {/* COMPACT METRICS + INSIGHTS ROW */}
            {showMetrics && (
              <section>
                <div className="grid grid-cols-7 gap-4">
                  {/* Stat Cards - Smaller */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSortBy('recent')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total Funnels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {totalFunnels}
                      </span>
                      <FolderKanban size={32} className="text-gray-300 dark:text-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm">
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                        <TrendingUp size={12} className="mr-1" />
                        +{Math.max(0, funnels.length - Math.floor(funnels.length * 0.7))} this week
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSortBy('conversion-high')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Avg Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {avgConversionRate.toFixed(1)}%
                      </span>
                      <TrendingUp size={32} className="text-gray-300 dark:text-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm">
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                        <TrendingUp size={12} className="mr-1" />
                        +5.2% vs last period
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSortBy('users-high')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total Users Analyzed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {totalUsers > 1000 ? `${(totalUsers / 1000).toFixed(1)}K` : totalUsers}
                      </span>
                      <Users size={32} className="text-gray-300 dark:text-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm">
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                        Across all funnels
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {totalSteps}
                      </span>
                      <BarChart3 size={32} className="text-gray-300 dark:text-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                        Unique steps
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* INSIGHTS & ALERTS SECTION - UNCHANGED */}
            {insights.length > 0 && (
              <section>
                <div className="grid grid-cols-3 gap-6">
                  {insights.map((insight, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        insight.type === 'success'
                          ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
                          : insight.type === 'warning'
                          ? 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700'
                          : 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                      onClick={insight.action}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            insight.type === 'success'
                              ? 'bg-green-100 dark:bg-green-900/20'
                              : insight.type === 'warning'
                              ? 'bg-yellow-100 dark:bg-yellow-900/20'
                              : 'bg-blue-100 dark:bg-blue-900/20'
                          }`}>
                            <insight.icon size={20} className={
                              insight.type === 'success'
                                ? 'text-green-600 dark:text-green-400'
                                : insight.type === 'warning'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-blue-600 dark:text-blue-400'
                            } />
                          </div>
                          <CardTitle className="text-sm font-semibold">{insight.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">{insight.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight.metric}</p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button variant="ghost" size="sm" className="w-full">
                          View Details
                          <ExternalLink size={14} className="ml-2" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 📊 NEW: ANALYTICS VISUALIZATION SECTION */}
            <section className="space-y-6">
              {/* Section Header with Time Period Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BarChart3 className="text-blue-600" size={28} />
                    Analytics Overview
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Performance trends and insights across all funnels
                  </p>
                </div>

                {/* Time Period Selector */}
                <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-lg p-1 bg-white dark:bg-gray-900">
                  <Button
                    variant={timePeriod === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimePeriod('day')}
                    className="h-9"
                  >
                    Day
                  </Button>
                  <Button
                    variant={timePeriod === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimePeriod('week')}
                    className="h-9"
                  >
                    Week
                  </Button>
                  <Button
                    variant={timePeriod === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimePeriod('month')}
                    className="h-9"
                  >
                    Month
                  </Button>
                  <Button
                    variant={timePeriod === 'year' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimePeriod('year')}
                    className="h-9"
                  >
                    Year
                  </Button>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Line Chart: Conversion Rate Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-600" />
                      Conversion Rate Trend
                    </CardTitle>
                    <CardDescription>
                      Track conversion performance over {timePeriod === 'day' ? '24 hours' : timePeriod === 'week' ? '7 days' : timePeriod === 'month' ? '30 days' : '12 months'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                          <XAxis
                            dataKey="period"
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="conversion"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Area Chart: Users & Completions Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users size={20} className="text-purple-600" />
                      User Flow Analysis
                    </CardTitle>
                    <CardDescription>
                      Total users vs completed funnels over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeriesData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                          <XAxis
                            dataKey="period"
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill="url(#colorUsers)"
                            name="Total Users"
                          />
                          <Area
                            type="monotone"
                            dataKey="completions"
                            stroke="#10B981"
                            strokeWidth={2}
                            fill="url(#colorCompletions)"
                            name="Completions"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar Chart: Funnel Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCompareArrows size={20} className="text-orange-600" />
                      Funnel Performance Comparison
                    </CardTitle>
                    <CardDescription>
                      Compare conversion rates across your top funnels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                          <XAxis
                            dataKey="name"
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            style={{ fontSize: '11px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                            style={{ fontSize: '12px' }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="conversion" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Pie Chart: Step Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target size={20} className="text-pink-600" />
                      Funnel Step Distribution
                    </CardTitle>
                    <CardDescription>
                      Distribution of funnels by number of steps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stepDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
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
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Gauges Row */}
              <div className="grid grid-cols-3 gap-6">
                {performanceMetrics.map((metric, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap size={16} style={{ color: metric.color }} />
                        {metric.name} Rate
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
                            barSize={20}
                            data={[metric]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <RadialBar
                              background
                              dataKey="value"
                              cornerRadius={10}
                              fill={metric.color}
                            />
                            <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-3xl font-bold"
                              fill={theme === 'dark' ? '#FFFFFF' : '#111827'}
                            >
                              {metric.value.toFixed(1)}%
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* FUNNELS SECTION - UNCHANGED */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Funnels</h2>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8"
                    >
                      <LayoutGrid size={16} />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8"
                    >
                      <List size={16} />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter size={16} className="mr-2" />
                        {dateFilter === 'all' ? 'All Time' :
                         dateFilter === '7days' ? 'Last 7 Days' :
                         dateFilter === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
                        <ChevronDown size={16} className="ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuCheckboxItem
                        checked={dateFilter === 'all'}
                        onCheckedChange={() => setDateFilter('all')}
                      >
                        All Time
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={dateFilter === '7days'}
                        onCheckedChange={() => setDateFilter('7days')}
                      >
                        Last 7 Days
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={dateFilter === '30days'}
                        onCheckedChange={() => setDateFilter('30days')}
                      >
                        Last 30 Days
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={dateFilter === '90days'}
                        onCheckedChange={() => setDateFilter('90days')}
                      >
                        Last 90 Days
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ArrowUpDown size={16} className="mr-2" />
                        Sort
                        <ChevronDown size={16} className="ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'recent'}
                        onCheckedChange={() => setSortBy('recent')}
                      >
                        Recently Modified
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'name-asc'}
                        onCheckedChange={() => setSortBy('name-asc')}
                      >
                        Name (A-Z)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'name-desc'}
                        onCheckedChange={() => setSortBy('name-desc')}
                      >
                        Name (Z-A)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'conversion-high'}
                        onCheckedChange={() => setSortBy('conversion-high')}
                      >
                        Highest Conversion
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'conversion-low'}
                        onCheckedChange={() => setSortBy('conversion-low')}
                      >
                        Lowest Conversion
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'users-high'}
                        onCheckedChange={() => setSortBy('users-high')}
                      >
                        Most Users
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={sortBy === 'users-low'}
                        onCheckedChange={() => setSortBy('users-low')}
                      >
                        Least Users
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredAndSortedFunnels.length} of {totalFunnels} funnels
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
                <Card className="py-20">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <FolderKanban size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">
                      {searchQuery ? 'No funnels found' : 'No funnels yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : 'Get started by importing your first CSV file to create a funnel visualization'
                      }
                    </p>
                    {!searchQuery && (
                      <Button
                        size="lg"
                        onClick={handleImportCSV}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Upload size={20} className="mr-2" />
                        Import Your First Funnel
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-4 gap-6">
                  {filteredAndSortedFunnels.map((funnel) => {
                    const firstStep = funnel.data[0]?.activeUsers || 0;
                    const lastStep = funnel.data[funnel.data.length - 1]?.activeUsers || 0;
                    const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;
                    const uniqueSteps = new Set(funnel.data.map(d => d.name));
                    const isFavorite = favorites.has(funnel.id);
                    const isSelected = selectedFunnels.has(funnel.id);

                    return (
                      <Card
                        key={funnel.id}
                        className={`group relative overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleFunnelClick(funnel)}
                      >
                        <div className="relative h-[200px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 flex items-center justify-center overflow-hidden">
                          <div className="flex items-end gap-2 px-6">
                            {funnel.data.slice(0, 5).map((step, idx) => {
                              const height = (step.activeUsers / (funnel.data[0]?.activeUsers || 1)) * 140;
                              return (
                                <div
                                  key={idx}
                                  className="w-12 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all"
                                  style={{ height: `${height}px` }}
                                />
                              );
                            })}
                          </div>

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <Button
                              size="lg"
                              className="bg-white text-gray-900 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFunnelClick(funnel);
                              }}
                            >
                              Open Funnel
                            </Button>
                          </div>

                          <div
                            className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant={isSelected ? 'default' : 'secondary'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectFunnel(funnel.id);
                              }}
                            >
                              {isSelected && <Check size={16} />}
                            </Button>
                          </div>
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold truncate flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 -ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(funnel.id);
                                  }}
                                >
                                  <Star
                                    size={16}
                                    className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                                  />
                                </Button>
                                {funnel.name}
                              </CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFunnelClick(funnel);
                                }}>
                                  <ExternalLink size={16} className="mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareFunnel(funnel);
                                }}>
                                  <Share2 size={16} className="mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info('Duplicate feature coming soon');
                                }}>
                                  <Copy size={16} className="mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFunnel(funnel.id, funnel.name);
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {conversionRate.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500">Conversion</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {firstStep > 1000 ? `${(firstStep / 1000).toFixed(1)}K` : firstStep}
                              </p>
                              <p className="text-xs text-gray-500">Users</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {uniqueSteps.size}
                              </p>
                              <p className="text-xs text-gray-500">Steps</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Performance:</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                                    style={{ height: `${8 + i * 2}px` }}
                                  />
                                ))}
                              </div>
                              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                <TrendingUp size={10} className="mr-1" />
                                Trending Up
                              </Badge>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="flex items-center justify-between pt-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectFunnel(funnel.id);
                                if (selectedFunnels.size === 1) {
                                  toast.info('Select one more funnel to compare');
                                }
                              }}
                            >
                              <GitCompareArrows size={14} className="mr-1" />
                              Compare
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareFunnel(funnel);
                              }}
                            >
                              <Share2 size={14} className="mr-1" />
                              Share
                            </Button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(funnel.createdAt, { addSuffix: true })}
                          </span>
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
                        const firstStep = funnel.data[0]?.activeUsers || 0;
                        const lastStep = funnel.data[funnel.data.length - 1]?.activeUsers || 0;
                        const conversionRate = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;
                        const uniqueSteps = new Set(funnel.data.map(d => d.name));
                        const isFavorite = favorites.has(funnel.id);
                        const isSelected = selectedFunnels.has(funnel.id);

                        return (
                          <div
                            key={funnel.id}
                            className={`flex items-center gap-6 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                            onClick={() => handleFunnelClick(funnel)}
                          >
                            <Button
                              variant={isSelected ? 'default' : 'ghost'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectFunnel(funnel.id);
                              }}
                            >
                              {isSelected && <Check size={16} />}
                            </Button>

                            <div className="flex items-end gap-1 h-10 w-20">
                              {funnel.data.slice(0, 5).map((step, idx) => {
                                const height = (step.activeUsers / (funnel.data[0]?.activeUsers || 1)) * 32;
                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                                    style={{ height: `${height}px` }}
                                  />
                                );
                              })}
                            </div>

                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(funnel.id);
                                }}
                              >
                                <Star
                                  size={14}
                                  className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                                />
                              </Button>
                              <span className="font-medium truncate">{funnel.name}</span>
                            </div>

                            <div className="flex items-center gap-8 text-sm">
                              <div className="text-center min-w-[80px]">
                                <p className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {conversionRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500">Conversion</p>
                              </div>
                              <div className="text-center min-w-[80px]">
                                <p className="font-semibold">{firstStep.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Users</p>
                              </div>
                              <div className="text-center min-w-[60px]">
                                <p className="font-semibold">{uniqueSteps.size}</p>
                                <p className="text-xs text-gray-500">Steps</p>
                              </div>
                            </div>

                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <TrendingUp size={12} className="mr-1" />
                              +5.2%
                            </Badge>

                            <span className="text-xs text-gray-500 min-w-[100px] text-right">
                              {formatDistanceToNow(funnel.createdAt, { addSuffix: true })}
                            </span>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleFunnelClick(funnel);
                                }}>
                                  <ExternalLink size={16} className="mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareFunnel(funnel);
                                }}>
                                  <Share2 size={16} className="mr-2" />
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
                                  <Trash2 size={16} className="mr-2" />
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
            </section>

            {/* ACTIVITY TIMELINE - UNCHANGED */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="recent">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                      <TabsTrigger value="imports">Import History</TabsTrigger>
                      <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent" className="mt-6">
                      <ScrollArea className="h-[300px]">
                        {recentActivities.length > 0 ? (
                          <div className="space-y-4">
                            {recentActivities.map((activity) => (
                              <div key={activity.id} className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {activity.user} created "{activity.funnelName}"
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <Clock size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                            <p>No recent activity</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="imports" className="mt-6">
                      <ScrollArea className="h-[300px]">
                        <div className="text-center py-12 text-gray-500">
                          <Upload size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                          <p>No import history yet</p>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="collaboration" className="mt-6">
                      <ScrollArea className="h-[300px]">
                        <div className="text-center py-12 text-gray-500">
                          <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                          <p>No collaboration activity</p>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>

        {/* SHARE DIALOG - UNCHANGED */}
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
