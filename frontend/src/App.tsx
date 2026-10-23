import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Footer, ToastProvider, Button } from './components';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { NewItemPage } from './pages/NewItemPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

// Guards a route: unauthenticated users are sent to /login?redirect=<current-path>
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return <>{children}</>;
};

// Layout wrapper that hides Footer on homepage and auth pages
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideFooter = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen flex flex-col text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppLayout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/items" element={<BrowsePage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/login" element={<LoginPage initialMode="signin" />} />
          <Route path="/signup" element={<LoginPage initialMode="signup" />} />

          {/* Protected routes — require auth */}
          <Route
            path="/items/new"
            element={
              <ProtectedRoute>
                <NewItemPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-2xs">
                  404
                </div>
                <div className="space-y-1 max-w-sm">
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Page Not Found
                  </h1>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    The campus resource or page you requested could not be found. It may have moved or no longer exists.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Link to="/">
                    <Button variant="primary" size="md">
                      Return to Home
                    </Button>
                  </Link>
                  <Link to="/browse">
                    <Button variant="outline" size="md">
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </AppLayout>
    </ToastProvider>
  );
};
