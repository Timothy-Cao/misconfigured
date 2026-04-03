import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 1002,
  name: 'Anchor Point',
  width: 9,
  height: 9,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 3, 0, 2, 0, 0, 0],
    [0, 0, 0, 92, 0, 6, 0, 0, 0],
    [0, 0, 0, 1, 0, 6, 0, 0, 0],
    [0, 0, 1, 6, 3, 6, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 7, rotation: 0 },
    { startX: 6, startY: 7, rotation: 2 },
  ],
  lives: 1,
};

export default level;
