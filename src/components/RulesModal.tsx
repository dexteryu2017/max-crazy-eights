/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Sparkles, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 半透明遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900"
            onClick={onClose}
          />
          
          {/* 规则对话框 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-slate-950/80 backdrop-blur-xl rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden z-10 border border-white/20 relative flex flex-col max-h-[85vh] text-white"
          >
            {/* 头部 */}
            <div className="bg-white/10 backdrop-blur-md p-4 shrink-0 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen id="rules-book-icon" className="w-5 h-5 text-yellow-300" />
                <h3 className="text-lg font-extrabold tracking-wide font-sans">Max疯狂8点 玩法秘籍 🃏</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full"
                aria-label="关闭"
              >
                <X id="rules-close-icon" className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区域 (滚动) */}
            <div className="p-5 overflow-y-auto space-y-4 text-slate-200">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  《疯狂8点》(Crazy Eights) 是一门需要智慧与运气的全球经典纸牌游戏，玩法特别简单而且超级刺激！让我们一起来看规则吧！
                </p>
              </div>

              {/* 核心规则列表 */}
              <div className="space-y-3.5">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs sm:text-sm text-yellow-300 shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">发牌 & 牌数</h4>
                    <p className="text-xs sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                      一副标准 52 张扑克牌（不含大小王）。开局时，你和智能 AI 都会获得 <strong className="text-yellow-300">8 张</strong> 初始手牌。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs sm:text-sm text-yellow-300 shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">出牌法则</h4>
                    <p className="text-xs sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                      你可以出手中任何与弃牌堆顶部最上面的那张牌 <strong className="text-yellow-300">花色相同</strong> 或 <strong className="text-yellow-300">数字相同</strong> 的牌。
                      <span className="block mt-1 bg-white/5 border border-white/5 p-1.5 rounded text-[11px] text-slate-300">
                        例如：如果弃牌堆最上面是<strong>红桃 7</strong>，你可以出一张<strong>任何花色的 7</strong>，或者<strong>任何数值的红桃牌</strong>。
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs sm:text-sm text-yellow-300 shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> 万能 8 点！
                    </h4>
                    <p className="text-xs sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                      任何数字是 <strong className="text-rose-300">8</strong> 的牌都是<strong>万能无阻牌</strong>！你可以在任何轮到你出牌的时候直接打出 8。打出 8 后，你可以<strong>指定下一轮需要打出的全新花色 (红桃♥/方块♦/梅花♣/黑桃♠)</strong>。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs sm:text-sm text-yellow-300 shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">摸牌规则</h4>
                    <p className="text-xs sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                      如果轮到你，但你手里没有任何卡牌符合出牌规则，你必须从<strong>「摸牌堆」</strong>摸一张新牌。
                      每个回合最多摸一张牌。摸牌后，如果该牌可出你可以选择打出，也可以选择点击 <strong>“结束回合”</strong> 换 AI 出牌。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs sm:text-sm text-yellow-300 shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">胜利目标 👑</h4>
                    <p className="text-xs sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                      先走完所有的牌，将手牌完全 <strong className="text-yellow-300 text-sm">清空 (0张)</strong> 的一方将作为胜利的超级赢家！
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 尾部按钮 */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 shrink-0 fill-current" />
                我懂了，开启战斗！
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
