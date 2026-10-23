import React, { useState } from 'react';
import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';

interface SplineBrandPanelProps {
  tagline?: string;
}

export const SplineBrandPanel: React.FC<SplineBrandPanelProps> = ({
  tagline = 'Borrow More. Spend Less.',
}) => {
  const [loaded, setLoaded] = useState(false);

  // Actively remove any "Built with Spline" badge/watermark from the DOM
  React.useEffect(() => {
    const purgeWatermark = () => {
      // 1. Remove anchor tags pointing to spline.design
      document.querySelectorAll('a[href*="spline.design"]').forEach((el) => {
        el.remove();
      });

      // 2. Remove elements with spline watermark identifiers
      document.querySelectorAll('#spline-watermark, .spline-watermark, #spline-logo, [class*="watermark"]').forEach((el) => {
        el.remove();
      });

      // 3. Scan for any element whose text says "Built with Spline"
      document.querySelectorAll('a, div, span, p').forEach((el) => {
        if (el.textContent && /built\s+with\s+spline/i.test(el.textContent.trim())) {
          (el as HTMLElement).style.display = 'none';
          el.remove();
        }
      });
    };

    purgeWatermark();
    const interval = setInterval(purgeWatermark, 100);
    const observer = new MutationObserver(purgeWatermark);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  const handleSplineLoad = (splineApp: Application) => {
    setLoaded(true);

    try {
      // Disable global window mouse event tracking to keep it 2D and non-interactive
      splineApp.setGlobalEvents(false);
    } catch {
      // safe fallback
    }

    try {
      const vars = splineApp.getVariables();
      if (vars) {
        Object.keys(vars).forEach((key) => {
          const val = String(vars[key] || '');
          if (/mouse|move/i.test(val) || /mouse|move/i.test(key)) {
            splineApp.setVariable(key, 'Borrow More. Spend Less.');
          }
        });
      }
    } catch {
      // safe fallback
    }

    try {
      const allObjects = splineApp.getAllObjects();
      if (Array.isArray(allObjects)) {
        allObjects.forEach((obj: any) => {
          if (obj && obj.name) {
            // Replace any "Move your mouse" text
            if (/mouse|move/i.test(obj.name) && typeof obj.text === 'string') {
              obj.text = 'Borrow More. Spend Less.';
            }

            // Hide any baked-in Spline logo or watermark in the 3D scene
            if (/spline|watermark|logo|credit|badge/i.test(obj.name)) {
              if (typeof obj.hide === 'function') {
                obj.hide();
              } else {
                obj.visible = false;
              }
              if (obj.scale && typeof obj.scale.set === 'function') {
                obj.scale.set(0, 0, 0);
              }
              if (obj.position) {
                obj.position.y = -999999;
              }
            }
          }
        });
      }

      // Also traverse raw Three.js scene graph if accessible
      const threeScene = (splineApp as any)._scene || (splineApp as any).data?.scene || (splineApp as any).scene;
      if (threeScene && typeof threeScene.traverse === 'function') {
        threeScene.traverse((child: any) => {
          if (child && child.name && /spline|watermark|logo|credit|badge/i.test(child.name)) {
            child.visible = false;
            if (child.scale && typeof child.scale.set === 'function') {
              child.scale.set(0, 0, 0);
            }
            if (child.position) {
              child.position.y = -999999;
            }
            if (child.material) {
              child.material.opacity = 0;
              child.material.visible = false;
            }
          }
        });
      }
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="relative w-full h-full min-h-[340px] lg:min-h-full flex items-center justify-center overflow-hidden bg-[#06060f] border-b lg:border-b-0 lg:border-r border-white/10 select-none">
      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-[380px] h-[380px] rounded-full bg-violet-600/20 blur-[100px]" />
      </div>

      {/* Spline Canvas (2D automatic motion, mouse tracking disabled) */}
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-700 overflow-hidden ${
          loaded ? 'opacity-80' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        <div className="w-full h-full transform-gpu scale-105 pointer-events-none overflow-hidden">
          <Spline
            scene="https://prod.spline.design/r9GFmi84XWfhTYkh/scene.splinecode"
            onLoad={handleSplineLoad}
            className="w-full h-full pointer-events-none"
          />
        </div>
      </div>

      {/* Guaranteed Bottom Cover Masks: completely covers where Spline renders any watermark */}
      {/* Large corner mask covers the standard bottom-right watermark position */}
      <div 
        className="pointer-events-none absolute bottom-0 right-0 z-30"
        style={{ width: '320px', height: '80px', background: 'linear-gradient(to top left, #06060f 75%, transparent)' }}
        aria-hidden="true"
      />
      {/* Full-width bottom gradient for complete sealing */}
      <div 
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-30"
        style={{ height: '56px', background: 'linear-gradient(to top, #06060f 60%, transparent)' }}
        aria-hidden="true"
      />
      {/* Solid corner block as final catch-all */}
      <div 
        className="pointer-events-none absolute bottom-0 right-0 z-30"
        style={{ width: '200px', height: '36px', background: '#06060f' }}
        aria-hidden="true"
      />

      {/* Subtle overlay to guarantee high-contrast text readability in center */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-[#06060f]/20 via-[#06060f]/50 to-[#06060f]/85 z-10" />

      {/* Center Branding Content in the middle of Spline */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 py-12 max-w-sm">
        {/* Logo Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/50 mb-4 border border-white/20">
          <svg className="w-8 h-8 sm:w-9 sm:h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
          CampusCycle
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 tracking-wide">
          {tagline}
        </p>

        {/* Live campus badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium text-slate-300">
            Student Peer Marketplace
          </span>
        </div>
      </div>
    </div>
  );
};
