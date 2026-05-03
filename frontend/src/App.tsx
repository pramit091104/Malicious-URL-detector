import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Search, Loader2, RefreshCw, AlertTriangle, ExternalLink, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTop10, setShowTop10] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      return saved || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply theme on initial load
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  function showCustomAlert(message: string) {
    const alertBox = document.createElement("div");
    alertBox.innerText = message;
    alertBox.style.position = "fixed";
    alertBox.style.top = "20px";
    alertBox.style.right = "20px";
    alertBox.style.background = "#16a34a";
    alertBox.style.color = "white";
    alertBox.style.padding = "12px 18px";
    alertBox.style.borderRadius = "10px";
    alertBox.style.zIndex = "9999";

    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
    }, 3000);
  }

  // Count frequency for top 10
  const top10 = React.useMemo(() => {
    const freq: Record<string, number> = {};
    history.forEach((u) => { freq[u] = (freq[u] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([u, count]) => ({ url: u, count }));
  }, [history]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setResult(null);

    // Add to history (most recent first, no duplicates)
    setHistory((prev) => [url, ...prev.filter((u) => u !== url)]);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (data.error) {
        console.error("Scan error from API:", data.error);
        showCustomAlert(data.error);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };


  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-100 ${theme === 'dark' ? 'bg-slate-900 text-slate-100 selection:bg-indigo-900' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* History and Top 10 Buttons */}
        <div className="flex justify-end gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}
            onClick={() => setShowHistory((v) => !v)}
            type="button"
          >
            History
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
            onClick={() => setShowTop10((v) => !v)}
            type="button"
          >
            Filter Top 10
          </button>
        </div>

        {/* History Dropdown */}
        {showHistory && (
          <div className={`absolute right-10 z-20 rounded-xl shadow-lg p-4 w-80 max-h-96 overflow-y-auto border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Previously Searched URLs</div>
            {history.length === 0 ? (
              <div className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No history yet.</div>
            ) : (
              <ul className="space-y-2">
                {history.map((h, i) => (
                  <li key={h + i} className="flex justify-between items-center">
                    <span className={`truncate max-w-[180px] text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{h}</span>
                    <button
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      onClick={() => { setUrl(h); setShowHistory(false); }}
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Top 10 Dropdown */}
        {showTop10 && (
          <div className={`absolute right-40 z-20 rounded-xl shadow-lg p-4 w-80 max-h-96 overflow-y-auto border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Top 10 Most Searched</div>
            {top10.length === 0 ? (
              <div className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No data yet.</div>
            ) : (
              <ul className="space-y-2">
                {top10.map((item, i) => (
                  <li key={item.url + i} className="flex justify-between items-center">
                    <span className={`truncate max-w-[140px] text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{item.url}</span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.count} times</span>
                    <button
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-2"
                      onClick={() => { setUrl(item.url); setShowTop10(false); }}
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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

        {/* Results Section */}
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

        {/* Empty State */}
        {!result && !isScanning && (
          <div className="max-w-md mx-auto text-center py-20 opacity-40">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <Search className={`w-10 h-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Enter a URL above to begin the security audit.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`max-w-5xl mx-auto px-6 py-12 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
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