import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 18,
  name: 'Clockwise',
  width: 8,
  height: 8,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 37, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 35, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 1, 36, 3, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 6, rotation: 1 },
  ],
  lives: 1,
};

export default level;
