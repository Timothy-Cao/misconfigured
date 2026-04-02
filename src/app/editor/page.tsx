'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LevelEditor from '@/components/LevelEditor';

export default function EditorPage() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        router.push('/');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-auto">
      <div className="absolute top-1/4 left-1/3 w-[460px] h-[460px] rounded-full bg-purple-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-[1320px]">
        <div className="text-center mb-6 sm:mb-8 animate-[fadeInUp_0.6s_ease-out]">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
            Level Editor
          </h1>
          <p className="text-white/30 text-sm sm:text-base">Design your own puzzles. Press Esc to return to the title.</p>
        </div>

        <div className="animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
          <LevelEditor />
        </div>
      </div>

      <Link
        href="/"
        className="relative z-10 mt-8 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 animate-[fadeInUp_0.6s_ease-out_0.3s_both]"
      >
        Back to Title
      </Link>
    </main>
  );
}
