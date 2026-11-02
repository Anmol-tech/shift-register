// Checks every level is solvable and prints the fewest-shifts solution.
// Usage: node tools/solve.js [levelNumber]
const { parseLevel, occupancy, walkable, tryShift } = require('../src/rules.js');
const { LEVELS } = require('../src/levels.js');

const MOVES = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };

// Dijkstra on (shifts, steps): fewest shifts first, then the shortest walk.
const STEP = 1, SHIFT = 1000;

function solve(level) {
  const { map, start } = parseLevel(level);
  const key = (p, regs) => `${p.x},${p.y}|${regs.join(',')}`;
  const best = new Map([[key(start, level.regs), 0]]);
  const heap = [{ p: start, regs: level.regs.slice(), cost: 0, path: '' }];
  const pop = () => {
    let i = 0;
    for (let j = 1; j < heap.length; j++) if (heap[j].cost < heap[i].cost) i = j;
    return heap.splice(i, 1)[0];
  };
  while (heap.length) {
    const s = pop();
    if (best.get(key(s.p, s.regs)) < s.cost) continue;
    if (map[s.p.y][s.p.x] === 'G') return { shifts: Math.floor(s.cost / SHIFT), path: s.path, states: best.size };

    const push = (p, regs, cost, step) => {
      const k = key(p, regs);
      if (best.has(k) && best.get(k) <= cost) return;
      best.set(k, cost);
      heap.push({ p, regs, cost, path: s.path + step });
    };

    const occ = occupancy(level, map, s.regs);
    for (const [m, [dx, dy]] of Object.entries(MOVES)) {
      const p = { x: s.p.x + dx, y: s.p.y + dy };
      if (walkable(map, p.x, p.y, occ)) push(p, s.regs, s.cost + STEP, m);
    }
    for (let r = 0; r < s.regs.length; r++) {
      for (const which of ['left', 'right']) {
        const res = tryShift(level, map, s.regs, r, which, s.p);
        if (res.ok && !res.fell) push(s.p, res.regs, s.cost + SHIFT, ` [R${r}${which === 'left' ? '<<' : '>>'}] `);
      }
    }
  }
  return null;
}

// Collapse runs like "RRRR" to "R4" so solutions are readable.
const compress = (path) => path.replace(/([RLUD])\1+/g, (m, c) => c + m.length).replace(/\s+/g, ' ').trim();

const only = Number(process.argv[2]);
let failed = false;
LEVELS.forEach((lvl, i) => {
  if (only && only !== i + 1) return;
  const res = solve(lvl);
  const label = `${String(i + 1).padStart(2)}. ${lvl.name.padEnd(20)}`;
  if (!res) {
    failed = true;
    return console.log(`${label} UNSOLVABLE`);
  }
  const parNote = lvl.par !== undefined && lvl.par !== res.shifts ? `  (par says ${lvl.par}!)` : '';
  console.log(`${label} min shifts ${res.shifts}  states ${res.states}${parNote}\n    ${compress(res.path)}`);
  if (parNote) failed = true;
});
process.exit(failed ? 1 : 0);
