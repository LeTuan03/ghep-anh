import type { AccountInfo, HeroSkin } from '../mockData';

export interface GridSlot {
  x: number; // 0 to 5
  y: number; // 0 to 3
  type: 'accountInfo' | 'hero';
  hero?: HeroSkin;
  spanX?: number;
  spanY?: number;
}

export function generateLayout(account: AccountInfo): GridSlot[] {
  const COLS = 6;
  const ROWS = 4;
  const CENTER_X = (COLS - 1) / 2;
  const CENTER_Y = (ROWS - 1) / 2;

  // 1. Initialize empty grid (false = empty, true = filled)
  const filled = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  );

  const slots: GridSlot[] = [];

  // 2. Place AccountInfo on the middle left (x: 0, 1; y: 1)
  // According to the image, it spans 2 cols on the left.
  slots.push({
    x: 0,
    y: 1,
    type: 'accountInfo',
    spanX: 2,
    spanY: 1,
  });
  filled[1][0] = true;
  filled[1][1] = true;

  // 3. Get all empty coordinates
  let emptyCoords: { x: number; y: number; dist: number }[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!filled[y][x]) {
        // Calculate distance from center
        const dist = Math.sqrt(Math.pow(x - CENTER_X, 2) + Math.pow(y - CENTER_Y, 2));
        emptyCoords.push({ x, y, dist });
      }
    }
  }

  // Sort by distance (closest to center first)
  emptyCoords.sort((a, b) => a.dist - b.dist);

  // 4. Sort heroes by hotness (isHot = higher priority). 
  // Normally you'd sort by a numeric hotness score. Here we use isHot boolean, 
  // maybe fallback to string length or random just to diversify if we had scores.
  const sortedHeroes = [...account.featuredHeroes].sort((a, b) => {
    if (a.isHot && !b.isHot) return -1;
    if (!a.isHot && b.isHot) return 1;
    // Tie breaker
    return 0;
  });

  // 5. Assign heroes to coordinates
  for (let i = 0; i < emptyCoords.length && i < sortedHeroes.length; i++) {
    const coord = emptyCoords[i];
    slots.push({
      ...coord,
      type: 'hero',
      hero: sortedHeroes[i],
      spanX: 1,
      spanY: 1,
    });
  }

  // Final sort to render nicely in flex/grid container?
  // CSS Grid with absolute column/row assignment doesn't need strict array order, 
  // but let's sort by row, then col to be safe.
  slots.sort((a, b) => {
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });

  return slots;
}
