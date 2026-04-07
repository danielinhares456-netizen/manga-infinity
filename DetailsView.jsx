import React, { useState } from 'react';
import { ChevronLeft, Star, Play, BookmarkPlus, Check } from 'lucide-react';
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { APP_ID } from '../utils/constants';
import CommentsSection from '../components/CommentsSection';

export function DetailsView({ manga, libraryData, historyData, user, userProfileData, onBack, onChapterClick, onRequireLogin, showToast, db }) {
  const [activeTab, setActiveTab] = useState('capitulos');
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  
  const currentStatus = libraryData[manga.id];
  
  const readHistory = historyData.filter(h => h.mangaId === manga.id);
  const lastRead = readHistory.length > 0 ? readHistory.reduce((prev, current) => (prev.timestamp > current.timestamp) ? prev : current) : null;
  
  const handleLibraryToggle = async (status) => {
      if (!user) return onRequireLogin();
      try {
          const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'library', manga.id.toString());
          if (status === "Remover") {
              await deleteDoc(ref);
              showToast("Removido da Biblioteca.", "info");
          } else {
              await setDoc(ref, { mangaId: manga.id, status: status, updatedAt: Date.now() });
              if(status === 'Favoritos') showToast("Adicionado aos Favoritos!", "success");
              else showToast(`Status atualizado para: ${status}`, "success");
          }
      } catch(error) { showToast('Erro ao atualizar biblioteca.', 'error'); }
  };

  const firstChapter = manga.chapters && manga.chapters.length > 0 ? manga.chapters[manga.chapters.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#030407] animate-in fade-in duration-300 pb-20">
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#030407]/80 backdrop-blur-xl z-50 flex items-center px-4 border-b border-white/5">
        <button onClick={onBack} className="p-2 text-white hover:text-cyan-400 transition-colors"><ChevronLeft className="w-6 h-6"/></button>
        <h1 className="text-white font-bold ml-2 truncate text-lg flex-1">{manga.title}</h1>
      </div>
      
      <div className="pt-16">
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
           <img src={manga.coverUrl} className="w-full h-full object-cover blur-md opacity-30 scale-110" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/60 to-transparent"></div>
           
           <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex items-end gap-4 md:gap-6 max-w-7xl mx-auto">
             <div className="w-32 md:w-48 aspect-[2/3] rounded-xl shadow-2xl border-2 border-white/10 overflow-hidden flex-shrink-0">
                <img src={manga.coverUrl} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 pb-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-white text-black text-[10px] font-black px-2 py-0.5 rounded shadow uppercase">{manga.type || 'Mangá'}</span>
                  {manga.ratingCount > 0 && <span className="bg-black/50 border border-yellow-500/50 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> {Number(manga.rating).toFixed(1)}</span>}
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white line-clamp-2 leading-tight">{manga.title}</h2>
                <p className="text-cyan-400 font-bold text-sm mt-1">{manga.author || 'Autor Desconhecido'}</p>
             </div>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
           <div className="flex flex-wrap gap-2 mb-6">
             {manga.genres && manga.genres.map(g => (
                <span key={g} className="bg-[#0d0d12] border border-white/10 text-gray-300 text-[10px] font-bold px-2 py-1 rounded">{g}</span>
             ))}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                 <p className={`text-gray-300/80 text-sm leading-relaxed ${showFullSynopsis ? '' : 'line-clamp-4'}`}>
                    {manga.synopsis || 'Nenhuma sinopse disponível.'}
                 </p>
                 {manga.synopsis && manga.synopsis.length > 200 && (
                    <button onClick={() => setShowFullSynopsis(!showFullSynopsis)} className="text-cyan-400 text-xs font-bold mt-2 hover:text-cyan-300">
                       {showFullSynopsis ? 'Ver menos' : 'Ler mais'}
                    </button>
                 )}
                 
                 <div className="flex gap-3 mt-6">
                    <button onClick={() => {
                        if (lastRead) {
                            const cap = manga.chapters.find(c => c.number === lastRead.chapterNumber);
                            if (cap) onChapterClick(manga, cap);
                            else if (firstChapter) onChapterClick(manga, firstChapter);
                        } else if (firstChapter) {
                            onChapterClick(manga, firstChapter);
                        } else {
                            showToast("Nenhum capítulo disponível", "warning");
                        }
                    }} className="flex-1 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-md text-sm">
                       <Play className="w-5 h-5 fill-current"/> {lastRead ? `Continuar (Cap. ${lastRead.chapterNumber})` : 'Ler Primeiro Capítulo'}
                    </button>
                    <button onClick={() => handleLibraryToggle(currentStatus ? 'Remover' : 'Lendo')} className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${currentStatus ? 'bg-white/10 text-white border-white/20' : 'bg-[#0d0d12] text-gray-400 border-white/10 hover:text-white'}`}>
                       <BookmarkPlus className={`w-6 h-6 ${currentStatus ? 'fill-current text-cyan-400' : ''}`}/>
                    </button>
                 </div>
              </div>
              
              <div className="md:col-span-1 space-y-4">
                 <div className="bg-[#0d0d12] p-4 rounded-xl border border-white/10 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400/60 uppercase tracking-widest mb-3">Status na Biblioteca</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {['Lendo', 'Favoritos', 'Planejo Ler', 'Finalizado'].map(s => (
                          <button key={s} onClick={() => handleLibraryToggle(s)} className={`text-xs font-bold py-2 rounded border transition-colors ${currentStatus === s ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-[#050508] border-white/10 text-gray-400/60 hover:text-white'}`}>{s}</button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="mt-10 border-b border-white/10 flex gap-4">
              <button onClick={() => setActiveTab('capitulos')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'capitulos' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-white'}`}>Capítulos {activeTab === 'capitulos' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full"/>}</button>
              <button onClick={() => setActiveTab('comentarios')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'comentarios' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-white'}`}>Comentários {activeTab === 'comentarios' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full"/>}</button>
           </div>
           
           <div className="py-6">
              {activeTab === 'capitulos' && (
                 <div className="space-y-2">
                    {(!manga.chapters || manga.chapters.length === 0) ? (
                       <p className="text-center text-gray-400/60 py-10 font-bold text-sm">Nenhum capítulo disponível.</p>
                    ) : (
                       manga.chapters.map(cap => {
                           const isRead = historyData.some(h => h.mangaId === manga.id && h.chapterNumber === cap.number);
                           return (
                               <div key={cap.id} onClick={() => onChapterClick(manga, cap)} className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-colors duration-300 ${isRead ? 'bg-[#050508]/50 border-white/5' : 'bg-[#0d0d12] border-white/10 hover:border-cyan-500/50'}`}>
                                   <div className="flex flex-col">
                                      <span className={`font-black text-sm md:text-base ${isRead ? 'text-gray-400/60' : 'text-white'}`}>Capítulo {cap.number}</span>
                                      {cap.title && <span className="text-xs text-gray-500 mt-1">{cap.title}</span>}
                                   </div>
                                   <div className="text-right">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase">{new Date(cap.createdAt || cap.timestamp || Date.now()).toLocaleDateString()}</span>
                                      {isRead && <span className="block text-[10px] text-emerald-500 font-black mt-1">LIDO <Check className="w-3 h-3 inline"/></span>}
                                   </div>
                               </div>
                           );
                       })
                    )}
                 </div>
              )}
              
              {activeTab === 'comentarios' && (
                 <CommentsSection mangaId={manga.id} user={user} userProfileData={userProfileData} onRequireLogin={onRequireLogin} showToast={showToast} />
              )}
           </div>
        </div>
      </div>
    </div>
  );
}