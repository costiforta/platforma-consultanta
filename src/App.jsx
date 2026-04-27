import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, TrendingUp, Calculator, MessageSquare, FileText, Sparkles, Loader2, ChevronRight, X, Edit3, Trash2, Download, Globe, Brain, Target, Wallet, BarChart3, Shield, Zap, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Eye, Copy, Check, Calendar, Clock, Home, GraduationCap, Plane, Heart, PiggyBank } from 'lucide-react';

// LocalStorage wrapper compatibil cu API window.storage din Claude
const storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v ? { key, value: v } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!prefix || k.startsWith(prefix)) keys.push(k);
    }
    return { keys, prefix };
  }
};

// AI helper — detectează dacă API e configurat
const callAI = async (messages, maxTokens = 2000) => {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages
      })
    });
    if (!response.ok) {
      const err = await response.json();
      if (response.status === 500 && err.error === 'API key not configured') {
        throw new Error('AI_NOT_CONFIGURED');
      }
      throw new Error(err.message || 'API error');
    }
    return await response.json();
  } catch(e) {
    if (e.message === 'AI_NOT_CONFIGURED') throw e;
    throw new Error(e.message || 'Eroare conexiune AI');
  }
};



const ASSUMPTIONS_DEFAULT = {
  fxRate: 5.0,
  inflation: 0.06,
  ulProducts: {
    'Leu Forte': { provider: 'Allianz Țiriac', risk: 'Agresiv', yield: 0.10, allocation: '90-100% acțiuni' },
    'Leu Dinamic': { provider: 'Allianz Țiriac', risk: 'Moderat-Agresiv', yield: 0.08, allocation: '60-80% acțiuni' },
    'Leu Clasic': { provider: 'Allianz Țiriac', risk: 'Moderat', yield: 0.05, allocation: '30-50% acțiuni' },
    'Leu Simplu': { provider: 'Allianz Țiriac', risk: 'Conservator', yield: 0.03, allocation: 'monetar' },
    'NB Aktien Global R': { provider: 'Signal Iduna', risk: 'Agresiv', yield: 0.10, allocation: '100% acțiuni globale' },
    'NB Aktien Europe': { provider: 'Signal Iduna', risk: 'Agresiv', yield: 0.08, allocation: '100% acțiuni Europa' },
    'Sifi USA': { provider: 'Signal Iduna', risk: 'Agresiv', yield: 0.11, allocation: '100% S&P 500' },
    'ROTX (BT)': { provider: 'Signal Iduna + BT', risk: 'Moderat-Agresiv', yield: 0.09, allocation: 'Top 10 BVB' }
  },
  markets: {
    'BVB BET': 0.09, 'S&P 500': 0.10, 'NASDAQ 100': 0.13, 'MSCI World': 0.09,
    'Emerging Markets': 0.07, 'Tezaur RO': 0.065, 'Depozit bancar': 0.06,
    'Imobiliare chirie': 0.055, 'Imobiliare apreciere': 0.04, 'Aur': 0.065
  }
};

