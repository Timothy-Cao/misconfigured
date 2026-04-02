import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 8,
  name: 'Safe Progress',
  width: 7,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 3, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 4, 1, 1, 2, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 5, rotation: 0 },
  ],
};

export default level;
