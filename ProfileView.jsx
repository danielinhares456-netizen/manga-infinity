import React, { useState, useEffect, useRef } from 'react';
import { Compass, History, Library, Smartphone, Moon, Sun, Camera, Edit3, LogOut, Loader2, UserCircle, BookOpen, Trash2, RefreshCw, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { updateProfile } from "firebase/auth";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from './firebase';
import { APP_ID } from './constants';
import { compressImage, getLevelRequirement, getLevelTitle } from './helpers';

export function ProfileView({ user, userProfileData, historyData, libraryData, dataLoaded, userSettings, updateSettings, onLogout, onUpdateData, showToast, mangas, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Estatisticas"); 
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [coverBase64, setCoverBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 

  useEffect(() => {
    setName(user.displayName || '');
    setBio(userProfileData.bio || '');
    setAvatarBase64(userProfileData.avatarUrl || user.photoURL || '');
    setCoverBase64(userProfileData.coverUrl || '');
  }, [user, userProfileData]);
  
  const avatarInputRef = useRef(null); const coverInputRef = useRef(null);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, type === 'cover' ? 400 : 150, 0.4);
      if (type === 'avatar') setAvatarBase64(compressedBase64); else setCoverBase64(compressedBase64);
    } catch (err) { showToast("Erro na imagem.", "error"); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      const docData = { coverUrl: coverBase64, avatarUrl: avatarBase64, bio: bio };
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), docData, { merge: true });
      onUpdateData(docData);
      showToast('Registro gravado na Singularidade!', 'success'); setIsEditing(false);
    } catch (error) { showToast(`Erro ao gravar.`, 'error'); } finally { setLoading(false); }
  };

  const executeConfirmAction = async () => {
      if (confirmAction === 'history') {
          try {
              historyData.forEach(async (h) => {
                  await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'history', h.id));
              });
              showToast("Rastro apagado do Vazio.", "success");
          } catch(e) { showToast("Erro ao apagar histórico.", "error"); }
      } else if (confirmAction === 'cache') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload(true);
      }
      setConfirmAction(null);
  };

  const level = userProfileData.level || 1;
  const currentXp = userProfileData.xp || 0;
  const xpNeeded = getLevelRequirement(level);
  const progressPercent = Math.min(100, (currentXp / xpNeeded) * 100);
  const lidosSet = new Set(historyData.map(h => h.mangaId));
  const obrasLidasIds = Array.from(lidosSet);
  const libraryMangaIds = Object.keys(libraryData);
  const libraryMangas = mangas.filter(m => libraryMangaIds.includes(m.id));

  return (
    <div className="animate-in fade-in duration-500 w-full pb-20 font-sans bg-[#030407] min-h-screen text-gray-300">
      
      {confirmAction && (
          <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-[#05000a] border border-[#6d28d9]/50 p-6 rounded-3xl shadow-[0_0_50px_rgba(109,40,217,0.15)] max-w-sm w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#6d28d9]/50 to-transparent"></div>
                  <AlertTriangle className="w-12 h-12 text-[#6d28d9] mx-auto mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(109,40,217,0.5)]" />
                  <h3 className="text-lg font-black text-white mb-2 uppercase tracking-widest">
                      {confirmAction === 'history' ? 'Apagar Rastros?' : 'Limpar Sistema?'}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mb-6 px-2">
                      {confirmAction === 'history' ? 'Os registros de leitura serão varridos do Abismo para sempre.' : 'Isso irá recarregar a interface e limpar arquivos temporários da Matrix.'}
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setConfirmAction(null)} className="flex-1 bg-black border border-white/5 text-gray-400 font-bold py-3.5 rounded-xl hover:text-white transition-colors text-xs duration-300 uppercase tracking-widest">Cancelar</button>
                      <button onClick={executeConfirmAction} className="flex-1 bg-gradient-to-r from-[#6d28d9] to-[#2563eb] text-white font-black py-3.5 rounded-xl transition-all hover:scale-105 shadow-[0_0_15px_rgba(109,40,217,0.3)] text-xs duration-300 uppercase tracking-widest">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      <div className="h-40 md:h-64 w-full bg-[#0a001a] relative group border-b border-[#6d28d9]/20 overflow-hidden">
        {userProfileData.activeCover ? <img src={userProfileData.activeCover} className="w-full h-full object-cover opacity-70 mix-blend-luminosity" /> : coverBase64 ? <img src={coverBase64} className="w-full h-full object-cover opacity-70 mix-blend-luminosity" /> : <div className="w-full h-full bg-gradient-to-tr from-[#030407] via-[#0a001a] to-[#030407]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 via-transparent to-fuchsia-500/10 mix-blend-overlay"></div>
        {isEditing && <button onClick={() => coverInputRef.current.click()} className="absolute top-4 right-4 bg-black/60 text-cyan-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs uppercase tracking-widest font-black z-10 transition-colors hover:bg-[#6d28d9]/50 duration-300 backdrop-blur-sm border border-[#6d28d9]/30"><Camera className="w-4 h-4" /> Alterar</button>}
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-20 z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 mb-8">
          <div className="relative group">
            <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#030407] bg-black flex items-center justify-center relative flex-shrink-0 shadow-[0_0_30px_rgba(109,40,217,0.3)] ${userProfileData.activeFrame || ''}`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                {avatarBase64 ? <img src={avatarBase64} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-700 bg-black" />}
              </div>
            </div>
            {isEditing && <button onClick={() => avatarInputRef.current.click()} className="absolute bottom-0 right-0 bg-[#22d3ee] p-3 rounded-full text-black z-10 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:bg-cyan-300 transition-colors duration-300"><Camera className="w-5 h-5" /></button>}
            <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">{name || 'Entidade Anônima'}</h1>
            <p className="text-[#22d3ee] font-bold mb-1 text-xs tracking-wider">{user.email}</p>
            {bio && !isEditing && <p className="text-gray-400 text-xs mb-3 italic font-medium">"{bio}"</p>}
            <div className="w-full max-w-sm mx-auto md:mx-0 bg-black/60 p-4 rounded-xl border border-white/5 shadow-inner mt-3 backdrop-blur-sm">
              <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest"><span className="text-[#d946ef]">Nível {level} - <span className="text-gray-400">{getLevelTitle(level)}</span></span><span className="text-gray-500">{currentXp} / {xpNeeded} XP</span></div>
              <div className="w-full bg-[#05000a] rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner"><div className="bg-gradient-to-r from-[#2563eb] via-[#8b5cf6] to-[#d946ef] h-full rounded-full transition-all duration-1000 relative" style={{width: `${progressPercent}%`}}><div className='absolute inset-0 bg-white/20 animate-pulse'></div></div></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(!isEditing)} className="bg-black text-[#22d3ee] px-5 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center gap-2 transition-all duration-300 hover:bg-[#2563eb]/20 hover:text-white border border-[#2563eb]/30 shadow-sm"><Edit3 className="w-4 h-4" /> {isEditing ? 'Cancelar' : 'Alterar'}</button>
            <button onClick={onLogout} className="bg-red-950/20 text-red-500 p-3.5 rounded-xl transition-all duration-300 hover:bg-red-900 hover:text-white border border-red-900/30 shadow-sm"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="bg-black/50 border border-[#6d28d9]/30 rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 shadow-[0_0_40px_rgba(109,40,217,0.1)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent"></div>
            <div className="space-y-5 relative z-10">
              <div>
                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Identidade do Vazio</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#05000a] border border-white/10 rounded-xl px-5 py-4 text-white text-sm font-medium outline-none focus:border-[#d946ef]/50 transition-colors duration-300 shadow-inner" placeholder="Ex: Tecelão de Mundos"/>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Marca na Alma (Biografia)</label>
                 <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-[#05000a] border border-white/10 rounded-xl px-5 py-4 text-white text-sm resize-none outline-none focus:border-[#d946ef]/50 transition-colors duration-300 shadow-inner" placeholder="Deixe sua marca no Abismo..."></textarea>
              </div>
            </div>
            <button type="submit" disabled={loading} className="mt-6 bg-gradient-to-r from-[#2563eb] via-[#8b5cf6] to-[#d946ef] text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-xl w-full flex justify-center hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_20px_rgba(139,92,246,0.4)] relative z-10">{loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Forjar Registro'}</button>
          </form>
        ) : (
          <div>
            <div className="flex gap-3 border-b border-white/5 mb-8 overflow-x-auto scrollbar-hide pb-3">
              <button onClick={() => setActiveTab("Estatisticas")} className={`px-5 py-3 rounded-xl font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-[0.2em] duration-300 flex items-center gap-2 ${activeTab === "Estatisticas" ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 shadow-inner' : 'bg-black text-gray-500 hover:text-white border border-white/5'}`}><Compass className="w-4 h-4"/> Dados</button>
              <button onClick={() => setActiveTab("Historico")} className={`px-5 py-3 rounded-xl font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-[0.2em] duration-300 flex items-center gap-2 ${activeTab === "Historico" ? 'bg-[#d946ef]/10 text-[#d946ef] border border-[#d946ef]/20 shadow-inner' : 'bg-black text-gray-500 hover:text-white border border-white/5'}`}><History className="w-4 h-4"/> Rastro</button>
              <button onClick={() => setActiveTab("Biblioteca")} className={`px-5 py-3 rounded-xl font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-[0.2em] duration-300 flex items-center gap-2 ${activeTab === "Biblioteca" ? 'bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/20 shadow-inner' : 'bg-black text-gray-500 hover:text-white border border-white/5'}`}><Library className="w-4 h-4"/> Coleção</button>
              <button onClick={() => setActiveTab("Configuracoes")} className={`px-5 py-3 rounded-xl font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-[0.2em] duration-300 flex items-center gap-2 ${activeTab === "Configuracoes" ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 shadow-inner' : 'bg-black text-gray-500 hover:text-white border border-white/5'}`}><Smartphone className="w-4 h-4"/> Sistema</button>
            </div>
            
            {activeTab === "Estatisticas" && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/80 border border-[#22d3ee]/20 p-6 rounded-3xl text-center shadow-inner hover:border-[#22d3ee]/50 transition-colors"><div className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#22d3ee]"/> : Object.keys(libraryData).length}</div><div className="text-[9px] text-[#22d3ee] uppercase font-black tracking-[0.2em]">Salvos</div></div>
                  <div className="bg-black/80 border border-[#d946ef]/20 p-6 rounded-3xl text-center shadow-inner hover:border-[#d946ef]/50 transition-colors"><div className="text-3xl sm:text-4xl font-black text-[#d946ef] mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#d946ef]"/> : historyData.length}</div><div className="text-[9px] text-fuchsia-400/80 uppercase font-black tracking-[0.2em]">Lidos</div></div>
                  <div className="bg-black/80 border border-[#2563eb]/20 p-6 rounded-3xl text-center shadow-inner hover:border-[#2563eb]/50 transition-colors"><div className="text-3xl sm:text-4xl font-black text-[#2563eb] mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563eb]"/> : obrasLidasIds.length}</div><div className="text-[9px] text-blue-400/80 uppercase font-black tracking-[0.2em]">Iniciadas</div></div>
                  <div className="bg-black/80 border border-amber-500/20 p-6 rounded-3xl text-center shadow-inner hover:border-amber-500/50 transition-colors"><div className="text-3xl sm:text-4xl font-black text-amber-400 mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500"/> : Object.values(libraryData).filter(s=>s==='Favoritos').length}</div><div className="text-[9px] text-amber-500/80 uppercase font-black tracking-[0.2em]">Favoritos</div></div>
                </div>
              </div>
            )}

            {activeTab === "Historico" && (
                <div className="animate-in fade-in duration-500">
                    {historyData.length === 0 ? (
                        <div className="text-center py-16 bg-black/60 rounded-3xl border border-white/5 shadow-inner"><History className="w-12 h-12 mx-auto text-gray-600 mb-4"/><p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em]">Nenhum rastro cósmico no Vazio.</p></div>
                    ) : (
                       <div className="flex flex-col gap-3.5">
                          {historyData.slice(0, 15).map(hist => {
                              const mg = mangas.find(m => m.id === hist.mangaId);
                              return (
                                  <div key={hist.id} onClick={() => { if(mg) onNavigate('details', mg); }} className="bg-black/60 border border-white/5 p-3.5 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-[#d946ef]/40 transition-colors duration-300 shadow-md group">
                                      <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#05000a] border border-white/10 shadow-inner">{mg ? <img src={mg.coverUrl} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" /> : <BookOpen className="w-6 h-6 m-auto mt-6 text-gray-700"/>}</div>
                                      <div className="flex-1"><h4 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-[#d946ef] transition-colors">{hist.mangaTitle}</h4><p className="text-[#22d3ee] text-[10px] sm:text-xs font-black mt-1.5 uppercase tracking-widest">Capítulo {hist.chapterNumber}</p></div>
                                      <div className="text-right"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">{new Date(hist.timestamp).toLocaleDateString()}</p><p className="text-[10px] text-gray-600 font-medium mt-1">{new Date(hist.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                                  </div>
                              )
                          })}
                       </div>
                    )}
                </div>
            )}

            {activeTab === "Biblioteca" && (
                <div className="animate-in fade-in duration-500">
                    {libraryMangas.length === 0 ? (
                        <div className="text-center py-16 bg-black/60 rounded-3xl border border-white/5 shadow-inner"><Library className="w-12 h-12 mx-auto text-gray-600 mb-4"/><p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em]">Sua coleção cósmica está vazia.</p></div>
                    ) : (
                       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                           {libraryMangas.map(manga => {
                               const status = libraryData[manga.id];
                               let statusColor = "bg-gray-800 text-white";
                               if(status === 'Lendo') statusColor = "bg-[#2563eb] text-white";
                               if(status === 'Favoritos') statusColor = "bg-amber-400 text-black";
                               if(status === 'Finalizado') statusColor = "bg-emerald-500 text-black";
                               return (
                                   <div key={manga.id} onClick={() => onNavigate('details', manga)} className="cursor-pointer group relative">
                                       <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-lg mb-2.5 bg-black">
                                           <img src={manga.coverUrl} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                           <div className={`absolute top-0 right-0 ${statusColor} text-[8px] sm:text-[9px] font-black px-2.5 py-1.5 rounded-bl-xl shadow-lg uppercase tracking-widest`}>{status}</div>
                                       </div>
                                       <h3 className="font-bold text-[11px] sm:text-xs text-gray-300 line-clamp-2 group-hover:text-[#22d3ee] transition-colors leading-tight px-1">{manga.title}</h3>
                                   </div>
                               )
                           })}
                       </div>
                    )}
                </div>
            )}
            
            {activeTab === "Configuracoes" && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-black/60 border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-inner">
                  <h4 className="font-black text-gray-300 uppercase tracking-widest flex items-center gap-3 text-[10px] sm:text-xs"><Moon className="w-5 h-5 text-[#8b5cf6]"/> Matriz Visual</h4>
                  <div className="flex bg-[#05000a] border border-white/10 rounded-xl p-1 w-full sm:w-auto shadow-inner">
                    <button onClick={() => updateSettings({ theme: 'Escuro' })} className={`flex-1 px-6 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.theme === 'Escuro' || !userSettings.theme ? 'bg-black text-white shadow-md border border-white/5' : 'text-gray-500 hover:text-white'}`}>Abissal</button>
                    <button onClick={() => updateSettings({ theme: 'OLED' })} className={`flex-1 px-6 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.theme === 'OLED' ? 'bg-black text-[#22d3ee] shadow-md border border-cyan-900/30' : 'text-gray-500 hover:text-white'}`}>Singularidade</button>
                  </div>
                </div>

                <div className="bg-black/60 border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-inner">
                  <h4 className="font-black text-gray-300 uppercase tracking-widest flex items-center gap-3 text-[10px] sm:text-xs"><BookOpen className="w-5 h-5 text-[#2563eb]"/> Motor de Leitura</h4>
                  <div className="flex bg-[#05000a] border border-white/10 rounded-xl p-1 w-full sm:w-auto shadow-inner">
                    <button onClick={() => updateSettings({ readMode: 'Cascata' })} className={`flex-1 px-6 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.readMode === 'Cascata' ? 'bg-black text-white shadow-md border border-white/5' : 'text-gray-500 hover:text-white'}`}>Cascata</button>
                    <button onClick={() => updateSettings({ readMode: 'Páginas' })} className={`flex-1 px-6 py-3 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.readMode === 'Páginas' ? 'bg-black text-[#d946ef] shadow-md border border-fuchsia-900/30' : 'text-gray-500 hover:text-white'}`}>Páginas</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <button onClick={() => setConfirmAction('history')} className="bg-black/40 border border-white/5 hover:border-red-500/50 hover:bg-red-950/20 text-gray-500 hover:text-red-400 font-black uppercase tracking-[0.2em] p-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 text-[10px] shadow-sm">
                        <Trash2 className="w-5 h-5" /> Apagar Rastros
                    </button>
                    <button onClick={() => setConfirmAction('cache')} className="bg-black/40 border border-white/5 hover:border-[#6d28d9]/50 hover:bg-[#6d28d9]/10 text-gray-500 hover:text-[#8b5cf6] font-black uppercase tracking-[0.2em] p-6 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 text-[10px] shadow-sm">
                        <RefreshCw className="w-5 h-5" /> Limpar Matrix
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
