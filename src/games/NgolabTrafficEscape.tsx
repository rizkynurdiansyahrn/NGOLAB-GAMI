import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CarFront, ChevronRight, CircleHelp, DoorOpen, Flag, RotateCcw, Sparkles, Trophy } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  onScoreChange?: (score: number) => void;
}

type Orientation = 'H' | 'V';
type GamePhase = 'START' | 'PLAYING' | 'LEVEL_CLEAR' | 'LEVEL_FAILED' | 'GAMEOVER';
type LevelDifficulty = 'MUDAH' | 'SULIT' | 'SANGAT SULIT';

interface Vehicle {
  id: string;
  name: string;
  row: number;
  col: number;
  length: 2 | 3;
  orientation: Orientation;
  color: string;
  target?: boolean;
}

interface TrafficLevel {
  name: string;
  difficulty: LevelDifficulty;
  par: number;
  hint: string;
  vehicles: Vehicle[];
}

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originRow: number;
  originCol: number;
  row: number;
  col: number;
}

interface DragPreview {
  id: string;
  row: number;
  col: number;
}

const GRID_SIZE = 6;

const levels: TrafficLevel[] = [
  {
    name: 'Gerbang Pertama',
    difficulty: 'MUDAH',
    par: 4,
    hint: 'Buka ruang untuk kendaraan yang melintang di bawah jalur mobil merah.',
    vehicles: [
      { id: 'target', name: 'Mobil Merah', row: 2, col: 0, length: 2, orientation: 'H', color: 'target', target: true },
      { id: 'a', name: 'Mobil Biru', row: 0, col: 0, length: 2, orientation: 'H', color: 'blue' },
      { id: 'b', name: 'Mobil Ungu', row: 1, col: 0, length: 2, orientation: 'H', color: 'violet' },
      { id: 'c', name: 'Van Toska', row: 0, col: 2, length: 3, orientation: 'V', color: 'teal' },
      { id: 'd', name: 'Mobil Kuning', row: 1, col: 4, length: 2, orientation: 'V', color: 'yellow' },
      { id: 'e', name: 'Mobil Hijau', row: 4, col: 1, length: 3, orientation: 'H', color: 'green' },
      { id: 'f', name: 'Van Jingga', row: 3, col: 0, length: 2, orientation: 'V', color: 'orange' },
      { id: 'g', name: 'Mobil Pink', row: 5, col: 4, length: 2, orientation: 'H', color: 'pink' },
    ],
  },
  {
    name: 'Persimpangan Ramai',
    difficulty: 'MUDAH',
    par: 3,
    hint: 'Dua kendaraan menutup jalur keluar. Geser masing-masing mengikuti lajurnya.',
    vehicles: [
      { id: 'target', name: 'Mobil Merah', row: 2, col: 0, length: 2, orientation: 'H', color: 'target', target: true },
      { id: 'a', name: 'Van Toska', row: 0, col: 2, length: 3, orientation: 'V', color: 'teal' },
      { id: 'b', name: 'Mobil Kuning', row: 1, col: 4, length: 2, orientation: 'V', color: 'yellow' },
      { id: 'c', name: 'Mobil Biru', row: 0, col: 0, length: 2, orientation: 'H', color: 'blue' },
      { id: 'd', name: 'Mobil Ungu', row: 4, col: 0, length: 2, orientation: 'H', color: 'violet' },
      { id: 'e', name: 'Van Hijau', row: 3, col: 5, length: 3, orientation: 'V', color: 'green' },
      { id: 'f', name: 'Mobil Pink', row: 5, col: 0, length: 2, orientation: 'H', color: 'pink' },
      { id: 'g', name: 'Mobil Jingga', row: 1, col: 0, length: 2, orientation: 'H', color: 'orange' },
    ],
  },
  {
    name: 'Jalur Bertingkat',
    difficulty: 'SULIT',
    par: 6,
    hint: 'Kosongkan petak di dua baris paling bawah agar van panjang bisa turun.',
    vehicles: [
      { id: 'target', name: 'Mobil Merah', row: 2, col: 0, length: 2, orientation: 'H', color: 'target', target: true },
      { id: 'a', name: 'Van Toska', row: 1, col: 2, length: 3, orientation: 'V', color: 'teal' },
      { id: 'b', name: 'Mobil Kuning', row: 2, col: 4, length: 2, orientation: 'V', color: 'yellow' },
      { id: 'c', name: 'Mobil Ungu', row: 0, col: 4, length: 2, orientation: 'H', color: 'violet' },
      { id: 'd', name: 'Mobil Jingga', row: 4, col: 2, length: 2, orientation: 'H', color: 'orange' },
      { id: 'e', name: 'Mobil Pink', row: 5, col: 0, length: 3, orientation: 'H', color: 'pink' },
    ],
  },
  {
    name: 'Persimpangan Terkunci',
    difficulty: 'SANGAT SULIT',
    par: 7,
    hint: 'Geser dua mobil mendatar di bagian tengah papan sebelum menurunkan kendaraan vertikal.',
    vehicles: [
      { id: 'target', name: 'Mobil Merah', row: 1, col: 0, length: 2, orientation: 'H', color: 'target', target: true },
      { id: 'a', name: 'Mobil Biru', row: 0, col: 2, length: 2, orientation: 'V', color: 'blue' },
      { id: 'b', name: 'Mobil Hijau', row: 1, col: 3, length: 2, orientation: 'V', color: 'green' },
      { id: 'c', name: 'Mobil Kuning', row: 0, col: 4, length: 2, orientation: 'V', color: 'yellow' },
      { id: 'd', name: 'Mobil Pink', row: 1, col: 5, length: 2, orientation: 'V', color: 'pink' },
      { id: 'e', name: 'Mobil Jingga', row: 2, col: 1, length: 2, orientation: 'H', color: 'orange' },
      { id: 'f', name: 'Van Toska', row: 3, col: 4, length: 2, orientation: 'H', color: 'teal' },
    ],
  },
  {
    name: 'Macet Total',
    difficulty: 'SANGAT SULIT',
    par: 8,
    hint: 'Pindahkan mobil mendatar di baris atas dan tengah, lalu buka jalur bagi empat penghalang vertikal.',
    vehicles: [
      { id: 'target', name: 'Mobil Merah', row: 4, col: 0, length: 2, orientation: 'H', color: 'target', target: true },
      { id: 'a', name: 'Mobil Biru', row: 3, col: 2, length: 2, orientation: 'V', color: 'blue' },
      { id: 'b', name: 'Mobil Hijau', row: 4, col: 3, length: 2, orientation: 'V', color: 'green' },
      { id: 'c', name: 'Mobil Kuning', row: 4, col: 4, length: 2, orientation: 'V', color: 'yellow' },
      { id: 'd', name: 'Mobil Pink', row: 4, col: 5, length: 2, orientation: 'V', color: 'pink' },
      { id: 'e', name: 'Van Toska', row: 2, col: 4, length: 2, orientation: 'H', color: 'teal' },
      { id: 'f', name: 'Mobil Jingga', row: 1, col: 2, length: 2, orientation: 'H', color: 'orange' },
      { id: 'g', name: 'Mobil Ungu', row: 3, col: 4, length: 2, orientation: 'H', color: 'violet' },
    ],
  },
];

