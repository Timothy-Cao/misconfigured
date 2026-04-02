import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 14,
  name: 'After You',
  width: 9,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 3, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 20, 1, 3, 0],
    [0, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 10, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 5, rotation: 0 },
    { startX: 3, startY: 2, rotation: 1 },
  ],
};

export default level;
