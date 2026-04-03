import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 4,
  name: 'Death Maze',
  width: 11,
  height: 11,
  grid: [
    [3, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1],
    [1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1],
    [1, 1, 1, 1, 2, 0, 2, 1, 1, 2, 1],
    [2, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 0, 2, 1, 2, 1, 2],
    [1, 1, 1, 1, 2, 0, 1, 1, 1, 1, 1],
    [2, 1, 2, 1, 1, 0, 2, 1, 2, 1, 2],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 2],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 3],
  ],
  players: [
    { startX: 2, startY: 10, rotation: 0 },
    { startX: 8, startY: 0, rotation: 2 },
  ],
  lives: 1,
};

export default level;
