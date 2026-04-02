import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 13,
  name: 'Relay',
  width: 8,
  height: 7,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 3, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 20, 3, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 10, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 5, rotation: 0 },
    { startX: 3, startY: 2, rotation: 1 },
  ],
};

export default level;
