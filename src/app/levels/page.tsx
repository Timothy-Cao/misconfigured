'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthControls from '@/components/AuthControls';
import LevelSelect from '@/components/LevelSelect';

export default function LevelsPage() {
  const router = useRouter();

  useEffect(() => {
    function goBackOrHome() {
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push('/');
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        goBackOrHome();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center p-6 sm:p-8 lg:p-10 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[480px] h-[480px] rounded-full bg-green-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6 animate-[fadeInUp_0.6s_ease-out]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                Select Level
              </h1>
              <p className="text-white/30 text-sm sm:text-base">Finish levels to unlock the path ahead. Press Esc to go back.</p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <AuthControls className="justify-start sm:justify-end" />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/editor"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
                >
                  Editor
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
                >
                  Community
                </Link>
                <Link
                  href="/my-maps"
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm sm:text-base text-cyan-100 hover:bg-cyan-500/20 transition-all duration-300"
                >
                  My Maps
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-8 sm:px-10 sm:py-10 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
          <LevelSelect />
          <p className="mt-5 text-center text-xs text-white/25 sm:text-sm">
            `Esc` goes back. Completed levels show a checkmark.
          </p>
        </div>
      </div>
    </main>
  );
}
