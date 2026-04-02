import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 7,
  name: 'Do Not Step There',
  width: 7,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 3, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 2, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 3, startY: 5, rotation: 0 },
  ],
  lives: 1,
};

export default level;
