import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 8,
  name: 'Free Ride',
  width: 9,
  height: 5,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 0, 0, 0, 3, 0, 0],
    [0, 0, 90, 0, 0, 0, 91, 0, 0],
    [0, 31, 30, 1, 1, 1, 30, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 3, rotation: 0 },
    { startX: 5, startY: 3, rotation: 1 },
  ],
  lives: 1,
  maxMoves: 2,
};

export default level;
