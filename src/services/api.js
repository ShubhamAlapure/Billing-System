// Persistent Multi-Layer Data Engine for PARVATI BHANDI STORES
// Dual Persistence: IndexedDB + LocalStorage + Backend API (when online)

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
  return new Promise((resolve, reject) => {
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
    request.onerror = () => {
      console.warn('IndexedDB open error, falling back to LocalStorage', request.error);
      resolve(null);
    };
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

// Reconcile and synchronize LocalStorage with IndexedDB
async function syncLocalWithIDB(storeName, storageKey) {
  try {
    const idbItems = await idbGetAll(storeName);
    const localRaw = localStorage.getItem(storageKey);
    const localItems = localRaw ? JSON.parse(localRaw) : [];

    // Map by id to merge
    const mergedMap = new Map();
    (idbItems || []).forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
    (localItems || []).forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });

    const merged = Array.from(mergedMap.values());
    localStorage.setItem(storageKey, JSON.stringify(merged));

    // Ensure IndexedDB has all merged items
    merged.forEach(item => idbPut(storeName, item));
    return merged;
  } catch (err) {
    console.warn('Sync error:', err);
    const localRaw = localStorage.getItem(storageKey);
    return localRaw ? JSON.parse(localRaw) : [];
  }
}

export const api = {
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
      // Backend unavailable / Vercel static fallback
    }

    // Direct Credentials Validation: Name Rahul & Password 787573
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
      // Ensure only authorized user 'Rahul' stays logged in
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

  // Products (100% Permanent Persistence)
  getProducts: async () => {
    // 1. Try Backend API
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
      // Offline / Vercel fallback
    }

    // 2. Read and merge from IndexedDB & LocalStorage
    return await syncLocalWithIDB('products', STORAGE_KEYS.PRODUCTS);
  },

  addProduct: async (productData) => {
    let savedProduct = null;
    try {
      const res = await fetch(`${BACKEND_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          savedProduct = data.product;
        }
      }
    } catch {
      // Offline / Vercel
    }

    if (!savedProduct) {
      savedProduct = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: productData.name.trim(),
        price: parseFloat(productData.price) || 0,
        category: productData.category || 'General',
        unit: productData.unit || 'pc',
        code: productData.code || `P${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString()
      };
    }

    // Save permanently to both IndexedDB and LocalStorage
    await idbPut('products', savedProduct);

    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const updated = [savedProduct, ...current.filter(p => p.id !== savedProduct.id)];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    return savedProduct;
  },

  updateProduct: async (id, productData) => {
    try {
      await fetch(`${BACKEND_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    } catch {
      // Offline
    }

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
    try {
      await fetch(`${BACKEND_BASE}/products/${id}`, { method: 'DELETE' });
    } catch {
      // Offline
    }

    await idbDelete('products', id);

    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  },

  // Bills & Sales (100% Permanent Persistence)
  getBills: async (filters = {}) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${BACKEND_BASE}/bills${query ? `?${query}` : ''}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const bills = await res.json();
          if (Array.isArray(bills) && bills.length > 0) {
            localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
            bills.forEach(b => idbPut('bills', b));
            return bills;
          }
        }
      }
    } catch {
      // Fallback
    }

    let bills = await syncLocalWithIDB('bills', STORAGE_KEYS.BILLS);
    if (filters.date) {
      bills = bills.filter(b => b.date === filters.date);
    } else if (filters.month) {
      bills = bills.filter(b => b.date && b.date.startsWith(filters.month));
    }
    // Sort newest first
    bills.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
    return bills;
  },

  createBill: async (billData) => {
    let savedBill = null;
    try {
      const res = await fetch(`${BACKEND_BASE}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          savedBill = data.bill;
        }
      }
    } catch {
      // Offline / Vercel
    }

    if (!savedBill) {
      const todayStr = formatDate(new Date());
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const currentBills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');
      const billCountToday = currentBills.filter(b => b.date === todayStr).length + 1;
      const billNumber = `PBS-${todayStr.replace(/-/g, '').slice(2)}-${billCountToday.toString().padStart(3, '0')}`;

      savedBill = {
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
    }

    // Save permanently to IndexedDB and LocalStorage
    await idbPut('bills', savedBill);

    const currentBills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');
    const updatedBills = [savedBill, ...currentBills.filter(b => b.id !== savedBill.id)];
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));

    return savedBill;
  },

  // Sales Analytics (Daily & Monthly computed from permanent bills)
  getAnalytics: async (date, month) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (month) params.append('month', month);

      const res = await fetch(`${BACKEND_BASE}/analytics?${params.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.daily) return data;
        }
      }
    } catch {
      // Offline fallback
    }

    // Local permanent calculation
    const targetDate = date || formatDate(new Date());
    const targetMonth = month || targetDate.slice(0, 7);
    const bills = await syncLocalWithIDB('bills', STORAGE_KEYS.BILLS);

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

    const products = await syncLocalWithIDB('products', STORAGE_KEYS.PRODUCTS);

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
  }
};
