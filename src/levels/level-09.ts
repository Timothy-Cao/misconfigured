import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 9,
  name: 'Critical Path',
  width: 11,
  height: 11,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 0, 3, 0, 0, 0, 3, 0, 0],
    [0, 90, 0, 0, 91, 1, 0, 0, 92, 0, 0],
    [0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    [0, 2, 6, 2, 2, 1, 0, 0, 6, 2, 0],
    [0, 1, 1, 31, 1, 1, 2, 2, 33, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 9, rotation: 0 },
    { startX: 5, startY: 9, rotation: 1 },
    { startX: 9, startY: 9, rotation: 2 },
  ],
  lives: 1,
};

export default level;
