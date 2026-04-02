import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 12,
  name: 'Weighted Door',
  width: 8,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 10, 1, 20, 3, 0],
    [0, 1, 1, 5, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 3, startY: 5, rotation: 0 },
  ],
  lives: 1,
};

export default level;
