// Persistent Multi-Layer Data Engine for PARVATI BHANDI STORES
// Multi-Device Cloud Sync via Supabase + IndexedDB + LocalStorage + Node API

import { getSupabaseClient, getSupabaseConfig } from './supabase';

const BACKEND_BASE = '/api';

const STORAGE_KEYS = {
  USER: 'pbs_auth_user',
  SETTINGS: 'pbs_store_settings',
  PRODUCTS: 'pbs_products_v1',
  BILLS: 'pbs_bills_v1',
};

const formatDate = (d) => d.toISOString().split('T')[0];

// --- IndexedDB Permanent Storage Layer ---
const DB_NAME = 'ParvatiBhandiStores_DB';
const DB_VERSION = 1;

function openIDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bills')) {
        db.createObjectStore('bills', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function idbGetAll(storeName) {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(storeName, item) {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
  } catch (err) {
    console.warn('IDB put error', err);
  }
}

async function idbDelete(storeName, id) {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
  } catch (err) {
    console.warn('IDB delete error', err);
  }
}

async function syncLocalWithIDB(storeName, storageKey) {
  try {
    const idbItems = await idbGetAll(storeName);
    const localRaw = localStorage.getItem(storageKey);
    const localItems = localRaw ? JSON.parse(localRaw) : [];

    const mergedMap = new Map();
    (idbItems || []).forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
    (localItems || []).forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });

    const merged = Array.from(mergedMap.values());
    localStorage.setItem(storageKey, JSON.stringify(merged));
    merged.forEach(item => idbPut(storeName, item));
    return merged;
  } catch {
    const localRaw = localStorage.getItem(storageKey);
    return localRaw ? JSON.parse(localRaw) : [];
  }
}

