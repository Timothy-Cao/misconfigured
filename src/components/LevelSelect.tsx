'use client';

import Link from 'next/link';
import { useGameProgress } from '@/hooks/useGameProgress';
import { TOTAL_LEVELS } from '@/levels';

export default function LevelSelect() {
  const { progress, isUnlocked } = useGameProgress();

  return (
    <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
      {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
        const id = i + 1;
        const unlocked = isUnlocked(id);
        const completed = progress.completedLevels.includes(id);

        if (!unlocked) {
          return (
            <div
              key={id}
              className="aspect-square flex items-center justify-center rounded bg-white/5 text-white/20 font-mono text-lg cursor-not-allowed"
            >
              {id}
            </div>
          );
        }

        return (
          <Link
            key={id}
            href={`/play/${id}`}
            className={`aspect-square flex items-center justify-center rounded font-mono text-lg transition-colors ${
              completed
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            {completed ? '✓' : id}
          </Link>
        );
      })}
    </div>
  );
}
