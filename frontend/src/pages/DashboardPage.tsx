import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingService, itemService, aiService, ApiClientError } from '../services/api';
import { Booking, Item, ItemInputPayload, AiDescriptionResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { GeminiBadge } from '../components/GeminiBadge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { formatDisplayDate } from '../utils/date';

export const DashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'rentals' | 'listings'>('rentals');

  // Renter data
  const [renterBookings, setRenterBookings] = useState<Booking[]>([]);
  const [renterLoading, setRenterLoading] = useState(true);
  const [renterError, setRenterError] = useState<string | null>(null);

  // Owner data
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [ownerItems, setOwnerItems] = useState<Item[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Action status (cancelling, approving, rejecting, confirming return)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Item Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState('Calculators');
  const [createCondition, setCreateCondition] = useState('Good Condition');
  const [createDescription, setCreateDescription] = useState('');
  const [createDailyPrice, setCreateDailyPrice] = useState<number>(5);
  const [createDeposit, setCreateDeposit] = useState<number>(20);
  const [createLocation, setCreateLocation] = useState('Science Library');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const [createKeyFeatures, setCreateKeyFeatures] = useState('');
  const [createPickupOption, setCreatePickupOption] = useState<'in_person' | 'delivery'>('in_person');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Gemini AI Description State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiDescriptionResult | null>(null);
  const [aiGeneratedNotice, setAiGeneratedNotice] = useState(false);

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDailyPrice, setEditDailyPrice] = useState<number>(0);
  const [editDeposit, setEditDeposit] = useState<number>(0);
  const [editLocation, setEditLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const categories = ['Calculators', 'Lab Coats', 'Blazers', 'Electronics', 'Textbooks', 'Tools & Equipment', 'Other'];
  const conditions = ['Like New', 'Good Condition', 'Fair Condition'];

  // Data fetching functions with auto-refresh capability
  const fetchRenterData = useCallback(async () => {
    try {
      setRenterLoading(true);
      setRenterError(null);
      const data = await bookingService.getRenterBookings();
      setRenterBookings(data || []);
    } catch (err: unknown) {
      setRenterError(err instanceof Error ? err.message : 'Failed to load your rentals.');
    } finally {
      setRenterLoading(false);
    }
  }, []);

  const fetchOwnerData = useCallback(async () => {
    try {
      setOwnerLoading(true);
      setOwnerError(null);
      const [bookings, items] = await Promise.all([
        bookingService.getOwnerBookings().catch(() => []),
        itemService.getMyItems().catch(() => []),
      ]);
      setOwnerBookings(bookings || []);
      setOwnerItems(items || []);
    } catch (err: unknown) {
      setOwnerError(err instanceof Error ? err.message : 'Failed to load your lending dashboard.');
    } finally {
      setOwnerLoading(false);
    }
  }, []);

  const refreshAllData = useCallback(() => {
    fetchRenterData();
    fetchOwnerData();
  }, [fetchRenterData, fetchOwnerData]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login?redirect=/dashboard');
      return;
    }
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser, authLoading, navigate, refreshAllData]);

  // Overview Strip Metrics
  const currentRentalsCount = useMemo(() => renterBookings.filter((b) => b.status === 'active').length, [renterBookings]);
  const upcomingRentalsCount = useMemo(() => renterBookings.filter((b) => b.status === 'approved').length, [renterBookings]);
  const pendingRequestsCount = useMemo(() => ownerBookings.filter((b) => b.status === 'pending').length, [ownerBookings]);
  const activeListingsCount = useMemo(() => ownerItems.filter((i) => i.isAvailable).length, [ownerItems]);

  // Real Earnings Metrics
  const earningsSummary = useMemo(() => {
    const completedEarnings = ownerBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.rentalFee || 0), 0);

    const activeOrApprovedEarnings = ownerBookings
      .filter((b) => b.status === 'active' || b.status === 'approved')
      .reduce((sum, b) => sum + (b.rentalFee || 0), 0);

    const activeDeposits = ownerBookings
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + (b.deposit || 0), 0);

    return {
      completed: completedEarnings,
      inFlight: activeOrApprovedEarnings,
      activeDeposits,
      totalEarned: completedEarnings + activeOrApprovedEarnings,
    };
  }, [ownerBookings]);

  // Renter Action: Cancel Booking (ONLY on pending bookings)
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this pending booking request?')) return;
    try {
      setActionLoadingId(bookingId);
      setActionFeedback(null);
      await bookingService.cancelBooking(bookingId);
      setActionFeedback({ type: 'success', message: 'Booking request successfully cancelled.' });
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to cancel booking.';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Owner Actions: Approve / Reject / Confirm Return
  const handleApproveBooking = async (bookingId: string) => {
    try {
      setActionLoadingId(bookingId);
      setActionFeedback(null);
      await bookingService.approveBooking(bookingId);
      setActionFeedback({ type: 'success', message: 'Booking approved! Handover can now be coordinated.' });
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to approve booking.';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!window.confirm('Decline this booking request?')) return;
    try {
      setActionLoadingId(bookingId);
      setActionFeedback(null);
      await bookingService.rejectBooking(bookingId);
      setActionFeedback({ type: 'success', message: 'Booking request declined.' });
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to decline booking.';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReturn = async (bookingId: string) => {
    if (!window.confirm('Confirm that the renter has returned this item in good order?')) return;
    try {
      setActionLoadingId(bookingId);
      setActionFeedback(null);
      await bookingService.confirmReturn(bookingId);
      setActionFeedback({ type: 'success', message: 'Return confirmed! Rental marked as completed.' });
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to confirm return.';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Gemini AI Assistant: Generate Description
  const handleGenerateDescriptionWithGemini = async () => {
    if (!createTitle.trim()) {
      setCreateError('Please enter an item title first to generate AI suggestions.');
      return;
    }
    try {
      setAiLoading(true);
      setCreateError(null);
      const res = await aiService.generateDescription({
        title: createTitle.trim(),
        category: createCategory,
        keyFeatures: createKeyFeatures.trim() || undefined,
      });

      setAiResult(res);
      setAiGeneratedNotice(true);
      if (res.description) {
        setCreateDescription(res.description);
      }
      if (res.suggestedDailyPrice && res.suggestedDailyPrice > 0) {
        setCreateDailyPrice(res.suggestedDailyPrice);
      }
      if (res.suggestedDeposit && res.suggestedDeposit > 0) {
        setCreateDeposit(res.suggestedDeposit);
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'AI description assistant is currently unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  // Create Item Submission
  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createDescription.trim() || !createLocation.trim()) {
      setCreateError('Please complete all required fields.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      // SECURITY: Client NEVER sends userId, ownerId, renterId, totalPrice, isAvailable, or status
      const payload: ItemInputPayload = {
        title: createTitle.trim(),
        category: createCategory,
        condition: createCondition,
        description: createDescription.trim(),
        dailyPrice: Number(createDailyPrice),
        deposit: Number(createDeposit),
        location: createLocation.trim(),
        images: createImageUrl.trim() ? [createImageUrl.trim()] : [],
      };

      await itemService.createItem(payload);

      // Reset form and close
      setCreateTitle('');
      setCreateDescription('');
      setCreateImageUrl('');
      setCreateKeyFeatures('');
      setAiResult(null);
      setAiGeneratedNotice(false);
      setShowCreateForm(false);
      setActionFeedback({ type: 'success', message: 'Item listing successfully published!' });
      refreshAllData();
    } catch (err: unknown) {
      setCreateError(err instanceof ApiClientError ? err.message : 'Failed to publish listing.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Item Modal
  const handleStartEdit = (item: Item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditCondition(item.condition || 'Good Condition');
    setEditDescription(item.description);
    setEditDailyPrice(item.dailyPrice);
    setEditDeposit(item.deposit);
    setEditLocation(item.location);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setEditLoading(true);
      setEditError(null);

      await itemService.updateItem(editingItem.id, {
        title: editTitle.trim(),
        category: editCategory,
        condition: editCondition,
        description: editDescription.trim(),
        dailyPrice: Number(editDailyPrice),
        deposit: Number(editDeposit),
        location: editLocation.trim(),
      });

      setEditingItem(null);
      setActionFeedback({ type: 'success', message: 'Listing successfully updated.' });
      refreshAllData();
    } catch (err: unknown) {
      setEditError(err instanceof ApiClientError ? err.message : 'Failed to update listing.');
    } finally {
      setEditLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Verifying campus credentials...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Peer Rental Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your borrowed gear, track lending requests, and create campus listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            title="Refresh dashboard data"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setActiveTab('listings');
              setShowCreateForm(true);
            }}
          >
            + Create Listing
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between animate-in fade-in duration-150 ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Overview Strip (4 Key Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Current Rentals</span>
            <span>🎒</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{currentRentalsCount}</div>
          <p className="text-[11px] text-gray-500">Active gear in your possession</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
            <span>Upcoming Rentals</span>
            <span>📅</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{upcomingRentalsCount}</div>
          <p className="text-[11px] text-gray-500">Approved, awaiting start date</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Pending Requests</span>
            <span>⏳</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{pendingRequestsCount}</div>
          <p className="text-[11px] text-gray-500">Awaiting your approval as owner</p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
            <span>Active Listings</span>
            <span>📦</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{activeListingsCount}</div>
          <p className="text-[11px] text-gray-500">Items available to campus peers</p>
        </div>

      </div>

      {/* 3. Real Earnings Summary (Computed Strictly from Real Returned Bookings) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">
              Lending Financial Overview
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Peer Rental Earnings
            </h2>
          </div>
          <span className="text-xs text-indigo-300 bg-indigo-800/60 px-3 py-1 rounded-full border border-indigo-700">
            Total Calculated: ${earningsSummary.totalEarned}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-emerald-400">${earningsSummary.completed}</div>
            <div className="text-xs font-semibold text-white">Realized Earnings</div>
            <div className="text-[11px] text-indigo-200">From completed peer returns</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl font-black text-indigo-300">${earningsSummary.inFlight}</div>
            <div className="text-xs font-semibold text-white">In-Flight Earnings</div>
            <div className="text-[11px] text-indigo-200">From active and approved rentals</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl font-black text-amber-300">${earningsSummary.activeDeposits}</div>
            <div className="text-xs font-semibold text-white">Active Deposits Held</div>
            <div className="text-[11px] text-indigo-200">Refundable upon return</div>
          </div>
        </div>

        {/* Assumptions Stated Explicitly */}
        <div className="pt-2 text-[11px] text-indigo-300 border-t border-indigo-800/60">
          <strong>Assumption:</strong> Earnings are computed strictly from real returned bookings using server-verified rental fees. Security deposits are tracked separately and excluded from realized income as they are fully refundable upon item return.
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button
          onClick={() => setActiveTab('rentals')}
          className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'rentals'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>🎒 My Rentals</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
            {renterBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>📦 My Listings & Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
            {ownerItems.length + ownerBookings.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MY RENTALS (RENTER VIEW)
         ========================================================================= */}
      {activeTab === 'rentals' && (
        <div className="space-y-6">
          {renterLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-3">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="70%" />
                </div>
              ))}
            </div>
          ) : renterError ? (
            <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
              <p className="text-xs text-rose-800 font-medium">{renterError}</p>
              <Button variant="primary" size="sm" onClick={fetchRenterData}>
                Retry Loading
              </Button>
            </div>
          ) : renterBookings.length === 0 ? (
            <EmptyState
              title="You haven't rented any gear yet"
              description="Need a TI-84 calculator for finals, a lab coat for chemistry, or a blazer for career fairs? Explore campus listings."
              action={{
                label: 'Browse Campus Gear',
                href: '/browse'
              }}
            />
          ) : (
            <div className="space-y-4">
              {renterBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {booking.itemImage ? (
                        <img src={booking.itemImage} alt={booking.itemTitle} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                          {booking.itemTitle || `Booking #${booking.id.slice(-6)}`}
                        </h4>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span>Period: <strong>{formatDisplayDate(booking.startDate)}</strong> – <strong>{formatDisplayDate(booking.endDate)}</strong></span>
                        <span>•</span>
                        <span>{booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}</span>
                        <span>•</span>
                        <span>Rental: ${booking.rentalFee}</span>
                        <span>•</span>
                        <span>Deposit: ${booking.deposit}</span>
                        <span>•</span>
                        <span>Server Total: <strong className="text-gray-900 font-extrabold">${booking.totalPrice}</strong></span>
                      </div>

                      <div className="text-[11px] text-gray-400">
                        Submitted on {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Renter Actions */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    <Link to={`/item/${booking.itemId}`}>
                      <Button variant="outline" size="sm">
                        View Item
                      </Button>
                    </Link>

                    {/* SECURITY: Only renter sees Cancel, and ONLY on pending bookings */}
                    {booking.status === 'pending' && (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionLoadingId === booking.id}
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MY LISTINGS & INCOMING REQUESTS (OWNER VIEW)
         ========================================================================= */}
      {activeTab === 'listings' && (
        <div className="space-y-12">
          
          {/* Section A: Validated Create Item Form */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  List an Item for Peer Rental
                </h2>
                <p className="text-xs text-gray-500">
                  Fill in item details, condition, and pricing. Use Gemini to draft an informative description.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Hide Form' : '+ Open Create Form'}
              </Button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateItemSubmit} className="space-y-5 animate-in fade-in duration-150">
                
                {createError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="create-title" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Item Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-title"
                      type="text"
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="e.g. TI-84 Plus CE Graphing Calculator"
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-category" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="create-category"
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="create-condition" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Condition <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="create-condition"
                      value={createCondition}
                      onChange={(e) => setCreateCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {conditions.map((cond) => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="create-daily-price" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Daily Price ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-daily-price"
                      type="number"
                      min="1"
                      step="0.5"
                      value={createDailyPrice}
                      onChange={(e) => setCreateDailyPrice(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-deposit" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Security Deposit ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-deposit"
                      type="number"
                      min="0"
                      step="1"
                      value={createDeposit}
                      onChange={(e) => setCreateDeposit(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="create-location" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Handover Location on Campus <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="create-location"
                      type="text"
                      value={createLocation}
                      onChange={(e) => setCreateLocation(e.target.value)}
                      placeholder="e.g. Science Library, Student Center, North Quad"
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-pickup-mode" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Pickup or Delivery Option
                    </label>
                    <select
                      id="create-pickup-mode"
                      value={createPickupOption}
                      onChange={(e) => setCreatePickupOption(e.target.value as 'in_person' | 'delivery')}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="in_person">In-Person Campus Handover</option>
                      <option value="delivery" disabled>Delivery (Not yet available)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="create-image-url" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    id="create-image-url"
                    type="url"
                    value={createImageUrl}
                    onChange={(e) => setCreateImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Gemini AI Assistant Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>✨</span>
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Gemini AI Description Assistant
                      </span>
                    </div>
                    <GeminiBadge 
                      model={aiResult?.model || 'gemini-3.5-flash-lite'} 
                      ms={aiResult?.responseTimeMs} 
                      variant="subtle"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={createKeyFeatures}
                      onChange={(e) => setCreateKeyFeatures(e.target.value)}
                      placeholder="Key notes (e.g. 'includes charger, clean condition, size 40')"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={aiLoading}
                      onClick={handleGenerateDescriptionWithGemini}
                    >
                      Generate description with Gemini
                    </Button>
                  </div>

                  {aiGeneratedNotice && (
                    <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold tracking-wider">
                        AI-generated, please review
                      </span>
                      <span>Text has been placed below. You can freely edit and refine before saving.</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="create-description" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="create-description"
                      rows={4}
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="Describe what's included and any usage guidance..."
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={createLoading}
                  >
                    Publish Listing
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Section B: Incoming Requests for Owner's Listings */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Incoming Rental Requests
              </h2>
              <p className="text-xs text-gray-500">
                Approve requests, manage active handovers, and confirm return of items.
              </p>
            </div>

            {ownerLoading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-2">
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="60%" />
                  </div>
                ))}
              </div>
            ) : ownerError ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-xs text-rose-800">
                {ownerError}
              </div>
            ) : ownerBookings.length === 0 ? (
              <EmptyState
                title="No rental requests yet"
                description="When students on campus request to borrow your listings, their requests will appear here for your review and approval."
              />
            ) : (
              <div className="space-y-3">
                {ownerBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">
                          {booking.itemTitle || `Booking #${booking.id.slice(-6)}`}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span>Period: <strong>{formatDisplayDate(booking.startDate)}</strong> – <strong>{formatDisplayDate(booking.endDate)}</strong></span>
                        <span>•</span>
                        <span>Rental Earnings: <strong className="text-emerald-700 font-bold">${booking.rentalFee}</strong></span>
                        <span>•</span>
                        <span>Deposit: ${booking.deposit}</span>
                      </div>
                    </div>

                    {/* SECURITY: Only item owner sees Approve, Reject, and Confirm Return */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={actionLoadingId === booking.id}
                            onClick={() => handleApproveBooking(booking.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={actionLoadingId === booking.id}
                            onClick={() => handleRejectBooking(booking.id)}
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {booking.status === 'active' && (
                        <Button
                          variant="success"
                          size="sm"
                          isLoading={actionLoadingId === booking.id}
                          onClick={() => handleConfirmReturn(booking.id)}
                        >
                          Confirm Return
                        </Button>
                      )}

                      <Link to={`/item/${booking.itemId}`}>
                        <Button variant="ghost" size="sm">
                          Item Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section C: My Listed Items */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Your Listed Items ({ownerItems.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Academic items you made available for campus peers to borrow.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(true);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              >
                + Add Listing
              </Button>
            </div>

            {ownerItems.length === 0 ? (
              <EmptyState
                title="You haven't listed any items yet"
                description="List your calculators, lab coats, blazers, and academic electronics to start earning peer rental cash."
                action={{
                  label: 'List an Item',
                  onClick: () => setShowCreateForm(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {ownerItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <span className={`text-[11px] font-semibold ${item.isAvailable ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {item.isAvailable ? '● Available' : '● Rented'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <div>
                        <span className="font-extrabold text-gray-900">${item.dailyPrice}</span>
                        <span className="text-gray-500"> / day</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <Link
                          to={`/item/${item.id}`}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          EDIT ITEM MODAL
         ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-lg text-gray-900">
                Edit Item Listing
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Condition</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    {conditions.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Daily Price ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={editDailyPrice}
                    onChange={(e) => setEditDailyPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Handover Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={editLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
