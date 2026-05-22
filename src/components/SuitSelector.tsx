/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Suit } from '../types';
import { SUIT_TEXTS } from './CardView';

interface SuitSelectorProps {
  isOpen: boolean;
  onSelect: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ isOpen, onSelect }) => {
  const suitsList: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 半透明模糊遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />

          {/* 选项窗体 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-slate-950/80 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl relative z-10 text-center text-white"
          >
            {/* 魔法颗粒特效星 */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-950">
              <Sparkles id="suit-magic-sparkles" className="w-10 h-10 text-slate-950 animate-bounce" />
            </div>

            <div className="mt-8 mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-yellow-300 tracking-wide font-sans">
                魔法 8 点生效！🌟
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-2 font-mono">
                你刚刚打出了一张万能牌，请点击选择接下来轮次的主导花色：
              </p>
            </div>

            {/* 花色九宫格组 */}
            <div className="grid grid-cols-2 gap-4">
              {suitsList.map((suit) => {
                const info = SUIT_TEXTS[suit];
                const isRed = suit === 'hearts' || suit === 'diamonds';

                return (
                  <motion.button
                    key={suit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(suit)}
                    id={`suit-select-${suit}`}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-2xl border bg-white/5 border-white/10 hover:bg-white/15 backdrop-blur-md transition-all cursor-pointer
                      ${isRed ? 'hover:border-red-400' : 'hover:border-white'}
                    `}
                  >
                    {/* 大扑克文字 */}
                    <span
                      className={`
                        text-5xl sm:text-6xl font-sans select-none mb-1
                        ${isRed ? 'text-red-400 drop-shadow-[0_2px_8px_rgba(239,68,68,0.2)]' : 'text-slate-100'}
                      `}
                    >
                      {info.char}
                    </span>

                    {/* 中文名称 */}
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      {info.char} {info.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 text-[11px] text-slate-300 font-serif">
              提示：AI 必须出的花色，将取决于你所点选的结果！
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
