import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 8,
  name: 'Free Ride',
  width: 9,
  height: 6,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 31, 90, 1, 1, 1, 91, 3, 0],
    [0, 1, 1, 1, 0, 30, 1, 1, 0],
    [0, 1, 1, 1, 1, 30, 1, 30, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 3, rotation: 0 },
    { startX: 4, startY: 3, rotation: 1 },
  ],
  lives: 1,
  maxMoves: 3,
};

export default level;
