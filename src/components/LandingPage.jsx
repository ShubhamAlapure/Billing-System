import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Receipt, TrendingUp, Calendar, 
  ArrowUpRight, ShoppingBag, CreditCard, ChevronRight,
  Eye, Download, Share2, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage({ setActiveTab, onSelectBill }) {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [analytics, setAnalytics] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(selectedDate, selectedMonth);
      setAnalytics(data);

      const bills = await api.getBills(viewMode === 'daily' ? { date: selectedDate } : { month: selectedMonth });
      setRecentBills(bills.slice(0, 8));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, selectedMonth, viewMode]);

  // Format currency in Indian format
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const currentRevenue = viewMode === 'daily' 
    ? (analytics?.daily?.revenue || 0)
    : (analytics?.monthly?.revenue || 0);

  const currentBillCount = viewMode === 'daily'
    ? (analytics?.daily?.billCount || 0)
    : (analytics?.monthly?.billCount || 0);

  const currentItemsSold = viewMode === 'daily'
    ? (analytics?.daily?.itemsSold || 0)
    : (analytics?.monthly?.itemsSold || 0);

  const currentAverage = viewMode === 'daily'
    ? (analytics?.daily?.averageBill || 0)
    : (analytics?.monthly?.averageBill || 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            पार्वती भांडी स्टोअर्स, अहमदपूर
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            थोरलीवाडीकर यांचे • मो. 7875739052, 8208945810 • मेन रोड, अहमदपूर
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button 
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TWO PRIMARY CORE ACTIONS ON LANDING PAGE: ADD PRODUCTS & BILLING */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400">Select an option to begin</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* ACTION 1: ADD PRODUCTS */}
          <div 
            onClick={() => setActiveTab('addProduct')}
            className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/50 p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-125"></div>
            
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shadow-sm">
                <PlusCircle className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                Catalog <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="mt-5">
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                ADD PRODUCTS
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add new items with permanent database storage, set base prices, categories, and manage the utensil inventory.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{analytics?.totalProductsCount || 10} Items Saved</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Catalog →
              </span>
            </div>
          </div>

          {/* ACTION 2: BILLING */}
          <div 
            onClick={() => setActiveTab('billing')}
            className="group relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 rounded-3xl shadow-lg shadow-emerald-700/20 hover:shadow-2xl hover:shadow-emerald-700/30 transition-all duration-200 cursor-pointer overflow-hidden transform hover:-translate-y-0.5"
          >
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 -mb-6 -mr-6 w-32 h-32 bg-emerald-400/20 rounded-full blur-lg pointer-events-none"></div>

            <div className="flex items-start justify-between relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
                <Receipt className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-white text-emerald-800 px-3 py-1 rounded-full shadow-sm">
                Active POS
              </span>
            </div>

            <div className="mt-5 relative z-10">
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                BILLING TAB
                <span className="text-[11px] font-semibold bg-emerald-500/40 px-2 py-0.5 rounded-full">New Sale</span>
              </h3>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                Instant mobile billing with live price edits, temporary overrides, discount options, printable bill copies & 1-click WhatsApp sending.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white/90 relative z-10">
              <span>Fast Checkout Counter</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start Billing →
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SALES ANALYTICS & REPORTING SECTION (Zoho Billing Reference Style) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        
        {/* Header with Zoho-like Tab & Date Selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                Sales Analytics & Performance
              </h2>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track daily sales and monthly performance with date filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Daily vs Monthly */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'daily'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Daily Sales
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Monthly Sales
              </button>
            </div>

            {/* Date / Month Picker */}
            {viewMode === 'daily' ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-400">Day:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-400">Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Metrics Cards (Styled directly like the Zoho Billing reference in user image) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* Card 1: Net Revenue */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {viewMode === 'daily' ? 'Net Revenue (Selected Day)' : 'Net Revenue (Selected Month)'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                Live
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatINR(currentRevenue)}
              </div>
              <p className="text-[11px] font-medium text-emerald-600 mt-1">
                {viewMode === 'daily' ? `Sales for ${selectedDate}` : `Total for ${selectedMonth}`}
              </p>
            </div>
          </div>

          {/* Card 2: Total Bills Generated */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Bills
              </span>
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentBillCount}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Completed invoices
              </p>
            </div>
          </div>

          {/* Card 3: Items Sold */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Utensils / Items Sold
              </span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentItemsSold}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Units dispatched
              </p>
            </div>
          </div>

          {/* Card 4: Average Bill Size */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Average Bill Value
              </span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatINR(currentAverage)}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Per customer average
              </p>
            </div>
          </div>

        </div>

        {/* Visual Zoho-style Chart Breakdown */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {viewMode === 'daily' ? 'Hourly / Transaction Curve' : 'Daily Sales Trend (This Month)'}
            </h3>
            <span className="text-[11px] text-slate-400">
              Interactive Curve Reference
            </span>
          </div>

          {/* Smooth SVG Spline Area Chart (Zoho style) */}
          <div className="h-44 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="zohoGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Spline area */}
              <path
                d="M 0,110 Q 70,105 130,40 T 250,90 T 360,30 T 500,100 L 500,120 L 0,120 Z"
                fill="url(#zohoGreenGrad)"
              />
              {/* Curve stroke */}
              <path
                d="M 0,110 Q 70,105 130,40 T 250,90 T 360,30 T 500,100"
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Highlight peak point */}
              <circle cx="130" cy="40" r="5" fill="#ffffff" stroke="#059669" strokeWidth="3" />
              <circle cx="360" cy="30" r="5" fill="#ffffff" stroke="#059669" strokeWidth="3" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-3 border-t border-slate-200/60 mt-1">
            <span>Morning (9 AM)</span>
            <span>Afternoon (1 PM)</span>
            <span>Evening Peak (6 PM)</span>
            <span>Night Closing (9 PM)</span>
          </div>
        </div>

      </div>

      {/* BILL COPY / RECENT INVOICES SECTION */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Recent Bill Copies & Records
            </h2>
            <p className="text-xs text-slate-500">
              Click any bill copy to view full receipt, reprint, download or send on WhatsApp
            </p>
          </div>

          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-center"
          >
            <span>View All Bill Copies</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {recentBills.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No bills generated for this date yet</p>
            <p className="text-xs text-slate-400 mt-1">Click the "BILLING" button above to create the first bill.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Bill No</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Bill Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {b.billNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {b.date} <span className="text-[10px] text-slate-400">({b.time})</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{b.customerName || 'Walk-in'}</div>
                      {b.customerPhone && (
                        <div className="text-[10px] text-slate-400">📱 {b.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {b.items?.length || 1} item{b.items?.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-emerald-700">
                      {formatINR(b.total)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                        {b.paymentMode || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectBill(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold transition-all text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Copy</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

