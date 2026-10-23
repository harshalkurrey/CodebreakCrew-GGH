import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemService, aiService, ApiClientError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GeminiBadge } from '../components/GeminiBadge';
import { AiDescriptionResult } from '../types';

export const NewItemPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Calculators');
  const [description, setDescription] = useState('');
  const [dailyPrice, setDailyPrice] = useState<number>(5);
  const [deposit, setDeposit] = useState<number>(20);
  const [location, setLocation] = useState('Science Library');
  const [imageUrl, setImageUrl] = useState('');

  // AI Assistant State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiDescriptionResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiKeyFeatures, setAiKeyFeatures] = useState('');

  // Form Submission State
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = ['Calculators', 'Lab Coats', 'Blazers', 'Electronics', 'Textbooks', 'Tools & Equipment', 'Other'];

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate(`/login?redirect=${encodeURIComponent('/items/new')}`);
    }
  }, [currentUser, authLoading, navigate]);

  const handleGenerateAiDescription = async () => {
    if (!title.trim()) {
      setAiError('Please enter an item title first to generate AI suggestions.');
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);
      const res = await aiService.generateDescription({
        title: title.trim(),
        category,
        keyFeatures: aiKeyFeatures.trim() || undefined,
      });

      setAiResult(res);
      // Populate fields, while keeping user-controllable and editable
      if (res.description) {
        setDescription(res.description);
      }
      if (res.suggestedDailyPrice !== undefined && res.suggestedDailyPrice > 0) {
        setDailyPrice(res.suggestedDailyPrice);
      }
      if (res.suggestedDeposit !== undefined && res.suggestedDeposit > 0) {
        setDeposit(res.suggestedDeposit);
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI assistant is currently unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!title.trim() || !description.trim() || !location.trim()) {
      setSubmitError('Please complete all required fields.');
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError(null);

      // SECURITY: Client NEVER sends userId, ownerId, renterId, totalPrice, isAvailable, or status.
      // Identity comes strictly from Firebase ID token in Authorization header.
      const newItem = await itemService.createItem({
        title: title.trim(),
        description: description.trim(),
        category,
        dailyPrice: Number(dailyPrice),
        deposit: Number(deposit),
        location: location.trim(),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
      });

      navigate(`/item/${newItem.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to publish listing. Please check your connection.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Authenticating campus user...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          List an Item for Peer Rental
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your academic gear with students on campus and earn peer rental income.
        </p>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            1. Item Details
          </h2>

          <div>
            <label htmlFor="item-title" className="block text-xs font-semibold text-gray-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="item-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TI-84 Plus CE Graphing Calculator with Charger"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-category" className="block text-xs font-semibold text-gray-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="item-location" className="block text-xs font-semibold text-gray-700 mb-1">
                Handover Location on Campus <span className="text-rose-500">*</span>
              </label>
              <input
                id="item-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Science Library, Student Union, North Quad"
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-image" className="block text-xs font-semibold text-gray-700 mb-1">
              Photo URL (Optional)
            </label>
            <input
              id="item-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              Provide a direct image link or leave empty to use our category badge.
            </span>
          </div>
        </div>

        {/* Gemini AI Listing Assistant */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-6 rounded-3xl border border-indigo-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Gemini AI Description Assistant
              </h2>
            </div>
            <GeminiBadge 
              model={aiResult?.model || 'gemini-3.5-flash-lite'} 
              responseTimeMs={aiResult?.responseTimeMs}
            />
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Need help writing an informative listing description and competitive pricing? Let Gemini Flash-Lite compose a draft based on your item title.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiKeyFeatures}
              onChange={(e) => setAiKeyFeatures(e.target.value)}
              placeholder="Extra notes (e.g., 'Size 40, dry cleaned, includes cable')"
              className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={aiLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition shrink-0 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Suggest with Gemini</span>
              )}
            </button>
          </div>

          {aiError && (
            <p className="text-xs text-rose-600">{aiError}</p>
          )}

          {aiResult && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold tracking-wider">
                AI suggested
              </span>
              <span>Suggestions applied below! You can freely edit and customize any field.</span>
            </div>
          )}

          {/* Description Textarea */}
          <div className="pt-2">
            <label htmlFor="item-description" className="block text-xs font-semibold text-gray-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="item-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, what is included, and any helpful notes for borrowers..."
              required
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Pricing & Deposit */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            2. Daily Rate & Security Deposit
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="daily-price" className="block text-xs font-semibold text-gray-700 mb-1">
                Daily Price ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm">$</span>
                <input
                  id="daily-price"
                  type="number"
                  min="1"
                  step="0.5"
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="item-deposit" className="block text-xs font-semibold text-gray-700 mb-1">
                Security Deposit ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm">$</span>
                <input
                  id="item-deposit"
                  type="number"
                  min="0"
                  step="1"
                  value={deposit}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500">
            <strong>Security Reminder:</strong> Pricing and fee totals are calculated server-side when requests are created. As the listing owner, only you will be authorized to approve requests and confirm returns.
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {submitLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Publishing Item...</span>
              </>
            ) : (
              <span>Publish Listing</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
