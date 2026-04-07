import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, Zap, Infinity as InfinityIcon, Aperture, Hexagon, Lock } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020203] text-red-500 p-10 flex flex-col items-center justify-center font-sans border border-red-500/20">
          <ShieldAlert className="w-16 h-16 mb-4 animate-pulse"/>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white text-center">Falha na Matrix</h1>
          <p className="mt-2 text-red-400 text-sm max-w-lg text-center break-words font-medium">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-red-900/50 hover:bg-red-800 border border-red-500/50 text-white px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all">Reiniciar Interface</button>
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
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border flex items-center gap-3 animate-in slide-in-from-top-5 fade-out duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/90 text-red-200 border-red-500/50' : isWarning ? 'bg-amber-950/90 text-amber-200 border-amber-500/50' : isSuccess ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50' : 'bg-black/90 text-white border-white/10'}`}>
      {isError && <AlertCircle className="w-4 h-4 text-red-400"/>}{isSuccess && <CheckCircle className="w-4 h-4 text-emerald-400"/>}{isWarning && <ShieldAlert className="w-4 h-4 text-amber-400"/>}{!isError && !isSuccess && !isWarning && <Zap className="w-4 h-4 text-[#2563eb] animate-pulse"/>}
      <span className='text-center'>{toast.text}</span>
    </div>
  );
}

export function Footer() {
    return (
        <footer className="w-full bg-[#020203] border-t border-white/5 py-12 mt-auto pb-24 md:pb-12 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center w-full">
                <div className="flex justify-center items-center gap-2 mb-5">
                    <InfinityIcon className="w-6 h-6 text-[#6d28d9]" strokeWidth={1.5} />
                    <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 tracking-[0.2em] uppercase">MANGÁS ABISSAL</span>
                </div>
                <p className="text-gray-600 text-[9px] uppercase font-black tracking-[0.2em] mb-4 text-center">Abyssal Mangas - © 2026. O Vazio Resguarda.</p>
                <div className="flex items-center justify-center gap-1.5 opacity-40 mx-auto">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black">Plataforma Segura SSL</span>
                </div>
            </div>
        </footer>
    );
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#020203] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes vortex-open { 0% { transform: scale(0.5); opacity: 0; filter: blur(30px); } 50% { transform: scale(1.1); opacity: 1; filter: blur(0px); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(109, 40, 217, 0.4); } 70% { box-shadow: 0 0 0 30px rgba(109, 40, 217, 0); } 100% { box-shadow: 0 0 0 0 rgba(109, 40, 217, 0); } }
      `}</style>
      
      <div className="absolute w-[60rem] h-[60rem] bg-gradient-to-tr from-[#6d28d9]/10 via-[#020203] to-[#2563eb]/10 rounded-full blur-[120px] animate-[spin_20s_linear_infinite]"></div>

      <div className="relative z-20 flex flex-col items-center animate-[vortex-open_1.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards] w-full max-w-sm mx-auto text-center">
        <div className="mb-10 relative flex items-center justify-center w-28 h-28 rounded-full animate-[pulse-ring_3s_infinite]">
           <Hexagon className="absolute inset-0 w-full h-full text-[#2563eb] opacity-40 animate-[spin_10s_linear_infinite]" strokeWidth={0.5} />
           <Aperture className="w-16 h-16 text-[#6d28d9] animate-[spin_6s_linear_infinite_reverse] drop-shadow-[0_0_20px_rgba(109,40,217,0.8)] relative z-10" strokeWidth={1.5} />
           <div className="absolute w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_15px_#fff] z-20"></div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-700 tracking-[0.3em] ml-[0.3em] text-center leading-tight uppercase">MANGÁS<br/>ABISSAL</h1>
        <div className="mt-12 text-gray-500 text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase animate-pulse bg-black/50 px-6 py-2.5 rounded-full border border-white/5 backdrop-blur-md shadow-inner text-center mx-auto">ABRINDO O VÓRTICE...</div>
      </div>
    </div>
  );
}
