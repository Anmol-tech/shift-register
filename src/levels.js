// Level data.
// Map legend: '#' wall, '.' floor, '~' pit, 'P' player start, 'G' goal.
// Objects are driven by registers (4-bit values):
//   bridge: covers pits, extends `value` tiles from (x,y) in `dir`
//   block:  solid barrier, extends `value` tiles from (x,y) in `dir`
//   door:   open only while bit `bit` of its register is 1
// `locked` lists shift directions that are disabled for that level.

const LEVELS = [
  {
    name: 'Hello, Shift',
    hint: 'Left Shift doubles R0. Make the bridge long enough to cross.',
    regs: [0b0001],
    map: [
      '##############',
      '#....~~~~....#',
      '#....~~~~....#',
      '#....~~~~....#',
      '#.P..~~~~..G.#',
      '#....~~~~....#',
      '#....~~~~....#',
      '#....~~~~....#',
      '##############',
    ],
    objects: [{ type: 'bridge', x: 5, y: 4, dir: 'R', reg: 0 }],
  },
  {
    name: 'Halve It',
    hint: 'Right Shift halves R0. Shrink the wall.',
    regs: [0b1000],
    map: [
      '##############',
      '#............#',
      '#............#',
      '#............#',
      '#.P........G.#',
      '#............#',
      '#............#',
      '#............#',
      '##############',
    ],
    objects: [{ type: 'block', x: 7, y: 1, dir: 'D', reg: 0 }],
  },
  {
    name: 'Shared Register',
    hint: 'One register drives the bridge AND the walls. Order matters.',
    regs: [0b0001],
    map: [
      '##############',
      '#..~~~~......#',
      '#..~~~~......#',
      '#..~~~~......#',
      '#P.~~~~....G.#',
      '#..~~~~......#',
      '#..~~~~......#',
      '#..~~~~......#',
      '##############',
    ],
    objects: [
      { type: 'bridge', x: 3, y: 4, dir: 'R', reg: 0 },
      { type: 'block', x: 9, y: 1, dir: 'D', reg: 0 },
      { type: 'block', x: 9, y: 7, dir: 'U', reg: 0 },
    ],
  },
  {
    name: 'Bit Gates',
    hint: 'Doors read a single bit. Tab switches registers.',
    regs: [0b0011, 0b0001],
    map: [
      '##############',
      '#....#########',
      '#....#########',
      '#....#########',
      '#.P....~~~..G#',
      '#....#########',
      '#....#########',
      '#....#########',
      '##############',
    ],
    objects: [
      { type: 'door', x: 5, y: 4, reg: 0, bit: 3 },
      { type: 'bridge', x: 7, y: 4, dir: 'R', reg: 1 },
      { type: 'door', x: 11, y: 4, reg: 0, bit: 1 },
    ],
  },
  {
    name: 'Overflow',
    hint: 'Your Right Shift key is broken. Bits that fall off the end are gone.',
    regs: [0b0111],
    locked: ['right'],
    map: [
      '##############',
      '#.......#....#',
      '#.......#....#',
      '#.......#....#',
      '#.P.........G#',
      '#.......#....#',
      '#.......#....#',
      '#.......#....#',
      '##############',
    ],
    objects: [
      { type: 'block', x: 8, y: 4, dir: 'R', reg: 0 },
    ],
  },
];
