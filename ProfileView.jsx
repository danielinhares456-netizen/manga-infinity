import React, { useState, useEffect, useRef } from 'react';
import { Compass, History, Library, Smartphone, Moon, Sun, Camera, Edit3, LogOut, Loader2, UserCircle, BookOpen } from 'lucide-react';
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../services/firebase';
import { APP_ID } from '../utils/constants';
import { compressImage, getLevelRequirement, getLevelTitle } from '../utils/helpers';

export function ProfileView({ user, userProfileData, historyData, libraryData, dataLoaded, userSettings, updateSettings, onLogout, onUpdateData, showToast, mangas, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Estatisticas"); 
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [coverBase64, setCoverBase64] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user.displayName || '');
    setBio(userProfileData.bio || '');
    setAvatarBase64(userProfileData.avatarUrl || user.photoURL || '');
    setCoverBase64(userProfileData.coverUrl || '');
  }, [user, userProfileData]);
  
  const avatarInputRef = useRef(null); 
  const coverInputRef = useRef(null);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]; 
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, type === 'cover' ? 400 : 150, 0.4);
      if (type === 'avatar') setAvatarBase64(compressedBase64); 
      else setCoverBase64(compressedBase64);
    } catch (err) { 
      showToast("Erro na imagem.", "error"); 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      const docData = { coverUrl: coverBase64, avatarUrl: avatarBase64, bio: bio };
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), docData, { merge: true });
      onUpdateData(docData);
      showToast('Perfil salvo com sucesso!', 'success'); 
      setIsEditing(false);
    } catch (error) { 
      showToast(`Erro: Falha na conexão.`, 'error'); 
    } finally { 
      setLoading(false); 
    }
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
    <div className="animate-in fade-in duration-500 w-full pb-20">
      <div className="h-40 md:h-64 w-full bg-[#0d0d12] relative group border-b border-white/10 overflow-hidden">
        {userProfileData.activeCover ? (
           <img src={userProfileData.activeCover} className="w-full h-full object-cover" />
        ) : coverBase64 ? (
           <img src={coverBase64} className="w-full h-full object-cover" />
        ) : (
           <div className="w-full h-full bg-gradient-to-r from-[#0d0d12] to-[#030407]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent" />
        {isEditing && (
          <button onClick={() => coverInputRef.current.click()} className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold z-10 transition-colors hover:bg-black/80 duration-300">
            <Camera className="w-4 h-4" /> Capa
          </button>
        )}
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-20 z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-8">
          <div className="relative group">
            <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#030407] bg-[#0d0d12] flex items-center justify-center relative flex-shrink-0 ${userProfileData.activeFrame || ''}`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                {avatarBase64 ? (
                  <img src={avatarBase64} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-full h-full text-gray-400/60 bg-[#0d0d12]" />
                )}
              </div>
            </div>
            {isEditing && (
              <button onClick={() => avatarInputRef.current.click()} className="absolute bottom-0 right-0 bg-fuchsia-600 p-3 rounded-full text-white z-10 shadow-lg hover:bg-fuchsia-500 transition-colors duration-300">
                <Camera className="w-5 h-5" />
              </button>
            )}
            <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-black text-white">{name || 'Sem Nome'}</h1>
            <p className="text-cyan-400 font-medium mb-1 text-sm">{user.email}</p>
            {bio && !isEditing && <p className="text-gray-400/80 text-xs mb-3 italic">"{bio}"</p>}
            
            <div className="w-full max-w-sm mx-auto md:mx-0 bg-[#0d0d12] p-3 rounded-md border border-white/10 shadow-inner mt-2">
              <div className="flex justify-between text-xs font-black uppercase mb-2 tracking-widest">
                <span className="text-fuchsia-400">Nível {level} - <span className="text-gray-300/80">{getLevelTitle(level)}</span></span>
                <span className="text-gray-400/60">{currentXp} / {xpNeeded} XP</span>
              </div>
              <div className="w-full bg-[#050508] rounded-full h-2 overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 relative" style={{width: `${progressPercent}%`}}></div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="bg-[#0d0d12] text-white px-5 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 transition-colors duration-300 hover:bg-white/5 border border-white/10">
              <Edit3 className="w-4 h-4" /> {isEditing ? 'Cancelar' : 'Editar'}
            </button>
            <button onClick={onLogout} className="bg-red-500/10 text-red-500 p-2.5 rounded-md transition-colors duration-300 hover:bg-red-500 hover:text-white border border-red-500/20">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="bg-[#0d0d12]/50 border border-white/10 rounded-xl p-6 animate-in slide-in-from-bottom-4 shadow-xl">
            <div className="space-y-4">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white text-sm font-bold outline-none focus:border-cyan-500 transition-colors duration-300" placeholder="Seu Nome"/>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white text-sm resize-none outline-none focus:border-cyan-500 transition-colors duration-300" placeholder="Biografia ou frase de efeito..."></textarea>
            </div>
            <button type="submit" disabled={loading} className="mt-5 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white text-sm font-black px-8 py-3 rounded-md w-full flex justify-center hover:scale-[1.02] transition-transform duration-300 shadow-md">
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Salvar Informações'}
            </button>
          </form>
        ) : (
          <div>
            <div className="flex gap-3 border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide pb-2">
              <button onClick={() => setActiveTab("Estatisticas")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap text-sm duration-300 flex items-center gap-2 ${activeTab === "Estatisticas" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-400/80 hover:text-white border border-transparent'}`}><Compass className="w-4 h-4"/> Estatísticas</button>
              <button onClick={() => setActiveTab("Historico")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap text-sm duration-300 flex items-center gap-2 ${activeTab === "Historico" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-400/80 hover:text-white border border-transparent'}`}><History className="w-4 h-4"/> Histórico</button>
              <button onClick={() => setActiveTab("Biblioteca")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap text-sm duration-300 flex items-center gap-2 ${activeTab === "Biblioteca" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-400/80 hover:text-white border border-transparent'}`}><Library className="w-4 h-4"/> Lista Lida</button>
              <button onClick={() => setActiveTab("Configuracoes")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap text-sm duration-300 flex items-center gap-2 ${activeTab === "Configuracoes" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-400/80 hover:text-white border border-transparent'}`}><Smartphone className="w-4 h-4"/> Confs</button>
            </div>
            
            {activeTab === "Estatisticas" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-black text-white mb-1">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500"/> : Object.keys(libraryData).length}</div>
                    <div className="text-[10px] text-gray-400/60 uppercase font-black tracking-widest">Obras Salvas</div>
                  </div>
                  <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-black text-fuchsia-400 mb-1">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-fuchsia-500"/> : historyData.length}</div>
                    <div className="text-[10px] text-gray-400/60 uppercase font-black tracking-widest">Capítulos Lidos</div>
                  </div>
                  <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-black text-emerald-400 mb-1">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500"/> : obrasLidasIds.length}</div>
                    <div className="text-[10px] text-gray-400/60 uppercase font-black tracking-widest">Obras Iniciadas</div>
                  </div>
                  <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl text-center shadow-sm">
                    <div className="text-3xl font-black text-yellow-400 mb-1">{!dataLoaded ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-500"/> : Object.values(libraryData).filter(s=>s==='Favoritos').length}</div>
                    <div className="text-[10px] text-gray-400/60 uppercase font-black tracking-widest">Favoritos</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Historico" && (
                <div className="animate-in fade-in duration-300">
                    {historyData.length === 0 ? (
                        <div className="text-center py-10 bg-[#0d0d12] rounded-xl border border-white/10">
                          <History className="w-10 h-10 mx-auto text-gray-400/60 mb-2"/>
                          <p className="text-gray-400/60 font-bold text-sm">Seu histórico de leitura está vazio.</p>
                        </div>
                    ) : (
                       <div className="flex flex-col gap-3">
                          {historyData.slice(0, 15).map(hist => {
                              const mg = mangas.find(m => m.id === hist.mangaId);
                              return (
                                  <div key={hist.id} onClick={() => { if(mg) onNavigate('details', mg); }} className="bg-[#0d0d12] border border-white/10 p-3 rounded-xl flex items-center gap-4 cursor-pointer hover:border-cyan-500 transition-colors duration-300">
                                      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-[#050508] border border-white/10">
                                          {mg ? <img src={mg.coverUrl} className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6 m-auto mt-4 text-gray-400/60"/>}
                                      </div>
                                      <div className="flex-1">
                                          <h4 className="font-bold text-white text-sm line-clamp-1">{hist.mangaTitle}</h4>
                                          <p className="text-fuchsia-400 text-xs font-black mt-0.5">Cap. {hist.chapterNumber}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[10px] text-gray-400/60 font-bold uppercase">{new Date(hist.timestamp).toLocaleDateString()}</p>
                                          <p className="text-xs text-gray-500">{new Date(hist.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                      </div>
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
                        <div className="text-center py-10 bg-[#0d0d12] rounded-xl border border-white/10">
                          <Library className="w-10 h-10 mx-auto text-gray-400/60 mb-2"/>
                          <p className="text-gray-400/60 font-bold text-sm">Sua biblioteca está vazia.</p>
                        </div>
                    ) : (
                       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                           {libraryMangas.map(manga => {
                               const status = libraryData[manga.id];
                               let statusColor = "bg-gray-600";
                               if(status === 'Lendo') statusColor = "bg-cyan-600";
                               if(status === 'Favoritos') statusColor = "bg-yellow-500 text-black";
                               if(status === 'Finalizado') statusColor = "bg-emerald-600";
                               
                               return (
                                   <div key={manga.id} onClick={() => onNavigate('details', manga)} className="cursor-pointer group relative">
                                       <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 shadow-sm mb-1 bg-[#050508]">
                                           <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                           <div className={`absolute top-0 right-0 ${statusColor} text-[8px] font-black px-1.5 py-0.5 rounded-bl-md shadow`}>{status}</div>
                                       </div>
                                       <h3 className="font-bold text-xs text-gray-200 line-clamp-1 group-hover:text-cyan-400">{manga.title}</h3>
                                   </div>
                               )
                           })}
                       </div>
                    )}
                </div>
            )}
            
            {activeTab === "Configuracoes" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#0d0d12] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                    {userSettings.theme === 'OLED' ? <Moon className="w-5 h-5 text-gray-500"/> : <Sun className="w-5 h-5 text-yellow-500"/>} Tema do Site
                  </h4>
                  <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
                    <button onClick={() => updateSettings({ theme: 'Escuro' })} className={`flex-1 px-4 py-2 rounded text-xs font-bold transition-all duration-300 ${userSettings.theme === 'Escuro' || !userSettings.theme ? 'bg-[#0d0d12] text-white shadow-sm' : 'text-gray-400/60 hover:text-white'}`}>Escuro</button>
                    <button onClick={() => updateSettings({ theme: 'OLED' })} className={`flex-1 px-4 py-2 rounded text-xs font-bold transition-all duration-300 ${userSettings.theme === 'OLED' ? 'bg-black text-white shadow-sm' : 'text-gray-400/60 hover:text-white'}`}>OLED</button>
                    <button onClick={() => updateSettings({ theme: 'Drácula' })} className={`flex-1 px-4 py-2 rounded text-xs font-bold transition-all duration-300 ${userSettings.theme === 'Drácula' ? 'bg-[#1e1e2e] text-[#cdd6f4] shadow-sm' : 'text-gray-400/60 hover:text-white'}`}>Drácula</button>
                  </div>
                </div>

                <div className="bg-[#0d0d12] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h4 className="font-bold text-white flex items-center gap-2 text-sm"><BookOpen className="w-5 h-5 text-cyan-400"/> Formato de Leitura</h4>
                  <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
                    <button onClick={() => updateSettings({ readMode: 'Cascata' })} className={`flex-1 px-4 py-2 rounded text-xs font-bold transition-all duration-300 ${userSettings.readMode === 'Cascata' ? 'bg-[#0d0d12] text-white shadow-sm' : 'text-gray-400/60 hover:text-white'}`}>Modo Cascata</button>
                    <button onClick={() => updateSettings({ readMode: 'Páginas' })} className={`flex-1 px-4 py-2 rounded text-xs font-bold transition-all duration-300 ${userSettings.readMode === 'Páginas' ? 'bg-[#0d0d12] text-white shadow-sm' : 'text-gray-400/60 hover:text-white'}`}>Páginas (Slide)</button>
                  </div>
                </div>

                <div className="bg-[#0d0d12] border border-white/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                      <h4 className="font-bold text-white flex items-center gap-2 text-sm"><Smartphone className="w-5 h-5 text-blue-500"/> Economia de Dados</h4>
                      <p className="text-xs text-gray-400/60 mt-1">Borra imagens para economizar dados</p>
                  </div>
                  <button onClick={() => updateSettings({ dataSaver: !userSettings.dataSaver })} className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${userSettings.dataSaver ? 'bg-cyan-500' : 'bg-[#050508] border border-white/10'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow ${userSettings.dataSaver ? 'left-7' : 'left-1'}`}></div>
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
