import React, { useState } from 'react';
import { Library, BookOpen } from 'lucide-react';
import { LIBRARY_STATUS } from '../utils/constants';

export default function LibraryView({ mangas, user, libraryData, onNavigate, onRequireLogin, dataSaver }) {
  const [activeStatus, setActiveStatus] = useState("Lendo");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-300">
        <Library className="w-16 h-16 text-gray-400/60 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sua Biblioteca</h2>
        <p className="text-gray-400/60 text-sm mb-6">Faça login para gerenciar suas obras.</p>
        <button onClick={onRequireLogin} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-bold px-8 py-3 rounded-md shadow-md hover:scale-105 transition-transform duration-300">Entrar / Cadastrar</button>
      </div>
    );
  }

  const libraryMangas = mangas.filter(m => libraryData[m.id] === activeStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <Library className="w-6 h-6 text-fuchsia-400" />
        <h2 className="text-2xl font-black text-white">Minha Biblioteca</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full mb-8 pb-2 border-b border-white/10">
        {LIBRARY_STATUS.map(status => (
          <button key={status} onClick={() => setActiveStatus(status)} className={`whitespace-nowrap font-bold px-4 py-2 rounded-full text-sm transition-colors duration-300 ${activeStatus === status ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white shadow-md' : 'bg-[#0d0d12] text-gray-300/80 hover:text-white border border-white/10'}`}>
            {status} <span className="ml-1 opacity-70 text-xs">({Object.values(libraryData).filter(s => s === status).length})</span>
          </button>
        ))}
      </div>

      {libraryMangas.length === 0 ? (
         <div className="text-center py-16 bg-[#0d0d12]/50 rounded-xl border border-white/10 border-dashed">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400/30 mb-3"/>
            <p className="text-gray-400/60 font-bold text-sm">Nenhuma obra marcada como "{activeStatus}".</p>
         </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {libraryMangas.map(manga => (
            <div key={manga.id} className="cursor-pointer group flex flex-col gap-1.5" onClick={() => onNavigate('details', manga)}>
              <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d12] border border-white/10 shadow-sm ${dataSaver ? 'blur-[1px]' : ''}`}>
                 <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300">{manga.title}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
