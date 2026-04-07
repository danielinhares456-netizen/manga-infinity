import React from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, Zap, Hexagon, Infinity as InfinityIcon } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] text-red-500 p-10 flex flex-col items-center justify-center font-sans">
          <ShieldAlert className="w-16 h-16 mb-4"/>
          <h1 className="text-2xl font-black">Erro Crítico no Sistema</h1>
          <p className="mt-2 text-red-400 text-sm max-w-lg text-center break-words">{this.state.error?.message || 'Erro Desconhecido ao renderizar a interface.'}</p>
          <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-md font-bold">Reiniciar Sistema</button>
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
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-full font-black text-sm border flex items-center gap-3 animate-in slide-in-from-top-5 fade-out duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/95 text-red-300 border-red-500/50' : isWarning ? 'bg-yellow-950/95 text-yellow-300 border-yellow-500/50' : isSuccess ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/50' : 'bg-[#0d0d12]/95 text-white border-white/10'}`}>
      {isError && <AlertCircle className="w-5 h-5"/>}
      {isSuccess && <CheckCircle className="w-5 h-5"/>}
      {isWarning && <ShieldAlert className="w-5 h-5"/>}
      {!isError && !isSuccess && !isWarning && <Zap className="w-5 h-5 text-cyan-400 animate-pulse"/>}
      <span>{toast.text}</span>
    </div>
  );
}

export function Footer() {
    return (
        <footer className="w-full bg-[#050508] border-t border-white/5 py-10 mt-auto pb-24 md:pb-10">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <InfinityIcon className="w-6 h-6 text-cyan-500" />
                    <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 tracking-widest">MANGÁ INFINITY</span>
                </div>
                <p className="text-gray-400/60 text-xs font-medium mb-3">© 2026 Mangá Infinity. Todos os direitos reservados.</p>
                <p className="text-gray-500/50 text-[10px] max-w-2xl mx-auto leading-relaxed">
                    Nenhuma obra é armazenada ou hospedada em nossos servidores. Todo o conteúdo disponibilizado é indexado a partir de fontes públicas e de terceiros na internet.
                </p>
            </div>
        </footer>
    );
}

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#030407] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes surreal-burst { 0% { transform: scale(0.8); opacity: 0; filter: blur(20px); } 50% { transform: scale(1.1); opacity: 1; filter: blur(0px); drop-shadow: 0 0 60px #22d3ee; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes glow-sweep { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes float-inf { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
      `}</style>
      <div className="absolute w-[50rem] h-[50rem] bg-gradient-to-tr from-cyan-900/20 via-[#030407] to-fuchsia-900/10 rounded-full blur-[100px] animate-[spin_12s_linear_infinite]"></div>
      <div className="relative z-10 flex flex-col items-center animate-[surreal-burst_1.2s_ease-out_forwards]">
        <div className="animate-[float-inf_3s_ease-in-out_infinite] mb-8 relative flex items-center justify-center w-32 h-32">
           <Hexagon className="absolute inset-0 w-full h-full text-cyan-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[spin_10s_linear_infinite]" strokeWidth={1} />
           <Hexagon className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] m-auto text-fuchsia-500 drop-shadow-[0_0_20px_rgba(217,70,239,0.8)] animate-[spin_7s_linear_infinite_reverse]" strokeWidth={1} />
           <InfinityIcon className="w-14 h-14 text-white drop-shadow-[0_0_30px_#fff] relative z-10" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 tracking-[0.3em] md:tracking-[0.4em] ml-[0.3em] text-center leading-tight" style={{ backgroundSize: '200% auto', animation: 'glow-sweep 2.5s linear infinite' }}>
          MANGÁ<br/>INFINITY
        </h1>
        <div className="mt-8 text-cyan-400 text-[10px] md:text-xs font-bold tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]">SINCRONIZANDO MULTIVERSO...</div>
      </div>
    </div>
  );
}

