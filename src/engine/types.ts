// Virtual resolution - the game always thinks it's running at this resolution
// Everything is drawn relative to these coordinates
export const VIRTUAL_WIDTH = 1920;
export const VIRTUAL_HEIGHT = 1080;
export const ASPECT_RATIO = VIRTUAL_WIDTH / VIRTUAL_HEIGHT; // 16:9

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'upgrade';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'explosion' | 'trail' | 'spark' | 'star';
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  size: number;
  color: string;
  isEnemy: boolean;
  piercing?: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'basic' | 'fast' | 'tank' | 'boss';
  color: string;
  shootTimer: number;
  shootInterval: number;
  points: number;
  angle: number;
  pattern: 'straight' | 'sine' | 'zigzag';
  patternTimer: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  speed: number;
  shootTimer: number;
  shootInterval: number;
  damage: number;
  shield: number;
  maxShield: number;
  shieldRegen: number;
  invincibleTimer: number;
  bulletSpeed: number;
  bulletSize: number;
  multishot: number;
}

export interface PowerUp {
  x: number;
  y: number;
  size: number;
  type: 'health' | 'shield' | 'damage' | 'speed' | 'multishot';
  vy: number;
  glow: number;
  glowDir: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
}

export interface HitRect {
  x: number; y: number; w: number; h: number; id: string;
}

export interface GameData {
  state: GameState;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  powerUps: PowerUp[];
  score: number;
  highScore: number;
  wave: number;
  waveTimer: number;
  waveDelay: number;
  enemiesRemaining: number;
  totalEnemiesInWave: number;
  spawnTimer: number;
  screenShake: ScreenShake;
  comboCount: number;
  comboTimer: number;
  stars: { x: number; y: number; speed: number; size: number; brightness: number }[];
  flashTimer: number;
  flashColor: string;
  menuAnim: number;
  gameTime: number;
  fps: number;
  upgradeChoices: UpgradeChoice[];
  // Hover system
  mouseVX: number; // virtual coords
  mouseVY: number;
  hoveredId: string; // id of hovered UI element
}

export interface UpgradeChoice {
  name: string;
  description: string;
  icon: string;
  apply: (player: Player) => void;
}
