import React from 'react';
import type { HeroSkin } from '../mockData';
import './HeroCard.css';

interface HeroCardProps {
  hero: HeroSkin;
  isCenterFocus?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({ hero, isCenterFocus }) => {
  // Try to load a generic placeholder image if a local file isn't present
  // In production, this would be `/public/heroes/${hero.id}.jpg`
  const imageSrc = `/heroes/${hero.id}.jpg`;
  const fallbackSrc = `https://picsum.photos/seed/${hero.id}/400/600`;

  return (
    <div className={`hero-card ${hero.isHot ? 'hot' : ''} ${isCenterFocus ? 'center-focus' : ''}`}>
      <img
        src={imageSrc}
        alt={hero.name}
        className="hero-image"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackSrc;
        }}
      />
      
      {/* Top badges (e.g. Rank, EVO, SS, etc.) */}
      <div className="hero-badges top-right">
        {hero.rank && (
          <span className={`rank-badge ${hero.rank.toLowerCase().replace(/\s+/g, '-')}`}>
            {hero.rank}
          </span>
        )}
      </div>

      {hero.isHot && (
        <div className="hero-badges top-left">
          <span className="hot-badge">HOT</span>
        </div>
      )}

      {/* Hero Name / Title at bottom */}
      <div className="hero-name-overlay">
        <span>{hero.name}</span>
      </div>
    </div>
  );
};
