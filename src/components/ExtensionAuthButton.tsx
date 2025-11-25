import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Puzzle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Button to authenticate the Chrome Extension
 * This sends user data to the extension for authentication
 */
const ExtensionAuthButton = () => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectExtension = () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setIsConnecting(true);

    try {
      // Store user data in localStorage with a special key for the extension
      const extensionUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: Date.now()
      };

      localStorage.setItem('vizora_extension_user', JSON.stringify(extensionUserData));

      // Also post a message for any listening extension
      window.postMessage({
        type: 'VIZORA_AUTH_SUCCESS',
        user: extensionUserData
      }, '*');

      toast.success('Extension authenticated! You can close this tab and use the extension now.');

      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);
    } catch (error) {
      console.error('Error connecting extension:', error);
      toast.error('Failed to connect extension');
      setIsConnecting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={handleConnectExtension}
      disabled={isConnecting}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Puzzle size={16} />
      {isConnecting ? 'Connecting...' : 'Connect Extension'}
    </Button>
  );
};

export default ExtensionAuthButton;
