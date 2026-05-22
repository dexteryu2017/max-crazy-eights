/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, RefreshCw, Sparkles, User, Cpu } from 'lucide-react';
import { GameStats as StatsType } from '../types';

interface GameStatsProps {
  stats: StatsType;
  onResetStats: () => void;
}

export const GameStats: React.FC<GameStatsProps> = ({ stats, onResetStats }) => {
  const { playerWins, aiWins, gamesPlayed } = stats;
  const winRate = gamesPlayed > 0 ? Math.round((playerWins / gamesPlayed) * 100) : 0;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-slate-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
      {/* 胜负总览 */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 bg-white/5 p-2 px-3.5 rounded-xl border border-white/10">
          <Trophy id="stats-trophy-icon" className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="leading-tight">
            <span className="text-[10px] sm:text-xs text-yellow-200 block font-sans">总对局</span>
            <span className="text-sm sm:text-lg font-black font-mono">{gamesPlayed}</span>
          </div>
        </div>

        {/* 玩家胜场 */}
        <div className="flex items-center gap-2 bg-white/5 p-2 px-3.5 rounded-xl border border-white/10">
          <User className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="leading-tight">
            <span className="text-[10px] sm:text-xs text-blue-200 block font-sans">我的胜场</span>
            <span className="text-sm sm:text-lg font-black text-blue-300 font-mono">{playerWins}</span>
          </div>
        </div>

        {/* AI胜场 */}
        <div className="flex items-center gap-2 bg-white/5 p-2 px-3.5 rounded-xl border border-white/10">
          <Cpu className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="leading-tight">
            <span className="text-[10px] sm:text-xs text-rose-200 block font-sans">AI胜场</span>
            <span className="text-sm sm:text-lg font-black text-rose-300 font-mono">{aiWins}</span>
          </div>
        </div>

        {/* 胜率百分比 */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {/* 简易旋转环效果 */}
            <div className="w-10 h-10 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5">
              <span className="text-xs font-black font-mono">{winRate}%</span>
            </div>
            {/* 背景气泡圈 */}
            {winRate >= 50 && gamesPlayed > 0 && (
              <span className="absolute -top-1 -right-1 block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-200">我方胜率</span>
              {winRate >= 60 && <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />}
            </div>
            <div className="w-24 sm:w-28 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-300 transition-all duration-500"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 重置清空按钮 */}
      <button
        onClick={onResetStats}
        className="self-end md:self-center bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] sm:text-xs px-3 py-2 rounded-xl text-slate-200 flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
        title="清空并重置所有成绩"
      >
        <RefreshCw id="stats-reset-icon" className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
        清除成绩
      </button>
    </div>
  );
};
