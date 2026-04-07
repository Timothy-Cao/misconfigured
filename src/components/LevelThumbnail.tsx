import {
  COLORS,
  TileType,
  colorFilterRotation,
  conveyorDirection,
  isColorFilter,
  isConveyor,
  isDoor,
  isOneWay,
  isPressurePlate,
  isRepaintStation,
  isToggleBlock,
  isToggleSwitch,
  oneWayOrientation,
  repaintRotation,
  rotationTileCW,
  isRotationTile,
  type LevelData,
} from '@/engine/types';

interface LevelThumbnailProps {
  level: LevelData;
  className?: string;
  showPlayers?: boolean;
}

const conveyorArrows = ['^', '>', 'v', '<'] as const;

function getTileStyle(tile: number): { background: string; borderColor?: string; label?: string; color?: string } {
  if (tile === TileType.VOID) return { background: '#030309' };
  if (tile === TileType.FLOOR) return { background: '#d7b98c' };
  if (tile === TileType.KILL) return { background: '#6b111a', label: 'x', color: '#ffb4b4' };
  if (tile === TileType.GOAL) return { background: '#14532d', label: '.', color: '#bbf7d0' };
  if (tile === TileType.CHECKPOINT) return { background: '#854d0e', label: 'C', color: '#fde68a' };
  if (tile === TileType.PUSHABLE) return { background: '#7c5d3b', label: '#', color: '#f5deb3' };
  if (tile === TileType.ICE) return { background: '#b9f4ff', borderColor: '#67e8f9' };
  if (tile === TileType.MUD) return { background: '#5c4033' };
  if (tile === TileType.CRUMBLE) return { background: '#9ca3af', label: ':', color: '#1f2937' };
  if (tile === TileType.REVERSE) return { background: '#312e81', label: '~', color: '#c4b5fd' };
  if (tile === TileType.BLACKHOLE) return { background: '#020617', label: 'o', color: '#a7f3d0' };
  if (tile === TileType.LIFE_PICKUP) return { background: '#3b1020', label: '+', color: '#ff8da1' };
  if (tile === TileType.STICKY) return { background: '#713f12', label: 'S', color: '#fde68a' };
  if (isPressurePlate(tile)) return { background: '#422006', label: 'P', color: '#facc15' };
  if (isDoor(tile)) return { background: '#1e3a8a', label: '|', color: '#bfdbfe' };
  if (isConveyor(tile)) return { background: '#164e63', label: conveyorArrows[conveyorDirection(tile)], color: '#a5f3fc' };
  if (isOneWay(tile)) return { background: '#134e4a', label: oneWayOrientation(tile) === 0 ? '|' : '-', color: '#99f6e4' };
  if (isRotationTile(tile)) return { background: '#581c87', label: rotationTileCW(tile) ? '>' : '<', color: '#e9d5ff' };
  if (isToggleSwitch(tile)) return { background: '#064e3b', label: 'T', color: '#a7f3d0' };
  if (isToggleBlock(tile)) return { background: '#14532d', label: 'B', color: '#bbf7d0' };
  if (isRepaintStation(tile)) return { background: COLORS.players[repaintRotation(tile)], label: 'R', color: '#050505' };
  if (isColorFilter(tile)) return { background: '#111827', borderColor: COLORS.players[colorFilterRotation(tile)], label: 'F', color: COLORS.players[colorFilterRotation(tile)] };
  return { background: '#6b7280' };
}

export default function LevelThumbnail({ level, className = '', showPlayers = true }: LevelThumbnailProps) {
  const playerByCell = new Map<string, number>();
  if (showPlayers) {
    level.players.forEach((player, index) => {
      playerByCell.set(`${player.startY},${player.startX}`, index);
    });
  }

  return (
    <div
      className={`grid overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner ${className}`}
      style={{
        gridTemplateColumns: `repeat(${level.width}, minmax(0, 1fr))`,
        aspectRatio: `${level.width} / ${level.height}`,
      }}
      aria-hidden="true"
    >
      {level.grid.flatMap((row, rowIndex) => row.map((tile, colIndex) => {
        const style = getTileStyle(tile);
        const playerIndex = playerByCell.get(`${rowIndex},${colIndex}`);
        const player = playerIndex === undefined ? null : level.players[playerIndex];
        return (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="relative flex min-h-0 min-w-0 items-center justify-center border-[0.5px] text-[0.42rem] font-black leading-none sm:text-[0.5rem]"
            style={{
              background: style.background,
              borderColor: style.borderColor ?? 'rgba(255,255,255,0.08)',
              color: style.color ?? 'rgba(255,255,255,0.65)',
            }}
          >
            {style.label}
            {player && (
              <span
                className="absolute h-[62%] w-[62%] rounded-full border border-black/45 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]"
                style={{ background: COLORS.players[player.rotation] }}
              />
            )}
          </div>
        );
      }))}
    </div>
  );
}
