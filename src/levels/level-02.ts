import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 2,
  name: 'Opposite Ends',
  width: 7,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 3, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 3, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 4, rotation: 0 },
    { startX: 4, startY: 2, rotation: 2 },
  ],
  lives: 1,
};

export default level;
