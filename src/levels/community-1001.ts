import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 1001,
  name: 'Roundabout Theory',
  width: 11,
  height: 10,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
    [0, 0, 0, 90, 1, 1, 92, 1, 0, 0, 0],
    [0, 0, 1, 30, 31, 31, 31, 32, 1, 0, 0],
    [0, 3, 1, 33, 2, 2, 2, 32, 1, 0, 0],
    [0, 0, 1, 33, 2, 2, 2, 32, 1, 0, 0],
    [0, 0, 1, 33, 33, 33, 33, 32, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 3, startY: 8, rotation: 0 },
    { startX: 5, startY: 8, rotation: 1 },
    { startX: 7, startY: 8, rotation: 2 },
  ],
  lives: 1,
};

export default level;
