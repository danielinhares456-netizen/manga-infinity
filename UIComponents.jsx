export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#030407] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`@keyframes surreal-burst { 0% { transform: scale(0.8); opacity: 0; filter: blur(20px); } 50% { transform: scale(1.1); opacity: 1; filter: blur(0px); drop-shadow: 0 0 60px #22d3ee; } 100% { transform: scale(1); opacity: 1; } } @keyframes glow-sweep { 0% { background-position: -200% center; } 100% { background-position: 200% center; } } @keyframes float-inf { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }`}</style>
      <div className="absolute w-[50rem] h-[50rem] bg-gradient-to-tr from-cyan-900/20 via-[#030407] to-fuchsia-900/10 rounded-full blur-[100px] animate-[spin_12s_linear_infinite]"></div>
      <div className="relative z-10 flex flex-col items-center animate-[surreal-burst_1.2s_ease-out_forwards]">
        <div className="animate-[float-inf_3s_ease-in-out_infinite] mb-8 relative flex items-center justify-center w-32 h-32">
           <Hexagon className="absolute inset-0 w-full h-full text-cyan-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[spin_10s_linear_infinite]" strokeWidth={1} />
           <Hexagon className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] m-auto text-fuchsia-500 drop-shadow-[0_0_20px_rgba(217,70,239,0.8)] animate-[spin_7s_linear_infinite_reverse]" strokeWidth={1} />
           <InfinityIcon className="w-14 h-14 text-white drop-shadow-[0_0_30px_#fff] relative z-10" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 tracking-[0.3em] md:tracking-[0.4em] ml-[0.3em] text-center leading-tight" style={{ backgroundSize: '200% auto', animation: 'glow-sweep 2.5s linear infinite' }}>MANGÁ<br/>INFINITY</h1>
        <div className="mt-8 text-cyan-400 text-[10px] md:text-xs font-bold tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]">MERGULHANDO NO ABISMO...</div>
      </div>
    </div>
  );
}
