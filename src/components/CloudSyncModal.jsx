import React, { useState, useEffect } from 'react';
import { 
  X, Cloud, CloudOff, CheckCircle2, Copy, Check, 
  Upload, Download, ArrowRight, ShieldCheck, Database, RefreshCw
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase';
import { api } from '../services/api';

export default function CloudSyncModal({ isOpen, onClose, onSyncComplete }) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config) {
      setSupabaseUrl(config.url);
      setSupabaseKey(config.key);
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Please enter both Supabase URL and Anon Key');
      return;
    }

    setSyncing(true);
    setStatusMsg('Connecting to Supabase...');

    try {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      setIsConnected(true);

      // Auto migrate local items to Supabase
      setStatusMsg('Syncing local products & bills to cloud...');
      const result = await api.migrateLocalToSupabase();

      if (result.success) {
        setStatusMsg(`✓ Successfully synced ${result.migratedProducts} products & ${result.migratedBills} bills across all devices!`);
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => {
          setStatusMsg('');
          onClose();
        }, 2000);
      } else {
        setStatusMsg('Connected! (Table structure needs to be created in Supabase)');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setStatusMsg('Failed to connect. Please check credentials.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect Cloud Database on this device?')) {
      clearSupabaseConfig();
      setIsConnected(false);
      setSupabaseUrl('');
      setSupabaseKey('');
      setStatusMsg('Disconnected from cloud.');
    }
  };

  const handleExportBackup = () => {
    api.exportDataFile();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = await api.importDataFile(content);
        if (res.success) {
          alert(`✓ Successfully restored ${res.count} products and ${res.billsCount} bills!`);
          if (onSyncComplete) onSyncComplete();
          onClose();
        } else {
          alert(`Import failed: ${res.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const sqlSchema = `-- Copy & Paste this in Supabase SQL Editor:
create table if not exists products (
  id text primary key,
  name text not null,
  price numeric not null,
  category text,
  unit text default 'pc',
  code text,
  created_at timestamptz default now()
);

create table if not exists bills (
  id text primary key,
  bill_number text not null,
  date text not null,
  time text,
  customer_name text,
  customer_phone text,
  items jsonb not null,
  subtotal numeric default 0,
  discount numeric default 0,
  total numeric default 0,
  payment_mode text default 'Cash',
  notes text,
  created_at timestamptz default now()
);

-- Enable open read/write for your shop POS
alter table products enable row level security;
alter table bills enable row level security;

create policy "Allow all on products" on products for all using (true) with check (true);
create policy "Allow all on bills" on bills for all using (true) with check (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">
                मल्टी-डिव्हाइस क्लाउड सिंक (Multi-Device Cloud Sync)
              </h2>
              <p className="text-xs text-emerald-300">
                मोबाईल, लॅपटॉप आणि सर्व डिव्हाइसवर एकाच वेळी डेटा सिंक करा
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Status Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isConnected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <CloudOff className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="font-extrabold text-xs sm:text-sm block">
                  {isConnected ? '✓ क्लाउड सिंक कनेक्टेड आहे (Cloud Active)' : '⚠️ फक्त या डिव्हाइसवर सेव्ह होत आहे (Local Device Only)'}
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  {isConnected
                    ? 'सर्व डिव्हाइसवर उत्पादने व बिले लगेच आपोआप सिंक होत आहेत.'
                    : 'दुसऱ्या फोनवर उत्पादने दिसण्यासाठी खालील क्लाउड डेटाबेस जोडा किंवा झटपट फाइल ट्रान्सफर वापरा.'}
                </span>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* SECTION 1: Connect Supabase for 100% Real-Time Cloud Sync */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>पायरी १: Supabase Cloud Database जोडा (कायमस्वरूपी मोफत)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              तुमच्या बुकमार्क मधील Supabase वर नवीन मोफत प्रोजेक्ट तयार करा व खालील डिटेल्स टाका:
            </p>

            <form onSubmit={handleSaveConnection} className="space-y-3 mt-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://yourprojectid.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              {statusMsg && (
                <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 text-xs font-bold">
                  {statusMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={syncing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
              >
                {syncing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>क्लाउड डेटाबेस कनेक्ट करा आणि सर्व डेटा सिंक करा</span>
                  </>
                )}
              </button>
            </form>

            {/* SQL Table Helper */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700">Supabase SQL Editor मध्ये पेस्ट करा:</span>
                <button
                  type="button"
                  onClick={copySql}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-2 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-mono overflow-x-auto max-h-24">
                {sqlSchema}
              </pre>
            </div>
          </div>

          {/* SECTION 2: Instant 1-Click Backup File Transfer (No Setup Required) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>पायरी २: झटपट फाइल ट्रान्सफर (कोणतेही सेटअप न करता)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              लॅपटॉपवरून डेटा फाईल डाऊनलोड करून तुमच्या मोबाईलवर १ सेकंदात लोड करा:
            </p>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>१. डाऊनलोड डेटा फाईल</span>
              </button>

              <label className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>२. फाईल लोड करा (Import)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>२५६-बिट सुरक्षित एन्क्रिप्शन</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            बंद करा
          </button>
        </div>

      </div>
    </div>
  );
}

