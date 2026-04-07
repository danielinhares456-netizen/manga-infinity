import React, { useState, useEffect } from 'react';
import { Target, Hexagon, ShoppingCart, Trophy, Check, Compass, Timer, Star, Skull, Zap, Clock, Crown, Key, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { doc, updateDoc, collectionGroup, getDocs } from "firebase/firestore";
import { db } from './firebase';
import { addXpLogic, removeXpLogic, getLevelTitle, getRarityColor } from './helpers';
import { APP_ID } from './constants';

export function NexoView({ user, userProfileData, showToast, mangas, onNavigate, onLevelUp, synthesizeCrystal, shopItems, buyItem }) {
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

    useEffect(() => {
        if(activeTab === 'Ranking') fetchRanking();
    }, [activeTab]);

    const fetchRanking = async () => {
        setLoadingRank(true);
        try {
            const snap = await getDocs(collectionGroup(db, 'profile'));
            let rankData = [];
            snap.forEach(doc => {
                if(doc.ref.path.includes('main') && (doc.data().xp > 0 || doc.data().name)) { 
                   rankData.push({ id: doc.ref.parent.parent.id, ...doc.data() });
                }
            });
            rankData.sort((a, b) => (b.level || 1) - (a.level || 1) || (b.xp || 0) - (a.xp || 0));
            setRankingList(rankData.slice(0, 50));
        } catch (e) {
            showToast("Erro na Hierarquia. Verifique regras do Firebase.", "error");
        } finally {
            setLoadingRank(false);
        }
    };

    useEffect(() => {
        if (!userProfileData.activeMission) return;
        const updateTimer = () => {
            const diff = userProfileData.activeMission.deadline - Date.now();
            if (diff <= 0) { setTimeLeft("Expirado"); } else {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${d > 0 ? d+'d ' : ''}${h > 0 || d > 0 ? h+'h ' : ''}${m}m ${s}s`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [userProfileData.activeMission]);

    const triggerForgeMission = async (difficulty) => {
        setConfirmModal(null); setIsForgingMission(true);
        setTimeout(() => { generateMission(difficulty); }, 2500); 
    };

    const generateMission = async (difficulty) => {
        try {
            const now = Date.now();
            let completed = userProfileData.completedMissions || [];
            let newMission = null;
            const conf = rankConfigs[difficulty];

            const missionPool = ['read', 'search_visual', 'enigma'];
            const chosenType = missionPool[Math.floor(Math.random() * missionPool.length)];

            if (mangas.length > 0) {
                const randomManga = mangas[Math.floor(Math.random() * mangas.length)];

                if (chosenType === 'search_visual' && randomManga.synopsis && randomManga.synopsis.length > 30) {
                    let cleanDesc = randomManga.synopsis.replace(/<[^>]*>?/gm, '').replace(new RegExp(randomManga.title, 'gi'), '█████');
                    let genres = randomManga.genres ? randomManga.genres.join(', ') : 'Desconhecidos';
                    let q = `[ECO DO VAZIO]\n\nGêneros: ${genres}\n\nFragmento:\n"${cleanDesc.substring(0, conf.charLimit)}..."\n\nRastreie esta obra no catálogo e acesse a página dela para concluir o contrato.`;
                    
                    newMission = { id: Date.now().toString(), type: 'search_local', difficulty, title: "Caçada Abissal", question: q, targetManga: randomManga.id, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.time * 60 * 1000) };
                
                } else if (chosenType === 'enigma') {
                    let q = `[MISTÉRIO DO ABISMO]\n\nAnalisando fragmentos da Biblioteca...\n`;
                    if (randomManga.author) q += `• Autoria rastreada: ${randomManga.author}\n`;
                    if (randomManga.genres && randomManga.genres.length > 0) q += `• Gêneros: ${randomManga.genres.slice(0,3).join(', ')}\n`;
                    q += `\nQual é o nome exato desta obra gravada no Infinito?`;
                    newMission = { id: Date.now().toString(), type: 'enigma', difficulty, title: "Enigma do Vazio", question: q, answer: [randomManga.title.toLowerCase().trim()], attemptsLeft: conf.enigmaTries, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.time * 60 * 1000) };
                
                } else {
                    let readTarget = difficulty === 'Rank E' ? 1 : difficulty === 'Rank C' ? 2 : difficulty === 'Rank B' ? 3 : difficulty === 'Rank A' ? 5 : difficulty === 'Rank S' ? 10 : 20;
                    if(randomManga.chapters && randomManga.chapters.length < readTarget) readTarget = randomManga.chapters.length || 1;
                    newMission = { id: Date.now().toString(), type: 'read', difficulty, title: `Exploração do Abismo`, desc: `Leia ${readTarget} capítulo(s) da obra "${randomManga.title}".`, targetManga: randomManga.id, targetCount: readTarget, currentCount: 0, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (readTarget * 45 * 60 * 1000) };
                }
            }

            if (newMission) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { activeMission: newMission, completedMissions: completed });
                showToast(`Contrato do Abismo Assinado!`, "success");
            } else {
                showToast("O Abismo está vazio de contratos no momento.", "error");
            }
        } catch(e) { showToast("Falha na Matrix do Nexo.", "error"); } finally { setIsForgingMission(false); }
    };
    
    const handleEnigmaSubmit = async (e) => {
        e.preventDefault(); const m = userProfileData.activeMission;
        if (!m || m.type !== 'enigma') return;
        if (!enigmaAnswer.trim()) return showToast("A resposta não pode ser vazia.", "warning");
        const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
        const userAnswer = enigmaAnswer.toLowerCase().trim();
        const isCorrect = m.answer.some(ans => { const correctAns = ans.toLowerCase().trim(); return userAnswer === correctAns || (userAnswer.length >= 3 && (correctAns.includes(userAnswer) || userAnswer.includes(correctAns))); });
        
        if (isCorrect) {
           let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
           let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
           await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
           setEnigmaAnswer(''); showToast(`Decifrado! +${m.rewardXp} XP / +${m.rewardCoins} M.`, "success");
           if(didLevelUp) onLevelUp(newLvl); 
        } else {
           const attempts = m.attemptsLeft - 1;
           if (attempts <= 0) {
               let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
               let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
               await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
               showToast(`Falhou! Punição do Abismo aplicada.`, "error");
           } else {
               await updateDoc(profileRef, { 'activeMission.attemptsLeft': attempts }); showToast(`Incorreto. ${attempts} vida(s) restante(s).`, "error");
           }
           setEnigmaAnswer('');
        }
    };
    
    const cancelMission = async () => {
        const m = userProfileData.activeMission; if(!m) return;
        const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
        let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
        let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
        await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
        showToast(`Desistência punida: -${m.penaltyXp}XP / -${m.penaltyCoins} M.`, "error");
    };

    const runSynthesis = async () => {
        if ((userProfileData.crystals || 0) < 5) { showToast("Cristais insuficientes (Custa 5).", "error"); return; }
        setSynthesizing(true);
        setTimeout(async () => {
          const res = await synthesizeCrystal(); setSynthesizing(false);
          if (res && res.success) showToast(`Síntese Concluída! +${res.wonCoins} M | +${res.wonXp} XP`, 'success');
          else showToast(`Falha! Cristais destruídos no Vácuo.`, 'error');
        }, 1500);
    };

    // Loja Injection
    const handleEquipCosmetic = async (item) => {
        const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
        const equipped = userProfileData.equipped_items || {};
        const isEquipped = equipped[item.categoria]?.id === item.id;
        
        let newEquipped = { ...equipped };
        if (isEquipped) delete newEquipped[item.categoria];
        else newEquipped[item.categoria] = item; 
        
        try {
            await updateDoc(profileRef, { equipped_items: newEquipped });
            showToast(isEquipped ? 'Aura Ocultada' : 'Aura Manifestada!', 'success');
        } catch (e) {
            showToast('Erro ao equipar', 'error');
        }
    };

    const RANK_CARDS = [
        { id: 'Rank E', color: 'text-gray-400', border: 'border-gray-500/20', hover: 'hover:border-gray-500/50', btn: 'bg-gray-800 hover:bg-gray-700' },
        { id: 'Rank C', color: 'text-amber-500', border: 'border-amber-500/20', hover: 'hover:border-amber-500/50', btn: 'bg-amber-700 hover:bg-amber-600' },
        { id: 'Rank B', color: 'text-orange-500', border: 'border-orange-500/20', hover: 'hover:border-orange-500/50', btn: 'bg-orange-700 hover:bg-orange-600' },
        { id: 'Rank A', color: 'text-yellow-400', border: 'border-yellow-500/20', hover: 'hover:border-yellow-500/50', btn: 'bg-yellow-600 hover:bg-yellow-500' },
    ];

    const equipped = userProfileData.equipped_items || {};

    return (
        <div className={`max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-500 relative pb-24 font-sans text-gray-300 min-h-screen ${equipped.tema_perfil ? equipped.tema_perfil.cssClass : 'bg-[#020202]'}`}>
            
            {/* CSS LOJA INJECTION */}
            {Object.values(equipped).map(item => item && (
                <style key={item.id} dangerouslySetInnerHTML={{__html: `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`}} />
            ))}

            {isForgingMission && (
                <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300 w-full">
                    <style>{`@keyframes spin-slow { 100% { transform: rotate(360deg); } }`}</style>
                    <div className="relative w-48 h-48 flex items-center justify-center"><div className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-black to-yellow-600 rounded-full blur-[45px] animate-pulse opacity-60"></div><div className="absolute inset-4 border-[2px] border-amber-900/40 border-dashed rounded-full animate-[spin_4s_linear_infinite]"></div><div className="absolute inset-8 border-[3px] border-t-amber-500 border-b-yellow-600 border-l-transparent border-r-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div><div className="absolute inset-12 bg-[#020202]/80 backdrop-blur-md rounded-full shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-center"><Zap className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse" /></div></div>
                    <h2 className="mt-12 text-lg md:text-xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-white to-yellow-500 tracking-[0.5em] md:tracking-[0.6em] animate-pulse uppercase">Forjando Contrato...</h2>
                </div>
            )}
            {confirmModal && (
                <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setConfirmModal(null)}>
                    <div className="bg-[#050402] border border-amber-900/40 p-6 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] max-w-sm w-full text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                        <Target className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-widest">Assinar Contrato?</h3>
                        <p className="text-xs text-amber-200/60 font-medium mb-6 px-2">Ao aceitar uma missão de <b>{confirmModal}</b>, o Abismo exigirá uma punição de XP e Moedas caso você falhe no tempo.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 bg-black border border-amber-900/30 text-gray-400 font-bold py-3.5 rounded-xl hover:text-white transition-colors text-xs duration-300 uppercase tracking-widest">Recusar</button>
                            <button onClick={() => triggerForgeMission(confirmModal)} className="flex-1 bg-gradient-to-r from-amber-800 to-yellow-600 text-white font-black py-3.5 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)] text-xs duration-300 uppercase tracking-widest">Assinar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2.5 border-b border-amber-900/20 mb-6 overflow-x-auto scrollbar-hide pb-2 relative z-20">
                <button onClick={() => setActiveTab("Missões")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Missões" ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50 shadow-inner' : 'bg-black text-amber-900/60 hover:text-amber-200 border border-transparent shadow-sm'}`}><Target className="w-4 h-4"/> Contratos</button>
                <button onClick={() => setActiveTab("Forja")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Forja" ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/50 shadow-inner' : 'bg-black text-amber-900/60 hover:text-amber-200 border border-transparent shadow-sm'}`}><Hexagon className="w-4 h-4"/> Fornalha Cósmica</button>
                <button onClick={() => setActiveTab("Loja")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Loja" ? 'bg-orange-950/40 text-orange-500 border border-orange-900/50 shadow-inner' : 'bg-black text-amber-900/60 hover:text-amber-200 border border-transparent shadow-sm'}`}><ShoppingCart className="w-4 h-4"/> Mercado Astral</button>
                <button onClick={() => setActiveTab("Ranking")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Ranking" ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50 shadow-inner' : 'bg-black text-amber-900/60 hover:text-amber-200 border border-transparent shadow-sm'}`}><Trophy className="w-4 h-4"/> Hierarquia</button>
            </div>

            {activeTab === "Missões" && (
                <div className="animate-in fade-in duration-300">
                    {userProfileData.activeMission ? (
                        <div className="bg-[#050402] border border-amber-900/30 p-5 sm:p-6 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.05)] mb-6 animate-in zoom-in-95 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-800 via-yellow-500 to-orange-600"></div>
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="text-xl font-black text-white leading-tight tracking-tight uppercase">{userProfileData.activeMission.title}</h3>
                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border shadow-sm w-max ${userProfileData.activeMission.difficulty.includes('S') ? 'bg-amber-950/50 text-amber-500 border-amber-500/50' : 'bg-yellow-950/50 text-yellow-400 border-yellow-500/50'}`}>
                                    {userProfileData.activeMission.difficulty}
                                </span>
                            </div>
                            <div className="mb-6">
                                {userProfileData.activeMission.type === 'search_local' ? (
                                    <div className="bg-black p-5 rounded-2xl border border-amber-900/20 relative shadow-inner">
                                        <div className="flex items-center gap-2.5 mb-4 text-amber-500"><Compass className="w-5 h-5"/><span className="font-black text-[10px] uppercase tracking-widest">Caçada Visual</span></div>
                                        <p className="text-xs font-medium text-gray-300 mb-5 leading-relaxed whitespace-pre-wrap border-l-2 border-amber-600/50 pl-4">{userProfileData.activeMission.question}</p>
                                    </div>
                                ) : userProfileData.activeMission.type === 'enigma' ? (
                                    <div className="bg-black p-5 rounded-2xl border border-amber-900/20 relative shadow-inner">
                                        <div className="flex items-center gap-2.5 mb-4 text-amber-500"><Zap className="w-5 h-5"/><span className="font-black text-[10px] uppercase tracking-widest">Oráculo do Abismo</span></div>
                                        <p className="text-xs font-medium text-gray-300 mb-5 leading-relaxed whitespace-pre-wrap border-l-2 border-amber-600/50 pl-4">{userProfileData.activeMission.question}</p>
                                        <form onSubmit={handleEnigmaSubmit} className="flex flex-col sm:flex-row gap-3 relative z-10">
                                            <div className="relative flex-1"><Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" /><input type="text" value={enigmaAnswer} onChange={e=>setEnigmaAnswer(e.target.value)} placeholder="Digite o eco exato da obra..." className="w-full bg-[#020202] border border-amber-900/30 rounded-xl pl-11 pr-4 py-3.5 text-white outline-none focus:border-amber-600/50 transition-colors duration-300 font-bold text-xs shadow-inner" /></div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-gradient-to-r from-amber-800 to-yellow-600 text-white font-black px-6 py-3.5 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md duration-300">Decifrar <Check className="w-4 h-4"/></button>
                                                <div className="bg-[#020202] px-4 py-3.5 rounded-xl border border-amber-900/30 text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner">Vidas: <span className={userProfileData.activeMission.attemptsLeft === 1 ? 'text-red-500' : 'text-white'}>{userProfileData.activeMission.attemptsLeft}</span></div>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="bg-black p-5 rounded-2xl border border-amber-900/20 shadow-inner">
                                        <div className="flex justify-between items-end mb-3"><span className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-amber-600"/> Progresso do Contrato</span><span className="text-xl font-black text-white tracking-tighter">{userProfileData.activeMission.currentCount} <span className="text-gray-600 text-xs">/ {userProfileData.activeMission.targetCount}</span></span></div>
                                        <div className="w-full bg-[#020202] rounded-full h-2 overflow-hidden border border-amber-900/30 shadow-inner"><div className="bg-gradient-to-r from-amber-800 to-yellow-500 h-full rounded-full transition-all duration-500 relative" style={{width: `${(userProfileData.activeMission.currentCount / userProfileData.activeMission.targetCount) * 100}%`}}><div className='absolute inset-0 bg-white/20 animate-pulse'></div></div></div>
                                        <p className="mt-4 text-[11px] text-amber-200/60 font-medium text-center italic">{userProfileData.activeMission.desc}</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-black p-5 rounded-2xl border border-amber-900/20 shadow-inner">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="text-[10px] text-amber-900/60 font-black uppercase tracking-widest mr-1">Recompensas:</span>
                                        <span className="text-xs font-black text-white bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-900/30 shadow">+{userProfileData.activeMission.rewardXp} XP</span>
                                        <span className="text-xs font-black text-amber-500 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-900/30 shadow">+{userProfileData.activeMission.rewardCoins} M</span>
                                    </div>
                                    <div className="flex w-max mx-auto sm:mx-0 items-center gap-2 text-amber-500 bg-amber-950/20 px-4 py-2 rounded-full border border-amber-900/30 shadow"><Timer className="w-4 h-4 animate-pulse"/><span className="font-black text-xs tracking-wider">{timeLeft}</span></div>
                                </div>
                                <div className="w-full h-[1px] bg-amber-900/20 my-3"></div>
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:items-center justify-between">
                                    <span className="text-[10px] text-amber-900/80 font-bold uppercase tracking-wider text-center sm:text-left">Punição: -{userProfileData.activeMission.penaltyXp}XP / -{userProfileData.activeMission.penaltyCoins} M</span>
                                    <button onClick={cancelMission} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white bg-red-950/20 hover:bg-red-800 px-5 py-2.5 rounded-xl transition-all border border-red-900/50 shadow duration-300 w-full sm:w-auto">Quebrar Contrato</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1">
                                {RANK_CARDS.map(rank => {
                                    const conf = rankConfigs[rank.id];
                                    return (
                                    <div key={rank.id} className={`bg-[#050402] border ${rank.border} ${rank.hover} transition-all duration-300 p-6 rounded-3xl flex flex-col group shadow-md hover:shadow-[0_0_30px_rgba(245,158,11,0.05)]`}>
                                        <div className="flex justify-between items-center mb-5"><div className={`${rank.color} font-black text-2xl group-hover:scale-105 transition-transform origin-left uppercase tracking-tight`}>{rank.id}</div><div className="text-[10px] font-black text-gray-600 text-right uppercase tracking-widest flex flex-col items-end gap-1"><span>+{conf.rxp}XP</span><span>+{conf.rcoin}M</span></div></div>
                                        <div className="flex flex-col gap-2 mb-6 mt-2 bg-black p-4 rounded-2xl border border-amber-900/20 shadow-inner">
                                            <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-2 font-black tracking-widest uppercase text-[9px]"><Target className="w-3.5 h-3.5 text-amber-900/60"/> Mistérios Ocultos</span><span className="font-bold text-gray-300 text-[10px] uppercase">Aleatório</span></div>
                                            <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-2 font-black tracking-widest uppercase text-[9px]"><Clock className="w-3.5 h-3.5 text-amber-900/60"/> Tempo Est.</span><span className="font-bold text-gray-300 text-[10px] uppercase">~ {conf.time} min</span></div>
                                        </div>
                                        <button onClick={() => setConfirmModal(rank.id)} className={`w-full ${rank.btn} text-white text-[10px] font-black py-4 rounded-xl transition-all mt-auto flex items-center justify-center gap-2 duration-300 uppercase tracking-widest shadow-lg group-hover:shadow-[0_0_20px_inherit]`}>Assinar Selo</button>
                                    </div>
                                    )
                                })}
                            </div>
                            <div className="bg-amber-950/10 border border-amber-900/30 hover:border-amber-600/50 transition-all duration-300 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md group">
                                <div><div className="text-amber-500 font-black text-2xl flex items-center gap-2 mb-1.5 uppercase group-hover:scale-105 transition-transform origin-left">Rank S <Star className="w-5 h-5 fill-current drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"/></div><div className="text-[10px] font-black text-gray-500 flex gap-3 uppercase tracking-widest"><span className="text-amber-400">+{rankConfigs['Rank S'].rxp}XP / +{rankConfigs['Rank S'].rcoin}M</span> <span>• Alta dificuldade</span></div></div>
                                <button onClick={() => setConfirmModal('Rank S')} className="w-full sm:w-auto bg-amber-800 hover:bg-amber-600 text-white text-[10px] font-black px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[150px] uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)]">Aceitar Selo</button>
                            </div>
                            <div className="bg-black border border-yellow-900/60 hover:border-yellow-500/70 transition-all duration-300 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-xl group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-900/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-yellow-600/20 transition-colors"></div>
                                <div className="relative z-10"><div className="text-yellow-600 font-black text-2xl flex items-center gap-2 mb-1.5 uppercase group-hover:scale-105 transition-transform origin-left">Rank SSS <Skull className="w-5 h-5 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]"/></div><div className="text-[10px] font-black text-gray-500 flex gap-3 uppercase tracking-widest"><span className="text-yellow-500">+{rankConfigs['Rank SSS'].rxp}XP / +{rankConfigs['Rank SSS'].rcoin}M</span> <span>• Extremo / Risco</span></div></div>
                                <button onClick={() => setConfirmModal('Rank SSS')} className="w-full sm:w-auto bg-yellow-950 border border-yellow-900 hover:bg-yellow-700 text-white text-[10px] font-black px-8 py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.5)] relative z-10 flex items-center justify-center min-w-[150px] uppercase tracking-widest">Desafiar Abismo</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "Forja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-[#050402] to-black border border-amber-900/20 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-transparent to-transparent opacity-50"></div>
                       <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 relative z-10">
                         <div className="text-center md:text-left"><h3 className="text-2xl font-black text-amber-500 mb-2 flex items-center gap-2.5 justify-center md:justify-start uppercase tracking-tight"><Hexagon className="w-6 h-6"/> Fornalha Cósmica</h3><p className="text-gray-400 text-xs font-medium max-w-sm tracking-wide">Use seus Cristais Cósmicos para sintetizar Moedas M e XP extra. A falha é um risco real.</p></div>
                         <div className="flex gap-3">
                            <div className="bg-black border border-amber-900/20 p-5 rounded-2xl text-center min-w-[100px] shadow-inner"><p className="text-3xl font-black text-yellow-500 tracking-tighter">{userProfileData.crystals || 0}</p><p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">Cristais</p></div>
                            <div className="bg-black border border-amber-900/20 p-5 rounded-2xl text-center min-w-[100px] shadow-inner"><p className="text-3xl font-black text-amber-500 tracking-tighter">{userProfileData.coins || 0}</p><p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">Moedas M</p></div>
                         </div>
                       </div>
                       <div className="bg-black border border-amber-900/20 p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center shadow-inner group">
                          <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 relative transition-all duration-1000 ${synthesizing ? 'scale-110' : ''}`}><div className={`absolute inset-0 rounded-full border-2 border-t-amber-600 border-r-yellow-600 border-b-transparent border-l-transparent ${synthesizing ? 'animate-[spin_0.5s_linear_infinite] opacity-100' : 'opacity-20'}`}></div><div className={`absolute inset-2 rounded-full border border-amber-600/20 ${synthesizing ? 'opacity-100' : 'opacity-40'}`}></div><Zap className={`w-12 h-12 ${synthesizing ? 'text-white animate-pulse drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]' : 'text-amber-500'}`} strokeWidth={1.5}/></div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Custo: 5 Cristais (40% de chance de falha).</p>
                          <button onClick={runSynthesis} disabled={synthesizing || (userProfileData.crystals || 0) < 5} className="w-full sm:w-64 bg-gradient-to-r from-amber-800 to-yellow-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:from-gray-900 disabled:to-gray-900 disabled:opacity-50 disabled:hover:scale-100 text-[10px] uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(245,158,11,0.3)] duration-300">{synthesizing ? 'SINTETIZANDO...' : 'SINTETIZAR (-5)'}</button>
                       </div>
                    </div>
                </div>
            )}

            {activeTab === "Loja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-[#020202] border border-amber-900/20 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-900/10 blur-[80px] pointer-events-none"></div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8 relative z-10">
                        <div><h3 className="text-2xl font-black text-amber-500 mb-1.5 flex items-center gap-2.5 uppercase tracking-tight"><ShoppingCart className="w-6 h-6"/> Mercado Astral</h3><p className="text-gray-400 text-xs tracking-wide">Troque suas moedas por artefatos de personalização da Alma.</p></div>
                        <div className="bg-amber-950/30 border border-amber-500/20 text-amber-400 font-black px-6 py-3 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center text-sm shadow-inner">{userProfileData.coins || 0} M</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 relative z-10">
                        {shopItems.map(item => {
                          const hasItem = userProfileData.inventory?.includes(item.id);
                          const isEquipped = userProfileData.equipped_items?.[item.categoria]?.id === item.id;
                          return (
                            <div key={item.id} className={`bg-black border p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 shadow-inner group ${isEquipped ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-amber-900/20 hover:border-yellow-900/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]'}`}>
                              <div className={`w-20 h-20 rounded-xl mb-4 bg-[#020202] flex items-center justify-center overflow-hidden shadow-inner border border-white/5 relative`}>
                                {/* INJEÇÃO CSS PARA O PREVIEW DA LOJA */}
                                {item && <style dangerouslySetInnerHTML={{__html: `.${item.cssClass}-preview { ${item.css || ''} } ${item.animacao || ''}`}} />}
                                
                                {item.preview ? <img src={item.preview} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${item.cssClass}-preview`} /> : <Sparkles className="w-8 h-8 text-amber-400"/>}
                              </div>
                              <h4 className="text-white font-bold mb-1.5 text-sm line-clamp-1 group-hover:text-yellow-400 transition-colors">{item.nome || item.name}</h4>
                              <p className={`text-[9px] uppercase tracking-widest font-black mb-5 ${getRarityColor(item.raridade)}`}>{item.categoria || item.type}</p>
                              {hasItem ? (
                                <button onClick={() => handleEquipCosmetic(item)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isEquipped ? 'bg-red-950/30 text-red-500 hover:bg-red-900 hover:text-white border border-red-500/40' : 'bg-[#020202] text-white hover:bg-amber-900/40 border border-white/10'}`}>{isEquipped ? 'Remover' : 'Equipar'}</button>
                              ) : (
                                <button onClick={() => buyItem(item)} className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black py-3 rounded-xl transition-all duration-300 text-[10px] shadow-lg uppercase tracking-widest">{item.preco || item.price} M</button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                </div>
            )}

            {activeTab === "Ranking" && (
                <div className="animate-in fade-in duration-500">
                    <div className="bg-gradient-to-b from-[#050402] to-black border border-amber-900/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-900/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-800/5 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <div className="text-center mb-12 relative z-10 flex flex-col items-center justify-center">
                            <h3 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-600 tracking-[0.2em] uppercase mb-3 drop-shadow-md text-center">A Hierarquia</h3>
                            <p className="text-amber-900/80 text-[10px] sm:text-xs font-black uppercase tracking-widest text-center">As Entidades supremas do Abismo Cósmico.</p>
                        </div>

                        {loadingRank ? (
                            <div className="py-20 flex flex-col justify-center items-center gap-4"><Loader2 className="w-12 h-12 text-amber-600 animate-spin" /><span className='text-[10px] font-black tracking-[0.3em] text-amber-900/60 uppercase animate-pulse'>Lendo Matrix</span></div>
                        ) : rankingList.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-amber-900/30 rounded-3xl bg-black/50 shadow-inner animate-in fade-in">
                                <ShieldAlert className="w-12 h-12 text-amber-900/40 mx-auto mb-4" />
                                <p className="text-gray-500 font-black tracking-widest text-[10px] uppercase">O Vazio ainda não registrou Entidades.</p>
                            </div>
                        ) : (
                            <div className="relative z-10 animate-in fade-in duration-700">
                                <div className="flex justify-center items-end gap-3 sm:gap-6 mb-16 mt-6 px-2">
                                    {rankingList[1] && (() => {
                                        const p = rankingList[1];
                                        const eq = p.equipped_items || {};
                                        return (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700 delay-100 group relative">
                                            {/* Injeção de Estilos Locais */}
                                            {Object.values(eq).map(item => item && (
                                                <style key={`r2-${item.id}`} dangerouslySetInnerHTML={{__html: `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`}} />
                                            ))}
                                            <div className="text-[10px] text-gray-300 font-black mb-3 uppercase tracking-widest bg-gray-600/20 px-3.5 py-1.5 rounded-full border border-gray-500/40 shadow-md">Prata</div>
                                            
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                                                {eq.particulas && <img src={eq.particulas.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] max-w-none pointer-events-none ${eq.particulas.cssClass}`} />}
                                                <div className={`w-full h-full rounded-full border-[5px] border-gray-400 bg-black shadow-[0_0_30px_rgba(156,163,175,0.3)] overflow-hidden relative z-10`}>
                                                    <img src={eq.avatar ? eq.avatar.preview : (p.avatarUrl || `https://placehold.co/100x100/020202/a1a1aa?text=2`)} className={`w-full h-full object-cover ${eq.avatar?.cssClass || ''}`} />
                                                </div>
                                                {eq.efeito && <img src={eq.efeito.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${eq.efeito.cssClass}`} />}
                                                {eq.moldura && <img src={eq.moldura.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-w-none pointer-events-none z-30 ${eq.moldura.cssClass}`} />}
                                                {eq.badge && <img src={eq.badge.preview} className={`absolute -bottom-2 -right-2 w-8 h-8 z-40 ${eq.badge.cssClass}`} />}
                                            </div>
                                            
                                            <div className="h-20 sm:h-28 w-20 sm:w-24 bg-gradient-to-t from-black to-gray-800/20 mt-4 rounded-t-2xl border-t-[3px] border-gray-400 flex flex-col items-center justify-start pt-4 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                                                <span className={`font-bold text-xs truncate w-full text-center px-2 ${eq.nickname ? eq.nickname.cssClass : 'text-gray-200'}`}>{p.name || 'Viajante'}</span>
                                                <span className="text-[10px] text-amber-500 font-black mt-1.5 uppercase">Lvl {p.level || 1}</span>
                                            </div>
                                        </div>
                                    )})}
                                    
                                    {rankingList[0] && (() => {
                                        const p = rankingList[0];
                                        const eq = p.equipped_items || {};
                                        return (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-16 duration-700 z-10 group relative">
                                            {/* Injeção de Estilos Locais */}
                                            {Object.values(eq).map(item => item && (
                                                <style key={`r1-${item.id}`} dangerouslySetInnerHTML={{__html: `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`}} />
                                            ))}
                                            <Crown className="w-12 h-12 text-yellow-400 mb-2 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-[float-abyss_3s_ease-in-out_infinite]"/>
                                            
                                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                                                {eq.particulas && <img src={eq.particulas.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] max-w-none pointer-events-none ${eq.particulas.cssClass}`} />}
                                                <div className={`w-full h-full rounded-full border-[6px] border-yellow-400 bg-black shadow-[0_0_40px_rgba(250,204,21,0.5)] overflow-hidden relative z-10`}>
                                                    <img src={eq.avatar ? eq.avatar.preview : (p.avatarUrl || `https://placehold.co/100x100/020202/facc15?text=1`)} className={`w-full h-full object-cover ${eq.avatar?.cssClass || ''}`} />
                                                </div>
                                                {eq.efeito && <img src={eq.efeito.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${eq.efeito.cssClass}`} />}
                                                {eq.moldura && <img src={eq.moldura.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-w-none pointer-events-none z-30 ${eq.moldura.cssClass}`} />}
                                                {eq.badge && <img src={eq.badge.preview} className={`absolute -bottom-2 -right-2 w-10 h-10 z-40 ${eq.badge.cssClass}`} />}
                                            </div>

                                            <div className="h-28 sm:h-36 w-24 sm:w-32 bg-gradient-to-t from-black to-yellow-900/20 mt-4 rounded-t-2xl border-t-[4px] border-yellow-400 flex flex-col items-center justify-start pt-5 shadow-[0_-8px_25px_rgba(250,204,21,0.15)]">
                                                <span className={`font-black text-sm truncate w-full text-center px-2 ${eq.nickname ? eq.nickname.cssClass : 'text-yellow-400'}`}>{p.name || 'Entidade'}</span>
                                                <span className="text-[11px] text-yellow-500 font-black mt-2 uppercase tracking-wider">Lvl {p.level || 1}</span>
                                            </div>
                                        </div>
                                    )})}
                                    
                                    {rankingList[2] && (() => {
                                        const p = rankingList[2];
                                        const eq = p.equipped_items || {};
                                        return (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200 group relative">
                                            {/* Injeção de Estilos Locais */}
                                            {Object.values(eq).map(item => item && (
                                                <style key={`r3-${item.id}`} dangerouslySetInnerHTML={{__html: `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`}} />
                                            ))}
                                            <div className="text-[10px] text-amber-600 font-black mb-3 uppercase tracking-widest bg-amber-900/30 px-3.5 py-1.5 rounded-full border border-amber-700/60 shadow-md">Bronze</div>
                                            
                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                                                {eq.particulas && <img src={eq.particulas.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] max-w-none pointer-events-none ${eq.particulas.cssClass}`} />}
                                                <div className={`w-full h-full rounded-full border-[5px] border-amber-700 bg-black shadow-[0_0_25px_rgba(180,83,9,0.3)] overflow-hidden relative z-10`}>
                                                    <img src={eq.avatar ? eq.avatar.preview : (p.avatarUrl || `https://placehold.co/100x100/020202/b45309?text=3`)} className={`w-full h-full object-cover ${eq.avatar?.cssClass || ''}`} />
                                                </div>
                                                {eq.efeito && <img src={eq.efeito.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${eq.efeito.cssClass}`} />}
                                                {eq.moldura && <img src={eq.moldura.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-w-none pointer-events-none z-30 ${eq.moldura.cssClass}`} />}
                                                {eq.badge && <img src={eq.badge.preview} className={`absolute -bottom-2 -right-2 w-7 h-7 z-40 ${eq.badge.cssClass}`} />}
                                            </div>

                                            <div className="h-16 sm:h-24 w-16 sm:w-20 bg-gradient-to-t from-black to-amber-900/10 mt-4 rounded-t-2xl border-t-[3px] border-amber-700 flex flex-col items-center justify-start pt-3 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                                                <span className={`font-bold text-[11px] truncate w-full text-center px-2 ${eq.nickname ? eq.nickname.cssClass : 'text-amber-500'}`}>{p.name || 'Viajante'}</span>
                                                <span className="text-[9px] text-amber-400 font-black mt-1 uppercase">Lvl {p.level || 1}</span>
                                            </div>
                                        </div>
                                    )})}
                                </div>

                                <div className="space-y-3 mt-6 bg-black/80 p-5 sm:p-6 rounded-3xl border border-amber-900/20 shadow-inner">
                                    {rankingList.slice(3).map((p, index) => {
                                        const eq = p.equipped_items || {};
                                        return (
                                        <div key={p.id} className="flex items-center gap-4 p-4 bg-[#020202] hover:bg-amber-950/20 border border-amber-900/20 hover:border-amber-600/40 rounded-2xl transition-all duration-300 group shadow-md relative">
                                            {/* Injeção de Estilos Locais */}
                                            {Object.values(eq).map(item => item && (
                                                <style key={`list-${p.id}-${item.id}`} dangerouslySetInnerHTML={{__html: `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`}} />
                                            ))}
                                            
                                            <div className="w-8 text-center text-amber-900/60 font-black text-sm">{index + 4}º</div>
                                            
                                            {/* Mini Container de Cosméticos na Lista */}
                                            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                                                {eq.particulas && <img src={eq.particulas.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] max-w-none pointer-events-none ${eq.particulas.cssClass}`} />}
                                                <div className={`w-full h-full rounded-full bg-black border border-white/10 overflow-hidden relative z-10`}>
                                                    <img src={eq.avatar ? eq.avatar.preview : (p.avatarUrl || `https://placehold.co/50x50/020202/f59e0b?text=${index+4}`)} className={`w-full h-full object-cover ${eq.avatar?.cssClass || ''}`} />
                                                </div>
                                                {eq.efeito && <img src={eq.efeito.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${eq.efeito.cssClass}`} />}
                                                {eq.moldura && <img src={eq.moldura.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-w-none pointer-events-none z-30 ${eq.moldura.cssClass}`} />}
                                                {eq.badge && <img src={eq.badge.preview} className={`absolute -bottom-1 -right-1 w-4 h-4 z-40 ${eq.badge.cssClass}`} />}
                                            </div>

                                            <div className="flex-1 min-w-0 z-10 relative">
                                                <h4 className={`font-bold text-sm truncate transition-colors ${eq.nickname ? eq.nickname.cssClass : 'text-white group-hover:text-yellow-400'}`}>{p.name || 'Explorador'}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{getLevelTitle(p.level || 1)}</p>
                                            </div>
                                            <div className="text-right z-10 relative">
                                                <div className="font-black text-amber-500 text-base">Lvl {p.level || 1}</div>
                                                <div className="text-[11px] text-gray-500 font-bold tracking-wide uppercase">{p.xp || 0} XP</div>
                                            </div>
                                        </div>
                                    )})}
                                    {rankingList.length <= 3 && (
                                        <p className="text-center text-[10px] uppercase text-gray-600 py-8 font-black tracking-[0.2em]">O Vazio silencia além dos líderes.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