export const api = {
  // Check whether cloud sync is active
  isCloudSyncActive: () => {
    return !!getSupabaseConfig();
  },

  // Authentication (Strictly Rahul / 787573)
  login: async (username, password) => {
    const cleanUser = username ? username.trim() : '';
    const cleanPass = password ? password.trim() : '';

    try {
      const res = await fetch(`${BACKEND_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
            return { success: true, user: data.user };
          }
        }
      }
    } catch {
      // Backend unavailable / Vercel fallback
    }

    if (cleanUser.toLowerCase() === 'rahul' && cleanPass === '787573') {
      const user = { username: 'Rahul', role: 'admin' };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return { success: true, user };
    }

    return { success: false, message: 'Invalid Staff Name or Password. Please try again.' };
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      if (!user) return null;
      const parsed = JSON.parse(user);
      if (parsed && parsed.username && parsed.username.toLowerCase() === 'rahul') {
        return parsed;
      }
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Products (Supabase Cloud Sync + Local Fallback)
  getProducts: async () => {
    // 1. Try Supabase Cloud Database (Multi-Device Sync)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Normalize fields
          const formatted = data.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price) || 0,
            category: item.category || 'General',
            unit: item.unit || 'pc',
            code: item.code || '',
            createdAt: item.created_at
          }));

          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(formatted));
          formatted.forEach(p => idbPut('products', p));
          return formatted;
        }
      } catch (err) {
        console.warn('Supabase fetch products error:', err);
      }
    }

    // 2. Try Node Express Backend
    try {
      const res = await fetch(`${BACKEND_BASE}/products`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const products = await res.json();
          if (Array.isArray(products) && products.length > 0) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            products.forEach(p => idbPut('products', p));
            return products;
          }
        }
      }
    } catch {
      // Offline fallback
    }

    // 3. Fallback to Local IndexedDB + LocalStorage
    return await syncLocalWithIDB('products', STORAGE_KEYS.PRODUCTS);
  },

  addProduct: async (productData) => {
    const newProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: productData.name.trim(),
      price: parseFloat(productData.price) || 0,
      category: productData.category || 'General',
      unit: productData.unit || 'pc',
      code: productData.code || `P${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Sync to Supabase Cloud Database
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').insert([
          {
            id: newProduct.id,
            name: newProduct.name,
            price: newProduct.price,
            category: newProduct.category,
            unit: newProduct.unit,
            code: newProduct.code,
            created_at: newProduct.createdAt
          }
        ]);
      } catch (err) {
        console.warn('Supabase insert product error:', err);
      }
    }

    // 2. Sync to Node Backend if reachable
    try {
      fetch(`${BACKEND_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      }).catch(() => {});
    } catch {}

    // 3. Save permanently to local storage & IndexedDB
    await idbPut('products', newProduct);
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const updated = [newProduct, ...current.filter(p => p.id !== newProduct.id)];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    return newProduct;
  },

  updateProduct: async (id, productData) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').update({
          name: productData.name,
          price: parseFloat(productData.price),
          category: productData.category,
          unit: productData.unit,
          code: productData.code
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update product error:', err);
      }
    }

    try {
      fetch(`${BACKEND_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      }).catch(() => {});
    } catch {}

    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const updated = current.map(p => p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    const updatedItem = updated.find(p => p.id === id);
    if (updatedItem) {
      await idbPut('products', updatedItem);
    }
    return updatedItem;
  },

  deleteProduct: async (id) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete product error:', err);
      }
    }

    try {
      fetch(`${BACKEND_BASE}/products/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    await idbDelete('products', id);
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  },

  // Bills & Sales (Supabase Cloud Sync + Local Fallback)
  getBills: async (filters = {}) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('bills').select('*').order('created_at', { ascending: false });
        if (filters.date) {
          query = query.eq('date', filters.date);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const formatted = data.map(b => ({
            id: b.id,
            billNumber: b.bill_number,
            date: b.date,
            time: b.time,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            items: b.items || [],
            subtotal: parseFloat(b.subtotal) || 0,
            discount: parseFloat(b.discount) || 0,
            total: parseFloat(b.total) || 0,
            paymentMode: b.payment_mode || 'Cash',
            notes: b.notes || '',
            createdAt: b.created_at
          }));

          localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(formatted));
          formatted.forEach(item => idbPut('bills', item));

          if (filters.month) {
            return formatted.filter(b => b.date && b.date.startsWith(filters.month));
          }
          return formatted;
        }
      } catch (err) {
        console.warn('Supabase fetch bills error:', err);
      }
    }

    let bills = await syncLocalWithIDB('bills', STORAGE_KEYS.BILLS);
    if (filters.date) {
      bills = bills.filter(b => b.date === filters.date);
    } else if (filters.month) {
      bills = bills.filter(b => b.date && b.date.startsWith(filters.month));
    }
    bills.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
    return bills;
  },

  createBill: async (billData) => {
    const todayStr = formatDate(new Date());
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentBills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');
    const billCountToday = currentBills.filter(b => b.date === todayStr).length + 1;
    const billNumber = `PBS-${todayStr.replace(/-/g, '').slice(2)}-${billCountToday.toString().padStart(3, '0')}`;

    const newBill = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      billNumber: billNumber,
      date: todayStr,
      time: timeStr,
      customerName: billData.customerName || 'Walk-in Customer',
      customerPhone: billData.customerPhone || '',
      items: billData.items.map(item => ({
        id: item.id || `custom_${Date.now()}`,
        name: item.name,
        originalPrice: item.originalPrice !== undefined ? item.originalPrice : item.price,
        billedPrice: item.billedPrice !== undefined ? item.billedPrice : item.price,
        qty: item.qty || 1,
        total: (item.billedPrice !== undefined ? item.billedPrice : item.price) * (item.qty || 1)
      })),
      subtotal: parseFloat(billData.subtotal) || 0,
      discount: parseFloat(billData.discount) || 0,
      total: parseFloat(billData.total) || 0,
      paymentMode: billData.paymentMode || 'Cash',
      notes: billData.notes || '',
      createdAt: new Date().toISOString()
    };

    // 1. Sync to Supabase Cloud Database
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('bills').insert([
          {
            id: newBill.id,
            bill_number: newBill.billNumber,
            date: newBill.date,
            time: newBill.time,
            customer_name: newBill.customerName,
            customer_phone: newBill.customerPhone,
            items: newBill.items,
            subtotal: newBill.subtotal,
            discount: newBill.discount,
            total: newBill.total,
            payment_mode: newBill.paymentMode,
            notes: newBill.notes,
            created_at: newBill.createdAt
          }
        ]);
      } catch (err) {
        console.warn('Supabase insert bill error:', err);
      }
    }

    // 2. Node Backend
    try {
      fetch(`${BACKEND_BASE}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      }).catch(() => {});
    } catch {}

    // 3. Save permanently to IndexedDB and LocalStorage
    await idbPut('bills', newBill);
    const updatedBills = [newBill, ...currentBills.filter(b => b.id !== newBill.id)];
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));

    return newBill;
  },

  // Sales Analytics (Daily & Monthly)
  getAnalytics: async (date, month) => {
    const targetDate = date || formatDate(new Date());
    const targetMonth = month || targetDate.slice(0, 7);

    // Fetch bills (uses Supabase if connected)
    const bills = await api.getBills();

    const dailyBills = bills.filter(b => b.date === targetDate);
    const dailyRevenue = dailyBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const dailyItemsSold = dailyBills.reduce((acc, b) => acc + (b.items ? b.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);

    const monthlyBills = bills.filter(b => b.date && b.date.startsWith(targetMonth));
    const monthlyRevenue = monthlyBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const monthlyItemsSold = monthlyBills.reduce((acc, b) => acc + (b.items ? b.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);

    const daysInMonthMap = {};
    monthlyBills.forEach(b => {
      if (!daysInMonthMap[b.date]) daysInMonthMap[b.date] = { date: b.date, revenue: 0, billsCount: 0 };
      daysInMonthMap[b.date].revenue += (b.total || 0);
      daysInMonthMap[b.date].billsCount += 1;
    });

    const products = await api.getProducts();

    return {
      targetDate,
      targetMonth,
      daily: {
        date: targetDate,
        revenue: dailyRevenue,
        billCount: dailyBills.length,
        itemsSold: dailyItemsSold,
        averageBill: dailyBills.length > 0 ? Math.round(dailyRevenue / dailyBills.length) : 0,
        bills: dailyBills
      },
      monthly: {
        month: targetMonth,
        revenue: monthlyRevenue,
        billCount: monthlyBills.length,
        itemsSold: monthlyItemsSold,
        averageBill: monthlyBills.length > 0 ? Math.round(monthlyRevenue / monthlyBills.length) : 0,
        dailyBreakdown: Object.values(daysInMonthMap).sort((a, b) => a.date.localeCompare(b.date)),
        topProducts: []
      },
      totalProductsCount: products.length
    };
  },

  // Auto-migrate local data to Supabase when connected
  migrateLocalToSupabase: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, message: 'Cloud database not configured' };

    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const bills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');

    let migratedProducts = 0;
    let migratedBills = 0;

    for (const p of products) {
      try {
        await supabase.from('products').upsert({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          unit: p.unit,
          code: p.code,
          created_at: p.createdAt || new Date().toISOString()
        });
        migratedProducts++;
      } catch {}
    }

    for (const b of bills) {
      try {
        await supabase.from('bills').upsert({
          id: b.id,
          bill_number: b.billNumber,
          date: b.date,
          time: b.time,
          customer_name: b.customerName,
          customer_phone: b.customerPhone,
          items: b.items,
          subtotal: b.subtotal,
          discount: b.discount,
          total: b.total,
          payment_mode: b.paymentMode,
          notes: b.notes,
          created_at: b.createdAt || new Date().toISOString()
        });
        migratedBills++;
      } catch {}
    }

    return { success: true, migratedProducts, migratedBills };
  },

  // Instant 1-Click Backup Export & Import (Instant Cross-Device Transfer)
  exportDataFile: () => {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const bills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');

    const backup = {
      store: "PARVATI BHANDI STORES",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      products,
      bills
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parvati_bhandi_backup_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importDataFile: async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.products)) {
        throw new Error('Invalid backup file format');
      }

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(data.bills || []));

      data.products.forEach(p => idbPut('products', p));
      (data.bills || []).forEach(b => idbPut('bills', b));

      // Also sync to Supabase if connected
      await api.migrateLocalToSupabase();

      return { success: true, count: data.products.length, billsCount: (data.bills || []).length };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
};
