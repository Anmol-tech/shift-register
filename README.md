# Shift Register

A bit-shift puzzle game for [GitHub Game Off 2026](https://itch.io/jam/game-off-2026) (theme: **SHIFT**).

Every bridge, wall and door is wired to a 4-bit register. **Left Shift** doubles it (`<<`), **Right Shift** halves it (`>>`). Bits that fall off the end are gone for good.

## Controls

| Key | Action |
| --- | --- |
| Arrows / WASD | Move |
| Left Shift / Q | Shift selected register left (`<<`) |
| Right Shift / E | Shift selected register right (`>>`) |
| Tab / 1-3 | Select register |
| Z | Undo |
| R | Restart level |

## Run locally

```bash
python3 -m http.server 8137
```

Then open http://localhost:8137.

## Structure

- `index.html`: page shell; loads Phaser 3.80.1 from a CDN
- `src/rules.js`: pure game rules, shared by the game and the solver
- `src/levels.js`: level maps, register-driven objects (`bridge`, `block`, `door`) and par
- `src/game.js`: Phaser scene, input and rendering
- `tools/solve.js`: solver that checks every level is solvable and its par is right

## Checking levels

```bash
node tools/solve.js      # all levels
node tools/solve.js 7    # just level 7
```

It prints the fewest-shifts solution for each level and exits non-zero if a level is unsolvable or its `par` is wrong.
