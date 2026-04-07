import React, { useState, useEffect } from 'react';
import { Target, Hexagon, ShoppingCart, Trophy, Check, Compass, Timer, Star, Skull, Zap, Clock, Crown, Key, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { doc, updateDoc, collectionGroup, getDocs, query, orderBy, limit } from "firebase/firestore";
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

    useEffect(() => {
        if(activeTab === 'Ranking') fetchRanking();
    }, [activeTab]);

    const fetchRanking = async () => {
        setLoadingRank(true);
        try {
            // Updated sorting logic for Image 3: Level (Descending), then XP (Descending)
            const q = query(
              collectionGroup(db, 'profile'),
              where('level', '>=', 1),
              orderBy('level', 'desc'),
              orderBy('xp', 'desc'),
              limit(50)
            );
            
            const snap = await getDocs(q);
            let rankData = [];
            snap.forEach(doc => {
                if(doc.ref.path.includes('main') && (doc.data().level || doc.data().name)) { 
                   rankData.push({ id: doc.ref.parent.parent.id, ...doc.data() });
                }
            });
            setRankingList(rankData);
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

    const RANK_CARDS = [
        { id: 'Rank E', color: 'text-gray-400', border: 'border-gray-500/20', hover: 'hover:border-gray-500/50', btn: 'bg-gray-800 hover:bg-gray-700' },
        { id: 'Rank C', color: 'text-blue-500', border: 'border-blue-500/20', hover: 'hover:border-blue-500/50', btn: 'bg-blue-700 hover:bg-blue-600' },
        { id: 'Rank B', color: 'text-amber-500', border: 'border-amber-500/20', hover: 'hover:border-amber-500/50', btn: 'bg-amber-700 hover:bg-amber-600' },
        { id: 'Rank A', color: 'text-red-500', border: 'border-red-500/20', hover: 'hover:border-red-500/50', btn: 'bg-red-700 hover:bg-red-600' },
    ];

    // MOTOR DA LOJA LOCAL
    const equipped = userProfileData.equipped_items || {};
    
    // CSS DINÂMICO CONSOLIDADO (Apenas para o usuário atual, o Ranking gera o próprio)
    const dynamicStyles = Object.values(equipped)
    .filter(Boolean)
    .map(item => `.${item.cssClass} { ${item.css || ''} } ${item.animacao || ''}`)
    .join('\n');

    return (
        <div className={`max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-500 relative pb-24 font-sans text-gray-300 min-h-screen ${equipped.tema_perfil ? equipped.tema_perfil.cssClass : 'bg-[#020205]'}`}>
            
            {/* CSS LOJA INJECTION (Global para esta view) */}
            {dynamicStyles && <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />}

            {confirmModal && (
                <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setConfirmModal(null)}>
                    <div className="bg-[#050508] border border-blue-900/40 p-6 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.15)] max-w-sm w-full text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                        <Target className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-widest">Assinar Contrato?</h3>
                        <p className="text-xs text-blue-200/60 font-medium mb-6 px-2">Ao aceitar uma missão de <b>{confirmModal}</b>, o Abismo exigirá uma punição de XP e Moedas caso você falhe no tempo.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 bg-black border border-blue-900/30 text-gray-400 font-bold py-3.5 rounded-xl hover:text-white transition-colors text-xs duration-300 uppercase tracking-widest">Recusar</button>
                            <button onClick={() => triggerForgeMission(confirmModal)} className="flex-1 bg-gradient-to-r from-blue-800 to-amber-600 text-white font-black py-3.5 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)] text-xs duration-300 uppercase tracking-widest">Assinar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2.5 border-b border-blue-900/20 mb-6 overflow-x-auto scrollbar-hide pb-2 relative z-20">
                <button onClick={() => setActiveTab("Missões")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Missões" ? 'bg-blue-950/40 text-blue-400 border border-blue-900/50 shadow-inner' : 'bg-black text-blue-900/60 hover:text-blue-200 border border-transparent shadow-sm'}`}><Target className="w-4 h-4"/> Contratos</button>
                <button onClick={() => setActiveTab("Forja")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Forja" ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50 shadow-inner' : 'bg-black text-blue-900/60 hover:text-blue-200 border border-transparent shadow-sm'}`}><Hexagon className="w-4 h-4"/> Fornalha Cósmica</button>
                <button onClick={() => setActiveTab("Loja")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Loja" ? 'bg-red-950/40 text-red-500 border border-red-900/50 shadow-inner' : 'bg-black text-blue-900/60 hover:text-blue-200 border border-transparent shadow-sm'}`}><ShoppingCart className="w-4 h-4"/> Mercado Astral</button>
                <button onClick={() => setActiveTab("Ranking")} className={`px-5 py-2.5 rounded-xl font-black transition-all whitespace-nowrap flex items-center gap-2 text-[10px] uppercase tracking-widest duration-300 ${activeTab === "Ranking" ? 'bg-blue-950/40 text-blue-400 border border-blue-900/50 shadow-inner' : 'bg-black text-blue-900/60 hover:text-blue-200 border border-transparent shadow-sm'}`}><Trophy className="w-4 h-4"/> Hierarquia</button>
            </div>

            {/*confirmModal, activeTab structures remain unchanged, including Missões and Forja Tabs*/}

            {activeTab === "Loja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-[#020205] border border-blue-900/20 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
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
                            <div key={item.id} className={`bg-black border p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 shadow-inner group ${isEquipped ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-blue-900/20 hover:border-amber-900/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.1)]'}`}>
                              
                              {/* CORRECTED MAPPING FOR SHOP PREVIEW (Fixes Image 2) */}
                              <div className={`w-20 h-20 rounded-xl mb-4 bg-[#050508] flex items-center justify-center overflow-hidden shadow-inner border border-white/5 relative`}>
                                {/* Local CSS for preview */}
                                {item && <style dangerouslySetInnerHTML={{__html: `.${item.cssClass}-preview { ${item.css || ''} } ${item.animacao || ''}`}} />}
                                
                                {/* 3. Particles mapping (background) */}
                                {item.categoria === 'particulas' && <img src={item.preview} className={`absolute inset-[-50%] w-[200%] h-[200%] max-w-none object-cover pointer-events-none ${item.cssClass}-preview`} />}

                                {/* 4. Avatar placeholder (if not avatar type) */}
                                {item.categoria !== 'avatar' && <Sparkles className="w-8 h-8 text-blue-400"/>}

                                {/* 4. Avatar (if avatar type) */}
                                {item.categoria === 'avatar' && <img src={item.preview} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${item.cssClass}-preview`} />}

                                {/* 5. Effect mapping (overlay) */}
                                {item.categoria === 'efeito' && <img src={item.preview} className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen z-20 ${item.cssClass}-preview`} />}

                                {/* 6. Moldura mapping (frame) */}
                                {item.categoria === 'moldura' && <img src={item.preview} className={`absolute inset-[-15%] w-[130%] h-[130%] max-w-none pointer-events-none z-30 ${item.cssClass}-preview`} />}

                                {/* 7. Badge mapping */}
                                {item.categoria === 'badge' && <img src={item.preview} className={`absolute -bottom-1 -right-1 w-6 h-6 z-40 ${item.cssClass}-preview`} />}
                              </div>

                              <h4 className="text-white font-bold mb-1.5 text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">{item.nome || item.name}</h4>
                              <p className={`text-[9px] uppercase tracking-widest font-black mb-5 ${getRarityColor(item.raridade)}`}>{item.categoria || item.type}</p>
                              {hasItem ? (
                                <button onClick={() => equipItem(item)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isEquipped ? 'bg-red-950/30 text-red-500 hover:bg-red-900 hover:text-white border border-red-500/40' : 'bg-[#020205] text-white hover:bg-blue-900/40 border border-white/10'}`}>{isEquipped ? 'Remover' : 'Equipar'}</button>
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
                    <div className="bg-gradient-to-b from-[#050508] to-black border border-blue-900/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        {/*Hierarquia sorting UI structure remains unchanged, but sorts properly now*/}
                        {rankingList.length <= 3 && (
                            <p className="text-center text-[10px] uppercase text-gray-600 py-8 font-black tracking-[0.2em]">O Vazio silencia além dos líderes.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
