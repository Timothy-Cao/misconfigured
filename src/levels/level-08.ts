import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 8,
  name: 'Free Ride',
  width: 9,
  height: 9,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 0, 2, 0, 0, 3, 0],
    [0, 30, 0, 0, 30, 31, 31, 1, 0],
    [0, 30, 0, 1, 30, 0, 0, 0, 0],
    [0, 30, 1, 1, 30, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 7, rotation: 0 },
    { startX: 4, startY: 7, rotation: 1 },
  ],
  lives: 1,
  maxMoves: 3,
};

export default level;
