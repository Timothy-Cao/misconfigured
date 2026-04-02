import Link from 'next/link';
import LevelSelect from '@/components/LevelSelect';

export default function LevelsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-10 p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-green-500/5 blur-[100px]" />

      <div className="text-center relative z-10 animate-[fadeInUp_0.6s_ease-out]">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
          Select Level
        </h1>
        <p className="text-white/30 text-sm">Complete levels to unlock the next</p>
      </div>

      <div className="relative z-10 animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
        <LevelSelect />
      </div>

      <Link
        href="/"
        className="relative z-10 text-white/30 hover:text-white/70 text-sm transition-colors duration-300 animate-[fadeInUp_0.6s_ease-out_0.3s_both]"
      >
        &larr; Back to Title
      </Link>
    </main>
  );
}
