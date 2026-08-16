import React, { useMemo } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const TrophySVG = ({ league, className = "w-24 h-24 sm:w-32 sm:h-32" }) => {
  // Generate a unique ID prefix so SVG gradients don't collide and turn black!
  const uid = useMemo(() => Math.random().toString(36).substring(2, 9), []);

  const silver = `url(#silver-${uid})`;
  const darkSilver = `url(#darkSilver-${uid})`;
  const wood = `url(#wood-${uid})`;
  const gold = `url(#gold-${uid})`;

  return (
    <svg viewBox="0 0 100 120" className={`transform-gpu ${className}`}>
      <defs>
        <linearGradient id={`silver-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="25%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="75%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`darkSilver-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`wood-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#271001" />
          <stop offset="50%" stopColor="#5c2b07" />
          <stop offset="100%" stopColor="#271001" />
        </linearGradient>
        <linearGradient id={`gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="25%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>

      {league === 'NHL' && (
        <g className="drop-shadow-[0_10px_20px_rgba(255,255,255,0.25)]">
          {/* THE STANLEY CUP - Iconic 5 Tiers */}
          <path d="M 22 115 L 78 115 L 75 95 L 25 95 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <path d="M 25 95 L 75 95 L 72 75 L 28 75 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <path d="M 28 75 L 72 75 L 67 55 L 33 55 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Neck */}
          <path d="M 42 55 L 58 55 L 56 35 L 44 35 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Main Bowl */}
          <path d="M 15 15 C 15 45 85 45 85 15 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <ellipse cx="50" cy="15" rx="35" ry="6" fill={darkSilver} />
          <path d="M 15 15 C 30 5 70 5 85 15 Z" fill={silver} />
        </g>
      )}

      {league === 'AHL' && (
        <g className="drop-shadow-2xl">
          {/* THE CALDER CUP - Wide wood base, shallow bowl */}
          <path d="M 20 115 L 80 115 L 75 75 L 25 75 Z" fill={wood} stroke="#1a0a00" strokeWidth="0.5"/>
          <path d="M 35 75 L 65 75 L 60 50 L 40 50 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Shallow Bowl */}
          <path d="M 10 30 C 10 60 90 60 90 30 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <ellipse cx="50" cy="30" rx="40" ry="7" fill={darkSilver} />
          <path d="M 10 30 C 30 20 70 20 90 30 Z" fill={silver} />
        </g>
      )}

      {['OHL', 'WHL', 'QMJHL'].includes(league) && (
        <g className="drop-shadow-2xl">
          {/* THE MEMORIAL CUP - Large distinct handles */}
          <path d="M 25 115 L 75 115 L 70 85 L 30 85 Z" fill={wood} stroke="#1a0a00" strokeWidth="0.5"/>
          <path d="M 40 85 L 60 85 L 55 50 L 45 50 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Handles */}
          <path d="M 35 30 C 0 30 5 70 30 65" fill="none" stroke={silver} strokeWidth="4" strokeLinecap="round"/>
          <path d="M 65 30 C 100 30 95 70 70 65" fill="none" stroke={silver} strokeWidth="4" strokeLinecap="round"/>
          {/* Deep Bowl */}
          <path d="M 30 20 C 30 65 70 65 70 20 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <ellipse cx="50" cy="20" rx="20" ry="5" fill={darkSilver} />
          <path d="M 30 20 C 40 10 60 10 70 20 Z" fill={silver} />
        </g>
      )}

      {!['NHL', 'AHL', 'OHL', 'WHL', 'QMJHL'].includes(league) && (
        <g className="drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          {/* GENERIC GOLD CUP (NCAA, Europe) */}
          <path d="M 25 115 L 75 115 L 70 95 L 30 95 Z" fill={wood} stroke="#1a0a00" strokeWidth="0.5"/>
          <path d="M 42 95 L 58 95 L 54 60 L 46 60 Z" fill={gold} stroke="#78350f" strokeWidth="0.5"/>
          {/* Handles */}
          <path d="M 25 35 C -5 35 10 75 40 70" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round"/>
          <path d="M 75 35 C 105 35 90 75 60 70" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round"/>
          {/* Bowl */}
          <path d="M 20 25 C 20 80 80 80 80 25 Z" fill={gold} stroke="#78350f" strokeWidth="0.5"/>
          <ellipse cx="50" cy="25" rx="30" ry="7" fill="#78350f" />
          <path d="M 20 25 C 30 15 70 15 80 25 Z" fill={gold} />
        </g>
      )}
    </svg>
  );
};

export default TrophySVG;
