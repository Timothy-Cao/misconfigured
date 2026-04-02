'use client';

import { useState, useCallback } from 'react';
import GameCanvas from '@/components/GameCanvas';
import type { LevelData } from '@/engine/types';

const DEFAULT_LEVEL = `{
  "id": 99,
  "name": "Test Level",
  "width": 8,
  "height": 6,
  "grid": [
    [0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,0],
    [0,1,38,1,1,39,1,0],
    [0,1,1,80,1,1,1,0],
    [0,3,1,1,1,1,3,0],
    [0,0,0,0,0,0,0,0]
  ],
  "players": [
    {"startX":1,"startY":1,"rotation":0},
    {"startX":6,"startY":1,"rotation":1},
    {"startX":1,"startY":4,"rotation":2},
    {"startX":6,"startY":4,"rotation":3}
  ]
}`;

export default function TestPage() {
  const [json, setJson] = useState(DEFAULT_LEVEL);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const loadLevel = useCallback(() => {
    try {
      const parsed = JSON.parse(json) as LevelData;
      if (!parsed.grid || !parsed.players || !parsed.width || !parsed.height) {
        throw new Error('Missing required fields');
      }
      setLevel(parsed);
      setError(null);
      setKey(k => k + 1);
    } catch (e) {
      setError(String(e));
    }
  }, [json]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-mono text-purple-400 mb-4">Test Level</h1>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* JSON editor */}
          <div className="lg:w-96 shrink-0">
            <textarea
              value={json}
              onChange={e => setJson(e.target.value)}
              className="w-full h-80 bg-white/5 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 focus:outline-none focus:border-purple-500/50 resize-y"
              spellCheck={false}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={loadLevel}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:bg-purple-500/30 transition-all"
              >
                Load Level
              </button>
              <button
                onClick={() => { setLevel(null); setKey(k => k + 1); }}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/40 hover:text-white/60 transition-all"
              >
                Clear
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}

            <div className="mt-4 text-white/30 text-xs font-mono space-y-1">
              <p>Tile values: 0=void, 1=floor, 2=kill, 3=goal, 4=checkpoint, 5=pushable</p>
              <p>6=ice, 7=mud, 8=crumble, 9=reverse, 80=blackhole</p>
              <p>10-18=plates, 20-28=doors, 30-33=conveyor(URDL)</p>
              <p>34-37=oneway(URDL), 38=CW, 39=CCW</p>
              <p>60-68=toggleSw, 70-78=toggleBlk</p>
            </div>
          </div>

          {/* Game canvas */}
          <div className="flex-1 flex justify-center items-start">
            {level && (
              <GameCanvas
                key={key}
                level={JSON.parse(JSON.stringify(level))}
                onLevelComplete={(t) => alert(`Level complete! Time: ${t.toFixed(2)}s`)}
              />
            )}
            {!level && (
              <div className="text-white/20 text-sm mt-20">Click "Load Level" to start</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
