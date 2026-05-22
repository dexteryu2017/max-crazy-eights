/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card, Suit } from '../types';

export const SUIT_TEXTS: Record<Suit, { char: string; name: string; colorClass: string; darkColorClass: string }> = {
  hearts: { char: '♥', name: '红桃', colorClass: 'text-red-500', darkColorClass: 'text-red-600' },
  diamonds: { char: '♦', name: '方块', colorClass: 'text-orange-500', darkColorClass: 'text-orange-600' },
  clubs: { char: '♣', name: '梅花', colorClass: 'text-emerald-700', darkColorClass: 'text-emerald-800' },
  spades: { char: '♠', name: '黑桃', colorClass: 'text-slate-800', darkColorClass: 'text-slate-900' },
};

interface CardViewProps {
  card: Card;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  index?: number;
  highlight8?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isFaceDown = false,
  isPlayable = false,
  onClick,
  index = 0,
  highlight8 = true,
}) => {
  const suitInfo = SUIT_TEXTS[card.suit];
  const isEight = card.rank === '8';

  // 牌背图案：漂亮的极简几何对称纹理
  if (isFaceDown) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, delay: index * 0.03 }}
        className="w-14 h-20 sm:w-20 sm:h-30 md:w-24 md:h-36 rounded-xl relative select-none bg-radial from-rose-800 to-rose-950 p-1.5 shadow-md flex items-center justify-center border-2 border-amber-100/30 overflow-hidden"
      >
        {/* 纹理背景 */}
        <div className="absolute inset-1 rounded-lg border border-dashed border-amber-200/20 flex items-center justify-center bg-zinc-900/10">
          <div className="w-full h-full flex flex-wrap items-center justify-center opacity-10 gap-0.5 scale-90">
            {Array.from({ length: 42 }).map((_, i) => (
              <span key={i} className="text-[8px] sm:text-xs">♠♥♦♣</span>
            ))}
          </div>
        </div>
        
        {/* 中心金圈徽章 */}
        <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 border-amber-400/40 bg-zinc-900/20 flex items-center justify-center z-10">
          <span className="text-amber-400/80 font-bold text-lg sm:text-xl md:text-2xl font-serif">8</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={onClick && isPlayable ? { y: -16, scale: 1.05, zIndex: 50 } : {}}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onClick={() => isPlayable && onClick && onClick()}
      id={`card-${card.id}`}
      className={`
        w-14 h-20 sm:w-20 sm:h-30 md:w-24 md:h-36 rounded-xl relative select-none bg-white shadow-md flex flex-col justify-between p-1.5 sm:p-2 border
        ${onClick && isPlayable ? 'cursor-pointer hover:shadow-xl' : 'cursor-not-allowed opacity-80'}
        ${isPlayable ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-emerald-900 shadow-amber-400/50 shadow-lg' : 'border-slate-200'}
        ${isEight && highlight8 ? 'bg-amber-50/90 border-amber-300' : ''}
        transition-shadow
      `}
    >
      {/* 左上角点数和花色 */}
      <div className="flex flex-col items-start leading-none">
        <span className={`text-base sm:text-lg md:text-2xl font-black font-sans leading-none ${isEight ? 'text-amber-600' : suitInfo.colorClass}`}>
          {card.rank}
        </span>
        <span className={`text-xs sm:text-sm md:text-lg -mt-0.5 ${suitInfo.colorClass}`}>
          {suitInfo.char}
        </span>
      </div>

      {/* 中心大花色图案 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isEight && highlight8 ? (
          <div className="flex flex-col items-center justify-center">
            {/* 炫酷的万能牌 8 点样式 */}
            <span className="text-xl sm:text-3xl md:text-4xl font-extrabold text-amber-500 font-serif drop-shadow-sm">
              8
            </span>
            <span className="text-[9px] sm:text-[11px] md:text-xs text-amber-600 bg-amber-100 px-1 rounded font-bold scale-90 sm:scale-100">
              万能牌
            </span>
          </div>
        ) : (
          <span className={`text-2xl sm:text-4xl md:text-6xl ${suitInfo.colorClass} opacity-90 select-none`}>
            {suitInfo.char}
          </span>
        )}
      </div>

      {/* 右下角（旋转 180 度）点数和花色 */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`text-base sm:text-lg md:text-2xl font-black font-sans leading-none ${isEight ? 'text-amber-600' : suitInfo.colorClass}`}>
          {card.rank}
        </span>
        <span className={`text-xs sm:text-sm md:text-lg -mt-0.5 ${suitInfo.colorClass}`}>
          {suitInfo.char}
        </span>
      </div>
    </motion.div>
  );
};
