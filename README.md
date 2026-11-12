# PARVATI BHANDI STORES (पार्वती भांडी स्टोअर्स)
## Online POS & Smart Billing System

A modern, high-speed, mobile-first Billing & Inventory Management application designed specifically for **PARVATI BHANDI STORES** (Kitchenware, Stainless Steel, Brass, Copper & Home Appliances).

---

### 🌟 Key Features Implemented

1. **🔒 Secure Login at Beginning:**
   - Staff & Admin authentication screen requiring **Name** and **Password** before accessing billing or inventory.
   - Default credentials provided: `Admin` / `admin123` (or customizable).

2. **🏠 Landing Page with Zoho-Style Analytics:**
   - **Two Large Primary Core Options:**
     - ➕ **ADD PRODUCTS**: Quick catalog management and item addition.
     - 🧾 **BILLING**: Immediate access to the mobile POS counter.
   - **Sales Analytics & Performance Dashboard** (Inspired by Zoho Billing reference):
     - **Daily Sales** vs **Monthly Sales** toggle.
     - Interactive **Day / Date Picker** to inspect sales on any specific day.
     - Metrics Cards: Net Revenue, Total Invoices, Items Sold, Average Bill Value.
     - Smooth SVG Revenue Curve Chart.
     - **Recent Bill Copies**: 1-click view, re-print, and re-share past receipts.

3. **📦 Add Products (Permanent Database Storage):**
   - Fields: **Product Name**, **Price (₹)**, Category, Unit, Item Code / Barcode.
   - **"Save Product"** button with instantaneous feedback.
   - **Permanent Storage Guarantee**: Stored both in the backend database (`data/store_db.json`) with atomic file writes and synchronized to browser IndexedDB / `localStorage`. Data persists across restarts, reloads, and device sleep.
   - Search, category filter pills, inline edit, and permanent delete controls.

4. **📱 BILLING Tab (Strictly Attractive Mobile App View):**
   - Mobile-first tactile UI optimized for smartphones, tablets, and POS terminals.
   - Fast item selector with search and category filters, plus "+ Custom Item" for non-catalog items.
   - **Item Row Layout:**
     - Item Name
     - In front: **Price (₹)**
     - In front of price: **"Edit Price"** button / inline quick override!
     - **Temporary Price Override**: Changes the price *only for that specific bill* without altering the master inventory catalog price.
   - Quantity stepper `[-]` `[Qty]` `[+]`.
   - Customer details: Name & WhatsApp Phone Number (+91 formatting).
   - **Give Discount Option**:
     - Toggle between Flat `₹` discount or `%` percentage discount.
     - Live deduction and savings indicator.
   - Payment Modes: Cash, UPI / GPay, Card, Udhar.

5. **🧾 Bill Ready Modal & Actions:**
   - Ultra-crisp branded thermal & standard invoice copy with store details, GSTIN, itemized table, and Marathi/English greeting.
   - **Two Mandatory Prominent Action Buttons:**
     1. **📥 Download Bill**: Prints or saves bill as PDF/receipt.
     2. **💬 Send on WhatsApp**: Directly opens WhatsApp (`https://wa.me/91...`) preloaded with a polite, complete itemized bill message!

---

### 🚀 How to Run

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Full Stack (Frontend + Backend):**
   ```bash
   npm run start
   ```
   - Frontend available at: `http://localhost:5173`
   - Backend API available at: `http://localhost:5001`
   - Network URL (access on phone/tablet over WiFi): `http://<your-ip>:5173`

3. **Build for Production Deployment:**
   ```bash
   npm run build
   npm run server
   ```

