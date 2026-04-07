import React, { useState } from 'react';
import { Loader2, Sparkles, Fingerprint, Lock } from 'lucide-react';
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
      if(err.code === 'auth/email-already-in-use') msg = "Este eco de alma já pertence ao Abismo.";
      if(err.code === 'auth/weak-password') msg = "A senha deve ter no mínimo 6 fragmentos.";
      if(err.code === 'custom/missing-name') msg = "Identifique-se, Viajante.";
      setError(msg); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      <style>{`
        @keyframes drift { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; } 50% { transform: translate(30px, -20px) scale(1.05); opacity: 0.3; } }
      `}</style>
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-amber-900/10 rounded-full blur-[130px] animate-[drift_15s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-yellow-900/5 rounded-full blur-[130px] animate-[drift_18s_ease-in-out_infinite_reverse]"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="bg-[#050402]/70 backdrop-blur-3xl border border-amber-900/20 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_80px_rgba(245,158,11,0.1)] relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-900 to-yellow-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <img src="https://i.ibb.co/Kp4zvh5k/1775571067773.png" className="w-16 h-16 relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]" alt="Logo" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-50 to-amber-700 tracking-tight">
              {isLogin ? 'O ABISMO' : 'SINGULARIDADE'}
            <br/>
            <span className='text-[10px] font-black text-amber-600 tracking-[0.4em] uppercase'>MANGÁS ABISSAL</span>
            </h2>
            <p className="text-amber-100/50 mt-3 text-xs font-medium tracking-wide">
              {isLogin ? 'O Vazio aguarda seu retorno, Viajante.' : 'Forje sua existência no Ouro Cósmico.'}
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
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 opacity-70"/>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Identidade (Ex: Lorde Dourado)" className="w-full bg-[#030201] border border-amber-900/30 rounded-xl pl-11 pr-4 py-4 text-amber-50 outline-none focus:border-amber-500/50 transition-all font-medium text-xs peer shadow-inner" required />
              </div>
            )}
            <div className="relative group">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Eco Cósmico (E-mail)" className="w-full bg-[#030201] border border-amber-900/30 rounded-xl px-5 py-4 text-amber-50 outline-none focus:border-amber-500/50 transition-all font-medium text-xs peer shadow-inner text-center" required />
            </div>
            <div className="relative group">
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Chave de Acesso (Senha)" className="w-full bg-[#030201] border border-amber-900/30 rounded-xl px-5 py-4 text-amber-50 outline-none focus:border-amber-500/50 transition-all font-medium text-xs peer shadow-inner text-center" required />
            </div>

            <button type="submit" disabled={loading} className="w-full relative group overflow-hidden rounded-xl mt-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700 to-yellow-600 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"></div>
              <div className="relative px-6 py-4 flex justify-center items-center gap-2 text-white font-black text-xs tracking-widest uppercase shadow-md">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Romper o Véu' : 'Manifestar Alma')}
                {!loading && <Sparkles className="w-3.5 h-3.5 opacity-70" />}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-amber-900/20 text-center flex flex-col gap-4 relative z-10">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-amber-500/80 hover:text-amber-400 text-[11px] uppercase tracking-wider font-black transition-colors">
              {isLogin ? 'Sem Elo? Despertar agora' : 'Já possui um Elo? Conectar-se'}
            </button>
            <button onClick={onGuestAccess} className="text-gray-600 hover:text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] transition-colors">
              Vagar pelas sombras (Acesso Visitante)
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-2 opacity-50">
            <Lock className="w-3 h-3 text-amber-600" />
            <span className="text-[9px] text-amber-500 uppercase tracking-widest font-black">Conexão Blindada SSL</span>
        </div>
      </div>
    </div>
  );
}
