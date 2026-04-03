import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 2,
  name: 'Friends!',
  width: 8,
  height: 8,
  grid: [
    [3, 1, 1, 0, 0, 1, 1, 3],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [3, 1, 1, 0, 0, 1, 1, 3],
  ],
  players: [
    { startX: 3, startY: 3, rotation: 0 },
    { startX: 4, startY: 3, rotation: 1 },
    { startX: 4, startY: 4, rotation: 2 },
    { startX: 3, startY: 4, rotation: 3 },
  ],
  lives: 1,
};

export default level;
