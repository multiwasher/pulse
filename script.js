const { useState, useEffect, useCallback, useMemo } = React;

// 1. CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDX_fcMzzOXTaBh2VszUh-j_kmApR0fiv8",
  authDomain: "manutencao-fabrica.firebaseapp.com",
  projectId: "manutencao-fabrica",
  storageBucket: "manutencao-fabrica.firebasestorage.app",
  messagingSenderId: "322227932590",
  appId: "1:322227932590:web:2459b650fb9ca7c3b14c3f"
};

// Inicialização segura do Firebase (SDK Compat)
let db, auth;
try {
  const firebaseApp = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
  db = firebase.firestore();
  auth = firebase.auth();
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
}

// Recursos de Imagem
const LAYOUT_IMAGE = "https://static.wixstatic.com/media/a6967f_aac24f82eec442c8992856c104e39d20~mv2.png";
const SPLASH_IMAGE = "https://static.wixstatic.com/media/a6967f_1a75ce18a54d46f8994283c1798fbbfb~mv2.png";
const CORNER_LOGO = "https://static.wixstatic.com/media/a6967f_eee0d017524f4a48bf2870cc2385c10b~mv2.png";

// Sistema de Pontuação
const POINT_VALUES = { sad: 0, neutral: 1, happy: 3 };

