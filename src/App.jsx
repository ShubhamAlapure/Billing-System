import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AddProductModal from './components/AddProductModal';
import BillingTab from './components/BillingTab';
import BillHistory from './components/BillHistory';
import BillReceiptModal from './components/BillReceiptModal';
import LoginModal from './components/LoginModal';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'addProduct', 'billing', 'history'
  const [activeBillReceipt, setActiveBillReceipt] = useState(null);

  // Check existing session (Strictly valid for Rahul)
  useEffect(() => {
    const existingUser = api.getCurrentUser();
    if (existingUser && existingUser.username && existingUser.username.toLowerCase() === 'rahul') {
      setUser(existingUser);
    } else {
      api.logout();
      setUser(null);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActiveTab('landing');
  };

  const handleBillGenerated = (newBill) => {
    setActiveBillReceipt(newBill);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in as Rahul, enforce login screen
  if (!user) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {activeTab === 'landing' && (
          <LandingPage
            setActiveTab={setActiveTab}
            onSelectBill={(b) => setActiveBillReceipt(b)}
          />
        )}

        {activeTab === 'addProduct' && (
          <AddProductModal
            setActiveTab={setActiveTab}
            onProductAdded={() => {}}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            setActiveTab={setActiveTab}
            onBillGenerated={handleBillGenerated}
          />
        )}

        {activeTab === 'history' && (
          <BillHistory
            setActiveTab={setActiveTab}
            onSelectBill={(b) => setActiveBillReceipt(b)}
          />
        )}
      </main>

      {/* Active Bill Receipt / Invoice Modal (Download Bill & WhatsApp Options) */}
      {activeBillReceipt && (
        <BillReceiptModal
          bill={activeBillReceipt}
          onClose={() => setActiveBillReceipt(null)}
        />
      )}

    </div>
  );
}
