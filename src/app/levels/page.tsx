import Link from 'next/link';
import LevelSelect from '@/components/LevelSelect';

export default function LevelsPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-1">Select Level</h1>
        <p className="text-white/40 text-sm">Complete levels to unlock the next</p>
      </div>
      <LevelSelect />
      <Link href="/" className="text-white/40 hover:text-white text-sm">
        Back to Title
      </Link>
    </main>
  );
}
