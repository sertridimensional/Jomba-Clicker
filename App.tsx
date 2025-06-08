
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MovingImage, GameStatus, ImageDetails } from './types';
import {
  IMAGES_DATA,
  INITIAL_SPEED_MAGNITUDE,
  SPEED_MAGNITUDE_INCREMENT,
  MAX_SPEED_MAGNITUDE,
  IMAGE_WIDTH_PX,
  IMAGE_HEIGHT_PX,
  IMPULSE_STRENGTH,
  BONUS_STAGE_SCORE_THRESHOLD,
  BONUS_STAGE_DURATION_MS,
  NO_SCORE_TIMEOUT_MS
} from './constants';
import { ImageCard } from './components/ImageCard';

// Vector utility type
interface Vector2D {
  x: number;
  y: number;
}

// Helper: Ensure a value is a number, default to 0 if NaN
const ensureNumber = (value: number, defaultValue = 0): number => 
  isNaN(value) ? defaultValue : value;

// Helper: Create a random velocity vector with a given speed
const createRandomVelocity = (speed: number): Vector2D => {
  const angle = Math.random() * 2 * Math.PI;
  return {
    x: ensureNumber(Math.cos(angle) * speed),
    y: ensureNumber(Math.sin(angle) * speed),
  };
};

// Helper: Normalize a vector
const normalizeVector = (vec: Vector2D): Vector2D => {
  const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  if (isNaN(magnitude) || magnitude === 0) {
    const angle = Math.random() * 2 * Math.PI; // Return a random unit vector
    return { x: ensureNumber(Math.cos(angle)), y: ensureNumber(Math.sin(angle)) };
  }
  return {
    x: ensureNumber(vec.x / magnitude),
    y: ensureNumber(vec.y / magnitude),
  };
};

// Helper: Scale a vector
const scaleVector = (vec: Vector2D, scalar: number): Vector2D => {
  return {
    x: ensureNumber(vec.x * scalar),
    y: ensureNumber(vec.y * scalar),
  };
};

// Helper: Add two vectors
const addVectors = (vec1: Vector2D, vec2: Vector2D): Vector2D => {
  return {
    x: ensureNumber(vec1.x + vec2.x),
    y: ensureNumber(vec1.y + vec2.y),
  };
};

// Helper: Calculate magnitude of a vector
const vectorMagnitude = (vec: Vector2D): number => {
  return ensureNumber(Math.sqrt(vec.x * vec.x + vec.y * vec.y));
};


