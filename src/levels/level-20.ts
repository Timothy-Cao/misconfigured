import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 20,
  name: 'Ride and Rest',
  width: 8,
  height: 8,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 31, 31, 31, 31, 1, 0],
    [0, 1, 1, 1, 1, 31, 1, 0],
    [0, 1, 1, 1, 1, 31, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 2, rotation: 1 },
  ],
  lives: 1,
};

export default level;
