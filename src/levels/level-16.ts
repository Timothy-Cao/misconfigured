import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 16,
  name: 'Ice Brakes',
  width: 8,
  height: 8,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 3, 1, 0],
    [0, 1, 6, 6, 6, 6, 1, 0],
    [0, 1, 6, 1, 1, 6, 1, 0],
    [0, 1, 6, 1, 1, 6, 1, 0],
    [0, 1, 6, 6, 6, 6, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 6, rotation: 0 },
  ],
};

export default level;
