import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { itemService, aiService } from '../services/api';
import { Item, SmartSearchResult } from '../types';
import { ItemCard } from '../components/ItemCard';
import { GeminiBadge } from '../components/GeminiBadge';
import { Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';

// ─── Category config with icons & gradients ───────────────────────────────────
const CATEGORY_CONFIG = [
  { name: 'All',         icon: '🛒', gradient: 'from-slate-500 to-slate-700',   count: null },
  { name: 'Electronics', icon: '⚡', gradient: 'from-indigo-500 to-violet-600', count: null },
  { name: 'Calculators', icon: '🔢', gradient: 'from-sky-500 to-blue-600',      count: null },
  { name: 'Blazers',     icon: '👔', gradient: 'from-amber-500 to-orange-600',  count: null },
  { name: 'Lab Coats',   icon: '🥼', gradient: 'from-emerald-500 to-teal-600',  count: null },
  { name: 'Textbooks',   icon: '📚', gradient: 'from-rose-500 to-pink-600',     count: null },
  { name: 'Other',       icon: '🔧', gradient: 'from-purple-500 to-fuchsia-600',count: null },
];

// ─── Trending tags (quick search shortcuts) ───────────────────────────────────
const TRENDING_TAGS = [
  { label: '🔥 Midterm Ready', query: 'calculator' },
  { label: '⚡ Hackathon Pack', query: 'power bank' },
  { label: '🎤 Presentation', query: 'clicker projector' },
  { label: '🥼 Lab Practical', query: 'lab coat' },
  { label: '👔 Interview Season', query: 'blazer' },
  { label: '📷 Media Project', query: 'camera tripod' },
  { label: '📐 Engineering Sketch', query: 'drafting' },
  { label: '🎧 Focus Mode', query: 'headphones' },
];

export const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery    = searchParams.get('search')   || '';
  const initialCategory = searchParams.get('category') || 'All';

  // ─── State ────────────────────────────────────────────────────────────────
  const [keywordQuery,     setKeywordQuery]     = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice,         setMaxPrice]         = useState<number>(150);
  const [availableOnly,    setAvailableOnly]    = useState(false);
  const [sortBy,           setSortBy]           = useState<'featured'|'price-asc'|'price-desc'|'popular'>('featured');
  const [viewMode,         setViewMode]         = useState<'grid'|'list'>('grid');

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string|null>(null);

  const [aiPrompt,      setAiPrompt]      = useState('');
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiResult,      setAiResult]      = useState<SmartSearchResult|null>(null);
  const [aiMeasuredMs,  setAiMeasuredMs]  = useState<number|undefined>(undefined);
  const [aiNotice,      setAiNotice]      = useState<string|null>(null);
  const [aiActiveQuery, setAiActiveQuery] = useState<string|null>(null);

  const [compareItems,     setCompareItems]     = useState<Item[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [filtersOpen,      setFiltersOpen]      = useState(false);

  // ─── Data loading ─────────────────────────────────────────────────────────
  const fetchAllItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itemService.getItems();
      setAllItems(data || []);
      if (data && data.length > 0) {
        const highest = Math.max(...data.map(i => i.dailyPrice), 150);
        setMaxPrice(prev => Math.max(prev, Math.ceil(highest)));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to CampusCycle server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllItems(); }, [fetchAllItems]);

  useEffect(() => {
    const urlCat    = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    if (urlCat    && urlCat    !== selectedCategory) setSelectedCategory(urlCat);
    if (urlSearch && urlSearch !== keywordQuery)     setKeywordQuery(urlSearch);
  }, [searchParams]);

  // ─── AI search ────────────────────────────────────────────────────────────
  const handleAskAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      setAiNotice(null);
      const t0 = performance.now();
      const result = await aiService.smartSearch(aiPrompt.trim());
      const ms = Math.round(performance.now() - t0);
      setAiMeasuredMs(ms);
      const realItemMap   = new Map(allItems.map(i => [i.id, i]));
      const verifiedItems = (result.recommendations || []).filter(rec => realItemMap.has(rec.id));
      if (result.fallbackUsed) setAiNotice('Gemini AI fallback: returning standard keyword search results.');
      else                      setAiNotice(null);
      setAiResult({ ...result, recommendations: verifiedItems });
      setAiActiveQuery(aiPrompt.trim());
    } catch (err: unknown) {
      console.warn('AI search failed, falling back:', err);
      setAiNotice('AI search unavailable. Showing keyword results.');
      setKeywordQuery(aiPrompt.trim());
      setAiResult(null);
      setAiActiveQuery(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearAi = () => {
    setAiResult(null); setAiPrompt(''); setAiActiveQuery(null);
    setAiNotice(null); setAiMeasuredMs(undefined);
  };

  // ─── Compare ──────────────────────────────────────────────────────────────
  const handleToggleCompare = (item: Item) => {
    setCompareItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev.filter(i => i.id !== item.id);
      if (prev.length >= 3) return prev;
      return [...prev, item];
    });
  };
  const handleRemoveCompare = (id: string) => setCompareItems(prev => prev.filter(i => i.id !== id));
  const handleClearCompare  = () => { setCompareItems([]); setShowCompareModal(false); };

  // ─── Filter & Sort ────────────────────────────────────────────────────────
  const displayedItems = useMemo(() => {
    const source   = aiResult ? aiResult.recommendations : allItems;
    const filtered = source.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (item.dailyPrice > maxPrice)                                       return false;
      if (availableOnly   && !item.isAvailable)                             return false;
      if (!aiResult && keywordQuery.trim()) {
        const q = keywordQuery.toLowerCase();
        if (!item.title.toLowerCase().includes(q)    &&
            !item.description.toLowerCase().includes(q) &&
            !item.location.toLowerCase().includes(q)    &&
            !item.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sortBy === 'price-asc')  filtered.sort((a, b) => a.dailyPrice - b.dailyPrice);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.dailyPrice - a.dailyPrice);
    if (sortBy === 'popular')    filtered.sort((a, b) => (b.condition === 'Brand New' ? 1 : 0) - (a.condition === 'Brand New' ? 1 : 0));
    return filtered;
  }, [allItems, aiResult, selectedCategory, maxPrice, availableOnly, keywordQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allItems.length };
    allItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  // Featured items (first 4 available)
  const featuredItems = useMemo(() =>
    allItems.filter(i => i.isAvailable).slice(0, 4)
  , [allItems]);

  const handleResetFilters = () => {
    setKeywordQuery(''); setSelectedCategory('All');
    setAvailableOnly(false); setMaxPrice(150);
    setSortBy('featured'); handleClearAi();
    setSearchParams({});
  };

  const hasActiveFilters = keywordQuery || selectedCategory !== 'All' ||
    availableOnly || maxPrice < 150 || aiResult || sortBy !== 'featured';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-indigo-400/10 blur-[100px]" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-8">
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 mb-6 text-xs text-indigo-200">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>{allItems.length} items live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🎓</span>
              <span>{allItems.filter(i => i.isAvailable).length} available now</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>Instant on-campus handover</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Marketplace</span>
              </h1>
              <p className="text-indigo-200 text-sm max-w-lg">
                Borrow academic gear, lab equipment, blazers &amp; electronics from verified campus peers — no deposits, no hassle.
              </p>
            </div>

            {/* Hero search bar */}
            <div className="w-full lg:max-w-md">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-400 group-focus-within:text-indigo-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={e => {
                    setKeywordQuery(e.target.value);
                    setSearchParams({
                      ...(e.target.value ? { search: e.target.value } : {}),
                      ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
                    });
                  }}
                  placeholder="Search items, gear, textbooks..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-indigo-300 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
                />
                {keywordQuery && (
                  <button
                    onClick={() => { setKeywordQuery(''); setSearchParams({}); }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-indigo-300 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Trending quick tags */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {TRENDING_TAGS.slice(0, 4).map(tag => (
                  <button
                    key={tag.label}
                    onClick={() => { setKeywordQuery(tag.query); }}
                    className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-indigo-200 hover:bg-white/20 hover:text-white transition-all"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 inset-x-0 h-6 bg-gray-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">

        {/* ── CATEGORY CARDS ROW ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {CATEGORY_CONFIG.map(cat => {
            const count   = categoryCounts[cat.name] ?? 0;
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSearchParams({
                    ...(keywordQuery ? { search: keywordQuery } : {}),
                    ...(cat.name !== 'All' ? { category: cat.name } : {}),
                  });
                }}
                className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-br ${cat.gradient} text-white border-transparent shadow-lg shadow-indigo-500/20 scale-105`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <span className="text-xl leading-none">{cat.icon}</span>
                <span className={`text-[10px] font-bold leading-tight ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {cat.name}
                </span>
                {count > 0 && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TRUST STRIP ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: '⚡', title: 'Instant Handover',      desc: 'On-campus meeting spots',     color: 'from-indigo-500/10 to-indigo-600/5 border-indigo-100', iconBg: 'bg-indigo-100 text-indigo-700' },
            { icon: '🛡️', title: 'Zero Deposit',         desc: 'Verified student rentals',     color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-700' },
            { icon: '🎓', title: 'Campus-Verified Peers', desc: 'University ID confirmed',      color: 'from-violet-500/10 to-violet-600/5 border-violet-100', iconBg: 'bg-violet-100 text-violet-700' },
            { icon: '✨', title: 'Gemini AI Matching',    desc: 'Smart need & budget matching', color: 'from-sky-500/10 to-sky-600/5 border-sky-100', iconBg: 'bg-sky-100 text-sky-700' },
          ].map(t => (
            <div key={t.title} className={`flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br ${t.color} border`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${t.iconBg}`}>
                {t.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{t.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FEATURED ITEMS (show only when no filter active) ──────────────── */}
        {!hasActiveFilters && !loading && featuredItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full" />
                <h2 className="text-base font-extrabold text-gray-900">⭐ Featured This Week</h2>
              </div>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredItems.map(item => (
                <Link
                  key={item.id}
                  to={`/item/${item.id}`}
                  className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-indigo-50 to-violet-50">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{item.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-indigo-700">${item.dailyPrice}<span className="text-xs font-medium text-gray-400">/day</span></span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">Available</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── ASK AI BLOCK ───────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
          {/* Decorative top-right blob */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-200/40 blur-3xl" aria-hidden />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                ✨
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Ask AI — Need & Budget Matcher</h2>
                <p className="text-[11px] text-gray-500">Powered by Gemini backend inference</p>
              </div>
            </div>
            <GeminiBadge model={aiResult?.model || 'gemini-3.5-flash-lite'} ms={aiMeasuredMs} variant="subtle" />
          </div>

          <form onSubmit={handleAskAiSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. 'Lab coat size M under ₹4/day' or 'TI-84 for tomorrow morning'"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="md" isLoading={aiLoading} className="whitespace-nowrap px-5 shadow-md shadow-indigo-500/20">
                Ask Gemini
              </Button>
              {aiResult && (
                <Button type="button" variant="outline" size="md" onClick={handleClearAi} className="text-xs">
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Prompt suggestions */}
          {!aiResult && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Graphing calculator under $5/day",
                "Noise-cancelling headphones",
                "Lab coat size L for chemistry",
                "Blazer for placement interview",
              ].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAiPrompt(s)}
                  className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {aiNotice && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <span>⚠️</span><span>{aiNotice}</span>
            </div>
          )}

          {aiResult && !aiResult.fallbackUsed && (
            <div className="mt-3 p-4 bg-white/90 border border-indigo-200 rounded-2xl space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">AI Suggested</span>
                  <span className="text-xs font-semibold text-gray-800">Matches for: "{aiActiveQuery}"</span>
                </div>
                {aiMeasuredMs !== undefined && (
                  <span className="text-[11px] font-mono text-gray-400">Latency: {aiMeasuredMs}ms</span>
                )}
              </div>
              {aiResult.reasoning && (
                <p className="text-xs text-gray-600 leading-relaxed pt-1">
                  <strong className="text-gray-800">Gemini reasoning:</strong> {aiResult.reasoning}
                </p>
              )}
              <p className="text-[11px] text-indigo-600">
                {aiResult.recommendations.length} campus {aiResult.recommendations.length === 1 ? 'item' : 'items'} matched.
              </p>
            </div>
          )}
        </div>

        {/* ── TRENDING TAGS ──────────────────────────────────────────────────── */}
        {!hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 mr-1">🔥 Trending:</span>
            {TRENDING_TAGS.map(tag => (
              <button
                key={tag.label}
                onClick={() => setKeywordQuery(tag.query)}
                className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-xs"
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {/* ── FILTERS TOOLBAR ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Toolbar top row */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 items-center justify-between border-b border-gray-100">
            {/* Sort + view controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price ↑ Low to High</option>
                  <option value="price-desc">Price ↓ High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="10" y="0" width="6" height="6" rx="1"/>
                    <rect x="0" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-xs text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List view"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <rect x="0" y="0" width="16" height="3" rx="1.5"/>
                    <rect x="0" y="6.5" width="16" height="3" rx="1.5"/>
                    <rect x="0" y="13" width="16" height="3" rx="1.5"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Right: count + filters toggle + reset */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs text-gray-500">
                <strong className="text-gray-900 font-bold">{displayedItems.length}</strong> items
              </span>
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  filtersOpen || hasActiveFilters
                    ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filters
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </button>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Collapsible filter panel */}
          {filtersOpen && (
            <div className="p-4 space-y-4 bg-gray-50/60 border-t border-gray-100">
              {/* Keyword search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={e => {
                    setKeywordQuery(e.target.value);
                    setSearchParams({
                      ...(e.target.value ? { search: e.target.value } : {}),
                      ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
                    });
                  }}
                  placeholder="Filter by title, description, or campus location..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category chips */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_CONFIG.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setSearchParams({
                            ...(keywordQuery ? { search: keywordQuery } : {}),
                            ...(cat.name !== 'All' ? { category: cat.name } : {}),
                          });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          selectedCategory === cat.name
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cat.icon} {cat.name}
                        {categoryCounts[cat.name] != null && (
                          <span className="ml-1 opacity-60">({categoryCounts[cat.name]})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price slider + availability */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Max Price / Day</label>
                      <span className="text-xs font-black text-indigo-700">${maxPrice}</span>
                    </div>
                    <input
                      type="range" min="5" max="150" step="5" value={maxPrice}
                      onChange={e => setMaxPrice(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>$5</span><span>$150</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox" checked={availableOnly}
                      onChange={e => setAvailableOnly(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">Available items only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-gray-400 font-medium">Active filters:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="hover:text-indigo-900">×</button>
                </span>
              )}
              {keywordQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold">
                  "{keywordQuery}"
                  <button onClick={() => setKeywordQuery('')} className="hover:text-gray-900">×</button>
                </span>
              )}
              {maxPrice < 150 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold">
                  ≤ ${maxPrice}/day
                  <button onClick={() => setMaxPrice(150)} className="hover:text-gray-900">×</button>
                </span>
              )}
              {availableOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  Available only
                  <button onClick={() => setAvailableOnly(false)} className="hover:text-emerald-900">×</button>
                </span>
              )}
              {aiResult && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-semibold">
                  ✨ AI recommended
                  <button onClick={handleClearAi} className="hover:text-violet-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── COMPARE DOCK (header) ──────────────────────────────────────────── */}
        {compareItems.length > 0 && (
          <div className="flex items-center justify-between p-3.5 px-4 bg-gray-900 text-white rounded-2xl border border-gray-700">
            <div className="flex items-center gap-3">
              {compareItems.map(item => (
                <div key={item.id} className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-700 overflow-hidden shrink-0">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-sm">📦</span>
                    }
                  </div>
                  <span className="text-xs text-gray-300 max-w-[80px] truncate">{item.title}</span>
                  <button onClick={() => handleRemoveCompare(item.id)} className="text-gray-500 hover:text-white text-xs">×</button>
                </div>
              ))}
              <span className="text-xs text-gray-500">{compareItems.length}/3 selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => setShowCompareModal(true)} className="text-xs font-bold">
                Compare →
              </Button>
              <button onClick={handleClearCompare} className="text-xs text-gray-400 hover:text-white px-2 py-1">Clear</button>
            </div>
          </div>
        )}

        {/* ── ITEM GRID / LIST ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(12)].map((_, n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
                <Skeleton variant="rounded" height={160} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Unable to load marketplace" message={error} onRetry={fetchAllItems} />
        ) : displayedItems.length === 0 ? (
          <EmptyState
            title="No campus gear found"
            description="Try broadening your search, adjusting the price slider, or resetting your category filter."
            action={{ label: 'Reset Filters', onClick: handleResetFilters }}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                isAiSuggested={Boolean(aiResult && !aiResult.fallbackUsed)}
                isComparing={compareItems.some(c => c.id === item.id)}
                onToggleCompare={handleToggleCompare}
                canCompare={compareItems.length < 3 || compareItems.some(c => c.id === item.id)}
              />
            ))}
          </div>
        ) : (
          /* ── LIST VIEW ─────────────────────────────────────────────────────── */
          <div className="space-y-3">
            {displayedItems.map(item => (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-700 transition-colors">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-indigo-700">${item.dailyPrice}<span className="text-xs font-medium text-gray-400">/day</span></p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Rented'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">{item.category}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium">{item.condition}</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {item.location}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── BOTTOM STATS STRIP ─────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: allItems.length,                                   label: 'Total Listings',   icon: '📦', color: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800' },
              { value: allItems.filter(i => i.isAvailable).length,        label: 'Available Now',    icon: '✅', color: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800' },
              { value: [...new Set(allItems.map(i => i.category))].length, label: 'Categories',      icon: '🗂️', color: 'from-violet-50 to-violet-100 border-violet-200 text-violet-800' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${s.color} border`}>
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-[11px] font-semibold opacity-70">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── COMPARISON MODAL ───────────────────────────────────────────────── */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 overflow-y-auto max-h-[90vh] space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                    Side-by-Side Comparison ({compareItems.length}/3)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Compare price, condition, location & availability before requesting.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleClearCompare} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">Clear All</button>
                  <button onClick={() => setShowCompareModal(false)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {compareItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No items selected. Click "Compare" on up to 3 item cards.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">Attribute</th>
                        {compareItems.map(item => (
                          <th key={item.id} className="p-3 align-top min-w-[200px] border-l border-gray-100">
                            <div className="space-y-2">
                              <div className="aspect-video w-full rounded-xl bg-gray-100 overflow-hidden relative">
                                {item.images?.[0]
                                  ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                }
                                <button onClick={() => handleRemoveCompare(item.id)} className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-gray-500 hover:text-rose-600 text-xs shadow-xs">✕</button>
                              </div>
                              <h4 className="font-bold text-gray-900 text-sm line-clamp-2">{item.title}</h4>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {[
                        { label: 'Price / Day',   render: (item: Item) => <><span className="text-base font-extrabold text-gray-900">${item.dailyPrice}</span><span className="text-gray-400"> / day</span></> },
                        { label: 'Deposit',        render: (item: Item) => <span className="font-medium text-gray-800">${item.deposit}</span> },
                        { label: 'Condition',      render: (item: Item) => <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60">{item.condition || 'Good'}</span> },
                        { label: 'Category',       render: (item: Item) => <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-gray-700 bg-gray-100">{item.category}</span> },
                        { label: 'Location',       render: (item: Item) => <div className="flex items-center gap-1 text-gray-700"><svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>{item.location}</div> },
                        { label: 'Availability',   render: (item: Item) => item.isAvailable
                            ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">Available</span>
                            : <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-gray-700 bg-gray-100">Rented Out</span>
                        },
                        { label: 'Action',         render: (item: Item) => (
                          <Link to={`/item/${item.id}`} onClick={() => setShowCompareModal(false)} className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs">
                            View & Request
                          </Link>
                        )},
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="p-3 font-semibold text-gray-500 bg-gray-50/50">{row.label}</td>
                          {compareItems.map(item => (
                            <td key={item.id} className="p-3 border-l border-gray-100">{row.render(item)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowCompareModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── FLOATING COMPARE DOCK ──────────────────────────────────────────── */}
        {compareItems.length > 0 && !showCompareModal && (
          <div className="fixed bottom-6 inset-x-0 z-40 max-w-lg mx-auto px-4">
            <div className="bg-gray-900 text-white rounded-2xl p-3 px-4 shadow-xl flex items-center justify-between border border-gray-700/80">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {compareItems.length}
                </span>
                <span className="text-xs font-semibold text-gray-200">
                  {compareItems.length} {compareItems.length === 1 ? 'item' : 'items'} in compare (max 3)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => setShowCompareModal(true)} className="text-xs font-bold shadow-xs">
                  Compare Side by Side
                </Button>
                <button onClick={handleClearCompare} className="text-xs text-gray-400 hover:text-white px-2 py-1">✕</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
