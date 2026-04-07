import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ZoomIn, ZoomOut } from 'lucide-react';

export default function ReaderView({ manga, chapter, user, userProfileData, onBack, onChapterClick, triggerRandomDrop, onMarkAsRead, readMode, onRequireLogin, showToast, libraryData, onToggleLibrary }) {
  const [showUI, setShowUI] = useState(true);
  const [zoom, setZoom] = useState(1); 
  const [isChapterLoading, setIsChapterLoading] = useState(true); 
  
  const readingTimeRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
      setIsChapterLoading(true); 
      window.scrollTo(0, 0);
      setCurrentPage(0);
      setZoom(1);
      
      const loadTimer = setTimeout(() => {
          setIsChapterLoading(false);
      }, 1200);

      return () => clearTimeout(loadTimer);
  }, [chapter.id]);

  useEffect(() => {
      readingTimeRef.current = 0;
      const timer = setInterval(() => { readingTimeRef.current += 1; }, 1000);
      return () => {
          clearInterval(timer);
          onMarkAsRead(manga, chapter, readingTimeRef.current >= 45);
      };
  }, [manga.id, chapter.id]); 

  const currentIndex = manga.chapters.findIndex(c => c && c.id === chapter.id);
  const nextChapter = currentIndex > 0 ? manga.chapters[currentIndex - 1] : null; 
  const prevChapter = currentIndex < manga.chapters.length - 1 ? manga.chapters[currentIndex + 1] : null;

  const mockPages = Array(15).fill('').map((_, i) => `https://placehold.co/800x1200/0d0d12/22d3ee?text=Página+${i + 1}`);
  const pages = chapter.pages && chapter.pages.length > 0 ? chapter.pages : mockPages;

  const handleScroll = () => {
      if (!isChapterLoading && Math.random() < 0.005) triggerRandomDrop();
  };

  const handleZoom = (e) => {
      e.stopPropagation();
      setZoom(prev => prev === 1 ? 0.5 : prev === 0.5 ? 0.75 : 1);
  };

  return (
      <div className="min-h-screen bg-[#030407] text-white relative flex flex-col overflow-x-hidden select-none" onScroll={handleScroll}>
         <style>{`
            @keyframes slashCut {
                0% { width: 0%; opacity: 1; box-shadow: 0 0 20px #22d3ee; }
                50% { width: 100%; opacity: 1; box-shadow: 0 0 40px #22d3ee; }
                100% { width: 100%; opacity: 0; box-shadow: 0 0 0px transparent; }
            }
            .animate-slash { animation: slashCut 1s cubic-bezier(0.8, 0, 0.2, 1) forwards; }
            @keyframes pageReveal {
                0% { opacity: 0; filter: blur(20px) grayscale(100%); transform: scale(1.05); }
                100% { opacity: 1; filter: blur(0px) grayscale(0%); transform: scale(1); }
            }
            .animate-reveal { animation: pageReveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
         `}</style>

         {isChapterLoading && (
             <div className="fixed inset-0 z-[9999] bg-[#030407] flex items-center justify-center">
                 <div className="h-[2px] bg-white animate-slash relative shadow-[0_0_20px_#fff]"></div>
                 <span className="absolute bottom-10 text-xs font-black tracking-[0.5em] text-cyan-400 uppercase animate-pulse">Materializando...</span>
             </div>
         )}

         {showUI && !isChapterLoading && (
            <div className="fixed top-0 left-0 right-0 h-16 bg-[#030407]/95 backdrop-blur-xl z-50 flex justify-between items-center px-4 border-b border-white/5 shadow-md transition-opacity animate-in slide-in-from-top-full">
               <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={onBack} className="p-2 hover:text-cyan-400 transition-colors flex-shrink-0"><ChevronLeft className="w-6 h-6"/></button>
                  <div className="flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                     <span className="text-xs text-gray-400/80 font-bold truncate select-text cursor-text">{manga.title}</span>
                     <span className="text-sm font-black text-cyan-400 truncate">Capítulo {chapter.number}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => onToggleLibrary(manga.id, libraryData[manga.id] === 'Favoritos' ? 'Remover' : 'Favoritos')} className="p-2 hover:text-yellow-400 transition-colors">
                     <Star className={`w-5 h-5 ${libraryData[manga.id] === 'Favoritos' ? 'fill-current text-yellow-400' : 'text-gray-400'}`}/>
                  </button>
                  <button onClick={handleZoom} className="p-2 text-cyan-400 hover:text-white transition-colors flex items-center gap-1">
                     {zoom < 1 ? <ZoomOut className="w-5 h-5"/> : <ZoomIn className="w-5 h-5"/>}
                     <span className="text-xs font-bold w-8">{zoom * 100}%</span>
                  </button>
               </div>
            </div>
         )}

         {!isChapterLoading && (
             <div className="flex-1 w-full mx-auto cursor-pointer overflow-x-auto origin-center animate-reveal" onClick={() => setShowUI(!showUI)}>
                {readMode === 'Páginas' ? (
                   <div className="w-full h-screen flex flex-col items-center justify-center pt-16 pb-20 px-2 relative overflow-hidden">
                      <img src={pages[currentPage]} className="max-h-full object-contain shadow-2xl transition-all duration-300" style={{ width: `${zoom * 100}%` }} />
                      <div className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }}></div>
                      <div className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(pages.length - 1, p + 1)); }}></div>
                      {showUI && <div className="absolute bottom-24 bg-black/80 px-4 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none animate-in fade-in">{currentPage + 1} / {pages.length}</div>}
                   </div>
                ) : (
                   <div className="flex flex-col items-center pt-16 pb-20 transition-all duration-300 mx-auto" style={{ width: `${zoom * 100}%` }}>
                      {pages.map((p, i) => (
                         <img key={i} src={p} className="w-full object-contain mb-1" loading="lazy" />
                      ))}
                   </div>
                )}
             </div>
         )}

         {showUI && !isChapterLoading && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#030407]/95 backdrop-blur-xl z-50 p-4 border-t border-white/5 shadow-lg flex justify-between items-center transition-opacity animate-in slide-in-from-bottom-full">
               <button onClick={() => prevChapter && onChapterClick(manga, prevChapter)} disabled={!prevChapter} className="bg-[#0d0d12] disabled:opacity-30 disabled:hover:border-white/10 border border-white/10 hover:border-cyan-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 transition-colors"><ChevronLeft className="w-4 h-4"/> Anterior</button>
               {readMode === 'Páginas' && (
                   <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                       <input type="range" min="0" max={pages.length - 1} value={currentPage} onChange={(e) => setCurrentPage(parseInt(e.target.value))} className="w-24 md:w-32 accent-cyan-500"/>
                   </div>
               )}
               <button onClick={() => nextChapter && onChapterClick(manga, nextChapter)} disabled={!nextChapter} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 disabled:from-[#0d0d12] disabled:to-[#0d0d12] disabled:opacity-30 disabled:text-gray-400 border border-transparent disabled:border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:scale-105 transition-transform shadow-md">Próximo <ChevronRight className="w-4 h-4"/></button>
            </div>
         )}
      </div>
  );
}
