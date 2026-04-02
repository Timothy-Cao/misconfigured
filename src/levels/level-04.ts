import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 4,
  name: 'Parking Spot',
  width: 8,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 1, rotation: 0 },
    { startX: 6, startY: 1, rotation: 2 },
  ],
  lives: 1,
};

export default level;
