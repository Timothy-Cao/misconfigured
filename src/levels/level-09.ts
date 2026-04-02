import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 9,
  name: 'Push It Up',
  width: 7,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 5, 1, 3, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 3, startY: 4, rotation: 0 },
  ],
};

export default level;
