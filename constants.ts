
import { ImageDetails } from './types';

// IMPORTANT: User should replace these placeholder URLs with their actual image URLs if they don't load.
// These are based on the images provided in the prompt.
// User may need to host these images themselves if direct linking is unreliable.
export const IMAGE_1_URL = "https://i.imgur.com/sNM9I3F.png"; // Man with fangs
export const IMAGE_2_URL = "https://i.imgur.com/nBPAonf.png"; // Intense eyes
export const IMAGE_3_URL = "https://i.imgur.com/14giHmf.png"; // Placeholder for special target - using a distinct simple image for now


export const IMAGES_DATA: ImageDetails[] = [
  { id: 'image1', src: IMAGE_1_URL, alt: 'Alvo Principal' },
  { id: 'image2', src: IMAGE_2_URL, alt: 'Distrator Comum' },
  { id: 'image3', src: IMAGE_3_URL, alt: 'Alvo Especial Raro' },
];

// Pixel dimensions for the images, chosen to fit reasonably in the game area.
export const IMAGE_WIDTH_PX = 50; 
export const IMAGE_HEIGHT_PX = 70; 
export const TARGET_CLICK_PADDING_PX = 15; // Extra padding for target image's clickable area

export const INITIAL_SPEED_MAGNITUDE = 4.0; // Initial magnitude of the velocity vector
export const SPEED_MAGNITUDE_INCREMENT = 0.8; // How much speed magnitude increases per correct click
export const MAX_SPEED_MAGNITUDE = 20;      // Maximum speed magnitude
export const IMPULSE_STRENGTH = 8.0;        // Strength of the knockback impulse on click

// Bonus Stage Constants
export const BONUS_STAGE_SCORE_THRESHOLD = 20;
export const BONUS_STAGE_DURATION_MS = 5000; // 5 seconds for the bonus stage

// No Score Timeout
export const NO_SCORE_TIMEOUT_MS = 10000; // 10 seconds without scoring
