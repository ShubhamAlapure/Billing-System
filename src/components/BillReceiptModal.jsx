import React, { useState, useRef } from 'react';
import { 
  X, Image as ImageIcon, MessageCircle, 
  CheckCircle2, Sparkles, Palette, Share2, ClipboardCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';

export default function BillReceiptModal({ bill, onClose }) {
  // Theme state: 'classic' | 'royal' | 'modern'
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('pbs_bill_theme') || 'classic';
  });

  const [downloadingPhoto, setDownloadingPhoto] = useState(false);
  const [photoSavedToast, setPhotoSavedToast] = useState(false);
  const [sendingWhatsAppPhoto, setSendingWhatsAppPhoto] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState(bill?.customerPhone || '');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  const receiptRef = useRef(null);

  if (!bill) return null;

  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);
    localStorage.setItem('pbs_bill_theme', theme);
  };

  // Format currency in Indian format
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

  // 1. DOWNLOAD PHOTO (ULTRA HIGH-DEFINITION JPG CAPTURE)
  const handleDownloadPhoto = async () => {
    if (!receiptRef.current) return;
    setDownloadingPhoto(true);

    try {
      // 3x Scale for crystal-clear retina photo quality
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: selectedTheme === 'modern' ? '#ffffff' : (selectedTheme === 'royal' ? '#fffdf5' : '#fffdf0'),
        logging: false,
        windowWidth: 800,
      });

      const image = canvas.toDataURL('image/jpeg', 0.96);
      const link = document.createElement('a');
      link.href = image;
      const cleanBillNo = (bill.billNumber || 'Bill').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Parvati_Bhandi_Stores_${cleanBillNo}_${selectedTheme}.jpg`;
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

  // 2. SEND PHOTO DIRECTLY ON WHATSAPP (NO TEXT - PHOTO ONLY)
  const handleSendPhotoOnWhatsApp = async () => {
    if (!receiptRef.current) return;

    let rawPhone = phoneNumberInput.trim() || bill.customerPhone?.trim() || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setShowPhonePrompt(true);
      return;
    }

    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    setSendingWhatsAppPhoto(true);

    try {
      // Render bill DOM to Canvas at 3x resolution
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: selectedTheme === 'modern' ? '#ffffff' : (selectedTheme === 'royal' ? '#fffdf5' : '#fffdf0'),
        logging: false,
        windowWidth: 800,
      });

      const cleanBillNo = (bill.billNumber || 'Bill').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Parvati_Bhandi_Stores_Bill_${cleanBillNo}.png`;

      // Convert Canvas to Blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.98));
      if (!blob) throw new Error('Could not create bill image blob');

      const imageFile = new File([blob], fileName, { type: 'image/png' });

      // METHOD 1: Mobile & Supported Browser Native Share
      // This directly opens WhatsApp with the ACTUAL BILL PHOTO attached!
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try {
          await navigator.share({
            files: [imageFile],
            title: `पार्वती भांडी स्टोअर्स बिल ${bill.billNumber}`,
          });
          setSendingWhatsAppPhoto(false);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            setSendingWhatsAppPhoto(false);
            return;
          }
          console.warn('Native file share cancelled or failed, falling back to clipboard/download:', shareErr);
        }
      }

      // METHOD 2: Desktop / Web WhatsApp Mode
      // 1. Copy image to clipboard so the user can simply press Ctrl+V / Cmd+V in WhatsApp Web
      let copiedToClipboard = false;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copiedToClipboard = true;
          setClipboardNotice(true);
          setTimeout(() => setClipboardNotice(false), 7000);
        }
      } catch (clipErr) {
        console.warn('Clipboard write not allowed:', clipErr);
      }

      // 2. Also download the photo so it is saved in downloads/gallery
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 3. Open WhatsApp Web to the customer's chat
      const whatsappUrl = `https://wa.me/${cleanPhone}`;
      window.open(whatsappUrl, '_blank');

    } catch (err) {
      console.error('Error generating photo for WhatsApp:', err);
      alert('बिलाचा फोटो तयार करताना अडचण आली. कृपया "Download Photo" बटण वापरून फोटो डाऊनलोड करा.');
    } finally {
      setSendingWhatsAppPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Modal Controls Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold text-sm uppercase tracking-wide font-['Noto_Sans_Devanagari',sans-serif]">
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

        {/* 2-3 BACKGROUND / THEME SELECTION TABS */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 flex-shrink-0">
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>बिलाची थीम निवडा:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Option 1: Classic Ahmedpur Bill Pad */}
            <button
              onClick={() => handleSelectTheme('classic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                selectedTheme === 'classic'
                  ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>📜 1. पारंपारिक पावती (Classic)</span>
            </button>

            {/* Option 2: Royal Saffron & Gold */}
            <button
              onClick={() => handleSelectTheme('royal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                selectedTheme === 'royal'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm border border-orange-700 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>👑 2. शाही सुवर्ण (Royal)</span>
            </button>

            {/* Option 3: Modern Clean Minimalist */}
            <button
              onClick={() => handleSelectTheme('modern')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                selectedTheme === 'modern'
                  ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>✨ 3. मॉडर्न व्हाईट (Modern)</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons: DOWNLOAD PHOTO & SEND PHOTO ON WHATSAPP */}
        <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row items-center gap-3">
          
          {/* OPTION 1: DOWNLOAD PHOTO */}
          <button
            onClick={handleDownloadPhoto}
            disabled={downloadingPhoto || sendingWhatsAppPhoto}
            className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 active:scale-95 text-white font-extrabold rounded-2xl shadow-md shadow-red-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all disabled:opacity-50"
          >
            {downloadingPhoto ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            <span>{downloadingPhoto ? 'फोटो तयार होत आहे...' : '📸 Download Photo (गॅलरीमध्ये सेव्ह करा)'}</span>
          </button>

          {/* OPTION 2: SEND BILL PHOTO ON WHATSAPP (PHOTO ONLY) */}
          <button
            onClick={handleSendPhotoOnWhatsApp}
            disabled={sendingWhatsAppPhoto || downloadingPhoto}
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all disabled:opacity-50"
          >
            {sendingWhatsAppPhoto ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span>{sendingWhatsAppPhoto ? 'फोटो व्हॉट्सॲपवर पाठवत आहे...' : '💬 Send Photo on WhatsApp'}</span>
          </button>

        </div>

        {/* Desktop WhatsApp Photo Copy Notice */}
        {clipboardNotice && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <div>
                <span>📸 बिलाचा फोटो कॉपी झाला आहे!</span>
                <span className="block text-[11px] font-normal text-emerald-900 mt-0.5">
                  व्हॉट्सॲप चॅट उघडले आहे, तिथे फक्त <strong>Ctrl+V (किंवा Paste)</strong> करा आणि फोटो सेंड करा.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Photo Downloaded Success Toast */}
        {photoSavedToast && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>✓ बिलाचा फोटो यशस्वीरित्या डाऊनलोड झाला! (Photo Saved to Gallery)</span>
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
              onClick={handleSendPhotoOnWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              फोटो पाठवा
            </button>
          </div>
        )}

        {/* BILL RENDER CONTAINER - 3 DYNAMIC THEME OPTIONS */}
        <div className="p-3 sm:p-5 overflow-x-auto max-h-[65vh] overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* THEME 1: CLASSIC AHMEDPUR BILL PAD (पारंपारिक पिवळसर बिल बुक)           */}
          {/* ========================================================================= */}
          {selectedTheme === 'classic' && (
            <div
              ref={receiptRef}
              className="w-full max-w-[500px] mx-auto bg-[#fffdf0] text-slate-900 font-['Noto_Sans_Devanagari','Plus_Jakarta_Sans',sans-serif] border-4 border-red-600 shadow-md relative p-3 sm:p-4 rounded-xs"
            >
              {/* Top Red Texture Strip */}
              <div className="w-full h-2.5 bg-red-600 mb-2 -mt-1 rounded-xs"></div>

              {/* Bill Header */}
              <div className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-200 p-2.5 sm:p-3 border border-amber-400 rounded-xs relative">
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

                <div className="flex items-center justify-center gap-3 text-sm py-0.5 border-t border-b border-amber-400/60 my-1 text-slate-700 font-bold">
                  <span>🥘 कुकर</span>
                  <span>•</span>
                  <span>🍲 मिक्सर</span>
                  <span>•</span>
                  <span>🍽️ स्टील भांडी</span>
                  <span>•</span>
                  <span>🪔 तांबे-पितळ</span>
                </div>
              </div>

              {/* Blue Banner */}
              <div className="bg-sky-900 text-white text-[10.5px] sm:text-[11.5px] font-bold text-center py-1.5 px-2 mt-1 shadow-xs leading-snug">
                आमच्याकडे संसार उपयोगी भांडे व नामांकित कंपनीचे कुकर व मिक्सर योग्य दरात मिळतील.
              </div>

              {/* Customer Row */}
              <div className="py-2.5 px-1 border-b-2 border-slate-700 text-xs flex flex-wrap items-center justify-between gap-y-1.5 font-bold">
                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                  <span className="text-slate-900 font-extrabold">श्री.</span>
                  <span className="border-b border-dotted border-slate-700 flex-1 px-1 text-slate-900 font-bold">
                    {bill.customerName || 'सन्माननीय ग्राहक'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-900">दि. </span>
                  <span className="border-b border-dotted border-slate-700 px-1 font-bold">
                    {formatDisplayDate(bill.date)}
                  </span>
                </div>
              </div>

              {/* Bill Meta */}
              <div className="px-1 py-1 text-[10px] font-bold text-slate-600 flex justify-between border-b border-slate-300">
                <span>बिल क्र.: <strong className="text-slate-900">{bill.billNumber}</strong></span>
                {bill.customerPhone && (
                  <span>मोबाईल: <strong className="text-slate-900">{bill.customerPhone}</strong></span>
                )}
              </div>

              {/* Table */}
              <div className="my-2 border border-slate-700 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-100/80 border-b-2 border-slate-700 text-slate-900 font-black text-[11px]">
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

              {/* Calculations */}
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

              {/* Footer */}
              <div className="mt-3 pt-2 border-t-2 border-slate-700 flex items-center justify-between text-[11px] font-bold">
                <div className="text-red-700 font-extrabold max-w-[280px]">
                  नोट : एकदा विकलेला माल परत घेतला जाणार नाही.
                </div>
                <div className="text-right">
                  <div className="text-slate-800 font-extrabold">सही</div>
                  <div className="text-[10px] text-slate-500 font-semibold">पार्वती भांडी स्टोअर्स</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* THEME 2: ROYAL SAFFRON & GOLD (शाही सुवर्ण-भगवा थीम)                      */}
          {/* ========================================================================= */}
          {selectedTheme === 'royal' && (
            <div
              ref={receiptRef}
              className="w-full max-w-[500px] mx-auto bg-gradient-to-b from-[#fffef5] to-[#fff8eb] text-slate-900 font-['Noto_Sans_Devanagari','Plus_Jakarta_Sans',sans-serif] border-4 border-amber-600 shadow-xl relative p-3 sm:p-5 rounded-xl"
            >
              {/* Ornate Corner Accents */}
              <div className="absolute top-1 left-1 text-amber-500 text-xs">❖</div>
              <div className="absolute top-1 right-1 text-amber-500 text-xs">❖</div>
              <div className="absolute bottom-1 left-1 text-amber-500 text-xs">❖</div>
              <div className="absolute bottom-1 right-1 text-amber-500 text-xs">❖</div>

              {/* Royal Saffron Header */}
              <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-700 p-3 rounded-lg text-white text-center shadow-md border border-amber-400">
                <div className="flex items-center justify-between text-xs font-bold text-amber-100">
                  <span>🚩 थोरलीवाडीकर यांचे</span>
                  <span>📱 7875739052, 8208945810</span>
                </div>

                <div className="my-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-amber-100 tracking-tight drop-shadow-md">
                    पार्वती भांडी स्टोअर्स
                  </h1>
                  <p className="text-xs font-bold text-amber-200 mt-0.5 tracking-wider">
                    मेन रोड, अहमदपूर
                  </p>
                </div>

                <div className="bg-amber-950/40 rounded-md py-1 px-2 text-[11px] font-semibold text-amber-100 border border-amber-400/30">
                  आमच्याकडे संसार उपयोगी भांडे व नामांकित कंपनीचे कुकर व मिक्सर योग्य दरात मिळतील.
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="mt-3 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs font-bold text-amber-950 flex flex-wrap justify-between gap-y-1">
                <div>श्री. <span className="text-slate-900 font-extrabold">{bill.customerName || 'सन्माननीय ग्राहक'}</span></div>
                <div>दि. <span className="text-slate-900 font-extrabold">{formatDisplayDate(bill.date)}</span></div>
                <div className="w-full flex justify-between text-[10.5px] text-amber-900/80 pt-1 border-t border-amber-200/60 mt-1">
                  <span>बिल क्र.: <strong>{bill.billNumber}</strong></span>
                  {bill.customerPhone && <span>मो.: <strong>{bill.customerPhone}</strong></span>}
                </div>
              </div>

              {/* Table */}
              <div className="my-3 border-2 border-amber-400/80 rounded-lg overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-100 text-amber-950 font-black text-[11px] border-b border-amber-300">
                      <th className="py-2 px-2 text-center w-10 border-r border-amber-200">क्र.</th>
                      <th className="py-2 px-2 border-r border-amber-200">तपशील</th>
                      <th className="py-2 px-2 text-center w-12 border-r border-amber-200">नग</th>
                      <th className="py-2 px-2 text-right w-16 border-r border-amber-200">दर</th>
                      <th className="py-2 px-2 text-right w-20">रुपये</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 font-medium text-slate-800">
                    {(bill.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40">
                        <td className="py-2 px-2 text-center font-bold text-amber-900 border-r border-amber-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 font-bold text-slate-900 border-r border-amber-200">
                          {item.name}
                          {item.billedPrice !== item.originalPrice && (
                            <span className="block text-[9px] text-amber-700">
                              (सवलत दर, मूळ: ₹{item.originalPrice})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-bold border-r border-amber-200">
                          {item.qty}
                        </td>
                        <td className="py-2 px-2 text-right border-r border-amber-200">
                          ₹{item.billedPrice || item.price}
                        </td>
                        <td className="py-2 px-2 text-right font-black text-slate-900">
                          ₹{item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations */}
              <div className="p-3 rounded-lg bg-amber-50/90 border border-amber-300 space-y-1.5 text-xs font-bold text-amber-950">
                <div className="flex justify-between">
                  <span>उप-एकूण (Subtotal):</span>
                  <span>₹{(bill.subtotal || 0).toFixed(2)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>सूट / डिस्काउंट:</span>
                    <span>-₹{(bill.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-red-700 pt-2 border-t border-amber-300">
                  <span>एकूण देय रक्कम:</span>
                  <span>{formatINR(bill.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-900 pt-0.5 border-t border-amber-200">
                  <span>पेमेंट:</span>
                  <span>{bill.paymentMode || 'Cash'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t border-amber-300 flex items-center justify-between text-[11px] font-bold">
                <div className="text-red-700 font-extrabold max-w-[280px]">
                  नोट : एकदा विकलेला माल परत घेतला जाणार नाही.
                </div>
                <div className="text-right">
                  <div className="text-amber-950 font-extrabold">सही</div>
                  <div className="text-[10px] text-amber-800">पार्वती भांडी स्टोअर्स</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* THEME 3: MODERN CLEAN MINIMALIST (मॉडर्न प्रिमियम व्हाईट थीम)             */}
          {/* ========================================================================= */}
          {selectedTheme === 'modern' && (
            <div
              ref={receiptRef}
              className="w-full max-w-[500px] mx-auto bg-white text-slate-900 font-['Noto_Sans_Devanagari','Plus_Jakarta_Sans',sans-serif] border-2 border-slate-200 shadow-xl relative p-4 sm:p-6 rounded-2xl"
            >
              {/* Modern Brand Bar */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    थोरलीवाडीकर यांचे
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                    पार्वती भांडी स्टोअर्स
                  </h1>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    मेन रोड, अहमदपूर
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">संपर्क</span>
                  <span className="text-xs font-black text-slate-900 block">7875739052</span>
                  <span className="text-xs font-black text-slate-900 block">8208945810</span>
                </div>
              </div>

              <div className="bg-slate-50 text-slate-600 text-[10px] font-semibold text-center py-1 px-2 my-2 rounded-lg">
                आमच्याकडे संसार उपयोगी भांडे व नामांकित कंपनीचे कुकर व मिक्सर योग्य दरात मिळतील.
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ग्राहक (Customer)</span>
                  <span className="font-extrabold text-slate-900">{bill.customerName || 'Walk-in'}</span>
                  {bill.customerPhone && (
                    <span className="text-[10px] text-slate-500 block">📱 {bill.customerPhone}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">बिल तपशील</span>
                  <span className="font-extrabold text-slate-900">{bill.billNumber}</span>
                  <span className="text-[10px] text-slate-500 block">{formatDisplayDate(bill.date)} ({bill.time || ''})</span>
                </div>
              </div>

              {/* Table */}
              <div className="my-3 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">तपशील</th>
                      <th className="py-2.5 px-2 text-center w-12">नग</th>
                      <th className="py-2.5 px-3 text-right w-16">दर</th>
                      <th className="py-2.5 px-3 text-right w-20">रुपये</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {(bill.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.name}
                          {item.billedPrice !== item.originalPrice && (
                            <span className="block text-[9px] text-emerald-700 font-normal">
                              (Special Price, Base: ₹{item.originalPrice})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          ₹{item.billedPrice || item.price}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ₹{item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>₹{(bill.subtotal || 0).toFixed(2)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount:</span>
                    <span>-₹{(bill.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-700">
                  <span>NET PAYABLE:</span>
                  <span className="text-emerald-400">{formatINR(bill.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Payment Mode:</span>
                  <span className="text-slate-200 font-semibold">{bill.paymentMode || 'Cash'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>नोट : एकदा विकलेला माल परत घेतला जाणार नाही.</span>
                <span className="font-extrabold text-slate-800">सही</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            📸 बिलाचा फोटो थेट व्हॉट्सॲपवर पाठवला जाईल
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
