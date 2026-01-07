const { useState, useEffect, useCallback } = React;

// CONFIGURAÇÃO FIREBASE (Substituir com config real)
const firebaseConfig = {
  apiKey: "",
  authDomain: "default.firebaseapp.com",
  projectId: "default",
  storageBucket: "default.appspot.com",
  messagingSenderId: "",
  appId: "default"
};

// Inicialização (Check if already initialized for CodePen hot-reloads)
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const db = firebase.firestore();
const auth = firebase.auth();
const appId = "factory-maintenance-app";

// URLs de Imagens
const LAYOUT_IMAGE = "https://static.wixstatic.com/media/a6967f_aac24f82eec442c8992856c104e39d20~mv2.png";
const SPLASH_IMAGE = "https://static.wixstatic.com/media/a6967f_1a75ce18a54d46f8994283c1798fbbfb~mv2.png";
const CORNER_LOGO = "https://static.wixstatic.com/media/a6967f_eee0d017524f4a48bf2870cc2385c10b~mv2.png";

// Helper para Ícones Lucide no React do CodePen
const Icon = ({ name, size = 24, className = "" }) => {
  return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
};

// Componente Smiley Face (SVG Inline)
const SmileyFace = ({ type, className = "" }) => {
  const BaseFace = ({ children }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8"/>
      <circle cx="33" cy="40" r="6" fill="currentColor"/>
      <circle cx="67" cy="40" r="6" fill="currentColor"/>
      {children}
    </svg>
  );

  if (type === 'happy') return (
    <BaseFace>
      <path d="M30 65C35 72 42 75 50 75C58 75 65 72 70 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
    </BaseFace>
  );
  if (type === 'neutral') return (
    <BaseFace>
      <path d="M30 65H70" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
    </BaseFace>
  );
  if (type === 'sad') return (
    <BaseFace>
      <path d="M30 75C35 68 42 65 50 65C58 65 65 68 70 75" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
    </BaseFace>
  );
  return <div className={className} />;
};

