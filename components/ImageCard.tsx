
import React from 'react';
import { MovingImage } from '../types';
import { IMAGE_WIDTH_PX, IMAGE_HEIGHT_PX, TARGET_CLICK_PADDING_PX } from '../constants';

interface ImageCardProps {
  image: MovingImage;
  onClick: (key: string, event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  primaryTargetId: string;
  specialTargetId: string;
  isSpecialTargetActive: boolean; // To know if the special target rules apply for styling
}

export const ImageCard: React.FC<ImageCardProps> = React.memo(({ 
    image, 
    onClick, 
    primaryTargetId, 
    specialTargetId,
    isSpecialTargetActive
}) => {
  
  const isPrimaryTarget = image.id === primaryTargetId;
  const isSpecialTarget = image.id === specialTargetId;
  
  // Apply target styling if it's the primary target, or if it's the special target AND active
  const applyTargetStyling = isPrimaryTarget || (isSpecialTarget && isSpecialTargetActive) ;

  const cardWidth = applyTargetStyling ? IMAGE_WIDTH_PX + 2 * TARGET_CLICK_PADDING_PX : IMAGE_WIDTH_PX;
  const cardHeight = applyTargetStyling ? IMAGE_HEIGHT_PX + 2 * TARGET_CLICK_PADDING_PX : IMAGE_HEIGHT_PX;
  const cardLeft = applyTargetStyling ? image.currentX - TARGET_CLICK_PADDING_PX : image.currentX;
  const cardTop = applyTargetStyling ? image.currentY - TARGET_CLICK_PADDING_PX : image.currentY;

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${cardLeft}px`,
    top: `${cardTop}px`,
    width: `${cardWidth}px`,
    height: `${cardHeight}px`,
    zIndex: applyTargetStyling ? 10 : (isSpecialTarget ? 5 : 1), // Special target above distractors but below primary if both target-styled
    display: applyTargetStyling ? 'flex' : 'block',
    alignItems: applyTargetStyling ? 'center' : undefined,
    justifyContent: applyTargetStyling ? 'center' : undefined,
    userSelect: 'none',
  };
  
  let ariaLabel = image.alt;
  if (isPrimaryTarget) {
    ariaLabel += ', este é o alvo principal';
  } else if (isSpecialTarget && isSpecialTargetActive) {
    ariaLabel += ', este é um alvo especial';
  }

  return (
    <div
      className="cursor-pointer transition-transform duration-150 ease-out hover:scale-110 focus:outline-none rounded-lg smooth-transform focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
      style={cardStyle}
      onClick={(event) => onClick(image.key, event)}
      role="button"
      tabIndex={0} 
      aria-label={ariaLabel}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(image.key, e);}}}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="object-cover rounded-md shadow-lg border-2 border-gray-700 hover:border-purple-400 transition-colors duration-200"
        style={{
            width: `${IMAGE_WIDTH_PX}px`,
            height: `${IMAGE_HEIGHT_PX}px`,
            pointerEvents: 'none', 
        }}
        draggable="false" 
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
});