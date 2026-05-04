import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Search, Loader2, RefreshCw, AlertTriangle, ExternalLink, Moon, Sun, History, X, Clock, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import LetterGlitch from './components/LetterGlitch';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    prediction: number;
    label?: string;
    rawScore?: number;
    features: any;
  } | null>(null);
  const [history, setHistory] = useState<{ url: string; label: number; created_at: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTop10, setShowTop10] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      return saved || 'light';
    }
    return 'light';
  });

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply theme on initial load
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    fetchHistory();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  function showCustomAlert(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const alertBox = document.createElement("div");
    
    // Define icons for different alert types
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ"
    };
    
    alertBox.innerHTML = `<span style="margin-right: 8px; font-weight: bold;">${icons[type]}</span>${message}`;
    alertBox.style.position = "fixed";
    alertBox.style.top = "20px";
    alertBox.style.right = "20px";
    alertBox.style.padding = "12px 18px";
    alertBox.style.borderRadius = "10px";
    alertBox.style.zIndex = "9999";
    alertBox.style.color = "white";
    alertBox.style.fontWeight = "500";
    alertBox.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    alertBox.style.display = "flex";
    alertBox.style.alignItems = "center";

    // Define colors and styles for different alert types
    const alertStyles = {
      success: {
        background: "#16a34a", // green-600
        borderLeft: "4px solid #15803d" // green-700
      },
      error: {
        background: "#dc2626", // red-600
        borderLeft: "4px solid #b91c1c" // red-700
      },
      warning: {
        background: "#d97706", // amber-600
        borderLeft: "4px solid #b45309" // amber-700
      },
      info: {
        background: "#2563eb", // blue-600
        borderLeft: "4px solid #1d4ed8" // blue-700
      }
    };

    const style = alertStyles[type];
    alertBox.style.background = style.background;
    alertBox.style.borderLeft = style.borderLeft;

    // Define dismiss timeout based on alert type
    const timeoutMap = {
      success: 3000,  // 3 seconds
      error: 5000,    // 5 seconds
      warning: 4000,  // 4 seconds
      info: 3000      // 3 seconds
    };

    const dismissTime = timeoutMap[type];

    // Add space-between to position close button on the right
    alertBox.style.justifyContent = "space-between";

    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.style.marginLeft = "12px";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.color = "white";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.padding = "0 4px";
    closeBtn.onclick = () => alertBox.remove();

    alertBox.appendChild(closeBtn);
    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
    }, dismissTime);
  }

  // Get unique recent scans for Top 10
  const recentTop10 = React.useMemo(() => {
    const unique = new Map<string, typeof history[0]>();
    history.forEach(item => {
      if (!unique.has(item.url)) {
        unique.set(item.url, item);
      }
    });
    return Array.from(unique.values()).slice(0, 10);
  }, [history]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (data.error) {
        console.error("Scan error from API:", data.error);
        showCustomAlert(data.error, 'error');
      } else {
        setResult(data);
        showCustomAlert('URL scanned successfully!', 'success');
        fetchHistory(); // Refresh history after scan
      }
    } catch (error) {
      console.error("Scan failed", error);
      showCustomAlert('Failed to connect to the server.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-100 transition-colors duration-500 relative ${theme === 'dark' ? 'bg-slate-950 text-slate-100 selection:bg-indigo-900' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* LetterGlitch Background */}
      <div className={cn(
        "fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000",
        theme === 'dark' ? "opacity-40" : "opacity-40"
      )}>
        <LetterGlitch
          glitchColors={theme === 'dark'
            ? ['#22c55e', '#16a34a', '#15803d'] 
            : ['#166534', '#14532d', '#064e3b']
          }
          glitchSpeed={100}
          centerVignette={false}
          outerVignette={theme === 'dark'}
          smooth={true}
          characters="01"
        />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'bg-slate-900/80 backdrop-blur-xl border-slate-800' : 'bg-white/80 backdrop-blur-xl border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className={`font-bold text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sentinel AI</h1>
              <p className={`text-[10px] uppercase tracking-widest font-semibold -mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Malicious URL Detector</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* History and Top 10 Buttons */}
        <div className="flex justify-end gap-3 mb-8">
          <button
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'}`}
            onClick={() => setShowHistory(true)}
            type="button"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${theme === 'dark' ? 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100'}`}
            onClick={() => setShowTop10((v) => !v)}
            type="button"
          >
            <Activity className="w-4 h-4" />
            Top 10 Recent
          </button>
        </div>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed right-0 top-0 bottom-0 w-full max-w-md z-50 shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-slate-900 border-l border-slate-800' : 'bg-white'}`}
              >
                <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                      <History className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Scan History</h3>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Your past security audits</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'text-slate-500'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <History className="w-12 h-12 mb-4" />
                      <p className="font-medium">No history yet</p>
                    </div>
                  ) : (
                    history.map((h, i) => (
                      <motion.div
                        key={h.url + h.created_at + i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`group p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${theme === 'dark' ? 'bg-slate-800/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                        onClick={() => { setUrl(h.url); setShowHistory(false); }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-mono truncate mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{h.url}</p>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                h.label === 1 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                              )}>
                                {h.label === 1 ? 'Malicious' : 'Safe'}
                              </span>
                              <span className={`text-[10px] flex items-center gap-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" />
                                {new Date(h.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Top 10 Grid */}
        <AnimatePresence>
          {showTop10 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-indigo-50/50 border-indigo-100'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Top 10 Recent Unique Scans</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {recentTop10.length === 0 ? (
                    <p className={`col-span-full text-center py-8 opacity-40 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No scans recorded yet.</p>
                  ) : (
                    recentTop10.map((item, i) => (
                      <motion.button
                        key={item.url + i}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setUrl(item.url); }}
                        className={`text-left p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                      >
                        <p className={`text-xs font-mono truncate mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.url}</p>
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md",
                          item.label === 1 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                        )}>
                          {item.label === 1 ? 'Malicious' : 'Safe'}
                        </span>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-extrabold mb-4 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Analyze URLs with <span className={`text-indigo-600 ${theme === 'dark' ? '' : ''}`}>AI Intelligence</span>
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Our hybrid system combines machine learning feature analysis with Gemini 1.5 Pro
            to identify phishing, malware, and suspicious web patterns.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleScan} className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className={`w-5 h-5 transition-colors group-focus-within:text-indigo-500 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://paypal-secure-login.com)"
              className={`w-full pl-14 pr-36 py-5 border-2 rounded-2xl shadow-sm focus:outline-none focus:ring-4 transition-all text-lg ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-400 focus:ring-indigo-400/10' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
            />
            <button
              type="submit"
              disabled={isScanning || !url}
              className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan URL'
              )}
            </button>
          </form>
          <div className={`mt-4 flex justify-center gap-6 text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Real-time Analysis</span>
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-500" /> ML Feature Extraction</span>
          </div>
        </div>

        {/* Empty State */}
        {!result && !isScanning && (
          <div className={`max-w-3xl mx-auto rounded-3xl border shadow-sm p-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                No scan results yet
              </h3>
              <p className={`max-w-xl mx-auto text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Enter a URL above to begin analysis. Once a scan completes, we will show threat details, confidence score, and detected features here.
              </p>
              <div className="mt-6 space-y-3 text-left text-sm">
                <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Try these examples:</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => setUrl('https://example.com')}
                    className="rounded-full border px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:text-indigo-300 dark:hover:bg-slate-700"
                  >
                    https://example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('http://phishing-site.example')}
                    className="rounded-full border px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-300 dark:hover:bg-slate-700"
                  >
                    http://phishing-site.example
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto space-y-6"
            >
              <div className={`p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="text-center mb-6">
                  <div className={cn(
                    "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
                    result.prediction > 0.7 ? "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" :
                      result.prediction > 0.3 ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                        "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {result.prediction > 0.7 ? <ShieldAlert className="w-10 h-10" /> :
                      result.prediction > 0.3 ? <AlertTriangle className="w-10 h-10" /> :
                        <ShieldCheck className="w-10 h-10" />}
                  </div>
                  <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {result.prediction > 0.7 ? 'Malicious' :
                      result.prediction > 0.3 ? 'Suspicious' :
                        'Likely Safe'}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Threat Probability Score</p>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${theme === 'dark' ? 'text-indigo-400 bg-indigo-900/50' : 'text-indigo-600 bg-indigo-200'}`}>
                        Confidence
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold inline-block ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {(result.prediction * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.prediction * 100}%` }}
                      className={cn(
                        "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000",
                        result.prediction > 0.7 ? "bg-rose-500" :
                          result.prediction > 0.3 ? "bg-amber-500" :
                            "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>

                <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>AI Analysis Details</h4>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className={`text-slate-500 ${theme === 'dark' ? 'text-slate-400' : ''}`}>Label</span>
                      <span className={cn("font-mono font-bold uppercase", result.prediction > 0.5 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>{result.label || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`text-slate-500 ${theme === 'dark' ? 'text-slate-400' : ''}`}>Danger Score</span>
                      <span className={cn("font-mono font-bold", result.prediction > 0.5 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>{((result.prediction || 0) * 100).toFixed(2)} / 100</span>
                    </div>
                  </div>

                  <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Core Indicators</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className={`text-slate-500 ${theme === 'dark' ? 'text-slate-400' : ''}`}>URL Length</span>
                      <span className={`font-mono font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{result.features.urlLength}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`text-slate-500 ${theme === 'dark' ? 'text-slate-400' : ''}`}>Subdomains</span>
                      <span className={`font-mono font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{result.features.subdomainCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`text-slate-500 ${theme === 'dark' ? 'text-slate-400' : ''}`}>HTTPS Protocol</span>
                      <span className={cn("font-medium", result.features.isHttps ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {result.features.isHttps ? 'Secure' : 'Insecure'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 dark:bg-slate-800 text-white p-6 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div className="max-w-[200px]">
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Target URL</p>
                    <p className="font-mono text-sm truncate">{url}</p>
                  </div>
                </div>
                <a
                  href={url.startsWith('http') ? url : `http://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                >
                  Visit
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className={`max-w-5xl mx-auto px-6 py-12 border-t relative z-10 ${theme === 'dark' ? 'border-slate-800/50 bg-slate-950/50' : 'border-slate-200 bg-[#F8FAFC]/50'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-bold">Sentinel AI v1.0</span>
          </div>
          <div className={`flex gap-8 text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">API Reference</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}