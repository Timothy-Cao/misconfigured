import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-10 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px] animate-[pulse_4s_ease-in-out_infinite]" />

      <div className="text-center relative z-10">
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-[fadeInUp_0.8s_ease-out]">
          Misconfigured
        </h1>
        <p className="text-white/40 text-base sm:text-lg tracking-wide animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          One input. Four characters. Different directions.
        </p>
      </div>

      <Link
        href="/levels"
        className="relative z-10 group px-10 py-4 bg-white/5 text-white rounded-xl text-lg font-semibold border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 animate-[fadeInUp_0.8s_ease-out_0.4s_both] hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
      >
        <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-cyan-300 transition-all duration-300">
          Play
        </span>
      </Link>

      <Link
        href="/editor"
        className="relative z-10 text-white/25 hover:text-white/60 text-sm transition-colors duration-300 animate-[fadeInUp_0.8s_ease-out_0.5s_both]"
      >
        Level Editor
      </Link>

      <Link
        href="/community"
        className="relative z-10 text-white/25 hover:text-white/60 text-sm transition-colors duration-300 animate-[fadeInUp_0.8s_ease-out_0.55s_both]"
      >
        Community Levels
      </Link>

      {/* Decorative player dots */}
      <div className="flex gap-3 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
        {['#ff9a56', '#4ecdc4', '#3b82f6', '#a855f7'].map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}60`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <a
        href="https://timcao.com"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-6 z-10 text-sm sm:text-base font-medium tracking-[0.18em] uppercase text-white/18 hover:text-white/38 transition-colors duration-300 animate-[fadeInUp_0.8s_ease-out_0.7s_both]"
      >
        a tim cao game
      </a>
    </main>
  );
}
