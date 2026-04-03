import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 1002,
  name: 'Gatekeeper',
  width: 9,
  height: 9,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 80, 0, 20, 1, 1, 0],
    [0, 0, 10, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 7, rotation: 0 },
    { startX: 4, startY: 7, rotation: 1 },
  ],
  lives: 1,
};

export default level;
