import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 6,
  name: 'Ice and Fire',
  width: 10,
  height: 10,
  grid: [
    [3, 6, 6, 6, 6, 3, 6, 6, 6, 6],
    [6, 2, 2, 2, 2, 2, 2, 2, 2, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6, 6, 6, 0, 6, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  players: [
    { startX: 1, startY: 9, rotation: 0 },
    { startX: 3, startY: 9, rotation: 0 },
  ],
  lives: 1,
};

export default level;
