import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import VizoraLogo from '@/components/VizoraLogo';

const LoginModal: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <VizoraLogo />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Welcome to Vizora
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Sign in to access funnel analytics and insights
        </p>

        {/* Sign in button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-base font-medium"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2" size={20} />
              Sign in with Google
            </>
          )}
        </Button>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-6">
          By signing in, you agree to access your Google Analytics data
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
