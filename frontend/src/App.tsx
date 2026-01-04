import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { DrivePage } from '@/pages/Drive';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicy';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { fetchUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/drive" replace /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/drive" replace /> : <LoginPage />}
      />
      <Route
        path="/drive"
        element={
          <ProtectedRoute>
            <DrivePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drive/folder/:folderId"
        element={
          <ProtectedRoute>
            <DrivePage />
          </ProtectedRoute>
        }
      />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
