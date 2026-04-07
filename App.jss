import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Dices, Hexagon, Infinity as InfinityIcon, 
  Home as HomeIcon, LayoutGrid, Library, UserCircle, User, X, Trophy 
} from 'lucide-react';

import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, 
  query, getDocs, updateDoc, increment 
} from "firebase/firestore";

// TUDO SOLTO NA RAIZ (APENAS ./)
// *Atenção: Garanta que os nomes desses 3 arquivos soltos sejam exatamente esses:*
import { app, auth, db } from './firebase'; 
import { APP_ID, FALLBACK_SHOP_ITEMS } from './constants';
import { getThemeClasses, removeXpLogic, addXpLogic, timeAgo } from './helpers';

// Componentes da UI
import { ErrorBoundary, GlobalToast, Footer, SplashScreen } from './UIComponents';

// IMPORTAÇÃO DAS TELAS (Tudo no mesmo lugar)
import { LoginView } from './LoginView';
import { HomeView } from './HomeView';
import { SearchView } from './SearchView';
import { CatalogView } from './CatalogView';
import { LibraryView } from './LibraryView';
import { NexoView } from './NexoView';
import { ProfileView } from './ProfileView';

import DetailsView from './DetailsView';
import ReaderView  from './ReaderView';

function MangaInfinityApp() {
  const [splashTimerDone, setSplashTimerDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false); 
  const [currentView, setCurrentView] = useState('login'); 
  
  const [globalToast, setGlobalToast] = useState(null); 
  const [levelUpAlert, setLevelUpAlert] = useState(null); 
  const [dropAlert, setDropAlert] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false); 
  const [showMobileSearch, setShowMobileSearch] = useState(false); 
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  
  const [selectedManga, setSelectedManga] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [globalSearch, setGlobalSearch] = useState(''); 
  
  const [mangas, setMangas] = useState([]);
  const [loadingMangas, setLoadingMangas] = useState(true);
  const [shopItems, setShopItems] = useState(FALLBACK_SHOP_ITEMS);

  const [catalogState, setCatalogState] = useState({ filterType: "Todos", selectedGenres: [], visibleCount: 24, scrollPos: 0 });

  const [user, setUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeEffect: '', activeFont: '', activeMission: null, completedMissions: [] });
  const [userSettings, setUserSettings] = useState({ readMode: 'Cascata', dataSaver: false, theme: 'Escuro' });
  const [libraryData, setLibraryData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false); 

  useEffect(() => {
    const timer = setTimeout(() => setSplashTimerDone(true), 3500); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
        if (e.state && e.state.view) {
            setCurrentView(e.state.view);
            if (e.state.mangaId) { const m = mangas.find(mg => mg.id === e.state.mangaId); if (m) setSelectedManga(m); }
            if (e.state.chapterId && e.state.mangaId) {
                const m = mangas.find(mg => mg.id === e.state.mangaId);
                if (m && m.chapters) { const c = m.chapters.find(ch => ch.id === e.state.chapterId); if (c) setSelectedChapter(c); }
            }
        } else { setCurrentView('home'); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mangas]);

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        const obrasRef = collection(db, "obras");
        const snap = await getDocs(obrasRef);
        const list = [];
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          const capSnap = await getDocs(collection(db, `obras/${docSnap.id}/capitulos`));
          const chapters = [];
          capSnap.forEach(c => { const cData = c.data(); chapters.push({ id: c.id, ...cData, rawTime: cData.createdAt || cData.timestamp || Date.now() }); });
          chapters.sort((a,b) => b.number - a.number);
          list.push({ id: docSnap.id, ...data, chapters });
        }
        list.sort((a, b) => b.createdAt - a.createdAt);
        setMangas(list);
      } catch (error) { console.error(error); } finally { setLoadingMangas(false); }
    };
    fetchMangas();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "loja_itens"));
    const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
            const items = []; snap.forEach(d => items.push({ id: d.id, ...d.data() })); setShopItems(items);
        } else { setShopItems(FALLBACK_SHOP_ITEMS); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); setAuthReady(true);
      if (currentUser) {
        if (currentView === 'login') { window.history.pushState({ view: 'home' }, '', ''); setCurrentView('home'); }
        try {
          const profileRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'profile', 'main');
          const unsubProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfileData({ 
                bio: data.bio, avatarUrl: data.avatarUrl, coverUrl: data.coverUrl, 
                xp: data.xp || 0, level: data.level || 1, coins: data.coins || 0, crystals: data.crystals || 0,
                inventory: data.inventory || [], activeFrame: data.activeFrame || '', activeCover: data.activeCover || '', 
                activeEffect: data.activeEffect || '', activeFont: data.activeFont || '',
                activeMission: data.activeMission || null, completedMissions: data.completedMissions || []
              });
              if(data.settings) setUserSettings({ ...userSettings, ...data.settings }); 
            } else {
              setDoc(profileRef, { bio: "Leitor Nível 1.", settings: userSettings, xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeMission: null, completedMissions: [] }, { merge: true });
            }
          });

          const libraryRef = collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'library');
          const unsubLib = onSnapshot(query(libraryRef), (snapshot) => { const libs = {}; snapshot.docs.forEach(d => libs[d.id] = d.data().status); setLibraryData(libs); });

          const historyRef = collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'history');
          const unsubHist = onSnapshot(query(historyRef), (snapshot) => {
            const hist = []; snapshot.docs.forEach(d => hist.push({ id: d.id, ...d.data() }));
            setHistoryData(hist.sort((a,b) => b.timestamp - a.timestamp));
          });

          const notifRef = collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'notifications');
          const unsubNotif = onSnapshot(query(notifRef), (snapshot) => {
             const notifs = []; snapshot.docs.forEach(d => notifs.push({ id: d.id, ...d.data() }));
             setNotifications(notifs.sort((a,b) => b.createdAt - a.createdAt)); setDataLoaded(true);
          });

          return () => { unsubProfile(); unsubLib(); unsubHist(); unsubNotif(); };
        } catch (error) { console.error(error); }
      } else {
        setUserProfileData({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeEffect: '', activeFont: '', activeMission: null, completedMissions: [] }); setLibraryData({}); setHistoryData([]); setNotifications([]); setDataLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, [currentView]);

  useEffect(() => {
    if (!user || !userProfileData.activeMission) return;
    const interval = setInterval(async () => {
      const mission = userProfileData.activeMission;
      if (mission && Date.now() > mission.deadline) {
         setGlobalToast({ text: `Missão Falhou pelo Tempo! Penalidade: -${mission.penaltyXp}XP`, type: "error" });
         const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
         let newCoins = Math.max(0, (userProfileData.coins || 0) - mission.penaltyCoins);
         let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, mission.penaltyXp);
         await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, userProfileData.activeMission]);

  useEffect(() => {
      const completeSearchLocalMission = async () => {
          if (!user || !userProfileData?.activeMission) return;
          const m = userProfileData.activeMission;
          const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
          
          let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
          let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
          let currentCompleted = userProfileData.completedMissions || [];
          if (!currentCompleted.includes("enigma_local_" + m.targetManga)) currentCompleted = [...currentCompleted, "enigma_local_" + m.targetManga];

          await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
          showToast(`Alvo Encontrado! Missão Concluída: +${m.rewardXp} XP | +${m.rewardCoins} M`, "success");
          if(didLevelUp) handleLevelUpAnim(newLvl);
      };

      if (currentView === 'details' && selectedManga && userProfileData?.activeMission?.type === 'search_local') {
          if (userProfileData.activeMission.targetManga === selectedManga.id) { completeSearchLocalMission(); }
      }
  }, [currentView, selectedManga, userProfileData?.activeMission, user]);

  const showSplash = !splashTimerDone || !authReady || loadingMangas;

  useEffect(() => {
    if (!showSplash && !user && !isGuest && currentView !== 'login') { setCurrentView('login'); }
  }, [showSplash, user, isGuest, currentView]);

  const showToast = (text, type = 'info') => {
    setGlobalToast({ text, type }); setTimeout(() => setGlobalToast(null), 4000);
  };

  const handleLevelUpAnim = (lvl) => {
      setLevelUpAlert(lvl); setTimeout(() => setLevelUpAlert(null), 5000);
  }

  const navigateTo = (view, manga = null, chapter = null) => {
    if (currentView === 'catalog') { setCatalogState(prev => ({ ...prev, scrollPos: window.scrollY })); }
    if (manga) setSelectedManga(manga);
    if (chapter) setSelectedChapter(chapter);

    window.history.pushState({ view, mangaId: manga?.id, chapterId: chapter?.id }, '', '');
    setCurrentView(view);
    if (view !== 'catalog') { window.scrollTo(0, 0); }
  };

  const handleBack = () => {
    if (window.history.state !== null) { window.history.back(); } else { navigateTo('home'); }
  };

  const handleSearchSubmit = (e) => { if (e.key === 'Enter' && globalSearch.trim() !== '') navigateTo('search'); };
  
  const handleLogout = async () => { await signOut(auth); setIsGuest(false); setCurrentView('login'); };

  const handleRandomManga = () => {
    if (mangas.length === 0) { showToast("Catálogo vazio.", "error"); return; }
    setIsRandomizing(true);
    setTimeout(() => {
      const random = mangas[Math.floor(Math.random() * mangas.length)];
      navigateTo('details', random);
      setIsRandomizing(false);
    }, 600); 
  };

  const triggerRandomDrop = async () => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
    try { await updateDoc(profileRef, { crystals: increment(1) }); setDropAlert(true); setTimeout(() => setDropAlert(false), 2000); } catch(e) {}
  };

  const markAsRead = async (manga, chapter, isValidReading) => {
    if (!user) return;
    try {
      const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'history', `${manga.id}_${chapter.id}`);
      const docSnap = await getDoc(ref);
      let isNewRead = false;
      if (!docSnap.exists()) {
        isNewRead = true;
        await setDoc(ref, { mangaId: manga.id, mangaTitle: manga.title, chapterNumber: chapter.number, timestamp: Date.now(), id: `${manga.id}_${chapter.id}` });
      } else { await updateDoc(ref, { timestamp: Date.now() }); }

      if (isNewRead && userProfileData.activeMission?.type === 'read' && userProfileData.activeMission.targetManga === manga.id) {
         if (!isValidReading) { showToast("⚠️ Tempo insuficiente (Mín. 45s).", "warning"); return; }
         const m = userProfileData.activeMission;
         const newCount = m.currentCount + 1;
         const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
         
         if (newCount >= m.targetCount) {
             let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
             let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
             let currentCompleted = userProfileData.completedMissions || [];
             if (!currentCompleted.includes(m.targetManga)) currentCompleted = [...currentCompleted, m.targetManga];
             await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
             showToast(`Missão Concluída! +${m.rewardXp} XP | +${m.rewardCoins} Moedas`, "success");
             if(didLevelUp) handleLevelUpAnim(newLvl);
         } else {
             await updateDoc(profileRef, { 'activeMission.currentCount': newCount });
             showToast(`Progresso: ${newCount}/${m.targetCount}`, "info");
         }
      }
    } catch(e) { console.error(e) }
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    if(user) { try { await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { settings: updated }, { merge: true }); } catch(e) {} }
  };

  const buyItem = async (item) => {
    const price = item.preco || item.price;
    if ((userProfileData.coins || 0) < price) { showToast("Moedas Insuficientes!", "error"); return; }
    const newCoins = userProfileData.coins - price;
    const newInv = [...(userProfileData.inventory || []), item.id];
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { coins: newCoins, inventory: newInv });
    showToast(`Adquirido com sucesso!`, "success");
  };

  const toggleEquipItem = async (item) => {
    const updates = {}; const cat = item.categoria || item.type;
    const isEquipped = userProfileData.activeFrame === item.cssClass || userProfileData.activeCover === item.preview || userProfileData.activeCover === item.url || userProfileData.avatarUrl === item.preview || userProfileData.avatarUrl === item.url || userProfileData.activeEffect === item.cssClass || userProfileData.activeFont === item.cssClass;
    if (cat === 'moldura' || cat === 'frame') updates.activeFrame = isEquipped ? '' : item.cssClass;
    if (cat === 'capa_fundo' || cat === 'cover') updates.activeCover = isEquipped ? '' : (item.preview || item.url);
    if (cat === 'avatar') updates.avatarUrl = isEquipped ? '' : (item.preview || item.url);
    if (cat === 'efeito' || cat === 'effect') updates.activeEffect = isEquipped ? '' : item.cssClass;
    if (cat === 'nickname' || cat === 'fonte' || cat === 'font') updates.activeFont = isEquipped ? '' : item.cssClass;
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), updates);
  };

  const synthesizeCrystal = async () => {
    if (userProfileData.crystals < 5) return null;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
    if (Math.random() < 0.40) { await updateDoc(profileRef, { crystals: increment(-5) }); return { success: false }; }
    const wonCoins = Math.floor(Math.random() * 10) + 5; const wonXp = Math.floor(Math.random() * 5) + 5;    
    let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, wonXp);
    await updateDoc(profileRef, { crystals: increment(-5), coins: increment(wonCoins), xp: newXp, level: newLvl });
    if(didLevelUp) handleLevelUpAnim(newLvl);
    return { success: true, wonCoins, wonXp, leveledUp: didLevelUp, newLvl };
  };

  const handleLibraryToggle = async (mangaId, status) => {
      if (!user) { showToast("Faça login para favoritar obras.", "warning"); return; }
      try {
          const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'library', mangaId.toString());
          if (status === "Remover") await deleteDoc(ref); else await setDoc(ref, { mangaId: mangaId, status: status, updatedAt: Date.now() });
          if(status === 'Favoritos') showToast("Adicionado aos Favoritos!", "success"); else if(status === 'Remover') showToast("Removido da Biblioteca.", "info");
      } catch(error) { showToast('Erro ao atualizar biblioteca.', 'error'); }
  };

  if (showSplash) return <SplashScreen />;
  if (currentView === 'login' || (!user && !isGuest)) {
    return <LoginView onLoginSuccess={() => { window.history.pushState({ view: 'home' }, '', ''); setCurrentView('home'); setIsGuest(false); }} onGuestAccess={() => { window.history.pushState({ view: 'home' }, '', ''); setIsGuest(true); setCurrentView('home'); }} />;
  }

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen font-sans selection:bg-cyan-600 selection:text-white flex flex-col transition-colors duration-300 ${getThemeClasses(userSettings.theme)} ${userProfileData.activeFont || ''} ${userProfileData.activeEffect || ''}`}>
      
      <style dangerouslySetInnerHTML={{__html: shopItems.map(item => `.${item.cssClass || 'none'} { ${item.css || ''} } ${item.animacao || ''}`).join('\n')}} />
      <style>{`input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #22d3ee; cursor: pointer; box-shadow: 0 0 15px rgba(34, 211, 238, 0.9); border: 2px solid white; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {levelUpAlert && (
          <div className="fixed top-20 right-4 z-[99999] bg-[#0d0d12]/95 backdrop-blur-md border border-white/10 shadow-[0_5px_30px_rgba(217,70,239,0.2)] text-white px-4 py-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-right fade-out duration-300 pointer-events-none">
             <div className="bg-gradient-to-br from-cyan-600 to-fuchsia-600 p-2 rounded-md shadow-inner"><Trophy className="w-5 h-5 text-white" /></div>
             <div className="flex flex-col"><span className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">Level Up!</span><span className="text-sm font-bold">Nível {levelUpAlert} Alcançado</span></div>
          </div>
      )}

      {dropAlert && (
          <div className="fixed bottom-24 right-4 z-[99999] bg-[#0d0d12]/90 backdrop-blur-md border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] px-3 py-2 rounded-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-out duration-300 pointer-events-none">
              <Hexagon className="w-4 h-4 text-cyan-400 animate-pulse" /><span className="text-cyan-100 text-xs font-bold">+1 Cristal</span>
          </div>
      )}

      {isRandomizing && (
        <div className="fixed inset-0 z-[2000] bg-[#050508]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-100 pointer-events-none">
           <Dices className="w-24 h-24 text-fuchsia-500 animate-[spin_0.2s_linear_infinite] drop-shadow-[0_0_50px_rgba(217,70,239,0.6)]" />
        </div>
      )}

      <GlobalToast toast={globalToast} />

      {currentView !== 'reader' && (
        <nav className="sticky top-0 z-40 bg-[#030407]/80 backdrop-blur-xl border-b border-white/5 shadow-sm relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
                <div className="bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 p-2 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform duration-300"><InfinityIcon className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-fuchsia-300 hidden sm:block">INFINITY</span>
              </div>
              
              <div className="hidden md:block flex-1 max-w-lg mx-8 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400/60 group-focus-within:text-cyan-400 transition-colors" /></div>
                <input type="text" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} onKeyDown={handleSearchSubmit} className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-lg bg-[#0d0d12]/50 text-gray-100 outline-none focus:border-cyan-500 transition-all text-sm" placeholder="Pesquisar a obra e teclar Enter..." />
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-1 md:gap-3 border-r border-white/10 pr-4 md:pr-6">
                  <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 text-gray-300/80 hover:text-cyan-400 transition-colors duration-300" title="Pesquisar">
                    {showMobileSearch ? <X className="w-5 h-5"/> : <Search className="w-5 h-5" />}
                  </button>

                  <button onClick={handleRandomManga} className="p-2 text-gray-300/80 hover:text-fuchsia-400 transition-colors duration-300 group relative" title="Obra Aleatória">
                    <Dices className="w-5 h-5 md:w-5 md:h-5 group-hover:text-fuchsia-400 transition-colors duration-300" />
                  </button>
                  <div className="relative">
                    <button onClick={() => {if(!user) return showToast("Faça login para ver mensagens", "info"); setShowNotifMenu(!showNotifMenu)}} className="relative p-2 text-gray-300/80 hover:text-cyan-400 transition-colors duration-300">
                        <Bell className="w-5 h-5 md:w-5 md:h-5"/>
                        {unreadNotifCount > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#050508]"></span>}
                    </button>
                    {showNotifMenu && user && (
                        <div className="absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-72 bg-[#0d0d12] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-top-2">
                            <div className="p-3 border-b border-white/10 bg-[#050508] flex items-center justify-between">
                                <h3 className="font-black text-sm text-white flex items-center gap-2"><Bell className="w-4 h-4 text-cyan-400"/> Avisos e Comentários</h3>
                                {unreadNotifCount > 0 && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black">{unreadNotifCount}</span>}
                            </div>
                            <div className="max-h-64 overflow-y-auto no-scrollbar">
                                {notifications.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400/60 py-6">Nenhum aviso no momento.</p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} onClick={async () => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'notifications', n.id), {read: true}); if(n.mangaId) { const m = mangas.find(mg=>mg.id===n.mangaId); if(m) navigateTo('details', m); setShowNotifMenu(false); } }} className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-cyan-900/10' : ''}`}>
                                            <p className="text-xs text-gray-200 font-medium leading-relaxed">{n.text}</p>
                                            <p className="text-[9px] text-cyan-500 mt-1.5 font-bold uppercase">{timeAgo(n.createdAt)}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-300/80">
                  <button onClick={() => navigateTo('home')} className={`hover:text-cyan-400 transition-colors duration-300 ${currentView === 'home' ? 'text-cyan-400' : ''}`}>Início</button>
                  <button onClick={() => navigateTo('catalog')} className={`hover:text-cyan-400 transition-colors duration-300 ${currentView === 'catalog' ? 'text-cyan-400' : ''}`}>Catálogo</button>
                  <button onClick={() => user ? navigateTo('nexo') : navigateTo('login')} className={`hover:text-fuchsia-400 transition-colors duration-300 flex items-center gap-1 ${currentView === 'nexo' ? 'text-fuchsia-400' : ''}`}><Hexagon className="w-4 h-4"/> Nexo</button>
                  <button onClick={() => user ? navigateTo('profile') : navigateTo('login')} className={`hover:text-cyan-400 transition-colors duration-300 flex items-center gap-1 ${currentView === 'profile' ? 'text-cyan-400' : ''}`}><UserCircle className="w-4 h-4"/> Perfil</button>
                </div>
                {user ? (
                  <div className="cursor-pointer flex items-center gap-3 group" onClick={() => navigateTo('profile')}>
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-sm font-bold text-gray-200 group-hover:text-cyan-300 transition-colors duration-300">{user.displayName || "Leitor"}</span>
                      <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">Nível {userProfileData.level || 1}</span>
                    </div>
                    <div className={`w-9 h-9 rounded-full overflow-hidden bg-[#0d0d12] border border-white/10 group-hover:border-cyan-500 transition-colors duration-300 ${userProfileData.activeFrame || ''}`}>
                      {userProfileData.avatarUrl || user.photoURL ? <img src={userProfileData.avatarUrl || user.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-300/80" />}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => navigateTo('login')} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-bold px-4 py-1.5 rounded-lg hover:scale-105 transition-transform duration-300 shadow-sm text-sm">Entrar</button>
                )}
              </div>
            </div>
          </div>
          
          {showMobileSearch && (
            <div className="absolute top-full left-0 w-full bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 p-3 shadow-xl md:hidden animate-in slide-in-from-top-2 z-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300/80" />
                <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} onKeyDown={(e) => { handleSearchSubmit(e); if(e.key === 'Enter') setShowMobileSearch(false); }} className="w-full pl-9 pr-4 py-2 border border-white/10 rounded-lg bg-[#0d0d12] text-gray-100 outline-none focus:border-cyan-500 text-sm transition-colors duration-300" placeholder="Pesquisar a obra..." autoFocus />
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-1">
        {currentView === 'home' && <HomeView mangas={mangas} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'search' && <SearchView mangas={mangas} query={globalSearch} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'catalog' && <CatalogView mangas={mangas} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} catalogState={catalogState} setCatalogState={setCatalogState} />}
        {currentView === 'nexo' && user && <NexoView user={user} userProfileData={userProfileData} showToast={showToast} mangas={mangas} db={db} appId={APP_ID} onNavigate={navigateTo} onLevelUp={handleLevelUpAnim} synthesizeCrystal={synthesizeCrystal} shopItems={shopItems} buyItem={buyItem} equipItem={toggleEquipItem} />}
        {currentView === 'library' && <LibraryView mangas={mangas} user={user} libraryData={libraryData} onNavigate={navigateTo} onRequireLogin={() => navigateTo('login')} dataSaver={userSettings.dataSaver} />}
        {currentView === 'profile' && user && <ProfileView user={user} userProfileData={userProfileData} historyData={historyData} libraryData={libraryData} dataLoaded={dataLoaded} userSettings={userSettings} updateSettings={updateSettings} onLogout={handleLogout} onUpdateData={(n) => setUserProfileData({...userProfileData, ...n})} showToast={showToast} mangas={mangas} onNavigate={navigateTo} />}
        {currentView === 'details' && selectedManga && <DetailsView manga={selectedManga} libraryData={libraryData} historyData={historyData} user={user} userProfileData={userProfileData} onBack={handleBack} onChapterClick={(m, c) => navigateTo('reader', m, c)} onRequireLogin={() => navigateTo('login')} showToast={showToast} db={db} />}
        {currentView === 'reader' && selectedManga && selectedChapter && <ReaderView manga={selectedManga} chapter={selectedChapter} user={user} userProfileData={userProfileData} onBack={handleBack} onChapterClick={(m, c) => navigateTo('reader', m, c)} triggerRandomDrop={triggerRandomDrop} onMarkAsRead={markAsRead} readMode={userSettings.readMode} onRequireLogin={() => navigateTo('login')} showToast={showToast} libraryData={libraryData} onToggleLibrary={handleLibraryToggle} />}
      </main>

      {currentView !== 'reader' && currentView !== 'login' && <Footer />}

      {currentView !== 'reader' && (
        <div className="md:hidden fixed bottom-0 w-full bg-[#050508]/95 backdrop-blur-2xl border-t border-white/5 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-around items-center h-[60px] px-2 relative">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'home' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <HomeIcon className="w-5 h-5" /><span className="text-[9px] font-bold">Início</span>
            </button>
            <button onClick={() => navigateTo('catalog')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'catalog' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <LayoutGrid className="w-5 h-5" /><span className="text-[9px] font-bold">Catálogo</span>
            </button>
            <div className="relative -top-5 flex justify-center w-16">
                <button onClick={() => user ? navigateTo('nexo') : navigateTo('login')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-[3px] border-[#030407] shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-transform hover:scale-105 duration-300 ${currentView === 'nexo' ? 'bg-gradient-to-tr from-cyan-500 to-fuchsia-500 text-white' : 'bg-[#0d0d12] text-fuchsia-400'}`}>
                    <Hexagon className="w-6 h-6 relative z-10" fill={currentView === 'nexo' ? "currentColor" : "none"}/>
                    <span className="text-[8px] font-black relative z-10 mt-0.5">NEXO</span>
                </button>
            </div>
            <button onClick={() => user ? navigateTo('library') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'library' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <Library className="w-5 h-5" /><span className="text-[9px] font-bold">Biblioteca</span>
            </button>
            <button onClick={() => user ? navigateTo('profile') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'profile' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <UserCircle className="w-5 h-5" /><span className="text-[9px] font-bold">Perfil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MangaInfinityApp />
    </ErrorBoundary>
  );
}
