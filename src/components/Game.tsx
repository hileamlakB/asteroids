import React, { useEffect, useRef, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { Ship, Asteroid, Bullet, Point, GameState } from '../types/game';
import { createAsteroid, createShip, drawGame, handleCollisions, updateGameObjects } from '../utils/gameUtils';
import { Heart } from 'lucide-react';
import hileaImg from '../assets/hilea.jpeg';

const INITIAL_ASTEROIDS = 5;
const INITIAL_LIVES = 3;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROTATION_SPEED = 0.1;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shipImageRef = useRef<HTMLImageElement | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    ship: createShip(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2),
    asteroids: Array.from({ length: INITIAL_ASTEROIDS }, () => 
      createAsteroid(CANVAS_WIDTH, CANVAS_HEIGHT)
    ),
    bullets: [],
    score: 0,
    lives: INITIAL_LIVES,
    gameOver: false
  });

  const keysRef = useRef<Set<string>>(new Set());
  const [canShoot, setCanShoot] = useState(true);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // Initialize ship image
  useEffect(() => {
    const img = new Image();
    img.src = hileaImg;
    shipImageRef.current = img;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);

      if (e.key === ' ' && canShoot && !gameState.gameOver) {
        shoot();
        setCanShoot(false);
        setTimeout(() => setCanShoot(true), 250);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.delete(e.key);
    };

    if (canvasRef.current) {
      canvasRef.current.focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canShoot, gameState.gameOver]);

  const shoot = () => {
    if (gameState.gameOver) return;
    
    const { ship } = gameState;
    const bullet: Bullet = {
      position: { ...ship.position },
      velocity: {
        x: Math.cos(ship.rotation) * 7,
        y: Math.sin(ship.rotation) * 7
      },
      rotation: 0,
      size: 2,
      lifespan: 60
    };

    setGameState(prev => ({
      ...prev,
      bullets: [...prev.bullets, bullet]
    }));
  };

  useGameLoop(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTimeRef.current) / 16.67; // Normalize to 60 FPS
    lastUpdateTimeRef.current = currentTime;

    setGameState(prevState => {
      const newShip = { ...prevState.ship };

      // Apply rotation based on keys
      if (keysRef.current.has('ArrowLeft')) {
        newShip.rotation -= ROTATION_SPEED * deltaTime;
      }
      if (keysRef.current.has('ArrowRight')) {
        newShip.rotation += ROTATION_SPEED * deltaTime;
      }
      newShip.thrusting = keysRef.current.has('ArrowUp');

      // Update game state with time-based movement
      const updatedState = updateGameObjects({
        ...prevState,
        ship: newShip
      }, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Only check collisions if the game is not over
      const finalState = prevState.gameOver 
        ? updatedState 
        : handleCollisions(updatedState);

      // Draw
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawGame(ctx, finalState, shipImageRef.current);

      return finalState;
    });
  });

  const handleRestart = () => {
    setGameState({
      ship: createShip(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2),
      asteroids: Array.from({ length: INITIAL_ASTEROIDS }, () => 
        createAsteroid(CANVAS_WIDTH, CANVAS_HEIGHT)
      ),
      bullets: [],
      score: 0,
      lives: INITIAL_LIVES,
      gameOver: false
    });
    keysRef.current.clear();
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="flex justify-between items-center w-[800px] mb-4">
        <div className="text-white text-2xl">Score: {gameState.score}</div>
        <div className="flex gap-2">
          {Array.from({ length: gameState.lives }).map((_, i) => (
            <Heart key={i} className="text-red-500 w-6 h-6 fill-red-500" />
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-white rounded-lg focus:outline-none"
        tabIndex={0}
      />
      {gameState.gameOver && (
        <div className="mt-4 text-center">
          <h2 className="text-white text-3xl mb-4">Game Over!</h2>
          <button
            onClick={handleRestart}
            className="bg-white text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
      <div className="mt-4 text-white text-center">
        <p>Controls:</p>
        <p>Arrow keys to move</p>
        <p>Space to shoot</p>
      </div>
    </div>
  );
}