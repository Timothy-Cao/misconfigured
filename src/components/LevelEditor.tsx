'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TileType, COLORS, PLAYER_DIRECTIONS, type LevelData, type Rotation, isPressurePlate, pressurePlateNumber, pressurePlateTile, isDoor, doorNumber, doorTile, isToggleSwitch, isToggleBlock, toggleNumber, toggleSwitchTile, isConveyor, conveyorDirection, conveyorTile, isOneWay, oneWayDirection, oneWayTile, isRotationTile, rotationTileCW, DIR_DX, DIR_DY } from '@/engine/types';
import { getCommunityLevel, getCommunityLevels, getLevel, getNextCommunityLevelId, saveCommunityLevel, saveCustomLevel } from '@/levels';
import { verifyAdminPassword } from '@/lib/admin';

const MAX_SIZE = 20;
const MIN_SIZE = 4;

type Tool = 'floor' | 'wall' | 'goal' | 'kill' | 'pushable' | 'plate' | 'door' | 'ice' | 'mud' | 'crumble' | 'reverse' | 'tswitch' | 'conveyor' | 'oneway' | 'rotation' | 'blackhole' | 'spawn0' | 'spawn1' | 'spawn2' | 'spawn3';
type Tab = 'config' | 'blocks' | 'publish';
type PublishScope = 'campaign' | 'community';

interface SpawnPoint {
  col: number;
  row: number;
  rotation: Rotation;
}

const TOOL_LABELS: Record<Tool, string> = {
  floor: 'Floor',
  wall: 'Wall',
  goal: 'Goal',
  kill: 'Kill Zone',
  pushable: 'Push Block',
  plate: 'Pressure Plate',
  door: 'Door',
  ice: 'Ice',
  mud: 'Mud',
  crumble: 'Crumble',
  reverse: 'Reverse',
  tswitch: 'Toggle Switch',
  conveyor: 'Conveyor',
  oneway: 'One-Way',
  rotation: 'Rotation',
  blackhole: 'Black Hole',
  spawn0: 'Player 1',
  spawn1: 'Player 2',
  spawn2: 'Player 3',
  spawn3: 'Player 4',
};

const TOOL_SHORTCUTS: Record<string, Tool> = {
  q: 'floor',
  w: 'wall',
  e: 'goal',
  r: 'kill',
  t: 'pushable',
  y: 'plate',
  u: 'door',
  i: 'ice',
  o: 'oneway',
  p: 'crumble',
  a: 'blackhole',
  s: 'tswitch',
  f: 'conveyor',
  g: 'rotation',
  h: 'reverse',
  j: 'mud',
  '1': 'spawn0',
  '2': 'spawn1',
  '3': 'spawn2',
  '4': 'spawn3',
};

const SHORTCUT_DISPLAY: Partial<Record<Tool, string>> = {
  floor: 'Q',
  wall: 'W',
  goal: 'E',
  kill: 'R',
  pushable: 'T',
  plate: 'Y',
  door: 'U',
  ice: 'I',
  mud: 'J',
  crumble: 'P',
  reverse: 'H',
  tswitch: 'S',
  conveyor: 'F',
  oneway: 'O',
  rotation: 'G',
  blackhole: 'A',
  spawn0: '1',
  spawn1: '2',
  spawn2: '3',
  spawn3: '4',
};

const SPAWN_COLORS = COLORS.players;

const DIRECTION_LABELS = ['Up', 'Right', 'Down', 'Left'];

const ARROW_ANGLES: Record<number, number> = {
  0: -Math.PI / 2,
  1: 0,
  2: Math.PI / 2,
  3: Math.PI,
};

function computeTilePx(width: number, height: number): number {
  if (typeof window === 'undefined') return 32;
  const sidebarAllowance = window.innerWidth >= 1024 ? 360 : 48;
  const maxW = Math.min(window.innerWidth - sidebarAllowance, 1040);
  const maxH = Math.min(window.innerHeight * 0.78, 860);
  const s = Math.min(maxW / width, maxH / height);
  return Math.max(20, Math.min(56, Math.floor(s)));
}

function createFloorGrid(w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(TileType.FLOOR));
}

function getNextPlateNumber(grid: number[][]): number {
  return getNextNumbered(grid, isPressurePlate, pressurePlateNumber);
}

function getNextNumbered(grid: number[][], isTile: (t: number) => boolean, getNumber: (t: number) => number): number {
  const used = new Set<number>();
  for (const row of grid) {
    for (const tile of row) {
      if (isTile(tile)) used.add(getNumber(tile));
    }
  }
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) return n;
  }
  return 0;
}

