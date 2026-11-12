import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Save, CheckCircle2, Package, Search, 
  Trash2, Edit2, Sparkles, Database, Layers, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'All',
  'Cookers',
  'Cookware',
  'Steel',
  'Brass',
  'Copper',
  'Bottles',
  'Appliances',
  'Pooja Items',
  'General'
];

export default function AddProductModal({ setActiveTab, onProductAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Cookware');
  const [unit, setUnit] = useState('pc');
  const [code, setCode] = useState('');
  
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    const list = await api.getProducts();
    setProducts(list);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      alert('Please enter both Product Name and Price');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await api.updateProduct(editingId, {
          name: name.trim(),
          price: parseFloat(price),
          category,
          unit,
          code: code.trim() || `P${Date.now().toString().slice(-4)}`
        });
        setEditingId(null);
      } else {
        await api.addProduct({
          name: name.trim(),
          price: parseFloat(price),
          category,
          unit,
          code: code.trim() || `P${Date.now().toString().slice(-4)}`
        });
      }

      // Reset form
      setName('');
      setPrice('');
      setCode('');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);

      await fetchProducts();
      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error saving product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (prod) => {
    setEditingId(prod.id);
    setName(prod.name);
    setPrice(prod.price.toString());
    setCategory(prod.category || 'General');
    setUnit(prod.unit || 'pc');
    setCode(prod.code || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCode('');
  };

  const handleDelete = async (id, prodName) => {
    if (window.confirm(`Permanently delete "${prodName}" from store inventory?`)) {
      await api.deleteProduct(id);
      await fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      
      {/* Mobile Top Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Permanently Saved</span>
        </div>
      </div>

      {/* Main Add Product Card (Strictly Attractive Mobile App View) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editingId ? 'Edit Product Details' : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              PARVATI BHANDI STORES • Catalog Master
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successToast && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>✓ Product saved permanently to Store Database!</span>
            </div>
            <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
              Permanent Sync
            </span>
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="space-y-4">
          
          {/* Product Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hawkins 5L Pressure Cooker / Brass Pooja Thali"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-semibold transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Price Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base font-extrabold text-slate-900 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-semibold transition-all bg-white"
              >
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold bg-white"
              >
                <option value="pc">Piece (pc)</option>
                <option value="set">Set (set)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="dozen">Dozen</option>
              </select>
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Item Code / Barcode
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Optional code"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Update Product' : 'Save Product Permanently'}</span>
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all"
              >
                Cancel
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Existing Products List & Inventory Catalog */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Store Product Catalog ({products.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Items saved in PARVATI BHANDI STORES database
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Filter Pills (Mobile Friendly Swipe) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid (Optimized strictly for mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {p.category || 'General'}
                  </span>
                  {p.code && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {p.code}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2 leading-snug">
                  {p.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-slate-900">
                    ₹{p.price}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">
                    /{p.unit || 'pc'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(p)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Edit product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

