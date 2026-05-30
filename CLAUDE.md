# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

There is no build step or package manager. Serve the project root with any static HTTP server:

```bash
npx http-server . -p 8080
```

Then open http://localhost:8080 in a browser.

## Architecture

The game is implemented in two files:

- **index.html** — layout, CSS, and HUD elements (`#score`, `#lives`, `#level`, `#message`, `#restart-btn`). All styling is inline in `<style>`.
- **main.js** — all game logic, no external dependencies.

### main.js structure

| Symbol | Role |
|---|---|
| `state` | Single object holding all mutable game data: `ball`, `paddleX/W`, `blocks[]`, `lives`, `score`, `level`, `launched`, `over`, `won` |
| `initState(level)` | Resets `state`, builds block grid, seeds ball with level-scaled speed |
| `update()` | Per-frame logic: input → ball physics → collision detection → fall/win checks |
| `draw()` | Clears canvas, renders blocks / paddle / ball each frame |
| `loop()` | `update()` + `draw()` + `requestAnimationFrame(loop)` |

**Block collision** uses AABB overlap: compares X-overlap vs Y-overlap to decide whether to invert `vx` or `vy`.

**Paddle reflection** maps hit position `[-1, 1]` to an angle (max ±60°) using `sin/cos`, preserving ball speed magnitude.

**Level progression**: each level increases ball speed by `0.5` and shrinks paddle width by `5px` (min 40px).
