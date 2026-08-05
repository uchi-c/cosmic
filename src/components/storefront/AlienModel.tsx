/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AlienModelProps {
  className?: string;
  /** Unique suffix so multiple instances don't collide on gradient/filter ids. */
  variant?: string;
}

/**
 * COSMIC DEPT house model — a self-contained "extraterrestrial couture" figure.
 *
 * Replaces the stock human editorial photography with an on-brand, guaranteed-to-
 * render vector: a tall alien fashion model in a structured luminescent suit. No
 * external image host, no CSP/network dependency — it ships inside the bundle and
 * inherits the cosmic palette (purple / gold / cream on deep space black).
 */
export const AlienModel: React.FC<AlienModelProps> = ({ className, variant = 'a' }) => {
  const id = (name: string) => `am-${variant}-${name}`;

  return (
    <svg
      viewBox="0 0 400 560"
      className={className}
      role="img"
      aria-label="Cosmic Dept extraterrestrial couture model"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Skin — cool otherworldly jade shifting to violet */}
        <linearGradient id={id('skin')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFF7E4" />
          <stop offset="45%" stopColor="#7FE3C6" />
          <stop offset="100%" stopColor="#9B6DFF" />
        </linearGradient>
        {/* Couture suit — space black with a violet sheen */}
        <linearGradient id={id('suit')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#241A3D" />
          <stop offset="55%" stopColor="#160F28" />
          <stop offset="100%" stopColor="#0A0812" />
        </linearGradient>
        {/* Luminescent piping / trim */}
        <linearGradient id={id('trim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B6DFF" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
        {/* Halo ring */}
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#B68D40" stopOpacity="0" />
          <stop offset="88%" stopColor="#B68D40" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#B68D40" stopOpacity="0" />
        </radialGradient>
        <filter id={id('glow')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient aura behind the figure */}
      <ellipse cx="200" cy="250" rx="150" ry="230" fill="#9B6DFF" opacity="0.10" />

      {/* Golden couture halo */}
      <circle cx="200" cy="120" r="92" fill={`url(#${id('halo')})`} />
      <circle cx="200" cy="120" r="88" fill="none" stroke="#B68D40" strokeWidth="1.5" opacity="0.55" />

      {/* Shoulders / structured couture bodice */}
      <path
        d="M112 300
           C 120 250 150 232 200 232
           C 250 232 280 250 288 300
           L 300 520
           L 100 520 Z"
        fill={`url(#${id('suit')})`}
        stroke="#2A1F45"
        strokeWidth="2"
      />
      {/* Sharp shoulder pads — high fashion structure */}
      <path d="M112 300 C 108 262 132 238 168 238 L 176 268 C 150 270 128 282 124 306 Z" fill="#160F28" stroke="#2A1F45" strokeWidth="1.5" />
      <path d="M288 300 C 292 262 268 238 232 238 L 224 268 C 250 270 272 282 276 306 Z" fill="#160F28" stroke="#2A1F45" strokeWidth="1.5" />

      {/* Luminescent lapel piping */}
      <path d="M200 244 L 176 300 L 196 430" fill="none" stroke={`url(#${id('trim')})`} strokeWidth="3" strokeLinecap="round" filter={`url(#${id('glow')})`} />
      <path d="M200 244 L 224 300 L 204 430" fill="none" stroke={`url(#${id('trim')})`} strokeWidth="3" strokeLinecap="round" filter={`url(#${id('glow')})`} />

      {/* Constellation clasp */}
      <circle cx="200" cy="330" r="4" fill="#39FF14" filter={`url(#${id('glow')})`} />
      <circle cx="200" cy="366" r="3" fill="#9B6DFF" filter={`url(#${id('glow')})`} />
      <circle cx="200" cy="398" r="2.5" fill="#B68D40" />

      {/* Neck */}
      <path d="M184 214 L 184 240 Q 200 250 216 240 L 216 214 Z" fill={`url(#${id('skin')})`} />

      {/* Elongated cranium — elegant, not grotesque */}
      <path
        d="M200 60
           C 246 60 268 100 264 146
           C 261 178 236 206 200 210
           C 164 206 139 178 136 146
           C 132 100 154 60 200 60 Z"
        fill={`url(#${id('skin')})`}
        stroke="#BFF7E4"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      {/* Cheek shadow for depth */}
      <path d="M200 210 C 176 206 158 190 150 168 C 168 192 184 200 200 202 Z" fill="#6DBFA6" opacity="0.35" />

      {/* Signature almond eyes */}
      <path d="M156 150 C 168 132 194 134 198 152 C 190 164 164 166 156 150 Z" fill="#0A0812" />
      <path d="M244 150 C 232 132 206 134 202 152 C 210 164 236 166 244 150 Z" fill="#0A0812" />
      {/* Eye shine */}
      <circle cx="176" cy="148" r="3.4" fill="#9B6DFF" filter={`url(#${id('glow')})`} />
      <circle cx="224" cy="148" r="3.4" fill="#9B6DFF" filter={`url(#${id('glow')})`} />
      {/* Cosmetic gold liner */}
      <path d="M154 152 C 168 168 190 168 200 156" fill="none" stroke="#B68D40" strokeWidth="1.4" opacity="0.7" />
      <path d="M246 152 C 232 168 210 168 200 156" fill="none" stroke="#B68D40" strokeWidth="1.4" opacity="0.7" />

      {/* Subtle mouth */}
      <path d="M188 186 Q 200 192 212 186" fill="none" stroke="#5AAE93" strokeWidth="2" strokeLinecap="round" />

      {/* Forehead bindi / third-eye jewel */}
      <circle cx="200" cy="104" r="4.5" fill="#39FF14" filter={`url(#${id('glow')})`} />
      <circle cx="200" cy="104" r="9" fill="none" stroke="#B68D40" strokeWidth="1" opacity="0.6" />
    </svg>
  );
};

export default AlienModel;
