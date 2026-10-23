import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SplineBrandPanel } from '../components/SplineBrandPanel';

interface LoginPageProps {
  initialMode?: 'signin' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, currentUser, error: authContextError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // Determine initial mode based on prop, pathname (/signup), or query param (?mode=signup)
  const isSignupPath = location.pathname === '/signup' || searchParams.get('mode') === 'signup' || initialMode === 'signup';
  const [mode, setMode] = useState<'signin' | 'signup'>(isSignupPath ? 'signup' : 'signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate(redirectPath, { replace: true });
    }
  }, [currentUser, navigate, redirectPath]);

  // Sync mode if pathname changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
    }
  }, [location.pathname, searchParams]);

  const validateForm = (): boolean => {
    setLocalError(null);
    clearError();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid student or campus email address.');
      return false;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return false;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setLocalError('Please enter your full name for campus peer identification.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setLocalError(null);

      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      }
    } catch {
      // Handled via context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      clearError();
      await signInWithGoogle();
    } catch {
      // Handled via context
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authContextError;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2 bg-[#070712] text-white overflow-hidden">
      {/* ── Left Side: Spline scene with CampusCycle and tagline in the middle ── */}
      <div className="w-full h-full min-h-[350px] lg:min-h-full">
        <SplineBrandPanel tagline="Borrow More. Spend Less." />
      </div>

      {/* ── Right Side: Redesigned Auth Form ── */}
      <main className="flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 lg:py-16 w-full max-w-lg mx-auto z-10">
        <div className="w-full rounded-3xl border border-white/10 bg-[#0f0e24]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {mode === 'signin'
                ? 'Sign in to access your campus rentals and listings.'
                : 'Join CampusCycle to borrow or rent academic gear.'}
            </p>
          </div>

          {/* Sign In vs Sign Up Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#181735]/80 border border-white/5 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => {
                setMode('signin');
                setLocalError(null);
                clearError();
              }}
              className={`py-2.5 rounded-xl transition duration-200 font-bold cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => {
                setMode('signup');
                setLocalError(null);
                clearError();
              }}
              className={`py-2.5 rounded-xl transition duration-200 font-bold cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="leading-relaxed">{displayError}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="display-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  required
                  className="w-full px-4 py-3 bg-[#191838]/70 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25 transition duration-200"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Student Email <span className="text-rose-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full px-4 py-3 bg-[#191838]/70 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25 transition duration-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                  Password <span className="text-rose-400">*</span>
                </label>
                {mode === 'signin' && (
                  <span className="text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-4 py-3 bg-[#191838]/70 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25 transition duration-200"
              />
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 0 25px rgba(99,102,241,0.4)',
              }}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {mode === 'signin' ? 'Sign In to CampusCycle' : 'Create Student Account'}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0f0e24] text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Option */}
          <button
            type="button"
            id="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-[#1a193b]/70 border border-white/10 hover:bg-[#201f46] hover:border-white/20 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google Campus Account</span>
          </button>

          {/* Mode Switch Helper */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLocalError(null);
                    clearError();
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setLocalError(null);
                    clearError();
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Secure token auth via Firebase • Peer identity verified for campus safety
          </div>
        </div>
      </main>
    </div>
  );
};
