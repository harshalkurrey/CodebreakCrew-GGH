import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemService, bookingService, ApiClientError } from '../services/api';
import { Item, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { getTodayString, formatDisplayDate } from '../utils/date';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Canonical YYYY-MM-DD Date Strings Only
  const todayStr = getTodayString();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Booking action state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingErrorCode, setBookingErrorCode] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  const fetchItem = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await itemService.getItemById(id);
      setItem(data);
      setActiveImageIndex(0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Item not found or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton variant="text" width="20%" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="rounded" height={360} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rounded" height={120} />
          </div>
          <div className="lg:col-span-1">
            <Skeleton variant="rounded" height={420} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorState
          title="Listing Not Found"
          message={error || 'The requested campus listing does not exist or may have been removed.'}
          onRetry={fetchItem}
        />
        <div className="text-center pt-4">
          <Link to="/browse">
            <Button variant="outline" size="sm">
              Return to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Security checks per FRONTEND_RULES.md
  const isOwner = Boolean(currentUser && currentUser.uid === item.ownerId);
  const galleryImages = item.images && item.images.length > 0 ? item.images : [];
  const activeImage = galleryImages[activeImageIndex] || null;

  // Handle Canonical Date validation
  const isEndDateValid = endDate >= startDate;
  const isStartDateValid = startDate >= todayStr;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingErrorCode(null);

    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(`/item/${item.id}`)}`);
      return;
    }

    if (isOwner) {
      setBookingError('You own this listing. Owners cannot rent their own items.');
      return;
    }

    if (!isStartDateValid) {
      setBookingError('Rental start date cannot be in the past.');
      return;
    }

    if (!isEndDateValid) {
      setBookingError('Rental end date must be on or after the start date.');
      return;
    }

    try {
      setBookingLoading(true);

      // SECURITY RULE: Client NEVER sends userId, ownerId, renterId, totalPrice, isAvailable or status.
      // Identity comes only from the Firebase ID token in the Authorization header.
      // Pricing is server-side only. We send strictly { itemId, startDate, endDate }.
      const booking = await bookingService.createBooking({
        itemId: item.id,
        startDate, // Canonical YYYY-MM-DD
        endDate,   // Canonical YYYY-MM-DD
      });

      setBookingSuccess(booking);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setBookingErrorCode(err.code);
        if (err.status === 400) {
          setBookingError(`Validation Error: ${err.message}`);
        } else if (err.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent(`/item/${item.id}`)}`);
        } else if (err.status === 403) {
          setBookingError('Permission Denied: You do not have permission to book this listing.');
        } else if (err.status === 409) {
          setBookingError('Date Overlap Conflict: This item is already booked for the selected dates. Please choose different dates.');
        } else {
          setBookingError(err.message);
        }
      } else {
        setBookingError('Unable to submit booking request. Please check your network connection.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to="/browse" className="hover:text-indigo-600">Marketplace</Link>
        <span>/</span>
        <Link to={`/browse?category=${encodeURIComponent(item.category)}`} className="hover:text-indigo-600">{item.category}</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-xs">{item.title}</span>
      </nav>

      {/* Main Grid: Details (Left 2 Cols), Booking Sidebar (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Image Gallery */}
          <div className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-2xs space-y-3 p-4 sm:p-6">
            
            {/* Main Active Image */}
            <div className="relative aspect-16/10 w-full rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={item.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                  <span className="text-6xl mb-2">📦</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">{item.category}</span>
                </div>
              )}

              {/* Badges on main visual */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-indigo-700 shadow-xs backdrop-blur-xs">
                  {item.category}
                </span>
              </div>

              <div className="absolute top-4 right-4">
                {item.isAvailable ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
                    Available for Peer Rent
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-900 text-white shadow-xs">
                    Currently Rented Out
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip (if multiple photos) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 pt-2 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      activeImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-600/30' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title, Condition & Pricing Header */}
            <div className="pt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60">
                  {item.condition || 'Good Condition'}
                </span>
                <span className="text-xs text-gray-500">
                  Daily Rental: <strong className="text-gray-900">${item.dailyPrice}/day</strong>
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">
                  Security Deposit: <strong className="text-gray-900">${item.deposit}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {item.title}
              </h1>

              {/* Owner Info: Name ONLY, NO contact details per security rules */}
              <div className="flex items-center gap-2 text-xs text-gray-600 pt-1">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                  {item.ownerName ? item.ownerName[0].toUpperCase() : 'S'}
                </div>
                <span>
                  Listed by student peer: <strong className="text-gray-900">{item.ownerName || 'Campus Student'}</strong>
                </span>
              </div>
            </div>

          </div>

          {/* 2. Description & Specifications */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Description
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Item Specifications
              </h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <dt className="text-gray-500 font-medium">Category</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">{item.category}</dd>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <dt className="text-gray-500 font-medium">Verified Condition</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">{item.condition || 'Good Condition'}</dd>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <dt className="text-gray-500 font-medium">Handover Spot</dt>
                  <dd className="font-bold text-gray-900 mt-0.5 truncate">{item.location}</dd>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <dt className="text-gray-500 font-medium">Daily Rate</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">${item.dailyPrice} / day</dd>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <dt className="text-gray-500 font-medium">Refundable Deposit</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">${item.deposit}</dd>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <dt className="text-gray-500 font-medium">Handover Mode</dt>
                  <dd className="font-bold text-gray-900 mt-0.5">In-person Campus Meetup</dd>
                </div>
              </dl>
            </div>

            {/* Pickup & Delivery Options */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Pickup & Handover Options
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-1">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>📍</span> In-Person Campus Handover
                  </span>
                  <p className="text-indigo-800 leading-relaxed">
                    Meet at <strong>{item.location}</strong>. Inspect the item, test calculator/electronics, and verify working order together.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-700 flex items-center justify-between">
                    <span>📦 Delivery / Shipping</span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Not yet available
                    </span>
                  </span>
                  <p className="text-gray-500 leading-relaxed">
                    All rentals are exchanged in-person to ensure immediate access without postal delays or shipping fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Plain-Language Policies */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Plain-Language Rental Policies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <strong className="text-gray-900 block mb-1">Cancellations</strong>
                  Free cancellation anytime while in "Pending" status prior to owner approval.
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <strong className="text-gray-900 block mb-1">Late Return Policy</strong>
                  Return promptly by 6:00 PM on the scheduled end date to respect subsequent student bookings.
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                  <strong className="text-gray-900 block mb-1">Damage & Deposit</strong>
                  Refundable deposit is returned in full upon safe return of the item in agreed condition.
                </div>
              </div>

              {/* Honesty note on contact details & report listing */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-400">
                <span>Personal phone and email are never exposed; communication is via booking requests.</span>
                <span>Report listing: Coming soon</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Booking Request Form & Server-Calculated Cost */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl border border-gray-200/90 p-6 shadow-sm space-y-6">
            
            {/* Header Rates */}
            <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-3xl font-black text-gray-900">${item.dailyPrice}</span>
                <span className="text-xs text-gray-500 font-semibold"> / day</span>
              </div>
              <div className="text-right text-xs text-gray-500">
                <span>Refundable Deposit: </span>
                <span className="font-bold text-gray-800">${item.deposit}</span>
              </div>
            </div>

            {/* Booking Success Confirmation State */}
            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Request Submitted to Owner!</span>
                </div>

                {/* Returned booking details with StatusBadge */}
                <div className="space-y-2 bg-white/90 p-4 rounded-xl border border-emerald-200/80 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Booking Status:</span>
                    <StatusBadge status={bookingSuccess.status} />
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Rental Period:</span>
                    <span className="font-medium text-gray-900">
                      {formatDisplayDate(bookingSuccess.startDate)} – {formatDisplayDate(bookingSuccess.endDate)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Server Duration:</span>
                    <span className="font-medium text-gray-900">{bookingSuccess.rentalDays} {bookingSuccess.rentalDays === 1 ? 'day' : 'days'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Rental Fee:</span>
                    <span className="font-medium text-gray-900">${bookingSuccess.rentalFee}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Refundable Deposit:</span>
                    <span className="font-medium text-gray-900">${bookingSuccess.deposit}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex justify-between font-extrabold text-sm text-gray-900">
                    <span>Total Cost (Server Calculated):</span>
                    <span className="text-emerald-700">${bookingSuccess.totalPrice}</span>
                  </div>
                </div>

                {/* Explicit statement that it is a request, not a confirmed rental */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> This is a <strong>rental request</strong>, not a confirmed rental. The item owner must review and approve this request in their dashboard before handover can proceed.
                </div>

                <div className="space-y-2 pt-1">
                  <Link to="/dashboard" className="block w-full">
                    <Button variant="primary" size="md" className="w-full text-xs font-bold">
                      View Request in Dashboard →
                    </Button>
                  </Link>
                  <button
                    onClick={() => setBookingSuccess(null)}
                    className="w-full text-center text-xs text-emerald-800 hover:underline pt-1"
                  >
                    Submit another date request
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {/* Canonical Start Date Picker */}
                <div>
                  <label htmlFor="rental-start-date" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Rental Start Date
                  </label>
                  <input
                    id="rental-start-date"
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Format: YYYY-MM-DD</span>
                </div>

                {/* Canonical End Date Picker */}
                <div>
                  <label htmlFor="rental-end-date" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Rental End Date
                  </label>
                  <input
                    id="rental-end-date"
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Must be on or after start date</span>
                </div>

                {/* Server Pricing Notice (Client never computes or sends totalPrice) */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/70 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Base Daily Rate:</span>
                    <strong className="text-gray-900">${item.dailyPrice}/day</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Refundable Deposit:</span>
                    <strong className="text-gray-900">${item.deposit}</strong>
                  </div>
                  <div className="border-t border-gray-200 pt-2 text-[11px] text-gray-500 leading-relaxed">
                    *Total cost is computed strictly on the server upon request. The client never computes or transmits prices.
                  </div>
                </div>

                {/* Error Banner with 400/401/403/overlap handling */}
                {bookingError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Booking Error</span>
                    </div>
                    <p className="leading-relaxed">{bookingError}</p>
                    {bookingErrorCode && (
                      <span className="text-[10px] font-mono text-rose-600 block">Code: {bookingErrorCode}</span>
                    )}
                  </div>
                )}

                {/* Action Buttons: Owner Disabled vs Unauthenticated vs Active */}
                {isOwner ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1.5">
                    <span className="text-xs font-bold text-amber-900 block">Owner Control Notice</span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      You own this listing. Owners cannot rent their own items.
                    </p>
                    <Link to="/dashboard" className="inline-block mt-1 text-xs font-bold text-indigo-600 hover:underline">
                      Manage this listing in Dashboard →
                    </Link>
                  </div>
                ) : !item.isAvailable ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-bold text-gray-400 bg-gray-100 cursor-not-allowed"
                  >
                    Currently Rented Out
                  </button>
                ) : !currentUser ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/item/${item.id}`)}`)}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Request Booking</span>
                  </button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={bookingLoading}
                    className="w-full py-3.5 text-sm font-black shadow-sm"
                  >
                    Request Booking
                  </Button>
                )}

                {/* Honest Payment Protection Disclosure */}
                <div className="pt-2 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                    <span>Payment protection:</span>
                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Not yet available
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    In-person handover ensures direct inspection before peer rental.
                  </p>
                </div>

              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
