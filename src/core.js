(function (root) {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function movePlayer(player, platforms, dt) {
    player.x += player.vx * dt;
    for (const platform of platforms) if (overlaps(player, platform)) {
      if (player.vx > 0) player.x = platform.x - player.w;
      else if (player.vx < 0) player.x = platform.x + platform.w;
    }
    player.vy += 1100 * dt;
    const oldBottom = player.y + player.h;
    player.y += player.vy * dt;
    player.grounded = false;
    for (const platform of platforms) if (overlaps(player, platform)) {
      if (player.vy >= 0 && oldBottom <= platform.y + 2) {
        player.y = platform.y - player.h; player.vy = 0; player.grounded = true;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.h; player.vy = 0;
      }
    }
    return player;
  }
  const core = { clamp, overlaps, shuffle, movePlayer };
  root.ArcadeCore = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(globalThis);
