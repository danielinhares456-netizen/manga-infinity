import React, { useState, useEffect } from 'react';
import { MessageSquare, EyeOff, Eye, UserCircle, Zap, X, Loader2, Send } from 'lucide-react';
import { query, collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from '../services/firebase';
import { APP_ID } from '../utils/constants';

export default function CommentsSection({ mangaId, chapterId, user, userProfileData, onRequireLogin, showToast }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [sortOrder, setSortOrder] = useState('desc'); 
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    const path = chapterId ? `obras/${mangaId}/capitulos/${chapterId}/comments` : `obras/${mangaId}/comments`;
    const q = query(collection(db, path));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setComments(list);
    });
    return () => unsub();
  }, [mangaId, chapterId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) return onRequireLogin();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const customAvatar = userProfileData?.avatarUrl || user.photoURL || '';
      const path = chapterId ? `obras/${mangaId}/capitulos/${chapterId}/comments` : `obras/${mangaId}/comments`;
      
      await addDoc(collection(db, path), {
        text: newComment, userId: user.uid, userName: user.displayName || 'Anônimo', userAvatar: customAvatar, 
        createdAt: Date.now(), replyToId: replyingTo ? replyingTo.id : null, replyToUser: replyingTo ? replyingTo.userName : null
      });

      if (replyingTo && replyingTo.userId !== user.uid) {
          await addDoc(collection(db, 'artifacts', APP_ID, 'users', replyingTo.userId, 'notifications'), {
              type: 'reply', text: `${user.displayName || 'Alguém'} respondeu o seu comentário na obra/capítulo atual.`,
              mangaId: mangaId, chapterId: chapterId || null, createdAt: Date.now(), read: false
          });
      }
      setNewComment(''); setReplyingTo(null); showToast("Comentário enviado!", "success");
    } catch(e) { showToast("Erro ao enviar o comentário.", "error"); } finally { setSubmittingComment(false); }
  };

  const sortedComments = [...comments].sort((a, b) => sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  return (
    <div className="bg-[#0d0d12]/60 border border-white/10 rounded-xl p-5 md:p-8 shadow-sm w-full max-w-4xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-black flex items-center gap-2 text-white"><MessageSquare className="w-5 h-5 text-cyan-500"/> Comentários <span className="text-gray-400/60 text-sm">({comments.length})</span></h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
            <button onClick={() => setSortOrder('desc')} className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all duration-300 ${sortOrder === 'desc' ? 'bg-white/5 text-white' : 'text-gray-300/80 hover:text-white'}`}>Recentes</button>
            <button onClick={() => setSortOrder('asc')} className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all duration-300 ${sortOrder === 'asc' ? 'bg-white/5 text-white' : 'text-gray-300/80 hover:text-white'}`}>Antigos</button>
          </div>
          <button onClick={()=>setShowComments(!showComments)} className="bg-[#050508] border border-white/10 text-gray-300/80 hover:text-white rounded-md px-3 py-1.5 transition-colors flex items-center justify-center gap-1.5 font-bold w-full sm:w-auto text-xs duration-300">
             {showComments ? <><EyeOff className="w-3.5 h-3.5"/> Ocultar</> : <><Eye className="w-3.5 h-3.5"/> Mostrar</>}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="animate-in fade-in duration-300 space-y-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 overflow-hidden bg-[#050508] flex-shrink-0 shadow-inner">
               {(userProfileData?.avatarUrl || user?.photoURL) ? <img src={userProfileData.avatarUrl || user.photoURL} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-400/60 bg-[#0d0d12] p-1.5" />}
            </div>
            <div className="flex-1 flex flex-col relative">
                {replyingTo && (
                    <div className="flex justify-between items-center bg-cyan-900/20 px-3 py-2 rounded-t-md border border-cyan-500/30 mb-[-2px] relative z-0">
                        <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1"><Zap className="w-3 h-3"/> Respondendo a @{replyingTo.userName}</span>
                        <button onClick={() => setReplyingTo(null)} className="text-cyan-400 hover:text-white transition-colors"><X className="w-3.5 h-3.5"/></button>
                    </div>
                )}
                <form onSubmit={handlePostComment} className={`relative z-10 ${replyingTo ? 'border-t-0' : ''}`}>
                  <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder={user ? "Deixe o seu comentário..." : "Faça login para interagir."} disabled={!user || submittingComment} className={`w-full bg-[#050508] border border-white/10 px-3 py-3 pr-12 text-white font-medium outline-none focus:border-cyan-500 transition-colors resize-none disabled:opacity-50 text-sm shadow-inner duration-300 ${replyingTo ? 'rounded-b-md rounded-t-none' : 'rounded-md'}`} rows="2" />
                  <button type="submit" disabled={!user || submittingComment || !newComment.trim()} className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white rounded disabled:bg-[#0d0d12] disabled:text-gray-400/60 transition-transform hover:scale-105 shadow-sm duration-300">
                     {submittingComment ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                  </button>
                </form>
            </div>
          </div>

          <div className="space-y-3 mt-6 pt-5 border-t border-white/10">
            {sortedComments.length === 0 ? (
              <div className="py-6 text-center"><MessageSquare className="w-6 h-6 text-gray-400/60 mx-auto mb-2"/><p className="text-gray-400/60 font-bold text-xs">Seja o primeiro a comentar.</p></div>
            ) : (
              sortedComments.map(comment => (
                <div key={comment.id} className={`flex gap-3 p-3 rounded-md bg-[#050508]/50 hover:bg-[#050508] transition-colors border border-transparent hover:border-white/10 ${comment.replyToUser ? 'ml-6 md:ml-10 border-l-cyan-500/30 border-l-2' : ''}`}>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 overflow-hidden bg-[#050508] flex-shrink-0">
                     {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-400/60 bg-[#0d0d12] p-1" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-white text-xs md:text-sm">{comment.userName}</span>
                      <span className="text-[9px] font-bold text-cyan-300 bg-[#0d0d12] border border-white/10 px-1 py-0.5 rounded">{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {comment.replyToUser && <span className="text-cyan-400 font-bold text-[10px] bg-cyan-900/20 px-1 py-0.5 rounded mr-1">@{comment.replyToUser}</span>}
                        {comment.text}
                    </p>
                    <button onClick={() => setReplyingTo(comment)} className="text-[10px] text-gray-400/60 hover:text-cyan-400 font-bold mt-2 flex items-center gap-1 transition-colors"><MessageSquare className="w-3 h-3"/> Responder</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

