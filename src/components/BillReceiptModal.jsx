import React, { useState, useRef } from 'react';
import { 
  X, Image as ImageIcon, MessageCircle, Phone, 
  CheckCircle2, Store, Sparkles, AlertCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';

export default function BillReceiptModal({ bill, onClose }) {
  const [downloadingPhoto, setDownloadingPhoto] = useState(false);
  const [photoSavedToast, setPhotoSavedToast] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState(bill?.customerPhone || '');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  const receiptRef = useRef(null);

  if (!bill) return null;

  // Format currency
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  // Format date to DD/MM/YYYY
  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return '';
    try {
      const [y, m, d] = isoDate.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return isoDate;
    }
  };

  // 1. DOWNLOAD PHOTO (INSTEAD OF PDF - ULTRA HIGH DEFINITION JPG/PNG)
  const handleDownloadPhoto = async () => {
    if (!receiptRef.current) return;
    setDownloadingPhoto(true);

    try {
      // Use html2canvas at 3x scale for crisp photo resolution
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fffdf5',
        logging: false,
        windowWidth: 800,
      });

      const image = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = image;
      const cleanBillNo = (bill.billNumber || 'Bill').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Parvati_Bhandi_Stores_${cleanBillNo}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setPhotoSavedToast(true);
      setTimeout(() => setPhotoSavedToast(false), 3500);
    } catch (err) {
      console.error('Failed to generate bill photo:', err);
      alert('Unable to generate photo. Please try again.');
    } finally {
      setDownloadingPhoto(false);
    }
  };

  // 2. SEND ON WHATSAPP & OPEN WHATSAPP (WITH EXACT AUTHENTIC SHOP DETAILS)
  const handleSendOnWhatsApp = () => {
    let rawPhone = phoneNumberInput.trim() || bill.customerPhone?.trim() || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setShowPhonePrompt(true);
      return;
    }

    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const itemsListText = (bill.items || [])
      .map((item, idx) => `${idx + 1}. *${item.name}* (नग: ${item.qty}) x रु.${item.billedPrice || item.price} = रु.${item.total}`)
      .join('\n');

    const whatsappMessage = 
