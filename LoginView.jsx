import React, { useState } from 'react';
import { Infinity as InfinityIcon, Loader2, Sparkles } from 'lucide-react';
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
      if(err.code === 'auth/email-already-in-use') msg = "Este e-mail já pertence ao Vazio.";
      if(err.code === 'auth/weak-password') msg = "A senha deve ter no mínimo 6 caracteres.";
      if(err.code === 'custom/missing-name') msg = "Identifique-se, Viajante.";
      setError(msg); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Elementos Surreais Flutuantes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-fuchsia-400 rounded-full shadow-[0_0_15px_#d946ef] animate-pulse"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="bg-[#0a0a0f]/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 sm:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-fuchsia-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <InfinityIcon className="w-10 h-10 text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-wide">
              {isLogin ? 'O ABISMO' : 'SINGULARIDADE'}
            </h2>
            <p className="text-gray-400/60 mt-3 text-sm font-medium tracking-wide">
              {isLogin ? 'Adentre o vazio e continue sua jornada.' : 'Forje sua existência no infinito.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-bold text-center animate-in zoom-in-95">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative group">
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Como devemos chamá-lo?" className="w-full bg-[#050508]/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 focus:bg-[#0a0a0f] transition-all font-medium text-sm peer" required />
              </div>
            )}
            <div className="relative group">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Eco de Contato (E-mail)" className="w-full bg-[#050508]/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 focus:bg-[#0a0a0f] transition-all font-medium text-sm" required />
            </div>
            <div className="relative group">
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Selo de Acesso (Senha)" className="w-full bg-[#050508]/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 focus:bg-[#0a0a0f] transition-all font-medium text-sm" required />
            </div>

            <button type="submit" disabled={loading} className="w-full relative group overflow-hidden rounded-xl mt-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-fuchsia-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative px-6 py-4 flex justify-center items-center gap-2 text-white font-black text-sm tracking-widest uppercase">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Romper o Véu' : 'Manifestar')}
                {!loading && <Sparkles className="w-4 h-4 opacity-70" />}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-4">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-gray-400 hover:text-cyan-400 text-sm font-bold transition-colors">
              {isLogin ? 'Não possui um elo? Criar agora' : 'Já possui um elo? Conectar-se'}
            </button>
            <button onClick={onGuestAccess} className="text-gray-500/50 hover:text-white/80 text-xs font-bold uppercase tracking-widest transition-colors">
              Vagar pelas sombras (Visitante)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