function App() {
  const [view, setView] = useState('splash');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [points, setPoints] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [activeEval, setActiveEval] = useState(null);
  const [newPointModal, setNewPointModal] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Inatividade
  const resetToSplash = useCallback(() => {
    if (view === 'app' && !isAdmin) {
      setView('splash');
      setActiveEval(null);
    }
  }, [view, isAdmin]);

  useEffect(() => {
    if (view !== 'app' || isAdmin) return;
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'touchstart'];
    let timeoutId = setTimeout(resetToSplash, 20000);
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(resetToSplash, 20000);
    };
    activityEvents.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [view, isAdmin, resetToSplash]);

  // Auth & Sync
  useEffect(() => {
    auth.signInAnonymously().catch(console.error);
    const unsubAuth = auth.onAuthStateChanged(setUser);
    
    // Refresh icons whenever view changes or modals open
    if (window.lucide) window.lucide.createIcons();
    
    return () => unsubAuth();
  }, [view, activeEval, showLoginModal, newPointModal]);

  useEffect(() => {
    if (!user) return;
    const ptsRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('config_points');
    const unsubPoints = ptsRef.onSnapshot(snap => {
      setPoints(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const evalsRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('daily_evals');
    const unsubEvals = evalsRef.onSnapshot(snap => {
      const evs = {};
      snap.docs.forEach(doc => { evs[doc.id] = doc.data().status; });
      setEvaluations(evs);
    });

    return () => { unsubPoints(); unsubEvals(); };
  }, [user]);

  // Handlers
  const handleMapClick = (e) => {
    if (!isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPointModal({ x, y, name: '' });
  };

  const saveNewPoint = async () => {
    if (!newPointModal.name.trim()) return;
    await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('config_points').add({
      name: newPointModal.name.toUpperCase(),
      x: newPointModal.x,
      y: newPointModal.y,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    setNewPointModal(null);
  };

  const submitEvaluation = async (pointId, status) => {
    const docRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('daily_evals').doc(pointId);
    await docRef.set({ status, timestamp: firebase.firestore.FieldValue.serverTimestamp(), userId: user.uid });
    setActiveEval(null);
  };

  if (view === 'splash') {
    return (
      <div onClick={() => setView('app')} className="min-h-screen bg-white flex items-center justify-center cursor-pointer overflow-hidden fade-in relative">
        <div className="absolute top-8 left-8 z-10">
          <img src={CORNER_LOGO} alt="Corner Logo" className="w-[191px] md:w-[286px] h-auto object-contain" />
        </div>
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img src={SPLASH_IMAGE} alt="Splash" className="max-w-full max-h-[90vh] object-contain drop-shadow-2xl rounded-[3rem]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-red-500 fill-red-500 animate-heartbeat">
             <svg width="96" height="96" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`${isAdmin ? 'bg-amber-500' : 'bg-indigo-600'} p-3.5 rounded-2xl text-white shadow-xl`}>
             <Icon name={isAdmin ? "settings" : "map"} size={28} />
          </div>
          <div className="cursor-pointer" onClick={() => setView('splash')}>
            <h1 className="font-black uppercase tracking-tighter text-2xl leading-none">
              {isAdmin ? 'Gestão de Pontos' : 'Manutenção Postos'}
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Planta Industrial Ativa</p>
          </div>
        </div>
        <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-200">
          {isAdmin ? 'Sair' : 'Gestão'}
        </button>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 md:p-10">
        <div className="relative bg-white rounded-[4rem] shadow-2xl overflow-hidden border-[16px] border-white ring-1 ring-slate-200">
          <img src={LAYOUT_IMAGE} alt="Map" className="w-full h-auto block" onClick={handleMapClick} style={{ cursor: isAdmin ? 'crosshair' : 'default' }} />
          {points.map(pt => {
            const status = evaluations[pt.id];
            return (
              <div key={pt.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ top: `${pt.y}%`, left: `${pt.x}%` }}>
                <button onClick={() => !isAdmin && setActiveEval(pt)} className="group flex flex-col items-center gap-2">
                  <div className="button-group-border p-1.5 flex items-center gap-1.5 shadow-2xl">
                    <SmileyFace type="sad" className={`w-8 h-8 rounded-full ${status === 'sad' ? 'bg-red-500 text-white' : 'text-white/20'}`} />
                    <SmileyFace type="neutral" className={`w-8 h-8 rounded-full ${status === 'neutral' ? 'bg-yellow-500 text-white' : 'text-white/20'}`} />
                    <SmileyFace type="happy" className={`w-8 h-8 rounded-full ${status === 'happy' ? 'bg-green-500 text-white' : 'text-white/20'}`} />
                  </div>
                  <div className="label-gradient text-white text-[10px] font-black px-4 py-2 uppercase tracking-widest">{pt.name}</div>
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal Evaluation */}
      {activeEval && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 modal-blur p-6 text-center">
          <div className="bg-white rounded-[5rem] p-12 md:p-20 w-full max-w-5xl shadow-2xl overflow-y-auto">
            <h3 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 uppercase tracking-tighter">{activeEval.name}</h3>
            <p className="text-slate-400 font-medium text-2xl mb-16">Select current maintenance and cleanliness state:</p>
            <div className="grid grid-cols-3 gap-8 mb-20">
              {['happy', 'neutral', 'sad'].map(type => (
                <button key={type} onClick={() => submitEvaluation(activeEval.id, type)} className="flex flex-col items-center gap-10 p-12 rounded-[4rem] bg-slate-50 hover:bg-slate-100 transition-all">
                  <SmileyFace type={type} className={`w-40 h-40 ${type==='happy'?'text-green-500':type==='neutral'?'text-yellow-500':'text-red-500'}`} />
                  <span className="font-black text-2xl uppercase tracking-[0.2em]">{type === 'happy' ? 'Excellent' : type === 'neutral' ? 'Acceptable' : 'Unacceptable'}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setActiveEval(null)} className="w-full py-10 bg-slate-100 text-slate-500 rounded-[3rem] font-black uppercase text-xl">Close Without Saving</button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 modal-blur p-6 text-center">
          <div className="bg-white rounded-[4rem] p-16 w-full max-w-xl">
            <h3 className="text-4xl font-black mb-12">Painel Gestão</h3>
            <input type="text" placeholder="Utilizador" className="w-full bg-slate-50 p-6 rounded-3xl mb-4 font-bold" onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" placeholder="Pass" className="w-full bg-slate-50 p-6 rounded-3xl mb-8 font-bold" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            <button onClick={() => { if(loginForm.user==='GESTÃO'&&loginForm.pass==='789'){setIsAdmin(true); setShowLoginModal(false); } }} className="w-full bg-indigo-600 text-white font-black py-8 rounded-3xl text-xl">Entrar</button>
            <button onClick={() => setShowLoginModal(false)} className="mt-4 text-slate-400">Cancelar</button>
          </div>
        </div>
      )}

      {/* New Point Modal */}
      {newPointModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 modal-blur p-6">
          <div className="bg-white rounded-[4rem] p-16 w-full max-w-2xl text-center">
            <h3 className="text-4xl font-black mb-10">Novo Posto</h3>
            <input autoFocus className="w-full bg-slate-50 p-8 rounded-3xl text-3xl font-black mb-12 text-center" placeholder="Ex: SOLDADURA 01" onChange={e => setNewPointModal({...newPointModal, name: e.target.value})} />
            <button onClick={saveNewPoint} className="w-full bg-amber-500 text-white font-black py-8 rounded-3xl text-xl">Criar Posto</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);