import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SplineBrandPanel } from '../components/SplineBrandPanel';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStart = () => {
    if (currentUser) {
      navigate('/browse');
    } else {
      navigate('/login?redirect=/browse');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2 bg-[#070712] overflow-hidden">
      {/* ── Left Side: Spline scene with CampusCycle and tagline in the middle ── */}
      <div className="w-full h-full min-h-[350px] lg:min-h-full">
        <SplineBrandPanel tagline="Borrow More. Spend Less." />
      </div>

      {/* ── Right Side: Minimal content with Let's Start ── */}
      <main className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left px-6 sm:px-12 lg:px-16 py-12 lg:py-20 max-w-xl mx-auto lg:mx-0 w-full z-10">
        <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold tracking-wide text-indigo-200">
            Campus Peer Rentals
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-5">
          Why Buy When You{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300">
            Can Borrow?
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300/80 leading-relaxed mb-8 max-w-md">
          Rent calculators, lab coats, blazers, and electronics from fellow students for the days you actually need them.
        </p>

        <div>
          <button
            id="home-cta-start"
            onClick={handleStart}
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/50 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 0 35px rgba(99,102,241,0.5)',
            }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
            Let&apos;s Start
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Instant campus access • No credit card required to explore
        </p>
      </main>
    </div>
  );
};
