import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Search, Loader2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SecurityReport {
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  attackType: string;
  indicators: string[];
  explanation: string;
  recommendation: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    prediction: number;
    features: any;
    report: SecurityReport | null;
  } | null>(null);
  const [isTraining, setIsTraining] = useState(false);

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
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      const res = await fetch('/api/retrain', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        alert("Model retrained successfully with " + data.samplesTrained + " samples!");
      } else {
        alert(data.error || "No training data available yet. Scan some URLs first!");
      }
    } catch (error) {
      console.error("Training failed", error);
    } finally {
      setIsTraining(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Sentinel AI</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 -mt-1">Malicious URL Detector</p>
            </div>
          </div>
          <button 
            onClick={handleRetrain}
            disabled={isTraining}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            {isTraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Retrain Model
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Analyze URLs with <span className="text-indigo-600">AI Intelligence</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Our hybrid system combines machine learning feature analysis with Gemini 1.5 Pro 
            to identify phishing, malware, and suspicious web patterns.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleScan} className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://paypal-secure-login.com)"
              className="w-full pl-14 pr-36 py-5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg"
            />
            <button
              type="submit"
              disabled={isScanning || !url}
              className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
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
          <div className="mt-4 flex justify-center gap-6 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Real-time Analysis</span>
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-500" /> ML Feature Extraction</span>
            <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-500" /> Gemini Threat Reporting</span>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Summary & Score */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="text-center mb-6">
                    <div className={cn(
                      "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
                      result.prediction > 0.7 ? "bg-rose-100 text-rose-600" : 
                      result.prediction > 0.3 ? "bg-amber-100 text-amber-600" : 
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {result.prediction > 0.7 ? <ShieldAlert className="w-10 h-10" /> : 
                       result.prediction > 0.3 ? <AlertTriangle className="w-10 h-10" /> : 
                       <ShieldCheck className="w-10 h-10" />}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {result.prediction > 0.7 ? 'Malicious' : 
                       result.prediction > 0.3 ? 'Suspicious' : 
                       'Likely Safe'}
                    </h3>
                    <p className="text-slate-400 text-sm">Threat Probability Score</p>
                  </div>

                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Confidence
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {(result.prediction * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100">
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

                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Core Indicators</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">URL Length</span>
                        <span className="font-mono font-medium">{result.features.urlLength}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subdomains</span>
                        <span className="font-mono font-medium">{result.features.subdomainCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">HTTPS Protocol</span>
                        <span className={cn("font-medium", result.features.isHttps ? "text-emerald-600" : "text-rose-600")}>
                          {result.features.isHttps ? 'Secure' : 'Insecure'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Report */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">AI Security Analysis</h3>
                    </div>
                    {result.report && (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border",
                        getRiskColor(result.report.riskLevel)
                      )}>
                        {result.report.riskLevel} Risk
                      </span>
                    )}
                  </div>

                  <div className="p-8">
                    {result.report ? (
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Threat Type</h4>
                          <p className="text-xl font-bold text-slate-900">{result.report.attackType}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detailed Explanation</h4>
                          <p className="text-slate-600 leading-relaxed">
                            {result.report.explanation}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detected Indicators</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.report.indicators.map((indicator, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-200">
                                {indicator}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Recommended Action</h4>
                          <p className="text-indigo-900 font-medium">
                            {result.report.recommendation}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
                        <p>Generating intelligence report...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ExternalLink className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Target URL</p>
                      <p className="font-mono text-sm truncate max-w-md">{url}</p>
                    </div>
                  </div>
                  <a 
                    href={url.startsWith('http') ? url : `http://${url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                  >
                    Visit Site
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!result && !isScanning && (
          <div className="max-w-md mx-auto text-center py-20 opacity-40">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Enter a URL above to begin the security audit.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-bold">Sentinel AI v1.0</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">API Reference</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