// Componentes de Ícones SVG Inline
const Icons = {
  Heart: ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  Map: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
  ),
  Stats: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  )
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
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [activeEval, setActiveEval] = useState(null);
  const [newPointModal, setNewPointModal] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const resetToSplash = useCallback(() => { 
    if (view === 'app' && !isAdmin) setView('splash'); 
  }, [view, isAdmin]);

  useEffect(() => {
    if (view !== 'app' || isAdmin) return;
    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart'];
    let timeout = setTimeout(resetToSplash, 20000);
    const reset = () => { clearTimeout(timeout); timeout = setTimeout(resetToSplash, 20000); };
    events.forEach(e => window.addEventListener(e, reset));
    return () => { clearTimeout(timeout); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [view, isAdmin, resetToSplash]);

  // 1. Efeito de Autenticação: Garante login antes de qualquer query
  useEffect(() => {
    if (!auth) return;
    
    const initAuth = async () => {
      try {
        await auth.signInAnonymously();
      } catch (e) {
        console.error("Erro na autenticação anónima:", e);
      }
    };

    initAuth();
    
    // Listener para o estado da autenticação
    const unsubscribeAuth = auth.onAuthStateChanged((currUser) => {
      setUser(currUser);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Efeito de Dados: Só corre quando o 'user' estiver autenticado
  useEffect(() => {
    if (!db || !user) return;

    const appIdPath = "factory-maintenance-app";
    const dataRef = db.collection('artifacts').doc(appIdPath).collection('public').doc('data');

    // Funções de erro para os listeners (obrigatório para depuração)
    const handleError = (err) => console.error("Erro no listener Firestore:", err);

    const unsubPoints = dataRef.collection('config_points').onSnapshot(snap => {
      setPoints(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, handleError);

    const unsubEvals = dataRef.collection('daily_evals').onSnapshot(snap => {
      const evs = {}; 
      snap.docs.forEach(doc => evs[doc.id] = doc.data().status);
      setEvaluations(evs);
    }, handleError);

    const unsubLogs = dataRef.collection('history_logs').onSnapshot(snap => {
      setHistoryLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, handleError);
    
    return () => { 
      unsubPoints(); 
      unsubEvals(); 
      unsubLogs(); 
    };
  }, [user]); // Depende do estado 'user'

  const stats = useMemo(() => {
    const s = {}; 
    points.forEach(p => s[p.id] = { name: p.name, happy: 0, neutral: 0, sad: 0, score: 0, count: 0 });
    historyLogs.forEach(log => { 
      if (s[log.pointId]) { 
        s[log.pointId][log.status]++; 
        s[log.pointId].score += log.score; 
        s[log.pointId].count++; 
      } 
    });
    const list = Object.values(s).filter(x => x.count > 0);
    const totalScore = list.reduce((a, b) => a + b.score, 0);
    const totalCount = list.reduce((a, b) => a + b.count, 0);
    return { 
      list: list.sort((a,b) => (b.score/b.count) - (a.score/a.count)), 
      avg: totalCount > 0 ? (totalScore/totalCount).toFixed(1) : 0, 
      total: totalCount 
    };
  }, [points, historyLogs]);

  const submitEval = async (id, status) => {
    if (db && user) {
      const path = db.collection('artifacts').doc('factory-maintenance-app').collection('public').doc('data');
      await path.collection('daily_evals').doc(id).set({ status, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      await path.collection('history_logs').add({ 
        pointId: id, 
        status, 
        score: POINT_VALUES[status], 
        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
      });
    }
    setActiveEval(null);
    setView('splash');
  };

  const savePoint = async () => {
    if (!newPointModal.name.trim() || !user) return;
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
        <div className="absolute top-8 left-8 z-10"><img src={CORNER_LOGO} className="w-[191px] md:w-[286px] h-auto" /></div>
        <img src={SPLASH_IMAGE} className="max-w-full max-h-[90vh] object-contain drop-shadow-2xl rounded-[3rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-red-500 animate-heartbeat"><Icons.Heart size={96} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 select-none">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`${isAdmin ? 'bg-amber-500' : 'bg-indigo-600'} p-3.5 rounded-2xl text-white shadow-xl`}><Icons.Map /></div>
          <div>
            <h1 className="font-black uppercase tracking-tighter text-2xl leading-none">{isAdmin ? 'Análise Gestão' : 'Manutenção Postos'}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Planta Industrial Ativa</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mr-4 shadow-inner">
               <button onClick={() => setAdminMode('map')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${adminMode === 'map' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Mapa</button>
               <button onClick={() => setAdminMode('dashboard')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${adminMode === 'dashboard' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Dashboard</button>
            </div>
          )}
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-slate-100 hover:border-indigo-600 transition-all">{isAdmin ? 'Sair' : 'Gestão'}</button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 md:p-10 pb-32">
        {!user && (
          <div className="bg-blue-50 text-blue-600 p-4 rounded-xl text-center font-bold animate-pulse">
            A ligar ao servidor...
          </div>
        )}
        
        {isAdmin && adminMode === 'dashboard' ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-600 text-white p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden">
                <p className="font-black uppercase text-xs tracking-widest mb-2 opacity-70">Média Global</p>
                <h4 className="text-7xl font-black">{stats.avg} <span className="text-xl opacity-60">/ 3.0</span></h4>
              </div>
              <div className="bg-white border-2 border-slate-100 p-10 rounded-[3.5rem] shadow-sm flex items-center gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl text-indigo-600 shadow-inner"><Icons.Stats /></div>
                <div><p className="text-slate-400 font-black uppercase text-xs mb-1">Total Avaliações</p><h4 className="text-4xl font-black">{stats.total}</h4></div>
              </div>
            </div>
            <div className="bg-white border-2 border-slate-100 rounded-[4rem] p-10 shadow-sm">
              <h3 className="text-2xl font-black uppercase mb-10 px-4">Performance por Posto</h3>
              {stats.list.map(s => (
                <div key={s.name} className="bg-slate-50 p-8 rounded-3xl mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-xl font-black uppercase tracking-tight">{s.name}</h5>
                    <span className="font-bold text-indigo-600">{(s.score/s.count).toFixed(1)} pts</span>
                  </div>
                  <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${((s.score/s.count)/3)*100}%`, background: 'linear-gradient(90deg, rgb(81, 184, 234) 0%, rgb(27, 71, 148) 100%)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative bg-white rounded-[4rem] shadow-2xl overflow-hidden border-[16px] border-white ring-1 ring-slate-200">
            <img src={LAYOUT_IMAGE} className="w-full h-auto block" onClick={(e) => {
                if (isAdmin && adminMode === 'map') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setNewPointModal({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100, name: '' });
                }
            }} style={{ cursor: isAdmin ? 'crosshair' : 'default' }} />
            {points.map(pt => {
              const status = evaluations[pt.id];
              return (
                <div key={pt.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ top: `${pt.y}%`, left: `${pt.x}%` }}>
                  <button onClick={() => !isAdmin && setActiveEval(pt)} className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
                    <div className="button-group-border p-1.5 flex items-center gap-1.5 shadow-2xl">
                      <SmileyFace type="sad" className={`w-10 h-10 rounded-full ${status === 'sad' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-white/20'}`} />
                      <SmileyFace type="neutral" className={`w-10 h-10 rounded-full ${status === 'neutral' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' : 'text-white/20'}`} />
                      <SmileyFace type="happy" className={`w-10 h-10 rounded-full ${status === 'happy' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'text-white/20'}`} />
                    </div>
                    <div className="label-gradient text-white text-[10px] font-black px-4 py-2 uppercase tracking-widest shadow-xl flex items-center gap-3">
                      {pt.name}
                      {isAdmin && (
                        <span onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(pt.id); }} className="hover:text-red-200 transition-colors"><Icons.Trash /></span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAIS (Login, Avaliação, Configuração) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 text-center">
          <div className="bg-white rounded-[4rem] p-16 w-full max-w-xl shadow-2xl">
            <h3 className="text-4xl font-black mb-12 uppercase">Acesso Gestão</h3>
            <input type="text" placeholder="Utilizador" className="w-full bg-slate-50 p-8 rounded-3xl text-2xl font-bold mb-4 outline-none border-4 border-transparent focus:border-indigo-500 shadow-inner" onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" placeholder="Pass" className="w-full bg-slate-50 p-8 rounded-3xl text-2xl font-bold mb-8 outline-none border-4 border-transparent focus:border-indigo-500 shadow-inner" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            <button onClick={() => { if(loginForm.user==='GESTÃO'&&loginForm.pass==='789'){setIsAdmin(true); setShowLoginModal(false);} }} className="w-full bg-indigo-600 text-white font-black py-8 rounded-3xl text-xl uppercase shadow-xl active:scale-95 transition-transform">Entrar</button>
            <button onClick={() => setShowLoginModal(false)} className="mt-6 text-slate-400 font-bold uppercase tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      {activeEval && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-6 text-center">
          <div className="bg-white rounded-[5rem] p-12 md:p-20 w-full max-w-5xl shadow-2xl overflow-y-auto max-h-[95vh]">
            <header className="mb-16">
              <div className="inline-flex items-center gap-3 bg-indigo-50 text-indigo-600 px-8 py-3 rounded-full text-sm font-black uppercase mb-10"><Icons.Check /> Station Verification</div>
              <h3 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 uppercase tracking-tighter leading-none">{activeEval.name}</h3>
              <p className="text-slate-400 font-medium text-2xl mb-16 uppercase tracking-tight">Select current maintenance state (0-3 points):</p>
            </header>
            <div className="grid grid-cols-3 gap-8 md:gap-12 mb-20">
              <button onClick={() => submitEval(activeEval.id, 'happy')} className="group flex flex-col items-center gap-10 p-12 rounded-[4rem] bg-slate-50 hover:bg-green-50 active:scale-95 shadow-lg border-4 border-transparent hover:border-green-100 transition-all"><SmileyFace type="happy" className="w-40 h-40 md:w-56 md:h-56 text-green-500 drop-shadow-2xl" /><span className="font-black text-2xl uppercase text-green-600">Excellent (3)</span></button>
              <button onClick={() => submitEval(activeEval.id, 'neutral')} className="group flex flex-col items-center gap-10 p-12 rounded-[4rem] bg-slate-50 hover:bg-yellow-50 active:scale-95 shadow-lg border-4 border-transparent hover:border-yellow-100 transition-all"><SmileyFace type="neutral" className="w-40 h-40 md:w-56 md:h-56 text-yellow-500 drop-shadow-2xl" /><span className="font-black text-2xl uppercase text-yellow-600">Acceptable (1)</span></button>
              <button onClick={() => submitEval(activeEval.id, 'sad')} className="group flex flex-col items-center gap-10 p-12 rounded-[4rem] bg-slate-50 hover:bg-red-50 active:scale-95 shadow-lg border-4 border-transparent hover:border-red-100 transition-all"><SmileyFace type="sad" className="w-40 h-40 md:w-56 md:h-56 text-red-500 drop-shadow-2xl" /><span className="font-black text-2xl uppercase text-red-600">Critical (0)</span></button>
            </div>
            <button onClick={() => setActiveEval(null)} className="w-full py-10 bg-slate-100 text-slate-500 rounded-[3rem] font-black uppercase text-xl shadow-inner">Close Without Saving</button>
          </div>
        </div>
      )}

      {newPointModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 text-center">
          <div className="bg-white rounded-[4rem] p-16 w-full max-w-2xl shadow-2xl">
            <h3 className="text-4xl font-black mb-10 uppercase tracking-tight leading-none">Novo Posto</h3>
            <input autoFocus className="w-full bg-slate-50 p-8 rounded-3xl text-3xl font-black outline-none mb-12 uppercase text-center focus:border-amber-500 transition-all shadow-inner" placeholder="NOME DO POSTO" onChange={e => setNewPointModal({...newPointModal, name: e.target.value})} />
            <div className="flex gap-6">
              <button onClick={() => setNewPointModal(null)} className="flex-1 font-black text-slate-400 uppercase tracking-widest text-lg py-8">Cancelar</button>
              <button onClick={savePoint} className="flex-1 bg-amber-500 text-white font-black py-8 rounded-3xl uppercase tracking-widest text-lg shadow-xl">Criar</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6 text-center">
          <div className="bg-white rounded-[4rem] p-16 w-full max-w-xl shadow-2xl">
            <h3 className="text-4xl font-black mb-6 uppercase tracking-tight">Eliminar Posto?</h3>
            <p className="text-slate-400 text-xl font-medium mb-16 leading-relaxed">Esta zona deixará de estar visível para os operadores.</p>
            <div className="flex gap-6">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 font-black text-slate-400 uppercase tracking-widest text-lg py-8">Não</button>
              <button onClick={async () => {
                const appIdPath = "factory-maintenance-app";
                const dataRef = db.collection('artifacts').doc(appIdPath).collection('public').doc('data');
                await dataRef.collection('config_points').doc(deleteConfirmId).delete();
                setDeleteConfirmId(null);
              }} className="flex-1 bg-red-600 text-white font-black py-8 rounded-3xl uppercase tracking-widest text-lg shadow-xl">Sim, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inicialização da Renderização
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);