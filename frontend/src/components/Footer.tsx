import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                CC
              </div>
              <span className="font-bold text-lg text-gray-900">CampusCycle</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Peer-to-peer campus marketplace enabling students to rent calculators, lab coats, blazers, and academic gear from peers.
            </p>
          </div>

          {/* Platform Status & Transparency */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Feature Availability
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center justify-between">
                <span>In-app Payments</span>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Not yet available
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Rental Insurance</span>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Not yet available
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Student ID Verification</span>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Not yet available
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Dispute Resolution</span>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Not yet available
                </span>
              </li>
            </ul>
          </div>

          {/* Plain-Language Policies */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Rental Policies
            </h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>
                <strong className="text-gray-700">Cancellations:</strong> Renters can cancel requests while in pending status before owner approval.
              </li>
              <li>
                <strong className="text-gray-700">Late Returns:</strong> Please return items on time so fellow students can prepare for exams. Handover is coordinated in-person.
              </li>
              <li>
                <strong className="text-gray-700">Damage Policy:</strong> Security deposits are agreed between peers to safeguard borrowed items.
              </li>
            </ul>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse" className="text-gray-600 hover:text-indigo-600 transition">
                  Browse All Gear
                </Link>
              </li>
              <li>
                <Link to="/items/new" className="text-gray-600 hover:text-indigo-600 transition">
                  List Your Gear
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">
                  Rental Dashboard
                </Link>
              </li>
              <li>
                <span className="text-gray-400 text-xs">Report listing: Coming soon</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} CampusCycle. Built for Google Gemini Hackathon.</p>
          <p>Powered by Gemini 3.5 Flash-Lite server-side inference.</p>
        </div>
      </div>
    </footer>
  );
};
