const TILE = 48;
const COLS = 14;
const ROWS = 9;
const HUD_H = 150;
const REG_COLORS = [0x3dd6f5, 0xf55dcb, 0xf5c93d];
const COLORS = {
  bg: 0x0d1117,
  floor: 0x161b22,
  grid: 0x21262d,
  wall: 0x30363d,
  pit: 0x05070a,
  goal: 0x3fb950,
  player: 0xffffff,
};

class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
    this.levelIndex = 0;
  }

  create() {
    this.gfx = this.add.graphics();
    const font = { fontFamily: 'monospace' };
    this.titleText = this.add.text(16, ROWS * TILE + 12, '', { ...font, fontSize: '18px', color: '#e6edf3' });
    this.hintText = this.add.text(16, ROWS * TILE + 38, '', { ...font, fontSize: '14px', color: '#8b949e' });
    this.regTexts = [0, 1, 2].map((i) =>
      this.add.text(16 + i * 220, ROWS * TILE + 66, '', { ...font, fontSize: '22px', color: '#ffffff' })
    );
    this.msgText = this.add.text(16, ROWS * TILE + 100, '', { ...font, fontSize: '14px', color: '#f0883e' });
    this.helpText = this.add.text(16, ROWS * TILE + 124,
      'Move: arrows/WASD   L-Shift/Q: <<   R-Shift/E: >>   Tab: register   Z: undo   R: restart', {
        ...font, fontSize: '12px', color: '#6e7681',
      });
    this.labelTexts = [];

    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.loadLevel(this.levelIndex);
  }

  loadLevel(i) {
    this.levelIndex = i;
    if (i >= LEVELS.length) return this.showWin();
    const lvl = LEVELS[i];
    this.level = lvl;
    const { map, start } = parseLevel(lvl);
    this.map = map;
    this.player = start;
    this.regs = lvl.regs.slice();
    this.sel = 0;
    this.shifts = 0;
    this.history = [];
    this.busy = false;
    this.say('');
    this.redraw();
  }

  // ---- state helpers ----

  occupancy(regs) {
    return occupancy(this.level, this.map, regs);
  }

  snapshot() {
    this.history.push({ player: { ...this.player }, regs: this.regs.slice(), shifts: this.shifts });
  }

  // ---- input ----

  onKey(e) {
    if (this.levelIndex >= LEVELS.length) {
      if (e.code === 'Enter' || e.code === 'Space') this.loadLevel(0);
      return;
    }
    if (this.busy) return;
    const code = e.code;
    if (code === 'Tab') {
      e.preventDefault?.();
      this.sel = (this.sel + 1) % this.regs.length;
      return this.redraw();
    }
    if (code.startsWith('Digit')) {
      const n = Number(code.slice(5)) - 1;
      if (n >= 0 && n < this.regs.length) this.sel = n;
      return this.redraw();
    }
    if (code === 'ShiftLeft' || code === 'KeyQ') return this.shift('left');
    if (code === 'ShiftRight' || code === 'KeyE') return this.shift('right');
    if (code === 'KeyZ') return this.undo();
    if (code === 'KeyR') return this.loadLevel(this.levelIndex);
    const moves = {
      ArrowLeft: [-1, 0], KeyA: [-1, 0],
      ArrowRight: [1, 0], KeyD: [1, 0],
      ArrowUp: [0, -1], KeyW: [0, -1],
      ArrowDown: [0, 1], KeyS: [0, 1],
    };
    if (moves[code]) this.move(...moves[code]);
  }

  move(dx, dy) {
    const nx = this.player.x + dx, ny = this.player.y + dy;
    if (!walkable(this.map, nx, ny, this.occupancy(this.regs))) return;
    this.snapshot();
    this.player = { x: nx, y: ny };
    this.say('');
    this.redraw();
    if (this.map[ny][nx] === 'G') this.complete();
  }

  shift(which) {
    const res = tryShift(this.level, this.map, this.regs, this.sel, which, this.player);
    if (!res.ok) {
      this.say(res.reason === 'locked'
        ? `${which === 'left' ? 'Left' : 'Right'} Shift is broken on this level.`
        : 'That would crush you.');
      return this.cameras.main.shake(120, 0.006);
    }

    this.snapshot();
    this.regs = res.regs;
    this.shifts++;
    this.say(res.lost ? 'Overflow! A bit fell off the end.' : '');
    this.cameras.main.flash(80, 40, 60, 80);
    this.redraw();
    if (res.fell) this.fall();
  }

  undo() {
    const prev = this.history.pop();
    if (!prev) return;
    this.player = prev.player;
    this.regs = prev.regs;
    this.shifts = prev.shifts;
    this.say('');
    this.redraw();
  }

  fall() {
    this.busy = true;
    this.say('The bridge retracted. You fell into the bit bucket.');
    this.cameras.main.shake(250, 0.01);
    this.time.delayedCall(700, () => {
      this.busy = false;
      this.undo();
    });
  }

  complete() {
    this.busy = true;
    const verdict = this.shifts <= this.level.par ? 'Par!' : `Par is ${this.level.par}.`;
    this.say(`Level clear in ${this.shifts} shift${this.shifts === 1 ? '' : 's'}. ${verdict}`);
    this.time.delayedCall(1200,() => this.loadLevel(this.levelIndex + 1));
  }

  say(msg) {
    this.msgText.setText(msg);
  }

  // ---- drawing ----

  redraw() {
    const g = this.gfx;
    g.clear();
    this.labelTexts.forEach((t) => t.destroy());
    this.labelTexts = [];
    const occ = this.occupancy(this.regs);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = this.map[y][x];
        const px = x * TILE, py = y * TILE;
        const color = t === '#' ? COLORS.wall : t === '~' ? COLORS.pit : COLORS.floor;
        g.fillStyle(color).fillRect(px, py, TILE, TILE);
        if (t !== '#') g.lineStyle(1, COLORS.grid).strokeRect(px, py, TILE, TILE);
        if (t === 'G') {
          g.fillStyle(COLORS.goal, 0.25).fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
          g.lineStyle(2, COLORS.goal).strokeRect(px + 8, py + 8, TILE - 16, TILE - 16);
        }
      }
    }

    for (const o of this.level.objects) {
      const c = REG_COLORS[o.reg];
      if (o.type === 'door') {
        const open = (this.regs[o.reg] >> o.bit) & 1;
        const px = o.x * TILE, py = o.y * TILE;
        if (open) g.lineStyle(2, c, 0.5).strokeRect(px + 6, py + 6, TILE - 12, TILE - 12);
        else g.fillStyle(c, 0.85).fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        this.label(px + TILE / 2, py + TILE / 2, `b${o.bit}`, open ? c : 0x0d1117);
        continue;
      }
      const cells = span(this.map, o, this.regs);
      for (const k of cells) {
        const [x, y] = k.split(',').map(Number);
        const px = x * TILE, py = y * TILE;
        if (o.type === 'bridge') {
          g.fillStyle(c, 0.35).fillRect(px + 2, py + 10, TILE - 4, TILE - 20);
          g.lineStyle(2, c).strokeRect(px + 2, py + 10, TILE - 4, TILE - 20);
        } else {
          g.fillStyle(c, 0.8).fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        }
      }
      // anchor marker so retracted objects stay visible
      g.lineStyle(2, c, 0.9).strokeCircle(o.x * TILE + TILE / 2, o.y * TILE + TILE / 2, 6);
    }

    const { x, y } = this.player;
    g.fillStyle(COLORS.player).fillCircle(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE * 0.3);

    this.titleText.setText(`Level ${this.levelIndex + 1}/${LEVELS.length}: ${this.level.name}    shifts: ${this.shifts}  par: ${this.level.par}`);
    this.hintText.setText(this.level.hint);
    this.regTexts.forEach((t, i) => {
      if (i >= this.regs.length) return t.setText('');
      const v = this.regs[i];
      const bits = v.toString(2).padStart(BITS, '0');
      const mark = i === this.sel ? '>' : ' ';
      t.setText(`${mark}R${i} ${bits} (${String(v).padStart(2)})`);
      t.setColor('#' + REG_COLORS[i].toString(16).padStart(6, '0'));
      t.setAlpha(i === this.sel ? 1 : 0.5);
    });
  }

  label(x, y, str, color) {
    const t = this.add.text(x, y, str, {
      fontFamily: 'monospace', fontSize: '14px', color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    this.labelTexts.push(t);
  }

  showWin() {
    this.gfx.clear();
    this.labelTexts.forEach((t) => t.destroy());
    this.labelTexts = [];
    this.regTexts.forEach((t) => t.setText(''));
    this.titleText.setText('All levels cleared! 1111');
    this.hintText.setText('More levels coming. Press Enter to play again.');
    this.say('');
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COLS * TILE,
  height: ROWS * TILE + HUD_H,
  backgroundColor: COLORS.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: GameScene,
});