const carStyles: Record<string, string> = {
  blue: 'from-sky-400 to-blue-600 border-sky-200/60',
  violet: 'from-violet-400 to-purple-700 border-violet-200/60',
  teal: 'from-teal-300 to-emerald-600 border-teal-100/60',
  yellow: 'from-amber-300 to-yellow-600 border-yellow-100/70',
  green: 'from-lime-300 to-green-600 border-lime-100/60',
  orange: 'from-orange-300 to-orange-600 border-orange-100/60',
  pink: 'from-pink-300 to-rose-600 border-pink-100/60',
  target: 'from-rose-400 via-red-500 to-red-700 border-rose-100 shadow-[0_0_22px_rgba(248,74,88,0.38)]',
};

const getCells = (vehicle: Vehicle, row = vehicle.row, col = vehicle.col) => (
  Array.from({ length: vehicle.length }, (_, index) => vehicle.orientation === 'H'
    ? { row, col: col + index }
    : { row: row + index, col })
);

const canPlace = (vehicle: Vehicle, row: number, col: number, vehicles: Vehicle[]) => {
  const cells = getCells(vehicle, row, col);
  if (cells.some((cell) => cell.row < 0 || cell.row >= GRID_SIZE || cell.col < 0 || cell.col >= GRID_SIZE)) return false;

  return cells.every((cell) => vehicles.every((other) => {
    if (other.id === vehicle.id) return true;
    return !getCells(other).some((otherCell) => otherCell.row === cell.row && otherCell.col === cell.col);
  }));
};

