import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 3,
  name: 'Red = Die',
  width: 8,
  height: 8,
  grid: [
    [3, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 2, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 3],
  ],
  players: [
    { startX: 3, startY: 4, rotation: 0 },
    { startX: 4, startY: 3, rotation: 1 },
  ],
  lives: 1,
};

export default level;
