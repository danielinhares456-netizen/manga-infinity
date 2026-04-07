import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Star, Clock, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

export default function HomeView({ mangas, onNavigate, dataSaver }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [recentFilter, setRecentFilter] = useState('Todos');
  const itemsPerPage = 12;

  const heroMangas = [...mangas].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroMangas.length === 0) return;
    const timer = setInterval(() => { setHeroIndex(prev => (prev + 1) % heroMangas.length); }, 5000);
    return () => clearInterval(timer);
  }, [heroMangas]);

  if (mangas.length === 0) return <div className="text-center py-32 text-gray-400/60"><BookOpen className="w-16 h-16 mx-auto mb-4 text-[#0d0d12]"/>Nenhuma obra cadastrada. Acesse o Painel Admin para enviar obras.</div>;

  const destaque = heroMangas.length > 0 ? heroMangas[heroIndex] : mangas[0]; 
  
  const populares = useMemo(() => {
      return [...mangas].sort((a, b) => { const scoreA = (a.views || 0) * (a.rating || 1); const scoreB = (b.views || 0) * (b.rating || 1); return scoreB - scoreA; }).slice(0, 6);
  }, [mangas]);

  const filteredRecents = useMemo(() => {
    return mangas.filter(m => {
      if (recentFilter === 'Todos') return true;
      if (recentFilter === 'Shoujo') return m.demographic === 'Shoujo' || (m.genres && m.genres.includes('Shoujo'));
      return m.type === recentFilter;
    });
  }, [mangas, recentFilter]);

  const totalPages = Math.ceil(filteredRecents.length / itemsPerPage);
  const currentMangas = filteredRecents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="relative w-full min-h-[45vh] py-10 cursor-pointer group overflow-hidden bg-[#030407]" onClick={() => onNavigate('details', destaque)}>
        {heroMangas.map((manga, idx) => (
           <div key={`bg-${manga.id}`} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
              <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
              <img src={manga.coverUrl} className={`w-full h-full object-cover blur-sm opacity-60 scale-105 ${dataSaver ? 'hidden' : ''}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#030407] via-transparent to-transparent opacity-80" />
           </div>
        ))}
        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start w-full h-full p-4 md:p-12 mx-auto max-w-7xl gap-4 md:gap-6 mt-4 md:mt-0">
          <div className="w-32 md:w-44 aspect-[2/3] rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border-[2px] border-white/10 overflow-hidden shrink-0 group-hover:-translate-y-3 transition-transform duration-500 relative z-30">
             <img src={destaque.coverUrl} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div className="flex flex-col items-center md:items-start flex-1 w-full text-center md:text-left min-w-0 max-w-2xl">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2 md:mb-3">
               <span className="bg-white text-black text-[9px] md:text-xs font-black px-2 py-0.5 rounded shadow uppercase tracking-wider">{destaque.type || 'MANGÁ'}</span>
               {destaque.ratingCount > 0 && (
                  <span className="bg-black/50 backdrop-blur-md border border-yellow-500/50 text-yellow-400 text-[9px] md:text-xs font-black px-2 py-0.5 rounded shadow flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {Number(destaque.rating).toFixed(1)}</span>
              )}
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-md line-clamp-2 leading-tight mb-2 md:mb-4">{destaque.title}</h1>
            <p className="hidden md:block text-sm text-gray-300/80 line-clamp-2 mb-6 max-w-xl leading-relaxed">{destaque.synopsis || "Explorar o multiverso nunca foi tão fácil."}</p>
            <button onClick={(e) => { e.stopPropagation(); onNavigate('details', destaque); }} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black px-8 py-3 md:py-4 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(217,70,239,0.3)] text-sm md:text-base">
                <Play className="w-5 h-5 fill-current"/> LER AGORA
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 right-0 left-0 flex justify-center gap-2 z-30" onClick={e=>e.stopPropagation()}>
           {heroMangas.map((m, i) => (
             <button key={m.id} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full transition-all duration-500 shadow-md ${heroIndex === i ? 'w-8 bg-cyan-400' : 'w-2 bg-white/30 hover:bg-white/60'}`}></button>
           ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 mb-4 text-white"><Star className="w-5 h-5 text-yellow-500" /> Mais Populares</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {populares.map((manga) => (
            <div key={`pop-${manga.id}`} className="group cursor-pointer flex flex-col gap-1.5" onClick={() => onNavigate('details', manga)}>
              <div className={`relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-[#0d0d12] border border-white/10 shadow-sm ${dataSaver ? 'blur-[1px]' : ''}`}>
                <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {manga.ratingCount > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow"><Star className="w-2.5 h-2.5 fill-current" /> {Number(manga.rating).toFixed(1)}</div>
                )}
              </div>
              <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300">{manga.title}</h3>
            </div>
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 text-white"><Clock className="w-5 h-5 text-fuchsia-500" /> Lançamentos</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
             {['Todos', 'Mangá', 'Manhwa', 'Manhua', 'Shoujo'].map(tab => (
               <button key={tab} onClick={() => {setRecentFilter(tab); setCurrentPage(1);}} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 whitespace-nowrap ${recentFilter === tab ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white shadow' : 'bg-[#0d0d12] text-gray-300/80 border border-white/10 hover:text-white'}`}>{tab}</button>
             ))}
          </div>
        </div>

        {filteredRecents.length === 0 ? (
           <p className="text-gray-400/60 text-center py-8 font-bold border border-white/10 border-dashed rounded-lg text-sm">Nenhum lançamento encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {currentMangas.map((manga) => (
              <div key={manga.id} className="group cursor-pointer flex flex-col bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-colors duration-300 shadow-sm" onClick={() => onNavigate('details', manga)}>
                <div className={`relative aspect-[2/3] w-full overflow-hidden ${dataSaver ? 'blur-[1px]' : ''}`}>
                  <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{manga.type || 'MANGÁ'}</div>
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300 mb-2">{manga.title}</h3>
                  <div className="mt-auto flex flex-col gap-1.5">
                     {manga.chapters && manga.chapters.slice(0, 2).map((cap) => {
                        const dateVal = cap.createdAt || cap.timestamp || cap.date || Date.now(); 
                        return (
                          <div key={cap.id} onClick={(e) => { e.stopPropagation(); onNavigate('reader', manga, cap); }} className="flex justify-between items-center bg-[#050508]/50 px-2 py-1.5 rounded-md border border-white/10 hover:border-cyan-500/50 transition-colors duration-300">
                             <span className="text-[10px] font-bold text-gray-200 line-clamp-1 max-w-[60%]">Cap. {cap.number}</span>
                             {timeAgo(dateVal) === 'NOVO' ? ( <span className="text-[8px] font-black bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(34,211,238,0.5)]">NOVO</span> ) : ( <span className="text-[8px] font-medium text-gray-400/60">{timeAgo(dateVal)}</span> )}
                          </div>
                        );
                     })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md bg-[#0d0d12] text-white disabled:opacity-50 border border-white/10 hover:border-cyan-500 transition-colors duration-300"><ChevronLeft className="w-5 h-5"/></button>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-[200px] md:max-w-md">
              {Array.from({length: totalPages}).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${currentPage === i + 1 ? 'bg-cyan-600 text-white shadow-md' : 'bg-[#0d0d12] text-gray-300/80 border border-white/10 hover:border-cyan-500 hover:text-white'}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md bg-[#0d0d12] text-white disabled:opacity-50 border border-white/10 hover:border-cyan-500 transition-colors duration-300"><ChevronRight className="w-5 h-5"/></button>
          </div>
        )}
      </div>
    </div>
  );
}