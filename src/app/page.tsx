import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-2">Misconfigured</h1>
        <p className="text-white/50 text-sm">One input. Four characters. Different directions.</p>
      </div>
      <Link
        href="/levels"
        className="px-8 py-3 bg-white/10 text-white rounded-lg text-lg font-semibold border border-white/20 hover:bg-white/20 transition-colors"
      >
        Play
      </Link>
    </main>
  );
}