const App: React.FC = () => {
  const [images, setImages] = useState<MovingImage[]>([]);
  const [score, setScore] = useState(0);
  const [currentSpeedMagnitude, setCurrentSpeedMagnitude] = useState(INITIAL_SPEED_MAGNITUDE);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.NotStarted);
  const [message, setMessage] = useState("Clique em 'Iniciar Jogo' para começar!");
  
  const [showSapoViscosoMessage, setShowSapoViscosoMessage] = useState(false);
  const sapoViscosoTimerRef = useRef<number | null>(null);

  const [isBonusStageActive, setIsBonusStageActive] = useState(false);
  const [hasBonusStageTriggeredOnce, setHasBonusStageTriggeredOnce] = useState(false);
  const bonusStageTimerRef = useRef<number | null>(null);

  const noScoreTimerRef = useRef<number | null>(null); // Will hold requestAnimationFrame ID
  const noScoreTimerStartTimeRef = useRef<number | null>(null);
  const [noScoreTimerProgress, setNoScoreTimerProgress] = useState(100);
  const [isSpecialTargetAwaitingFirstClick, setIsSpecialTargetAwaitingFirstClick] = useState(false);

  const gameStatusRef = useRef(gameStatus); 
  const scoreRef = useRef(score); // Ref to hold the current score for timeouts

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 0, height: 0 });

  const primaryTargetData = IMAGES_DATA[0];
  const distractorData = IMAGES_DATA[1];
  const specialTargetData = IMAGES_DATA[2];

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const getGameOverMessage = (currentScore: number): string => {
    if (currentScore <= 10) {
      return "Você fez poucos pontos Paradinha!";
    } else if (currentScore > 10 && currentScore <= 20) {
      return "Você não é viscoso o suficiente.";
    } else { // score > 20
      return "Mudman Blues tem orgulho de você! Muita viscosidade!";
    }
  };

  const clearNoScoreTimer = useCallback(() => {
    if (noScoreTimerRef.current) {
        cancelAnimationFrame(noScoreTimerRef.current);
        noScoreTimerRef.current = null;
    }
    noScoreTimerStartTimeRef.current = null;
    setNoScoreTimerProgress(100); // Reset progress
  }, []);

  const noScoreTimerLoop = useCallback(() => {
    if (!noScoreTimerStartTimeRef.current || gameStatusRef.current !== GameStatus.Playing || isBonusStageActive) {
      clearNoScoreTimer();
      return;
    }

    const elapsed = performance.now() - noScoreTimerStartTimeRef.current;
    const progress = Math.max(0, 100 - (elapsed / NO_SCORE_TIMEOUT_MS) * 100);
    setNoScoreTimerProgress(progress);

    if (progress <= 0) {
      setGameStatus(GameStatus.GameOver);
      setMessage(getGameOverMessage(scoreRef.current)); 
      clearNoScoreTimer();
    } else {
      noScoreTimerRef.current = requestAnimationFrame(noScoreTimerLoop);
    }
  }, [clearNoScoreTimer, isBonusStageActive, getGameOverMessage]); 
  
  const startNoScoreTimer = useCallback(() => {
    clearNoScoreTimer();
    if (gameStatusRef.current === GameStatus.Playing && !isBonusStageActive) {
      noScoreTimerStartTimeRef.current = performance.now();
      setNoScoreTimerProgress(100);
      noScoreTimerRef.current = requestAnimationFrame(noScoreTimerLoop);
    }
  }, [clearNoScoreTimer, noScoreTimerLoop, isBonusStageActive]);


  useEffect(() => {
    const updateSize = () => {
      if (gameAreaRef.current) {
        const { width, height } = gameAreaRef.current.getBoundingClientRect();
        setGameAreaSize({ width: Math.max(0, width), height: Math.max(0, height) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => {
        window.removeEventListener('resize', updateSize);
        if (sapoViscosoTimerRef.current) clearTimeout(sapoViscosoTimerRef.current);
        if (bonusStageTimerRef.current) clearTimeout(bonusStageTimerRef.current);
        clearNoScoreTimer();
    };
  }, [clearNoScoreTimer]);
  
  useEffect(() => {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.NotStarted) {
      clearNoScoreTimer();
    } else if (gameStatus === GameStatus.Playing && !isBonusStageActive) {
      if (!noScoreTimerRef.current) { 
          startNoScoreTimer();
      }
    }
  }, [gameStatus, clearNoScoreTimer, startNoScoreTimer, isBonusStageActive]);


  const initializeGame = useCallback(() => {
    if (gameAreaSize.width === 0 || gameAreaSize.height === 0) {
      setMessage("A área do jogo ainda não foi dimensionada. Tente novamente em um instante.");
      return;
    }

    setScore(0);
    const initialSpeed = INITIAL_SPEED_MAGNITUDE;
    setCurrentSpeedMagnitude(initialSpeed);
    
    setShowSapoViscosoMessage(false);
    if (sapoViscosoTimerRef.current) {
        clearTimeout(sapoViscosoTimerRef.current);
        sapoViscosoTimerRef.current = null;
    }

    setIsBonusStageActive(false);
    setHasBonusStageTriggeredOnce(false);
    if (bonusStageTimerRef.current) {
        clearTimeout(bonusStageTimerRef.current);
        bonusStageTimerRef.current = null;
    }
    setIsSpecialTargetAwaitingFirstClick(false);

    const initialImagesSetup: MovingImage[] = [primaryTargetData, distractorData].map((imgData, index) => {
      const initialVelocity = createRandomVelocity(initialSpeed);
      const initialX = Math.max(0, Math.min(Math.random() * (gameAreaSize.width - IMAGE_WIDTH_PX), gameAreaSize.width - IMAGE_WIDTH_PX));
      const initialY = Math.max(0, Math.min(Math.random() * (gameAreaSize.height - IMAGE_HEIGHT_PX), gameAreaSize.height - IMAGE_HEIGHT_PX));
      
      return {
        ...imgData,
        currentX: ensureNumber(initialX),
        currentY: ensureNumber(initialY),
        dx: initialVelocity.x,
        dy: initialVelocity.y,
        key: `${imgData.id}-initial-${Date.now()}-${index}`,
      };
    });
    setImages(initialImagesSetup);
    setMessage(""); // Changed from instructional message
    setGameStatus(GameStatus.Playing); 
  }, [gameAreaSize, primaryTargetData, distractorData]);

  const handleBonusStageImageClick = () => {
    if (!isBonusStageActive) return;
    setScore(prev => prev + 2);
    setMessage(""); // Changed from "BÔNUS +2 PONTOS!"
  };
  
  const handleImageClick = (clickedImageKey: string, event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>): void => {
    if (gameStatus !== GameStatus.Playing || !gameAreaRef.current || isBonusStageActive) return;

    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    const clickedImageIndex = images.findIndex(img => img.key === clickedImageKey);
    if (clickedImageIndex === -1) return;

    const clickedImage = images[clickedImageIndex];
    let impulse: Vector2D = { x: 0, y: 0 };

    if ('clientX' in event && 'clientY' in event) { 
      const clickXInGame = event.clientX - gameAreaRect.left;
      const clickYInGame = event.clientY - gameAreaRect.top;
      const imgCenterX = clickedImage.currentX + IMAGE_WIDTH_PX / 2;
      const imgCenterY = clickedImage.currentY + IMAGE_HEIGHT_PX / 2;
      const delta: Vector2D = {
        x: ensureNumber(imgCenterX - clickXInGame),
        y: ensureNumber(imgCenterY - clickYInGame),
      };
      const dist = vectorMagnitude(delta);
      if (dist > 0.001) {
        impulse = scaleVector(normalizeVector(delta), IMPULSE_STRENGTH);
      } else { 
        impulse = scaleVector(createRandomVelocity(1), IMPULSE_STRENGTH * 0.5);
      }
    }
    impulse.x = ensureNumber(impulse.x);
    impulse.y = ensureNumber(impulse.y);

    let newScore = score;
    const prevScore = score; 
    let messageUpdate = ""; // Default to empty for active gameplay messages
    let newGlobalSpeedMag = currentSpeedMagnitude;
    let updatedImages = [...images]; 
    let shouldTriggerBonusStage = false;
    let scoredInThisClick = false;

    if (clickedImage.id === primaryTargetData.id) { 
      newScore += 1;
      scoredInThisClick = true;
      newGlobalSpeedMag = Math.min(MAX_SPEED_MAGNITUDE, currentSpeedMagnitude + SPEED_MAGNITUDE_INCREMENT);
      // messageUpdate remains ""

      if (gameAreaSize.width > 0 && gameAreaSize.height > 0) {
        const newDistractorVelocity = createRandomVelocity(newGlobalSpeedMag);
        const initialX = Math.max(0, Math.min(Math.random() * (gameAreaSize.width - IMAGE_WIDTH_PX), gameAreaSize.width - IMAGE_WIDTH_PX));
        const initialY = Math.max(0, Math.min(Math.random() * (gameAreaSize.height - IMAGE_HEIGHT_PX), gameAreaSize.height - IMAGE_HEIGHT_PX));
        updatedImages.push({
          ...distractorData,
          currentX: ensureNumber(initialX),
          currentY: ensureNumber(initialY),
          dx: newDistractorVelocity.x,
          dy: newDistractorVelocity.y,
          key: `${distractorData.id}-clone-${newScore}-${Date.now()}`,
        });
        // messageUpdate += removed
      }
      
      const specialTargetExistsInPrevImages = images.some(img => img.id === specialTargetData.id);
      if (newScore >= 10 && !specialTargetExistsInPrevImages && gameAreaSize.width > 0 && gameAreaSize.height > 0) {
        const specialTargetVelocity = createRandomVelocity(INITIAL_SPEED_MAGNITUDE); 
        const initialX = Math.max(0, Math.min(Math.random() * (gameAreaSize.width - IMAGE_WIDTH_PX), gameAreaSize.width - IMAGE_WIDTH_PX));
        const initialY = Math.max(0, Math.min(Math.random() * (gameAreaSize.height - IMAGE_HEIGHT_PX), gameAreaSize.height - IMAGE_HEIGHT_PX));
        updatedImages.push({
          ...specialTargetData,
          currentX: ensureNumber(initialX),
          currentY: ensureNumber(initialY),
          dx: specialTargetVelocity.x,
          dy: specialTargetVelocity.y,
          key: `${specialTargetData.id}-spawn-${newScore}-${Date.now()}`,
        });
        setIsSpecialTargetAwaitingFirstClick(true);
        // messageUpdate += removed
      }
      
      updatedImages = updatedImages.map((img) => {
        let currentVelocity: Vector2D = { x: img.dx, y: img.dy };
        if (img.key === clickedImage.key) { 
          currentVelocity = addVectors(currentVelocity, impulse);
        }
        
        let speedForThisImage = newGlobalSpeedMag;
        const wasJustSpawnedSpecialTarget = img.id === specialTargetData.id && !images.some(oldImg => oldImg.key === img.key);
        if (wasJustSpawnedSpecialTarget) {
            const currentMag = vectorMagnitude({x: img.dx, y: img.dy});
            speedForThisImage = currentMag > 0 ? currentMag : INITIAL_SPEED_MAGNITUDE;
        }

        const finalVelocity = scaleVector(normalizeVector(currentVelocity), speedForThisImage);
        return { ...img, dx: finalVelocity.x, dy: finalVelocity.y };
      });

    } else if (clickedImage.id === specialTargetData.id) { 
      newScore += 2;
      scoredInThisClick = true;
      newGlobalSpeedMag = Math.min(MAX_SPEED_MAGNITUDE, currentSpeedMagnitude + SPEED_MAGNITUDE_INCREMENT);
      // messageUpdate remains ""

      if (gameAreaSize.width > 0 && gameAreaSize.height > 0) {
        const newDistractorVelocity = createRandomVelocity(newGlobalSpeedMag);
         const initialX = Math.max(0, Math.min(Math.random() * (gameAreaSize.width - IMAGE_WIDTH_PX), gameAreaSize.width - IMAGE_WIDTH_PX));
        const initialY = Math.max(0, Math.min(Math.random() * (gameAreaSize.height - IMAGE_HEIGHT_PX), gameAreaSize.height - IMAGE_HEIGHT_PX));
        updatedImages.push({
          ...distractorData,
          currentX: ensureNumber(initialX),
          currentY: ensureNumber(initialY),
          dx: newDistractorVelocity.x,
          dy: newDistractorVelocity.y,
          key: `${distractorData.id}-clone-${newScore}-${Date.now()}`,
        });
        // messageUpdate += removed
      }

      updatedImages = updatedImages.map((img) => {
        let currentVelocity: Vector2D = { x: img.dx, y: img.dy };
        let speedForThisImage = newGlobalSpeedMag;

        if (img.key === clickedImage.key) { 
          currentVelocity = addVectors(currentVelocity, impulse);
          if (isSpecialTargetAwaitingFirstClick) {
            speedForThisImage = INITIAL_SPEED_MAGNITUDE; 
          }
        }
        const finalVelocity = scaleVector(normalizeVector(currentVelocity), speedForThisImage);
        return { ...img, dx: finalVelocity.x, dy: finalVelocity.y };
      });
      
      if (isSpecialTargetAwaitingFirstClick) {
        setIsSpecialTargetAwaitingFirstClick(false);
      }

    } else if (clickedImage.id === distractorData.id) { 
      setGameStatus(GameStatus.GameOver);
      messageUpdate = getGameOverMessage(score); 
      updatedImages = updatedImages.map((img) => {
        if (img.key === clickedImage.key) {
          let newVelocity = addVectors({ x: img.dx, y: img.dy }, impulse);
          let speed = vectorMagnitude(newVelocity);
          if (speed > MAX_SPEED_MAGNITUDE) {
            newVelocity = scaleVector(normalizeVector(newVelocity), MAX_SPEED_MAGNITUDE);
          }
          return { ...img, dx: newVelocity.x, dy: newVelocity.y };
        }
        return img;
      });
    } else { 
        console.warn("Clicked an unrecognized image type:", clickedImage);
        return; 
    }
    
    setScore(newScore);
    setCurrentSpeedMagnitude(newGlobalSpeedMag);
    setImages(updatedImages); 

    if (scoredInThisClick) {
        startNoScoreTimer(); 
    }

    if (newScore >= BONUS_STAGE_SCORE_THRESHOLD && prevScore < BONUS_STAGE_SCORE_THRESHOLD && !hasBonusStageTriggeredOnce) {
        shouldTriggerBonusStage = true;
    } 
    
    setMessage(messageUpdate); // Will be "" for active gameplay, or game over message


    if (newScore >= 10 && prevScore < 10) { 
        setShowSapoViscosoMessage(true);
        if (sapoViscosoTimerRef.current) clearTimeout(sapoViscosoTimerRef.current);
        sapoViscosoTimerRef.current = window.setTimeout(() => {
            setShowSapoViscosoMessage(false);
            sapoViscosoTimerRef.current = null;
        }, 3000);
    }

    if (shouldTriggerBonusStage) {
        setHasBonusStageTriggeredOnce(true);
        setIsBonusStageActive(true);
        clearNoScoreTimer(); 
        
        if (bonusStageTimerRef.current) clearTimeout(bonusStageTimerRef.current);
        bonusStageTimerRef.current = window.setTimeout(() => {
            setIsBonusStageActive(false);
            setMessage(""); // Changed from "Fim do Bônus! Continue o desafio!"
            if (gameStatusRef.current === GameStatus.Playing) {
                 startNoScoreTimer();
            }
        }, BONUS_STAGE_DURATION_MS);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    if (gameStatus !== GameStatus.Playing || gameAreaSize.width === 0 || gameAreaSize.height === 0 || isBonusStageActive) {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      return;
    }

    const gameTick = () => {
      setImages(currentImgs =>
        currentImgs.map(img => {
          let newX = ensureNumber(img.currentX + img.dx);
          let newY = ensureNumber(img.currentY + img.dy);
          let newDx = ensureNumber(img.dx);
          let newDy = ensureNumber(img.dy);

          if (newX <= 0) {
            newX = 0; newDx = Math.abs(newDx);
          } else if (newX + IMAGE_WIDTH_PX >= gameAreaSize.width) {
            newX = gameAreaSize.width - IMAGE_WIDTH_PX; newDx = -Math.abs(newDx);
          }
          if (newY <= 0) {
            newY = 0; newDy = Math.abs(newDy);
          } else if (newY + IMAGE_HEIGHT_PX >= gameAreaSize.height) {
            newY = gameAreaSize.height - IMAGE_HEIGHT_PX; newDy = -Math.abs(newDy);
          }
          newDx = ensureNumber(newDx, 0.1 * (Math.random() > 0.5 ? 1 : -1) ); 
          newDy = ensureNumber(newDy, 0.1 * (Math.random() > 0.5 ? 1 : -1) ); 
          return { ...img, currentX: newX, currentY: newY, dx: newDx, dy: newDy };
        })
      );
      animationFrameId = requestAnimationFrame(gameTick);
    };
    animationFrameId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, gameAreaSize, isBonusStageActive]);
  
  const getTimerBarColor = () => {
    if (noScoreTimerProgress > 66) return 'bg-green-500';
    if (noScoreTimerProgress > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <header className="text-center mb-4 md:mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-600">
          Jomba Clicker
        </h1>
        <p className="text-md sm:text-lg text-gray-400 mt-2 max-w-xl mx-auto whitespace-pre-line h-6 sm:h-7"> {/* Added fixed height */}
          {message}
        </p>
      </header>

      {gameStatus !== GameStatus.NotStarted && (
        <div className="my-2 text-2xl sm:text-3xl font-semibold">
          Pontuação: <span className="text-yellow-400 tabular-nums">{score}</span>
        </div>
      )}

      {gameStatus === GameStatus.Playing && !isBonusStageActive && gameAreaSize.width > 0 && (
        <div className="w-full max-w-md my-2">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-linear ${getTimerBarColor()}`}
              style={{ width: `${noScoreTimerProgress}%` }}
              role="progressbar"
              aria-valuenow={noScoreTimerProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tempo restante para pontuar"
            ></div>
          </div>
        </div>
      )}

      <main
        ref={gameAreaRef}
        className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl p-1 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 relative h-80 sm:h-96 md:h-[500px] lg:h-[600px] overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        {!isBonusStageActive && gameStatus === GameStatus.Playing && images.map(img => (
          <ImageCard
            key={img.key}
            image={img}
            onClick={handleImageClick}
            primaryTargetId={primaryTargetData.id}
            specialTargetId={specialTargetData.id}
            isSpecialTargetActive={images.some(i => i.id === specialTargetData.id)} 
          />
        ))}
        {isBonusStageActive && gameStatus === GameStatus.Playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4">
                <p 
                    className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 animate-pulse mb-4 md:mb-8 text-center pointer-events-none"
                    style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.7), 0 0 20px rgba(245, 158, 11, 0.7)' }}
                    aria-live="assertive"
                >
                    VISCOSIDADE BONUS!<br />CLIQUE, CLIQUE, CLIQUE!
                </p>
                <img 
                    src={specialTargetData.src} 
                    alt={`Bonus Stage: ${specialTargetData.alt}`}
                    className="cursor-pointer object-contain animate-pulse hover:scale-105 transition-transform duration-150"
                    style={{ 
                        width: `${Math.min(gameAreaSize.width * 0.5, IMAGE_WIDTH_PX * 4)}px`, 
                        height: `${Math.min(gameAreaSize.height * 0.5, IMAGE_HEIGHT_PX * 4)}px`,
                        filter: 'drop-shadow(0 0 20px rgba(52, 211, 153, 0.7))'
                    }}
                    onClick={handleBonusStageImageClick}
                    draggable="false"
                />
            </div>
        )}
        {showSapoViscosoMessage && !isBonusStageActive && ( 
            <div 
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none" 
                aria-live="assertive"
            >
                <p className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 animate-pulse p-4 rounded-lg shadow-2xl"
                   style={{ textShadow: '0 0 10px rgba(132, 204, 22, 0.7), 0 0 20px rgba(16, 185, 129, 0.7)' }}
                >
                    SAPO VISCOSO!
                </p>
            </div>
        )}
        {gameStatus !== GameStatus.Playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            
            <button
              onClick={initializeGame}
              disabled={gameAreaSize.width === 0 && gameStatus !== GameStatus.GameOver}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white text-lg sm:text-xl font-semibold rounded-lg shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gameStatus === GameStatus.GameOver ? 'Reiniciar Jogo' : 'Iniciar Jogo'}
            </button>
             {gameAreaSize.width === 0 && gameStatus !== GameStatus.GameOver && <p className="text-xs text-yellow-400 mt-2">Aguardando área do jogo...</p>}
          </div>
        )}
      </main>

      <footer className="mt-8 sm:mt-12 text-center text-gray-500 text-xs sm:text-sm">
        <p className="text-lg font-semibold text-gray-400">A criação desse jogo foi consentida por Johnbaliza. Ass: Jomba.</p>
      </footer>
    </div>
  );
};

export default App;
