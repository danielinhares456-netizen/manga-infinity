import React, { useState, useEffect } from 'react';
import { Target, Hexagon, ShoppingCart, ShieldAlert, Key, Check, Compass, Timer, Star, Skull, Zap, Search, Sparkles, Clock } from 'lucide-react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from './firebase';
import { translateToPtBr, addXpLogic, removeXpLogic, getRarityColor } from './helpers';
import { MULTIVERSO_ENIGMAS } from './constants';

export function NexoView({ user, userProfileData, showToast, mangas, db, appId, onNavigate, onLevelUp, synthesizeCrystal, shopItems, buyItem, equipItem }) {
    const [activeTab, setActiveTab] = useState("Missões");
    const [enigmaAnswer, setEnigmaAnswer] = useState("");
    const [timeLeft, setTimeLeft] = useState("");
    const [confirmModal, setConfirmModal] = useState(null); 
    const [isForgingMission, setIsForgingMission] = useState(false); 
    const [synthesizing, setSynthesizing] = useState(false);

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

    const fetchGlobalEnigma = async (difficulty) => {
        try {
            // AJUSTE: Filtra apenas TOP OBRAS (Evita obras obscuras com sinopses ruins)
            const type = Math.random() > 0.5 ? 'manga' : 'anime';
            // Pega uma página aleatória entre as primeiras do Top (limit=25)
            const randomPage = Math.floor(Math.random() * 4) + 1; 
            const res = await fetch(`https://api.jikan.moe/v4/top/${type}?limit=25&page=${randomPage}`);
            
            const data = await res.json();
            const topList = data.data;
            if(!topList || topList.length === 0) return null;

            // Seleciona uma obra aleatória da lista do Top
            const itemApi = topList[Math.floor(Math.random() * topList.length)];

            if(!itemApi || !itemApi.title || !itemApi.synopsis) return null;
            
            let cleanSynopsis = itemApi.synopsis.split('[')[0].trim(); // Remove avisos da API no fim
            
            let snippetLength = difficulty.includes('S') ? 100 : (difficulty.includes('A') || difficulty.includes('B') ? 200 : 400);
            let shortSynopsis = cleanSynopsis.substring(0, snippetLength) + "...";
            
            let translatedSynopsis = await translateToPtBr(shortSynopsis);
            
            let genres = itemApi.genres && itemApi.genres.length > 0 ? itemApi.genres.map(g => g.name).slice(0, 3).join(', ') : "Desconhecidos";
            let translatedGenres = await translateToPtBr(genres);
            
            // Coleta todas as variações de título possíveis para a resposta
            const acceptedAnswers = new Set();
            if(itemApi.title) acceptedAnswers.add(itemApi.title.toLowerCase().trim());
            if(itemApi.title_english) acceptedAnswers.add(itemApi.title_english.toLowerCase().trim());
            if(itemApi.title_japanese) acceptedAnswers.add(itemApi.title_japanese.toLowerCase().trim());
            if(itemApi.titles) {
                itemApi.titles.forEach(t => acceptedAnswers.add(t.title.toLowerCase().trim()));
            }

            return { 
                q: `[SINAL MULTIVERSAL INTERCEPTADO - ${type.toUpperCase()}]\n\nSinopse Parcial:\n"${translatedSynopsis}"\n\nGêneros: ${translatedGenres}\n\nQual é o nome da obra?`, 
                a: Array.from(acceptedAnswers), 
                rawId: itemApi.mal_id 
            };
        } catch(e) { return null; }
    };

    const generateMission = async (difficulty) => {
        try {
            const now = Date.now();
            let completed = userProfileData.completedMissions || [];
            let missionType = [0, 1, 2][Math.floor(Math.random() * 3)];
            let newMission = null;

            const rankConfigs = {
                'Rank E': { rxp: 30, rcoin: 15, pxp: 15, pcoin: 10, enigmaTries: 3, enigmaTimeMin: 15, readTimePerCapMin: 60 },
                'Rank C': { rxp: 100, rcoin: 50, pxp: 50, pcoin: 25, enigmaTries: 3, enigmaTimeMin: 10, readTimePerCapMin: 50 },
                'Rank B': { rxp: 150, rcoin: 80, pxp: 80, pcoin: 40, enigmaTries: 2, enigmaTimeMin: 8,  readTimePerCapMin: 45 },
                'Rank A': { rxp: 300, rcoin: 150, pxp: 150, pcoin: 80, enigmaTries: 2, enigmaTimeMin: 5,  readTimePerCapMin: 40 },
                'Rank S': { rxp: 800, rcoin: 400, pxp: 400, pcoin: 200, enigmaTries: 1, enigmaTimeMin: 3,  readTimePerCapMin: 30 },
                'Rank SSS':{ rxp: 2000, rcoin: 1000, pxp: 1000, pcoin: 500, enigmaTries: 1, enigmaTimeMin: 1,  readTimePerCapMin: 20 }
            };
            const conf = rankConfigs[difficulty];
            if (mangas.length === 0 && missionType !== 2) missionType = 2; 

            if (missionType === 1) { 
                let validLocalMangas = mangas.filter(item => !completed.includes("enigma_local_" + item.id) && (item.synopsis || (item.genres && item.genres.length > 0)));
                if(validLocalMangas.length === 0) missionType = 2; 
                if (missionType === 1) { 
                    const randomManga = validLocalMangas[Math.floor(Math.random() * validLocalMangas.length)];
                    let cleanDesc = randomManga.synopsis ? randomManga.synopsis.replace(/<[^>]*>?/gm, '').replace(new RegExp(randomManga.title, 'gi'), '___') : '';
                    let q = cleanDesc.length > 20 ? `[ARQUIVO OCULTO]\n\nSinopse:\n"${cleanDesc.substring(0, difficulty.includes('S') ? 80 : 160)}..."` : `[ARQUIVO OCULTO]\n\nGêneros: ${randomManga.genres.join(', ')}\nAutor: ${randomManga.author || 'Desconhecido'}`;
                    newMission = { id: Date.now().toString(), type: 'search_local', difficulty, title: "Caçada Infinity", question: q, targetManga: randomManga.id, targetTitle: randomManga.title, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.enigmaTimeMin * 60 * 1000) };
                    completed.push("enigma_local_" + randomManga.id);
                }
            } 
            
            if (missionType === 0) {
                let availableMangas = mangas.filter(item => !completed.includes("read_" + item.id));
                if(availableMangas.length === 0) availableMangas = mangas; 
                if (availableMangas.length > 0) {
                    const randomManga = availableMangas[Math.floor(Math.random() * availableMangas.length)];
                    const totalCaps = randomManga.chapters ? randomManga.chapters.length : 1;
                    let readTarget = difficulty === 'Rank E' ? 1 : difficulty === 'Rank C' ? Math.min(totalCaps, Math.floor(Math.random() * 3) + 2) : difficulty === 'Rank B' ? Math.min(totalCaps, Math.floor(Math.random() * 5) + 5) : difficulty === 'Rank A' ? Math.min(totalCaps, Math.floor(Math.random() * 10) + 10) : difficulty === 'Rank S' ? Math.min(totalCaps, Math.floor(Math.random() * 20) + 20) : totalCaps; 
                    newMission = { id: Date.now().toString(), type: 'read', difficulty, title: `Missão de Leitura`, desc: difficulty === 'Rank SSS' ? `Leia TODOS OS CAPÍTULOS da obra "${randomManga.title}".` : `Leia ${readTarget} capítulo(s) da obra "${randomManga.title}".`, targetManga: randomManga.id, targetCount: readTarget, currentCount: 0, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (readTarget * conf.readTimePerCapMin * 60 * 1000) };
                    completed.push("read_" + randomManga.id); 
                } else { missionType = 2; }
            }

            if (missionType === 2 || !newMission) {
                if (Math.random() > 0.5) {
                    const apiEnigma = await fetchGlobalEnigma(difficulty);
                    if (apiEnigma) {
                        newMission = { id: Date.now().toString(), type: 'enigma', difficulty, title: "Multiverso Global", question: apiEnigma.q, answer: apiEnigma.a, attemptsLeft: conf.enigmaTries, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.enigmaTimeMin * 60 * 1000) };
                        completed.push("api_" + apiEnigma.rawId);
                    }
                }
                if (!newMission) {
                    let availableEnigmas = MULTIVERSO_ENIGMAS.filter(item => !completed.includes(item.q));
                    if (availableEnigmas.length === 0) { completed = []; availableEnigmas = MULTIVERSO_ENIGMAS; }
                    const enigmaData = availableEnigmas[Math.floor(Math.random() * availableEnigmas.length)];
                    newMission = { id: Date.now().toString(), type: 'enigma', difficulty, title: "Arquivo Ancestral", question: enigmaData.q, answer: enigmaData.a, attemptsLeft: conf.enigmaTries, rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.enigmaTimeMin * 60 * 1000) };
                    completed.push(enigmaData.q); 
                }
            }
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { activeMission: newMission, completedMissions: completed });
            showToast(`Contrato Assinado!`, "success");
        } catch(e) { showToast("Falha na Fenda do Nexo.", "error"); } finally { setIsForgingMission(false); }
    };
    
    const handleEnigmaSubmit = async (e) => {
        e.preventDefault(); const m = userProfileData.activeMission;
        if (!m || m.type !== 'enigma') return;
        if (!enigmaAnswer.trim()) return showToast("A resposta não pode ser vazia.", "warning");
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const userAnswer = enigmaAnswer.toLowerCase().trim();
        const isCorrect = m.answer.some(ans => { const correctAns = ans.toLowerCase().trim(); return userAnswer === correctAns || (userAnswer.length >= 3 && (correctAns.includes(userAnswer) || userAnswer.includes(correctAns))); });
        
        if (isCorrect) {
           let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
           let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
           let currentCompleted = userProfileData.completedMissions || [];
           if (!currentCompleted.includes(m.question)) currentCompleted = [...currentCompleted, m.question];
           await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
           setEnigmaAnswer(''); showToast(`Enigma Desvendado! Recebeu ${m.rewardXp} XP e ${m.rewardCoins} Moedas.`, "success");
           if(didLevelUp) onLevelUp(newLvl); 
        } else {
           const attempts = m.attemptsLeft - 1;
           if (attempts <= 0) {
               let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
               let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
               await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
               showToast(`Falhou! O Sistema cobrou a penalidade.`, "error");
           } else {
               await updateDoc(profileRef, { 'activeMission.attemptsLeft': attempts }); showToast(`Incorreto. ${attempts} tentativa(s) restante(s).`, "error");
           }
           setEnigmaAnswer('');
        }
    };
    
    const cancelMission = async () => {
        const m = userProfileData.activeMission; if(!m) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
        let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
        let currentCompleted = userProfileData.completedMissions || [];
        const blockItem = m.type === 'enigma' ? m.question : "read_" + m.targetManga;
        if (!currentCompleted.includes(blockItem)) currentCompleted = [...currentCompleted, blockItem];
        await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
        showToast(`Desistência punida: -${m.penaltyXp}XP | -${m.penaltyCoins} Moedas`, "error");
    };

    const runSynthesis = async () => {
        if ((userProfileData.crystals || 0) < 5) { showToast("Cristais insuficientes (Custa 5).", "error"); return; }
        setSynthesizing(true);
        setTimeout(async () => {
          const res = await synthesizeCrystal(); setSynthesizing(false);
          if (res && res.success) showToast(`Síntese Concluída! +${res.wonCoins} Moedas | +${res.wonXp} XP`, 'success');
          else showToast(`Falha na Síntese! Os cristais foram destruídos.`, 'error');
        }, 1500);
    };

    const RANK_CARDS = [
        { id: 'Rank E', color: 'text-cyan-400', border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/60', btn: 'bg-cyan-600 hover:bg-cyan-500', rxp: 30, rcoin: 15, success: '95%', time: '~ 15 min' },
        { id: 'Rank C', color: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:border-emerald-500/60', btn: 'bg-emerald-600 hover:bg-emerald-500', rxp: 100, rcoin: 50, success: '80%', time: '~ 30 min' },
        { id: 'Rank B', color: 'text-violet-400', border: 'border-violet-500/30', hover: 'hover:border-violet-500/60', btn: 'bg-violet-600 hover:bg-violet-500', rxp: 150, rcoin: 80, success: '65%', time: '~ 1 Hora' },
        { id: 'Rank A', color: 'text-fuchsia-400', border: 'border-fuchsia-500/30', hover: 'hover:border-fuchsia-500/60', btn: 'bg-fuchsia-600 hover:bg-fuchsia-500', rxp: 300, rcoin: 150, success: '40%', time: '~ 3 Horas' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-500 relative">
            {isForgingMission && (
                <div className="fixed inset-0 z-[3000] bg-[#020205]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300 w-full">
                    <style>{`@keyframes spin-slow { 100% { transform: rotate(360deg); } }`}</style>
                    <div className="relative w-48 h-48 flex items-center justify-center"><div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-emerald-500 to-fuchsia-500 rounded-full blur-[40px] animate-pulse opacity-60"></div><div className="absolute inset-4 border-[2px] border-white/20 border-dashed rounded-full animate-[spin_4s_linear_infinite]"></div><div className="absolute inset-8 border-[3px] border-t-cyan-400 border-b-fuchsia-400 border-l-transparent border-r-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div><div className="absolute inset-12 bg-black/60 backdrop-blur-md rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center"><Zap className="w-10 h-10 text-white drop-shadow-[0_0_15px_#fff] animate-pulse" /></div></div>
                    <h2 className="mt-12 text-lg md:text-xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 tracking-[0.4em] md:tracking-[0.6em] animate-pulse">FORJANDO NEXO...</h2>
                </div>
            )}
            {confirmModal && (
                <div className="fixed inset-0 z-[2000] bg-[#030407]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setConfirmModal(null)}>
                    <div className="bg-[#0d0d12] border border-white/10 p-6 rounded-xl shadow-[0_0_40px_rgba(217,70,239,0.2)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><h3 className="text-xl font-black text-white mb-2">Confirmar Contrato?</h3><p className="text-sm text-gray-400/60 mb-6">Ao aceitar uma missão <b>{confirmModal}</b>, você estará sujeito às penalidades caso o tempo esgote ou suas vidas acabem.</p>
                        <div className="flex gap-3"><button onClick={() => setConfirmModal(null)} className="flex-1 bg-[#050508] border border-white/10 text-gray-300/80 font-bold py-3 rounded-lg hover:text-white transition-colors text-sm duration-300">Recusar</button><button onClick={() => triggerForgeMission(confirmModal)} className="flex-1 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-lg hover:scale-105 transition-transform shadow-md text-sm duration-300">Assinar</button></div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide pb-2">
                <button onClick={() => setActiveTab("Missões")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-2 text-sm duration-300 ${activeTab === "Missões" ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'text-gray-400/60 hover:text-white border border-transparent'}`}><Target className="w-4 h-4"/> Missões</button>
                <button onClick={() => setActiveTab("Forja")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-2 text-sm duration-300 ${activeTab === "Forja" ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400/60 hover:text-white border border-transparent'}`}><Hexagon className="w-4 h-4"/> Forja Cósmica</button>
                <button onClick={() => setActiveTab("Loja")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-2 text-sm duration-300 ${activeTab === "Loja" ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-gray-400/60 hover:text-white border border-transparent'}`}><ShoppingCart className="w-4 h-4"/> Loja Infinity</button>
            </div>

            {activeTab === "Missões" && (
                <div className="animate-in fade-in duration-300">
                    {userProfileData.activeMission ? (
                        <div className="bg-[#0d0d12] border border-fuchsia-500/40 p-4 rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.1)] mb-6 animate-in zoom-in-95 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-600"></div>
                            <div className="mb-4">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${userProfileData.activeMission.difficulty.includes('S') ? 'bg-red-950/80 text-red-500 border-red-500/50' : userProfileData.activeMission.difficulty === 'Rank A' || userProfileData.activeMission.difficulty === 'Rank B' ? 'bg-[#1a0033] text-fuchsia-400 border-fuchsia-500/50' : 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50'}`}>
                                    {userProfileData.activeMission.difficulty}
                                </span>
                                <h3 className="text-lg font-black text-white mt-1.5 leading-tight">{userProfileData.activeMission.title}</h3>
                            </div>
                            <div className="mb-4">
                                {userProfileData.activeMission.type === 'search_local' ? (
                                    <div className="bg-[#050508]/60 p-4 md:p-5 rounded-md border border-white/10 relative">
                                        <div className="flex items-center gap-2 mb-3 text-cyan-400"><Search className="w-5 h-5"/><span className="font-bold text-xs uppercase tracking-widest">Missão de Rastreio</span></div>
                                        <p className="text-sm font-medium text-gray-200 mb-5 leading-relaxed whitespace-pre-wrap border-l-2 border-cyan-500/50 pl-3">{userProfileData.activeMission.question}</p>
                                        <div className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-md text-xs text-cyan-100 font-bold flex items-center gap-3"><Compass className="w-6 h-6 flex-shrink-0 text-cyan-400"/>Para concluir o contrato, procure esta obra no site e entre na página dela.</div>
                                    </div>
                                ) : userProfileData.activeMission.type === 'enigma' ? (
                                    <div className="bg-[#050508]/60 p-4 md:p-5 rounded-md border border-white/10 relative">
                                        <p className="text-sm font-medium text-gray-200 mb-5 leading-relaxed whitespace-pre-wrap border-l-2 border-fuchsia-500/50 pl-3">{userProfileData.activeMission.question}</p>
                                        <form onSubmit={handleEnigmaSubmit} className="flex flex-col gap-2 relative z-10">
                                            <div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" /><input type="text" value={enigmaAnswer} onChange={e=>setEnigmaAnswer(e.target.value)} placeholder="Sua resposta..." className="w-full bg-[#050508] border border-white/10 rounded-md pl-9 pr-3 py-2.5 text-white outline-none focus:border-cyan-500 transition-colors duration-300 font-bold text-sm shadow-inner" /></div>
                                            <div className="flex gap-2 mt-1">
                                                <button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black px-3 py-3 rounded-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 text-sm shadow-md duration-300">Validar <Check className="w-4 h-4"/></button>
                                                <div className="bg-[#050508] px-4 py-3 rounded-md border border-white/10 text-sm font-bold text-gray-400/60 flex items-center justify-center gap-1.5 shadow-inner">Vidas: <span className={userProfileData.activeMission.attemptsLeft === 1 ? 'text-red-500 font-black' : 'text-cyan-400 font-black'}>{userProfileData.activeMission.attemptsLeft}</span></div>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="bg-[#050508]/60 p-4 rounded-md border border-white/10">
                                        <div className="flex justify-between items-end mb-2"><span className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-cyan-400"/> Progresso</span><span className="text-base font-black text-white">{userProfileData.activeMission.currentCount} <span className="text-gray-400/60 text-xs">/ {userProfileData.activeMission.targetCount}</span></span></div>
                                        <div className="w-full bg-[#050508] rounded-full h-1.5 overflow-hidden border border-white/10"><div className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-full rounded-full transition-all duration-500" style={{width: `${(userProfileData.activeMission.currentCount / userProfileData.activeMission.targetCount) * 100}%`}}></div></div>
                                        <p className="mt-2.5 text-sm text-gray-400/60 font-medium text-center">{userProfileData.activeMission.desc}</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#050508] p-3 rounded-md border border-white/10">
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400/60 font-bold uppercase tracking-widest hidden sm:block">Recompensas:</span>
                                        <span className="text-sm font-black text-white bg-fuchsia-500/20 px-2 py-0.5 rounded border border-fuchsia-500/30">+{userProfileData.activeMission.rewardXp} XP</span>
                                        <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+{userProfileData.activeMission.rewardCoins} M</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/20"><Timer className="w-4 h-4 animate-pulse"/><span className="font-black text-xs tracking-wide">{timeLeft}</span></div>
                                </div>
                                <div className="w-full h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-400/60 font-medium">Punição: -{userProfileData.activeMission.penaltyXp}XP</span>
                                    <button onClick={cancelMission} className="text-xs font-bold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded transition-colors border border-red-500/20 duration-300">Quebrar Contrato</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {RANK_CARDS.map(rank => (
                                    <div key={rank.id} className={`bg-[#0d0d12] border ${rank.border} ${rank.hover} transition-colors duration-300 p-4 rounded-xl flex flex-col group shadow-sm`}>
                                        <div className="flex justify-between items-center mb-3"><div className={`${rank.color} font-black text-xl group-hover:scale-105 transition-transform origin-left`}>{rank.id}</div><div className="text-xs font-bold text-gray-400/60 text-right">+{rank.rxp}XP | +{rank.rcoin}M</div></div>
                                        <div className="flex flex-col gap-1 mb-4 mt-2">
                                            <div className="flex justify-between text-xs text-gray-400/60"><span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Tempo Est.</span><span className="font-bold text-gray-300/80">{rank.time}</span></div>
                                        </div>
                                        <button onClick={() => setConfirmModal(rank.id)} className={`w-full ${rank.btn} text-white text-sm font-bold py-3 rounded-md transition-colors mt-auto flex items-center justify-center gap-2 duration-300`}>Assinar Contrato</button>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-amber-950/20 border border-amber-900/50 hover:border-amber-500/80 transition-colors duration-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 shadow-sm">
                                <div><div className="text-amber-500 font-black text-xl flex items-center gap-1.5 mb-1">Rank S <Star className="w-4 h-4 fill-current"/></div><div className="text-xs font-bold text-gray-400/60 flex gap-2"><span className="text-amber-400">+800XP / +400M</span> <span>• Alta dificuldade</span></div></div>
                                <button onClick={() => setConfirmModal('Rank S')} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-8 py-3 rounded-md transition-colors duration-300 flex items-center justify-center min-w-[120px]">Aceitar Nexo</button>
                            </div>
                            <div className="bg-red-950/20 border border-red-900/80 hover:border-red-500/80 transition-colors duration-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-[30px] rounded-full pointer-events-none"></div>
                                <div className="relative z-10"><div className="text-red-500 font-black text-2xl flex items-center gap-1.5 mb-1">Rank SSS <Skull className="w-5 h-5"/></div><div className="text-xs font-bold text-gray-400/60 flex gap-2"><span className="text-red-400">+2000XP / +1000M</span> <span>• Risco de Morte</span></div></div>
                                <button onClick={() => setConfirmModal('Rank SSS')} className="w-full sm:w-auto bg-red-800 hover:bg-red-600 text-white text-sm font-black px-8 py-3 rounded-md transition-colors duration-300 shadow-lg relative z-10 flex items-center justify-center min-w-[120px]">Desafiar Nexo</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "Forja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-[#0d0d12] to-[#030407] border border-white/10 p-5 md:p-6 rounded-xl shadow-md">
                       <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-6 relative z-10">
                         <div className="text-center md:text-left"><h3 className="text-2xl font-black text-emerald-400 mb-1.5 flex items-center gap-2 justify-center md:justify-start"><Hexagon className="w-6 h-6"/> Fornalha de Síntese</h3><p className="text-gray-400/60 text-sm font-medium max-w-sm">Leitura e Missões geram Cristais. Sintetize-os aqui para obter Moedas Infinity e XP extra.</p></div>
                         <div className="flex gap-2">
                            <div className="bg-[#050508] border border-white/10 p-4 rounded-lg text-center min-w-[80px] shadow-inner"><p className="text-xl font-black text-cyan-400">{userProfileData.crystals || 0}</p><p className="text-xs text-gray-400/60 uppercase font-bold mt-0.5">Cristais</p></div>
                            <div className="bg-[#050508] border border-white/10 p-4 rounded-lg text-center min-w-[80px] shadow-inner"><p className="text-xl font-black text-amber-500">{userProfileData.coins || 0}</p><p className="text-xs text-gray-400/60 uppercase font-bold mt-0.5">Moedas</p></div>
                         </div>
                       </div>
                       <div className="bg-[#050508] border border-white/10 p-5 rounded-lg relative overflow-hidden flex flex-col items-center justify-center text-center shadow-inner">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 relative transition-all duration-1000 ${synthesizing ? 'scale-125' : ''}`}><div className={`absolute inset-0 rounded-full border-2 border-t-cyan-500 border-r-emerald-500 border-b-transparent border-l-transparent ${synthesizing ? 'animate-[spin_0.5s_linear_infinite] opacity-100' : 'opacity-20'}`}></div><Zap className={`w-8 h-8 ${synthesizing ? 'text-white animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-emerald-400'}`} /></div>
                          <p className="text-xs text-gray-400/60 font-medium mb-4 max-w-[200px]">Custo: 5 Cristais (40% chance de falhar).</p>
                          <button onClick={runSynthesis} disabled={synthesizing || (userProfileData.crystals || 0) < 5} className="w-full sm:w-48 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black py-3 rounded-md flex items-center justify-center gap-1.5 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 text-sm shadow-md duration-300">{synthesizing ? 'SINTETIZANDO...' : 'SINTETIZAR (-5)'}</button>
                       </div>
                    </div>
                </div>
            )}

            {activeTab === "Loja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl shadow-md">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                        <div><h3 className="text-2xl font-black text-amber-500 mb-0.5 flex items-center gap-1.5"><ShoppingCart className="w-6 h-6"/> Loja Infinity</h3><p className="text-gray-400/60 text-xs">Utilize suas moedas para personalizar seu Perfil.</p></div>
                        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-500 font-black px-4 py-2 rounded-md flex items-center gap-1 w-full sm:w-auto justify-center text-sm">{userProfileData.coins || 0} M</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {shopItems.map(item => {
                          const hasItem = userProfileData.inventory?.includes(item.id);
                          const isEquipped = userProfileData.activeFrame === item.cssClass || userProfileData.activeCover === item.preview || userProfileData.activeCover === item.url || userProfileData.avatarUrl === item.preview || userProfileData.activeEffect === item.cssClass || userProfileData.activeFont === item.cssClass;
                          return (
                            <div key={item.id} className={`bg-[#050508] border p-3 rounded-lg flex flex-col items-center text-center transition-colors duration-300 ${isEquipped ? 'border-amber-500/50' : 'border-white/10'}`}>
                              <div className={`w-16 h-16 rounded-md mb-2 bg-[#0d0d12] flex items-center justify-center overflow-hidden shadow-inner ${item.categoria === 'moldura' || item.categoria === 'efeito' ? item.cssClass : ''}`}>
                                {item.preview ? <img src={item.preview} className={`w-full h-full object-cover ${item.cssClass || ''}`} /> : <Sparkles className="w-6 h-6 text-cyan-400"/>}
                              </div>
                              <h4 className="text-white font-bold mb-0.5 text-xs line-clamp-1">{item.nome || item.name}</h4>
                              <p className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${getRarityColor(item.raridade)}`}>{item.categoria || item.type}</p>
                              {hasItem ? (
                                <button onClick={() => equipItem(item)} className={`w-full py-2 rounded text-xs font-bold transition-all duration-300 ${isEquipped ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30' : 'bg-[#0d0d12] text-white hover:bg-white/5 border border-white/10'}`}>{isEquipped ? 'Desequipar' : 'Equipar'}</button>
                              ) : (
                                <button onClick={() => buyItem(item)} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-2 rounded transition-all duration-300 text-xs shadow-sm">{item.preco || item.price} M</button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                </div>
            )}
        </div>
    );
}
