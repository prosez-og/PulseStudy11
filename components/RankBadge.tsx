import React from 'react';
import type { Rank } from '../types';

const RankBadge: React.FC<{ rank: Rank }> = ({ rank }) => {
  const badgeStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(45deg, ${rank.badgeColors.join(', ')})`,
  };

  return (
    <div
      className={`
        relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full
        [clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]
        ${rank.animationClass && rank.animationClass !== 'shimmer' ? rank.animationClass : ''}
      `}
      style={badgeStyle}
    >
      {rank.animationClass === 'shimmer' && (
        <div className="absolute inset-0 w-full h-full shimmer [clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]"></div>
      )}
      <span 
        className="relative z-10 text-lg font-black"
        style={{
          color: ['PLATINUM', 'DIAMOND', 'SILVER'].includes(rank.name) ? '#2d3748' : '#fff', // dark text on light badges
          textShadow: ['PLATINUM', 'DIAMOND', 'SILVER'].includes(rank.name) ? '0 1px 1px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        {rank.icon}
      </span>
    </div>
  );
};

export default RankBadge;
