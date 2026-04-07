import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { TIPOS, GENEROS } from '../utils/constants';

export default function CatalogView({ catalogState, setCatalogState, mangas, onNavigate, dataSaver }) {
  const { filterType, selectedGenres, visibleCount, scrollPos } = catalogState;
  const [showGenreModal, setShowGenreModal] = useState(false);

  useEffect(() => { window.scrollTo(0, scrollPos); }, [scrollPos]);

  const toggleGenre = (genre) => { setCatalogState(prev => ({ ...prev, selectedGenres: prev.selectedGenres.includes(genre) ? prev.selectedGenres.filter(g => g !== genre) : [...prev.selectedGenres, genre], visibleCount: 24 })); };
  const clearGenres = () => setCatalogState(prev => ({ ...prev, selectedGenres: [], visibleCount: 24 }));
  const applyGenres = () => setShowGenreModal(false);
  const loadMore = () => setCatalogState(prev => ({ ...prev, visibleCount: prev.visibleCount + 24 }));

  const filteredMangas = mangas.filter(m => {
    if (filterType !== "Todos" && m.type !== filterType) return false;
    if (selectedGenres.length > 0 && (!m.genres || !selectedGenres.every(g => m.genres.includes(g)))) return false;
    return true;
  });

  const visibleMangas = filteredMangas.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 gap-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {TIPOS.map(tipo => <button key={tipo} onClick={() => setCatalogState(prev => ({ ...prev, filterType: tipo, visibleCount: 24 }))} className={`whitespace-nowrap font-bold px-4 py-2 rounded-full text-sm transition-colors duration-300 ${filterType === tipo ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white shadow-md' : 'bg-[#0d0d12] text-gray-300/80 hover:text-white border border-white/10'}`}>{tipo}</button>)}
          </div>
          <button onClick={() => setShowGenreModal(true)} className="flex items-center gap-2 bg-[#0d0d12] border border-white/10 px-5 py-2.5 rounded-md text-sm font-bold text-gray-200 hover:bg-white/5 hover:border-cyan-500 transition-colors duration-300 w-full sm:w-auto justify-center shadow-sm">
              <Filter className="w-5 h-5 text-cyan-400"/> Filtrar por Gêneros {selectedGenres.length > 0 && <span className="bg-fuchsia-600 text-white px-1.5 rounded ml-1">{selectedGenres.length}</span>}
          </button>
      </div>

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-black text-white">Resultados</h2><p className="text-gray-400/60 font-medium text-sm">{filteredMangas.length} obras</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visibleMangas.map(manga => (
          <div key={manga.id} className="cursor-pointer group flex flex-col gap-1.5" onClick={() => onNavigate('details', manga)}>
             <div className={`aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d12] border border-white/10 shadow-sm mb-1 ${dataSaver ? 'blur-[1px]' : ''}`}><img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300" /></div>
             <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400">{manga.title}</h3>
          </div>
        ))}
      </div>

      {filteredMangas.length > visibleCount && (
         <div className="flex justify-center mt-10"><button onClick={loadMore} className="bg-[#0d0d12] border border-white/10 text-cyan-400 hover:text-white hover:border-cyan-400 font-black px-8 py-3 rounded-md transition-colors duration-300 shadow-md text-sm">Ver Mais Obras</button></div>
      )}

      {showGenreModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300" onClick={() => setShowGenreModal(false)}>
            <div className="bg-[#050508] border-t sm:border border-white/10 rounded-t-xl sm:rounded-xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col slide-in-from-bottom-full sm:slide-in-from-bottom-0 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4"><h2 className="text-lg font-black text-white flex items-center gap-2"><Filter className="w-5 h-5 text-cyan-400"/> Gêneros Literários</h2><button onClick={() => setShowGenreModal(false)} className="text-gray-400/60 hover:text-white p-1 rounded-md transition-colors duration-300"><X className="w-6 h-6"/></button></div>
                <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap gap-2 content-start no-scrollbar">
                    {GENEROS.map(genre => <button key={genre} onClick={() => toggleGenre(genre)} className={`text-sm font-bold px-3 py-2 rounded border transition-colors duration-300 ${selectedGenres.includes(genre) ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-md' : 'bg-[#0d0d12] border-white/10 text-gray-300/80 hover:text-white hover:border-fuchsia-500/50'}`}>{genre}</button>)}
                </div>
                <div className="mt-6 flex gap-3 pt-4 border-t border-white/10">
                     <button onClick={clearGenres} className="flex-1 bg-[#0d0d12] text-gray-300/80 font-bold py-3 rounded-md hover:bg-white/5 hover:text-white transition-colors duration-300 text-sm border border-white/10">Limpar</button>
                     <button onClick={applyGenres} className="flex-1 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-md hover:scale-105 transition-transform duration-300 text-sm shadow-lg">Aplicar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
