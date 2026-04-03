import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 5,
  name: 'Color Filter',
  width: 11,
  height: 11,
  grid: [
    [3, 3, 0, 3, 3, 0, 3, 3, 0, 3, 3],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    [90, 90, 0, 91, 91, 0, 92, 92, 0, 93, 93],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  players: [
    { startX: 3, startY: 7, rotation: 2 },
    { startX: 6, startY: 7, rotation: 1 },
    { startX: 9, startY: 7, rotation: 0 },
    { startX: 0, startY: 7, rotation: 3 },
  ],
  lives: 1,
};

export default level;