export default function LevelEditor() {
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(8);
  const [grid, setGrid] = useState<number[][]>(() => createFloorGrid(10, 8));
  const [spawns, setSpawns] = useState<(SpawnPoint | null)[]>([null, null, null, null]);
  const [tool, setTool] = useState<Tool>('wall');
  const [tab, setTab] = useState<Tab>('blocks');
  const [levelName, setLevelName] = useState('');
  const [publishScope, setPublishScope] = useState<PublishScope>('campaign');
  const [saveTargetId, setSaveTargetId] = useState(1);
  const [communityTargetId, setCommunityTargetId] = useState(1001);
  const [communityLevels, setCommunityLevels] = useState<LevelData[]>([]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const paintModeRef = useRef<'place' | 'erase'>('place');
  const lastPaintedRef = useRef<string>('');
  const [tilePx, setTilePx] = useState(32);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function update() { setTilePx(computeTilePx(width, height)); }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [width, height]);

  const refreshCommunityLevels = useCallback(() => {
    const levels = getCommunityLevels();
    setCommunityLevels(levels);
    setCommunityTargetId(current => {
      if (levels.some(level => level.id === current)) return current;
      return getNextCommunityLevelId();
    });
  }, []);

  useEffect(() => {
    refreshCommunityLevels();
  }, [refreshCommunityLevels]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const t = TOOL_SHORTCUTS[e.key.toLowerCase()];
      if (t) {
        e.preventDefault();
        setTool(t);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const resizeGrid = useCallback((newW: number, newH: number) => {
    setGrid(prev => {
      const newGrid = createFloorGrid(newW, newH);
      for (let r = 0; r < Math.min(prev.length, newH); r++) {
        for (let c = 0; c < Math.min(prev[0].length, newW); c++) {
          newGrid[r][c] = prev[r][c];
        }
      }
      return newGrid;
    });
    setSpawns(prev => prev.map(s => {
      if (!s) return null;
      if (s.col >= newW || s.row >= newH) return null;
      return s;
    }));
    setWidth(newW);
    setHeight(newH);
  }, []);

  const getToolTile = useCallback((t: string): number => {
    const map: Record<string, number> = {
      floor: TileType.FLOOR,
      wall: TileType.VOID,
      goal: TileType.GOAL,
      kill: TileType.KILL,
      pushable: TileType.PUSHABLE,
      ice: TileType.ICE,
      mud: TileType.MUD,
      crumble: TileType.CRUMBLE,
      reverse: TileType.REVERSE,
      blackhole: TileType.BLACKHOLE,
    };
    return map[t] ?? TileType.FLOOR;
  }, []);

  const applyToolAt = useCallback((col: number, row: number, mode: 'place' | 'erase') => {
    if (col < 0 || col >= width || row < 0 || row >= height) return;

    if (tool.startsWith('spawn')) return;

    if (tool === 'plate') {
      setGrid(prev => {
        const current = prev[row][col];
        const next = prev.map(r => [...r]);
        if (mode === 'erase') {
          if (isPressurePlate(current)) {
            next[row][col] = TileType.FLOOR;
          }
        } else {
          if (isPressurePlate(current)) return prev;
          const n = getNextPlateNumber(prev);
          if (n === 0) return prev;
          next[row][col] = pressurePlateTile(n);
        }
        return next;
      });
      return;
    }

    if (tool === 'door') {
      setGrid(prev => {
        const current = prev[row][col];
        const next = prev.map(r => [...r]);
        if (mode === 'erase') {
          if (isDoor(current)) {
            next[row][col] = TileType.FLOOR;
          }
        } else {
          if (isDoor(current)) return prev;
          next[row][col] = doorTile(1);
        }
        return next;
      });
      return;
    }

    if (tool === 'tswitch') {
      setGrid(prev => {
        const current = prev[row][col];
        const next = prev.map(r => [...r]);
        if (mode === 'erase') {
          if (isToggleSwitch(current)) next[row][col] = TileType.FLOOR;
        } else {
          if (isToggleSwitch(current)) return prev;
          const n = getNextNumbered(prev, isToggleSwitch, toggleNumber);
          if (n === 0) return prev;
          next[row][col] = toggleSwitchTile(n);
        }
        return next;
      });
      return;
    }

    if (tool === 'conveyor') {
      setGrid(prev => {
        const current = prev[row][col];
        const next = prev.map(r => [...r]);
        if (mode === 'erase') {
          if (isConveyor(current)) next[row][col] = TileType.FLOOR;
        } else {
          if (isConveyor(current)) return prev;
          next[row][col] = conveyorTile(0); // default: up
        }
        return next;
      });
      return;
    }

    if (tool === 'oneway') {
      setGrid(prev => {
        const current = prev[row][col];
        const next = prev.map(r => [...r]);
        if (mode === 'erase') {
          if (isOneWay(current)) next[row][col] = TileType.FLOOR;
        } else {
          if (isOneWay(current)) return prev;
          next[row][col] = oneWayTile(0); // default: enterable from up
        }
        return next;
      });
      return;
    }

    if (tool === 'rotation') {
      setGrid(prev => {
        const current = prev[row][col];
        const next = prev.map(r => [...r]);
        if (mode === 'erase') {
          if (isRotationTile(current)) next[row][col] = TileType.FLOOR;
        } else {
          if (isRotationTile(current)) return prev;
          next[row][col] = 38; // CW by default
        }
        return next;
      });
      return;
    }

    const targetTile = getToolTile(tool);

    setGrid(prev => {
      const next = prev.map(r => [...r]);
      if (mode === 'place') {
        next[row][col] = targetTile;
      } else {
        if (tool === 'wall') {
          next[row][col] = TileType.FLOOR;
        } else if (prev[row][col] === targetTile) {
          next[row][col] = TileType.FLOOR;
        }
      }
      return next;
    });

    if (tool === 'wall' && mode === 'place') {
      setSpawns(prev => prev.map(s => s && s.col === col && s.row === row ? null : s));
    }
  }, [tool, width, height, getToolTile]);

  const handleSpawnClick = useCallback((col: number, row: number) => {
    if (col < 0 || col >= width || row < 0 || row >= height) return;
    const idx = parseInt(tool[5]);

    setSpawns(prev => {
      const existing = prev[idx];
      if (existing && existing.col === col && existing.row === row) {
        const next = [...prev];
        next[idx] = null;
        return next;
      }
      const next = [...prev];
      next[idx] = { col, row, rotation: existing?.rotation ?? PLAYER_DIRECTIONS[idx] };
      return next;
    });
  }, [tool, width, height]);

  const cycleSpawnRotation = useCallback((idx: number) => {
    setSpawns(prev => {
      const current = prev[idx];
      if (!current) return prev;
        const next = [...prev];
        next[idx] = {
          ...current,
          rotation: ((current.rotation + 1) % 4) as Rotation,
        };
        return next;
      });
  }, []);

  const getCanvasCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / tilePx);
    const row = Math.floor((e.clientY - rect.top) * scaleY / tilePx);
    return { col, row };
  }, [tilePx]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;

    const cell = getCanvasCell(e);
    if (!cell) return;
    const { col, row } = cell;

    if (tool.startsWith('spawn')) {
      handleSpawnClick(col, row);
      return;
    }

    const currentTile = grid[row]?.[col];
    let mode: 'place' | 'erase';

    if (tool === 'plate') {
      mode = isPressurePlate(currentTile) ? 'erase' : 'place';
    } else if (tool === 'door') {
      mode = isDoor(currentTile) ? 'erase' : 'place';
    } else if (tool === 'tswitch') {
      mode = isToggleSwitch(currentTile) ? 'erase' : 'place';
    } else if (tool === 'conveyor') {
      mode = isConveyor(currentTile) ? 'erase' : 'place';
    } else if (tool === 'oneway') {
      mode = isOneWay(currentTile) ? 'erase' : 'place';
    } else if (tool === 'rotation') {
      mode = isRotationTile(currentTile) ? 'erase' : 'place';
    } else {
      const targetTile = getToolTile(tool);
      mode = currentTile === targetTile ? 'erase' : 'place';
    }

    paintModeRef.current = mode;
    lastPaintedRef.current = `${col},${row}`;

    applyToolAt(col, row, mode);
    setIsPainting(true);
  }, [tool, grid, getToolTile, applyToolAt, handleSpawnClick, getCanvasCell]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;
    if (tool.startsWith('spawn')) return;
    const cell = getCanvasCell(e);
    if (!cell) return;
    const { col, row } = cell;

    const key = `${col},${row}`;
    if (key === lastPaintedRef.current) return;
    lastPaintedRef.current = key;

    applyToolAt(col, row, paintModeRef.current);
  }, [isPainting, tool, applyToolAt, getCanvasCell]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPainting(false);
    lastPaintedRef.current = '';
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsPainting(false);
    lastPaintedRef.current = '';
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsPainting(false);
    lastPaintedRef.current = '';

    const cell = getCanvasCell(e);
    if (!cell) return;
    const { col, row } = cell;

    if (col < 0 || col >= width || row < 0 || row >= height) return;

    setGrid(prev => {
      const tile = prev[row][col];
      if (isDoor(tile)) {
        const n = doorNumber(tile);
        const nextN = (n % 9) + 1;
        const next = prev.map(r => [...r]);
        next[row][col] = doorTile(nextN);
        return next;
      }
      if (isPressurePlate(tile)) {
        const n = pressurePlateNumber(tile);
        const nextN = (n % 9) + 1;
        const next = prev.map(r => [...r]);
        next[row][col] = pressurePlateTile(nextN);
        return next;
      }
      if (isToggleSwitch(tile)) {
        const n = toggleNumber(tile);
        const nextN = (n % 9) + 1;
        const next = prev.map(r => [...r]);
        next[row][col] = toggleSwitchTile(nextN);
        return next;
      }
      if (isConveyor(tile)) {
        const dir = conveyorDirection(tile);
        const nextDir = (dir + 1) % 4;
        const next = prev.map(r => [...r]);
        next[row][col] = conveyorTile(nextDir);
        return next;
      }
      if (isOneWay(tile)) {
        const dir = oneWayDirection(tile);
        const nextDir = (dir + 1) % 4;
        const next = prev.map(r => [...r]);
        next[row][col] = oneWayTile(nextDir);
        return next;
      }
      if (isRotationTile(tile)) {
        const next = prev.map(r => [...r]);
        next[row][col] = rotationTileCW(tile) ? 39 : 38; // toggle CW/CCW
        return next;
      }
      return prev;
    });
  }, [getCanvasCell, width, height]);

  // Render the editor canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = width * tilePx;
    canvas.height = height * tilePx;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gap = Math.max(1, tilePx * 0.05);
    const radius = Math.max(2, tilePx * 0.1);

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = grid[r][c];
        let color: string;

        if (isPressurePlate(tile)) {
          color = '#1a2a3a';
        } else if (isDoor(tile)) {
          color = '#2a2040';
        } else if (isToggleSwitch(tile)) {
          color = '#2a2018';
        } else if (isConveyor(tile)) {
          color = '#1a1a2e';
        } else if (isOneWay(tile)) {
          color = '#1a1a2e';
        } else if (isRotationTile(tile)) {
          color = '#1e1a2e';
        } else if (tile === TileType.BLACKHOLE) {
          color = '#143a22';
        } else {
          switch (tile) {
            case TileType.FLOOR: color = '#1a1a2e'; break;
            case TileType.KILL: color = '#8b2020'; break;
            case TileType.GOAL: color = '#1a6b3a'; break;
            case TileType.CHECKPOINT: color = '#8b7a1a'; break;
            case TileType.PUSHABLE: color = '#5a4a3a'; break;
            case TileType.ICE: color = '#1a2a3a'; break;
            case TileType.MUD: color = '#2a1a10'; break;
            case TileType.CRUMBLE: color = '#2a2020'; break;
            case TileType.REVERSE: color = '#2a1a2e'; break;
            default: color = '#08080c'; break;
          }
        }

        const x = c * tilePx + gap;
        const y = r * tilePx + gap;
        const s = tilePx - gap * 2;

        if (tile === TileType.KILL || tile === TileType.GOAL || tile === TileType.BLACKHOLE || isPressurePlate(tile) || isConveyor(tile) || isOneWay(tile)) {
          ctx.save();
          ctx.shadowColor = tile === TileType.KILL ? '#ff3333' : tile === TileType.GOAL ? '#4ade80' : tile === TileType.BLACKHOLE ? '#22cc66' : isConveyor(tile) ? '#66aaff' : isOneWay(tile) ? '#ffdd66' : '#55ccee';
          ctx.shadowBlur = 6;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, s, s, radius);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, s, s, radius);
          ctx.fill();
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const cx = c * tilePx + tilePx / 2;
        const cy = r * tilePx + tilePx / 2;

        // Kill zone skull (large)
        if (tile === TileType.KILL) {
          const skullSize = tilePx * 0.6;
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = `${skullSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☠', cx, cy + 1);
          ctx.restore();
        }

        // Goal star
        if (tile === TileType.GOAL) {
          const iconSize = tilePx * 0.35;
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = `${iconSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', cx, cy + 1);
          ctx.restore();
        }

        // Black hole — dark circle with ring
        if (tile === TileType.BLACKHOLE) {
          const bhR = s * 0.22;
          ctx.beginPath();
          ctx.arc(cx, cy, bhR, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cy, bhR + 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(100,255,150,0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Star label
          ctx.fillStyle = 'rgba(100,255,150,0.5)';
          ctx.font = `${tilePx * 0.2}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', cx, cy);
        }

        // Pushable brick pattern
        if (tile === TileType.PUSHABLE) {
          const rows = 3;
          const brickH = s / rows;
          const brickW = s / 2;
          ctx.strokeStyle = 'rgba(180,140,100,0.4)';
          ctx.lineWidth = 1;
          for (let br = 0; br < rows; br++) {
            const by = y + br * brickH;
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x + s, by);
            ctx.stroke();
            const offset = br % 2 === 0 ? 0 : brickW / 2;
            for (let bc = 0; bc <= 2; bc++) {
              const bx = x + offset + bc * brickW;
              if (bx > x && bx < x + s) {
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx, by + brickH);
                ctx.stroke();
              }
            }
          }
        }

        // Pressure plate number + indicator
        if (isPressurePlate(tile)) {
          const n = pressurePlateNumber(tile);
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = `bold ${tilePx * 0.4}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n), cx, cy + 1);
          ctx.restore();

          ctx.save();
          ctx.fillStyle = 'rgba(100,150,200,0.3)';
          ctx.beginPath();
          ctx.roundRect(x + s * 0.15, y + s - 4, s * 0.7, 3, 1);
          ctx.fill();
          ctx.restore();
        }

        // Door — dotted outline + number
        if (isDoor(tile)) {
          const n = doorNumber(tile);

          ctx.save();
          ctx.strokeStyle = 'rgba(160,120,220,0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, s - 2, s - 2, radius - 1);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          ctx.save();
          ctx.fillStyle = 'rgba(160,120,220,0.6)';
          ctx.font = `bold ${tilePx * 0.4}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n), cx, cy + 1);
          ctx.restore();
        }

        // Void — crosshatch pattern
        if (tile === TileType.VOID) {
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          const step = s / 4;
          for (let vi = 0; vi <= 4; vi++) {
            ctx.beginPath(); ctx.moveTo(x + vi * step, y); ctx.lineTo(x, y + vi * step); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + s - vi * step, y + s); ctx.lineTo(x + s, y + s - vi * step); ctx.stroke();
          }
        }

        // Ice — sparkle lines
        if (tile === TileType.ICE) {
          ctx.strokeStyle = 'rgba(150,220,255,0.25)';
          ctx.lineWidth = 1;
          const ir = s * 0.3;
          for (let ii = 0; ii < 6; ii++) {
            const angle = (ii * Math.PI) / 3;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir); ctx.stroke();
          }
        }

        // Mud — tilde
        if (tile === TileType.MUD) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = `${tilePx * 0.35}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('~', cx, cy);
        }

        // Crumble — crack lines
        if (tile === TileType.CRUMBLE) {
          ctx.strokeStyle = 'rgba(255,200,150,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + s * 0.2, y + s * 0.3); ctx.lineTo(cx, cy); ctx.lineTo(x + s * 0.8, y + s * 0.2);
          ctx.moveTo(cx, cy); ctx.lineTo(x + s * 0.3, y + s * 0.8);
          ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,200,150,0.3)'; ctx.fill();
        }

        // Reverse — swirl
        if (tile === TileType.REVERSE) {
          ctx.fillStyle = 'rgba(200,100,255,0.4)';
          ctx.font = `${tilePx * 0.4}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⟲', cx, cy + 1);
        }

        // Toggle switch — number + circle
        if (isToggleSwitch(tile)) {
          const n = toggleNumber(tile);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = `bold ${tilePx * 0.4}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n), cx, cy + 1);
          ctx.beginPath(); ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,180,60,0.3)'; ctx.lineWidth = 2; ctx.stroke();
        }

        // Toggle block — number + X
        if (isToggleBlock(tile)) {
          const n = toggleNumber(tile);
          ctx.strokeStyle = 'rgba(255,160,40,0.3)'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + s - 4, y + s - 4);
          ctx.moveTo(x + s - 4, y + 4); ctx.lineTo(x + 4, y + s - 4);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,160,40,0.5)';
          ctx.font = `bold ${tilePx * 0.4}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n), cx, cy + 1);
        }

        // Conveyor — directional chevrons
        if (isConveyor(tile)) {
          const dir = conveyorDirection(tile);
          const ddx = DIR_DX[dir];
          const ddy = DIR_DY[dir];
          ctx.strokeStyle = 'rgba(100,200,255,0.5)';
          ctx.lineWidth = 2;
          for (let k = -1; k <= 1; k++) {
            const offset = k * s * 0.25;
            const ax = cx + ddx * offset;
            const ay = cy + ddy * offset;
            const arrowLen = s * 0.12;
            ctx.beginPath();
            ctx.moveTo(ax - ddy * arrowLen - ddx * arrowLen, ay + ddx * arrowLen - ddy * arrowLen);
            ctx.lineTo(ax + ddx * arrowLen * 0.5, ay + ddy * arrowLen * 0.5);
            ctx.lineTo(ax + ddy * arrowLen - ddx * arrowLen, ay - ddx * arrowLen - ddy * arrowLen);
            ctx.stroke();
          }
        }

        // One-way — entry arrow
        if (isOneWay(tile)) {
          const dir = oneWayDirection(tile);
          const ddx = DIR_DX[dir];
          const ddy = DIR_DY[dir];
          const arrowLen = s * 0.2;
          const startX2 = cx - ddx * s * 0.3;
          const startY2 = cy - ddy * s * 0.3;
          const endX2 = cx + ddx * s * 0.1;
          const endY2 = cy + ddy * s * 0.1;
          ctx.strokeStyle = 'rgba(255,220,100,0.5)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX2, startY2);
          ctx.lineTo(endX2, endY2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(endX2, endY2);
          ctx.lineTo(endX2 - ddx * arrowLen + ddy * arrowLen * 0.5, endY2 - ddy * arrowLen - ddx * arrowLen * 0.5);
          ctx.moveTo(endX2, endY2);
          ctx.lineTo(endX2 - ddx * arrowLen - ddy * arrowLen * 0.5, endY2 - ddy * arrowLen + ddx * arrowLen * 0.5);
          ctx.stroke();
          // Block line on opposite side
          const bx = cx + ddx * s * 0.4;
          const by = cy + ddy * s * 0.4;
          ctx.strokeStyle = 'rgba(255,100,100,0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx - ddy * s * 0.35, by + ddx * s * 0.35);
          ctx.lineTo(bx + ddy * s * 0.35, by - ddx * s * 0.35);
          ctx.stroke();
        }

        // Rotation — CW/CCW symbol
        if (isRotationTile(tile)) {
          const cw = rotationTileCW(tile);
          ctx.fillStyle = 'rgba(180,120,255,0.5)';
          ctx.font = `${tilePx * 0.4}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cw ? '↻' : '↺', cx, cy - 2);
          ctx.fillStyle = 'rgba(180,120,255,0.35)';
          ctx.font = `${tilePx * 0.22}px sans-serif`;
          ctx.fillText(cw ? 'CW' : 'CCW', cx, cy + s * 0.3);
        }
      }
    }

    // Spawn points
    for (let i = 0; i < 4; i++) {
      const sp = spawns[i];
      if (!sp) continue;
      const cx = sp.col * tilePx + tilePx / 2;
      const cy = sp.row * tilePx + tilePx / 2;
      const size = tilePx * 0.6;

      ctx.save();
      ctx.shadowColor = SPAWN_COLORS[sp.rotation];
      ctx.shadowBlur = 8;
      ctx.fillStyle = SPAWN_COLORS[sp.rotation];
      ctx.beginPath();
      ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 4);
      ctx.fill();
      ctx.restore();

      const rotation = sp.rotation;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ARROW_ANGLES[rotation]);
      const a = size * 0.25;
      ctx.beginPath();
      ctx.moveTo(a, 0);
      ctx.lineTo(-a * 0.5, -a * 0.7);
      ctx.lineTo(-a * 0.5, a * 0.7);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
      ctx.restore();
    }
  }, [grid, spawns, width, height, tilePx]);

  const validate = useCallback((): string | null => {
    const validSpawns = spawns.filter(Boolean) as SpawnPoint[];
    if (validSpawns.length < 1 || validSpawns.length > 4) {
      return `Need between 1 and 4 spawn points (have ${validSpawns.length})`;
    }

    let goalCount = 0;
    let blackholeCount = 0;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c] === TileType.GOAL) goalCount++;
        if (grid[r][c] === TileType.BLACKHOLE) blackholeCount++;
      }
    }
    if (blackholeCount === 0 && goalCount !== validSpawns.length) {
      return `Need exactly ${validSpawns.length} goal tiles or at least 1 black hole (have ${goalCount} goals)`;
    }
    if (blackholeCount > 0 && goalCount + blackholeCount < 1) return 'Need at least 1 goal or black hole tile';

    for (let i = 0; i < validSpawns.length; i++) {
      const s = validSpawns[i];
      if (grid[s.row][s.col] === TileType.VOID) {
        return `Spawn ${i + 1} is on a wall/void tile`;
      }
    }

    const positions = new Set(validSpawns.map(s => `${s.row},${s.col}`));
    if (positions.size < validSpawns.length) return 'Spawn points must be on different tiles';

    return null;
  }, [grid, spawns, height, width]);

  const loadLevelIntoEditor = useCallback((level: LevelData) => {
    const nextSpawns: (SpawnPoint | null)[] = [null, null, null, null];
    for (let i = 0; i < Math.min(level.players.length, 4); i++) {
      const player = level.players[i];
      nextSpawns[i] = {
        col: player.startX,
        row: player.startY,
        rotation: player.rotation,
      };
    }

    setWidth(level.width);
    setHeight(level.height);
    setGrid(level.grid.map(row => [...row]));
    setSpawns(nextSpawns);
    setLevelName(level.name);
    setTab('publish');
    setMessage(null);
  }, []);

  const buildLevelData = useCallback((id: number, fallbackName: string): LevelData => {
    const players = spawns.flatMap((spawn) => (
      spawn ? [{
        startX: spawn.col,
        startY: spawn.row,
        rotation: spawn.rotation,
      }] : []
    ));

    return {
      id,
      name: levelName || fallbackName,
      width,
      height,
      grid: grid.map(row => [...row]),
      players,
    };
  }, [grid, height, levelName, spawns, width]);

  const handleLoad = useCallback(() => {
    setMessage(null);

    const sourceLevel = publishScope === 'campaign'
      ? getLevel(saveTargetId)
      : getCommunityLevel(communityTargetId);

    if (!sourceLevel) {
      setMessage({
        text: publishScope === 'campaign'
          ? `Level ${saveTargetId} could not be loaded.`
          : `Community level ${communityTargetId} does not exist yet.`,
        type: 'error',
      });
      return;
    }

    loadLevelIntoEditor({
      ...sourceLevel,
      grid: sourceLevel.grid.map(row => [...row]),
      players: sourceLevel.players.map(player => ({ ...player })) as LevelData['players'],
    });
    setMessage({
      text: `Loaded ${sourceLevel.name} into the editor as a new working copy.`,
      type: 'success',
    });
  }, [communityTargetId, loadLevelIntoEditor, publishScope, saveTargetId]);

  const handleSave = useCallback(async () => {
    setMessage(null);

    const error = validate();
    if (error) {
      setMessage({ text: error, type: 'error' });
      return;
    }

    const isValidPassword = await verifyAdminPassword(password);
    if (!isValidPassword) {
      setMessage({ text: 'Invalid admin password', type: 'error' });
      return;
    }

    if (publishScope === 'campaign') {
      const levelData = buildLevelData(saveTargetId, `Level ${saveTargetId}`);
      saveCustomLevel(saveTargetId, levelData);
      setMessage({ text: `Saved to Level ${saveTargetId}!`, type: 'success' });
      return;
    }

    const levelData = buildLevelData(communityTargetId, `Community ${communityTargetId}`);
    saveCommunityLevel(communityTargetId, levelData);
    refreshCommunityLevels();
    setMessage({ text: `Saved to Community ${communityTargetId}!`, type: 'success' });
  }, [buildLevelData, communityTargetId, password, publishScope, refreshCommunityLevels, saveTargetId, validate]);

  const clearGrid = useCallback(() => {
    setGrid(createFloorGrid(width, height));
    setSpawns([null, null, null, null]);
  }, [width, height]);

  const placedPlayers = spawns.filter(Boolean).length;
  const goalCount = grid.flat().filter(t => t === TileType.GOAL).length;
  const blackholeCount = grid.flat().filter(t => t === TileType.BLACKHOLE).length;
  const editorWarnings: string[] = [];
  if (placedPlayers < 1) {
    editorWarnings.push('Need at least one player.');
  }
  if (blackholeCount === 0 && goalCount < 4) {
    editorWarnings.push('Need four regular goals unless you place at least one black hole goal.');
  }

  const TAB_LABELS: Record<Tab, string> = { config: 'Config', blocks: 'Blocks', publish: 'Publish' };
  const targetNamePlaceholder = publishScope === 'campaign'
    ? `Level ${saveTargetId}`
    : `Community ${communityTargetId}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
      {/* Sidebar */}
      <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
        {/* Tab bar */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(['config', 'blocks', 'publish'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-2 font-mono uppercase tracking-wider transition-all duration-200 ${
                tab === t
                  ? 'bg-white/10 text-white'
                  : 'bg-white/[0.02] text-white/40 hover:bg-white/5 hover:text-white/60'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Config tab */}
        {tab === 'config' && (
          <>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">Grid Size</h3>
              <div className="flex gap-3">
                <label className="flex-1">
                  <span className="text-white/40 text-xs">Width</span>
                  <input
                    type="number" min={MIN_SIZE} max={MAX_SIZE}
                    value={width}
                    onChange={e => resizeGrid(Math.max(MIN_SIZE, Math.min(MAX_SIZE, parseInt(e.target.value) || MIN_SIZE)), height)}
                    onWheel={e => { e.preventDefault(); resizeGrid(Math.max(MIN_SIZE, Math.min(MAX_SIZE, width + (e.deltaY < 0 ? 1 : -1))), height); }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm mt-1 focus:outline-none focus:border-purple-500/50 text-center"
                  />
                </label>
                <label className="flex-1">
                  <span className="text-white/40 text-xs">Height</span>
                  <input
                    type="number" min={MIN_SIZE} max={MAX_SIZE}
                    value={height}
                    onChange={e => resizeGrid(width, Math.max(MIN_SIZE, Math.min(MAX_SIZE, parseInt(e.target.value) || MIN_SIZE)))}
                    onWheel={e => { e.preventDefault(); resizeGrid(width, Math.max(MIN_SIZE, Math.min(MAX_SIZE, height + (e.deltaY < 0 ? 1 : -1)))); }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm mt-1 focus:outline-none focus:border-purple-500/50 text-center"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">Level Name</h3>
              <input
                type="text"
                value={levelName}
                onChange={e => setLevelName(e.target.value)}
                placeholder={targetNamePlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">Players</h3>
              <div className="grid grid-cols-1 gap-2">
                {([0, 1, 2, 3] as const).map(i => {
                  const t = `spawn${i}` as Tool;
                  const slot = spawns[i];
                  return (
                    <button
                      key={t}
                      onClick={() => setTool(t)}
                      className={`text-sm px-3 py-3 rounded-xl border transition-all duration-200 text-left ${
                        tool === t
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-white/[0.02] border-white/[0.06] text-white/65 hover:bg-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-sm inline-block"
                          style={{ backgroundColor: slot ? SPAWN_COLORS[slot.rotation] : 'rgba(255,255,255,0.12)' }}
                        />
                        <span>{TOOL_LABELS[t]}</span>
                        <span className="ml-auto text-white/25 text-xs">{SHORTCUT_DISPLAY[t]}</span>
                      </span>
                      <span className="block mt-1 text-xs text-white/35">
                        {slot
                          ? `Placed at ${slot.col}, ${slot.row} facing ${DIRECTION_LABELS[slot.rotation]}`
                          : 'Select, then click the map to place'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {([0, 1, 2, 3] as const).map(i => (
                  <button
                    key={`dir-${i}`}
                    onClick={() => cycleSpawnRotation(i)}
                    disabled={!spawns[i]}
                    className="text-xs px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/5 hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {spawns[i] ? `Player ${i + 1}: ${DIRECTION_LABELS[spawns[i]!.rotation]}` : `Player ${i + 1}: Unset`}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Blocks tab */}
        {tab === 'blocks' && (
          <>
            {/* Tile tools */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">Tiles</h3>
              <div className="grid grid-cols-1 gap-2">
                {(['floor', 'wall', 'goal', 'kill', 'pushable', 'plate', 'door', 'ice', 'mud', 'crumble', 'reverse', 'tswitch', 'conveyor', 'oneway', 'rotation', 'blackhole'] as Tool[]).map(t => {
                  const colorMap: Record<string, string> = {
                    floor: '#1a1a2e', wall: '#050508', goal: '#1a6b3a', kill: '#8b2020',
                    pushable: '#5a4a3a', plate: '#1a2a3a', door: '#2a2040',
                    ice: '#1a2a3a', mud: '#2a1a10', crumble: '#2a2020', reverse: '#2a1a2e',
                    tswitch: '#2a2018',
                    conveyor: '#1a1a2e', oneway: '#1a1a2e', rotation: '#1e1a2e',
                    blackhole: '#143a22',
                  };
                  const borderMap: Record<string, string> = {
                    wall: 'border border-white/20', plate: 'border border-cyan-500/40',
                    door: 'border border-purple-400/40 border-dashed', ice: 'border border-cyan-300/30',
                    tswitch: 'border border-orange-400/40',
                    conveyor: 'border border-blue-400/40', oneway: 'border border-yellow-400/40',
                    rotation: 'border border-purple-400/40',
                    blackhole: 'border border-green-400/40',
                  };
                  return (
                    <button
                      key={t}
                      onClick={() => setTool(t)}
                      className={`text-sm px-3 py-3 rounded-xl border transition-all duration-200 text-left ${
                        tool === t
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-3.5 h-3.5 rounded-sm inline-block ${borderMap[t] || ''}`} style={{ backgroundColor: colorMap[t] }} />
                        <span>{TOOL_LABELS[t]}</span>
                        <span className="ml-auto text-white/25 text-xs">{SHORTCUT_DISPLAY[t]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-white/25 text-xs mt-3 leading-relaxed">
                Left-click places or removes the selected tile. Right-click cycles tile number or direction where supported.
              </p>
            </div>

            <button
              onClick={clearGrid}
              className="text-xs px-3 py-2 border border-white/10 rounded-lg text-white/40 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-200"
            >
              Clear All
            </button>
          </>
        )}

        {/* Publish tab */}
        {tab === 'publish' && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">Load or Save</h3>
            <label className="block mb-2">
              <span className="text-white/40 text-xs">Destination</span>
              <select
                value={publishScope}
                onChange={e => setPublishScope(e.target.value as PublishScope)}
                className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm mt-1 focus:outline-none focus:border-purple-500/50 [&>option]:bg-[#12121a] [&>option]:text-white"
              >
                <option value="campaign">Campaign Levels</option>
                <option value="community">Community Levels</option>
              </select>
            </label>
            {publishScope === 'campaign' ? (
              <label className="block mb-2">
                <span className="text-white/40 text-xs">Target Level</span>
                <select
                  value={saveTargetId}
                  onChange={e => setSaveTargetId(parseInt(e.target.value))}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm mt-1 focus:outline-none focus:border-purple-500/50 [&>option]:bg-[#12121a] [&>option]:text-white"
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="block mb-2">
                  <span className="text-white/40 text-xs">Community Slot</span>
                  <input
                    type="number"
                    min={1001}
                    value={communityTargetId}
                    onChange={e => setCommunityTargetId(Math.max(1001, parseInt(e.target.value) || 1001))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm mt-1 focus:outline-none focus:border-purple-500/50"
                  />
                </label>
                <div className="mb-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-white/35">
                  {communityLevels.length > 0
                    ? `Existing community slots: ${communityLevels.map(level => level.id).join(', ')}`
                    : 'No community levels saved yet. The first save will create slot 1001.'}
                </div>
              </>
            )}
            <button
              onClick={handleLoad}
              className="w-full text-sm px-3 py-2 mb-3 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              Load Into Editor
            </button>
            <label className="block mb-3">
              <span className="text-white/40 text-xs">Admin Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm mt-1 focus:outline-none focus:border-purple-500/50"
                placeholder="Enter password"
              />
            </label>
            <button
              onClick={handleSave}
              className="w-full text-sm px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
            >
              {publishScope === 'campaign' ? 'Save Campaign Override' : 'Save Community Level'}
            </button>
            {message && (
              <p className={`text-xs mt-2 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {message.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full flex justify-center">
        <div className="w-full max-w-fit">
          <div
            className="rounded-xl overflow-hidden border border-white/10"
            style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.06)' }}
          >
            <canvas
              ref={canvasRef}
              width={width * tilePx}
              height={height * tilePx}
              className="block cursor-crosshair select-none"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              onContextMenu={handleContextMenu}
            />
          </div>
          {editorWarnings.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
              {editorWarnings.map((warning) => (
                <p key={warning} className="text-sm text-amber-200/90">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
