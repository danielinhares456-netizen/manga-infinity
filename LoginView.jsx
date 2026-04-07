import React, { useState } from 'react';
import { Infinity as InfinityIcon, Loader2, Sparkles, Fingerprint, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      <style>{`
        @keyframes drift { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; } 50% { transform: translate(30px, -20px) scale(1.1); opacity: 0.4; } }
        @keyframes drift-rev { 0%, 100% { transform: translate(0, 0) scale(1.1); opacity: 0.3; } 50% { transform: translate(-30px, 20px) scale(1); opacity: 0.15; } }
      `}</style>
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#6d28d9]/20 rounded-full blur-[130px] animate-[drift_12s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#2563eb]/20 rounded-full blur-[130px] animate-[drift-rev_15s_ease-in-out_infinite]"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="bg-black/50 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2563eb]/50 to-transparent"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="w-16 h-16 mx-auto mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#6d28d9] to-[#2563eb] rounded-full blur-xl opacity-40 animate-pulse"></div>
              <InfinityIcon className="w-10 h-10 text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-300 to-gray-600 tracking-tight">
              {isLogin ? 'O ABISMO' : 'SINGULARIDADE'}
            <br/>
            <span className='text-[10px] font-black text-[#6d28d9] tracking-[0.4em] uppercase'>MANGÁS ABISSAL</span>
            </h2>
            <p className="text-gray-400/60 mt-3 text-xs font-medium tracking-wide">
              {isLogin ? 'Adentre o vazio e continue sua jornada cósmica.' : 'Forje sua existência no infinito do Vazio.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-xs font-bold text-center animate-in zoom-in-95 shadow-inner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {!isLogin && (
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d28d9] opacity-70"/>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Identidade do Vazio (Ex: Caçador)" className="w-full bg-[#050508]/80 border border-white/5 rounded-xl pl-11 pr-4 py-4 text-white outline-none focus:border-[#2563eb]/50 focus:bg-black transition-all font-medium text-xs peer shadow-inner" required />
              </div>
            )}
            <div className="relative group">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Eco Cósmico (E-mail)" className="w-full bg-[#050508]/80 border border-white/5 rounded-xl px-5 py-4 text-white outline-none focus:border-[#2563eb]/50 focus:bg-black transition-all font-medium text-xs peer shadow-inner text-center" required />
            </div>
            <div className="relative group">
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Chave de Alma (Senha)" className="w-full bg-[#050508]/80 border border-white/5 rounded-xl px-5 py-4 text-white outline-none focus:border-[#2563eb]/50 focus:bg-black transition-all font-medium text-xs peer shadow-inner text-center" required />
            </div>

            <button type="submit" disabled={loading} className="w-full relative group overflow-hidden rounded-xl mt-4 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6d28d9] to-[#2563eb] opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"></div>
              <div className="relative px-6 py-4 flex justify-center items-center gap-2 text-white font-black text-xs tracking-widest uppercase shadow-md">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Romper o Véu' : 'Manifestar')}
                {!loading && <Sparkles className="w-3.5 h-3.5 opacity-70" />}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-4 relative z-10">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-gray-400 hover:text-[#2563eb] text-[11px] uppercase tracking-wider font-black transition-colors">
              {isLogin ? 'Sem Elo? Despertar agora' : 'Já possui um Elo? Conectar-se'}
            </button>
            <button onClick={onGuestAccess} className="text-gray-600 hover:text-gray-300 text-[9px] font-black uppercase tracking-[0.2em] transition-colors">
              Vagar pelas sombras (Acesso Visitante)
            </button>
          </div>
        </div>
        
        {/* Badge de Segurança */}
        <div className="mt-8 flex justify-center items-center gap-2 opacity-50">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Conexão Criptografada SSL/TLS</span>
        </div>
      </div>
    </div>
  );
}
