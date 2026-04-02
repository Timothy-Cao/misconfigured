import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 19,
  name: 'Moving Sidewalk',
  width: 8,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 30, 30, 30, 3, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 5, rotation: 0 },
  ],
  lives: 1,
};

export default level;
