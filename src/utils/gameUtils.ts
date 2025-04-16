import { Ship, Asteroid, Bullet, Point, GameState } from '../types/game';

export function createShip(x: number, y: number): Ship {
  return {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    size: 20,
    thrusting: false
  };
}

export function createAsteroid(canvasWidth: number, canvasHeight: number): Asteroid {
  const size = Math.random() * 30 + 20;
  const vertices: Point[] = [];
  const numVertices = Math.floor(Math.random() * 5) + 7;

  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const variance = Math.random() * 0.4 + 0.8;
    vertices.push({
      x: Math.cos(angle) * size * variance,
      y: Math.sin(angle) * size * variance
    });
  }

  return {
    position: {
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight
    },
    velocity: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    },
    rotation: Math.random() * Math.PI * 2,
    size,
    vertices
  };
}

export function updateGameObjects(state: GameState, width: number, height: number): GameState {
  const { ship, asteroids, bullets } = state;

  // Update ship
  if (ship.thrusting) {
    const thrustPower = 0.1;
    ship.velocity.x += Math.cos(ship.rotation) * thrustPower;
    ship.velocity.y += Math.sin(ship.rotation) * thrustPower;
  }

  // Apply friction and speed limit
  const friction = 0.99;
  const maxSpeed = 5;
  ship.velocity.x *= friction;
  ship.velocity.y *= friction;

  // Limit maximum speed
  const speed = Math.sqrt(ship.velocity.x * ship.velocity.x + ship.velocity.y * ship.velocity.y);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    ship.velocity.x *= scale;
    ship.velocity.y *= scale;
  }

  // Update position
  ship.position.x += ship.velocity.x;
  ship.position.y += ship.velocity.y;

  // Wrap around screen
  ship.position.x = (ship.position.x + width) % width;
  ship.position.y = (ship.position.y + height) % height;

  // Update asteroids
  const updatedAsteroids = asteroids.map(asteroid => {
    asteroid.position.x += asteroid.velocity.x;
    asteroid.position.y += asteroid.velocity.y;
    asteroid.position.x = (asteroid.position.x + width) % width;
    asteroid.position.y = (asteroid.position.y + height) % height;
    asteroid.rotation += 0.02;
    return asteroid;
  });

  // Update bullets
  const updatedBullets = bullets
    .map(bullet => {
      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;
      bullet.position.x = (bullet.position.x + width) % width;
      bullet.position.y = (bullet.position.y + height) % height;
      bullet.lifespan--;
      return bullet;
    })
    .filter(bullet => bullet.lifespan > 0);

  return {
    ...state,
    ship,
    asteroids: updatedAsteroids,
    bullets: updatedBullets
  };
}

function checkCollision(obj1: Ship | Bullet, asteroid: Asteroid): boolean {
  const distance = Math.sqrt(
    Math.pow(obj1.position.x - asteroid.position.x, 2) +
    Math.pow(obj1.position.y - asteroid.position.y, 2)
  );
  return distance < (obj1.size + asteroid.size);
}

export function handleCollisions(state: GameState): GameState {
  const { ship, asteroids, bullets, score, lives } = state;
  let newScore = score;
  let newLives = lives;
  let gameOver = false;

  // Check ship collision with asteroids
  const hasCollision = asteroids.some(asteroid => checkCollision(ship, asteroid));
  
  if (hasCollision) {
    newLives--;
    
    if (newLives <= 0) {
      gameOver = true;
    } else {
      // Reset ship position and give temporary invulnerability
      ship.position = { x: 400, y: 300 };
      ship.velocity = { x: 0, y: 0 };
      ship.rotation = 0;
    }
  }

  // Check bullet collisions with asteroids
  const remainingAsteroids = asteroids.filter(asteroid => {
    const hitByBullet = bullets.some(bullet => checkCollision(bullet, asteroid));
    if (hitByBullet) newScore += 100;
    return !hitByBullet;
  });

  // Create new asteroids if all are destroyed
  if (remainingAsteroids.length === 0) {
    return {
      ...state,
      asteroids: Array.from({ length: 5 }, () => createAsteroid(800, 600)),
      score: newScore,
      lives: newLives,
      gameOver
    };
  }

  return {
    ...state,
    asteroids: remainingAsteroids,
    score: newScore,
    lives: newLives,
    gameOver
  };
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const { ship, asteroids, bullets } = state;

  // Draw ship
  ctx.save();
  ctx.translate(ship.position.x, ship.position.y);
  ctx.rotate(ship.rotation);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-10, 10);
  ctx.lineTo(-10, -10);
  ctx.closePath();
  ctx.stroke();

  // Draw thrust
  if (ship.thrusting) {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, 5);
    ctx.lineTo(-20, -5);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  // Draw asteroids
  asteroids.forEach(asteroid => {
    ctx.save();
    ctx.translate(asteroid.position.x, asteroid.position.y);
    ctx.rotate(asteroid.rotation);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
    asteroid.vertices.forEach(vertex => {
      ctx.lineTo(vertex.x, vertex.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  });

  // Draw bullets
  ctx.fillStyle = 'white';
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, bullet.size, 0, Math.PI * 2);
    ctx.fill();
  });
}