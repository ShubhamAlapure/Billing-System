import React from 'react';
import { Store, PlusCircle, Receipt, History, LogOut, User, BarChart3 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name */}
            <div 
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                    PARVATI BHANDI STORES
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    POS
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                  पार्वती भांडी स्टोअर्स • मेन रोड, अहमदपूर
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('landing')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'landing'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Home & Sales</span>
              </button>

              <button
                onClick={() => setActiveTab('addProduct')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'addProduct'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Products</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'billing'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>BILLING</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Bill Copies</span>
              </button>
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline">{user?.username || 'Rahul'}</span>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Strictly Mobile App View) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-4 gap-1 items-center">
          
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === 'landing'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-0.5 ${activeTab === 'landing' ? 'stroke-[2.5]' : ''}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('addProduct')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === 'addProduct'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className={`w-5 h-5 mb-0.5 ${activeTab === 'addProduct' ? 'stroke-[2.5]' : ''}`} />
            <span>Add Items</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all relative ${
              activeTab === 'billing'
                ? 'text-emerald-700'
                : 'text-slate-600'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md mb-0.5 transition-transform ${
              activeTab === 'billing'
                ? 'bg-emerald-600 text-white scale-110 shadow-emerald-500/30'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              <Receipt className="w-4 h-4" />
            </div>
            <span>BILLING</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === 'history'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className={`w-5 h-5 mb-0.5 ${activeTab === 'history' ? 'stroke-[2.5]' : ''}`} />
            <span>Bills</span>
          </button>

        </div>
      </div>
    </>
  );
}

