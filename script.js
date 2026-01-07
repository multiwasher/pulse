const { useState, useEffect, useCallback, useMemo } = React;

// 1. CONFIGURAÇÃO FIREBASE (As tuas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyDX_fcMzzOXTaBh2VszUh-j_kmApR0fiv8",
  authDomain: "manutencao-fabrica.firebaseapp.com",
  projectId: "manutencao-fabrica",
  storageBucket: "manutencao-fabrica.firebasestorage.app",
  messagingSenderId: "322227932590",
  appId: "1:322227932590:web:2459b650fb9ca7c3b14c3f"
};

// Inicialização segura
let db, auth;
try {
  const firebaseApp = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
  db = firebase.firestore();
  auth = firebase.auth();
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
}

// Assets de Imagem
const LAYOUT_IMAGE = "https://static.wixstatic.com/media/a6967f_aac24f82eec442c8992856c104e39d20~mv2.png";
const SPLASH_IMAGE = "https://static.wixstatic.com/media/a6967f_1a75ce18a54d46f8994283c1798fbbfb~mv2.png";
const CORNER_LOGO = "https://static.wixstatic.com/media/a6967f_eee0d017524f4a48bf2870cc2385c10b~mv2.png";

const POINT_VALUES = { sad: 0, neutral: 1, happy: 3 };
const MAX_POINTS_PER_EVAL = 3;

// Componentes de Ícones SVG
const Icons = {
  Heart: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
  ),
  Map: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>,
  Stats: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Send: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

const SmileyFace = ({ type, className = "" }) => {
  const BaseFace = ({ children }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"/>
      <circle cx="33" cy="40" r="6" fill="currentColor"/><circle cx="67" cy="40" r="6" fill="currentColor"/>
      {children}
    </svg>
  );
  if (type === 'happy') return <BaseFace><path d="M30 65C35 72 42 75 50 75C58 75 65 72 70 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/></BaseFace>;
  if (type === 'neutral') return <BaseFace><path d="M30 65H70" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/></BaseFace>;
  if (type === 'sad') return <BaseFace><path d="M30 75C35 68 42 65 50 65C58 65 65 68 70 75" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/></BaseFace>;
  return null;
};

