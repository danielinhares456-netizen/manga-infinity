import React, { useState, useEffect } from 'react';
import { Target, Hexagon, ShoppingCart, Trophy, Check, Compass, Timer, Star, Skull, Zap, Clock, Crown, Key, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { doc, updateDoc, collectionGroup, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from './firebase';
import { addXpLogic, removeXpLogic, getLevelTitle, getRarityColor } from './helpers';
import { APP_ID } from './constants';

export function NexoView({ user, userProfileData, showToast, mangas, onNavigate, onLevelUp, synthesizeCrystal, shopItems, buyItem, equipItem }) {
    const [activeTab, setActiveTab] = useState("Missões");
    const [enigmaAnswer, setEnigmaAnswer] = useState("");
    const [timeLeft, setTimeLeft] = useState("");
    const [confirmModal, setConfirmModal] = useState(null); 
    const [isForgingMission, setIsForgingMission] = useState(false);
    const [synthesizing, setSynthesizing] = useState(false);
    const [rankingList, setRankingList] = useState([]);
    const [loadingRank, setLoadingRank] = useState(false);

    const rankConfigs = {
        'Rank E': { rxp: 30, rcoin: 15, pxp: 15, pcoin: 10, time: 15, charLimit: 300, enigmaTries: 3 },
        'Rank C': { rxp: 100, rcoin: 50, pxp: 50, pcoin: 25, time: 10, charLimit: 200, enigmaTries: 3 },
        'Rank B': { rxp: 150, rcoin: 80, pxp: 80, pcoin: 40, time: 8, charLimit: 120, enigmaTries: 2 },
        'Rank A': { rxp: 300, rcoin: 150, pxp: 150, pcoin: 80, time: 5, charLimit: 80, enigmaTries: 2 },
        'Rank S': { rxp: 800, rcoin: 400, pxp: 400, pcoin: 200, time: 3, charLimit: 60, enigmaTries: 1 },
        'Rank SSS':{ rxp: 2000, rcoin: 1000, pxp: 1000, pcoin: 500, time: 1, charLimit: 40, enigmaTries: 1 }
    };

    useEffect(() => { if(activeTab === 'Ranking') fetchRanking(); }, [activeTab]);

    const fetchRanking = async () => {
        setLoadingRank(true);
        try {
            const q = query(collectionGroup(db, 'profile'), orderBy('level', 'desc'), orderBy('xp', 'desc'), limit(50));
            const snap = await getDocs(q);
            let rankData = [];
            snap.forEach(d => { if(d.id === 'main') rankData.push({ id: d.ref.parent.parent.id, ...d.data() }); });
            setRankingList(rankData);
        } catch (e) { showToast("Erro na Hierarquia Abissal.", "error"); } finally { setLoadingRank(false); }
    };

    useEffect(() => {
        if (!userProfileData.activeMission) return;
        const updateTimer = () => {
            const diff = userProfileData.activeMission.deadline - Date.now();
            if (diff <= 0) setTimeLeft("Expirado");
            else {
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [userProfileData.activeMission]);

    const triggerForgeMission = (difficulty) => { setConfirmModal(null); setIsForgingMission(true); setTimeout(() => generateMission(difficulty), 2500); };

    const generateMission = async (difficulty) => {
        try {
            const now = Date.now();
            const conf = rankConfigs[difficulty];
            const randomManga = mangas[Math.floor(Math.random() * mangas.length)];
            const newMission = { id: Date.now().toString(), type: 'read', difficulty, title: `Exploração`, desc: `Leia capítulos de ${randomManga.title}`, targetManga: randomManga.id, rewardXp: conf.rxp, rewardCoins: conf.rcoin, deadline: now + (conf.time * 60 * 1000) };
            await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { activeMission: newMission });
            showToast("Contrato Assinado!", "success");
        } catch(e) { showToast("Falha no Nexo.", "error"); } finally { setIsForgingMission(false); }
    };

    const handleEnigmaSubmit = async (e) => {
        e.preventDefault();
        const m = userProfileData.activeMission;
        if (enigmaAnswer.toLowerCase().trim() === m.answer[0]) {
           let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp, userProfileData.level, m.rewardXp);
           await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { coins: increment(m.rewardCoins), xp: newXp, level: newLvl, activeMission: null });
           showToast("Decifrado!", "success");
           if(didLevelUp) onLevelUp(newLvl);
        } else { showToast("Incorreto.", "error"); }
        setEnigmaAnswer('');
    };

    const runSynthesis = async () => {
        setSynthesizing(true);
        setTimeout(async () => {
          const res = await synthesizeCrystal();
          setSynthesizing(false);
          if (res?.success) showToast("Síntese Concluída!", 'success');
          else showToast("Falha na Síntese.", 'error');
        }, 1500);
    };

    const eq = userProfileData.equipped_items || {};
    const dynamicStyles = Object.values(eq).filter(Boolean).map(item => `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`).join('\n');

    return (
        <div className={`max-w-4xl mx-auto px-4 py-6 text-gray-300 min-h-screen ${eq.tema_perfil ? eq.tema_perfil.cssClass : 'bg-[#020205]'}`}>
            {dynamicStyles && <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />}
            {confirmModal && (
                <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#050508] border border-blue-900/40 p-6 rounded-3xl text-center">
                        <Target className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-lg font-black text-white mb-2 uppercase">Assinar Contrato?</h3>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 bg-black border border-blue-900/30 text-gray-400 py-3 rounded-xl uppercase text-xs">Recusar</button>
                            <button onClick={() => triggerForgeMission(confirmModal)} className="flex-1 bg-gradient-to-r from-blue-800 to-amber-600 text-white py-3 rounded-xl uppercase text-xs">Assinar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex gap-2.5 border-b border-blue-900/20 mb-6 overflow-x-auto pb-2">
                <button onClick={() => setActiveTab("Missões")} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${activeTab === "Missões" ? 'bg-blue-950/40 text-blue-400 border border-blue-900/50' : 'bg-black text-blue-900/60'}`}><Target className="w-4 h-4"/> Contratos</button>
                <button onClick={() => setActiveTab("Forja")} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${activeTab === "Forja" ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-black text-blue-900/60'}`}><Hexagon className="w-4 h-4"/> Forja</button>
                <button onClick={() => setActiveTab("Loja")} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${activeTab === "Loja" ? 'bg-red-950/40 text-red-500 border border-red-900/50' : 'bg-black text-blue-900/60'}`}><ShoppingCart className="w-4 h-4"/> Loja</button>
                <button onClick={() => setActiveTab("Ranking")} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${activeTab === "Ranking" ? 'bg-blue-950/40 text-blue-400 border border-blue-900/50' : 'bg-black text-blue-900/60'}`}><Trophy className="w-4 h-4"/> Hierarquia</button>
            </div>
            {activeTab === "Ranking" && (
                <div className="animate-in fade-in duration-500 space-y-4">
                    {loadingRank ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/> : (
                        rankingList.map((player, index) => (
                            <div key={player.id} className={`bg-[#050508] border ${index < 3 ? 'border-amber-500/30' : 'border-blue-900/20'} p-4 rounded-2xl flex items-center gap-4`}>
                                <span className="font-black text-blue-900/40">#{index+1}</span>
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                    <img src={player.avatarUrl || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm">{player.displayName || "Viajante"}</h4>
                                    <p className="text-[10px] text-amber-500 font-black uppercase">Nível {player.level}</p>
                                </div>
                                <div className="text-right text-[10px] font-bold text-gray-500">{player.xp} XP</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
