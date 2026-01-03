
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Activity,
  Send,
  Database,
  BrainCircuit,
  Server,
  Wifi,
  WifiOff,
  Settings,
  Terminal,
  ChevronRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Incident, ChatMessage } from './types';
import { ollamaService } from './services/ollamaService';
import { IncidentCharts } from './components/IncidentCharts';

const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isOllamaRunning, setIsOllamaRunning] = useState<boolean | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkConn = async () => {
      const ok = await ollamaService.checkConnection();
      setIsOllamaRunning(ok);
      if (!ok) setShowGuide(true);
    };
    checkConn();
    const interval = setInterval(checkConn, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const parsedData: Incident[] = lines.slice(1).filter(l => l.trim() !== '').map((line, idx) => {
        const values = line.split(',');
        return {
          number: values[0]?.trim() || `INC${idx}`,
          short_description: values[1]?.trim() || 'No Description',
          service: values[2]?.trim() || 'General',
          api_endpoint: values[3]?.trim() || 'N/A',
          priority: values[4]?.trim() || 'P3',
          state: 'Resolved',
          created: new Date().toISOString(),
        };
      });
      setIncidents(parsedData);
      setShowGuide(false);
    };
    reader.readAsText(file);
  };

  const handleAsk = async (predefinedQuery?: string) => {
    const question = predefinedQuery || query;
    if (!question || incidents.length === 0) return;

    setAnalyzing(true);
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    setQuery('');

    try {
      const response = await ollamaService.analyzeIncidents(incidents, question);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `### ❌ Analysis Halted\n${error.message}` }]);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#161b22] border-r border-[#30363d] p-6 flex flex-col shadow-xl z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">ServiceNow</h1>
            <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em] uppercase">Incidents Predictor</p>
          </div>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto">
          {/* Connection Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Node Status</span>
              {isOllamaRunning ? (
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-bold border border-green-500/20 flex items-center gap-1">
                  <Wifi className="w-2 h-2" /> LOCAL_ONLINE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[9px] font-bold border border-red-500/20 flex items-center gap-1">
                  <WifiOff className="w-2 h-2" /> DISCONNECTED
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full flex items-center justify-between p-3 bg-white/5 border border-[#30363d] rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all group"
            >
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> Upload CSV</span>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
            
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center gap-2 p-3 text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              <HelpCircle className="w-4 h-4" /> Setup Instructions
            </button>
          </div>

          {/* Quick Tasks */}
          {incidents.length > 0 && (
            <div className="space-y-1">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">SRE Predictions</h2>
              {[
                { label: 'Forecast Future Failures', icon: Zap },
                { label: 'SLA Risk Audit', icon: ShieldCheck },
                { label: 'Critical Path Analysis', icon: Activity }
              ].map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleAsk(item.label)} 
                  className="w-full flex items-center gap-2 p-2 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/5 rounded-lg transition-all group"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-[#30363d]">
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase">
            <Server className="w-3 h-3" /> 127.0.0.1:11434
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0d1117] relative">
        <header className="h-16 bg-[#161b22]/80 backdrop-blur-md border-b border-[#30363d] px-8 flex items-center justify-between z-10">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            ServiceNow Incidents Predictor
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[10px] font-bold text-blue-500/80 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
               MODEL: DEEPSEEK-R1
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
          {showGuide && (
            <div className="max-w-2xl mx-auto mb-12 bg-blue-600/5 border border-blue-500/20 rounded-2xl p-8 space-y-4 shadow-2xl">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-500 animate-spin-slow" /> 
                Team Connection Required
              </h2>
              <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                <p>To use this predictor, teammates must have <strong>Ollama</strong> running locally:</p>
                <ol className="list-decimal list-inside space-y-2 font-mono text-[13px] bg-black/40 p-4 rounded-xl border border-[#30363d]">
                  <li>Install Ollama from <a href="https://ollama.com" className="text-blue-400 underline" target="_blank">ollama.com</a></li>
                  <li>Terminal 1: <code className="text-green-400">export OLLAMA_ORIGINS="*" && ollama serve</code></li>
                  <li>Terminal 2: <code className="text-green-400">ollama pull deepseek-r1</code></li>
                </ol>
                <p className="text-xs italic">The web interface will connect once it detects the local endpoint on port 11434.</p>
              </div>
            </div>
          )}

          {incidents.length === 0 ? (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20"></div>
                <Database className="w-20 h-20 text-slate-800 relative z-10" />
              </div>
              <div className="space-y-3 max-w-sm">
                <h3 className="text-2xl font-black text-white">System Standby</h3>
                <p className="text-sm text-slate-500">
                  Upload your <strong>CSV</strong> data to begin local reasoning. 
                  All analysis is performed privately on your node.
                </p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-blue-600/40 transition-all flex items-center gap-3 active:scale-95"
              >
                <Upload className="w-4 h-4" /> Initialize Analysis Session
              </button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Data Insights</h2>
                <p className="text-sm text-slate-500 italic">Historical data loaded. Predictive model is ready for queries.</p>
              </div>
              
              <IncidentCharts data={incidents} />

              <div className="bg-[#161b22] border border-[#30363d] rounded-3xl overflow-hidden flex flex-col shadow-2xl border-t-blue-500/30">
                <div className="flex-1 p-8 space-y-8 overflow-y-auto min-h-[450px]">
                  {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-10 py-20 pointer-events-none">
                       <Terminal className="w-16 h-16 mb-4" />
                       <p className="text-xs font-bold uppercase tracking-[0.5em]">Prediction Terminal Ready</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-6 rounded-3xl max-w-[85%] border shadow-lg ${
                          msg.role === 'user' 
                          ? 'bg-[#21262d] border-[#30363d] text-white rounded-br-none' 
                          : 'bg-[#0d1117] border-blue-500/10 text-slate-300 rounded-bl-none'
                        }`}>
                          <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-strong:text-blue-400 prose-code:text-green-400">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {analyzing && (
                    <div className="flex justify-start">
                      <div className="p-6 bg-[#0d1117] border border-blue-500/20 rounded-3xl rounded-bl-none flex items-center gap-4">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">R1 Analysis...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-[#1c2128] border-t border-[#30363d]">
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 relative">
                      <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                        placeholder="Ask R1: 'Which API is most likely to cause the next incident?'"
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 pl-6 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all shadow-inner"
                        disabled={analyzing}
                      />
                      <button 
                        onClick={() => handleAsk()}
                        disabled={!query.trim() || analyzing}
                        className="absolute right-3 top-2.5 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-20 transition-all flex items-center justify-center shadow-lg shadow-blue-600/20"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
