import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Calendar, Eye, Download, MessageCircle, 
  ArrowLeft, RefreshCw, Filter, FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function BillHistory({ onSelectBill, setActiveTab }) {
  const [bills, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await api.getBills(filterDate ? { date: filterDate } : {});
      setBills(data);
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filterDate]);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const filteredBills = bills.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      (b.billNumber && b.billNumber.toLowerCase().includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.customerPhone && b.customerPhone.includes(q));
    return matchesQuery;
  });

  const totalFilteredRevenue = filteredBills.reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24 md:pb-12">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => setActiveTab('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBills}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xl">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              <span>Bill Copies & Records</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Access past invoices, re-print bill copies or re-send to WhatsApp
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 px-4 py-2.5 rounded-2xl flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Filtered Bills</span>
              <div className="text-sm font-black text-slate-900">{filteredBills.length}</div>
            </div>
            <div className="h-7 w-px bg-emerald-200"></div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Sales</span>
              <div className="text-sm font-black text-emerald-800">{formatINR(totalFilteredRevenue)}</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 mb-5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill No, Customer Name or Phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-400">Filter Day:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none flex-1"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Bills Table / List */}
        {filteredBills.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No bill records found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the search or date filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Bill No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">
                      {b.billNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {b.date} <span className="text-[10px] text-slate-400">({b.time})</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">{b.customerName || 'Walk-in'}</div>
                      {b.customerPhone && (
                        <div className="text-[10px] text-slate-400">📱 {b.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                        {b.items?.length || 1} items
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-black text-emerald-700">
                      {formatINR(b.total)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                        {b.paymentMode || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectBill(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors text-xs shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Bill Copy</span>
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

