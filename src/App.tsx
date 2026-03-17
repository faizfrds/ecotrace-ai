/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, 
  Zap, 
  Droplets,
  Cloud, 
  BarChart3, 
  Code2, 
  History, 
  Send, 
  Trash2,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { EnvironmentalTrace, LEAFTRAIL_CONSTANTS } from './services/ecoTraceService';
import { Leaftrail } from '@faizfrds/leaftrail';
import { calculateDashboardStats, formatNumber, integrationSnippet } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/Login';
import Projects from './components/Projects';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [traces, setTraces] = useState<EnvironmentalTrace[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'playground' | 'projects' | 'integration'>('dashboard');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('us-central1');
  const [hubApiKey, setHubApiKey] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error' | 'misconfigured'>('checking');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    
    const fetchKey = async () => {
      const { data } = await supabase.from('api_keys').select('key_hash').limit(1);
      if (data && data.length > 0) setHubApiKey(data[0].key_hash);
    };
    fetchKey();
  }, [session]);

  const leaftrailClient = useMemo(() => {
    const hubUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3001';
    const endpoint = hubUrl.endsWith('/') ? `${hubUrl}api/v1/traces` : `${hubUrl}/api/v1/traces`;

    return new Leaftrail({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      region: selectedRegion,
      ecoTrace: hubApiKey ? {
        endpoint,
        apiKey: hubApiKey
      } : undefined
    });
  }, [selectedRegion, hubApiKey]);

  const stats = useMemo(() => calculateDashboardStats(traces), [traces]);

  const chartData = useMemo(() => {
    return traces.map((t, i) => ({
      name: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : `Call ${i + 1}`,
      carbon: t.carbonKg,
      water: t.waterLiters,
      energy: t.energyKWh,
      tokens: t.tokens
    }));
  }, [traces]);

  useEffect(() => {
    if (!session) return;

    const fetchTraces = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_URL || 'http://localhost:3001'}/api/v1/traces`);
        const data = await response.json();
        
        // Map DB fields to UI interface
        const mappedTraces: EnvironmentalTrace[] = data.map((d: any) => ({
          tokens: d.tokens_used,
          energyKWh: d.energy_kwh,
          carbonKg: d.carbon_kg,
          waterLiters: d.water_liters,
          region: d.region,
          timestamp: new Date(d.created_at).getTime(),
          prompt: d.metadata?.prompt || 'External API Call'
        }));
        
        setTraces(mappedTraces);
      } catch (err) {
        console.error("Failed to fetch traces:", err);
      }
    };

    fetchTraces();
    const interval = setInterval(fetchTraces, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const hubUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3001';
        const res = await fetch(`${hubUrl.endsWith('/') ? hubUrl : hubUrl + '/'}api/v1/debug`);
        const data = await res.json();
        if (data.supabaseServiceKey === 'Wrong Key (Publishable)') {
          setBackendStatus('misconfigured');
        } else {
          setBackendStatus('connected');
        }
      } catch (e) {
        setBackendStatus('error');
      }
    };
    checkBackend();
  }, []);

  if (!session) {
    return <Login />;
  }

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { response, trace } = await leaftrailClient.generateContent(prompt);
      const newTrace: EnvironmentalTrace = {
        ...trace,
        timestamp: Date.now(),
        prompt: prompt
      };
      setTraces(prev => [...prev, newTrace]);
      setLastResponse(response.text || "No response text.");
      setPrompt('');
    } catch (error) {
      console.error("Trace failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setTraces([]);
    setLastResponse(null);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
  };


  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">EcoTrace AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Powered by Leaftrail</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {(['dashboard', 'playground', 'projects', 'integration'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Hub Status Pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            backendStatus === 'connected' ? 'bg-emerald-50 border-emerald-100' : 
            backendStatus === 'misconfigured' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 
              backendStatus === 'misconfigured' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              backendStatus === 'connected' ? 'text-emerald-600' : 
              backendStatus === 'misconfigured' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {backendStatus === 'connected' ? 'Hub Live' : 
               backendStatus === 'misconfigured' ? 'Hub Config Error' : 'Hub Offline'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 mr-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Region:</span>
            <select 
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-emerald-600"
            >
              {Object.keys(LEAFTRAIL_CONSTANTS.REGION_CFE_DATA).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Sign Out
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button 
            onClick={clearHistory}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            title="Clear History"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={<Cloud className="text-blue-500" />}
                  label="Carbon Footprint"
                  value={formatNumber(stats.totalCarbon)}
                  unit="kg CO2e"
                  description="Estimated greenhouse gas emissions"
                  color="blue"
                />
                <StatCard 
                  icon={<Droplets className="text-cyan-500" />}
                  label="Water Usage"
                  value={formatNumber(stats.totalWater)}
                  unit="Liters"
                  description="Cooling & generation water consumption"
                  color="cyan"
                />
                <StatCard 
                  icon={<Zap className="text-amber-500" />}
                  label="Electricity"
                  value={formatNumber(stats.totalElectricity)}
                  unit="kWh"
                  description="Total energy consumed by inference"
                  color="amber"
                />
                <StatCard 
                  icon={<BarChart3 className="text-emerald-500" />}
                  label="Total Tokens"
                  value={stats.totalTokens.toLocaleString()}
                  unit="Tokens"
                  description="Total processed across all calls"
                  color="emerald"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-lg font-bold">Environmental Impact Over Time</h2>
                      <p className="text-sm text-gray-500">Cumulative trace of carbon and water usage</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-gray-600">Carbon</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                        <span className="text-xs font-medium text-gray-600">Water</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="carbon" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorCarbon)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="water" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorWater)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm flex flex-col">
                  <h2 className="text-lg font-bold mb-2">Recent Activity</h2>
                  <p className="text-sm text-gray-500 mb-6">Latest API calls and their footprint</p>
                  
                  <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {traces.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <History className="text-gray-300 mb-2" size={32} />
                        <p className="text-sm text-gray-400">No traces recorded yet</p>
                      </div>
                    ) : (
                      [...traces].reverse().map((trace, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                {new Date(trace.timestamp).toLocaleTimeString()}
                              </span>
                              <span className="text-[9px] font-medium text-gray-400 uppercase">{trace.region}</span>
                            </div>
                            <span className="text-[10px] font-medium text-gray-400">
                              {trace.tokens} tokens
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1 mb-3 italic">"{trace.prompt}"</p>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1">
                              <Cloud size={12} className="text-emerald-500" />
                              <span className="text-xs font-bold">{formatNumber(trace.carbonKg, 5)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Droplets size={12} className="text-blue-500" />
                              <span className="text-xs font-bold">{formatNumber(trace.waterLiters, 5)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="max-w-xl">
                    <h3 className="text-2xl font-bold mb-2">Why EcoTrace Matters?</h3>
                    <p className="text-emerald-100/80 text-sm leading-relaxed">
                      AI inference requires massive amounts of energy and water for cooling. By monitoring these metrics, 
                      developers can optimize prompts, choose efficient models, and offset their carbon footprint. 
                      Transparency is the first step toward sustainable innovation.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('integration')}
                    className="px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                  >
                    Start Integrating <ChevronRight size={18} />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-700 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-30" />
              </div>
            </motion.div>
          )}

          {activeTab === 'playground' && (
            <motion.div 
              key="playground"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Send className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Trace Playground</h2>
                    <p className="text-sm text-gray-500">Test Gemini API calls and see real-time impact tracing</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a prompt to analyze its environmental footprint..."
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSend}
                      disabled={loading || !prompt.trim()}
                      className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                        loading || !prompt.trim()
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Tracing...
                        </>
                      ) : (
                        <>
                          Run Trace <Send size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {lastResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <BarChart3 size={18} className="text-emerald-500" />
                      Trace Result
                    </h3>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Carbon</p>
                        <p className="text-sm font-bold text-emerald-600">{formatNumber(traces[traces.length - 1]?.carbonKg || 0, 6)} kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Water</p>
                        <p className="text-sm font-bold text-blue-500">{formatNumber(traces[traces.length - 1]?.waterLiters || 0, 6)} L</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Energy</p>
                        <p className="text-sm font-bold text-blue-500">{formatNumber(traces[traces.length - 1]?.energyKWh || 0, 6)} kWh</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Tokens</p>
                        <p className="text-sm font-bold text-blue-500">{formatNumber(traces[traces.length - 1]?.tokens || 0, 1)} tokens</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{lastResponse}</p>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leaftrail Implementation Mockup</h4>
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">@faizfrds/leaftrail-js</span>
                    </div>
                    <div className="bg-[#1E1E1E] rounded-2xl p-6 font-mono text-[11px] text-emerald-400/90 overflow-x-auto border border-white/5 shadow-inner">
                      <pre className="leading-relaxed">
{`import { Leaftrail } from '@faizfrds/leaftrail-js';

const tracer = new Leaftrail({ 
  apiKey: '••••••••',
  region: '${selectedRegion}' 
});

const { response, trace } = await tracer.generateContent("${traces[traces.length - 1]?.prompt || 'Your prompt here'}");

console.log(trace);
/*
{
  tokens: ${traces[traces.length - 1]?.tokens || 0},
  region: "${traces[traces.length - 1]?.region || selectedRegion}",
  carbonKg: ${traces[traces.length - 1]?.carbonKg || 0},
  waterLiters: ${traces[traces.length - 1]?.waterLiters || 0},
  energyKWh: ${traces[traces.length - 1]?.energyKWh || 0}
}
*/`}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto py-8"
            >
              <Projects />
            </motion.div>
          )}

          {activeTab === 'integration' && (
            <motion.div 
              key="integration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-emerald-100 rounded-2xl mb-2">
                  <Code2 className="text-emerald-600" size={32} />
                </div>
                <h2 className="text-3xl font-bold">Integrate EcoTrace</h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                  Add environmental transparency to your existing AI applications with just a few lines of code.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Zap className="text-blue-500" size={20} />
                  </div>
                  <h4 className="font-bold">Real-time Monitoring</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Trace every inference call as it happens. Get granular data on energy, water, and carbon.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="text-emerald-500" size={20} />
                  </div>
                  <h4 className="font-bold">Reporting & Compliance</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Generate sustainability reports for stakeholders and regulatory requirements.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Leaf className="text-amber-500" size={20} />
                  </div>
                  <h4 className="font-bold">Carbon Offsetting</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Automatically calculate required offsets based on actual application usage.
                  </p>
                </div>
              </div>

              <div className="bg-[#1E1E1E] rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-6 py-3 bg-[#2D2D2D] flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">TypeScript Integration</span>
                </div>
                <div className="p-8 font-mono text-sm overflow-x-auto">
                   <pre className="text-emerald-400">
                    <code>{integrationSnippet(hubApiKey || 'YOUR_PROJECT_API_KEY')}</code>
                  </pre>
                </div>
              </div>

              <div className="flex justify-center">
                <button href="https://www.npmjs.com/package/@faizfrds/leaftrail" target="_blank" className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  View Documentation <ExternalLink size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-black/5 p-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Leaf className="text-emerald-500 w-5 h-5" />
            <span className="font-bold">EcoTrace AI</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="https://github.com/faizfrds/ecotrace-ai" className="hover:text-emerald-600 transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/@faizfrds/leaftrail" className="hover:text-emerald-600 transition-colors">npm</a>
          </div>
          <p className="text-xs text-gray-400">Faiz Firdaus - 2026. Built for a sustainable future.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, unit, description, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  unit: string,
  description: string,
  color: 'emerald' | 'blue' | 'amber' | 'cyan'
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${colorMap[color]}`}>
          {icon}
        </div>
        <Info size={14} className="text-gray-300 cursor-help" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          <span className="text-xs font-bold text-gray-400">{unit}</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
