import Link from 'next/link';
import MenuLinkedUnits from '@/components/MenuLinkedUnits';
import MusicVolumeControl from '@/components/MusicVolumeControl';

export default function Home() {
  return (
    <main className="min-h-[calc(100svh-4rem)] bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-10 relative overflow-x-hidden sm:min-h-[calc(100svh-5rem)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-purple-500/5 blur-[140px] animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[360px] h-[360px] rounded-full bg-cyan-500/5 blur-[110px] animate-[pulse_4s_ease-in-out_infinite]" />

      <div className="relative z-10 w-full max-w-5xl">
        <MenuLinkedUnits />
        <div className="mx-auto w-full max-w-3xl text-center rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-10 sm:px-10 sm:py-12 shadow-[0_0_50px_rgba(0,0,0,0.25)]">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-[fadeInUp_0.8s_ease-out]">
            Misconfigured
          </h1>

          <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:gap-4 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
            <Link
              href="/levels"
              className="group w-full rounded-2xl border border-emerald-300/40 bg-emerald-400/18 px-10 py-4 text-lg font-black uppercase tracking-[0.12em] text-emerald-50 shadow-[0_0_32px_rgba(52,211,153,0.16)] transition-all duration-300 hover:border-emerald-200/70 hover:bg-emerald-400/28 hover:shadow-[0_0_44px_rgba(52,211,153,0.24)] sm:py-5 sm:text-xl"
            >
              <span className="bg-gradient-to-r from-white via-emerald-50 to-emerald-200 bg-clip-text text-transparent transition-all duration-300 group-hover:to-white">
                Play Campaign
              </span>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/my-maps"
                className="group px-6 py-4 rounded-2xl border border-white/10 bg-white/[0.04] text-white/85 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
              >
                <span className="block text-base sm:text-lg font-semibold">My Maps</span>
              </Link>
              <Link
                href="/community"
                className="group px-6 py-4 rounded-2xl border border-white/10 bg-white/[0.04] text-white/85 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
              >
                <span className="block text-base sm:text-lg font-semibold">Community Levels</span>
              </Link>
            </div>
          </div>

          <MusicVolumeControl />

          <div className="mt-8 flex justify-center gap-3 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
            {['#ff9a56', '#4ecdc4', '#3b82f6', '#a855f7'].map((color, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-sm"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}60`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <a
        href="https://timcao.com"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-6 z-10 text-base sm:text-lg font-medium tracking-[0.18em] uppercase text-white/22 hover:text-white/40 transition-colors duration-300 animate-[fadeInUp_0.8s_ease-out_0.7s_both]"
      >
        a tim cao game
      </a>
    </main>
  );
}
