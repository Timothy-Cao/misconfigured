'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LevelEditor from '@/components/LevelEditor';

export default function EditorPage() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (document.body.dataset.editorPreview === 'true') {
        return;
      }
      if (event.key === 'Escape') {
        router.push('/');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className="h-[100svh] bg-[#0a0a0f] flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-8 relative overflow-y-auto overflow-x-hidden">
      <div className="absolute top-1/4 left-1/3 w-[460px] h-[460px] rounded-full bg-purple-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-[1440px] pt-4 sm:pt-6">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6 animate-[fadeInUp_0.6s_ease-out]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                Level Editor
              </h1>
              <p className="text-white/30 text-sm sm:text-base">Design your own puzzles. Press Esc to return to the title.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/community"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
              >
                Community
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
              >
                Back to Title
              </Link>
            </div>
          </div>
        </div>

        <div className="animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
          <LevelEditor />
        </div>
      </div>
    </main>
  );
}
