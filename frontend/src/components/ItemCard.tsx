import React from 'react';
import { Link } from 'react-router-dom';
import { Item } from '../types';

export interface ItemCardProps {
  item: Item;
  isAiSuggested?: boolean;
  isComparing?: boolean;
  onToggleCompare?: (item: Item) => void;
  canCompare?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isAiSuggested = false,
  isComparing = false,
  onToggleCompare,
  canCompare = true,
}) => {
  const defaultCategoryGradients: Record<string, string> = {
    'Calculators': 'from-blue-600 to-indigo-700',
    'Lab Coats': 'from-emerald-600 to-teal-700',
    'Blazers': 'from-slate-700 to-gray-900',
    'Electronics': 'from-violet-600 to-purple-800',
  };

  const bgGradient = defaultCategoryGradients[item.category] || 'from-indigo-600 to-indigo-800';
  const hasImage = item.images && item.images.length > 0 && item.images[0].trim() !== '';
  const conditionDisplay = item.condition || 'Good Condition';

  return (
    <div className={`group relative flex flex-col bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md ${
      isComparing ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-gray-200/90 hover:border-indigo-300'
    }`}>
      
      {/* Compare Checkbox Trigger */}
      {onToggleCompare && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCompare(item);
          }}
          disabled={!isComparing && !canCompare}
          className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition backdrop-blur-md shadow-xs ${
            isComparing 
              ? 'bg-indigo-600 text-white' 
              : !canCompare 
              ? 'bg-white/80 text-gray-400 cursor-not-allowed opacity-60' 
              : 'bg-white/90 text-gray-700 hover:bg-white hover:text-indigo-600'
          }`}
          title={isComparing ? 'Remove from comparison' : !canCompare ? 'Max 3 items selected' : 'Add to side-by-side comparison'}
        >
          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
            isComparing ? 'border-white bg-white text-indigo-600' : 'border-gray-400 bg-white'
          }`}>
            {isComparing && (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span>{isComparing ? 'Comparing' : 'Compare'}</span>
        </button>
      )}

      {/* Item Image / Fallback */}
      <Link to={`/item/${item.id}`} className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden block">
        {hasImage ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallback = parent.querySelector('.img-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}

        <div
          className={`img-fallback w-full h-full flex flex-col items-center justify-center p-4 text-white bg-gradient-to-br ${bgGradient} ${
            hasImage ? 'hidden' : 'flex'
          }`}
        >
          <span className="text-3xl mb-1">
            {item.category === 'Calculators' ? '🧮' :
             item.category === 'Lab Coats' ? '🥼' :
             item.category === 'Blazers' ? '👔' :
             item.category === 'Electronics' ? '💻' : '📦'}
          </span>
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{item.category}</span>
        </div>

        {/* Top-Right Badges: Availability & AI Suggested */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
          {item.isAvailable ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white backdrop-blur-xs shadow-xs">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-900/80 text-white backdrop-blur-xs">
              Rented Out
            </span>
          )}

          {isAiSuggested && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/95 text-white backdrop-blur-xs shadow-xs">
              <span>✨</span>
              <span>AI suggested</span>
            </span>
          )}
        </div>

        {/* Bottom Category Pill */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/95 text-gray-800 backdrop-blur-xs shadow-2xs">
            {item.category}
          </span>
        </div>
      </Link>

      {/* Item Body */}
      <Link to={`/item/${item.id}`} className="flex-1 p-4 flex flex-col justify-between block">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {conditionDisplay}
            </span>
            <span className="text-[11px] text-gray-400">
              Deposit: ${item.deposit}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Location & Pricing */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500 max-w-[55%] truncate" title={item.location}>
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{item.location}</span>
          </div>

          <div className="text-right">
            <span className="text-base font-extrabold text-gray-900">${item.dailyPrice}</span>
            <span className="text-xs text-gray-500 font-medium"> / day</span>
          </div>
        </div>
      </Link>

    </div>
  );
};
