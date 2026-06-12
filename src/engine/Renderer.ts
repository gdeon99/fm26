import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, GameData } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawStars(stars: GameData['stars']) {
    const ctx = this.ctx;
    for (const star of stars) {
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private isHovered(g: GameData, id: string): boolean {
    return g.hoveredId === id;
  }

  drawMenu(g: GameData) {
    const ctx = this.ctx;
    const t = g.menuAnim;

    // Title glow
    const glowSize = 20 + Math.sin(t * 2) * 10;
    ctx.save();
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = glowSize;
    ctx.fillStyle = '#00eeff';
    ctx.font = 'bold 100px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GALAXY', VIRTUAL_WIDTH / 2, 280);
    ctx.shadowColor = '#ff0066';
    ctx.fillStyle = '#ff3388';
    ctx.fillText('DEFENDER', VIRTUAL_WIDTH / 2, 400);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#8888aa';
    ctx.font = '28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A Canvas Game Engine Demo', VIRTUAL_WIDTH / 2, 480);

    // High score
    if (g.highScore > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`HIGH SCORE: ${g.highScore.toLocaleString()}`, VIRTUAL_WIDTH / 2, 550);
    }

    // Play button
    this.drawButton(VIRTUAL_WIDTH / 2 - 200, 650, 400, 80, 'START GAME', '#00ccff', '#001a33', t, this.isHovered(g, 'menu_start'));

    // Controls info
    ctx.fillStyle = '#556677';
    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD / Arrow Keys to move  •  Auto-fire  •  ESC to pause', VIRTUAL_WIDTH / 2, 800);
    ctx.fillText('Press ENTER or click START to begin', VIRTUAL_WIDTH / 2, 840);

    // Version / info
    ctx.fillStyle = '#334455';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Fixed 16:9 Canvas  •  Resolution Independent  •  No HTML UI', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 40);

    // Decorative floating particles on menu
    for (let i = 0; i < 5; i++) {
      const px = VIRTUAL_WIDTH / 2 + Math.sin(t + i * 1.3) * 400;
      const py = 340 + Math.cos(t * 0.7 + i * 1.7) * 100;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = i % 2 === 0 ? '#00ccff' : '#ff0066';
      ctx.beginPath();
      ctx.arc(px, py, 4 + Math.sin(t + i) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawGameplay(g: GameData) {
    // Draw particles behind everything
    this.drawParticles(g.particles.filter(p => p.type === 'trail'));

    // Power-ups
    this.drawPowerUps(g.powerUps);

    // Enemies
    this.drawEnemies(g.enemies);

    // Player (only in playing states)
    if (g.state === 'playing' || g.state === 'paused' || g.state === 'upgrade') {
      this.drawPlayer(g.player);
    }

    // Bullets
    this.drawBullets(g.bullets);

    // Particles on top
    this.drawParticles(g.particles.filter(p => p.type !== 'trail'));

    // HUD
    if (g.state !== 'gameover') {
      this.drawHUD(g);
    }
  }

  drawPlayer(p: GameData['player']) {
    const ctx = this.ctx;

    // Invincibility flash
    if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    // Shield glow
    if (p.shield > 0) {
      const shieldAlpha = 0.15 + (p.shield / p.maxShield) * 0.2;
      ctx.globalAlpha = shieldAlpha;
      const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 45);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.7, '#0088ff44');
      gradient.addColorStop(1, '#0088ff00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ship body
    ctx.fillStyle = '#ccddff';
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -p.h / 2); // nose
    ctx.lineTo(-p.w / 2, p.h / 2); // bottom left
    ctx.lineTo(-p.w / 4, p.h / 3);
    ctx.lineTo(0, p.h / 2 - 5);
    ctx.lineTo(p.w / 4, p.h / 3);
    ctx.lineTo(p.w / 2, p.h / 2); // bottom right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.ellipse(0, -5, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing accents
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(-p.w / 2 + 5, p.h / 2 - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.lineTo(p.w / 2 - 5, p.h / 2 - 5);
    ctx.stroke();

    ctx.restore();
  }

  drawEnemies(enemies: GameData['enemies']) {
    const ctx = this.ctx;

    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Glow
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 15;

      // Body
      if (e.type === 'basic') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, 0);
        ctx.lineTo(e.w / 3, e.h / 2);
        ctx.lineTo(-e.w / 3, e.h / 2);
        ctx.lineTo(-e.w / 2, 0);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'fast') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, e.h / 4);
        ctx.lineTo(0, e.h / 2);
        ctx.lineTo(-e.w / 2, e.h / 4);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'tank') {
        ctx.fillStyle = e.color;
        ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
        ctx.fillStyle = '#ffffff22';
        ctx.fillRect(-e.w / 2 + 4, -e.h / 2 + 4, e.w - 8, e.h - 8);
      } else if (e.type === 'boss') {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, -e.h / 4);
        ctx.lineTo(e.w / 2 + 10, 0);
        ctx.lineTo(e.w / 2, e.h / 4);
        ctx.lineTo(e.w / 4, e.h / 2);
        ctx.lineTo(-e.w / 4, e.h / 2);
        ctx.lineTo(-e.w / 2, e.h / 4);
        ctx.lineTo(-e.w / 2 - 10, 0);
        ctx.lineTo(-e.w / 2, -e.h / 4);
        ctx.closePath();
        ctx.fill();
        // Core
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5 + Math.sin(e.angle * 3) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.shadowBlur = 0;

      // HP bar
      if (e.hp < e.maxHp) {
        const barW = e.w + 10;
        const barH = 4;
        const barY = -e.h / 2 - 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(-barW / 2, barY, barW, barH);
        ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#00ff66' : e.hp / e.maxHp > 0.25 ? '#ffcc00' : '#ff3333';
        ctx.fillRect(-barW / 2, barY, barW * (e.hp / e.maxHp), barH);
      }

      ctx.restore();
    }
  }

  drawBullets(bullets: GameData['bullets']) {
    const ctx = this.ctx;
    for (const b of bullets) {
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      // Inner bright core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(particles: GameData['particles']) {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'explosion') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'trail') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillRect(p.x - 1, p.y - 1, 2 + p.size * alpha, 2 + p.size * alpha);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPowerUps(powerUps: GameData['powerUps']) {
    const ctx = this.ctx;
    const colors: Record<string, string> = {
      health: '#ff4444',
      shield: '#4488ff',
      damage: '#ff8800',
      speed: '#44ff44',
      multishot: '#ff44ff',
    };
    const icons: Record<string, string> = {
      health: '❤',
      shield: '🛡',
      damage: '⚔',
      speed: '⚡',
      multishot: '✦',
    };

    for (const pu of powerUps) {
      ctx.save();
      ctx.translate(pu.x, pu.y);

      // Glow
      const glowAlpha = 0.3 + pu.glow * 0.3;
      ctx.globalAlpha = glowAlpha;
      ctx.shadowColor = colors[pu.type];
      ctx.shadowBlur = 20;
      ctx.fillStyle = colors[pu.type];
      ctx.beginPath();
      ctx.arc(0, 0, pu.size + 5, 0, Math.PI * 2);
      ctx.fill();

      // Background
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(0, 0, pu.size, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = colors[pu.type];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors[pu.type];
      ctx.font = `${pu.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[pu.type], 0, 1);

      ctx.restore();
    }
  }

  drawHUD(g: GameData) {
    const ctx = this.ctx;
    const p = g.player;

    // Top bar background
    const grad = ctx.createLinearGradient(0, 0, 0, 70);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, 70);

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE`, 30, 12);
    ctx.fillStyle = '#00eeff';
    ctx.font = 'bold 36px "Segoe UI", monospace';
    ctx.fillText(`${g.score.toLocaleString()}`, 160, 12);

    // Combo
    if (g.comboCount > 1) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      const comboAlpha = Math.min(1, g.comboTimer / 30);
      ctx.globalAlpha = comboAlpha;
      ctx.fillText(`x${g.comboCount} COMBO`, 30, 52);
      ctx.globalAlpha = 1;
    }

    // Wave
    ctx.fillStyle = '#aaaacc';
    ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${g.wave}`, VIRTUAL_WIDTH / 2, 15);

    // Wave progress
    if (g.totalEnemiesInWave > 0) {
      const progress = 1 - (g.enemiesRemaining + g.enemies.length) / g.totalEnemiesInWave;
      const barW = 200;
      const barH = 6;
      const barX = VIRTUAL_WIDTH / 2 - barW / 2;
      const barY = 50;
      ctx.fillStyle = '#333';
      this.roundRect(barX, barY, barW, barH, 3);
      ctx.fillStyle = '#00ccff';
      this.roundRect(barX, barY, barW * progress, barH, 3);
    }

    // HP
    const hpX = VIRTUAL_WIDTH - 420;
    const hpY = 14;
    ctx.fillStyle = '#ff4444';
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('❤', hpX, hpY);
    
    const hpBarX = hpX + 35;
    const hpBarW = 150;
    const hpBarH = 14;
    ctx.fillStyle = '#331111';
    this.roundRect(hpBarX, hpY + 4, hpBarW, hpBarH, 4);
    ctx.fillStyle = '#ff4444';
    this.roundRect(hpBarX, hpY + 4, hpBarW * (p.hp / p.maxHp), hpBarH, 4);
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`, hpBarX + hpBarW / 2, hpY + 5);

    // Shield
    const shX = hpX;
    const shY = hpY + 26;
    ctx.fillStyle = '#4488ff';
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🛡', shX, shY);
    
    ctx.fillStyle = '#111133';
    this.roundRect(hpBarX, shY + 4, hpBarW, hpBarH, 4);
    ctx.fillStyle = '#4488ff';
    this.roundRect(hpBarX, shY + 4, hpBarW * (p.shield / p.maxShield), hpBarH, 4);
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.shield.toFixed(1)}/${p.maxShield}`, hpBarX + hpBarW / 2, shY + 5);

    // High score
    ctx.fillStyle = '#776600';
    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`HI: ${g.highScore.toLocaleString()}`, VIRTUAL_WIDTH - 30, 20);

    // Wave announcement
    if (g.enemies.length === 0 && g.enemiesRemaining <= 0 && g.waveTimer > 100) {
      const nextWave = g.wave + 1;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, (g.waveTimer - 100) / 30);
      ctx.fillText(`WAVE ${nextWave} INCOMING`, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 30);
      ctx.fillStyle = '#aaaacc';
      ctx.font = '28px "Segoe UI", Arial, sans-serif';
      ctx.fillText('Get ready...', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 20);
      ctx.restore();
    }

    // Bottom info bar
    const botGrad = ctx.createLinearGradient(0, VIRTUAL_HEIGHT - 50, 0, VIRTUAL_HEIGHT);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, VIRTUAL_HEIGHT - 50, VIRTUAL_WIDTH, 50);

    // Stats
    ctx.fillStyle = '#667788';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG: ${p.damage.toFixed(1)}  SPD: ${p.speed.toFixed(1)}  SHOT: x${p.multishot}`, 30, VIRTUAL_HEIGHT - 20);

    ctx.textAlign = 'right';
    ctx.fillText(`Enemies: ${g.enemies.length}  •  ESC: Pause`, VIRTUAL_WIDTH - 30, VIRTUAL_HEIGHT - 20);
  }

  drawPauseOverlay(g: GameData) {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Pause text
    ctx.save();
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 60);
    ctx.restore();

    // Resume button
    this.drawButton(VIRTUAL_WIDTH / 2 - 200, VIRTUAL_HEIGHT / 2 + 20, 400, 80, 'RESUME', '#00ccff', '#001a33', 0, this.isHovered(g, 'pause_resume'));

    ctx.fillStyle = '#8888aa';
    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to resume', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 140);
  }

  drawGameOver(g: GameData) {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Game Over text
    ctx.save();
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 100px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', VIRTUAL_WIDTH / 2, 300);
    ctx.restore();

    // Stats
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${g.score.toLocaleString()}`, VIRTUAL_WIDTH / 2, 420);

    ctx.fillStyle = '#ffcc00';
    ctx.font = '32px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`HIGH SCORE: ${g.highScore.toLocaleString()}`, VIRTUAL_WIDTH / 2, 475);

    ctx.fillStyle = '#aaaacc';
    ctx.font = '28px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Wave ${g.wave}  •  Time: ${this.formatTime(g.gameTime)}`, VIRTUAL_WIDTH / 2, 530);

    if (g.score >= g.highScore && g.score > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
      ctx.fillText('🏆 NEW HIGH SCORE! 🏆', VIRTUAL_WIDTH / 2, 580);
    }

    // Retry button
    this.drawButton(VIRTUAL_WIDTH / 2 - 200, 620, 400, 80, 'BACK TO MENU', '#ff3366', '#330011', 0, this.isHovered(g, 'gameover_back'));
  }

  drawUpgradeScreen(g: GameData) {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 20, 0.85)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Title
    ctx.save();
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHOOSE UPGRADE', VIRTUAL_WIDTH / 2, 200);
    ctx.restore();

    // Upgrade cards
    const choices = g.upgradeChoices;
    const totalW = choices.length * 320 + (choices.length - 1) * 30;
    const startX = VIRTUAL_WIDTH / 2 - totalW / 2;

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const cx = startX + i * 350;
      const cy = VIRTUAL_HEIGHT / 2 - 130;
      const cw = 320;
      const ch = 300;
      const hovered = this.isHovered(g, `upgrade_${i}`);

      // Card background
      ctx.fillStyle = hovered ? '#181830' : '#111122';
      ctx.strokeStyle = hovered ? '#00ccff' : '#334466';
      ctx.lineWidth = hovered ? 3 : 2;
      this.roundRectPath(cx, cy, cw, ch, 16);
      ctx.fill();
      ctx.stroke();

      // Hover glow
      if (hovered) {
        ctx.save();
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#00ccff88';
        ctx.lineWidth = 2;
        this.roundRectPath(cx - 2, cy - 2, cw + 4, ch + 4, 18);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = '#00ccff22';
        ctx.lineWidth = 1;
        this.roundRectPath(cx - 2, cy - 2, cw + 4, ch + 4, 18);
        ctx.stroke();
      }

      // Icon
      ctx.font = '64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(choice.icon, cx + cw / 2, cy + 80);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
      ctx.fillText(choice.name, cx + cw / 2, cy + 150);

      // Description
      ctx.fillStyle = '#8888aa';
      ctx.font = '22px "Segoe UI", Arial, sans-serif';
      ctx.fillText(choice.description, cx + cw / 2, cy + 200);

      // Select text
      ctx.fillStyle = '#00ccff';
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText('[ CLICK TO SELECT ]', cx + cw / 2, cy + 265);
    }
  }

  drawButton(x: number, y: number, w: number, h: number, text: string, borderColor: string, bgColor: string, time: number, hovered = false) {
    const ctx = this.ctx;

    // Background — brighter on hover
    ctx.fillStyle = hovered ? this.lightenColor(bgColor, 0.15) : bgColor;
    this.roundRect(x, y, w, h, 12);

    // Border with glow — stronger on hover
    ctx.save();
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = hovered ? 25 : 10 + Math.sin(time * 3) * 5;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = hovered ? 4 : 3;
    this.roundRectPath(x, y, w, h, 12);
    ctx.stroke();
    ctx.restore();

    // Hover highlight overlay
    if (hovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      this.roundRect(x, y, w, h, 12);
    }

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = hovered ? 'bold 34px "Segoe UI", Arial, sans-serif' : 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  private lightenColor(hex: string, amount: number): string {
    // Simple lighten for hex colors
    const c = hex.replace('#', '');
    if (c.length < 6) return hex;
    const r = Math.min(255, parseInt(c.slice(0, 2), 16) + Math.floor(amount * 255));
    const g = Math.min(255, parseInt(c.slice(2, 4), 16) + Math.floor(amount * 255));
    const b = Math.min(255, parseInt(c.slice(4, 6), 16) + Math.floor(amount * 255));
    return `rgb(${r},${g},${b})`;
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    this.roundRectPath(x, y, w, h, r);
    this.ctx.fill();
  }

  private roundRectPath(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private formatTime(frames: number): string {
    const seconds = Math.floor(frames / 60);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
