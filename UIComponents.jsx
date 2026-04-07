import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle, Zap, Infinity as InfinityIcon, Hexagon } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020203] text-red-500 p-10 flex flex-col items-center justify-center font-sans border border-red-500/20">
          <ShieldAlert className="w-16 h-16 mb-4 animate-pulse"/>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Falha Crítica na Matrix</h1>
          <p className="mt-2 text-red-400 text-sm max-w-lg text-center break-words font-medium">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="mt-6 bg-red-800 text-white px-8 py-3 rounded-md font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-red-700 transition-colors">Reiniciar Interface</button>
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
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-xl font-black text-sm border flex items-center gap-3 animate-in slide-in-from-top-5 fade-out duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/90 text-red-200 border-red-500/50' : isWarning ? 'bg-amber-950/90 text-amber-200 border-amber-500/50' : isSuccess ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50' : 'bg-black/80 text-white border-white/5'}`}>
      {isError && <AlertCircle className="w-5 h-5 text-red-400"/>}{isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400"/>}{isWarning && <ShieldAlert className="w-5 h-5 text-amber-400"/>}{!isError && !isSuccess && !isWarning && <Zap className="w-5 h-5 text-[#2563eb] animate-pulse"/>}
      <span className='tracking-wide'>{toast.text}</span>
    </div>
  );
}

export function Footer() {
    return (
        <footer className="w-full bg-[#020203] border-t border-white/5 py-10 mt-auto pb-24 md:pb-10 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
                <div className="flex justify-center items-center gap-2 mb-4"><InfinityIcon className="w-6 h-6 text-[#2563eb]" strokeWidth={1.5} /><span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 tracking-[0.2em] uppercase">MANGÁS ABISSAL</span></div>
                <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest mb-3">Abyssal Mangas - © 2026. Todos os direitos reservados.</p>
                <p className="text-gray-700 text-[10px] max-w-2xl mx-auto leading-relaxed font-medium">Nenhuma obra é hospedada nos nossos servidores do Vazio.</p>
            </div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-[#6d28d9]/5 rounded-full blur-[80px]"></div>
        </footer>
    );
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#020203] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes surreal-descend {
            0% { transform: translateY(-50px) scale(1); opacity: 0; filter: blur(10px); }
            50% { transform: translateY(0) scale(1.05); opacity: 1; filter: blur(0px); drop-shadow: 0 0 40px #6d28d9; }
            100% { transform: translateY(20px) scale(1); opacity: 0; filter: blur(5px); }
        }
        @keyframes float-abyss { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(1.02); } }
        .triangle {
            position: absolute; border-style: solid; border-color: transparent transparent #6d28d9 transparent;
            opacity: 0; animation: surreal-descend 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* Triângulos Surreais Descendo */}
      {Array(6).fill('').map((_,i) => (
          <div key={i} className="triangle" style={{
              borderWidth: `0 ${30 + i*15}px ${50 + i*25}px ${30 + i*15}px`,
              borderColor: `transparent transparent ${i%2===0 ? '#2563eb' : '#6d28d9'} transparent`,
              animationDelay: `${i*0.5}s`,
              bottom: `${10 + i*15}%`,
              opacity: 1 - i*0.15
          }}></div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-transparent to-transparent z-10"></div>

      <div className="relative z-20 flex flex-col items-center animate-[float-abyss_4s_ease-in-out_infinite]">
        <div className="mb-10 relative flex items-center justify-center w-28 h-28">
           <Hexagon className="absolute inset-0 w-full h-full text-[#6d28d9] opacity-50 animate-[spin_15s_linear_infinite]" strokeWidth={0.5} />
           <Hexagon className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] text-[#2563eb] animate-[spin_10s_linear_infinite_reverse]" strokeWidth={1} />
           <InfinityIcon className="w-14 h-14 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] relative z-10" strokeWidth={1} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-700 tracking-[0.3em] md:tracking-[0.4em] ml-[0.3em] text-center leading-tight uppercase shadow-sm">MANGÁS<br/>ABISSAL</h1>
        <div className="mt-10 text-white text-[10px] md:text-xs font-black tracking-[0.5em] uppercase animate-pulse shadow-xl bg-black/40 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm">MERGULHANDO NO ABISMO...</div>
      </div>
    </div>
  );
}