export default function PlatformaConsultanta() {
  const [view, setView] = useState('dashboard');
  const [currency, setCurrency] = useState('RON');
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [assumptions, setAssumptions] = useState(ASSUMPTIONS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadClients();
    loadAssumptions();
  }, []);

  const loadClients = async () => {
    try {
      const result = await storage.list('client:');
      if (result?.keys?.length) {
        const loaded = await Promise.all(
          result.keys.map(async (k) => {
            try {
              const r = await storage.get(k);
              return r ? JSON.parse(r.value) : null;
            } catch { return null; }
          })
        );
        setClients(loaded.filter(Boolean).sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      }
    } catch(e) { console.log('No clients yet'); }
    setLoading(false);
  };

  const loadAssumptions = async () => {
    try {
      const r = await storage.get('assumptions');
      if (r) setAssumptions({ ...ASSUMPTIONS_DEFAULT, ...JSON.parse(r.value) });
    } catch(e) {}
  };

  const saveAssumptions = async (newAssumptions) => {
    setAssumptions(newAssumptions);
    try { await storage.set('assumptions', JSON.stringify(newAssumptions)); } catch(e) {}
  };

  const saveClient = async (client) => {
    const updated = { ...client, updatedAt: Date.now() };
    if (!updated.id) updated.id = `c_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    try {
      await storage.set(`client:${updated.id}`, JSON.stringify(updated));
      const newList = clients.filter(c => c.id !== updated.id);
      newList.unshift(updated);
      setClients(newList);
      return updated;
    } catch(e) { console.error(e); return updated; }
  };

  const deleteClient = async (id) => {
    try {
      await storage.delete(`client:${id}`);
      setClients(clients.filter(c => c.id !== id));
    } catch(e) {}
  };

  const fmt = (val, curr = currency) => {
    if (val == null || isNaN(val)) return '—';
    const v = curr === 'EUR' ? val / assumptions.fxRate : val;
    const symbol = curr === 'EUR' ? '€' : 'RON';
    return `${Math.round(v).toLocaleString('ro-RO')} ${symbol}`;
  };

  return (
    <div className="min-h-screen w-full" style={{
      background: 'linear-gradient(180deg, #0a1628 0%, #0d1f38 50%, #0a1628 100%)',
      fontFamily: '"Manrope", -apple-system, sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { -webkit-font-smoothing: antialiased; }
        .serif { font-family: 'Playfair Display', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .gold-text { color: #d4af37; }
        .gold-bg { background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(212,175,55,0.15); }
        .glass-hover:hover { background: rgba(212,175,55,0.05); border-color: rgba(212,175,55,0.4); }
        .grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        @keyframes pulse-gold { 0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); } 50% { box-shadow: 0 0 0 12px rgba(212,175,55,0); } }
        .pulse-gold { animation: pulse-gold 2s infinite; }
        .input-premium { 
          background: rgba(0,0,0,0.3); 
          border: 1px solid rgba(212,175,55,0.2); 
          color: #f5f1e8; 
          padding: 14px 18px; 
          border-radius: 4px; 
          font-family: 'Manrope', sans-serif;
          transition: all 0.2s;
          width: 100%;
        }
        .input-premium:focus { outline: none; border-color: #d4af37; background: rgba(0,0,0,0.5); }
        .btn-primary { 
          background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); 
          color: #0a1628; 
          padding: 14px 28px; 
          font-weight: 700; 
          letter-spacing: 0.05em; 
          text-transform: uppercase; 
          font-size: 12px; 
          border-radius: 2px; 
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(212,175,55,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost { 
          background: transparent; 
          color: #d4af37; 
          padding: 12px 24px; 
          border: 1px solid rgba(212,175,55,0.4);
          font-weight: 600; 
          letter-spacing: 0.05em; 
          text-transform: uppercase; 
          font-size: 11px; 
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: rgba(212,175,55,0.08); border-color: #d4af37; }
        .divider-gold { height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); }
        .scrollbar::-webkit-scrollbar { width: 8px; }
        .scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 4px; }
      `}</style>

      <div className="grain absolute inset-0 pointer-events-none opacity-30" />

      <Header 
        view={view} 
        setView={setView} 
        currency={currency} 
        setCurrency={setCurrency}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        clientCount={clients.length}
      />

      {showSettings && (
        <SettingsModal 
          assumptions={assumptions}
          saveAssumptions={saveAssumptions}
          onClose={() => setShowSettings(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 gold-text animate-spin" />
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                clients={clients} 
                onSelect={(c) => { setActiveClient(c); setView('client'); }}
                onNew={() => { setActiveClient(null); setView('new'); }}
                onDelete={deleteClient}
                fmt={fmt}
              />
            )}
            {view === 'new' && (
              <NewClientFlow 
                onSave={async (c) => { 
                  const saved = await saveClient(c); 
                  setActiveClient(saved); 
                  setView('client'); 
                }}
                onCancel={() => setView('dashboard')}
                assumptions={assumptions}
                fmt={fmt}
                currency={currency}
              />
            )}
            {view === 'client' && activeClient && (
              <ClientWorkspace 
                client={activeClient}
                assumptions={assumptions}
                fmt={fmt}
                currency={currency}
                onSave={saveClient}
                onBack={() => setView('dashboard')}
                onUpdate={setActiveClient}
              />
            )}
            {view === 'comparator' && (
              <Comparator assumptions={assumptions} fmt={fmt} currency={currency} />
            )}
            {view === 'scripts' && (
              <ScriptsLibrary />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Header({ view, setView, currency, setCurrency, showSettings, setShowSettings, clientCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Clienți', icon: Users, count: clientCount },
    { id: 'comparator', label: 'Comparator', icon: BarChart3 },
    { id: 'scripts', label: 'Scripts & Obiecții', icon: MessageSquare },
  ];

  return (
    <header className="border-b border-yellow-900/30 backdrop-blur-xl sticky top-0 z-40" style={{background: 'rgba(10,22,40,0.85)'}}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 gold-bg rounded-sm flex items-center justify-center" style={{boxShadow: '0 4px 20px rgba(212,175,55,0.4)'}}>
            <span className="serif text-2xl font-bold" style={{color:'#0a1628'}}>P</span>
          </div>
          <div>
            <div className="serif text-xl text-white tracking-wide">PRIVATE WEALTH</div>
            <div className="text-[10px] gold-text uppercase tracking-[0.3em] -mt-1">Consultancy Suite</div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`px-5 py-3 text-xs uppercase tracking-widest font-semibold transition-all flex items-center gap-2 ${
                view === item.id ? 'gold-text border-b-2 border-yellow-600' : 'text-stone-400 hover:text-yellow-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.count != null && item.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full" style={{background: 'rgba(212,175,55,0.15)', color: '#d4af37'}}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-sm" style={{background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)'}}>
            {['RON', 'EUR'].map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 text-xs font-bold transition-all rounded-sm ${
                  currency === c ? 'gold-bg' : 'text-stone-400 hover:text-yellow-200'
                }`}
                style={currency === c ? {color:'#0a1628'} : {}}
              >
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSettings(true)} className="text-stone-400 hover:gold-text p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function SettingsModal({ assumptions, saveAssumptions, onClose }) {
  const [local, setLocal] = useState(assumptions);

  const updateUL = (name, field, value) => {
    setLocal({ ...local, ulProducts: { ...local.ulProducts, [name]: { ...local.ulProducts[name], [field]: value } } });
  };
  const updateMarket = (name, value) => {
    setLocal({ ...local, markets: { ...local.markets, [name]: value } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(0,0,0,0.85)'}}>
      <div className="glass max-w-3xl w-full max-h-[85vh] overflow-y-auto scrollbar p-8 rounded-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs gold-text uppercase tracking-[0.3em] mb-2">Configurări</div>
            <h2 className="serif text-3xl text-white">Asumpții Randamente</h2>
            <p className="text-stone-400 text-sm mt-2">Setează randamentele anuale folosite în toate calculele platformei</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-2"><X className="w-5 h-5"/></button>
        </div>

        <div className="space-y-6">
          <section className="rounded-sm p-5" style={{background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.03) 100%)', border: '1px solid rgba(212,175,55,0.4)'}}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 gold-text"/>
              <div className="text-[11px] gold-text uppercase tracking-[0.25em] font-bold">Activare AI (opțional)</div>
            </div>
            <p className="text-sm text-stone-200 mb-3 leading-relaxed">
              Funcțiile AI (extragere automată din text, generare strategie, generare obiecții) necesită o cheie API Claude — costă <strong className="gold-text">~5-15$/lună</strong> pentru un consultant individual.
            </p>
            <div className="text-xs text-stone-300 space-y-2 leading-relaxed">
              <div><strong className="gold-text">Pasul 1:</strong> Creează cont gratuit pe <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="underline gold-text hover:text-yellow-400">console.anthropic.com</a> și adaugă $5-10 credit (Plan & Billing → Add Credit)</div>
              <div><strong className="gold-text">Pasul 2:</strong> Generează o cheie API (API Keys → Create Key) — copiază valoarea</div>
              <div><strong className="gold-text">Pasul 3:</strong> În Vercel Dashboard → proiectul tău → Settings → Environment Variables → adaugă <code className="px-1.5 py-0.5 rounded text-yellow-300" style={{background: 'rgba(0,0,0,0.4)'}}>ANTHROPIC_API_KEY</code> cu valoarea cheii</div>
              <div><strong className="gold-text">Pasul 4:</strong> Deployments → ultimul deploy → click "..." → Redeploy</div>
              <div className="pt-2 mt-2 border-t border-yellow-900/30 text-stone-400 italic">Toate restul funcționează fără AI: formulare manuale, calculator PMT, comparator, scripts, raport printabil.</div>
            </div>
          </section>

          <section>
            <div className="text-[11px] gold-text uppercase tracking-[0.25em] mb-3 font-bold">Parametri Generali</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs text-stone-400 mb-1">Curs RON/EUR</div>
                <input type="number" step="0.01" value={local.fxRate} onChange={e => setLocal({...local, fxRate: parseFloat(e.target.value)||0})} className="input-premium"/>
              </label>
              <label className="block">
                <div className="text-xs text-stone-400 mb-1">Inflație anuală RO</div>
                <input type="number" step="0.001" value={local.inflation} onChange={e => setLocal({...local, inflation: parseFloat(e.target.value)||0})} className="input-premium"/>
              </label>
            </div>
          </section>

          <section>
            <div className="text-[11px] gold-text uppercase tracking-[0.25em] mb-3 font-bold">Unit-Linked — Randamente Anuale</div>
            <div className="space-y-2">
              {Object.entries(local.ulProducts).map(([name, prod]) => (
                <div key={name} className="grid grid-cols-12 gap-3 items-center p-3 rounded-sm" style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212,175,55,0.1)'}}>
                  <div className="col-span-5">
                    <div className="text-sm font-semibold text-white">{name}</div>
                    <div className="text-[10px] text-stone-500 uppercase tracking-wide">{prod.provider}</div>
                  </div>
                  <div className="col-span-3 text-xs text-stone-400">{prod.risk}</div>
                  <div className="col-span-4">
                    <input type="number" step="0.001" value={prod.yield} onChange={e => updateUL(name, 'yield', parseFloat(e.target.value)||0)} className="input-premium" style={{padding:'8px 12px'}}/>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-[11px] gold-text uppercase tracking-[0.25em] mb-3 font-bold">Piețe Comparative</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(local.markets).map(([name, val]) => (
                <div key={name} className="grid grid-cols-2 gap-2 items-center p-2 rounded-sm" style={{background: 'rgba(0,0,0,0.2)'}}>
                  <div className="text-xs text-stone-300">{name}</div>
                  <input type="number" step="0.001" value={val} onChange={e => updateMarket(name, parseFloat(e.target.value)||0)} className="input-premium" style={{padding:'6px 10px', fontSize: '12px'}}/>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-yellow-900/30">
          <button onClick={() => { saveAssumptions(local); onClose(); }} className="btn-primary flex-1">Salvează Modificări</button>
          <button onClick={onClose} className="btn-ghost">Anulează</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ clients, onSelect, onNew, onDelete, fmt }) {
  return (
    <div className="fade-up">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="text-xs gold-text uppercase tracking-[0.4em] mb-3">Welcome Back</div>
          <h1 className="serif text-5xl lg:text-7xl font-bold text-white leading-none">Portofoliu Clienți</h1>
          <p className="text-stone-400 mt-4 text-lg max-w-xl">Selectează un client existent sau adaugă unul nou pentru a începe analiza completă.</p>
        </div>
        <button onClick={onNew} className="btn-primary flex items-center gap-2 pulse-gold">
          <Plus className="w-4 h-4"/> Client Nou
        </button>
      </div>

      <div className="divider-gold mb-8"/>

      {clients.length === 0 ? (
        <EmptyState onNew={onNew} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((c, i) => (
            <ClientCard key={c.id} client={c} onClick={() => onSelect(c)} onDelete={() => onDelete(c.id)} fmt={fmt} index={i}/>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="glass rounded-sm p-16 text-center fade-up">
      <div className="inline-flex w-20 h-20 items-center justify-center rounded-full mb-6" style={{background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)'}}>
        <Users className="w-10 h-10 gold-text" />
      </div>
      <h3 className="serif text-3xl text-white mb-3">Niciun client adăugat încă</h3>
      <p className="text-stone-400 mb-8 max-w-md mx-auto">Începe prin a adăuga primul tău client. AI-ul va genera automat profil, strategie de investiții și plan de prezentare.</p>
      <button onClick={onNew} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4"/> Adaugă Primul Client</button>
    </div>
  );
}

function ClientCard({ client, onClick, onDelete, fmt, index }) {
  const [hover, setHover] = useState(false);
  const profile = client.profile || {};
  const updated = client.updatedAt ? new Date(client.updatedAt).toLocaleDateString('ro-RO') : '';
  const nextMeeting = client.nextMeeting ? new Date(client.nextMeeting) : null;
  const daysUntilMeeting = nextMeeting ? Math.ceil((nextMeeting - Date.now()) / (86400000)) : null;
  
  const badges = [];
  if (client.strategy) badges.push({ label: 'Strategie', color: '#d4af37' });
  if (client.goals?.length) badges.push({ label: `${client.goals.length} obiective`, color: '#86b58c' });
  
  return (
    <div 
      className="glass glass-hover rounded-sm p-6 cursor-pointer transition-all relative group fade-up"
      style={{animationDelay: `${index * 80}ms`}}
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <button onClick={(e) => { e.stopPropagation(); if(confirm(`Șterge ${profile.name || 'client'}?`)) onDelete(); }} 
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 transition p-1">
        <Trash2 className="w-4 h-4"/>
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-sm flex items-center justify-center text-lg font-bold serif" style={{background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)'}}>
          {(profile.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">{profile.name || 'Fără nume'}</div>
          <div className="text-xs text-stone-500">{profile.age ? `${profile.age} ani` : ''} {profile.occupation ? `· ${profile.occupation}` : ''}</div>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <Row label="Venit lunar" value={profile.monthlyIncome ? fmt(profile.monthlyIncome) : '—'} />
        <Row label="Profil risc" value={profile.riskProfile || '—'} accent />
        <Row label="Sumă propusă" value={client.strategy?.monthlyAmount ? fmt(client.strategy.monthlyAmount) + '/lună' : '—'} />
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {badges.map((b, i) => (
            <span key={i} className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-sm" 
              style={{background: `${b.color}20`, color: b.color, border: `1px solid ${b.color}50`}}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {nextMeeting && daysUntilMeeting !== null && (
        <div className="mb-3 p-2 rounded-sm flex items-center gap-2" style={{
          background: daysUntilMeeting <= 1 ? 'rgba(220,80,50,0.08)' : daysUntilMeeting <= 7 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${daysUntilMeeting <= 1 ? 'rgba(220,80,50,0.3)' : daysUntilMeeting <= 7 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`
        }}>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{color: daysUntilMeeting <= 1 ? '#e67e5a' : daysUntilMeeting <= 7 ? '#d4af37' : '#888'}}/>
          <div className="text-xs">
            <span className="text-stone-400">Următoarea: </span>
            <span className="font-semibold" style={{color: daysUntilMeeting <= 1 ? '#ff8866' : daysUntilMeeting <= 7 ? '#d4af37' : '#fff'}}>
              {daysUntilMeeting < 0 ? `acum ${Math.abs(daysUntilMeeting)} zile` : daysUntilMeeting === 0 ? 'ASTĂZI' : daysUntilMeeting === 1 ? 'MÂINE' : `în ${daysUntilMeeting} zile`}
            </span>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-yellow-900/20 flex items-center justify-between">
        <div className="text-[10px] text-stone-500 uppercase tracking-widest">Ultima editare {updated}</div>
        <ChevronRight className={`w-4 h-4 gold-text transition-transform ${hover ? 'translate-x-1' : ''}`}/>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-stone-500 text-xs uppercase tracking-wide">{label}</span>
      <span className={`mono text-sm ${accent ? 'gold-text font-semibold' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function NewClientFlow({ onSave, onCancel, assumptions, fmt, currency }) {
  const [mode, setMode] = useState('choice'); // choice | text | form
  const [textInput, setTextInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState('');

  const extractFromText = async () => {
    if (!textInput.trim()) return;
    setExtracting(true);
    setError('');
    try {
      const prompt = `Ești un asistent pentru consultanți financiari români. Analizează descrierea clientului și extrage datele structurate. Răspunde DOAR cu JSON valid, fără markdown, fără text suplimentar.

Descriere client: "${textInput}"

Returnează un JSON cu această structură EXACTĂ (folosește null pentru date lipsă, RON pentru sume):
{
  "name": "string",
  "age": number,
  "occupation": "string",
  "maritalStatus": "string",
  "children": number,
  "monthlyIncome": number,
  "monthlyExpenses": number,
  "totalSavings": number,
  "totalDebt": number,
  "hasHouse": boolean,
  "wantsHouse": boolean,
  "yearsToRetirement": number,
  "mainGoals": ["array de obiective"],
  "riskProfile": "CONSERVATOR|MODERAT|DINAMIC|AGRESIV",
  "personality": "scurtă descriere comportament financiar (1 frază)",
  "notes": "alte detalii relevante"
}`;

      const data = await callAI([{ role: "user", content: prompt }], 1500);
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setExtracted(parsed);
    } catch(e) {
      console.error(e);
      if (e.message === 'AI_NOT_CONFIGURED') {
        setError('AI nu este configurat încă. Vezi tab "Setări → AI" pentru instrucțiuni. Între timp, folosește modul Formular.');
      } else {
        setError('Nu am reușit să extrag datele. Încearcă să fii mai detaliat sau treci la modul formular.');
      }
    }
    setExtracting(false);
  };

  if (mode === 'choice') {
    return (
      <div className="fade-up max-w-3xl mx-auto">
        <button onClick={onCancel} className="text-stone-400 hover:gold-text mb-8 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4"/> Înapoi la dashboard
        </button>
        <div className="text-xs gold-text uppercase tracking-[0.4em] mb-3">Client Nou</div>
        <h1 className="serif text-5xl text-white mb-4">Cum adăugăm datele?</h1>
        <p className="text-stone-400 mb-12 text-lg">Alege modul de introducere care îți este cel mai natural în consultanță.</p>

        <div className="grid md:grid-cols-2 gap-5">
          <button onClick={() => setMode('text')} className="glass glass-hover rounded-sm p-8 text-left transition-all group">
            <div className="w-14 h-14 gold-bg rounded-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7" style={{color: '#0a1628'}}/>
            </div>
            <h3 className="serif text-2xl text-white mb-2">Descriere AI</h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">Scrii liber tot ce știi despre client (text liber). AI-ul extrage automat datele structurate.</p>
            <div className="text-xs gold-text uppercase tracking-widest font-semibold flex items-center gap-2">
              Recomandat <ArrowRight className="w-3 h-3"/>
            </div>
          </button>
          <button onClick={() => setMode('form')} className="glass glass-hover rounded-sm p-8 text-left transition-all group">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform" style={{background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)'}}>
              <Edit3 className="w-7 h-7 gold-text"/>
            </div>
            <h3 className="serif text-2xl text-white mb-2">Formular Structurat</h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">Completezi câmpurile clasice. Mai rapid pentru consultanți care preferă structura clasică.</p>
            <div className="text-xs text-stone-400 uppercase tracking-widest font-semibold flex items-center gap-2">
              Tradițional <ArrowRight className="w-3 h-3"/>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'text') {
    return (
      <div className="fade-up max-w-3xl mx-auto">
        <button onClick={() => setMode('choice')} className="text-stone-400 hover:gold-text mb-8 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4"/> Înapoi
        </button>
        <div className="text-xs gold-text uppercase tracking-[0.4em] mb-3">Mod Conversațional</div>
        <h1 className="serif text-4xl text-white mb-3">Descrie-mi clientul</h1>
        <p className="text-stone-400 mb-8">Cu cât scrii mai multe detalii, cu atât AI-ul extrage mai bine. Nu te îngrijora de formă — scrie natural.</p>

        {!extracted ? (
          <>
            <textarea 
              value={textInput} 
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Exemplu: Andrei, 38 ani, software engineer la o multinaționala, salariu net 12.000 RON, soția lucrează part-time în PR cu 4500 RON. Au un copil de 5 ani și plănuiesc al doilea. Stau cu chirie 2500 RON. Cheltuieli totale lunare ~9000 RON. Au strâns 80.000 RON economii. Vor să-și cumpere casă în 3 ani și să pună deoparte pentru educația copiilor. Andrei e prudent dar înțelege investițiile. Vor independență financiară până la 55 ani."
              className="input-premium scrollbar"
              style={{minHeight: '280px', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6, fontSize: '15px'}}
            />
            {error && <div className="mt-3 p-3 rounded-sm flex items-start gap-2 text-sm" style={{background: 'rgba(220,50,50,0.1)', color: '#ff8888'}}><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0"/>{error}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={extractFromText} disabled={!textInput.trim() || extracting} className="btn-primary flex items-center gap-2">
                {extracting ? <><Loader2 className="w-4 h-4 animate-spin"/> Analizez...</> : <><Brain className="w-4 h-4"/> Analizează cu AI</>}
              </button>
              <button onClick={() => setMode('form')} className="btn-ghost">Trec la formular</button>
            </div>
          </>
        ) : (
          <ExtractedReview extracted={extracted} onConfirm={(profile) => onSave({ profile, source: 'text', originalText: textInput })} onEdit={() => setExtracted(null)} fmt={fmt}/>
        )}
      </div>
    );
  }

  return <ClientForm onSave={(profile) => onSave({ profile, source: 'form' })} onCancel={() => setMode('choice')} fmt={fmt}/>;
}

function ExtractedReview({ extracted, onConfirm, onEdit, fmt }) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 gold-text"/>
          <h3 className="serif text-2xl text-white">Date extrase de AI</h3>
        </div>
        <p className="text-stone-400 text-sm mb-6">Verifică și confirmă datele de mai jos. Le poți edita în pasul următor.</p>
        
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(extracted).map(([k, v]) => {
            if (v == null || v === '') return null;
            const label = {
              name: 'Nume', age: 'Vârstă', occupation: 'Ocupație', maritalStatus: 'Stare civilă',
              children: 'Copii', monthlyIncome: 'Venit lunar', monthlyExpenses: 'Cheltuieli lunare',
              totalSavings: 'Economii', totalDebt: 'Datorii', hasHouse: 'Are locuință', wantsHouse: 'Vrea locuință',
              yearsToRetirement: 'Ani până pensie', mainGoals: 'Obiective principale',
              riskProfile: 'Profil risc', personality: 'Personalitate', notes: 'Note'
            }[k] || k;
            const display = typeof v === 'boolean' ? (v ? 'Da' : 'Nu') 
              : Array.isArray(v) ? v.join(', ')
              : ['monthlyIncome','monthlyExpenses','totalSavings','totalDebt'].includes(k) ? fmt(v)
              : v.toString();
            return (
              <div key={k} className="border-b border-yellow-900/20 pb-2">
                <div className="text-[10px] gold-text uppercase tracking-widest mb-1">{label}</div>
                <div className="text-white text-sm">{display}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => onConfirm(extracted)} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4"/> Salvează Client
        </button>
        <button onClick={onEdit} className="btn-ghost">Re-analizează</button>
      </div>
    </div>
  );
}

function ClientForm({ onSave, onCancel, fmt }) {
  const [data, setData] = useState({
    name: '', age: '', occupation: '', maritalStatus: '', children: 0,
    monthlyIncome: '', monthlyExpenses: '', totalSavings: '', totalDebt: '',
    hasHouse: false, wantsHouse: false, yearsToRetirement: '',
    mainGoals: [], riskProfile: 'MODERAT', personality: '', notes: ''
  });

  const goalOptions = ['Achiziție locuință', 'Educație copii', 'Pensie', 'Venit pasiv', 'Fond urgență', 'Vacanțe premium', 'Moștenire copii'];
  const toggleGoal = (g) => {
    setData({ ...data, mainGoals: data.mainGoals.includes(g) ? data.mainGoals.filter(x=>x!==g) : [...data.mainGoals, g] });
  };

  return (
    <div className="fade-up max-w-3xl mx-auto">
      <button onClick={onCancel} className="text-stone-400 hover:gold-text mb-8 flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4"/> Înapoi
      </button>
      <div className="text-xs gold-text uppercase tracking-[0.4em] mb-3">Mod Formular</div>
      <h1 className="serif text-4xl text-white mb-8">Date Client</h1>

      <div className="space-y-8">
        <FormSection title="Identitate">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Nume complet" value={data.name} onChange={v => setData({...data, name: v})}/>
            <Field label="Vârstă" type="number" value={data.age} onChange={v => setData({...data, age: parseInt(v)||''})}/>
            <Field label="Ocupație" value={data.occupation} onChange={v => setData({...data, occupation: v})}/>
            <Field label="Stare civilă" value={data.maritalStatus} onChange={v => setData({...data, maritalStatus: v})}/>
            <Field label="Copii (număr)" type="number" value={data.children} onChange={v => setData({...data, children: parseInt(v)||0})}/>
            <Field label="Ani până la pensie" type="number" value={data.yearsToRetirement} onChange={v => setData({...data, yearsToRetirement: parseInt(v)||''})}/>
          </div>
        </FormSection>

        <FormSection title="Finanțe (RON lunar)">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Venit lunar net" type="number" value={data.monthlyIncome} onChange={v => setData({...data, monthlyIncome: parseFloat(v)||''})}/>
            <Field label="Cheltuieli lunare" type="number" value={data.monthlyExpenses} onChange={v => setData({...data, monthlyExpenses: parseFloat(v)||''})}/>
            <Field label="Economii totale" type="number" value={data.totalSavings} onChange={v => setData({...data, totalSavings: parseFloat(v)||''})}/>
            <Field label="Datorii totale" type="number" value={data.totalDebt} onChange={v => setData({...data, totalDebt: parseFloat(v)||''})}/>
          </div>
        </FormSection>

        <FormSection title="Obiective">
          <div className="flex flex-wrap gap-2">
            {goalOptions.map(g => (
              <button key={g} onClick={() => toggleGoal(g)} 
                className={`px-4 py-2 text-sm rounded-sm transition-all ${data.mainGoals.includes(g) ? 'gold-bg' : ''}`}
                style={data.mainGoals.includes(g) ? {color:'#0a1628', fontWeight: 700} : {background: 'rgba(0,0,0,0.3)', color: '#d4d4d4', border: '1px solid rgba(212,175,55,0.2)'}}>
                {g}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection title="Profil de risc">
          <div className="grid grid-cols-4 gap-2">
            {['CONSERVATOR','MODERAT','DINAMIC','AGRESIV'].map(p => (
              <button key={p} onClick={() => setData({...data, riskProfile: p})}
                className={`py-3 text-xs uppercase tracking-widest font-bold rounded-sm transition ${data.riskProfile === p ? 'gold-bg' : ''}`}
                style={data.riskProfile === p ? {color:'#0a1628'} : {background: 'rgba(0,0,0,0.3)', color: '#d4d4d4', border: '1px solid rgba(212,175,55,0.2)'}}>
                {p}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection title="Note suplimentare">
          <textarea value={data.notes} onChange={e => setData({...data, notes: e.target.value})} className="input-premium" style={{minHeight: '100px', fontFamily: 'Manrope'}} placeholder="Personalitate, frici, ambiții, alte detalii..."/>
        </FormSection>

        <div className="flex gap-3">
          <button onClick={() => onSave(data)} disabled={!data.name} className="btn-primary flex-1">Salvează Client</button>
          <button onClick={onCancel} className="btn-ghost">Anulează</button>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div>
      <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-premium"/>
    </label>
  );
}

function ClientWorkspace({ client, assumptions, fmt, currency, onSave, onBack, onUpdate }) {
  const [tab, setTab] = useState('overview');
  const profile = client.profile || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'strategy', label: 'Strategie AI', icon: Sparkles },
    { id: 'goals', label: 'Obiective PMT', icon: Target },
    { id: 'comparator', label: 'Comparator', icon: BarChart3 },
    { id: 'objections', label: 'Obiecții AI', icon: Shield },
    { id: 'report', label: 'Raport Final', icon: FileText },
  ];

  return (
    <div className="fade-up">
      <button onClick={onBack} className="text-stone-400 hover:gold-text mb-6 flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4"/> Înapoi la clienți
      </button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-sm flex items-center justify-center text-3xl serif font-bold" style={{background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)'}}>
            {(profile.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs gold-text uppercase tracking-[0.3em] mb-1">Client Activ</div>
            <h1 className="serif text-4xl text-white">{profile.name}</h1>
            <div className="text-stone-400 text-sm mt-1">
              {profile.age && `${profile.age} ani`} {profile.occupation && `· ${profile.occupation}`} {profile.riskProfile && `· `}
              {profile.riskProfile && <span className="gold-text font-semibold">{profile.riskProfile}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-8 border-b border-yellow-900/30 overflow-x-auto scrollbar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs uppercase tracking-widest font-bold whitespace-nowrap flex items-center gap-2 transition-all border-b-2 ${
              tab === t.id ? 'gold-text border-yellow-600' : 'text-stone-500 border-transparent hover:text-yellow-200'
            }`}>
            <t.icon className="w-4 h-4"/> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab client={client} assumptions={assumptions} fmt={fmt} onSave={async (updates) => { const u = await onSave({ ...client, ...updates }); onUpdate(u); }}/>}
      {tab === 'strategy' && <StrategyTab client={client} assumptions={assumptions} fmt={fmt} onSave={async (s) => { const u = await onSave({ ...client, strategy: s }); onUpdate(u); }}/>}
      {tab === 'goals' && <GoalsTab client={client} assumptions={assumptions} fmt={fmt} onSave={async (g) => { const u = await onSave({ ...client, goals: g }); onUpdate(u); }}/>}
      {tab === 'comparator' && <ClientComparator client={client} assumptions={assumptions} fmt={fmt} currency={currency}/>}
      {tab === 'objections' && <ObjectionsTab client={client}/>}
      {tab === 'report' && <ReportTab client={client} assumptions={assumptions} fmt={fmt}/>}
    </div>
  );
}

function OverviewTab({ client, assumptions, fmt, onSave }) {
  const p = client.profile || {};
  const disposable = (p.monthlyIncome || 0) - (p.monthlyExpenses || 0);
  const savingsRate = p.monthlyIncome ? disposable / p.monthlyIncome : 0;
  const netWorth = (p.totalSavings || 0) - (p.totalDebt || 0);
  const nextMeetingValue = client.nextMeeting ? new Date(client.nextMeeting).toISOString().slice(0, 10) : '';

  return (
    <div className="space-y-8">
      {/* Next meeting bar */}
      <div className="glass rounded-sm p-5 flex flex-wrap items-center gap-4">
        <Calendar className="w-5 h-5 gold-text flex-shrink-0"/>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[10px] gold-text uppercase tracking-[0.3em] font-bold mb-1">Următoarea întâlnire</div>
          <input type="date" value={nextMeetingValue} onChange={e => onSave({ nextMeeting: e.target.value ? new Date(e.target.value).getTime() : null })} 
            className="input-premium" style={{padding: '8px 12px', maxWidth: '200px'}}/>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[10px] gold-text uppercase tracking-[0.3em] font-bold mb-1">Status</div>
          <select value={client.status || 'prospect'} onChange={e => onSave({ status: e.target.value })}
            className="input-premium" style={{padding: '8px 12px', maxWidth: '250px'}}>
            <option value="prospect">Prospect (primul contact)</option>
            <option value="fact_find">Fact-find în curs</option>
            <option value="presentation">Prezentare programată</option>
            <option value="negotiation">Negociere / follow-up</option>
            <option value="closed_won">Client activ (semnat)</option>
            <option value="closed_lost">Oportunitate pierdută</option>
            <option value="dormant">Dormant</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Venit / lună" value={fmt(p.monthlyIncome || 0)} icon={Wallet}/>
        <KPI label="Disponibil" value={fmt(disposable)} icon={TrendingUp} highlight/>
        <KPI label="Avere netă" value={fmt(netWorth)} icon={Target}/>
        <KPI label="Rata economisire" value={`${(savingsRate*100).toFixed(1)}%`} icon={Zap}/>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-sm p-6">
          <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-4">Profil Personal</div>
          <div className="space-y-3 text-sm">
            <DetailRow label="Stare civilă" value={p.maritalStatus}/>
            <DetailRow label="Copii" value={p.children}/>
            <DetailRow label="Ani până pensie" value={p.yearsToRetirement}/>
            <DetailRow label="Profil risc" value={<span className="gold-text font-bold">{p.riskProfile}</span>}/>
            {p.personality && <div><div className="text-stone-500 text-xs uppercase tracking-wide mb-1">Personalitate</div><div className="text-white italic">"{p.personality}"</div></div>}
          </div>
        </div>
        <div className="glass rounded-sm p-6">
          <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-4">Obiective Identificate</div>
          {p.mainGoals?.length ? (
            <div className="flex flex-wrap gap-2">
              {p.mainGoals.map(g => (
                <span key={g} className="px-3 py-1.5 text-xs rounded-sm" style={{background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)'}}>{g}</span>
              ))}
            </div>
          ) : <div className="text-stone-500 text-sm">Niciun obiectiv specificat</div>}
          {p.notes && <div className="mt-5 pt-4 border-t border-yellow-900/20"><div className="text-stone-500 text-xs uppercase tracking-wide mb-2">Note</div><div className="text-stone-300 text-sm leading-relaxed">{p.notes}</div></div>}
        </div>
      </div>

      {client.originalText && (
        <div className="glass rounded-sm p-6">
          <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-3">Descriere Originală</div>
          <div className="text-stone-300 text-sm leading-relaxed italic">"{client.originalText}"</div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`rounded-sm p-5 ${highlight ? '' : 'glass'}`} style={highlight ? {background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.4)'} : {}}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{color: highlight ? '#d4af37' : '#888'}}>{label}</div>
        <Icon className={`w-4 h-4 ${highlight ? 'gold-text' : 'text-stone-500'}`}/>
      </div>
      <div className="serif text-3xl text-white font-bold leading-none">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-stone-500 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-white text-sm">{value}</span>
    </div>
  );
}

function StrategyTab({ client, assumptions, fmt, onSave }) {
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState(client.strategy || null);
  const [error, setError] = useState('');

  const generateStrategy = async () => {
    setGenerating(true);
    setError('');
    try {
      const p = client.profile;
      const ulList = Object.entries(assumptions.ulProducts).map(([n,d]) => `${n} (${d.provider}, ${d.risk}, ${(d.yield*100).toFixed(1)}% randament asumat)`).join('; ');

      const prompt = `Ești un consultant financiar de elite în România, specializat pe Unit-Linked. Pentru clientul de mai jos, generează o strategie completă personalizată.

DATE CLIENT:
- Nume: ${p.name}
- Vârstă: ${p.age}, Ocupație: ${p.occupation}, Stare civilă: ${p.maritalStatus}, Copii: ${p.children}
- Venit lunar: ${p.monthlyIncome} RON, Cheltuieli: ${p.monthlyExpenses} RON
- Economii: ${p.totalSavings} RON, Datorii: ${p.totalDebt} RON
- Profil risc: ${p.riskProfile}
- Ani până pensie: ${p.yearsToRetirement}
- Obiective: ${p.mainGoals?.join(', ')}
- Personalitate: ${p.personality || 'nedefinit'}
- Note: ${p.notes || ''}

PRODUSE UL DISPONIBILE: ${ulList}

Generează o strategie ca JSON pur (fără markdown). Structură EXACTĂ:
{
  "monthlyAmount": number_RON,
  "horizonYears": number,
  "rationale": "1-2 fraze: de ce această sumă pentru acest client",
  "allocation": [
    {"product": "nume produs UL", "percentage": number_intre_0_si_100, "reasoning": "de ce acest procent"}
  ],
  "expectedYield": number_intre_0_si_1,
  "projectedFinalValue": number_RON,
  "keyArguments": [
    "argument 1 personalizat clientului",
    "argument 2",
    "argument 3 emoțional",
    "argument 4 numeric/comparativ",
    "argument 5 urgență/cost inacțiune"
  ],
  "talkingPoints": "Script 3-4 fraze pentru deschiderea prezentării către acest client specific",
  "warnings": "Riscuri sau aspecte de care consultantul trebuie să fie conștient"
}

Asigură-te că alocarea însumează 100. Folosește max 5 produse. Strategia să fie REALISTĂ și să se potrivească profilului.`;

      const data = await callAI([{ role: "user", content: prompt }], 2500);
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setStrategy(parsed);
      await onSave(parsed);
    } catch(e) {
      console.error(e);
      if (e.message === 'AI_NOT_CONFIGURED') {
        setError('AI nu este configurat. Mergi la Setări (iconul rotativ sus) și citește secțiunea "Activare AI".');
      } else {
        setError('Eroare la generare. Reîncearcă.');
      }
    }
    setGenerating(false);
  };

  if (!strategy) {
    return (
      <div className="glass rounded-sm p-12 text-center">
        <div className="inline-flex w-20 h-20 items-center justify-center rounded-full mb-6 pulse-gold" style={{background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)'}}>
          <Sparkles className="w-10 h-10 gold-text"/>
        </div>
        <h3 className="serif text-3xl text-white mb-3">Generează Strategia</h3>
        <p className="text-stone-400 mb-8 max-w-md mx-auto">AI-ul analizează datele clientului și creează o strategie de investiții personalizată cu alocare, argumente și script de prezentare.</p>
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        <button onClick={generateStrategy} disabled={generating} className="btn-primary inline-flex items-center gap-2">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin"/> AI lucrează...</> : <><Sparkles className="w-4 h-4"/> Generează Strategie</>}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <KPI label="Sumă lunară" value={fmt(strategy.monthlyAmount)} icon={Wallet} highlight/>
        <KPI label="Orizont" value={`${strategy.horizonYears} ani`} icon={Target}/>
        <KPI label="Valoare finală" value={fmt(strategy.projectedFinalValue)} icon={TrendingUp}/>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-3">Raționament</div>
        <div className="text-white text-lg leading-relaxed serif italic">"{strategy.rationale}"</div>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold">Alocare Recomandată</div>
          <div className="text-xs text-stone-400">Randament ponderat: <span className="gold-text font-bold">{(strategy.expectedYield*100).toFixed(1)}%</span></div>
        </div>
        <div className="space-y-3">
          {strategy.allocation.map((a, i) => (
            <div key={i} className="p-4 rounded-sm" style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212,175,55,0.15)'}}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-white">{a.product}</div>
                <div className="serif text-2xl gold-text font-bold">{a.percentage}%</div>
              </div>
              <div className="w-full h-1.5 rounded-full mb-2" style={{background: 'rgba(0,0,0,0.4)'}}>
                <div className="h-full rounded-full gold-bg" style={{width: `${a.percentage}%`, transition: 'width 1s'}}/>
              </div>
              <div className="text-stone-400 text-sm italic">{a.reasoning}</div>
              <div className="text-xs gold-text mt-1">~{fmt(strategy.monthlyAmount * a.percentage / 100)}/lună</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-4">5 Argumente pentru Client</div>
        <div className="space-y-3">
          {strategy.keyArguments.map((arg, i) => (
            <div key={i} className="flex gap-4">
              <div className="serif text-3xl gold-text font-bold leading-none w-10">{i+1}</div>
              <div className="text-stone-200 leading-relaxed pt-1">{arg}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-sm p-6" style={{background: 'rgba(212,175,55,0.05)'}}>
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-3">Script Deschidere Prezentare</div>
        <div className="text-white serif text-lg leading-relaxed italic">"{strategy.talkingPoints}"</div>
        <CopyBtn text={strategy.talkingPoints}/>
      </div>

      {strategy.warnings && (
        <div className="rounded-sm p-5" style={{background: 'rgba(220,80,50,0.08)', border: '1px solid rgba(220,80,50,0.3)'}}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5"/>
            <div>
              <div className="text-orange-300 font-bold text-sm uppercase tracking-wide mb-1">Atenție Consultant</div>
              <div className="text-stone-200 text-sm">{strategy.warnings}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button onClick={generateStrategy} disabled={generating} className="btn-ghost flex items-center gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>} Regenerează strategia
        </button>
      </div>
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="mt-4 text-xs gold-text hover:underline flex items-center gap-1.5">
      {copied ? <><Check className="w-3 h-3"/> Copiat</> : <><Copy className="w-3 h-3"/> Copiază script</>}
    </button>
  );
}

function ClientComparator({ client, assumptions, fmt, currency }) {
  const strategy = client.strategy;
  const monthly = strategy?.monthlyAmount || 1000;
  const years = strategy?.horizonYears || 15;
  const totalContrib = monthly * 12 * years;
  const fv = (rate) => monthly * ((Math.pow(1 + rate/12, 12*years) - 1) / (rate/12));
  
  const ulYields = Object.entries(assumptions.ulProducts).map(([n, d]) => ({ name: n, yield: d.yield - 0.018, fv: fv(d.yield - 0.018), type: 'ul' }));
  const marketYields = Object.entries(assumptions.markets).map(([n, y]) => {
    const cost = n === 'Depozit bancar' || n.startsWith('Tezaur') ? 0 : 0.01;
    const netY = y - cost;
    return { name: n, yield: netY, fv: fv(netY), type: 'market' };
  });
  const all = [...ulYields, ...marketYields].sort((a,b) => b.fv - a.fv);
  const max = Math.max(...all.map(x => x.fv));

  return (
    <div className="space-y-6">
      <div className="glass rounded-sm p-6">
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-4">Scenariu Comparare</div>
        <div className="grid grid-cols-3 gap-6">
          <div><div className="text-xs text-stone-400 mb-1">Sumă lunară</div><div className="serif text-3xl text-white">{fmt(monthly)}</div></div>
          <div><div className="text-xs text-stone-400 mb-1">Orizont</div><div className="serif text-3xl text-white">{years} ani</div></div>
          <div><div className="text-xs text-stone-400 mb-1">Total contribuit</div><div className="serif text-3xl gold-text">{fmt(totalContrib)}</div></div>
        </div>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-4">Comparator Vehicule</div>
        <div className="space-y-2">
          {all.map((v, i) => (
            <div key={v.name} className="flex items-center gap-4 group">
              <div className="w-48 flex-shrink-0">
                <div className={`text-sm font-semibold ${v.type === 'ul' ? 'gold-text' : 'text-white'}`}>
                  {v.type === 'ul' && '★ '}{v.name}
                </div>
                <div className="text-[10px] text-stone-500 mono">{(v.yield*100).toFixed(1)}% net</div>
              </div>
              <div className="flex-1 relative h-8" style={{background: 'rgba(0,0,0,0.3)'}}>
                <div className={`h-full transition-all duration-1000 ${v.type === 'ul' ? 'gold-bg' : ''}`} 
                  style={{ width: `${(v.fv/max)*100}%`, background: v.type === 'ul' ? undefined : 'linear-gradient(90deg, rgba(120,120,140,0.5), rgba(150,150,170,0.5))' }}/>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs mono font-bold" style={{color: v.type === 'ul' ? '#0a1628' : '#fff'}}>{fmt(v.fv)}</div>
              </div>
              <div className="w-32 text-right text-xs text-stone-400">+{fmt(v.fv - totalContrib)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ObjectionsTab({ client }) {
  const [generating, setGenerating] = useState(false);
  const [objections, setObjections] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      const p = client.profile;
      const prompt = `Ești expert în vânzări de produse financiare. Pentru clientul descris, generează 6 obiecții POTENȚIALE pe care le-ar putea ridica + răspunsuri profesionale (nu manipulative). 

CLIENT: ${p.name}, ${p.age} ani, ${p.occupation}, profil ${p.riskProfile}, obiective: ${p.mainGoals?.join(', ')}, personalitate: ${p.personality}, note: ${p.notes}

Returnează JSON pur (fără markdown):
{
  "objections": [
    {"objection": "ce ar zice clientul (citat realist)", "response": "răspunsul profesional al consultantului (3-5 fraze)", "tactic": "denumire tactică folosită (ex: reframing, social proof, comparație)"}
  ]
}`;
      const data = await callAI([{ role: "user", content: prompt }], 2500);
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setObjections(JSON.parse(clean).objections);
    } catch(e) { if (e.message === 'AI_NOT_CONFIGURED') {
        setError('AI nu este configurat. Mergi la Setări → secțiunea Activare AI.');
      } else {
        setError('Eroare la generare.');
      } }
    setGenerating(false);
  };

  if (!objections) return (
    <div className="glass rounded-sm p-12 text-center">
      <Shield className="w-16 h-16 gold-text mx-auto mb-5"/>
      <h3 className="serif text-3xl text-white mb-3">Anticipează Obiecțiile</h3>
      <p className="text-stone-400 mb-8 max-w-md mx-auto">AI-ul analizează profilul și generează obiecțiile pe care clientul le poate ridica + răspunsuri pregătite.</p>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      <button onClick={generate} disabled={generating} className="btn-primary inline-flex items-center gap-2">
        {generating ? <><Loader2 className="w-4 h-4 animate-spin"/> Generez...</> : <><Sparkles className="w-4 h-4"/> Generează Obiecții</>}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {objections.map((o, i) => (
        <div key={i} className="glass rounded-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="serif text-4xl gold-text font-bold leading-none">{i+1}</div>
            <div className="flex-1">
              <div className="text-xs gold-text uppercase tracking-widest mb-2 font-bold">Obiecție</div>
              <div className="serif text-xl text-white italic">"{o.objection}"</div>
            </div>
          </div>
          <div className="pl-12">
            <div className="text-xs uppercase tracking-widest mb-2 font-bold" style={{color: '#86b58c'}}>Răspuns Recomandat</div>
            <div className="text-stone-200 leading-relaxed mb-3">{o.response}</div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Tactică: <span className="gold-text">{o.tactic}</span></div>
            <CopyBtn text={o.response}/>
          </div>
        </div>
      ))}
      <button onClick={generate} className="btn-ghost mx-auto block flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Regenerează</button>
    </div>
  );
}

function GoalsTab({ client, assumptions, fmt, onSave }) {
  const [goals, setGoals] = useState(client.goals || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const presets = [
    { icon: Home, label: 'Locuință', defaultAmount: 500000, defaultYears: 5 },
    { icon: GraduationCap, label: 'Educație copii', defaultAmount: 200000, defaultYears: 15 },
    { icon: PiggyBank, label: 'Pensie', defaultAmount: 1500000, defaultYears: 25 },
    { icon: Plane, label: 'Vacanță premium', defaultAmount: 50000, defaultYears: 2 },
    { icon: Heart, label: 'Fond urgență', defaultAmount: 30000, defaultYears: 1 },
    { icon: TrendingUp, label: 'Venit pasiv', defaultAmount: 2000000, defaultYears: 20 },
  ];

  const getAvgYield = () => {
    const profile = (client.profile?.riskProfile || 'MODERAT').toUpperCase();
    const profileYields = { CONSERVATOR: 0.05, MODERAT: 0.07, DINAMIC: 0.09, AGRESIV: 0.11 };
    return profileYields[profile] || 0.08;
  };

  const calcPMT = (targetAmount, years, currentSaved = 0, annualYield = null) => {
    const r = (annualYield ?? getAvgYield()) / 12;
    const n = years * 12;
    if (r === 0) return Math.max(0, (targetAmount - currentSaved) / n);
    const fvOfCurrent = currentSaved * Math.pow(1 + r, n);
    const remaining = targetAmount - fvOfCurrent;
    if (remaining <= 0) return 0;
    return remaining * r / (Math.pow(1 + r, n) - 1);
  };

  const calcProjection = (goal) => {
    const pmt = calcPMT(goal.targetAmount, goal.years, goal.currentSaved || 0, goal.annualYield);
    const disposable = (client.profile?.monthlyIncome || 0) - (client.profile?.monthlyExpenses || 0);
    const feasible = pmt <= disposable;
    return { pmt, feasible, disposable };
  };

  const saveGoals = async (newGoals) => {
    setGoals(newGoals);
    await onSave(newGoals);
  };

  const addGoal = (goal) => {
    const newGoals = [...goals, { ...goal, id: `g_${Date.now()}` }];
    saveGoals(newGoals);
    setShowAddForm(false);
  };

  const updateGoal = (idx, updated) => {
    const newGoals = [...goals];
    newGoals[idx] = updated;
    saveGoals(newGoals);
    setEditingIdx(null);
  };

  const deleteGoal = (idx) => {
    if (confirm('Ștergi acest obiectiv?')) saveGoals(goals.filter((_, i) => i !== idx));
  };

  const totalMonthly = goals.reduce((sum, g) => sum + calcProjection(g).pmt, 0);
  const disposable = (client.profile?.monthlyIncome || 0) - (client.profile?.monthlyExpenses || 0);
  const allFeasible = totalMonthly <= disposable;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI label="Obiective active" value={goals.length} icon={Target}/>
        <KPI label="Efort lunar total necesar" value={fmt(totalMonthly)} icon={Calculator} highlight={allFeasible && totalMonthly > 0}/>
        <div className={`rounded-sm p-5`} style={{
          background: allFeasible ? 'rgba(134,181,140,0.08)' : 'rgba(220,80,50,0.08)',
          border: `1px solid ${allFeasible ? 'rgba(134,181,140,0.3)' : 'rgba(220,80,50,0.3)'}`
        }}>
          <div className="flex items-start justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{color: allFeasible ? '#86b58c' : '#e67e5a'}}>
              {goals.length === 0 ? 'Așteaptă date' : allFeasible ? 'Plan Fezabil' : 'Plan Depășit'}
            </div>
            {allFeasible ? <CheckCircle2 className="w-4 h-4" style={{color: '#86b58c'}}/> : <AlertCircle className="w-4 h-4" style={{color: '#e67e5a'}}/>}
          </div>
          <div className="serif text-2xl text-white font-bold leading-none">
            {disposable > 0 ? `${((totalMonthly/disposable)*100).toFixed(0)}% din disponibil` : 'N/A'}
          </div>
          <div className="text-xs text-stone-400 mt-2">Disponibil: {fmt(disposable)}/lună</div>
        </div>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="glass rounded-sm p-12 text-center">
          <Target className="w-16 h-16 gold-text mx-auto mb-5"/>
          <h3 className="serif text-3xl text-white mb-3">Niciun obiectiv adăugat</h3>
          <p className="text-stone-400 mb-8 max-w-md mx-auto">Calculatorul PMT îți arată exact cât trebuie să pună deoparte clientul lunar pentru fiecare obiectiv.</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4"/> Adaugă Primul Obiectiv
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id || i}
              goal={goal}
              projection={calcProjection(goal)}
              fmt={fmt}
              isEditing={editingIdx === i}
              onEdit={() => setEditingIdx(i)}
              onSave={(updated) => updateGoal(i, updated)}
              onCancel={() => setEditingIdx(null)}
              onDelete={() => deleteGoal(i)}
              avgYield={getAvgYield()}
            />
          ))}
        </div>
      )}

      {goals.length > 0 && !showAddForm && (
        <button onClick={() => setShowAddForm(true)} className="btn-ghost w-full flex items-center justify-center gap-2">
          <Plus className="w-4 h-4"/> Adaugă Alt Obiectiv
        </button>
      )}

      {showAddForm && (
        <GoalForm 
          presets={presets}
          avgYield={getAvgYield()}
          fmt={fmt}
          onSave={addGoal}
          onCancel={() => setShowAddForm(false)}
          calcPMT={calcPMT}
        />
      )}
    </div>
  );
}

function GoalCard({ goal, projection, fmt, isEditing, onEdit, onSave, onCancel, onDelete, avgYield }) {
  const [edit, setEdit] = useState(goal);

  useEffect(() => { setEdit(goal); }, [goal, isEditing]);

  if (isEditing) {
    return (
      <div className="glass rounded-sm p-6" style={{borderColor: 'rgba(212,175,55,0.5)'}}>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <Field label="Nume obiectiv" value={edit.name} onChange={v => setEdit({...edit, name: v})}/>
          <Field label="Sumă țintă (RON)" type="number" value={edit.targetAmount} onChange={v => setEdit({...edit, targetAmount: parseFloat(v)||0})}/>
          <Field label="Termen (ani)" type="number" value={edit.years} onChange={v => setEdit({...edit, years: parseFloat(v)||0})}/>
          <Field label="Economii existente pentru obiectiv (RON)" type="number" value={edit.currentSaved || 0} onChange={v => setEdit({...edit, currentSaved: parseFloat(v)||0})}/>
          <Field label="Randament anual estimat (ex: 0.08 = 8%)" type="number" value={edit.annualYield ?? avgYield} onChange={v => setEdit({...edit, annualYield: parseFloat(v)||avgYield})}/>
          <Field label="Prioritate (1-10)" type="number" value={edit.priority || 5} onChange={v => setEdit({...edit, priority: parseInt(v)||5})}/>
        </div>
        <div>
          <div className="text-xs text-stone-400 mb-1">Motivație emoțională (de ce contează pentru client)</div>
          <textarea value={edit.emotion || ''} onChange={e => setEdit({...edit, emotion: e.target.value})} className="input-premium" style={{minHeight: '80px'}}/>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => onSave(edit)} className="btn-primary">Salvează</button>
          <button onClick={onCancel} className="btn-ghost">Anulează</button>
        </div>
      </div>
    );
  }

  const { pmt, feasible, disposable } = projection;
  const pmtRatio = disposable > 0 ? (pmt / disposable) * 100 : 0;

  return (
    <div className="glass rounded-sm p-6 group" style={{borderColor: feasible ? 'rgba(212,175,55,0.15)' : 'rgba(220,80,50,0.3)'}}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="serif text-2xl text-white">{goal.name}</h3>
            {goal.priority && <span className="text-xs gold-text font-mono">P{goal.priority}</span>}
          </div>
          {goal.emotion && <div className="text-stone-400 italic text-sm mt-1">"{goal.emotion}"</div>}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="text-stone-400 hover:gold-text p-1"><Edit3 className="w-4 h-4"/></button>
          <button onClick={onDelete} className="text-stone-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Țintă</div>
          <div className="serif text-xl text-white">{fmt(goal.targetAmount)}</div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">În</div>
          <div className="serif text-xl text-white">{goal.years} ani</div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Randament</div>
          <div className="serif text-xl text-white">{((goal.annualYield ?? avgYield)*100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Deja Economisit</div>
          <div className="serif text-xl text-white">{fmt(goal.currentSaved || 0)}</div>
        </div>
      </div>

      <div className="pt-4 border-t border-yellow-900/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold">PMT — Efort Lunar Necesar</div>
          <div className={`text-xs font-bold uppercase tracking-widest`} style={{color: feasible ? '#86b58c' : '#e67e5a'}}>
            {feasible ? '✓ Fezabil' : '× Peste buget'}
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <div className="serif text-4xl gold-text font-bold">{fmt(pmt)}<span className="text-sm text-stone-400 font-normal ml-1">/lună</span></div>
          {disposable > 0 && (
            <div className="text-xs text-stone-400">
              <span className={`font-semibold ${feasible ? 'text-green-400' : 'text-orange-400'}`}>{pmtRatio.toFixed(0)}%</span> din venit disponibil
            </div>
          )}
        </div>
        {disposable > 0 && (
          <div className="mt-3 h-1.5 rounded-full" style={{background: 'rgba(0,0,0,0.3)'}}>
            <div className="h-full rounded-full transition-all duration-1000" style={{
              width: `${Math.min(100, pmtRatio)}%`,
              background: feasible ? 'linear-gradient(90deg, #d4af37, #b8941f)' : 'linear-gradient(90deg, #e67e5a, #c04a2a)'
            }}/>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalForm({ presets, avgYield, fmt, onSave, onCancel, calcPMT }) {
  const [data, setData] = useState({ name: '', targetAmount: 100000, years: 10, currentSaved: 0, annualYield: avgYield, priority: 5, emotion: '' });
  
  const applyPreset = (preset) => {
    setData({ ...data, name: preset.label, targetAmount: preset.defaultAmount, years: preset.defaultYears });
  };

  const livePMT = calcPMT(data.targetAmount, data.years, data.currentSaved, data.annualYield);

  return (
    <div className="glass rounded-sm p-6" style={{borderColor: 'rgba(212,175,55,0.4)'}}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="serif text-2xl text-white">Obiectiv Nou</h3>
        <button onClick={onCancel} className="text-stone-400 hover:text-white"><X className="w-5 h-5"/></button>
      </div>

      <div className="mb-5">
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-3">Șablon Rapid</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {presets.map((p, i) => (
            <button key={i} onClick={() => applyPreset(p)} className="p-3 rounded-sm transition hover:bg-yellow-900/10" style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212,175,55,0.15)'}}>
              <p.icon className="w-5 h-5 gold-text mx-auto mb-2"/>
              <div className="text-[10px] text-white uppercase tracking-wider">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <Field label="Nume obiectiv" value={data.name} onChange={v => setData({...data, name: v})}/>
        <Field label="Sumă țintă (RON)" type="number" value={data.targetAmount} onChange={v => setData({...data, targetAmount: parseFloat(v)||0})}/>
        <Field label="Termen (ani)" type="number" value={data.years} onChange={v => setData({...data, years: parseFloat(v)||0})}/>
        <Field label="Economii existente (RON)" type="number" value={data.currentSaved} onChange={v => setData({...data, currentSaved: parseFloat(v)||0})}/>
        <Field label="Randament anual (ex: 0.08)" type="number" value={data.annualYield} onChange={v => setData({...data, annualYield: parseFloat(v)||avgYield})}/>
        <Field label="Prioritate (1-10)" type="number" value={data.priority} onChange={v => setData({...data, priority: parseInt(v)||5})}/>
      </div>
      <div className="mb-5">
        <div className="text-xs text-stone-400 mb-1">Motivație emoțională</div>
        <textarea value={data.emotion} onChange={e => setData({...data, emotion: e.target.value})} className="input-premium" style={{minHeight: '80px'}} placeholder="Ex: Pentru ca fata mea să studieze în străinătate fără să o apese datoriile..."/>
      </div>

      {/* Live PMT preview */}
      <div className="rounded-sm p-5 mb-5" style={{background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
        <div className="text-[11px] gold-text uppercase tracking-[0.3em] font-bold mb-2">Calcul Live PMT</div>
        <div className="serif text-4xl gold-text font-bold">{fmt(livePMT)}<span className="text-base text-stone-400 font-normal ml-1">/ lună</span></div>
        <div className="text-xs text-stone-400 mt-2">Pentru a atinge {fmt(data.targetAmount)} în {data.years} ani la {(data.annualYield*100).toFixed(1)}% randament</div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => data.name && onSave(data)} disabled={!data.name} className="btn-primary flex-1">Salvează Obiectiv</button>
        <button onClick={onCancel} className="btn-ghost">Anulează</button>
      </div>
    </div>
  );
}


function ReportTab({ client, assumptions, fmt }) {
  const reportRef = useRef();
  const p = client.profile || {};
  const s = client.strategy;
  const printReport = () => window.print();

  return (
    <div>
      <div className="flex justify-end mb-4 print:hidden">
        <button onClick={printReport} className="btn-primary flex items-center gap-2"><Download className="w-4 h-4"/> Print / Salvează PDF</button>
      </div>
      <div ref={reportRef} className="bg-stone-50 p-12 rounded-sm" style={{color: '#1a1a1a', fontFamily: 'Manrope'}}>
        <div className="text-center mb-12 pb-8 border-b" style={{borderColor: '#d4af37'}}>
          <div className="text-xs uppercase tracking-[0.4em] mb-3" style={{color: '#b8941f'}}>Plan de Investiții Personalizat</div>
          <h1 className="serif text-5xl mb-2" style={{color: '#0a1628'}}>{p.name}</h1>
          <div className="text-sm" style={{color: '#666'}}>Pregătit la {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <section className="mb-10">
          <h2 className="serif text-2xl mb-4 pb-2 border-b" style={{borderColor: '#d4af37', color: '#0a1628'}}>Profilul Tău Financiar</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <ReportRow label="Vârstă" value={`${p.age} ani`}/>
            <ReportRow label="Ocupație" value={p.occupation}/>
            <ReportRow label="Venit lunar" value={fmt(p.monthlyIncome)}/>
            <ReportRow label="Cheltuieli lunare" value={fmt(p.monthlyExpenses)}/>
            <ReportRow label="Profil de risc" value={p.riskProfile}/>
            <ReportRow label="Ani până la pensie" value={p.yearsToRetirement}/>
          </div>
        </section>

        {s && (
          <>
            <section className="mb-10">
              <h2 className="serif text-2xl mb-4 pb-2 border-b" style={{borderColor: '#d4af37', color: '#0a1628'}}>Strategia Recomandată</h2>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div><div className="text-xs uppercase tracking-wide mb-1" style={{color: '#999'}}>Sumă lunară</div><div className="serif text-3xl" style={{color: '#0a1628'}}>{fmt(s.monthlyAmount)}</div></div>
                <div><div className="text-xs uppercase tracking-wide mb-1" style={{color: '#999'}}>Orizont</div><div className="serif text-3xl" style={{color: '#0a1628'}}>{s.horizonYears} ani</div></div>
                <div><div className="text-xs uppercase tracking-wide mb-1" style={{color: '#b8941f'}}>Valoare estimată</div><div className="serif text-3xl" style={{color: '#b8941f'}}>{fmt(s.projectedFinalValue)}</div></div>
              </div>
              <p className="serif italic text-lg" style={{color: '#444'}}>"{s.rationale}"</p>
            </section>
            <section className="mb-10">
              <h2 className="serif text-2xl mb-4 pb-2 border-b" style={{borderColor: '#d4af37', color: '#0a1628'}}>Alocare Portofoliu</h2>
              {s.allocation.map((a, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between mb-1"><span className="font-semibold">{a.product}</span><span style={{color: '#b8941f'}} className="font-bold">{a.percentage}% · {fmt(s.monthlyAmount * a.percentage/100)}/lună</span></div>
                  <div className="h-2 rounded-full" style={{background: '#eee'}}><div className="h-full rounded-full" style={{width: `${a.percentage}%`, background: 'linear-gradient(90deg, #d4af37, #b8941f)'}}/></div>
                  <div className="text-xs mt-1" style={{color: '#666'}}>{a.reasoning}</div>
                </div>
              ))}
            </section>
            <section className="mb-10">
              <h2 className="serif text-2xl mb-4 pb-2 border-b" style={{borderColor: '#d4af37', color: '#0a1628'}}>De Ce Acest Plan</h2>
              <ol className="space-y-3 text-sm" style={{color: '#333'}}>
                {s.keyArguments.map((arg, i) => <li key={i}><span className="serif text-2xl mr-3" style={{color: '#b8941f'}}>{i+1}.</span>{arg}</li>)}
              </ol>
            </section>
          </>
        )}

        <div className="text-center text-xs mt-12 pt-8 border-t" style={{borderColor: '#ddd', color: '#999'}}>
          Document confidențial · Pregătit personal pentru {p.name}
        </div>
      </div>
      <style>{`@media print { body { background: white !important; } .glass, header, button { display: none !important; } }`}</style>
    </div>
  );
}

function ReportRow({ label, value }) {
  if (!value) return null;
  return <div><div className="text-xs uppercase tracking-wide" style={{color: '#999'}}>{label}</div><div className="font-semibold">{value}</div></div>;
}

function Comparator({ assumptions, fmt, currency }) {
  const [monthly, setMonthly] = useState(1000);
  const [years, setYears] = useState(15);
  const totalContrib = monthly * 12 * years;
  const fv = (rate) => monthly * ((Math.pow(1 + rate/12, 12*years) - 1) / (rate/12));
  const ulYields = Object.entries(assumptions.ulProducts).map(([n, d]) => ({ name: n, yield: d.yield - 0.018, fv: fv(d.yield - 0.018), type: 'ul' }));
  const marketYields = Object.entries(assumptions.markets).map(([n, y]) => ({ name: n, yield: y - 0.005, fv: fv(y - 0.005), type: 'market' }));
  const all = [...ulYields, ...marketYields].sort((a,b) => b.fv - a.fv);
  const max = Math.max(...all.map(x => x.fv));

  return (
    <div className="fade-up">
      <div className="text-xs gold-text uppercase tracking-[0.4em] mb-3">Comparator Universal</div>
      <h1 className="serif text-5xl text-white mb-8">Unit-Linked vs Tot Restul</h1>

      <div className="glass rounded-sm p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <label><div className="text-xs gold-text uppercase tracking-widest mb-2 font-bold">Sumă lunară (RON)</div>
            <input type="number" value={monthly} onChange={e => setMonthly(parseFloat(e.target.value)||0)} className="input-premium"/></label>
          <label><div className="text-xs gold-text uppercase tracking-widest mb-2 font-bold">Orizont (ani)</div>
            <input type="number" value={years} onChange={e => setYears(parseInt(e.target.value)||1)} className="input-premium"/></label>
        </div>
        <div className="mt-4 text-sm text-stone-400">Vei contribui în total: <span className="gold-text font-bold serif text-xl">{fmt(totalContrib)}</span></div>
      </div>

      <div className="glass rounded-sm p-6">
        <div className="space-y-2">
          {all.map(v => (
            <div key={v.name} className="flex items-center gap-4">
              <div className="w-48 flex-shrink-0">
                <div className={`text-sm font-semibold ${v.type === 'ul' ? 'gold-text' : 'text-white'}`}>{v.type === 'ul' && '★ '}{v.name}</div>
                <div className="text-[10px] text-stone-500 mono">{(v.yield*100).toFixed(1)}% net</div>
              </div>
              <div className="flex-1 relative h-9" style={{background: 'rgba(0,0,0,0.3)'}}>
                <div className="h-full transition-all duration-1000" style={{ width: `${(v.fv/max)*100}%`, background: v.type === 'ul' ? 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)' : 'linear-gradient(90deg, rgba(120,120,140,0.5), rgba(150,150,170,0.5))' }}/>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs mono font-bold" style={{color: v.type === 'ul' ? '#0a1628' : '#fff'}}>{fmt(v.fv)}</div>
              </div>
              <div className="w-32 text-right text-xs text-stone-400">+{fmt(v.fv - totalContrib)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScriptsLibrary() {
  const [activeCat, setActiveCat] = useState('opening');
  const categories = {
    opening: { label: 'Deschideri', items: [
      { title: 'Deschidere — Întâlnire în oraș', script: 'Înainte să-ți zic ce am făcut împreună cu alți oameni ca tine, vreau să înțeleg perfect unde ești tu acum. Pot să-ți pun câteva întrebări scurte? Nu te grăbi cu răspunsurile — preferăm să stăm 90 de minute ACUM și să facem lucrurile bine, decât să rectificăm ani buni mai târziu.' },
      { title: 'Deschidere — Apel zoom', script: 'Bună [Nume]. Înainte să intrăm în orice cifră, vreau să stabilim o regulă pentru următoarele 60 de minute: tu îmi spui adevărul despre situația ta, eu îți spun adevărul despre ce am văzut că funcționează la oameni cu profilul tău. Fără promisiuni magice, fără vorbe goale. OK?' }
    ]},
    discovery: { label: 'Discovery', items: [
      { title: 'Întrebări deschise pentru emoție', script: '1) Dacă peste 10 ani ai fi exact unde îți dorești să fii financiar, cum ar arăta o luni dimineața tipică pentru tine?\n2) Care a fost ultima dată când ai simțit că banii îți limitează o decizie?\n3) Pentru cine vrei tu cel mai mult să reușești asta?' },
      { title: 'Identificare profil risc — fără chestionar', script: 'Spune-mi: dacă ai pus 100.000 RON acum un an într-o investiție și azi îți zic că au devenit 75.000, dar e doar volatilitate temporară — cum reacționezi? Vinzi tot? Aștepți? Mai pui pe ofertă?' }
    ]},
    closing: { label: 'Închidere', items: [
      { title: 'Închidere prin asumare', script: 'Pe baza a tot ce mi-ai spus, planul tău este: [sumă lunară] în [produse], pe [ani] ani. Asta înseamnă că la 55 de ani ai aproximativ [sumă] disponibili. Care e singurul lucru care te-ar putea opri să începem mâine cu primii pași?' },
      { title: 'Închidere prin urgență — cost inacțiune', script: 'Hai să fim direcți: dacă mai amâni 3 ani, casa pe care o vrei va costa cu [X] RON mai mult, iar din cei 30 de ani de capitalizare îți rămân 27. Asta înseamnă matematic [Y] RON mai puțin în portofoliu la pensie. Suma asta merită amânarea?' }
    ]},
    objections: { label: 'Obiecții Universale', items: [
      { title: '"Mă mai gândesc"', script: 'Te înțeleg, e o decizie importantă. Hai să verific — ce anume vrei să mai analizezi? Ce nu e încă suficient de clar pentru tine? (Dacă răspunde "nu știu" → "Atunci s-ar putea să nu fie despre informație, ci despre încredere. Spune-mi ce ar trebui să-mi auzi sau să-mi vezi ca să fii confortabil să începem?")' },
      { title: '"E prea scump"', script: 'Înțeleg perspectiva. Hai să refacem socoteala împreună: investești [X] RON pe lună, asta înseamnă [X/30] RON pe zi. Cât cheltui pe cafea sau livrări săptămânal? Întrebarea reală nu e dacă e scump — e dacă obiectivul tău (casa, copilul, pensia) merită această sumă pe zi.' },
      { title: '"Vreau să discut cu soția/soțul"', script: 'Absolut, deciziile mari se iau împreună. Hai să stabilim un detaliu: vrei să-ți pregătesc materialele într-un format pe care i-l poți arăta clar, sau preferi să venim împreună la o întâlnire scurtă unde răspund la toate întrebările? În experiența mea, partea a doua scoate decizia mult mai rapid.' }
    ]}
  };

  return (
    <div className="fade-up">
      <div className="text-xs gold-text uppercase tracking-[0.4em] mb-3">Bibliotecă</div>
      <h1 className="serif text-5xl text-white mb-8">Scripts & Obiecții</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(categories).map(([k, c]) => (
          <button key={k} onClick={() => setActiveCat(k)} 
            className={`px-5 py-2.5 text-xs uppercase tracking-widest font-bold rounded-sm transition ${activeCat === k ? 'gold-bg' : ''}`}
            style={activeCat === k ? {color:'#0a1628'} : {background: 'rgba(0,0,0,0.3)', color: '#d4d4d4', border: '1px solid rgba(212,175,55,0.2)'}}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {categories[activeCat].items.map((item, i) => (
          <div key={i} className="glass rounded-sm p-6">
            <h3 className="serif text-xl text-white mb-3">{item.title}</h3>
            <div className="text-stone-200 leading-relaxed whitespace-pre-line">{item.script}</div>
            <CopyBtn text={item.script}/>
          </div>
        ))}
      </div>
    </div>
  );
}
