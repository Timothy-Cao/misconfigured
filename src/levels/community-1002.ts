import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 1002,
  name: 'Counterflow Viaduct',
  width: 11,
  height: 10,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 0, 2, 0, 0, 3, 0, 0, 0],
    [0, 30, 0, 0, 30, 31, 31, 1, 0, 0, 0],
    [0, 30, 0, 0, 30, 0, 0, 1, 0, 0, 0],
    [0, 30, 1, 1, 30, 0, 0, 33, 1, 0, 0],
    [0, 0, 1, 1, 30, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 8, rotation: 0 },
    { startX: 4, startY: 8, rotation: 1 },
  ],
  lives: 1,
};

export default level;
