
export interface ImageDetails {
  id: string;
  src: string;
  alt: string;
}

export interface MovingImage extends ImageDetails {
  // isTarget: boolean; // Removed - will be determined by id
  currentX: number; // Current X position (pixels from left of container)
  currentY: number; // Current Y position (pixels from top of container)
  dx: number;       // Velocity in X direction (pixels per frame)
  dy: number;       // Velocity in Y direction (pixels per frame)
  key: string;      // Unique key for React list
}

export enum GameStatus {
  Playing,
  GameOver,
  NotStarted
}