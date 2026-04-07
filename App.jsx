import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Dices, Hexagon, Infinity as InfinityIcon, 
  Home as HomeIcon, LayoutGrid, Library, UserCircle, User, X, Trophy, BookOpen, Eye 
} from 'lucide-react';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, 
  query, getDocs, updateDoc, increment 
} from "firebase/firestore";

import { app, auth, db } from './firebase';
import { APP_ID, FALLBACK_SHOP_ITEMS } from './constants';
import { getThemeClasses, removeXpLogic, addXpLogic, timeAgo } from './helpers';

// Componentes da UI
import { ErrorBoundary, GlobalToast, Footer, SplashScreen } from './UIComponents';

// IMPORTAÇÃO DAS TELAS
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
  const [userProfileData, setUserProfileData] = useState({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], equipped_items: {}, activeMission: null, completedMissions: [] });
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
        setMangas(list.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) { console.error(error); } finally { setLoadingMangas(false); }
    };
    fetchMangas();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); setAuthReady(true);
      if (currentUser) {
        const profileRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'profile', 'main');
        onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfileData({ ...data, equipped_items: data.equipped_items || {} });
            if(data.settings) setUserSettings({ ...userSettings, ...data.settings });
          }
        });

        onSnapshot(collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'library'), (snapshot) => {
          const libs = {}; snapshot.docs.forEach(d => libs[d.id] = d.data().status); setLibraryData(libs);
        });

        onSnapshot(collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'history'), (snapshot) => {
          const hist = []; snapshot.docs.forEach(d => hist.push({ id: d.id, ...d.data() }));
          setHistoryData(hist.sort((a,b) => b.timestamp - a.timestamp));
        });

        onSnapshot(collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'notifications'), (snapshot) => {
           const notifs = []; snapshot.docs.forEach(d => notifs.push({ id: d.id, ...d.data() }));
           setNotifications(notifs.sort((a,b) => b.createdAt - a.createdAt)); setDataLoaded(true);
        });
      }
    });
  }, []);

  const showToast = (text, type = 'info') => { setGlobalToast({ text, type }); setTimeout(() => setGlobalToast(null), 4000); };

  const navigateTo = (view, manga = null, chapter = null) => {
    if (manga) setSelectedManga(manga);
    if (chapter) setSelectedChapter(chapter);
    window.history.pushState({ view, mangaId: manga?.id, chapterId: chapter?.id }, '', '');
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => { await signOut(auth); setIsGuest(false); setCurrentView('login'); };

  const handleRandomManga = () => {
    if (mangas.length === 0) return;
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
      await setDoc(ref, { mangaId: manga.id, mangaTitle: manga.title, chapterNumber: chapter.number, timestamp: Date.now(), id: `${manga.id}_${chapter.id}` }, {merge: true});
    } catch(e) { console.error(e) }
  };

  const buyItem = async (item) => {
    const price = item.preco || item.price;
    if ((userProfileData.coins || 0) < price) { showToast("Moedas Insuficientes!", "error"); return; }
    const newInv = [...(userProfileData.inventory || []), item.id];
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { coins: increment(-price), inventory: newInv });
    showToast(`Adquirido com sucesso!`, "success");
  };

  const toggleEquipItem = async (item) => {
    const cat = item.categoria || item.type;
    const currentEquipped = userProfileData.equipped_items || {};
    const isEquipped = currentEquipped[cat]?.id === item.id;
    const newEquipped = { ...currentEquipped };
    if (isEquipped) delete newEquipped[cat]; else newEquipped[cat] = item;
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { equipped_items: newEquipped });
  };

  const showSplash = !splashTimerDone || !authReady || loadingMangas;

  if (showSplash) return <SplashScreen />;
  if (currentView === 'login' || (!user && !isGuest)) {
    return <LoginView onLoginSuccess={() => setCurrentView('home')} onGuestAccess={() => { setIsGuest(true); setCurrentView('home'); }} />;
  }

  const eq = userProfileData.equipped_items || {};

  return (
    <div className={`min-h-screen flex flex-col ${getThemeClasses(userSettings.theme)} ${userProfileData.activeFont || ''}`}>
      
      <nav className="sticky top-0 z-40 bg-[#030407]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="relative flex items-center justify-center w-10 h-10">
               <Hexagon className="absolute w-full h-full text-blue-600/40 animate-[spin_10s_linear_infinite]" />
               <BookOpen className="w-6 h-6 text-amber-500 relative z-10" />
               <Eye className="w-2.5 h-2.5 text-red-600 absolute z-20 animate-pulse" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter hidden sm:block uppercase">ABISSAL</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleRandomManga} className="p-2 text-gray-400 hover:text-fuchsia-400 transition-colors"><Dices className="w-5 h-5"/></button>
            
            {user ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('profile')}>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">{user.displayName}</p>
                  <p className="text-[9px] font-black text-amber-500 uppercase mt-1">Nível {userProfileData.level}</p>
                </div>
                <div className="relative w-10 h-10 flex items-center justify-center">
                  {eq.moldura && <img src={eq.moldura.preview} className="absolute inset-[-15%] w-[130%] h-[130%] z-20 pointer-events-none" />}
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 z-10">
                    <img src={userProfileData.avatarUrl || user.photoURL || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => navigateTo('login')} className="text-xs font-black bg-blue-600 px-4 py-2 rounded-lg text-white">ENTRAR</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-20">
        {currentView === 'home' && <HomeView mangas={mangas} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'search' && <SearchView mangas={mangas} query={globalSearch} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'catalog' && <CatalogView mangas={mangas} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} catalogState={catalogState} setCatalogState={setCatalogState} />}
        {currentView === 'nexo' && <NexoView user={user} userProfileData={userProfileData} showToast={showToast} mangas={mangas} onNavigate={navigateTo} synthesizeCrystal={() => {}} shopItems={shopItems} buyItem={buyItem} equipItem={toggleEquipItem} />}
        {currentView === 'profile' && <ProfileView user={user} userProfileData={userProfileData} historyData={historyData} libraryData={libraryData} dataLoaded={dataLoaded} userSettings={userSettings} updateSettings={(s) => setUserSettings({...userSettings, ...s})} onLogout={handleLogout} onUpdateData={(n) => setUserProfileData({...userProfileData, ...n})} showToast={showToast} mangas={mangas} onNavigate={navigateTo} />}
        {currentView === 'details' && selectedManga && <DetailsView manga={selectedManga} libraryData={libraryData} historyData={historyData} user={user} userProfileData={userProfileData} onBack={() => window.history.back()} onChapterClick={(m, c) => navigateTo('reader', m, c)} onRequireLogin={() => navigateTo('login')} showToast={showToast} />}
        {currentView === 'reader' && selectedManga && selectedChapter && <ReaderView manga={selectedManga} chapter={selectedChapter} user={user} userProfileData={userProfileData} onBack={() => window.history.back()} onChapterClick={(m, c) => navigateTo('reader', m, c)} triggerRandomDrop={triggerRandomDrop} onMarkAsRead={markAsRead} readMode={userSettings.readMode} onRequireLogin={() => navigateTo('login')} showToast={showToast} libraryData={libraryData} onToggleLibrary={() => {}} />}
      </main>

      <div className="md:hidden fixed bottom-0 w-full bg-[#050508]/95 backdrop-blur-2xl border-t border-white/5 z-40 h-[60px] flex justify-around items-center">
         <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-cyan-400' : 'text-gray-500'}`}><HomeIcon className="w-5 h-5" /><span className="text-[9px] font-bold">Início</span></button>
         <button onClick={() => navigateTo('catalog')} className={`flex flex-col items-center gap-1 ${currentView === 'catalog' ? 'text-cyan-400' : 'text-gray-500'}`}><LayoutGrid className="w-5 h-5" /><span className="text-[9px] font-bold">Catálogo</span></button>
         <button onClick={() => navigateTo('nexo')} className={`flex flex-col items-center justify-center w-12 h-12 rounded-full -mt-6 border-2 border-[#050508] ${currentView === 'nexo' ? 'bg-cyan-500 text-white' : 'bg-[#0d0d12] text-fuchsia-500'}`}><Hexagon className="w-6 h-6" /></button>
         <button onClick={() => navigateTo('library')} className={`flex flex-col items-center gap-1 ${currentView === 'library' ? 'text-cyan-400' : 'text-gray-500'}`}><Library className="w-5 h-5" /><span className="text-[9px] font-bold">Coleção</span></button>
         <button onClick={() => navigateTo('profile')} className={`flex flex-col items-center gap-1 ${currentView === 'profile' ? 'text-cyan-400' : 'text-gray-500'}`}><UserCircle className="w-5 h-5" /><span className="text-[9px] font-bold">Perfil</span></button>
      </div>

      {currentView !== 'reader' && <Footer />}
      <GlobalToast toast={globalToast} />
      {dropAlert && <div className="fixed bottom-24 right-4 bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-bold animate-bounce">+1 Cristal</div>}
    </div>
  );
}

export default function App() { return <ErrorBoundary><MangaInfinityApp /></ErrorBoundary>; }
