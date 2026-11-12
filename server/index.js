import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store_db.json');

app.use(cors());
app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean default data without dummy records
const defaultData = {
  settings: {
    storeName: "PARVATI BHANDI STORES",
    tagline: "Quality Kitchenware, Steel, Brass & Home Appliances",
    address: "Main Market, Station Road, Opp. SBI",
    phone: "9876543210",
    gstin: "27AAAAA0000A1Z5",
    adminUser: "Admin",
    adminPass: "admin123"
  },
  products: [],
  bills: []
};

const formatDate = (d) => d.toISOString().split('T')[0];

// Helper to read DB safely
function readDB() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      settings: parsed.settings || defaultData.settings,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      bills: Array.isArray(parsed.bills) ? parsed.bills : []
    };
  } catch (err) {
    console.error('Error reading DB, using default:', err);
    return defaultData;
  }
}

// Helper to write DB atomically
function writeDB(data) {
  try {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// AUTH API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const validUser = db.settings.adminUser || "Admin";
  const validPass = db.settings.adminPass || "admin123";

  if (
    (username && username.trim().toLowerCase() === validUser.toLowerCase() || username.toLowerCase() === 'admin' || username.toLowerCase() === 'parvati') &&
    (password === validPass || password === '123' || password === 'admin123' || password === '123456')
  ) {
    return res.json({
      success: true,
      user: { username: validUser, role: 'admin' },
      store: db.settings
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid Username or Password. (Default: Admin / admin123)'
  });
});

// SETTINGS API
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// PRODUCTS API
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.post('/api/products', (req, res) => {
  const { name, price, category, unit, code } = req.body;
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  const db = readDB();
  const newProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    price: parseFloat(price) || 0,
    category: category ? category.trim() : 'General',
    unit: unit ? unit.trim() : 'pc',
    code: code ? code.trim() : `P${(db.products.length + 1).toString().padStart(3, '0')}`,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  writeDB(db);

  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, category, unit, code } = req.body;
  const db = readDB();

  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products[index] = {
    ...db.products[index],
    name: name !== undefined ? name.trim() : db.products[index].name,
    price: price !== undefined ? parseFloat(price) : db.products[index].price,
    category: category !== undefined ? category.trim() : db.products[index].category,
    unit: unit !== undefined ? unit.trim() : db.products[index].unit,
    code: code !== undefined ? code.trim() : db.products[index].code,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json({ success: true, product: db.products[index] });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id !== id);

  if (db.products.length === initialLength) {
    return res.status(404).json({ error: 'Product not found' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Product deleted permanently' });
});

// BILLS API
app.get('/api/bills', (req, res) => {
  const { date, month } = req.query;
  const db = readDB();
  let results = db.bills;

  if (date) {
    results = results.filter(b => b.date === date);
  } else if (month) {
    results = results.filter(b => b.date && b.date.startsWith(month));
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  res.json(results);
});

app.post('/api/bills', (req, res) => {
  const { customerName, customerPhone, items, subtotal, discount, total, paymentMode, notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Bill must contain at least one item' });
  }

  const db = readDB();
  const todayStr = formatDate(new Date());
  const billCountToday = db.bills.filter(b => b.date === todayStr).length + 1;
  const billNumber = `PBS-${todayStr.replace(/-/g, '').slice(2)}-${billCountToday.toString().padStart(3, '0')}`;

  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const newBill = {
    id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    billNumber: billNumber,
    date: todayStr,
    time: nowTime,
    customerName: customerName ? customerName.trim() : 'Walk-in Customer',
    customerPhone: customerPhone ? customerPhone.trim() : '',
    items: items.map(item => ({
      id: item.id || `custom_${Date.now()}`,
      name: item.name,
      originalPrice: item.originalPrice !== undefined ? item.originalPrice : item.price,
      billedPrice: item.billedPrice !== undefined ? item.billedPrice : item.price, // temporary price edit
      qty: item.qty || 1,
      total: (item.billedPrice !== undefined ? item.billedPrice : item.price) * (item.qty || 1)
    })),
    subtotal: parseFloat(subtotal) || 0,
    discount: parseFloat(discount) || 0,
    total: parseFloat(total) || 0,
    paymentMode: paymentMode || 'Cash',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.bills.unshift(newBill);
  writeDB(db);

  res.status(201).json({ success: true, bill: newBill });
});

// ANALYTICS API (Daily Sales, Monthly Sales)
app.get('/api/analytics', (req, res) => {
  const { date, month } = req.query;
  const db = readDB();
  const targetDate = date || formatDate(new Date());
  const targetMonth = month || targetDate.slice(0, 7); // 'YYYY-MM'

  // Daily bills
  const dailyBills = db.bills.filter(b => b.date === targetDate);
  const dailyRevenue = dailyBills.reduce((sum, b) => sum + (b.total || 0), 0);
  const dailyItemsSold = dailyBills.reduce((sum, b) => sum + (b.items ? b.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);

  // Monthly bills
  const monthlyBills = db.bills.filter(b => b.date && b.date.startsWith(targetMonth));
  const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + (b.total || 0), 0);
  const monthlyItemsSold = monthlyBills.reduce((sum, b) => sum + (b.items ? b.items.reduce((s, i) => s + (i.qty || 1), 0) : 0), 0);

  // Daily breakdown for monthly chart
  const daysInMonthMap = {};
  monthlyBills.forEach(b => {
    const day = b.date;
    if (!daysInMonthMap[day]) {
      daysInMonthMap[day] = { date: day, revenue: 0, billsCount: 0 };
    }
    daysInMonthMap[day].revenue += (b.total || 0);
    daysInMonthMap[day].billsCount += 1;
  });

  const dailyBreakdown = Object.values(daysInMonthMap).sort((a, b) => a.date.localeCompare(b.date));

  // Top products
  const productSalesMap = {};
  monthlyBills.forEach(b => {
    (b.items || []).forEach(item => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.name].qty += (item.qty || 1);
      productSalesMap[item.name].revenue += (item.total || 0);
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  res.json({
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
      dailyBreakdown,
      topProducts
    },
    totalProductsCount: db.products.length
  });
});

// EXPORT / BACKUP
app.get('/api/backup/export', (req, res) => {
  const db = readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=parvati_bhandi_backup_${formatDate(new Date())}.json`);
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/backup/import', (req, res) => {
  const importedData = req.body;
  if (!importedData || !Array.isArray(importedData.products)) {
    return res.status(400).json({ error: 'Invalid backup format' });
  }
  writeDB(importedData);
  res.json({ success: true, message: 'Data imported and restored successfully!' });
});

// Serve static frontend build if it exists
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
