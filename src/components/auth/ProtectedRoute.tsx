import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <LoginModal />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
