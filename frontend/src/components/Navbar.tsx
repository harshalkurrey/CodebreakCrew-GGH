import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDarkTheme = isHome || isAuthPage;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (path: string) => {
    if (path === '/browse') {
      return (
        location.pathname === '/browse' ||
        location.pathname.startsWith('/items') ||
        location.pathname.startsWith('/item')
      );
    }
    return location.pathname === path;
  };

  // Colour tokens that adapt to dark theme (home, login, signup) vs inner-page light bg
  const headerCls = isDarkTheme
    ? 'bg-[#070712]/80 backdrop-blur-md border-b border-white/10'
    : 'bg-white/95 backdrop-blur-md border-b border-gray-200';

  const logoTextCls = isDarkTheme
    ? 'text-white group-hover:text-indigo-300'
    : 'text-gray-900 group-hover:text-indigo-600';

  const logoBgCls = isDarkTheme
    ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400'
    : 'bg-indigo-600 group-hover:bg-indigo-700';

  const navLinkBase = isDarkTheme
    ? 'text-slate-300 hover:text-white hover:bg-white/10'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  const navLinkActive = isDarkTheme
    ? 'text-white bg-white/15 font-semibold'
    : 'text-indigo-600 bg-indigo-50 font-semibold';

  const mobileMenuBg = isDarkTheme
    ? 'bg-[#070712]/95 backdrop-blur-md border-t border-white/10'
    : 'bg-white border-t border-gray-200';

  const mobileLinkCls = isDarkTheme
    ? 'text-slate-200 hover:bg-white/10'
    : 'text-gray-700 hover:bg-gray-100';

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${headerCls}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition ${logoBgCls}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <span className={`font-bold text-xl tracking-tight transition ${logoTextCls}`}>
                CampusCycle
              </span>
            </Link>

            {/* Desktop Navigation — hidden on homepage to keep it minimal */}
            {!isHome && (
              <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
                <Link
                  to="/browse"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/browse') ? navLinkActive : navLinkBase
                  }`}
                >
                  Browse
                </Link>
                {currentUser && (
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard') ? navLinkActive : navLinkBase
                    }`}
                  >
                    My Dashboard
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isHome && !isAuthPage && (
              <Link
                to="/items/new"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                  isDarkTheme
                    ? 'text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-400/30'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200/80'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                List an Item
              </Link>
            )}

            {currentUser ? (
              <div
                className={`flex items-center gap-3 ${!isDarkTheme ? 'pl-2 border-l border-gray-200' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-gray-300 object-cover"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full font-semibold flex items-center justify-center text-xs ${
                        isDarkTheme ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span
                    className={`text-sm font-medium max-w-[120px] truncate ${
                      isDarkTheme ? 'text-slate-200' : 'text-gray-700'
                    }`}
                  >
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                    isDarkTheme
                      ? 'text-slate-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Logout
                </button>
              </div>
            ) : isAuthPage ? (
              <Link
                to="/browse"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition bg-white/5"
              >
                Browse Marketplace →
              </Link>
            ) : (
              <Link
                to="/login"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition shadow-xs ${
                  isDarkTheme
                    ? 'text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/60'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className={`p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isHome
                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`md:hidden px-4 pt-3 pb-5 space-y-2 ${mobileMenuBg}`}>
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-xl text-base font-medium transition ${mobileLinkCls}`}
          >
            Browse
          </Link>
          {currentUser && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-base font-medium transition ${mobileLinkCls}`}
            >
              My Dashboard
            </Link>
          )}
          <Link
            to="/items/new"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-xl text-base font-medium transition ${
              isHome ? 'text-indigo-300 bg-indigo-500/20' : 'text-indigo-700 bg-indigo-50'
            }`}
          >
            + List an Item
          </Link>
          <div className="pt-3 border-t border-white/10">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isHome ? 'text-slate-300' : 'text-gray-700'}`}>
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 px-4 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
