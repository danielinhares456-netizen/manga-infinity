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
      showToast('Registro salvo no Abismo!', 'success'); setIsEditing(false);
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

  // MOTOR DA LOJA
  const equipped = userProfileData.equipped_items || {};

  return (
    <div className={`animate-in fade-in duration-500 w-full pb-20 font-sans min-h-screen text-gray-300 ${equipped.tema_perfil ? equipped.tema_perfil.cssClass : 'bg-[#020202]'}`}>
      
      {/* INJEÇÃO CSS COSMÉTICOS */}
      {Object.values(equipped).map(item => item && (
          <style key={item.id} dangerouslySetInnerHTML={{__html: `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`}} />
      ))}

      {confirmAction && (
          <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-[#0a0802] border border-amber-900/50 p-6 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] max-w-sm w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-black text-white mb-2 uppercase tracking-widest">
                      {confirmAction === 'history' ? 'Apagar Rastros?' : 'Limpar Sistema?'}
                  </h3>
                  <p className="text-xs text-amber-200/60 font-medium mb-6 px-2">
                      {confirmAction === 'history' ? 'Os registros de leitura serão varridos do Abismo para sempre.' : 'Isso irá recarregar a interface e limpar arquivos temporários.'}
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setConfirmAction(null)} className="flex-1 bg-black border border-amber-900/30 text-gray-400 font-bold py-3.5 rounded-xl hover:text-white transition-colors text-xs duration-300 uppercase tracking-widest">Cancelar</button>
                      <button onClick={executeConfirmAction} className="flex-1 bg-amber-950/40 border border-amber-900/50 text-amber-400 hover:bg-amber-700 hover:text-white font-black py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)] text-xs duration-300 uppercase tracking-widest">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* CAPA DA LOJA OU PERFIL */}
      <div className="h-40 md:h-64 w-full bg-[#050402] relative group border-b border-amber-900/20 overflow-hidden">
        {equipped.capa_fundo ? (
            <img src={equipped.capa_fundo.preview} className={`w-full h-full object-cover opacity-90 ${equipped.capa_fundo.cssClass}`} />
        ) : userProfileData.activeCover ? (
            <img src={userProfileData.activeCover} className="w-full h-full object-cover opacity-70 mix-blend-luminosity" /> 
        ) : coverBase64 ? (
            <img src={coverBase64} className="w-full h-full object-cover opacity-70 mix-blend-luminosity" /> 
        ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#020202] to-[#0a0802]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent" />
        {isEditing && <button onClick={() => coverInputRef.current.click()} className="absolute top-4 right-4 bg-black/60 text-amber-100 px-4 py-2 rounded-xl flex items-center gap-2 text-xs uppercase tracking-widest font-black z-10 transition-colors hover:bg-amber-900/50 duration-300 backdrop-blur-sm border border-amber-900/30"><Camera className="w-4 h-4" /> Capa</button>}
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-20 z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-8">
          
          {/* AVATAR COM RENDERIZAÇÃO DA LOJA (MOLDURAS E PARTICULAS) */}
          <div className="relative group w-28 h-28 md:w-36 md:h-36 flex-shrink-0 flex items-center justify-center">
            {equipped.particulas && <img src={equipped.particulas.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] max-w-none object-cover pointer-events-none ${equipped.particulas.cssClass}`} />}
            <div className={`w-full h-full rounded-full bg-black flex items-center justify-center relative z-10 overflow-hidden ${equipped.moldura ? '' : 'border-4 border-[#020202] shadow-[0_0_30px_rgba(245,158,11,0.15)]'}`}>
               {equipped.avatar ? <img src={equipped.avatar.preview} className={`w-full h-full object-cover ${equipped.avatar.cssClass}`} /> : avatarBase64 ? <img src={avatarBase64} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-amber-900/40 bg-black" />}
            </div>
            {equipped.efeito && <img src={equipped.efeito.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${equipped.efeito.cssClass}`} />}
            {equipped.moldura && <img src={equipped.moldura.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-w-none pointer-events-none z-30 ${equipped.moldura.cssClass}`} />}
            {equipped.badge && <img src={equipped.badge.preview} className={`absolute -bottom-2 -right-2 w-8 h-8 z-40 drop-shadow-lg ${equipped.badge.cssClass}`} />}

            {isEditing && <button onClick={() => avatarInputRef.current.click()} className="absolute bottom-0 right-0 bg-amber-600 p-3 rounded-full text-black z-50 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:bg-amber-500 transition-colors duration-300"><Camera className="w-5 h-5" /></button>}
            <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
            {/* NICKNAME INJETADO DA LOJA */}
            <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${equipped.nickname ? equipped.nickname.cssClass : 'text-amber-50'}`}>
                {name || 'Entidade Sem Nome'}
            </h1>
            <p className="text-amber-500 font-bold mb-1 text-xs tracking-wider">{user.email}</p>
            {bio && !isEditing && <p className="text-amber-200/60 text-xs mb-3 italic font-medium">"{bio}"</p>}
            <div className="w-full max-w-sm mx-auto md:mx-0 bg-[#050402]/80 p-4 rounded-xl border border-amber-900/20 shadow-inner mt-3 backdrop-blur-sm">
              <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest"><span className="text-amber-500">Nível {level} - <span className="text-amber-200/80">{getLevelTitle(level)}</span></span><span className="text-amber-400/60">{currentXp} / {xpNeeded} XP</span></div>
              <div className="w-full bg-[#020202] rounded-full h-2 overflow-hidden border border-amber-900/30 shadow-inner"><div className="bg-gradient-to-r from-amber-800 to-yellow-500 h-full rounded-full transition-all duration-1000 relative" style={{width: `${progressPercent}%`}}></div></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="bg-black text-amber-200 px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-2 transition-all duration-300 hover:bg-amber-950/30 hover:text-white border border-amber-900/30 shadow-sm"><Edit3 className="w-4 h-4" /> {isEditing ? 'Cancelar' : 'Editar'}</button>
            <button onClick={onLogout} className="bg-red-950/20 text-red-500 p-3 rounded-xl transition-all duration-300 hover:bg-red-900 hover:text-white border border-red-900/30 shadow-sm"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="bg-[#050402]/80 border border-amber-900/30 rounded-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(245,158,11,0.05)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            <div className="space-y-5 relative z-10">
              <div>
                 <label className="block text-[10px] font-black text-amber-400/70 uppercase tracking-widest mb-2">Identidade do Vazio</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/80 border border-amber-900/30 rounded-xl px-4 py-3.5 text-white text-sm font-medium outline-none focus:border-amber-500/50 transition-colors duration-300 shadow-inner" placeholder="Ex: Mestre Dourado"/>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-amber-400/70 uppercase tracking-widest mb-2">Marca na Alma (Biografia)</label>
                 <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-black/80 border border-amber-900/30 rounded-xl px-4 py-3.5 text-white text-sm resize-none outline-none focus:border-amber-500/50 transition-colors duration-300 shadow-inner" placeholder="Deixe sua marca no Abismo..."></textarea>
              </div>
            </div>
            <button type="submit" disabled={loading} className="mt-6 bg-gradient-to-r from-amber-700 to-amber-500 text-black text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl w-full flex justify-center hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] relative z-10">{loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Salvar Registro'}</button>
          </form>
        ) : (
          <div>
            <div className="flex gap-2.5 border-b border-amber-900/20 mb-6 overflow-x-auto scrollbar-hide pb-2">
              <button onClick={() => setActiveTab("Estatisticas")} className={`px-4 py-2.5 rounded-lg font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-widest duration-300 flex items-center gap-2 ${activeTab === "Estatisticas" ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' : 'text-amber-900/60 hover:text-amber-200 border border-transparent'}`}><Compass className="w-4 h-4"/> Dados</button>
              <button onClick={() => setActiveTab("Historico")} className={`px-4 py-2.5 rounded-lg font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-widest duration-300 flex items-center gap-2 ${activeTab === "Historico" ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' : 'text-amber-900/60 hover:text-amber-200 border border-transparent'}`}><History className="w-4 h-4"/> Rastro</button>
              <button onClick={() => setActiveTab("Biblioteca")} className={`px-4 py-2.5 rounded-lg font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-widest duration-300 flex items-center gap-2 ${activeTab === "Biblioteca" ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' : 'text-amber-900/60 hover:text-amber-200 border border-transparent'}`}><Library className="w-4 h-4"/> Coleção</button>
              <button onClick={() => setActiveTab("Configuracoes")} className={`px-4 py-2.5 rounded-lg font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-widest duration-300 flex items-center gap-2 ${activeTab === "Configuracoes" ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' : 'text-amber-900/60 hover:text-amber-200 border border-transparent'}`}><Smartphone className="w-4 h-4"/> Sistema</button>
            </div>
            
            {activeTab === "Estatisticas" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#050402] border border-amber-900/20 p-5 rounded-2xl text-center shadow-inner"><div className="text-3xl font-black text-amber-50 mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500"/> : Object.keys(libraryData).length}</div><div className="text-[9px] text-amber-400/60 uppercase font-black tracking-widest">Salvos</div></div>
                  <div className="bg-[#050402] border border-amber-900/20 p-5 rounded-2xl text-center shadow-inner"><div className="text-3xl font-black text-amber-500 mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500"/> : historyData.length}</div><div className="text-[9px] text-amber-400/60 uppercase font-black tracking-widest">Lidos</div></div>
                  <div className="bg-[#050402] border border-amber-900/20 p-5 rounded-2xl text-center shadow-inner"><div className="text-3xl font-black text-amber-400 mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400"/> : obrasLidasIds.length}</div><div className="text-[9px] text-amber-400/60 uppercase font-black tracking-widest">Iniciadas</div></div>
                  <div className="bg-[#050402] border border-amber-900/20 p-5 rounded-2xl text-center shadow-inner"><div className="text-3xl font-black text-yellow-500 mb-2 tracking-tighter">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-500"/> : Object.values(libraryData).filter(s=>s==='Favoritos').length}</div><div className="text-[9px] text-amber-400/60 uppercase font-black tracking-widest">Favoritos</div></div>
                </div>
              </div>
            )}

            {activeTab === "Historico" && (
                <div className="animate-in fade-in duration-300">
                    {historyData.length === 0 ? (
                        <div className="text-center py-12 bg-[#050402] rounded-2xl border border-amber-900/20 shadow-inner"><History className="w-10 h-10 mx-auto text-amber-900/40 mb-3"/><p className="text-amber-800/60 font-black text-[10px] uppercase tracking-widest">Nenhum rastro dourado no Vazio.</p></div>
                    ) : (
                       <div className="flex flex-col gap-3">
                          {historyData.slice(0, 15).map(hist => {
                              const mg = mangas.find(m => m.id === hist.mangaId);
                              return (
                                  <div key={hist.id} onClick={() => { if(mg) onNavigate('details', mg); }} className="bg-[#050402] border border-amber-900/20 p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-amber-500/40 transition-colors duration-300 shadow-sm group">
                                      <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-amber-900/30 shadow-inner">{mg ? <img src={mg.coverUrl} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" /> : <BookOpen className="w-6 h-6 m-auto mt-6 text-amber-900/40"/>}</div>
                                      <div className="flex-1"><h4 className="font-bold text-amber-50 text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">{hist.mangaTitle}</h4><p className="text-amber-600 text-[10px] font-black mt-1 uppercase tracking-wider">Capítulo {hist.chapterNumber}</p></div>
                                      <div className="text-right"><p className="text-[9px] text-amber-400/50 font-bold uppercase tracking-widest">{new Date(hist.timestamp).toLocaleDateString()}</p><p className="text-[10px] text-amber-900/60 font-medium mt-0.5">{new Date(hist.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                                  </div>
                              )
                          })}
                       </div>
                    )}
                </div>
            )}

            {activeTab === "Biblioteca" && (
                <div className="animate-in fade-in duration-300">
                    {libraryMangas.length === 0 ? (
                        <div className="text-center py-12 bg-[#050402] rounded-2xl border border-amber-900/20 shadow-inner"><Library className="w-10 h-10 mx-auto text-amber-900/40 mb-3"/><p className="text-amber-800/60 font-black text-[10px] uppercase tracking-widest">Sua coleção estelar está vazia.</p></div>
                    ) : (
                       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                           {libraryMangas.map(manga => {
                               const status = libraryData[manga.id];
                               let statusColor = "bg-gray-800";
                               if(status === 'Lendo') statusColor = "bg-amber-600 text-black";
                               if(status === 'Favoritos') statusColor = "bg-yellow-500 text-black";
                               if(status === 'Finalizado') statusColor = "bg-amber-900 text-white";
                               return (
                                   <div key={manga.id} onClick={() => onNavigate('details', manga)} className="cursor-pointer group relative">
                                       <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-amber-900/30 shadow-md mb-2 bg-black">
                                           <img src={manga.coverUrl} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                           <div className={`absolute top-0 right-0 ${statusColor} text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-lg uppercase tracking-wider`}>{status}</div>
                                       </div>
                                       <h3 className="font-bold text-xs text-amber-200/80 line-clamp-1 group-hover:text-white transition-colors">{manga.title}</h3>
                                   </div>
                               )
                           })}
                       </div>
                    )}
                </div>
            )}
            
            {activeTab === "Configuracoes" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#050402] border border-amber-900/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-inner">
                  <h4 className="font-black text-amber-200 uppercase tracking-widest flex items-center gap-2.5 text-[10px]"><Moon className="w-5 h-5 text-amber-600"/> Matriz Visual</h4>
                  <div className="flex bg-black border border-amber-900/30 rounded-xl p-1 w-full sm:w-auto shadow-inner">
                    <button onClick={() => updateSettings({ theme: 'Escuro' })} className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.theme === 'Escuro' || !userSettings.theme ? 'bg-[#1a1300] text-white shadow-md border border-amber-900/50' : 'text-amber-900/60 hover:text-amber-200'}`}>Ouro Escuro</button>
                    <button onClick={() => updateSettings({ theme: 'OLED' })} className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.theme === 'OLED' ? 'bg-black text-amber-500 shadow-md border border-amber-900/50' : 'text-amber-900/60 hover:text-amber-200'}`}>OLED Absoluto</button>
                  </div>
                </div>

                <div className="bg-[#050402] border border-amber-900/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-inner">
                  <h4 className="font-black text-amber-200 uppercase tracking-widest flex items-center gap-2.5 text-[10px]"><BookOpen className="w-5 h-5 text-amber-600"/> Motor de Leitura</h4>
                  <div className="flex bg-black border border-amber-900/30 rounded-xl p-1 w-full sm:w-auto shadow-inner">
                    <button onClick={() => updateSettings({ readMode: 'Cascata' })} className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.readMode === 'Cascata' ? 'bg-[#1a1300] text-white shadow-md border border-amber-900/50' : 'text-amber-900/60 hover:text-amber-200'}`}>Cascata</button>
                    <button onClick={() => updateSettings({ readMode: 'Páginas' })} className={`flex-1 px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all duration-300 ${userSettings.readMode === 'Páginas' ? 'bg-[#1a1300] text-white shadow-md border border-amber-900/50' : 'text-amber-900/60 hover:text-amber-200'}`}>Páginas</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-2">
                    <button onClick={() => setConfirmAction('history')} className="bg-black border border-amber-900/20 hover:border-amber-500/50 hover:bg-amber-950/30 text-amber-800/80 hover:text-amber-400 font-black uppercase tracking-widest p-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 text-[10px] shadow-sm">
                        <Trash2 className="w-5 h-5" /> Apagar Rastros
                    </button>
                    <button onClick={() => setConfirmAction('cache')} className="bg-black border border-amber-900/20 hover:border-amber-500/50 hover:bg-amber-950/30 text-amber-800/80 hover:text-amber-400 font-black uppercase tracking-widest p-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 text-[10px] shadow-sm">
                        <RefreshCw className="w-5 h-5" /> Limpar Sistema
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
