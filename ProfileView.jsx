import React, { useState, useEffect, useRef } from 'react';
import { Compass, History, Library, Smartphone, Moon, Sun, Camera, Edit3, LogOut, Loader2, UserCircle, BookOpen, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { updateProfile } from "firebase/auth";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from './firebase';
import { APP_ID } from './constants';
import { compressImage, getLevelRequirement, getLevelTitle } from './helpers';

export function ProfileView({ user, userProfileData, historyData, libraryData, dataLoaded, userSettings, updateSettings, onLogout, onUpdateData, showToast, mangas, onNavigate }) {
  const [activeTab, setActiveTab] = useState("Estatisticas"); 
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.displayName || '');
  const [bio, setBio] = useState(userProfileData.bio || '');
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const avatarInputRef = useRef(null);

  const level = userProfileData.level || 1;
  const currentXp = userProfileData.xp || 0;
  const xpNeeded = getLevelRequirement(level);
  const progressPercent = Math.min(100, (currentXp / xpNeeded) * 100);
  const eq = userProfileData.equipped_items || {};
  const dynamicStyles = Object.values(eq).filter(Boolean).map(item => `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`).join('\n');

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      const docData = { bio: bio };
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), docData, { merge: true });
      onUpdateData(docData);
      showToast('Registro salvo no Abismo!', 'success'); setIsEditing(false);
    } catch (error) { showToast(`Erro ao gravar.`, 'error'); } finally { setLoading(false); }
  };

  return (
    <div className={`animate-in fade-in duration-500 w-full pb-20 font-sans min-h-screen text-gray-300 ${eq.tema_perfil ? eq.tema_perfil.cssClass : 'bg-[#020205]'}`}>
      {dynamicStyles && <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />}
      <div className="h-40 md:h-64 w-full bg-[#020205] relative group border-b border-blue-900/20 overflow-hidden">
        {eq.capa_fundo ? <img src={eq.capa_fundo.preview} className={`w-full h-full object-cover opacity-90 ${eq.capa_fundo.cssClass}`} /> : <div className="w-full h-full bg-gradient-to-tr from-[#020205] to-[#050508]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent" />
      </div>
      <div className="max-w-4xl mx-auto px-4 relative -mt-16 z-10">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="relative group w-28 h-28 md:w-36 md:h-36 flex-shrink-0 flex items-center justify-center">
            {eq.particulas && <img src={eq.particulas.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] pointer-events-none z-0 ${eq.particulas.cssClass}`} />}
            <div className={`w-full h-full rounded-full bg-black flex items-center justify-center relative z-10 overflow-hidden ${eq.moldura ? '' : 'border-4 border-[#020205]'}`}>
               <img src={eq.avatar ? eq.avatar.preview : (userProfileData.avatarUrl || user.photoURL || 'https://placehold.co/150')} className={`w-full h-full object-cover ${eq.avatar?.cssClass || ''}`} />
            </div>
            {eq.efeito && <img src={eq.efeito.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${eq.efeito.cssClass}`} />}
            {eq.moldura && <img src={eq.moldura.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-none pointer-events-none z-30 ${eq.moldura.cssClass}`} />}
            {eq.badge && <img src={eq.badge.preview} className={`absolute -bottom-2 -right-2 w-8 h-8 z-40 ${eq.badge.cssClass}`} />}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className={`text-2xl md:text-4xl font-black ${eq.nickname ? eq.nickname.cssClass : 'text-blue-50'}`}>{user.displayName || 'Entidade'}</h1>
            <div className="w-full max-w-sm mx-auto md:mx-0 bg-[#050508]/80 p-4 rounded-xl border border-blue-900/20 mt-3">
              <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span className="text-blue-500">Nível {level} - {getLevelTitle(level)}</span><span className="text-blue-400/60">{currentXp} / {xpNeeded} XP</span></div>
              <div className="w-full bg-[#020205] rounded-full h-2 overflow-hidden border border-blue-900/30"><div className="bg-gradient-to-r from-blue-800 to-amber-500 h-full transition-all duration-1000" style={{width: `${progressPercent}%`}}></div></div>
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="bg-black text-blue-200 px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-black border border-blue-900/30"><Edit3 className="w-4 h-4" /> {isEditing ? 'Cancelar' : 'Editar'}</button>
        </div>
      </div>
    </div>
  );
}
