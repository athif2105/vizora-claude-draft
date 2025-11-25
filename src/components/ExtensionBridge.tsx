import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { processSyncedFunnels } from '@/services/ga4-sync.service';

/**
 * ExtensionBridge component
 * Handles communication between Vizora app and Chrome extension
 */
const ExtensionBridge = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Automatically save user to localStorage for extension when user signs in
    if (user) {
      const extensionUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: Date.now()
      };

      localStorage.setItem('vizora_extension_user', JSON.stringify(extensionUserData));
      console.log('ExtensionBridge: User data saved for extension');
    } else {
      // Clear extension user data when user signs out
      localStorage.removeItem('vizora_extension_user');
    }

    // Listen for messages from the Chrome extension
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      // Handle auth success from extension
      if (event.data.type === 'EXTENSION_REQUEST_AUTH' && user) {
        // Send user data to extension
        window.postMessage({
          type: 'VIZORA_AUTH_SUCCESS',
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        }, '*');
      }

      // Handle synced funnels from extension
      if (event.data.type === 'EXTENSION_SYNC_FUNNELS' && user) {
        try {
          toast.loading('Processing synced funnels...');

          const funnels = event.data.funnels;

          // Check if funnels have CSV content (new approach)
          const processedFunnels = await Promise.all(funnels.map(async (funnel: any) => {
            if (funnel.csvContent) {
              // Process CSV content using csvPreprocessor
              const { preprocessCSV } = await import('@/utils/csvPreprocessor');
              const { data, funnelName } = preprocessCSV(funnel.csvContent);

              return {
                name: funnelName || funnel.name,
                steps: data,
                source: funnel.source,
                scrapedAt: funnel.scrapedAt
              };
            }
            return funnel;
          }));

          const result = await processSyncedFunnels(user.uid, processedFunnels);

          toast.dismiss();

          if (result.success) {
            toast.success(`Successfully synced ${result.savedCount} funnel(s) from GA4!`);

            // Notify extension of success
            window.postMessage({
              type: 'VIZORA_SYNC_SUCCESS',
              savedCount: result.savedCount
            }, '*');
          } else {
            toast.error(`Synced ${result.savedCount} funnels, but ${result.errors.length} failed`);

            window.postMessage({
              type: 'VIZORA_SYNC_PARTIAL',
              savedCount: result.savedCount,
              errors: result.errors
            }, '*');
          }
        } catch (error: any) {
          console.error('Error processing synced funnels:', error);
          toast.dismiss();
          toast.error('Failed to process synced funnels');

          window.postMessage({
            type: 'VIZORA_SYNC_ERROR',
            error: error.message
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify extension that Vizora is ready
    window.postMessage({ type: 'VIZORA_READY' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [user]);

  // This component doesn't render anything
  return null;
};

export default ExtensionBridge;