function App() {
  const [view, setView] = useState('splash');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState('map');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [points, setPoints] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [historyLogs, setHistoryLogs] = useState([]);
  
  // SESSÃO LOCAL (Pendentes)
  const [pendingEvaluations, setPendingEvaluations] = useState({});
  
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [activeEval, setActiveEval] = useState(null);
  const [newPointModal, setNewPointModal] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetToSplash = useCallback(() => { 
    if (view === 'app' && !isAdmin) {
      setView('splash');
      setPendingEvaluations({});
    }
  }, [view, isAdmin]);

  useEffect(() => {
    if (view !== 'app' || isAdmin) return;
    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart'];
    let timeout = setTimeout(resetToSplash, 60000);
    const reset = () => { clearTimeout(timeout); timeout = setTimeout(resetToSplash, 60000); };
    events.forEach(e => window.addEventListener(e, reset));
    return () => { clearTimeout(timeout); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [view, isAdmin, resetToSplash]);

  useEffect(() => {
    if (!auth) return;
    auth.signInAnonymously();
    const unsubAuth = auth.onAuthStateChanged(setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const appIdPath = "factory-maintenance-app";
    const dataRef = db.collection('artifacts').doc(appIdPath).collection('public').doc('data');

    const unsubPoints = dataRef.collection('config_points').onSnapshot(snap => 
      setPoints(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    const unsubEvals = dataRef.collection('daily_evals').onSnapshot(snap => {
      const evs = {}; snap.docs.forEach(doc => evs[doc.id] = doc.data().status);
      setEvaluations(evs);
    });
    const unsubLogs = dataRef.collection('history_logs').onSnapshot(snap => 
      setHistoryLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    
    return () => { unsubPoints(); unsubEvals(); unsubLogs(); };
  }, [user]);

  // ESTATÍSTICAS POR RÁCIO DE PERFORMANCE
  const stats = useMemo(() => {
    const s = {}; 
    points.forEach(p => s[p.id] = { name: p.name, score: 0, count: 0 });
    
    historyLogs.forEach(log => { 
      if (s[log.pointId]) { 
        s[log.pointId].score += log.score; 
        s[log.pointId].count++; 
      } 
    });

    const list = Object.values(s).filter(x => x.count > 0).map(st => {
      const potential = st.count * MAX_POINTS_PER_EVAL;
      return { ...st, performance: (st.score / potential) * 100 };
    });

    const totalScore = list.reduce((a, b) => a + b.score, 0);
    const totalPotential = list.reduce((a, b) => a + (b.count * 3), 0);
    const globalAvg = totalPotential > 0 ? (totalScore / totalPotential) * 100 : 0;

    return { 
      list: list.sort((a,b) => b.performance - a.performance), 
      avg: globalAvg.toFixed(1), 
      total: list.reduce((a, b) => a + b.count, 0)
    };
  }, [points, historyLogs]);

  // ENVIO EM BATCH E LIMPEZA
  const submitAll = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    const batch = db.batch();
    const dataRef = db.collection('artifacts').doc("factory-maintenance-app").collection('public').doc('data');

    try {
      for (const [id, status] of Object.entries(pendingEvaluations)) {
        // 1. Grava no histórico
        const logRef = dataRef.collection('history_logs').doc();
        batch.set(logRef, {
          pointId: id,
          status,
          score: POINT_VALUES[status],
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        // 2. Apaga do estado atual (limpa o mapa)
        const evalRef = dataRef.collection('daily_evals').doc(id);
        batch.delete(evalRef);
      }
      await batch.commit();
      setPendingEvaluations({});
      setView('splash');
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  const savePoint = async () => {
    if (!newPointModal.name.trim()) return;
    const path = db.collection('artifacts').doc('factory-maintenance-app').collection('public').doc('data');
    await path.collection('config_points').add({
      name: newPointModal.name.toUpperCase(),
      x: newPointModal.x,
      y: newPointModal.y,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    setNewPointModal(null);
  };

  if (view === 'splash') {
    return (
      <div onClick={() => setView('app')} className="min-h-screen bg-white flex items-center justify-center cursor-pointer relative overflow-hidden">
        <div className="absolute top-8 left-8 z-10"><img src={CORNER_LOGO} className="w-[191px] md:w-[286px]" /></div>
        <div className="relative flex items-center justify-center w-full h-full max-h-[90vh]">
          <img src={SPLASH_IMAGE} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-[3rem]" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-red-500 animate-heartbeat">
            <Icons.Heart size={120} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 select-none flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`${isAdmin ? 'bg-amber-500' : 'bg-indigo-600'} p-3.5 rounded-2xl text-white shadow-xl`}><Icons.Map /></div>
          <div>
            <h1 className="font-black uppercase tracking-tighter text-2xl leading-none">{isAdmin ? 'Análise Gestão' : 'Ronda Industrial'}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Performance em Rácio</p>
          </div>
        </div>
        <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-slate-100 hover:border-indigo-600 transition-all">{isAdmin ? 'Sair' : 'Gestão'}</button>
      </nav>

      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-[1400px] mx-auto p-4 md:p-10 pb-40">
          {isAdmin ? (
            <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 text-white p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden">
                   <p className="font-black uppercase text-xs tracking-widest mb-2 opacity-70">Rácio Global</p>
                   <h4 className="text-7xl font-black">{stats.avg}%</h4>
                </div>
                <div className="bg-white border-2 border-slate-100 p-10 rounded-[3.5rem] flex items-center gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl text-indigo-600"><Icons.Stats /></div>
                  <div><p className="text-slate-400 font-black uppercase text-xs mb-1">Total Inspeções</p><h4 className="text-4xl font-black">{stats.total}</h4></div>
                </div>
                <div className="bg-white border-2 border-slate-100 p-10 rounded-[3.5rem] flex items-center gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl text-indigo-600"><Icons.Check /></div>
                  <div><p className="text-slate-400 font-black uppercase text-xs mb-1">Postos Ativos</p><h4 className="text-4xl font-black">{points.length}</h4></div>
                </div>
              </div>
              <div className="bg-white border-2 border-slate-100 rounded-[4rem] p-10">
                <h3 className="text-2xl font-black uppercase mb-10 px-4">Performance Individual (% Pontuação Máxima)</h3>
                {stats.list.map(s => (
                  <div key={s.name} className="bg-slate-50 p-8 rounded-3xl mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-xl font-black uppercase tracking-tight">{s.name}</h5>
                      <span className="font-bold text-indigo-600">{s.performance.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.performance}%`, background: 'linear-gradient(90deg, rgb(81, 184, 234) 0%, rgb(27, 71, 148) 100%)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative bg-white rounded-[4rem] shadow-2xl overflow-hidden border-[16px] border-white ring-1 ring-slate-200">
              <img src={LAYOUT_IMAGE} className="w-full h-auto block" />
              {points.map(pt => {
                const status = pendingEvaluations[pt.id] || evaluations[pt.id];
                const isPending = !!pendingEvaluations[pt.id];
                return (
                  <div key={pt.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ top: `${pt.y}%`, left: `${pt.x}%` }}>
                    <button onClick={() => setActiveEval(pt)} className={`group flex flex-col items-center gap-2 transition-all ${isPending ? 'scale-110' : 'active:scale-95'}`}>
                      <div className={`button-group-border p-1.5 flex items-center gap-1.5 shadow-2xl ${isPending ? 'ring-4 ring-indigo-400 ring-offset-4' : ''}`}>
                        <SmileyFace type="sad" className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${status === 'sad' ? 'bg-red-500 text-white shadow-lg' : 'text-white/20'}`} />
                        <SmileyFace type="neutral" className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${status === 'neutral' ? 'bg-yellow-500 text-white shadow-lg' : 'text-white/20'}`} />
                        <SmileyFace type="happy" className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${status === 'happy' ? 'bg-green-500 text-white shadow-lg' : 'text-white/20'}`} />
                      </div>
                      <div className={`label-gradient text-white text-[10px] font-black px-4 py-2 uppercase tracking-widest shadow-xl flex items-center gap-3 ${isPending ? 'bg-indigo-600' : ''}`}>
                        {pt.name}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FAB - BOTÃO DE ENVIO (SÓ ÍCONE) */}
      {!isAdmin && Object.keys(pendingEvaluations).length > 0 && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10">
          <button onClick={submitAll} disabled={isSubmitting} className="group relative w-24 h-24 bg-indigo-600 text-white rounded-full shadow-[0_15px_35px_rgba(79,70,229,0.5)] flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all outline-none">
            {isSubmitting ? <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <Icons.Send />}
            <div className="absolute -top-1 -right-1 w-10 h-10 bg-red-500 text-white text-lg font-black rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              {Object.keys(pendingEvaluations).length}
            </div>
          </button>
        </div>
      )}

      {/* MODAL ESCOLHA STATUS */}
      {activeEval && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-6 text-center animate-in fade-in">
          <div className="bg-white rounded-[5rem] p-12 md:p-16 w-full max-w-5xl shadow-2xl flex flex-col items-center">
            <header className="mb-10 text-center">
              <h3 className="text-6xl md:text-8xl font-black text-slate-900 mb-4 uppercase tracking-tighter leading-none">{activeEval.name}</h3>
              <p className="text-slate-400 font-medium text-2xl uppercase">Qual o estado desta estação?</p>
            </header>
            <div className="grid grid-cols-3 gap-6 md:gap-10 mb-12 w-full max-w-4xl">
              <button onClick={() => { setPendingEvaluations({...pendingEvaluations, [activeEval.id]: 'happy'}); setActiveEval(null); }} className="group flex flex-col items-center gap-6 p-10 rounded-[4rem] bg-slate-50 border-4 border-transparent hover:border-green-500 hover:bg-green-50 transition-all active:scale-95 shadow-xl">
                <SmileyFace type="happy" className="w-32 h-32 md:w-48 md:h-48 text-green-500" /><span className="font-black text-xl uppercase text-green-600">Excelente</span>
              </button>
              <button onClick={() => { setPendingEvaluations({...pendingEvaluations, [activeEval.id]: 'neutral'}); setActiveEval(null); }} className="group flex flex-col items-center gap-6 p-10 rounded-[4rem] bg-slate-50 border-4 border-transparent hover:border-yellow-500 hover:bg-yellow-50 transition-all active:scale-95 shadow-xl">
                <SmileyFace type="neutral" className="w-32 h-32 md:w-48 md:h-48 text-yellow-500" /><span className="font-black text-xl uppercase text-yellow-600">Aceitável</span>
              </button>
              <button onClick={() => { setPendingEvaluations({...pendingEvaluations, [activeEval.id]: 'sad'}); setActiveEval(null); }} className="group flex flex-col items-center gap-6 p-10 rounded-[4rem] bg-slate-50 border-4 border-transparent hover:border-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-xl">
                <SmileyFace type="sad" className="w-32 h-32 md:w-48 md:h-48 text-red-500" /><span className="font-black text-xl uppercase text-red-600">Crítico</span>
              </button>
            </div>
            <button onClick={() => setActiveEval(null)} className="py-8 px-16 bg-slate-100 text-slate-500 rounded-[3rem] font-black uppercase text-xl hover:bg-slate-200 transition-all">Cancelar</button>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-white rounded-[4rem] p-16 w-full max-w-xl shadow-2xl relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-10 right-10 text-slate-400"><Icons.Check /></button>
            <h3 className="text-4xl font-black mb-12 uppercase text-center">Acesso Gestão</h3>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder="Utilizador" className="w-full bg-slate-50 p-8 rounded-3xl text-2xl font-bold outline-none border-4 border-transparent focus:border-indigo-500 shadow-inner" onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
              <input type="password" placeholder="Pass" className="w-full bg-slate-50 p-8 rounded-3xl text-2xl font-bold outline-none border-4 border-transparent focus:border-indigo-500 shadow-inner" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-8 rounded-3xl text-xl uppercase shadow-xl hover:bg-indigo-700 transition-all">Entrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Renderização
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);