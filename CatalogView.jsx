import React, { useMemo } from 'react';
import { Search, Star } from 'lucide-react';

export function SearchView({ mangas, query, onNavigate, dataSaver }) {
  const results = useMemo(() => {
    if(!query) return [];
    const lowerQ = query.toLowerCase();
    return mangas.filter(m => m.title.toLowerCase().includes(lowerQ) || (m.author && m.author.toLowerCase().includes(lowerQ)) || m.genres?.some(g => typeof g === 'string' && g.toLowerCase().includes(lowerQ)));
  }, [query, mangas]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-300">
      <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Search className="w-8 h-8 text-cyan-400" /> Resultados para "{query}"</h2>
      <p className="text-gray-400/60 mb-8">{results.length} obras encontradas</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {results.map(manga => (
          <div key={manga.id} className="cursor-pointer group flex flex-col gap-2" onClick={() => onNavigate('details', manga)}>
            <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d12] border border-white/10 shadow-sm ${dataSaver ? 'blur-[2px]' : ''}`}>
               <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 className="font-bold text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300">{manga.title}</h3>
            {manga.ratingCount > 0 ? ( <p className="text-xs text-yellow-500 font-bold"><Star className="w-3 h-3 inline" /> {Number(manga.rating).toFixed(1)}</p> ) : ( <p className="text-xs text-gray-400/60 font-medium">Sem avaliação</p> )}
          </div>
        ))}
      </div>
    </div>
  );
}
