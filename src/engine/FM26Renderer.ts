import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './types';
import { FM26MenuState, FM26_CLUBS, FM26_NEWS, FM26_USER } from './FM26Types';

export class FM26Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawMainMenu(state: FM26MenuState) {
    const ctx = this.ctx;
    const t = state.animTime;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(0.5, '#1a2840');
    bgGrad.addColorStop(1, '#0f1f33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Subtle pattern overlay
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137) % VIRTUAL_WIDTH);
      const y = ((i * 241) % VIRTUAL_HEIGHT);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── LEFT SIDE: Logo & Main Menu ──
    const leftPanelX = 80;

    // FM26 Logo
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 30 + Math.sin(t * 2) * 10;
    
    // Logo background
    const logoGrad = ctx.createLinearGradient(leftPanelX, 80, leftPanelX + 280, 80);
    logoGrad.addColorStop(0, '#00ff88');
    logoGrad.addColorStop(1, '#00cc6a');
    ctx.fillStyle = logoGrad;
    ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
    ctx.fillText('FOOTBALL', leftPanelX, 140);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
    ctx.fillText('MANAGER', leftPanelX, 220);
    
    // "26" badge
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 96px "Segoe UI", Arial, sans-serif';
    ctx.fillText('26', leftPanelX + 320, 220);
    ctx.restore();

    // Tagline
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('The Future of Football Management', leftPanelX, 270);

    // ── Main Menu Buttons ──
    const menuButtons = [
      { id: 'continue', label: 'Continue', sublabel: 'Load your saved game', icon: '▶', color: '#00ff88', available: false },
      { id: 'newgame', label: 'New Game', sublabel: 'Start a new career', icon: '➕', color: '#00aaff' },
      { id: 'loadgame', label: 'Load Game', sublabel: 'Open saved game', icon: '📁', color: '#00aaff' },
      { id: 'settings', label: 'Settings', sublabel: 'Game options', icon: '⚙', color: '#00aaff' },
      { id: 'credits', label: 'Credits', sublabel: 'Game credits', icon: '🎬', color: '#00aaff' },
      { id: 'exit', label: 'Exit', sublabel: 'Quit to desktop', icon: '🚪', color: '#ff4444' },
    ];

    let btnY = 340;
    for (const btn of menuButtons) {
      const hovered = state.hoveredButton === btn.id;
      const btnX = leftPanelX;
      const btnW = 480;
      const btnH = 70;

      // Button background
      if (hovered) {
        const hoverGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
        hoverGrad.addColorStop(0, btn.color + '40');
        hoverGrad.addColorStop(1, btn.color + '20');
        ctx.fillStyle = hoverGrad;
        
        // Hover glow
        ctx.save();
        ctx.shadowColor = btn.color;
        ctx.shadowBlur = 25;
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.restore();
        
        // Border
        ctx.strokeStyle = btn.color;
        ctx.lineWidth = 2;
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.fill();
      }

      // Icon
      ctx.font = '28px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hovered ? btn.color : 'rgba(255,255,255,0.6)';
      ctx.fillText(btn.icon, btnX + 20, btnY + btnH / 2);

      // Label
      ctx.font = hovered ? 'bold 26px "Segoe UI", Arial, sans-serif' : '24px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = hovered ? '#ffffff' : 'rgba(255,255,255,0.8)';
      ctx.fillText(btn.label, btnX + 60, btnY + btnH / 2 - 5);

      // Sublabel
      ctx.font = '16px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(btn.sublabel, btnX + 60, btnY + btnH / 2 + 18);

      // Disabled indicator
      if (!btn.available) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('NO SAVE', btnX + btnW - 20, btnY + btnH / 2);
      }

      btnY += btnH + 8;
    }

    // ── RIGHT SIDE: News Panel ──
    const rightPanelX = VIRTUAL_WIDTH - 680;
    const rightPanelW = 600;

    // Panel background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.roundRect(ctx, rightPanelX, 80, rightPanelW, 500, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, rightPanelX, 80, rightPanelW, 500, 12);
    ctx.stroke();

    // News header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📰 LATEST NEWS', rightPanelX + 24, 120);

    // News items
    let newsY = 160;
    for (let i = 0; i < 3 && i < FM26_NEWS.length; i++) {
      const item = FM26_NEWS[i];
      const newsHovered = state.hoveredButton === `news_${item.id}`;
      
      if (newsHovered) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        this.roundRect(ctx, rightPanelX + 16, newsY - 30, rightPanelW - 32, 90, 8);
        ctx.fill();
      }

      // Importance indicator
      const importanceColor = item.importance >= 4 ? '#ff4444' : item.importance >= 3 ? '#ffaa00' : '#888888';
      ctx.fillStyle = importanceColor;
      ctx.fillRect(rightPanelX + 24, newsY - 20, 4, 60);

      // Headline
      ctx.fillStyle = newsHovered ? '#ffffff' : 'rgba(255,255,255,0.9)';
      ctx.font = newsHovered ? 'bold 18px "Segoe UI", Arial, sans-serif' : '17px "Segoe UI", Arial, sans-serif';
      ctx.fillText(item.headline, rightPanelX + 40, newsY);

      // Summary
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px "Segoe UI", Arial, sans-serif';
      ctx.fillText(item.summary.substring(0, 55) + '...', rightPanelX + 40, newsY + 24);

      // Date & category
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '12px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${item.date} • ${item.category.toUpperCase()}`, rightPanelX + 40, newsY + 48);

      newsY += 110;
    }

    // ── BOTTOM: User Profile & Date ──
    // Date display
    const dateStr = state.currentDate || 'January 2026';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`📅 ${dateStr}`, VIRTUAL_WIDTH - 40, VIRTUAL_HEIGHT - 40);

    // User profile
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👤 ${FM26_USER.name} • Rep: ${FM26_USER.managerReputation} • 🏆 ${FM26_USER.trophiesWon}`, 80, VIRTUAL_HEIGHT - 40);

    // Version info
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FM26 Unity Engine Demo v1.0 • Hover over buttons to test cursor', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 20);
  }

  drawNewGameScreen(state: FM26MenuState) {
    const ctx = this.ctx;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(1, '#1a2840');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT YOUR CLUB', VIRTUAL_WIDTH / 2, 100);

    // Club grid
    const startX = 180;
    const startY = 180;
    const cardW = 280;
    const cardH = 160;
    const gapX = 40;
    const gapY = 30;

    FM26_CLUBS.forEach((club, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const hovered = state.hoveredButton === `club_${club.id}`;

      // Card background
      ctx.save();
      if (hovered) {
        ctx.shadowColor = club.logoColor;
        ctx.shadowBlur = 30;
      }
      ctx.fillStyle = hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';
      this.roundRect(ctx, x, y, cardW, cardH, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = hovered ? club.logoColor : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = hovered ? 3 : 1;
      this.roundRect(ctx, x, y, cardW, cardH, 12);
      ctx.stroke();
      ctx.restore();

      // Club logo color indicator
      ctx.fillStyle = club.logoColor;
      ctx.beginPath();
      ctx.arc(x + 40, y + 50, 20, 0, Math.PI * 2);
      ctx.fill();

      // Club name
      ctx.fillStyle = hovered ? '#ffffff' : 'rgba(255,255,255,0.9)';
      ctx.font = hovered ? 'bold 20px "Segoe UI", Arial, sans-serif' : '18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(club.name, x + 75, y + 45);

      // League
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px "Segoe UI", Arial, sans-serif';
      ctx.fillText(club.league, x + 75, y + 70);

      // Country
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(club.country, x + 75, y + 92);

      // Reputation bar
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 75, y + 110, 180, 6);
      ctx.fillStyle = club.reputation >= 90 ? '#00ff88' : club.reputation >= 80 ? '#00aaff' : '#ffaa00';
      ctx.fillRect(x + 75, y + 110, 180 * (club.reputation / 100), 6);

      // Reputation text
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Rep: ${club.reputation}`, x + cardW - 20, y + 116);
    });

    // Back button
    const backHovered = state.hoveredButton === 'back';
    ctx.fillStyle = backHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
    this.roundRect(ctx, 80, VIRTUAL_HEIGHT - 80, 140, 50, 8);
    ctx.fill();
    ctx.strokeStyle = backHovered ? '#ffffff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 80, VIRTUAL_HEIGHT - 80, 140, 50, 8);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← Back', 150, VIRTUAL_HEIGHT - 55);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
}
