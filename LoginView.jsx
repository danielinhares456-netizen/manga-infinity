import React, { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from '../services/firebase';

export default function LoginView({ onLoginSuccess, onGuestAccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) { 
        await signInWithEmailAndPassword(auth, email, password); 
        onLoginSuccess(); 
      } else {
        if (!name.trim()) throw { code: 'custom/missing-name' };
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        onLoginSuccess(); 
      }
    } catch (err) { 
      let msg = "Erro ao autenticar. Verifique os seus dados.";
      if(err.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
      if(err.code === 'auth/weak-password') msg = "A senha deve ter 6 caracteres.";
      if(err.code === 'custom/missing-name') msg = "Preencha o seu nome.";
      setError(msg); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030407] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="bg-[#0d0d12]/80 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-xl shadow-[0_0_50px_-10px_rgba(34,211,238,0.1)] p-8 z-10 relative animate-in slide-in-from-bottom-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#050508] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/10"><BookOpen className="w-8 h-8 text-cyan-400" /></div>
          <h2 className="text-2xl font-black text-white">{isLogin ? 'Bem-vindo de volta' : 'Despertar'}</h2>
          <p className="text-gray-400/60 mt-2 text-sm font-medium">Faça login para favoritar e guardar o seu progresso.</p>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-md mb-5 text-sm font-bold border border-red-500/20 text-center animate-in zoom-in-95">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Monarca das Sombras" className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors font-medium text-sm" required />}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu.email@dominio.com" className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors font-medium text-sm" required />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha secreta (Mín. 6 caracteres)" className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors font-medium text-sm" required />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-md mt-4 flex justify-center items-center gap-2 transition-all shadow-[0_10px_30px_-10px_rgba(217,70,239,0.3)] disabled:opacity-70 hover:scale-[1.02] duration-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Acessar Infinity' : 'Criar Conta')}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-4 text-center">
          <p className="text-gray-400/60 text-sm font-medium">
            {isLogin ? "Ainda não possui conta? " : "Já possui conta? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-cyan-400 font-black hover:text-cyan-300 transition-colors duration-300">{isLogin ? 'Cadastrar de Graça' : 'Fazer login'}</button>
          </p>
          <div className="w-full h-px bg-white/10 my-1"></div>
          <button onClick={onGuestAccess} className="text-gray-300/80 font-bold hover:text-white transition-colors duration-300 text-sm">Explorar sem login (Visitante)</button>
        </div>
      </div>
    </div>
  );
}