const getReachablePosition = (vehicle: Vehicle, desiredRow: number, desiredCol: number, vehicles: Vehicle[]) => {
  const origin = vehicle.orientation === 'H' ? vehicle.col : vehicle.row;
  const desired = vehicle.orientation === 'H' ? desiredCol : desiredRow;
  const limit = GRID_SIZE - vehicle.length;
  const bounded = Math.max(0, Math.min(limit, desired));
  const direction = Math.sign(bounded - origin);
  let available = origin;

  for (let step = 1; step <= Math.abs(bounded - origin); step += 1) {
    const next = origin + direction * step;
    const row = vehicle.orientation === 'H' ? vehicle.row : next;
    const col = vehicle.orientation === 'H' ? next : vehicle.col;
    if (!canPlace(vehicle, row, col, vehicles)) break;
    available = next;
  }

  return vehicle.orientation === 'H'
    ? { row: vehicle.row, col: available }
    : { row: available, col: vehicle.col };
};

const cloneVehicles = (vehicles: Vehicle[]) => vehicles.map((vehicle) => ({ ...vehicle }));

export default function NgolabTrafficEscape({ onGameOver, onExit, onScoreChange }: GameProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [phase, setPhase] = useState<GamePhase>('START');
  const [levelIndex, setLevelIndex] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>(cloneVehicles(levels[0].vehicles));
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [lastLevelScore, setLastLevelScore] = useState(0);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  const level = levels[levelIndex];
  const moveLimit = level.difficulty === 'MUDAH' ? level.par + 4 : level.par + 1;
  const targetVehicle = vehicles.find((vehicle) => vehicle.target) ?? vehicles[0];

  const startGame = () => {
    setLevelIndex(0);
    setVehicles(cloneVehicles(levels[0].vehicles));
    setMoves(0);
    setScore(0);
    setLastLevelScore(0);
    setHintVisible(false);
    setDragPreview(null);
    dragStateRef.current = null;
    setPhase('PLAYING');
  };

  const finishLevel = (nextMoves: number) => {
    const earned = Math.max(100, 500 + (level.par - nextMoves) * 50);
    const nextScore = score + earned;
    setMoves(nextMoves);
    setLastLevelScore(earned);
    setScore(nextScore);
    onScoreChange?.(nextScore);

    if (levelIndex === levels.length - 1) {
      setPhase('GAMEOVER');
      onGameOver(nextScore);
    } else {
      setPhase('LEVEL_CLEAR');
    }
  };

  const moveVehicle = (event: React.PointerEvent<HTMLButtonElement>, vehicle: Vehicle) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.id !== vehicle.id || phase !== 'PLAYING') return;
    const board = boardRef.current;
    if (!board) return;
    const cellSize = board.getBoundingClientRect().width / GRID_SIZE;
    const distance = vehicle.orientation === 'H'
      ? Math.round((event.clientX - drag.startX) / cellSize)
      : Math.round((event.clientY - drag.startY) / cellSize);
    const desiredRow = vehicle.orientation === 'V' ? drag.originRow + distance : drag.originRow;
    const desiredCol = vehicle.orientation === 'H' ? drag.originCol + distance : drag.originCol;
    const next = getReachablePosition(vehicle, desiredRow, desiredCol, vehicles);
    drag.row = next.row;
    drag.col = next.col;
    setDragPreview({ id: vehicle.id, row: next.row, col: next.col });
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>, vehicle: Vehicle) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.id !== vehicle.id) return;

    const moved = drag.row !== drag.originRow || drag.col !== drag.originCol;
    if (moved) {
      const nextVehicles = vehicles.map((item) => item.id === vehicle.id ? { ...item, row: drag.row, col: drag.col } : item);
      const nextMoves = moves + 1;
      setVehicles(nextVehicles);
      setMoves(nextMoves);
      const movedTarget = nextVehicles.find((item) => item.target);
      if (movedTarget && movedTarget.col + movedTarget.length >= GRID_SIZE && nextMoves <= moveLimit) {
        finishLevel(nextMoves);
      } else if (nextMoves >= moveLimit) {
        setPhase('LEVEL_FAILED');
      }
    }

    dragStateRef.current = null;
    setDragPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>, vehicle: Vehicle) => {
    if (phase !== 'PLAYING') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      id: vehicle.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originRow: vehicle.row,
      originCol: vehicle.col,
      row: vehicle.row,
      col: vehicle.col,
    };
    setDragPreview({ id: vehicle.id, row: vehicle.row, col: vehicle.col });
  };

  const cancelDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setDragPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resetLevel = () => {
    setVehicles(cloneVehicles(level.vehicles));
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setDragPreview(null);
    dragStateRef.current = null;
    if (nextMoves >= moveLimit) setPhase('LEVEL_FAILED');
  };

  const retryLevel = () => {
    setVehicles(cloneVehicles(level.vehicles));
    setMoves(0);
    setHintVisible(false);
    setDragPreview(null);
    dragStateRef.current = null;
    setPhase('PLAYING');
  };

  const nextLevel = () => {
    const nextIndex = levelIndex + 1;
    setLevelIndex(nextIndex);
    setVehicles(cloneVehicles(levels[nextIndex].vehicles));
    setMoves(0);
    setHintVisible(false);
    setPhase('PLAYING');
  };

  const formattedLevel = String(levelIndex + 1).padStart(2, '0');
  const shownMoves = moves;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#09101f] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(39,95,150,0.3),transparent_42%),radial-gradient(ellipse_at_95%_90%,rgba(248,108,75,0.12),transparent_32%)]" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-3 p-3 sm:gap-4 sm:p-5">
        <header className="flex shrink-0 flex-col justify-between gap-3 rounded-[24px] border border-white/10 bg-[#111d31]/90 px-3.5 py-3 shadow-[0_14px_38px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:rounded-[28px] sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-orange-100/20 bg-gradient-to-br from-orange-300 to-rose-400 text-[#39180f] shadow-[0_8px_24px_rgba(248,111,77,0.25)] sm:h-12 sm:w-12">
              <CarFront className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wide text-white sm:text-xl">TRAFFIC ESCAPE</h1>
              <p className="mt-0.5 hidden text-[11px] font-medium text-slate-400 sm:block">Geser kendaraan. Buka jalan untuk mobil merah.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.045] px-2.5 py-1.5 sm:min-w-[82px] sm:px-3">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.13em] text-slate-500">Level</div>
              <div className="mt-0.5 text-xs font-black tabular-nums text-orange-200 sm:text-sm">{formattedLevel}<span className="text-slate-500"> / 05</span></div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.045] px-2.5 py-1.5 sm:min-w-[82px] sm:px-3">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.13em] text-slate-500">Langkah · ideal {level.par}</div>
              <div className={`mt-0.5 text-xs font-black tabular-nums sm:text-sm ${shownMoves >= moveLimit - 1 && level.difficulty !== 'MUDAH' ? 'text-rose-200' : 'text-cyan-200'}`}>
                {shownMoves}<span className="text-slate-500"> / {moveLimit} batas</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.045] px-2.5 py-1.5 sm:min-w-[100px] sm:px-3">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.13em] text-slate-500">Skor</div>
              <div className="mt-0.5 text-xs font-black tabular-nums text-amber-200 sm:text-sm">{score.toLocaleString()}</div>
            </div>
          </div>
        </header>

        <div className="flex shrink-0 items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-300/10 text-orange-200 ring-1 ring-orange-100/20">
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Misi level {levelIndex + 1}</div>
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="min-w-0 truncate text-xs font-extrabold text-slate-100 sm:text-sm">{level.name}</div>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-black tracking-wide ${level.difficulty === 'MUDAH' ? 'bg-emerald-300/10 text-emerald-200' : level.difficulty === 'SULIT' ? 'bg-amber-300/10 text-amber-200' : 'bg-rose-300/10 text-rose-200'}`}>
                  {level.difficulty}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5" aria-label={`Level ${levelIndex + 1} dari ${levels.length}`}>
            {levels.map((_, index) => (
              <span key={index} className={`h-1.5 rounded-full transition-all ${index < levelIndex ? 'w-3 bg-emerald-300' : index === levelIndex ? 'w-6 bg-orange-300 shadow-[0_0_10px_rgba(253,157,93,0.55)]' : 'w-3 bg-white/15'}`} />
            ))}
          </div>
        </div>

        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[26px] border border-sky-100/10 bg-[#0d1728]/75 p-2 shadow-[0_22px_60px_rgba(0,0,0,0.3)] sm:rounded-[30px] sm:p-4">
          <div className="relative aspect-square h-full max-h-full w-auto max-w-full">
            <div className="absolute left-0 top-1/2 aspect-square w-[calc(100%-52px)] -translate-y-1/2">
            <div
              ref={boardRef}
              className="absolute inset-0 grid grid-cols-6 grid-rows-6 overflow-hidden rounded-[22px] border border-sky-100/25 bg-[#15243a] shadow-[0_16px_50px_rgba(0,0,0,0.3),inset_0_0_35px_rgba(72,149,194,0.1)] sm:rounded-[28px]"
              style={{
                backgroundImage: 'linear-gradient(rgba(163, 201, 225, 0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(163, 201, 225, 0.11) 1px, transparent 1px), radial-gradient(circle at 20% 12%, rgba(84, 159, 193, 0.14), transparent 55%)',
                backgroundSize: 'calc(100% / 6) calc(100% / 6), calc(100% / 6) calc(100% / 6), 100% 100%',
              }}
            >
              {vehicles.map((vehicle) => {
                const preview = dragPreview?.id === vehicle.id ? dragPreview : vehicle;
                const isHorizontal = vehicle.orientation === 'H';
                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    aria-label={`${vehicle.name}, bergerak ${isHorizontal ? 'mendatar' : 'tegak'}`}
                    title={`${vehicle.name} — geser ${isHorizontal ? 'kiri atau kanan' : 'atas atau bawah'}`}
                    onPointerDown={(event) => beginDrag(event, vehicle)}
                    onPointerMove={(event) => moveVehicle(event, vehicle)}
                    onPointerUp={(event) => endDrag(event, vehicle)}
                    onPointerCancel={cancelDrag}
                    className={`absolute z-10 cursor-grab touch-none select-none p-[1.05%] active:cursor-grabbing ${dragPreview?.id === vehicle.id ? 'z-20' : ''}`}
                    style={{
                      left: `${(preview.col / GRID_SIZE) * 100}%`,
                      top: `${(preview.row / GRID_SIZE) * 100}%`,
                      width: `${(vehicle.orientation === 'H' ? vehicle.length : 1) / GRID_SIZE * 100}%`,
                      height: `${(vehicle.orientation === 'V' ? vehicle.length : 1) / GRID_SIZE * 100}%`,
                    }}
                  >
                    <span className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[10px] border bg-gradient-to-br shadow-[0_5px_12px_rgba(0,0,0,0.25)] transition-[filter,transform] ${vehicle.target ? 'border-rose-100/80 from-rose-400 via-red-500 to-red-700 shadow-[0_0_22px_rgba(248,74,88,0.38)]' : `border-white/40 ${carStyles[vehicle.color] ?? carStyles.blue}`} ${dragPreview?.id === vehicle.id ? 'brightness-110' : ''}`}>
                      <span className={`absolute rounded-md border border-white/30 bg-white/40 shadow-inner ${isHorizontal ? 'inset-y-[24%] right-[20%] w-[22%]' : 'inset-x-[24%] top-[18%] h-[22%]'}`} />
                      <span className={`absolute rounded-sm bg-[#101827]/75 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${isHorizontal ? 'bottom-[2%] left-[22%] top-[2%] w-[9%]' : 'left-[2%] right-[2%] top-[22%] h-[9%]'}`} />
                      <span className={`absolute rounded-sm bg-[#101827]/75 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${isHorizontal ? 'bottom-[2%] right-[22%] top-[2%] w-[9%]' : 'bottom-[22%] left-[2%] right-[2%] h-[9%]'}`} />
                      {vehicle.target ? (
                        <span className="relative z-10 flex items-center gap-1 rounded-full bg-red-950/30 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white sm:text-[10px]">
                          KELUAR <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className={`relative z-10 opacity-80 ${isHorizontal ? 'rotate-90' : ''}`}>
                          <CarFront className="h-3.5 w-3.5 text-white/85 sm:h-5 sm:w-5" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            </div>

            {targetVehicle && (
              <div
                className="pointer-events-none absolute left-[calc(100%-52px)] z-20 flex -translate-y-1/2 items-center gap-1 rounded-r-xl border-y border-r border-emerald-200/30 bg-emerald-400/15 px-1.5 py-2 text-[8px] font-black uppercase tracking-wider text-emerald-200 sm:gap-1.5 sm:px-2 sm:text-[9px]"
                style={{ top: `${((targetVehicle.row + 0.5) / GRID_SIZE) * 100}%` }}
              >
                <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" /> EXIT
              </div>
            )}
          </div>
        </main>

        <footer className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-h-8 items-start gap-2 px-1 text-[10px] font-semibold leading-4 text-slate-400 sm:max-w-[56%] sm:text-xs">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
            <span>
              <span>Geser mobil sesuai arah lajurnya. Kosongkan baris mobil merah sampai ke EXIT.</span>
              {hintVisible && <span className="mt-1 block text-amber-200">Petunjuk: {level.hint}</span>}
            </span>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setHintVisible((visible) => !visible)}
              aria-expanded={hintVisible}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-100/10 bg-amber-200/[0.05] px-2 py-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-100/80 transition hover:bg-amber-200/10 active:scale-[0.98] sm:min-h-11 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <CircleHelp className="h-4 w-4" aria-hidden="true" /> Petunjuk
            </button>
            <button
              type="button"
              onClick={resetLevel}
              disabled={phase !== 'PLAYING'}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 transition hover:bg-white/[0.09] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-11 sm:px-4 sm:text-xs"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Atur ulang
            </button>
            <button
              type="button"
              onClick={onExit}
              className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:scale-[0.98] sm:min-h-11 sm:px-4 sm:text-xs"
            >
              Keluar ke menu
            </button>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {(phase === 'START' || phase === 'LEVEL_CLEAR' || phase === 'LEVEL_FAILED' || phase === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#030817]/78 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto w-full max-w-[430px] overflow-hidden rounded-[28px] border border-sky-100/15 bg-[#111d31] p-5 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:rounded-[32px] sm:p-7"
            >
              <div className={`pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full blur-2xl ${phase === 'GAMEOVER' ? 'bg-amber-300/12' : phase === 'LEVEL_FAILED' ? 'bg-rose-300/12' : 'bg-orange-300/12'}`} />
              <div className="relative">
                <div className={`mx-auto mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-[23px] border text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] ${phase === 'GAMEOVER' ? 'border-amber-100/20 bg-gradient-to-br from-amber-300/25 to-orange-400/10 text-amber-200' : phase === 'LEVEL_CLEAR' ? 'border-emerald-100/20 bg-gradient-to-br from-emerald-300/25 to-teal-400/10 text-emerald-200' : phase === 'LEVEL_FAILED' ? 'border-rose-100/20 bg-gradient-to-br from-rose-300/25 to-red-400/10 text-rose-200' : 'border-orange-100/20 bg-gradient-to-br from-orange-300/25 to-rose-400/10 text-orange-100'}`}>
                  {phase === 'GAMEOVER' ? <Trophy className="h-8 w-8" /> : phase === 'LEVEL_CLEAR' ? <Sparkles className="h-8 w-8" /> : phase === 'LEVEL_FAILED' ? <RotateCcw className="h-8 w-8" /> : <CarFront className="h-9 w-9" />}
                </div>

                {phase === 'START' && (
                  <>
                    <div className="mb-1 inline-flex rounded-full border border-orange-100/10 bg-orange-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-orange-200">2 level mudah • 1 sulit • 2 sangat sulit</div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Traffic Escape</h2>
                    <p className="mx-auto mt-2 max-w-[340px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">Bantu mobil merah keluar dari kemacetan dengan menggeser kendaraan lain.</p>

            <div className="my-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200"><MoveRightIcon /></div>
                        <div>
                          <div className="text-xs font-extrabold text-white">Cara bermain</div>
                          <p className="mt-1 text-[10px] leading-5 text-slate-400 sm:text-xs">Tekan dan geser setiap mobil searah lajurnya. Buka jalur di baris mobil merah, lalu geser mobil itu sampai ke pintu EXIT. Mulai level 3, langkah dibatasi; atur ulang juga memakai satu langkah.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white/[0.04] px-2 py-3">
                        <div className="mx-auto mb-1.5 flex h-7 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-rose-400 to-red-600 text-[8px] font-black text-white">MERAH</div>
                        <div className="text-[9px] font-bold text-slate-300">Mobil target</div>
                      </div>
                      <div className="rounded-2xl bg-white/[0.04] px-2 py-3">
                        <MoveRightIcon />
                        <div className="mt-1 text-[9px] font-bold text-slate-300">Geser searah</div>
                      </div>
                      <div className="rounded-2xl bg-white/[0.04] px-2 py-3">
                        <DoorOpen className="mx-auto mb-1.5 h-5 w-5 text-emerald-200" aria-hidden="true" />
                        <div className="text-[9px] font-bold text-slate-300">Capai EXIT</div>
                      </div>
                    </div>

                    <button type="button" onClick={startGame} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-300 to-rose-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#30140e] shadow-[0_10px_24px_rgba(248,111,77,0.2)] transition hover:brightness-105 active:scale-[0.98]">
                      Mulai main <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Kembali ke menu</button>
                  </>
                )}

                {phase === 'LEVEL_CLEAR' && (
                  <>
                    <div className="mb-1 inline-flex rounded-full bg-emerald-300/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-200">Jalur berhasil dibuka</div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Bagus!</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Level {levelIndex + 1}: {level.name}</p>
                    <div className="my-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-3 py-4">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Langkah</div>
                        <div className="mt-1 text-2xl font-black tabular-nums text-cyan-200">{moves}</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/10 bg-emerald-300/[0.07] px-3 py-4">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-100/60">Poin level ini</div>
                        <div className="mt-1 text-2xl font-black tabular-nums text-emerald-200">+{lastLevelScore}</div>
                      </div>
                    </div>
                    <p className="mb-5 text-[10px] text-slate-500">Lebih sedikit langkah memberi skor lebih tinggi. Target ideal: {level.par} langkah.</p>
                    <button type="button" onClick={nextLevel} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-teal-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#09231e] shadow-[0_10px_24px_rgba(45,212,191,0.16)] transition hover:brightness-105 active:scale-[0.98]">
                      Lanjut level <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Keluar ke menu</button>
                  </>
                )}

                {phase === 'LEVEL_FAILED' && (
                  <>
                    <div className="mb-1 inline-flex rounded-full bg-rose-300/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-rose-200">Batas langkah tercapai</div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Coba strategi lain</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Batas level {levelIndex + 1} adalah {moveLimit} langkah. Susun ulang kendaraan dan cari jalur yang lebih efisien.</p>
                    <div className="my-5 rounded-[22px] border border-rose-200/10 bg-rose-300/[0.06] px-4 py-4">
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Langkah terpakai</div>
                      <div className="mt-1 text-3xl font-black tabular-nums tracking-tight text-rose-200">{moves} <span className="text-lg text-slate-400">/ {moveLimit}</span></div>
                    </div>
                    <button type="button" onClick={retryLevel} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-300 to-orange-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#30140e] shadow-[0_10px_24px_rgba(248,111,77,0.2)] transition hover:brightness-105 active:scale-[0.98]">
                      Ulangi level <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Keluar ke menu</button>
                  </>
                )}

                {phase === 'GAMEOVER' && (
                  <>
                    <div className="mb-1 inline-flex rounded-full bg-amber-300/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-200">Semua jalur terbuka</div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Macet terurai!</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Kamu berhasil membantu mobil merah melewati semua level.</p>
                    <div className="my-5 rounded-[22px] border border-amber-200/10 bg-amber-300/[0.06] px-4 py-4">
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Skor akhir</div>
                      <div className="mt-1 text-4xl font-black tabular-nums tracking-tight text-amber-200">{score.toLocaleString()}</div>
                    </div>
                    <button type="button" onClick={startGame} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-300 to-rose-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#30140e] shadow-[0_10px_24px_rgba(248,111,77,0.2)] transition hover:brightness-105 active:scale-[0.98]">
                      Main lagi <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Kembali ke menu</button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoveRightIcon() {
  return (
    <div className="mx-auto mb-1.5 flex h-7 items-center justify-center gap-0.5 text-sky-200" aria-hidden="true">
      <ArrowRight className="h-4 w-4" />
      <ArrowRight className="h-4 w-4" />
    </div>
  );
}
