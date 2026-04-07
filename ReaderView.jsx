import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ZoomIn } from 'lucide-react';

export function ReaderView({ manga, chapter, user, userProfileData, onBack, onChapterClick, triggerRandomDrop, onMarkAsRead, readMode, onRequireLogin, showToast, libraryData, onToggleLibrary }) {
  const [showUI, setShowUI] = useState(true);
  const readingTimeRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
      readingTimeRef.current = 0;
      const timer = setInterval(() => { readingTimeRef.current += 1; }, 1000);
      return () => {
          clearInterval(timer);
          onMarkAsRead(manga, chapter, readingTimeRef.current >= 45);
      };
  }, [manga, chapter, onMarkAsRead]);

  const currentIndex = manga.chapters.findIndex(c => c.id === chapter.id);
  const nextChapter = currentIndex > 0 ? manga.chapters[currentIndex - 1] : null; 
  const prevChapter = currentIndex < manga.chapters.length - 1 ? manga.chapters[currentIndex + 1] : null;

  const mockPages = Array(15).fill('').map((_, i) => `https://placehold.co/800x1200/0d0d12/22d3ee?text=Página+${i + 1}`);
  const pages = chapter.pages && chapter.pages.length > 0 ? chapter.pages : mockPages;

  const handleScroll = (e) => {
      if (Math.random() < 0.005) triggerRandomDrop();
  };

  return (
      <div className="min-h-screen bg-[#030407] text-white relative flex flex-col overflow-x-hidden" onScroll={handleScroll}>
         {showUI && (
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#030407]/95 backdrop-blur-xl z-50 flex justify-between items-center px-4 border-b border-white/5 shadow-md transition-opacity">
               <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={onBack} className="p-2 hover:text-cyan-400 transition-colors flex-shrink-0"><ChevronLeft className="w-6 h-6"/></button>
                  <div className="flex flex-col overflow-hidden">
                     <span className="text-xs text-gray-400/80 font-bold truncate">{manga.title}</span>
                     <span className="text-sm font-black text-cyan-400 truncate">Capítulo {chapter.number}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => onToggleLibrary(manga.id, libraryData[manga.id] === 'Favoritos' ? 'Remover' : 'Favoritos')} className="p-2 hover:text-yellow-400 transition-colors">
                     <Star className={`w-5 h-5 ${libraryData[manga.id] === 'Favoritos' ? 'fill-current text-yellow-400' : 'text-gray-400'}`}/>
                  </button>
                  <button onClick={() => setShowUI(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><ZoomIn className="w-5 h-5"/></button>
               </div>
            </div>
         )}

         <div className="flex-1 w-full max-w-3xl mx-auto cursor-pointer" onClick={() => setShowUI(!showUI)}>
            {readMode === 'Páginas' ? (
               <div className="w-full h-screen flex flex-col items-center justify-center pt-16 pb-20 px-2 relative">
                  <img src={pages[currentPage]} className="max-w-full max-h-full object-contain shadow-2xl" />
                  
                  <div className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }}></div>
                  <div className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(pages.length - 1, p + 1)); }}></div>
                  
                  {showUI && <div className="absolute bottom-24 bg-black/80 px-4 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none">{currentPage + 1} / {pages.length}</div>}
               </div>
            ) : (
               <div className="w-full flex flex-col items-center pt-16 pb-20">
                  {pages.map((p, i) => (
                     <img key={i} src={p} className="w-full object-contain mb-1" loading="lazy" />
                  ))}
               </div>
            )}
         </div>

         {showUI && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#030407]/95 backdrop-blur-xl z-50 p-4 border-t border-white/5 shadow-lg flex justify-between items-center transition-opacity">
               <button onClick={() => prevChapter && onChapterClick(manga, prevChapter)} disabled={!prevChapter} className="bg-[#0d0d12] disabled:opacity-30 disabled:hover:border-white/10 border border-white/10 hover:border-cyan-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 transition-colors"><ChevronLeft className="w-4 h-4"/> Anterior</button>
               
               {readMode === 'Páginas' && (
                   <div className="flex items-center gap-2">
                       <input type="range" min="0" max={pages.length - 1} value={currentPage} onChange={(e) => setCurrentPage(parseInt(e.target.value))} className="w-24 md:w-32 accent-cyan-500"/>
                   </div>
               )}

               <button onClick={() => nextChapter && onChapterClick(manga, nextChapter)} disabled={!nextChapter} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 disabled:from-[#0d0d12] disabled:to-[#0d0d12] disabled:opacity-30 disabled:text-gray-400 border border-transparent disabled:border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:scale-105 transition-transform shadow-md">Próximo <ChevronRight className="w-4 h-4"/></button>
            </div>
         )}
      </div>
  );
}