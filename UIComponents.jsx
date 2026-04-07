import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, Zap, Lock, Sparkles } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020202] text-amber-500 p-10 flex flex-col items-center justify-center font-sans border border-amber-900/30">
          <ShieldAlert className="w-16 h-16 mb-4 animate-pulse text-amber-600"/>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white text-center">Fenda no Sistema</h1>
          <p className="mt-2 text-amber-400/80 text-sm max-w-lg text-center break-words font-medium">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-amber-900/50 hover:bg-amber-700 border border-amber-500/50 text-white px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">Restaurar Conexão</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function GlobalToast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border flex items-center gap-3 animate-in slide-in-from-top-5 fade-out duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/90 text-red-200 border-red-600/50' : isWarning ? 'bg-amber-950/90 text-amber-200 border-amber-600/50' : isSuccess ? 'bg-[#0a0802]/95 text-amber-300 border-amber-500/50' : 'bg-[#050505]/95 text-gray-300 border-gray-700/50'}`}>
      {isError && <AlertCircle className="w-4 h-4 text-red-500"/>}{isSuccess && <CheckCircle className="w-4 h-4 text-amber-500"/>}{isWarning && <ShieldAlert className="w-4 h-4 text-amber-500"/>}{!isError && !isSuccess && !isWarning && <Zap className="w-4 h-4 text-amber-400 animate-pulse"/>}
      <span className='text-center'>{toast.text}</span>
    </div>
  );
}

export function Footer() {
    return (
        <footer className="w-full bg-[#020202] border-t border-amber-900/20 py-12 mt-auto pb-24 md:pb-12 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center w-full">
                <div className="flex justify-center items-center gap-3 mb-5">
                    <img src="https://i.ibb.co/Kp4zvh5k/1775571067773.png" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" alt="Logo" />
                    <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-600 tracking-[0.2em] uppercase">MANGÁS ABISSAL</span>
                </div>
                <p className="text-amber-900/50 text-[9px] uppercase font-black tracking-[0.2em] mb-4 text-center">Abyssal Mangas - © 2026. O Vazio Resguarda.</p>
                <div className="flex items-center justify-center gap-1.5 opacity-40 mx-auto">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span className="text-[8px] text-amber-500 uppercase tracking-widest font-black">Blindado no Vazio SSL</span>
                </div>
            </div>
        </footer>
    );
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#020202] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes vortex-open { 0% { transform: scale(0.8); opacity: 0; filter: blur(20px); } 50% { transform: scale(1.05); opacity: 1; filter: blur(0px); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.15); } 70% { box-shadow: 0 0 0 40px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
      `}</style>
      
      <div className="absolute w-[60rem] h-[60rem] bg-gradient-to-tr from-amber-900/10 via-[#020202] to-yellow-900/5 rounded-full blur-[120px] animate-[spin_25s_linear_infinite]"></div>

      <div className="relative z-20 flex flex-col items-center animate-[vortex-open_1.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards] w-full max-w-sm mx-auto text-center">
        <div className="mb-10 relative flex items-center justify-center w-32 h-32 rounded-full animate-[pulse-ring_4s_infinite]">
           <img src="https://i.ibb.co/Kp4zvh5k/1775571067773.png" className="w-24 h-24 relative z-10 drop-shadow-[0_0_25px_rgba(245,158,11,0.8)] animate-pulse" alt="Logo" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-700 tracking-[0.3em] ml-[0.3em] text-center leading-tight uppercase">MANGÁS<br/>ABISSAL</h1>
        <div className="mt-12 text-amber-500 text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase animate-pulse bg-[#0a0802]/80 px-6 py-2.5 rounded-full border border-amber-900/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)] text-center mx-auto">CONECTANDO AO VAZIO...</div>
      </div>
    </div>
  );
}
