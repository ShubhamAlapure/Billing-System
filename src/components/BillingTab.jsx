import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Minus, Trash2, Edit3, Check, X,
  Search, User, Phone, Sparkles, Percent, DollarSign,
  ArrowRight, ShieldCheck, Tag, ShoppingCart, AlertCircle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function BillingTab({ onBillGenerated, setActiveTab }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Cart / Bill Items
  // Structure: { id, name, originalPrice, billedPrice, qty, total, isPriceEdited }
  const [cartItems, setCartItems] = useState([]);

  // Price Edit Popover / Inline Modal State
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [tempPriceInput, setTempPriceInput] = useState('');

  // Discount State
  const [discountType, setDiscountType] = useState('flat'); // 'flat' (₹) or 'percent' (%)
  const [discountValue, setDiscountValue] = useState('');

  // Payment Mode
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom Item Modal State
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const list = await api.getProducts();
    setProducts(list);
  };

  // Add product to cart
  const addToCart = (product) => {
    const existingIndex = cartItems.findIndex(i => i.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      updated[existingIndex].total = updated[existingIndex].billedPrice * updated[existingIndex].qty;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          originalPrice: product.price,
          billedPrice: product.price, // initially equals master price
          isPriceEdited: false,
          qty: 1,
          total: product.price
        }
      ]);
    }
  };

  // Add Custom / Ad-hoc item not yet in catalog
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customName.trim() || !customPrice) return;
    const priceNum = parseFloat(customPrice) || 0;
    setCartItems([
      ...cartItems,
      {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        originalPrice: priceNum,
        billedPrice: priceNum,
        isPriceEdited: false,
        qty: 1,
        total: priceNum
      }
    ]);
    setCustomName('');
    setCustomPrice('');
    setShowCustomItemModal(false);
  };

  // Quantity updates
  const updateQty = (index, delta) => {
    const updated = [...cartItems];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    updated[index].qty = newQty;
    updated[index].total = updated[index].billedPrice * newQty;
    setCartItems(updated);
  };

  const removeFromCart = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Temporary Price Edit for this Bill
  const startEditPrice = (index) => {
    setEditingItemIndex(index);
    setTempPriceInput(cartItems[index].billedPrice.toString());
  };

  const saveEditedPrice = () => {
    if (editingItemIndex === null) return;
    const newPrice = parseFloat(tempPriceInput);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Please enter a valid price');
      return;
    }

    const updated = [...cartItems];
    const item = updated[editingItemIndex];
    item.billedPrice = newPrice;
    item.isPriceEdited = newPrice !== item.originalPrice;
    item.total = newPrice * item.qty;
    
    setCartItems(updated);
    setEditingItemIndex(null);
    setTempPriceInput('');
  };

  const cancelEditPrice = () => {
    setEditingItemIndex(null);
    setTempPriceInput('');
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  let discountAmount = 0;
  const numDiscount = parseFloat(discountValue) || 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * numDiscount) / 100;
  } else {
    discountAmount = numDiscount;
  }
  // Discount cannot exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Submit / Finalize Bill
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to generate bill');
      return;
    }

    setSubmitting(true);

    try {
      const billData = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: cartItems,
        subtotal,
        discount: discountAmount,
        total: grandTotal,
        paymentMode,
        notes
      };

      const generatedBill = await api.createBill(billData);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if confetti unavailable
      }

      // Reset form
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue('');
      setNotes('');

      // Open bill receipt view with Download & WhatsApp options!
      if (onBillGenerated) {
        onBillGenerated(generatedBill);
      }
    } catch (err) {
      console.error('Failed to create bill:', err);
      alert('Failed to generate bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto">
      
      {/* Top Banner / Store Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Receipt className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight">
              पार्वती भांडी स्टोअर्स — बिलिंग काउंटर
            </h1>
            <p className="text-[11px] text-emerald-200">
              थोरलीवाडीकर यांचे • मेन रोड, अहमदपूर • मो. 7875739052, 8208945810
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCustomItemModal(true)}
          className="text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-2 rounded-xl shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Custom Item</span>
        </button>
      </div>

      {/* Main Billing Layout: 2 Columns on Desktop, Stacked Mobile First */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT / UPPER: Item Selector & Catalog Grid (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
            
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Select Items to Bill</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                Tap item to add
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search utensils, cooker, thali..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {['All', 'Cookers', 'Cookware', 'Steel', 'Brass', 'Copper', 'Bottles', 'Appliances'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items List / Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 mt-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/70 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
                >
                  <div className="pr-2">
                    <div className="font-bold text-slate-800 text-xs group-hover:text-emerald-900 leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.category} {p.code ? `• ${p.code}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700">
                      ₹{p.price}
                    </span>
                    <button className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shadow-2xs transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT: Active Bill / Cart Sheet (7 cols on lg) - STRICTLY ATTRACTIVE MOBILE APP VIEW */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>

            {/* Customer Details Box (Essential for WhatsApp) */}
            <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Customer Details (For Bill & WhatsApp)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  WhatsApp Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name (e.g. Ramesh Patil)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="WhatsApp Number (10 digits)"
                    className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Bill Cart Items Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Items in Current Bill</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              </h2>

              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Cart Items List with the specific user layout:
                "on the BILLING TAB go for item name in front price in front of price give option of edit price while billing it will be temporary change price in that bill"
            */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">Bill is empty</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select items from the left catalog or tap "+ Custom Item" above
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.isPriceEdited
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    
                    {/* Item Main Row: Name, in front Price, in front of Price Option to Edit Price */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      
                      {/* Item Name */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </div>
                        {item.isPriceEdited && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-1">
                            <Tag className="w-3 h-3" />
                            <span>Temporary Bill Price (Original: ₹{item.originalPrice})</span>
                          </div>
                        )}
                      </div>

                      {/* IN FRONT: Price AND Edit Price Button */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        
                        {/* Option to Edit Price while billing (temporary change) */}
                        <button
                          type="button"
                          onClick={() => startEditPrice(index)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition-colors"
                          title="Click to edit price for this bill only"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-600" />
                          <span>Edit Price</span>
                        </button>

                        {/* In front Price */}
                        <div className="text-right min-w-[70px]">
                          <div className="font-extrabold text-sm text-slate-900">
                            ₹{item.billedPrice}
                          </div>
                          {item.isPriceEdited && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ₹{item.originalPrice}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Popover / Inline Form when this specific item's price is being edited */}
                    {editingItemIndex === index && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between mb-1.5 font-bold text-amber-900">
                          <span>Temporary Price Override (This Bill Only):</span>
                          <span className="text-[10px] text-amber-700">Master price remains ₹{item.originalPrice}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center font-bold text-slate-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              autoFocus
                              value={tempPriceInput}
                              onChange={(e) => setTempPriceInput(e.target.value)}
                              placeholder="New rate for this bill"
                              className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-amber-300 bg-white font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={saveEditedPrice}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply</span>
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPrice}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quantity Stepper & Line Total Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">Qty:</span>
                        <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQty(index, -1)}
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-black text-slate-800 text-xs">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(index, 1)}
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 mr-1">Total:</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{item.total}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(index)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* BILL SUMMARY & DISCOUNT OPTION */}
            {cartItems.length > 0 && (
              <div className="mt-6 pt-5 border-t-2 border-slate-100 space-y-4">
                
                {/* Subtotal */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items):</span>
                  <span className="font-bold text-slate-900 text-sm">₹{subtotal.toFixed(2)}</span>
                </div>

                {/* USER REQUIREMENT: "and also at the end give option of give. discount" */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      Give Discount
                    </span>
                    {/* Toggle Flat ₹ or % */}
                    <div className="flex items-center bg-white rounded-lg p-0.5 border border-emerald-300 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setDiscountType('flat')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          discountType === 'flat' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        ₹ Flat
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          discountType === 'percent' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        % Off
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                      {discountType === 'flat' ? '₹' : '%'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'flat' ? 'Enter discount amount in ₹' : 'Enter discount percentage'}
                      className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between mt-2 text-xs font-bold text-emerald-700">
                      <span>Discount Saved:</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Cash', 'UPI / GPay', 'Card', 'Udhar'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          paymentMode === mode
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Grand Total Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                      Grand Total Amount
                    </span>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                      ₹{grandTotal.toFixed(2)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateBill}
                    disabled={submitting || cartItems.length === 0}
                    className="py-3 px-5 sm:px-6 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-xs sm:text-sm transition-all"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Finish Bill</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Custom Item Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Add Quick Custom Item</h3>
              <button 
                onClick={() => setShowCustomItemModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Description / Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Steel Chimta / Gas Pipe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                >
                  Add to Current Bill
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

