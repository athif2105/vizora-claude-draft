import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFunnelByShareId } from '@/services/funnel.service';
import FunnelVisualization from '@/components/FunnelVisualization';
import VizoraLogo from '@/components/VizoraLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SharedFunnelPage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [funnel, setFunnel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFunnel = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const funnelData = await getFunnelByShareId(shareId);
        if (funnelData) {
          setFunnel(funnelData);
        } else {
          setError('Funnel not found or link has expired');
        }
      } catch (err) {
        console.error('Error loading shared funnel:', err);
        setError('Failed to load funnel');
      } finally {
        setLoading(false);
      }
    };

    loadFunnel();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading funnel...</p>
        </div>
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Funnel Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This shared funnel link may be invalid or expired.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2" size={16} />
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <VizoraLogo />
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{funnel.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Shared on {new Date(funnel.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-2" size={14} />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              📊 Shared Funnel View
            </div>
          </div>
          <FunnelVisualization
            data={funnel.data}
            hasData={true}
            importedFileName={funnel.fileName}
          />
        </div>
      </div>
    </div>
  );
};

export default SharedFunnelPage;
