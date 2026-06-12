import {
  VIRTUAL_WIDTH, VIRTUAL_HEIGHT, ASPECT_RATIO,
  type GameData, type Player, type Enemy, type PowerUp, type UpgradeChoice,
} from './types';
import { type InputConfig } from './InputConfig';
import { Renderer } from './Renderer';
import { InputManager } from './InputManager';
import { FM26Renderer } from './FM26Renderer';
import { FM26MenuState, FM26_CLUBS, FM26_NEWS, FM26_USER } from './FM26Types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private fm26Renderer: FM26Renderer;
  private input: InputManager;
  private game!: GameData;
  private fm26State!: FM26MenuState;
  private lastTime = 0;
  private animFrame = 0;
  private fpsFrames = 0;
  private fpsTime = 0;
  private scale = 1;
  private gameMode: 'fm26' | 'shooter' = 'fm26';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx);
    this.fm26Renderer = new FM26Renderer(this.ctx);
    this.input = new InputManager();
    this.initFM26();
    this.resetGame();
  }

  private initFM26() {
    this.fm26State = {
      currentScreen: 'main',
      selectedClub: null,
      currentDate: '15 January 2026',
      newsItems: FM26_NEWS,
      userProfile: FM26_USER,
      hoveredButton: '',
      animTime: 0,
    };
  }

  setInputConfig(config: InputConfig) {
    this.input.setConfig(config);
  }

  getInputManager(): InputManager {
    return this.input;
  }

  private resetGame() {
    const oldHighScore = this.game?.highScore || 0;
    this.game = {
      state: this.game?.state || 'menu',
      player: this.createPlayer(),
      bullets: [],
      enemies: [],
      particles: [],
      powerUps: [],
      score: 0,
      highScore: oldHighScore,
      wave: 0,
      waveTimer: 0,
      waveDelay: 180,
      enemiesRemaining: 0,
      totalEnemiesInWave: 0,
      spawnTimer: 0,
      screenShake: { intensity: 0, duration: 0, timer: 0 },
      comboCount: 0,
      comboTimer: 0,
      stars: [],
      flashTimer: 0,
      flashColor: '#fff',
      menuAnim: 0,
      gameTime: 0,
      fps: 60,
      upgradeChoices: [],
      mouseVX: 0,
      mouseVY: 0,
      hoveredId: '',
    };
  }

  private createPlayer(): Player {
    return {
      x: VIRTUAL_WIDTH / 2,
      y: VIRTUAL_HEIGHT - 150,
      w: 48,
      h: 56,
      hp: 5,
      maxHp: 5,
      speed: 8,
      shootTimer: 0,
      shootInterval: 10,
      damage: 1,
      shield: 3,
      maxShield: 3,
      shieldRegen: 0.003,
      invincibleTimer: 0,
      bulletSpeed: 18,
      bulletSize: 5,
      multishot: 1,
    };
  }

  resize(containerWidth: number, containerHeight: number) {
    const containerAspect = containerWidth / containerHeight;

    let drawWidth: number, drawHeight: number;

    if (containerAspect > ASPECT_RATIO) {
      // Container is wider than 16:9 -> fit by height (letterbox sides)
      drawHeight = containerHeight;
      drawWidth = drawHeight * ASPECT_RATIO;
    } else {
      // Container is taller than 16:9 -> fit by width (letterbox top/bottom)
      drawWidth = containerWidth;
      drawHeight = drawWidth / ASPECT_RATIO;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = drawWidth * dpr;
    this.canvas.height = drawHeight * dpr;
    this.canvas.style.width = `${drawWidth}px`;
    this.canvas.style.height = `${drawHeight}px`;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${(containerWidth - drawWidth) / 2}px`;
    this.canvas.style.top = `${(containerHeight - drawHeight) / 2}px`;

    this.scale = drawWidth / VIRTUAL_WIDTH;

    this.ctx.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, 0, 0);
  }

  // Convert screen (viewport) coordinates to virtual game coordinates
  screenToVirtual(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left) / this.scale,
      y: (screenY - rect.top) / this.scale,
    };
  }

  handleMouseMove(screenX: number, screenY: number) {
    const pos = this.screenToVirtual(screenX, screenY);
    this.input.setMousePos(pos.x, pos.y);
    this.game.mouseVX = pos.x;
    this.game.mouseVY = pos.y;
    // Hit-test UI buttons
    this.game.hoveredId = this.hitTestUI(pos.x, pos.y);
  }

  private hitTestUI(mx: number, my: number): string {
    // FM26 Menu hit testing
    if (this.gameMode === 'fm26') {
      if (this.fm26State.currentScreen === 'main') {
        // Main menu buttons
        const buttons = [
          { id: 'continue', y: 340 },
          { id: 'newgame', y: 418 },
          { id: 'loadgame', y: 496 },
          { id: 'settings', y: 574 },
          { id: 'credits', y: 652 },
          { id: 'exit', y: 730 },
        ];
        for (const btn of buttons) {
          if (this.inRect(mx, my, 80, btn.y, 480, 70)) return btn.id;
        }
        // News items
        FM26_NEWS.slice(0, 3).forEach((item, i) => {
          if (this.inRect(mx, my, 696, 130 + i * 110, 568, 90)) {
            return `news_${item.id}`;
          }
        });
      } else if (this.fm26State.currentScreen === 'newgame') {
        // Club cards
        FM26_CLUBS.forEach((club, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 180 + col * 320;
          const y = 180 + row * 190;
          if (this.inRect(mx, my, x, y, 280, 160)) return `club_${club.id}`;
        });
        // Back button
        if (this.inRect(mx, my, 80, VIRTUAL_HEIGHT - 80, 140, 50)) return 'back';
      }
    }
    
    // Space shooter hit testing
    const g = this.game;
    if (g.state === 'menu') {
      if (this.inRect(mx, my, VIRTUAL_WIDTH / 2 - 200, 650, 400, 80)) return 'menu_start';
    } else if (g.state === 'gameover') {
      if (this.inRect(mx, my, VIRTUAL_WIDTH / 2 - 200, 620, 400, 80)) return 'gameover_back';
    } else if (g.state === 'paused') {
      if (this.inRect(mx, my, VIRTUAL_WIDTH / 2 - 200, VIRTUAL_HEIGHT / 2 + 20, 400, 80)) return 'pause_resume';
    } else if (g.state === 'upgrade') {
      const choices = g.upgradeChoices;
      const totalW = choices.length * 320 + (choices.length - 1) * 30;
      const startX = VIRTUAL_WIDTH / 2 - totalW / 2;
      for (let i = 0; i < choices.length; i++) {
        const cx = startX + i * 350;
        const cy = VIRTUAL_HEIGHT / 2 - 130;
        if (this.inRect(mx, my, cx, cy, 320, 300)) return `upgrade_${i}`;
      }
    }
    return '';
  }

  private inRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  handleClick(screenX: number, screenY: number) {
    const pos = this.screenToVirtual(screenX, screenY);

    // FM26 Menu clicks
    if (this.gameMode === 'fm26') {
      if (this.fm26State.currentScreen === 'main') {
        if (this.inRect(pos.x, pos.y, 80, 418, 480, 70)) {
          // New Game
          this.fm26State.currentScreen = 'newgame';
        }
        if (this.inRect(pos.x, pos.y, 80, 730, 480, 70)) {
          // Exit - just show message
          console.log('Exit clicked');
        }
      } else if (this.fm26State.currentScreen === 'newgame') {
        // Club selection
        FM26_CLUBS.forEach((club, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 180 + col * 320;
          const y = 180 + row * 190;
          if (this.inRect(pos.x, pos.y, x, y, 280, 160)) {
            this.fm26State.selectedClub = club;
            console.log('Selected club:', club.name);
          }
        });
        // Back button
        if (this.inRect(pos.x, pos.y, 80, VIRTUAL_HEIGHT - 80, 140, 50)) {
          this.fm26State.currentScreen = 'main';
        }
      }
      return;
    }

    // Space shooter clicks
    if (this.game.state === 'menu') {
      const btnX = VIRTUAL_WIDTH / 2 - 200;
      const btnY = 650;
      const btnW = 400;
      const btnH = 80;
      if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
        this.startGame();
      }
    } else if (this.game.state === 'gameover') {
      const btnX = VIRTUAL_WIDTH / 2 - 200;
      const btnY = 620;
      const btnW = 400;
      const btnH = 80;
      if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
        this.resetGame();
        this.game.state = 'menu';
      }
    } else if (this.game.state === 'upgrade') {
      const choices = this.game.upgradeChoices;
      const totalW = choices.length * 320 + (choices.length - 1) * 30;
      const startX = VIRTUAL_WIDTH / 2 - totalW / 2;
      for (let i = 0; i < choices.length; i++) {
        const cx = startX + i * 350;
        const cy = VIRTUAL_HEIGHT / 2 - 130;
        const cw = 320;
        const ch = 300;
        if (pos.x >= cx && pos.x <= cx + cw && pos.y >= cy && pos.y <= cy + ch) {
          choices[i].apply(this.game.player);
          this.game.state = 'playing';
          break;
        }
      }
    } else if (this.game.state === 'paused') {
      const btnX = VIRTUAL_WIDTH / 2 - 200;
      const btnY = VIRTUAL_HEIGHT / 2 + 20;
      const btnW = 400;
      const btnH = 80;
      if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
        this.game.state = 'playing';
      }
    }
  }

  handleKeyDown(key: string) {
    // Pause using configured bindings
    const pauseKeys = this.input.getConfig().keyBindings.pause;
    if (pauseKeys.includes(key)) {
      if (this.game.state === 'playing') {
        this.game.state = 'paused';
      } else if (this.game.state === 'paused') {
        this.game.state = 'playing';
      }
    }
    if (key === 'Enter' || key === ' ') {
      if (this.game.state === 'menu') this.startGame();
      if (this.game.state === 'gameover') {
        this.resetGame();
        this.game.state = 'menu';
      }
    }
    this.input.keyDown(key);
  }

  handleKeyUp(key: string) {
    this.input.keyUp(key);
  }

  private startGame() {
    this.resetGame();
    this.game.state = 'playing';
    this.game.wave = 0;
    this.game.waveTimer = 60;
  }

  start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  private loop = (now: number) => {
    const elapsed = now - this.lastTime;
    const dt = Math.min(elapsed / (1000 / 60), 3); // normalize to 60fps
    this.lastTime = now;

    // FPS counter
    this.fpsFrames++;
    if (now - this.fpsTime >= 1000) {
      this.game.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTime = now;
    }

    this.update(dt);
    this.render();

    this.animFrame = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // Always update stars and menu anim
    this.updateStars(dt);
    this.game.menuAnim += 0.02 * dt;

    if (this.game.state === 'playing') {
      this.game.gameTime += dt;
      this.updatePlayer(dt);
      this.updateBullets(dt);
      this.updateEnemies(dt);
      this.updateParticles(dt);
      this.updatePowerUps(dt);
      this.updateWaveSystem(dt);
      this.updateScreenShake(dt);
      this.updateCombo(dt);
      this.updateFlash(dt);
    } else if (this.game.state === 'menu' || this.game.state === 'gameover') {
      this.updateParticles(dt);
    }
  }

  private updateStars(dt: number) {
    for (const star of this.game.stars) {
      star.y += star.speed * dt;
      if (star.y > VIRTUAL_HEIGHT) {
        star.y = -5;
        star.x = Math.random() * VIRTUAL_WIDTH;
      }
    }
  }

  private updatePlayer(dt: number) {
    const p = this.game.player;
    const inputState = this.input.poll();

    let dx = inputState.moveX;
    let dy = inputState.moveY;

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    // Gamepad pause (edge-triggered from poll)
    if (inputState.pause) {
      if (this.game.state === 'playing') {
        this.game.state = 'paused';
      } else if (this.game.state === 'paused') {
        this.game.state = 'playing';
      }
    }

    p.x += dx * p.speed * dt;
    p.y += dy * p.speed * dt;

    // Clamp to canvas
    p.x = Math.max(p.w / 2, Math.min(VIRTUAL_WIDTH - p.w / 2, p.x));
    p.y = Math.max(p.h / 2, Math.min(VIRTUAL_HEIGHT - p.h / 2, p.y));

    // Auto-shoot
    p.shootTimer -= dt;
    if (p.shootTimer <= 0) {
      p.shootTimer = p.shootInterval;
      this.playerShoot();
    }

    // Shield regen
    if (p.shield < p.maxShield) {
      p.shield = Math.min(p.maxShield, p.shield + p.shieldRegen * dt);
    }

    // Invincibility
    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;

    // Engine trail particles
    if (Math.random() < 0.5 * dt) {
      this.game.particles.push({
        x: p.x + (Math.random() - 0.5) * 15,
        y: p.y + p.h / 2 + 5,
        vx: (Math.random() - 0.5) * 2,
        vy: 3 + Math.random() * 3,
        life: 20,
        maxLife: 20,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#00ccff' : '#0088ff',
        type: 'trail',
      });
    }
  }

  private playerShoot() {
    const p = this.game.player;
    const count = p.multishot;
    
    if (count === 1) {
      this.game.bullets.push({
        x: p.x, y: p.y - p.h / 2 - 10,
        vx: 0, vy: -p.bulletSpeed,
        damage: p.damage, size: p.bulletSize,
        color: '#00eeff', isEnemy: false,
      });
    } else {
      const spread = Math.min(count * 8, 40);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + ((i / (count - 1)) - 0.5) * (spread * Math.PI / 180);
        this.game.bullets.push({
          x: p.x, y: p.y - p.h / 2 - 10,
          vx: Math.cos(angle) * p.bulletSpeed,
          vy: Math.sin(angle) * p.bulletSpeed,
          damage: p.damage, size: p.bulletSize,
          color: '#00eeff', isEnemy: false,
        });
      }
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      const b = this.game.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Remove off-screen
      if (b.x < -50 || b.x > VIRTUAL_WIDTH + 50 || b.y < -50 || b.y > VIRTUAL_HEIGHT + 50) {
        this.game.bullets.splice(i, 1);
        continue;
      }

      if (b.isEnemy) {
        // Check player collision
        const p = this.game.player;
        if (p.invincibleTimer <= 0 && this.circleRect(b.x, b.y, b.size, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h)) {
          this.hitPlayer(b.damage);
          this.game.bullets.splice(i, 1);
        }
      } else {
        // Check enemy collision
        for (let j = this.game.enemies.length - 1; j >= 0; j--) {
          const e = this.game.enemies[j];
          if (this.circleRect(b.x, b.y, b.size, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
            e.hp -= b.damage;
            this.game.bullets.splice(i, 1);

            // Hit sparks
            for (let k = 0; k < 4; k++) {
              this.game.particles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 10, maxLife: 10,
                size: 2 + Math.random() * 3,
                color: '#ffcc00',
                type: 'spark',
              });
            }

            if (e.hp <= 0) {
              this.killEnemy(j);
            }
            break;
          }
        }
      }
    }
  }

  private hitPlayer(damage: number) {
    const p = this.game.player;
    if (p.shield > 0) {
      p.shield = Math.max(0, p.shield - damage);
      this.addShake(4, 8);
      this.game.flashTimer = 4;
      this.game.flashColor = '#0088ff44';
      this.input.vibrate(80, 0.15, 0.05);
    } else {
      p.hp -= damage;
      this.addShake(8, 15);
      this.game.flashTimer = 8;
      this.game.flashColor = '#ff000044';
      p.invincibleTimer = 60;
      this.input.vibrate(200, 0.5, 0.2);

      if (p.hp <= 0) {
        this.gameOver();
      }
    }
    // Combo reset
    this.game.comboCount = 0;
    this.game.comboTimer = 0;
  }

  private killEnemy(index: number) {
    const e = this.game.enemies[index];

    // Explosion particles
    const count = e.type === 'boss' ? 50 : e.type === 'tank' ? 25 : 15;
    for (let k = 0; k < count; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.game.particles.push({
        x: e.x, y: e.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        size: 3 + Math.random() * 6,
        color: e.color,
        type: 'explosion',
      });
    }

    // Score with combo
    this.game.comboCount++;
    this.game.comboTimer = 120;
    const comboMultiplier = Math.min(1 + (this.game.comboCount - 1) * 0.2, 5);
    this.game.score += Math.floor(e.points * comboMultiplier);
    if (this.game.score > this.game.highScore) {
      this.game.highScore = this.game.score;
    }

    this.game.enemiesRemaining--;
    this.addShake(3, 6);

    // Chance to drop powerup
    if (Math.random() < 0.12) {
      const types: PowerUp['type'][] = ['health', 'shield', 'damage', 'speed', 'multishot'];
      this.game.powerUps.push({
        x: e.x, y: e.y,
        size: 24,
        type: types[Math.floor(Math.random() * types.length)],
        vy: 2,
        glow: 0,
        glowDir: 1,
      });
    }

    this.game.enemies.splice(index, 1);
  }

  private gameOver() {
    this.game.state = 'gameover';
    this.input.vibrate(400, 0.8, 0.4);

    // Big explosion
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 12;
      this.game.particles.push({
        x: this.game.player.x, y: this.game.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 40,
        maxLife: 70,
        size: 3 + Math.random() * 8,
        color: ['#ff0000', '#ff6600', '#ffcc00', '#00ccff'][Math.floor(Math.random() * 4)],
        type: 'explosion',
      });
    }
    this.addShake(15, 30);
  }

  private updateEnemies(dt: number) {
    for (let i = this.game.enemies.length - 1; i >= 0; i--) {
      const e = this.game.enemies[i];
      e.patternTimer += dt;

      // Movement patterns
      let moveX = 0;
      switch (e.pattern) {
        case 'straight':
          break;
        case 'sine':
          moveX = Math.sin(e.patternTimer * 0.05) * 3;
          break;
        case 'zigzag':
          moveX = Math.sin(e.patternTimer * 0.1) > 0 ? 3 : -3;
          break;
      }

      e.x += moveX * dt;
      e.y += e.speed * dt;
      e.angle += 0.02 * dt;

      // Clamp X
      e.x = Math.max(e.w / 2, Math.min(VIRTUAL_WIDTH - e.w / 2, e.x));

      // Remove if off screen bottom
      if (e.y > VIRTUAL_HEIGHT + 100) {
        this.game.enemies.splice(i, 1);
        this.game.enemiesRemaining--;
        continue;
      }

      // Shooting
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.y > 50 && e.y < VIRTUAL_HEIGHT - 200) {
        e.shootTimer = e.shootInterval;
        const dx = this.game.player.x - e.x;
        const dy = this.game.player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bulletSpeed = e.type === 'boss' ? 7 : 5;

        if (e.type === 'boss') {
          // Boss shoots spread
          for (let a = -2; a <= 2; a++) {
            const angle = Math.atan2(dy, dx) + a * 0.2;
            this.game.bullets.push({
              x: e.x, y: e.y + e.h / 2,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              damage: 1, size: 6,
              color: '#ff3333', isEnemy: true,
            });
          }
        } else {
          this.game.bullets.push({
            x: e.x, y: e.y + e.h / 2,
            vx: (dx / dist) * bulletSpeed,
            vy: (dy / dist) * bulletSpeed,
            damage: 1, size: 4,
            color: '#ff6644', isEnemy: true,
          });
        }
      }

      // Collision with player
      const p = this.game.player;
      if (p.invincibleTimer <= 0 &&
          this.rectRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h,
                        e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
        this.hitPlayer(2);
        e.hp -= 3;
        if (e.hp <= 0) {
          this.killEnemy(i);
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.game.particles.length - 1; i >= 0; i--) {
      const p = this.game.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) {
        this.game.particles.splice(i, 1);
      }
    }
  }

  private updatePowerUps(dt: number) {
    for (let i = this.game.powerUps.length - 1; i >= 0; i--) {
      const pu = this.game.powerUps[i];
      pu.y += pu.vy * dt;
      pu.glow += 0.05 * pu.glowDir * dt;
      if (pu.glow > 1) pu.glowDir = -1;
      if (pu.glow < 0) pu.glowDir = 1;

      if (pu.y > VIRTUAL_HEIGHT + 50) {
        this.game.powerUps.splice(i, 1);
        continue;
      }

      // Check player pickup
      const p = this.game.player;
      const dx = p.x - pu.x;
      const dy = p.y - pu.y;
      if (Math.sqrt(dx * dx + dy * dy) < pu.size + 30) {
        this.applyPowerUp(pu);
        this.game.powerUps.splice(i, 1);
        // Pickup particles
        for (let k = 0; k < 10; k++) {
          const angle = Math.random() * Math.PI * 2;
          this.game.particles.push({
            x: pu.x, y: pu.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            life: 15, maxLife: 15,
            size: 3,
            color: '#ffff00',
            type: 'spark',
          });
        }
      }
    }
  }

  private applyPowerUp(pu: PowerUp) {
    const p = this.game.player;
    switch (pu.type) {
      case 'health':
        p.hp = Math.min(p.maxHp, p.hp + 1);
        break;
      case 'shield':
        p.shield = Math.min(p.maxShield, p.shield + 1);
        break;
      case 'damage':
        p.damage += 0.3;
        break;
      case 'speed':
        p.speed += 0.5;
        break;
      case 'multishot':
        if (p.multishot < 7) p.multishot += 1;
        break;
    }
  }

  private updateWaveSystem(dt: number) {
    if (this.game.enemiesRemaining <= 0 && this.game.enemies.length === 0) {
      this.game.waveTimer -= dt;
      if (this.game.waveTimer <= 0) {
        this.game.wave++;
        
        // Upgrade screen every 3 waves
        if (this.game.wave > 1 && (this.game.wave - 1) % 3 === 0) {
          this.generateUpgradeChoices();
          this.game.state = 'upgrade';
        }

        this.startWave();
      }
    }

    // Spawn enemies from remaining count
    if (this.game.enemiesRemaining > 0 && this.game.enemies.length < 8) {
      this.game.spawnTimer -= dt;
      if (this.game.spawnTimer <= 0) {
        this.game.spawnTimer = Math.max(20, 60 - this.game.wave * 3);
        this.spawnEnemy();
      }
    }
  }

  private startWave() {
    const wave = this.game.wave;
    this.game.totalEnemiesInWave = Math.min(5 + wave * 3, 40);
    this.game.enemiesRemaining = this.game.totalEnemiesInWave;
    this.game.waveTimer = this.game.waveDelay;
    this.game.spawnTimer = 30;
  }

  private spawnEnemy() {
    const wave = this.game.wave;
    const x = 100 + Math.random() * (VIRTUAL_WIDTH - 200);
    const y = -60;

    let type: Enemy['type'] = 'basic';
    const roll = Math.random();
    if (wave >= 5 && roll < 0.05) type = 'boss';
    else if (wave >= 3 && roll < 0.2) type = 'tank';
    else if (wave >= 2 && roll < 0.4) type = 'fast';

    const patterns: Enemy['pattern'][] = ['straight', 'sine', 'zigzag'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    const configs = {
      basic: { w: 40, h: 40, hp: 2 + wave * 0.3, speed: 1.5 + wave * 0.1, interval: 120, points: 100, color: '#ff4444' },
      fast: { w: 32, h: 32, hp: 1 + wave * 0.2, speed: 3 + wave * 0.15, interval: 90, points: 150, color: '#ff8800' },
      tank: { w: 56, h: 56, hp: 6 + wave * 0.8, speed: 0.8 + wave * 0.05, interval: 80, points: 300, color: '#aa44ff' },
      boss: { w: 80, h: 80, hp: 20 + wave * 3, speed: 0.5, interval: 50, points: 1000, color: '#ff0066' },
    };
    const c = configs[type];

    this.game.enemies.push({
      x, y, w: c.w, h: c.h,
      hp: c.hp, maxHp: c.hp,
      speed: c.speed, type, color: c.color,
      shootTimer: c.interval * Math.random(),
      shootInterval: c.interval,
      points: c.points,
      angle: 0, pattern,
      patternTimer: Math.random() * 100,
    });

    this.game.enemiesRemaining--;
  }

  private generateUpgradeChoices() {
    const all: UpgradeChoice[] = [
      {
        name: 'Rapid Fire', description: 'Shoot 20% faster',
        icon: '⚡', apply: (p) => { p.shootInterval = Math.max(3, p.shootInterval * 0.8); }
      },
      {
        name: 'Power Shot', description: '+1 Damage',
        icon: '💥', apply: (p) => { p.damage += 1; }
      },
      {
        name: 'Multi Shot', description: '+1 Bullet',
        icon: '🔱', apply: (p) => { if (p.multishot < 9) p.multishot += 1; }
      },
      {
        name: 'Hull Repair', description: '+2 Max HP & Full Heal',
        icon: '❤️', apply: (p) => { p.maxHp += 2; p.hp = p.maxHp; }
      },
      {
        name: 'Shield Boost', description: '+2 Max Shield',
        icon: '🛡️', apply: (p) => { p.maxShield += 2; p.shield = p.maxShield; }
      },
      {
        name: 'Speed Boost', description: '+2 Speed',
        icon: '🚀', apply: (p) => { p.speed += 2; }
      },
      {
        name: 'Big Bullets', description: '+3 Bullet Size',
        icon: '⭕', apply: (p) => { p.bulletSize += 3; }
      },
      {
        name: 'Shield Regen', description: '2x Shield Regen',
        icon: '✨', apply: (p) => { p.shieldRegen *= 2; }
      },
    ];

    // Pick 3 random unique
    const shuffled = all.sort(() => Math.random() - 0.5);
    this.game.upgradeChoices = shuffled.slice(0, 3);
  }

  private updateScreenShake(dt: number) {
    const s = this.game.screenShake;
    if (s.timer > 0) {
      s.timer -= dt;
    } else {
      s.intensity = 0;
    }
  }

  private updateCombo(dt: number) {
    if (this.game.comboTimer > 0) {
      this.game.comboTimer -= dt;
      if (this.game.comboTimer <= 0) {
        this.game.comboCount = 0;
      }
    }
  }

  private updateFlash(dt: number) {
    if (this.game.flashTimer > 0) {
      this.game.flashTimer -= dt;
    }
  }

  private addShake(intensity: number, duration: number) {
    this.game.screenShake = { intensity, duration, timer: duration };
  }

  private circleRect(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number): boolean {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return dx * dx + dy * dy < cr * cr;
  }

  private rectRect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private render() {
    const ctx = this.ctx;
    const g = this.game;

    ctx.save();

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (g.screenShake.timer > 0) {
      const t = g.screenShake.timer / g.screenShake.duration;
      const intensity = g.screenShake.intensity * t;
      shakeX = (Math.random() - 0.5) * intensity * 2;
      shakeY = (Math.random() - 0.5) * intensity * 2;
    }
    ctx.translate(shakeX, shakeY);

    // Update FM26 anim time
    this.fm26State.animTime += 0.016;

    // Render based on mode
    if (this.gameMode === 'fm26') {
      // FM26 Main Menu
      if (this.fm26State.currentScreen === 'main') {
        this.fm26Renderer.drawMainMenu(this.fm26State);
      } else if (this.fm26State.currentScreen === 'newgame') {
        this.fm26Renderer.drawNewGameScreen(this.fm26State);
      }
    } else {
      // Space Shooter (original)
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(-10, -10, VIRTUAL_WIDTH + 20, VIRTUAL_HEIGHT + 20);
      this.renderer.drawStars(g.stars);

      if (g.state === 'menu') {
        this.renderer.drawMenu(g);
      } else if (g.state === 'playing' || g.state === 'paused') {
        this.renderer.drawGameplay(g);
        if (g.state === 'paused') {
          this.renderer.drawPauseOverlay(g);
        }
      } else if (g.state === 'gameover') {
        this.renderer.drawGameplay(g);
        this.renderer.drawGameOver(g);
      } else if (g.state === 'upgrade') {
        this.renderer.drawGameplay(g);
        this.renderer.drawUpgradeScreen(g);
      }
    }

    // Screen flash
    if (g.flashTimer > 0) {
      ctx.fillStyle = g.flashColor;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }

    ctx.restore();
  }
}
