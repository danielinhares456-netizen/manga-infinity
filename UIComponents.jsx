import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, Zap, Eye, Hexagon, Lock } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050000] text-red-500 p-10 flex flex-col items-center justify-center font-sans border border-red-900/50">
          <ShieldAlert className="w-16 h-16 mb-4 animate-pulse text-red-600"/>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white text-center">Ruptura no Abismo</h1>
          <p className="mt-2 text-red-400/80 text-sm max-w-lg text-center break-words font-medium">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-red-900/80 hover:bg-red-700 border border-red-500/50 text-white px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">Restaurar Matrix</button>
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
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border flex items-center gap-3 animate-in slide-in-from-top-5 fade-out duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/90 text-red-200 border-red-600/50' : isWarning ? 'bg-amber-950/90 text-amber-200 border-amber-600/50' : isSuccess ? 'bg-emerald-950/90 text-emerald-100 border-emerald-600/50' : 'bg-black/90 text-white border-red-900/30'}`}>
      {isError && <AlertCircle className="w-4 h-4 text-red-500"/>}{isSuccess && <CheckCircle className="w-4 h-4 text-emerald-500"/>}{isWarning && <ShieldAlert className="w-4 h-4 text-amber-500"/>}{!isError && !isSuccess && !isWarning && <Zap className="w-4 h-4 text-red-500 animate-pulse"/>}
      <span className='text-center'>{toast.text}</span>
    </div>
  );
}

export function Footer() {
    return (
        <footer className="w-full bg-[#030000] border-t border-red-900/20 py-12 mt-auto pb-24 md:pb-12 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center w-full">
                <div className="flex justify-center items-center gap-2 mb-5">
                    <Eye className="w-6 h-6 text-red-600" strokeWidth={1.5} />
                    <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-700 tracking-[0.2em] uppercase">MANGÁS ABISSAL</span>
                </div>
                <p className="text-red-900/60 text-[9px] uppercase font-black tracking-[0.2em] mb-4 text-center">Abyssal Mangas - © 2026. O Sangue Resguarda.</p>
                <div className="flex items-center justify-center gap-1.5 opacity-30 mx-auto">
                    <Lock className="w-3 h-3 text-red-500" />
                    <span className="text-[8px] text-red-400 uppercase tracking-widest font-black">Blindado no Vazio SSL</span>
                </div>
            </div>
        </footer>
    );
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#050000] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes vortex-open { 0% { transform: scale(0.5); opacity: 0; filter: blur(30px); } 50% { transform: scale(1.1); opacity: 1; filter: blur(0px); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3); } 70% { box-shadow: 0 0 0 40px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
      `}</style>
      
      <div className="absolute w-[60rem] h-[60rem] bg-gradient-to-tr from-red-900/10 via-[#050000] to-red-800/10 rounded-full blur-[120px] animate-[spin_20s_linear_infinite]"></div>

      <div className="relative z-20 flex flex-col items-center animate-[vortex-open_1.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards] w-full max-w-sm mx-auto text-center">
        <div className="mb-10 relative flex items-center justify-center w-28 h-28 rounded-full animate-[pulse-ring_3s_infinite]">
           <Hexagon className="absolute inset-0 w-full h-full text-red-900 opacity-40 animate-[spin_10s_linear_infinite]" strokeWidth={0.5} />
           <Eye className="w-16 h-16 text-red-600 animate-pulse drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] relative z-10" strokeWidth={1.5} />
           <div className="absolute w-2 h-2 bg-white rounded-full blur-[1px] shadow-[0_0_15px_#fff] z-20 animate-ping"></div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-red-200 to-red-800 tracking-[0.3em] ml-[0.3em] text-center leading-tight uppercase">MANGÁS<br/>ABISSAL</h1>
        <div className="mt-12 text-red-500/80 text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase animate-pulse bg-black/60 px-6 py-2.5 rounded-full border border-red-900/30 backdrop-blur-md shadow-[0_0_15px_rgba(153,27,27,0.3)] text-center mx-auto">ABRINDO O VÓRTICE...</div>
      </div>
    </div>
  );
}