`*थोरलीवाडीकर यांचे*
🚩 *पार्वती भांडी स्टोअर्स*
मेन रोड, अहमदपूर
मोबाईल: 7875739052, 8208945810
=============================
_आमच्याकडे संसार उपयोगी भांडे व नामांकित कंपनीचे कुकर व मिक्सर योग्य दरात मिळतील._
=============================
*बिल प्रत (BILL INVOICE)*
*बिल क्र.:* ${bill.billNumber}
*दिनांक:* ${formatDisplayDate(bill.date)} (${bill.time || ''})
*श्री.:* ${bill.customerName || 'सन्माननीय ग्राहक'}
${bill.customerPhone ? `*मोबाईल:* ${bill.customerPhone}\n` : ''}=============================
*खरेदी तपशील:*
${itemsListText}
=============================
*एकूण रक्कम:* रु. ${(bill.subtotal || 0).toFixed(2)}
${bill.discount > 0 ? `*सूट / डिस्काउंट:* -रु. ${(bill.discount || 0).toFixed(2)}\n` : ''}*एकूण देय रक्कम:* *रु. ${(bill.total || 0).toFixed(2)}*
*पेमेंट पद्धत:* ${bill.paymentMode || 'Cash'}
=============================
*नोट : एकदा विकलेला माल परत घेतला जाणार नाही.*
धन्यवाद! पुन्हा भेट द्या!`;

    const encodedText = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Modal Controls Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold text-sm uppercase tracking-wide">
              बिल तयार आहे • {bill.billNumber}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: 1. DOWNLOAD PHOTO | 2. SEND ON WHATSAPP */}
        <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row items-center gap-3">
          
          {/* OPTION 1: DOWNLOAD PHOTO (INSTEAD OF PDF) */}
          <button
            onClick={handleDownloadPhoto}
            disabled={downloadingPhoto}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 active:scale-95 text-white font-extrabold rounded-2xl shadow-md shadow-red-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all disabled:opacity-50"
          >
            {downloadingPhoto ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            <span>{downloadingPhoto ? 'फोटो तयार होत आहे...' : '📸 Download Photo (फोटो डाऊनलोड करा)'}</span>
          </button>

          {/* OPTION 2: SEND ON WHATSAPP */}
          <button
            onClick={handleSendOnWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 Send on WhatsApp (व्हॉट्सॲपवर पाठवा)</span>
          </button>

        </div>

        {/* Photo Downloaded Success Toast */}
        {photoSavedToast && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>✓ बिलाचा फोटो यशस्वीरित्या डाऊनलोड झाला! (Photo Saved)</span>
            </div>
          </div>
        )}

        {/* Customer Phone Prompt if not provided */}
        {showPhonePrompt && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-center gap-2">
            <span className="font-bold text-amber-900">व्हॉट्सॲप नंबर:</span>
            <input
              type="tel"
              placeholder="10 digit mobile no"
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value.replace(/\D/g, ''))}
              className="px-2.5 py-1.5 rounded-xl border border-amber-300 font-bold text-slate-900 text-xs w-36 bg-white"
            />
            <button
              onClick={handleSendOnWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              पाठवा
            </button>
          </div>
        )}

        {/* AUTHENTIC BILL DISPLAY (MODELED EXACTLY FROM USER'S BILL PAD PHOTO) */}
        <div className="p-3 sm:p-5 overflow-x-auto max-h-[65vh] overflow-y-auto">
          <div
            ref={receiptRef}
            className="w-full max-w-[500px] mx-auto bg-[#fffdf5] text-slate-900 font-sans border-4 border-red-600 shadow-md relative p-3 sm:p-4 rounded-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {/* Top Red Binding Strip Texture */}
            <div className="w-full h-2.5 bg-red-600 mb-2 -mt-1 rounded-xs"></div>

            {/* Bill Header (Exact colors & layout from photo) */}
            <div className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-200 p-2.5 sm:p-3 border border-amber-400 rounded-sm relative">
              
              {/* Top Subheader: Thoraliwadikar Yanche & Phone numbers */}
              <div className="flex items-start justify-between gap-1 text-[11px] sm:text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/30 border border-amber-600/40 flex items-center justify-center text-red-700 font-black text-xs">
                    🕉️
                  </div>
                  <div className="font-extrabold text-slate-900">
                    <span className="text-red-700">थोरलीवाडीकर</span>
                    <span className="text-slate-800 block text-[10px]">यांचे</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-red-700 text-xs sm:text-[13px] block">
                    मो. 7875739052,
                  </span>
                  <span className="font-extrabold text-red-700 text-xs sm:text-[13px] block">
                    8208945810
                  </span>
                </div>
              </div>

              {/* Main Store Brand Name in Bold Typography */}
              <div className="text-center my-1.5">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                  <span className="text-red-600 drop-shadow-[0_1.5px_1.5px_rgba(255,255,255,0.8)]">
                    पार्वती
                  </span>
                  <span className="text-sky-800 ml-2 drop-shadow-[0_1.5px_1.5px_rgba(255,255,255,0.8)]">
                    भांडी स्टोअर्स
                  </span>
                </h1>
                <p className="text-xs font-black text-amber-950 mt-1">
                  मेन रोड, अहमदपूर
                </p>
              </div>

              {/* Utensils Decorative Strip */}
              <div className="flex items-center justify-center gap-3 text-sm py-0.5 border-t border-b border-amber-400/60 my-1 text-slate-700">
                <span>🥘 कुकर</span>
                <span>•</span>
                <span>🍲 मिक्सर</span>
                <span>•</span>
                <span>🍽️ स्टील भांडी</span>
                <span>•</span>
                <span>🪔 तांबे-पितळ</span>
              </div>
            </div>

            {/* Blue Banner: Tagline */}
            <div className="bg-sky-900 text-white text-[10px] sm:text-[11.5px] font-bold text-center py-1.5 px-2 mt-1 shadow-xs leading-snug">
              आमच्याकडे संसार उपयोगी भांडे व नामांकित कंपनीचे कुकर व मिक्सर योग्य दरात मिळतील.
            </div>

            {/* Customer Name & Date Row (Exact lined style from bill pad) */}
            <div className="py-2.5 px-1 border-b-2 border-slate-700 text-xs flex flex-wrap items-center justify-between gap-y-1.5 font-bold">
              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <span className="text-slate-900 font-extrabold">श्री.</span>
                <span className="border-b border-dotted border-slate-700 flex-1 px-1 text-slate-900 font-bold">
                  {bill.customerName || 'सन्माननीय ग्राहक'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-slate-900">
                  <span>दि. </span>
                  <span className="border-b border-dotted border-slate-700 px-1">
                    {formatDisplayDate(bill.date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill Meta Sub-row (Bill number & Phone) */}
            <div className="px-1 py-1 text-[10px] font-bold text-slate-600 flex justify-between border-b border-slate-300">
              <span>बिल क्र.: <strong className="text-slate-900">{bill.billNumber}</strong></span>
              {bill.customerPhone && (
                <span>मोबाईल: <strong className="text-slate-900">{bill.customerPhone}</strong></span>
              )}
            </div>

            {/* Items Table (Classic Ruled Stationery Lined Pattern) */}
            <div className="my-2 border border-slate-700 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-100/70 border-b-2 border-slate-700 text-slate-900 font-black text-[11px]">
                    <th className="py-1.5 px-2 text-center w-10 border-r border-slate-700">अ.क्र.</th>
                    <th className="py-1.5 px-2 border-r border-slate-700">तपशील (Item)</th>
                    <th className="py-1.5 px-2 text-center w-12 border-r border-slate-700">नग</th>
                    <th className="py-1.5 px-2 text-right w-16 border-r border-slate-700">दर</th>
                    <th className="py-1.5 px-2 text-right w-20">रुपये</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-medium">
                  {(bill.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30">
                      <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 font-bold text-slate-900 border-r border-slate-700 leading-tight">
                        {item.name}
                        {item.billedPrice !== item.originalPrice && (
                          <span className="block text-[9px] text-amber-700 font-normal">
                            (सूट दर, मूळ: ₹{item.originalPrice})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800 border-r border-slate-700">
                        {item.qty}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700 border-r border-slate-700">
                        ₹{item.billedPrice || item.price}
                      </td>
                      <td className="py-2 px-2 text-right font-black text-slate-900">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows filler to match lined receipt pad appearance */}
                  {Array.from({ length: Math.max(0, 3 - (bill.items?.length || 0)) }).map((_, i) => (
                    <tr key={`filler-${i}`} className="h-6">
                      <td className="border-r border-slate-700"></td>
                      <td className="border-r border-slate-700"></td>
                      <td className="border-r border-slate-700"></td>
                      <td className="border-r border-slate-700"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total */}
            <div className="bg-amber-50/50 border border-slate-700 p-2.5 space-y-1.5 text-xs font-bold text-slate-800">
              <div className="flex justify-between">
                <span>एकूण (Subtotal):</span>
                <span>₹{(bill.subtotal || 0).toFixed(2)}</span>
              </div>

              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>सूट / डिस्काउंट:</span>
                  <span>-₹{(bill.discount || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-red-700 pt-1.5 border-t border-slate-700">
                <span>एकूण देय रक्कम (Total):</span>
                <span>{formatINR(bill.total)}</span>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600 pt-0.5 border-t border-dotted border-slate-400">
                <span>पेमेंट पद्धत:</span>
                <span className="font-bold text-slate-900">{bill.paymentMode || 'Cash'}</span>
              </div>
            </div>

            {/* Authentic Footer Note & Signature line from photo */}
            <div className="mt-3 pt-2 border-t-2 border-slate-700 flex items-center justify-between text-[11px] font-bold">
              <div className="text-red-700 font-extrabold max-w-[280px]">
                नोट : एकदा विकलेला माल परत घेतला जाणार नाही.
              </div>

              <div className="text-right">
                <div className="text-slate-800 font-extrabold">सही</div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  पार्वती भांडी स्टोअर्स
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            📸 फोटो डाऊनलोड करून ग्राहकाला पाठवता येईल
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            बंद करा (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
