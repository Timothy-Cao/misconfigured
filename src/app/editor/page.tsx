'use client';

import Link from 'next/link';
import LevelEditor from '@/components/LevelEditor';

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center py-8 px-4 relative overflow-auto">
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="text-center relative z-10 mb-6 animate-[fadeInUp_0.6s_ease-out]">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
          Level Editor
        </h1>
        <p className="text-white/30 text-sm">Design your own puzzles</p>
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
        <LevelEditor />
      </div>

      <Link
        href="/levels"
        className="relative z-10 text-white/30 hover:text-white/70 text-sm transition-colors duration-300 mt-8 animate-[fadeInUp_0.6s_ease-out_0.3s_both]"
      >
        &larr; Back to Levels
      </Link>
    </main>
  );
}
