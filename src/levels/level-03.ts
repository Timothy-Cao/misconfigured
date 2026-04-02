import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 3,
  name: 'Cross Input',
  width: 7,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 3, 1, 1, 1, 0],
    [0, 1, 1, 3, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 5, rotation: 0 },
    { startX: 1, startY: 2, rotation: 1 },
  ],
  lives: 1,
};

export default level;
