/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ScrollText, Play, Plus, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { GameLog } from '../types';
import { SUIT_TEXTS } from './CardView';

interface GameLogsProps {
  logs: GameLog[];
  onClearLogs?: () => void;
}

export const GameLogs: React.FC<GameLogsProps> = ({ logs, onClearLogs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 每次日志更新时，自动平滑滚动到最底部，便于游玩查看最新动态
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 flex flex-col h-56 sm:h-64 shadow-xl overflow-hidden">
      {/* 头部标题与清除按钮 */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <ScrollText id="logs-scroll-icon" className="w-4 h-4 text-yellow-300" />
          <h4 className="text-xs sm:text-sm font-black tracking-wider text-slate-100 font-sans">
            战局回放与动态 📝
          </h4>
        </div>
        {onClearLogs && logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[10px] text-white/60 hover:text-white font-bold px-2 py-0.5 rounded border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          >
            清空日志
          </button>
        )}
      </div>

      {/* 滚动日志容器 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs text-slate-200 no-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-300 text-[11px] italic">
            暂无战局动态，开始发牌与出牌吧！
          </div>
        ) : (
          logs.map((log) => {
            // 根据日志发送方和类型给予不一样的颜色方案
            let colorClass = 'text-white/95';
            const isPlayer = log.sender === 'player';
            const isSystem = log.sender === 'system';

            if (log.type === 'win') {
              colorClass = 'text-yellow-300 font-bold bg-yellow-400/20 px-1.5 py-0.5 rounded border border-yellow-300/30';
            } else if (log.type === 'play') {
              colorClass = isPlayer ? 'text-green-300 font-medium' : 'text-orange-300 font-medium';
            } else if (log.type === 'draw') {
              colorClass = isPlayer ? 'text-blue-300' : 'text-pink-300';
            } else if (log.type === 'declare') {
              colorClass = 'text-yellow-200 font-semibold';
            } else if (log.type === 'pass') {
              colorClass = 'text-slate-400 italic';
            }

            // 出牌特殊点缀图标
            let icon = '•';
            if (log.type === 'win') icon = '🏆';
            else if (log.type === 'play') icon = '🃏';
            else if (log.type === 'draw') icon = '📥';
            else if (log.type === 'declare') icon = '🌟';
            else if (log.type === 'pass') icon = '⚠️';

            return (
              <div
                key={log.id}
                className={`p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 flex gap-2 items-start transition-colors hover:bg-white/10`}
              >
                <span className="text-[10px] text-white/40 self-center font-serif leading-none mt-0.5">
                  [{log.timestamp}]
                </span>

                <span className="leading-tight flex items-start gap-1 flex-1">
                  <span className="mr-1 shrink-0">{icon}</span>
                  <span className={colorClass + ' leading-normal'}>{log.message}</span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
