import React, { useState } from 'react';
import { 
  X, Download, Share2, Printer, CheckCircle, 
  Store, MessageCircle, Phone, Calendar, Clock, CreditCard
} from 'lucide-react';

export default function BillReceiptModal({ bill, onClose }) {
  const [copied, setCopied] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState(bill?.customerPhone || '');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  if (!bill) return null;

  // Format currency
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  // 1. DOWNLOAD BILL (Trigger Print / Save as PDF)
  const handleDownloadOrPrint = () => {
    window.print();
  };

  // 2. SEND ON WHATSAPP & OPEN WHATSAPP
  const handleSendOnWhatsApp = () => {
    let rawPhone = phoneNumberInput.trim() || bill.customerPhone?.trim() || '';
    
    // Clean phone number (strip non-digits)
    let cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setShowPhonePrompt(true);
      return;
    }

    // Append 91 if 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    // Generate formatted message text
    const itemsListText = (bill.items || [])
      .map((item, idx) => `${idx + 1}. *${item.name}* (Qty: ${item.qty}) - Rs.${item.billedPrice || item.price} = Rs.${item.total}`)
      .join('\n');

    const whatsappMessage = 
`*PARVATI BHANDI STORES* 🛍️
_पार्वती भांडी स्टोअर्स_
Quality Kitchenware, Steel & Brass Utensils
=============================
*INVOICE / BILL COPY*
*Bill No:* ${bill.billNumber}
*Date:* ${bill.date} (${bill.time || ''})
*Customer:* ${bill.customerName || 'Valued Customer'}
=============================
*ITEMS PURCHASED:*
${itemsListText}
=============================
*Subtotal:* Rs. ${(bill.subtotal || 0).toFixed(2)}
*Discount:* Rs. ${(bill.discount || 0).toFixed(2)}
*GRAND TOTAL:* *Rs. ${(bill.total || 0).toFixed(2)}*
*Payment Mode:* ${bill.paymentMode || 'Cash'}
=============================
धन्यवाद! भेट दिल्याबद्दल आभार!
Thank you for shopping with PARVATI BHANDI STORES!
Contact: +91 9876543210`;

    const encodedText = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    // Open WhatsApp directly
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Modal Controls Header */}
        <div className="no-print p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold text-sm uppercase tracking-wide">
              Bill Ready • {bill.billNumber}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TWO PRIMARY MANDATORY ACTION BUTTONS (At Top & Prominent for Mobile!) */}
        <div className="no-print p-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row items-center gap-3">
          
          {/* OPTION 1: DOWNLOAD BILL */}
          <button
            onClick={handleDownloadOrPrint}
            className="w-full sm:flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Bill (PDF/Print)</span>
          </button>

          {/* OPTION 2: SEND ON WHATSAPP */}
          <button
            onClick={handleSendOnWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

        </div>

        {/* Optional Phone Number Prompt if customer phone is missing */}
        {showPhonePrompt && (
          <div className="no-print p-3 bg-amber-50 border-b border-amber-200 text-xs flex items-center gap-2">
            <span className="font-bold text-amber-800">Enter WhatsApp No:</span>
            <input
              type="tel"
              placeholder="10 digit phone number"
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value.replace(/\D/g, ''))}
              className="px-2.5 py-1 rounded-lg border border-amber-300 font-bold text-slate-900 text-xs w-36"
            />
            <button
              onClick={handleSendOnWhatsApp}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold"
            >
              Open
            </button>
          </div>
        )}

        {/* PRINTABLE RECEIPT CONTENT (Styled for Thermal & A4) */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white text-slate-900 font-sans">
          
          {/* Receipt Store Branding */}
          <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              PARVATI BHANDI STORES
            </h2>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              पार्वती भांडी स्टोअर्स
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Main Market, Station Road, Opp. SBI
            </p>
            <p className="text-[11px] font-semibold text-slate-600">
              Tel: +91 9876543210 • GSTIN: 27AAAAA0000A1Z5
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-200 text-xs space-y-1">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Bill No: {bill.billNumber}</span>
              <span>{bill.date}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Customer: <strong>{bill.customerName || 'Walk-in Customer'}</strong></span>
              <span>{bill.time}</span>
            </div>
            {bill.customerPhone && (
              <div className="text-slate-500 text-[11px]">
                Mobile / WhatsApp: +91 {bill.customerPhone}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Rate</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(bill.items || []).map((item, idx) => (
                  <tr key={idx} className="py-1.5">
                    <td className="py-1.5 font-semibold text-slate-800 pr-2">
                      <div>{item.name}</div>
                      {item.billedPrice !== item.originalPrice && (
                        <div className="text-[9px] text-amber-600 font-medium">
                          (Special Rate, Base: ₹{item.originalPrice})
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-center text-slate-700 font-bold">
                      {item.qty}
                    </td>
                    <td className="py-1.5 text-right text-slate-700">
                      ₹{item.billedPrice || item.price}
                    </td>
                    <td className="py-1.5 text-right font-bold text-slate-900">
                      ₹{item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Calculation Summary */}
          <div className="pt-3 border-t-2 border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{(bill.subtotal || 0).toFixed(2)}</span>
            </div>

            {bill.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount:</span>
                <span>-₹{(bill.discount || 0).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>NET PAYABLE:</span>
              <span className="text-emerald-700 font-black">
                {formatINR(bill.total)}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Payment Mode:</span>
              <span className="font-semibold text-slate-700">{bill.paymentMode || 'Cash'}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-5 pt-3 border-t border-dashed border-slate-200 text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">
              धन्यवाद! भेट दिल्याबद्दल आभार!
            </p>
            <p className="text-[10px] text-slate-500">
              Goods once sold can be exchanged within 7 days with this bill copy.
            </p>
            <p className="text-[9px] text-slate-400 font-mono">
              PARVATI BHANDI STORES SMART POS
            </p>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Saved permanently in database
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
}

