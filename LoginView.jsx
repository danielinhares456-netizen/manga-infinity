import React, { useState } from 'react';
import { Loader2, Sparkles, Fingerprint, Lock, BookOpen, Hexagon, Eye } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from './firebase';

export function LoginView({ onLoginSuccess, onGuestAccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) { await signInWithEmailAndPassword(auth, email, password); onLoginSuccess(); } 
      else {
        if (!name.trim()) throw { code: 'custom/missing-name' };
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        onLoginSuccess(); 
      }
    } catch (err) { 
      let msg = "Falha no acesso. Verifique suas credenciais.";
      if(err.code === 'auth/email-already-in-use') msg = "Este eco já pertence ao Abismo.";
      if(err.code === 'auth/weak-password') msg = "A senha deve ter no mínimo 6 fragmentos.";
      if(err.code === 'custom/missing-name') msg = "Identifique-se, Viajante.";
      setError(msg); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      <style>{`
        @keyframes drift { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; } 50% { transform: translate(30px, -20px) scale(1.05); opacity: 0.3; } }
      `}</style>
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[130px] animate-[drift_15s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-red-900/5 rounded-full blur-[130px] animate-[drift_18s_ease-in-out_infinite_reverse]"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="bg-[#050508]/80 backdrop-blur-3xl border border-blue-900/30 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_80px_rgba(37,99,235,0.1)] relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          
          <div className="text-center mb-10 relative z-10">
            
            {/* NEW DIGNIFIED BOOK ICON LOGO ON LOGIN */}
            <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-red-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
               <Hexagon className="absolute inset-[-10%] w-[120%] h-[120%] text-blue-500/40 animate-[spin_10s_linear_infinite]" strokeWidth={1} />
               <Hexagon className="absolute inset-0 w-full h-full text-red-500/40 animate-[spin_7s_linear_infinite_reverse]" strokeWidth={1} />
               <BookOpen className="w-12 h-12 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] relative z-10" />
               <Eye className="w-5 h-5 text-red-500 absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            </div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-700 tracking-tight">
              {isLogin ? 'O ABISMO' : 'SINGULARIDADE'}
            <br/>
            <span className='text-[10px] font-black text-amber-500 tracking-[0.4em] uppercase'>MANGÁS ABISSAL</span>
            </h2>
            <p className="text-blue-100/50 mt-3 text-xs font-medium tracking-wide">
              {isLogin ? 'O Vazio aguarda seu retorno, Viajante.' : 'Forje sua existência na Escuridão.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-xs font-bold text-center animate-in zoom-in-95 shadow-inner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {!isLogin && (
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 opacity-70"/>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Identidade (Ex: Lorde Abissal)" className="w-full bg-[#020205] border border-blue-900/30 rounded-xl pl-11 pr-4 py-4 text-blue-50 outline-none focus:border-blue-500/50 transition-all font-medium text-xs peer shadow-inner" required />
              </div>
            )}
            <div className="relative group">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Eco Cósmico (E-mail)" className="w-full bg-[#020205] border border-blue-900/30 rounded-xl px-5 py-4 text-blue-50 outline-none focus:border-blue-500/50 transition-all font-medium text-xs peer shadow-inner text-center" required />
            </div>
            <div className="relative group">
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Chave de Acesso (Senha)" className="w-full bg-[#020205] border border-blue-900/30 rounded-xl px-5 py-4 text-blue-50 outline-none focus:border-blue-500/50 transition-all font-medium text-xs peer shadow-inner text-center" required />
            </div>

            <button type="submit" disabled={loading} className="w-full relative group overflow-hidden rounded-xl mt-4 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-red-700 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"></div>
              <div className="relative px-6 py-4 flex justify-center items-center gap-2 text-white font-black text-xs tracking-widest uppercase shadow-md">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Romper o Véu' : 'Manifestar Alma')}
                {!loading && <Sparkles className="w-3.5 h-3.5 opacity-70 text-amber-400" />}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-blue-900/20 text-center flex flex-col gap-4 relative z-10">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-500/80 hover:text-amber-400 text-[11px] uppercase tracking-wider font-black transition-colors">
              {isLogin ? 'Sem Elo? Despertar agora' : 'Já possui um Elo? Conectar-se'}
            </button>
            <button onClick={onGuestAccess} className="text-gray-600 hover:text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] transition-colors">
              Vagar pelas sombras (Acesso Visitante)
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-2 opacity-50">
            <Lock className="w-3 h-3 text-blue-600" />
            <span className="text-[9px] text-blue-500 uppercase tracking-widest font-black">Conexão Blindada SSL</span>
        </div>
      </div>
    </div>
  );
}
