// Pure game rules, shared by the game (src/game.js) and the solver (tools/solve.js).

const BITS = 4;
const MASK = (1 << BITS) - 1;
const DIRS = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };

// Turn a level's string map into a grid and pull out the player start.
function parseLevel(lvl) {
  const map = lvl.map.map((r) => r.split(''));
  let start = null;
  map.forEach((row, y) =>
    row.forEach((t, x) => {
      if (t === 'P') {
        start = { x, y };
        row[x] = '.';
      }
    })
  );
  return { map, start };
}

// Cells covered by a bridge or block: `value` tiles from its anchor, stopping at walls.
function span(map, obj, regs) {
  const len = regs[obj.reg];
  const [dx, dy] = DIRS[obj.dir];
  const cells = [];
  let x = obj.x, y = obj.y;
  for (let n = 0; n < len; n++) {
    if (map[y]?.[x] === undefined || map[y][x] === '#') break;
    cells.push(`${x},${y}`);
    x += dx;
    y += dy;
  }
  return cells;
}

function occupancy(level, map, regs) {
  const bridge = new Set();
  const solid = new Set();
  for (const o of level.objects) {
    if (o.type === 'bridge') span(map, o, regs).forEach((c) => bridge.add(c));
    else if (o.type === 'block') span(map, o, regs).forEach((c) => solid.add(c));
    else if (o.type === 'door' && !((regs[o.reg] >> o.bit) & 1)) solid.add(`${o.x},${o.y}`);
  }
  return { bridge, solid };
}

function walkable(map, x, y, occ) {
  const t = map[y]?.[x];
  if (t === undefined || t === '#') return false;
  const k = `${x},${y}`;
  if (occ.solid.has(k)) return false;
  if (t === '~' && !occ.bridge.has(k)) return false;
  return true;
}

// Apply a shift to register `sel`. Returns { ok: false, reason } when the shift is
// refused, otherwise the new registers plus whether a bit overflowed and whether
// the player is now standing over an uncovered pit.
function tryShift(level, map, regs, sel, which, player) {
  if (level.locked?.includes(which)) return { ok: false, reason: 'locked' };
  const next = regs.slice();
  const v = next[sel];
  next[sel] = which === 'left' ? (v << 1) & MASK : v >> 1;
  const occ = occupancy(level, map, next);
  const here = `${player.x},${player.y}`;
  if (occ.solid.has(here)) return { ok: false, reason: 'crush' };
  return {
    ok: true,
    regs: next,
    lost: which === 'left' && (v & (1 << (BITS - 1))) !== 0,
    fell: map[player.y][player.x] === '~' && !occ.bridge.has(here),
  };
}

if (typeof module !== 'undefined') {
  module.exports = { BITS, MASK, DIRS, parseLevel, span, occupancy, walkable, tryShift };
}
