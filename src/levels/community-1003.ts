import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 1003,
  name: 'Glass Glacier',
  width: 11,
  height: 10,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 0, 3, 0, 0, 0, 3, 0, 0],
    [0, 90, 0, 0, 91, 0, 0, 0, 92, 0, 0],
    [0, 1, 6, 6, 6, 2, 6, 6, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 8, rotation: 0 },
    { startX: 5, startY: 8, rotation: 1 },
    { startX: 8, startY: 8, rotation: 2 },
  ],
  lives: 1,
};

export default level;
