import React, { useState, useEffect } from 'react';
import { ChevronLeft, Star, Play, BookmarkPlus, Check, Target } from 'lucide-react';
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from './firebase';
import { APP_ID } from './constants';
import CommentsSection from './CommentsSection';
import { addXpLogic } from './helpers';

export default function DetailsView({ manga, libraryData, historyData, user, userProfileData, onBack, onChapterClick, onRequireLogin, showToast }) {
  const [activeTab, setActiveTab] = useState('capitulos');
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  
  if (!manga) return null; 
  
  // VERIFICA SE COMPLETOU A MISSÃO DE CAÇADA AO ABRIR ESTA PÁGINA
  useEffect(() => {
      const checkMission = async () => {
          if (userProfileData?.activeMission?.type === 'search_local' && userProfileData.activeMission.targetManga === manga.id) {
              const m = userProfileData.activeMission;
              const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
              let { newXp, newLvl } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
              let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
              
              await updateDoc(profileRef, { 
                  coins: newCoins, 
                  xp: newXp, 
                  level: newLvl, 
                  activeMission: null
              });
              showToast(`Caçada Concluída! +${m.rewardXp} XP / +${m.rewardCoins} M`, 'success');
          }
      };
      if (user && userProfileData?.activeMission) checkMission();
  }, [manga.id, userProfileData?.activeMission, user]);

  const currentStatus = libraryData[manga.id];
  const readHistory = historyData.filter(h => h && h.mangaId === manga.id);
  const lastRead = readHistory.length > 0 ? readHistory.reduce((prev, current) => (prev.timestamp > current.timestamp) ? prev : current) : null;
  
  const handleLibraryToggle = async (status) => {
      if (!user) return onRequireLogin();
      try {
          const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'library', manga.id.toString());
          if (status === "Remover") {
              await deleteDoc(ref);
              showToast("Removido da Coleção.", "info");
          } else {
              await setDoc(ref, { mangaId: manga.id, status: status, updatedAt: Date.now() });
              if(status === 'Favoritos') showToast("Adicionado aos Favoritos!", "success");
              else showToast(`Status: ${status}`, "success");
          }
      } catch(error) { showToast('Erro no Banco de Dados.', 'error'); }
  };

  const firstChapter = manga.chapters && manga.chapters.length > 0 ? manga.chapters[manga.chapters.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#020203] animate-in fade-in duration-300 pb-20 font-sans">
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#020203]/90 backdrop-blur-xl z-50 flex items-center px-4 border-b border-red-900/30">
        <button onClick={onBack} className="p-2 text-white hover:text-red-500 transition-colors"><ChevronLeft className="w-6 h-6"/></button>
        <h1 className="text-white font-black ml-2 truncate text-lg flex-1 tracking-tight uppercase">{manga.title}</h1>
      </div>
      
      <div className="pt-16">
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-[#050000]">
           <img src={manga.coverUrl} className="w-full h-full object-cover blur-md opacity-30 scale-110 mix-blend-luminosity" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-[#020203]/80 to-transparent"></div>
           
           <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex items-end gap-4 md:gap-6 max-w-7xl mx-auto">
             <div className="w-32 md:w-48 aspect-[2/3] rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] border-2 border-red-900/30 overflow-hidden flex-shrink-0 bg-black">
                <img src={manga.coverUrl} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 pb-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-red-900 text-white text-[9px] font-black px-2.5 py-1 rounded shadow-md uppercase tracking-widest">{manga.type || 'Mangá'}</span>
                  {manga.ratingCount > 0 && <span className="bg-black border border-yellow-500/30 text-yellow-500 text-[10px] font-black px-2.5 py-1 rounded flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> {Number(manga.rating).toFixed(1)}</span>}
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white line-clamp-2 leading-tight tracking-tight uppercase">{manga.title}</h2>
                <p className="text-red-500 font-bold text-xs mt-1.5 uppercase tracking-widest">{manga.author || 'Autor Desconhecido'}</p>
             </div>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
           <div className="flex flex-wrap gap-2 mb-6">
             {manga.genres && manga.genres.map(g => (
                <span key={g} className="bg-black border border-red-900/30 text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">{g}</span>
             ))}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                 <p className={`text-gray-400 text-sm leading-relaxed ${showFullSynopsis ? '' : 'line-clamp-4'}`}>
                    {manga.synopsis || 'Nenhuma sinopse registrada no Vazio.'}
                 </p>
                 {manga.synopsis && manga.synopsis.length > 200 && (
                    <button onClick={() => setShowFullSynopsis(!showFullSynopsis)} className="text-red-500 text-xs font-black mt-2 hover:text-white uppercase tracking-widest transition-colors">
                       {showFullSynopsis ? 'Ver menos' : 'Ler mais'}
                    </button>
                 )}
                 
                 <div className="flex gap-3 mt-8">
                    <button onClick={() => {
                        if (lastRead) {
                            const cap = manga.chapters.find(c => c && c.number === lastRead.chapterNumber);
                            if (cap) onChapterClick(manga, cap);
                            else if (firstChapter) onChapterClick(manga, firstChapter);
                        } else if (firstChapter) {
                            onChapterClick(manga, firstChapter);
                        } else {
                            showToast("Nenhum capítulo disponível", "warning");
                        }
                    }} className="flex-1 bg-gradient-to-r from-red-800 to-red-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(220,38,38,0.2)] text-[10px] uppercase tracking-widest">
                       <Play className="w-4 h-4 fill-current"/> {lastRead ? `Continuar (Cap. ${lastRead.chapterNumber})` : 'Ler Primeiro Capítulo'}
                    </button>
                    <button onClick={() => handleLibraryToggle(currentStatus ? 'Remover' : 'Lendo')} className={`p-3.5 rounded-xl border flex items-center justify-center transition-all duration-300 ${currentStatus ? 'bg-red-950/40 text-red-500 border-red-500/30 shadow-inner' : 'bg-black text-gray-500 border-white/5 hover:text-white hover:border-red-900/50'}`}>
                       <BookmarkPlus className={`w-5 h-5 ${currentStatus ? 'fill-current' : ''}`}/>
                    </button>
                 </div>
              </div>
              
              <div className="md:col-span-1 space-y-4">
                 <div className="bg-[#050000] p-5 rounded-2xl border border-red-900/20 shadow-inner">
                    <h4 className="text-[10px] font-black text-red-900/60 uppercase tracking-[0.2em] mb-4">Status na Coleção</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {['Lendo', 'Favoritos', 'Planejo Ler', 'Finalizado'].map(s => (
                          <button key={s} onClick={() => handleLibraryToggle(s)} className={`text-[9px] font-black uppercase tracking-widest py-2.5 rounded-lg border transition-all duration-300 ${currentStatus === s ? 'bg-red-600 border-red-500 text-white shadow-md' : 'bg-black border-red-900/30 text-gray-500 hover:text-white hover:border-red-500/50'}`}>{s}</button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="mt-10 border-b border-red-900/20 flex gap-6">
              <button onClick={() => setActiveTab('capitulos')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'capitulos' ? 'text-red-500' : 'text-gray-600 hover:text-white'}`}>Capítulos {activeTab === 'capitulos' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full shadow-[0_0_10px_#ef4444]"/>}</button>
              <button onClick={() => setActiveTab('comentarios')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'comentarios' ? 'text-red-500' : 'text-gray-600 hover:text-white'}`}>Comentários {activeTab === 'comentarios' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full shadow-[0_0_10px_#ef4444]"/>}</button>
           </div>
           
           <div className="py-6">
              {activeTab === 'capitulos' && (
                 <div className="space-y-2">
                    {(!manga.chapters || manga.chapters.length === 0) ? (
                       <p className="text-center text-gray-500 py-10 font-black text-[10px] uppercase tracking-widest">Nenhum capítulo disponível.</p>
                    ) : (
                       manga.chapters.map(cap => {
                           if (!cap) return null; 
                           
                           const isRead = historyData.some(h => h.mangaId === manga.id && h.chapterNumber === cap.number);
                           return (
                               <div key={cap.id || Math.random()} onClick={() => onChapterClick(manga, cap)} className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isRead ? 'bg-black/40 border-white/5 opacity-60' : 'bg-[#0a0000] border-red-900/30 hover:border-red-500/50 hover:shadow-md'}`}>
                                   <div className="flex flex-col">
                                      <span className={`font-black text-xs md:text-sm uppercase tracking-wide ${isRead ? 'text-gray-500' : 'text-white'}`}>Capítulo {cap.number}</span>
                                      {cap.title && <span className="text-[10px] text-gray-400 mt-1">{cap.title}</span>}
                                   </div>
                                   <div className="text-right">
                                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{new Date(cap.createdAt || cap.timestamp || Date.now()).toLocaleDateString()}</span>
                                      {isRead && <span className="block text-[9px] text-red-500 font-black mt-1 tracking-widest">LIDO <Check className="w-3 h-3 inline"/></span>}
                                   </div>
                               </div>
                           );
                       })
                    )}
                 </div>
              )}
              
              {activeTab === 'comentarios' && (
                 <CommentsSection mangaId={manga.id} chapterId={null} user={user} userProfileData={userProfileData} onRequireLogin={onRequireLogin} showToast={showToast} />
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
