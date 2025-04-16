export interface Point {
  x: number;
  y: number;
}

export interface GameObject {
  position: Point;
  velocity: Point;
  rotation: number;
  size: number;
}

export interface Asteroid extends GameObject {
  vertices: Point[];
}

export interface Ship extends GameObject {
  thrusting: boolean;
}

export interface Bullet extends GameObject {
  lifespan: number;
}

export interface GameState {
  ship: Ship;
  asteroids: Asteroid[];
  bullets: Bullet[];
  score: number;
  lives: number;
  gameOver: boolean;
}