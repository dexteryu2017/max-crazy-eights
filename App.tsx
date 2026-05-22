/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Cpu,
  User,
  BookOpen,
  Info,
  ChevronRight,
  HelpCircle,
  Trophy,
  ArrowRightLeft,
  Coins
} from 'lucide-react';

import { Card, Suit, Rank, GameLog, GameStats as StatsType, GameDifficulty, GamePhase } from './types';
import { CardView, SUIT_TEXTS } from './components/CardView';
import { RulesModal } from './components/RulesModal';
import { SuitSelector } from './components/SuitSelector';
import { GameStats } from './components/GameStats';
import { GameLogs } from './components/GameLogs';
import { sounds } from './utils/audio';

// 扑克牌花色和点数定义
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export default function App() {
  // --- 游戏核心状态 ---
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [aiCards, setAiCards] = useState<Card[]>([]);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  
  const [activeSuit, setActiveSuit] = useState<Suit>('hearts');
  const [activeRank, setActiveRank] = useState<Rank>('2');
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [pending8Card, setPending8Card] = useState<Card | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('smart');
  
  // Sound system toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // UI Panels toggles
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  
  // AI State hints
  const [aiActionMessage, setAiActionMessage] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Stats stats (load from localStorage if available)
  const [stats, setStats] = useState<StatsType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('max_crazy_8s_stats');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("加载游戏统计失败", e);
        }
      }
    }
    return { playerWins: 0, aiWins: 0, gamesPlayed: 0 };
  });

  // Action log histories
  const [logs, setLogs] = useState<GameLog[]>([]);

  // 同步音效开关给全局单例
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // 保存数据至 localStorage
  useEffect(() => {
    localStorage.setItem('max_crazy_8s_stats', JSON.stringify(stats));
  }, [stats]);

  // 第一时间触发自动洗牌发牌
  useEffect(() => {
    startNewGame();
    // 默认展示玩法秘籍（引导），提升小学生体验
    setIsRulesOpen(true);
  }, []);

  // --- 辅助工具函数 ---
  
  // 添加记录日志
  const addLog = (
    sender: 'player' | 'ai' | 'system',
    message: string,
    type: 'play' | 'draw' | 'declare' | 'pass' | 'win' | 'info',
    card?: Card
  ) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog: GameLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: timeStr,
      sender,
      message,
      type,
      card,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // 生成一副新牌
  const generateDeck = (): Card[] => {
    const deck: Card[] = [];
    SUITS.forEach((suit) => {
      RANKS.forEach((rank, idx) => {
        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          value: idx + 1, // A=1, 2=2, ..., K=13
        });
      });
    });
    return deck;
  };

  // 初始化并开启新游戏
  const startNewGame = () => {
    sounds.playShuffle();
    
    const baseDeck = generateDeck();
    
    // 洗牌 (Fisher-Yates 算法)
    for (let i = baseDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baseDeck[i], baseDeck[j]] = [baseDeck[j], baseDeck[i]];
    }

    // 给玩家和 AI 各发 8 张牌
    const pCards = baseDeck.slice(0, 8);
    const aCards = baseDeck.slice(8, 16);
    let remaining = baseDeck.slice(16);

    // 确定弃牌堆的首张牌（不能为 8，若是 8 则放回牌堆底部重新找一张，避免一开始就产生万能牌选择）
    let initialDiscardIndex = 0;
    while (remaining[initialDiscardIndex] && remaining[initialDiscardIndex].rank === '8') {
      initialDiscardIndex++;
    }

    if (initialDiscardIndex >= remaining.length) {
      // 极端情况：全是 8 (理论物理不可能)，直接选最后一张
      initialDiscardIndex = 0;
    }

    const firstDiscard = remaining[initialDiscardIndex];
    // 从摸牌堆剔除这张牌
    const adjustedDrawPile = [
      ...remaining.slice(0, initialDiscardIndex),
      ...remaining.slice(initialDiscardIndex + 1)
    ];

    // 更新各组件状态
    setPlayerCards(pCards);
    setAiCards(aCards);
    setDrawPile(adjustedDrawPile);
    setDiscardPile([firstDiscard]);
    setActiveSuit(firstDiscard.suit);
    setActiveRank(firstDiscard.rank);
    setHasDrawnThisTurn(false);
    setPending8Card(null);
    setShowSuitSelector(false);
    setIsAiThinking(false);
    setAiActionMessage('');

    // 重置并添加初始化日志
    const suitName = SUIT_TEXTS[firstDiscard.suit].name;
    setLogs([]);
    addLog('system', '🎨 重新洗牌发放完毕！Max疯狂8点，大战正式拉开帷幕。', 'info');
    addLog('system', `弃牌堆最上方亮出：【${suitName} ${firstDiscard.rank}】。当前轮到玩家出牌。`, 'info', firstDiscard);

    // 阶段变更为玩家回合
    setGamePhase('player_turn');
  };

  // 查询单手牌是否符合当前的“花色/点数相同”或“8万能牌”出牌规则
  const isCardPlayable = (card: Card): boolean => {
    if (card.rank === '8') return true; // 万能 8 点，永远可打出
    return card.suit === activeSuit || card.rank === activeRank;
  };

  // 检查玩家当前手牌是否拥有可打出的选项
  const hasPlayableCardsInHand = (hand: Card[]): boolean => {
    return hand.some(card => isCardPlayable(card));
  };

  // --- 逻辑交互函数 ---

  // 玩家出牌
  const handlePlayerPlayCard = (card: Card) => {
    if (gamePhase !== 'player_turn') return;
    if (!isCardPlayable(card)) return;

    // 如果打出的是万能牌 8 点
    if (card.rank === '8') {
      sounds.playMagic();
      
      const newPlayerHand = playerCards.filter((c) => c.id !== card.id);
      setPlayerCards(newPlayerHand);
      setDiscardPile((prev) => [card, ...prev]);
      setActiveRank('8');
      
      // 暂存这张 8，开启花色选择框
      setPending8Card(card);
      setShowSuitSelector(true);
      setGamePhase('wildcard_selection');
      
      addLog('player', `打出了万能牌【8点】，正在聚精会神念叨指定的魔法花色...`, 'play', card);
      return;
    }

    // 打出正常的可出牌
    sounds.playCard();
    const newPlayerHand = playerCards.filter((c) => c.id !== card.id);
    setPlayerCards(newPlayerHand);
    setDiscardPile((prev) => [card, ...prev]);
    setActiveSuit(card.suit);
    setActiveRank(card.rank);

    const suitInfo = SUIT_TEXTS[card.suit];
    addLog('player', `帅气打出一张：【${suitInfo.name} ${card.rank}】`, 'play', card);

    // 检查玩家是否赢得胜利
    if (newPlayerHand.length === 0) {
      handleGameOver('player');
      return;
    }

    // 检查桌上是否有僵局（摸牌堆为空且双方都无法出牌）
    if (checkIfGameBlocked(newPlayerHand, aiCards, drawPile, card.suit, card.rank)) {
      handleGameOver('blocked');
      return;
    }

    // 切换至 AI 回合
    setGamePhase('ai_turn');
    setHasDrawnThisTurn(false);
  };

  // 玩家在选择框点选了指定的下一轮花色
  const handleSuitSelect = (suit: Suit) => {
    sounds.playClick();
    setActiveSuit(suit);
    setShowSuitSelector(false);
    setGamePhase('ai_turn'); // 结束选择，转交 AI

    const suitInfo = SUIT_TEXTS[suit];
    addLog('player', `召唤了指定花色魔法：接下来各方出牌必须为【${suitInfo.name}】或【数字 8】!`, 'declare');

    // 再判定一下：如果打出这张 8 之后手牌已经清空，则锁定胜利，避免由于弹窗期间还没完成判定
    if (playerCards.length === 0) {
      handleGameOver('player');
      return;
    }

    // 检验死局
    if (checkIfGameBlocked(playerCards, aiCards, drawPile, suit, '8')) {
      handleGameOver('blocked');
      return;
    }

    setHasDrawnThisTurn(false);
  };

  // 玩家手动或者点击面板进行摸牌
  const handlePlayerDrawCard = () => {
    if (gamePhase !== 'player_turn') return;
    if (hasDrawnThisTurn) return; // 每回合仅仅允许摸牌一次限制

    if (drawPile.length === 0) {
      addLog('system', '摸牌堆已经枯竭！无红点余牌可摸。若无合法牌打出，请直接点击“结束回合”。', 'info');
      // 允许当做已经摸过牌，以便点击下一步
      setHasDrawnThisTurn(true);
      return;
    }

    // 顶端抽一张
    sounds.playDraw();
    const [drawn, ...remaining] = drawPile;
    const newHand = [...playerCards, drawn];
    
    setPlayerCards(newHand);
    setDrawPile(remaining);
    setHasDrawnThisTurn(true);

    const matchInfo = isCardPlayable(drawn) ? '✨ 幸运摸中可出牌，你现在可以继续打出它！' : '😥 没关系，摸到的牌暂时不合胃口，你需要点击“结束回合”。';
    addLog('player', `从摸牌堆抽了一张牌。${matchInfo}`, 'draw');
  };

  // 玩家在摸牌仍然无解后，选择结束回合
  const handlePlayerPass = () => {
    if (gamePhase !== 'player_turn') return;
    sounds.playClick();
    
    addLog('player', `没有牌可以出，无奈低调跳过本轮，把话语权交给 AI。`, 'pass');
    
    // 换 AI 回合
    setGamePhase('ai_turn');
    setHasDrawnThisTurn(false);
  };

  // --- AI 行为决策与自动化引擎 ---
  
  // 观察 gamePhase 阶段变迁，自动激活 AI
  useEffect(() => {
    if (gamePhase === 'ai_turn') {
      setIsAiThinking(true);
      setAiActionMessage('AI 在深思考虑中...');
      
      const timer = setTimeout(() => {
        executeAITurn();
      }, 1500); // 增加拟人化思考反馈时间，增强博弈趣味
      
      return () => clearTimeout(timer);
    }
  }, [gamePhase, aiCards, discardPile, activeSuit, activeRank]);

  // AI 战术推导演算法
  const executeAITurn = () => {
    setIsAiThinking(false);
    
    // 查找目前 AI 所有能够出的牌
    const playableIdxs = aiCards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => isCardPlayable(card));

    if (playableIdxs.length > 0) {
      // AI 有合法牌可出！
      let selected: { card: Card; index: number };

      if (difficulty === 'easy') {
        // 简单难度：随机在可出牌中挑一张打
        const rand = Math.floor(Math.random() * playableIdxs.length);
        selected = playableIdxs[rand];
      } else {
        // 智能困难套路策略（具有一定防卷战法）：
        // 1. 如果有别的高配非 8 的牌，除非手牌只剩下 2 张，不然尽量拖后对 8 (万能牌) 的打出时机
        // 2. 选择目前手牌中最多的花色中持有的匹配牌
        const nonEightPlayables = playableIdxs.filter((item) => item.card.rank !== '8');
        const eightPlayables = playableIdxs.filter((item) => item.card.rank === '8');

        if (nonEightPlayables.length > 0) {
          // 找出 AI 拥有的红心、方块、梅花、黑桃手牌分布数量
          const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
          aiCards.forEach((c) => {
            if (c.rank !== '8') {
              suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
            }
          });

          // 在非 8 的可出牌里，选那个所含花色，在 AI 保留手牌中最充裕的一张牌
          // 这样可以让 AI 后续回合更大概率继续保持出牌流畅，避免未来被卡手！
          let bestOption = nonEightPlayables[0];
          let maxCount = -1;
          
          nonEightPlayables.forEach((opt) => {
            if (suitCounts[opt.card.suit] > maxCount) {
              maxCount = suitCounts[opt.card.suit];
              bestOption = opt;
            }
          });
          
          selected = bestOption;
        } else {
          // 只剩 8 可以出，那毫不犹豫甩出万能牌！
          selected = eightPlayables[0];
        }
      }

      const cardToPlay = selected.card;
      const indexInHand = selected.index;
      
      // 执行 AI 的出牌动作
      const updatedAICards = aiCards.filter((_, idx) => idx !== indexInHand);
      setAiCards(updatedAICards);
      setDiscardPile((prev) => [cardToPlay, ...prev]);

      // 处理如果是 AI 出 8
      if (cardToPlay.rank === '8') {
        sounds.playMagic();
        setActiveRank('8');

        // AI 挑选指定的新花色：选择 AI 手里剩下最多的那个花色！若没牌了就随机挑
        const finalSuitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
        updatedAICards.forEach((c) => {
          if (c.rank !== '8') finalSuitCounts[c.suit]++;
        });

        let idealSuit: Suit = 'spades';
        let maxCount = -1;
        SUITS.forEach((s) => {
          if (finalSuitCounts[s] > maxCount) {
            maxCount = finalSuitCounts[s];
            idealSuit = s;
          }
        });

        setActiveSuit(idealSuit);
        const nextSuitName = SUIT_TEXTS[idealSuit].name;
        
        addLog('ai', `打出了神秘万能【8】, 并在密谋后将要求更改为：【${nextSuitName}】！`, 'declare', cardToPlay);
        setAiActionMessage(`AI 甩出疯狂8点，点名下一波要：${nextSuitName}`);

        // AI 获胜判断
        if (updatedAICards.length === 0) {
          handleGameOver('ai');
          return;
        }

        // 检验僵局
        if (checkIfGameBlocked(playerCards, updatedAICards, drawPile, idealSuit, '8')) {
          handleGameOver('blocked');
          return;
        }
      } else {
        // AI 打出常规卡牌
        sounds.playCard();
        setActiveSuit(cardToPlay.suit);
        setActiveRank(cardToPlay.rank);

        const suitInfo = SUIT_TEXTS[cardToPlay.suit];
        addLog('ai', `在谋划后打出一张：【${suitInfo.name} ${cardToPlay.rank}】`, 'play', cardToPlay);
        setAiActionMessage(`AI 刚打出了：${suitInfo.name} ${cardToPlay.rank}`);

        // AI 获胜判断
        if (updatedAICards.length === 0) {
          handleGameOver('ai');
          return;
        }

        // 检验僵局
        if (checkIfGameBlocked(playerCards, updatedAICards, drawPile, cardToPlay.suit, cardToPlay.rank)) {
          handleGameOver('blocked');
          return;
        }
      }

      // 没到决战，且胜负未分，回手到玩家回合
      setGamePhase('player_turn');
      setHasDrawnThisTurn(false);

    } else {
      // AI 没有直接可出的牌，必须尝试“摸牌”
      if (drawPile.length > 0) {
        sounds.playDraw();
        const [drawnCard, ...remainingPile] = drawPile;
        const newAIHand = [...aiCards, drawnCard];
        
        setAiCards(newAIHand);
        setDrawPile(remainingPile);
        addLog('ai', `深感无计可施，悄然从摸牌堆抽走 1 张新牌。`, 'draw');
        setAiActionMessage('AI 无可奈何，从摸牌堆摸了一张牌');

        // AI 评估一下摸出的这张牌当场能打么
        // 如果能，AI 会二话不说顺势直接打出，节奏起飞！
        if (drawnCard.rank === '8') {
          // 重复打8逻辑
          sounds.playMagic();
          const nextAIHand = newAIHand.filter((c) => c.id !== drawnCard.id);
          setAiCards(nextAIHand);
          setDiscardPile((prev) => [drawnCard, ...prev]);
          setActiveRank('8');

          const finalSuitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
          nextAIHand.forEach((c) => {
            if (c.rank !== '8') finalSuitCounts[c.suit]++;
          });

          let idealSuit: Suit = 'spades';
          let maxCount = -1;
          SUITS.forEach((s) => {
            if (finalSuitCounts[s] > maxCount) {
              maxCount = finalSuitCounts[s];
              idealSuit = s;
            }
          });

          setActiveSuit(idealSuit);
          const nextSuitName = SUIT_TEXTS[idealSuit].name;
          addLog('ai', `摸牌后瞬间发功！打出了刚摸上的万用牌【8】, 点名新花色：【${nextSuitName}】！`, 'declare', drawnCard);
          setAiActionMessage(`AI 摸牌立刻打出8，锁定要：${nextSuitName}`);

          if (nextAIHand.length === 0) {
            handleGameOver('ai');
            return;
          }

          if (checkIfGameBlocked(playerCards, nextAIHand, remainingPile, idealSuit, '8')) {
            handleGameOver('blocked');
            return;
          }

          setGamePhase('player_turn');
          setHasDrawnThisTurn(false);
        } else if (drawnCard.suit === activeSuit || drawnCard.rank === activeRank) {
          // 可出常规牌
          sounds.playCard();
          const nextAIHand = newAIHand.filter((c) => c.id !== drawnCard.id);
          setAiCards(nextAIHand);
          setDiscardPile((prev) => [drawnCard, ...prev]);
          setActiveSuit(drawnCard.suit);
          setActiveRank(drawnCard.rank);

          const suitInfo = SUIT_TEXTS[drawnCard.suit];
          addLog('ai', `摸牌时惊奇发现该牌可合局，立刻打出：【${suitInfo.name} ${drawnCard.rank}】！`, 'play', drawnCard);
          setAiActionMessage(`AI 摸到立打常规牌：${suitInfo.name} ${drawnCard.rank}`);

          if (nextAIHand.length === 0) {
            handleGameOver('ai');
            return;
          }

          if (checkIfGameBlocked(playerCards, nextAIHand, remainingPile, drawnCard.suit, drawnCard.rank)) {
            handleGameOver('blocked');
            return;
          }

          setGamePhase('player_turn');
          setHasDrawnThisTurn(false);
        } else {
          // 回头没法出
          addLog('ai', `摸了 1 张还是打不了，长叹一气决定过牌（Pass）。`, 'pass');
          setAiActionMessage('AI 摸完后依然没法出牌，宣告跳过');
          
          if (checkIfGameBlocked(playerCards, newAIHand, remainingPile, activeSuit, activeRank)) {
            handleGameOver('blocked');
            return;
          }
          
          setGamePhase('player_turn');
          setHasDrawnThisTurn(false);
        }
      } else {
        // 摸牌堆彻底空了，且无法出牌，无可奈何，直接宣布 Pass/结束跳过
        addLog('ai', `由于手里无合适牌，且摸牌堆也已被摸空，AI 自动跳过这一局。`, 'pass');
        setAiActionMessage('摸牌堆已空，AI 宣布被迫跳过');
        
        if (checkIfGameBlocked(playerCards, aiCards, drawPile, activeSuit, activeRank)) {
          handleGameOver('blocked');
          return;
        }

        setGamePhase('player_turn');
        setHasDrawnThisTurn(false);
      }
    }
  };

  // 僵局决战规则侦测：摸牌堆为空且双方都无法出牌
  const checkIfGameBlocked = (
    pCards: Card[],
    aCards: Card[],
    dPile: Card[],
    actSuit: Suit,
    actRank: Rank
  ): boolean => {
    if (dPile.length > 0) return false; // 摸牌堆还有，就不可能堵塞
    
    // 玩家还能出牌不？
    const pHasPlayable = pCards.some(card => card.rank === '8' || card.suit === actSuit || card.rank === actRank);
    // AI 还能出牌口？
    const aHasPlayable = aCards.some(card => card.rank === '8' || card.suit === actSuit || card.rank === actRank);

    return !pHasPlayable && !aHasPlayable;
  };

  // --- 胜负判定机 ---
  const handleGameOver = (winner: 'player' | 'ai' | 'blocked') => {
    setGamePhase('game_over');

    if (winner === 'player') {
      sounds.playWin();
      setStats((prev) => ({
        playerWins: prev.playerWins + 1,
        aiWins: prev.aiWins,
        gamesPlayed: prev.gamesPlayed + 1,
      }));
      addLog('system', '🏆 战役落幕！恭喜你，抢先打出了所有手牌，荣获这局 Max疯狂8点 的终极大赢家！👑', 'win');
    } else if (winner === 'ai') {
      sounds.playLose();
      setStats((prev) => ({
        playerWins: prev.playerWins,
        aiWins: prev.aiWins + 1,
        gamesPlayed: prev.gamesPlayed + 1,
      }));
      addLog('system', '🤖 遗憾惜败！AI 棋高一招率先解脱所有手牌夺得胜利。别气馁，好戏在后头，点击下方重新发牌再斗一盘！', 'win');
    } else if (winner === 'blocked') {
      // 双方都卡死了，根据张数谁少谁赢，少的一方作为胜者
      const pCount = playerCards.length;
      const aCount = aiCards.length;

      let subMsg = '';
      let winSide: 'player' | 'ai' | 'tie' = 'tie';

      if (pCount < aCount) {
        winSide = 'player';
        sounds.playWin();
        setStats((prev) => ({
          playerWins: prev.playerWins + 1,
          aiWins: prev.aiWins,
          gamesPlayed: prev.gamesPlayed + 1,
        }));
        subMsg = `🏆 你手里仅剩 ${pCount} 张牌，而 AI 还有 ${aCount} 张！恭喜大获全胜！`;
      } else if (aCount < pCount) {
        winSide = 'ai';
        sounds.playLose();
        setStats((prev) => ({
          playerWins: prev.playerWins,
          aiWins: prev.aiWins + 1,
          gamesPlayed: prev.gamesPlayed + 1,
        }));
        subMsg = `🤖 AI 仅剩 ${aCount} 张牌，而你剩下 ${pCount} 张。AI 以微弱张数优势获得了本场角逐的胜利。`;
      } else {
        // 手牌数相同：平局（游戏局数照算）
        setStats((prev) => ({
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
        }));
        subMsg = `🤝 双方手牌一样多（均为 ${pCount} 张），难分胜利伯仲，本局判定为光荣平局！`;
      }

      addLog('system', `⚠️【残局僵死决战】摸牌堆掏空，且双方皆无法合法出牌！点数根据手里剩余张数结算：\n${subMsg}`, 'win');
    }
  };

  // 重置持久化成绩记录
  const resetStats = () => {
    sounds.playClick();
    if (confirm('确定要清除你曾经的战绩记录重新开始吗？')) {
      const fresh = { playerWins: 0, aiWins: 0, gamesPlayed: 0 };
      setStats(fresh);
      localStorage.setItem('max_crazy_8s_stats', JSON.stringify(fresh));
      addLog('system', '✨ 历史战绩成绩已全部清空归零。新的一轮从零启程！', 'info');
    }
  };

  // 判断某一张特定的玩家手牌是否高亮（如果到了玩家回合且该牌合法可出）
  const shouldHighlightPlayerCard = (card: Card): boolean => {
    return gamePhase === 'player_turn' && isCardPlayable(card);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans select-none pb-4" style={{ backgroundImage: 'radial-gradient(circle at center, #14532d 0%, #022c22 100%)' }}>
      {/* 1. 顶部控制栏 HUD */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-40 transition-all shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                <span className="text-slate-950 font-extrabold text-lg sm:text-2xl font-serif">8</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-yellow-300 via-yellow-100 to-amber-200 bg-clip-text text-transparent">
                Max疯狂 8 点
              </h1>
              <p className="text-[10px] text-slate-300 font-mono tracking-wider">
                MAX CRAZY EIGHTS • 策略与运气的扑克博弈
              </p>
            </div>
          </div>

          {/* 中间快捷功能按键组 */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 难度选项 */}
            <div className="bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/20 flex items-center gap-0.5">
              <button
                onClick={() => {
                  sounds.playClick();
                  setDifficulty('easy');
                  addLog('system', '⚙️ 面板设置：AI 难度已切换为「简单轻松型」', 'info');
                }}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-extrabold transition-all cursor-pointer ${difficulty === 'easy' ? 'bg-white/20 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                简单模式
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setDifficulty('smart');
                  addLog('system', '⚙️ 面板设置：AI 难度已切换为「高阶智能型」', 'info');
                }}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-extrabold transition-all cursor-pointer ${difficulty === 'smart' ? 'bg-yellow-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                智能对决
              </button>
            </div>

            {/* 音效开关 */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 ml-1 cursor-pointer bg-white/10 hover:bg-white/20 hover:text-white rounded-xl border border-white/20 transition-colors flex items-center justify-center"
              title={soundEnabled ? '切断音效' : '开启音效'}
            >
              {soundEnabled ? (
                <Volume2 id="toggle-sound-on-icon" className="w-4 h-4 text-yellow-300" />
              ) : (
                <VolumeX id="toggle-sound-off-icon" className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* 规则指南 */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsRulesOpen(true);
              }}
              className="px-3 py-2 cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-yellow-300 hover:text-yellow-200 rounded-xl flex items-center gap-1 font-bold transition-all"
            >
              <BookOpen id="rules-book-trigger" className="w-3.5 h-3.5" />
              <span>秘籍</span>
            </button>

            {/* 开局重洗 */}
            <button
              onClick={() => startNewGame()}
              className="px-3 py-2 cursor-pointer bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <RotateCcw id="btn-restart-game" className="w-3.5 h-3.5" />
              <span>开新局</span>
            </button>
          </div>
        </div>
      </header>

      {/* 统计横条 */}
      <div className="px-4 mt-2 mb-1">
        <GameStats stats={stats} onResetStats={resetStats} />
      </div>

      {/* 2. 核心绿色毛毡扑克桌面 */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-3 sm:py-6 flex flex-col justify-between gap-6 relative">
        
        {/* 背景大8浮雕装饰（防伪，无实际内容，增加视觉厚重感） */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
          <span className="text-[25rem] font-serif font-black">8</span>
        </div>

        {/* ==================== AI 区域 (顶部) ==================== */}
        <section className="bg-white/10 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-white/20 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-3.5">
            {/* AI 状态标牌 */}
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl transition-all ${gamePhase === 'ai_turn' ? 'bg-yellow-400 text-slate-950 animate-pulse' : 'bg-white/10 text-slate-100 border border-white/10'}`}>
                <Cpu id="ai-robot-avatar" className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base text-slate-100">
                    疯狂的 AI 对手
                  </span>
                  <span className="text-[10px] uppercase tracking-widest bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-yellow-300 font-mono">
                    {difficulty === 'smart' ? '🧠 聪明大脑' : '💤 佛系简单'}
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1 mt-0.5 min-h-[1rem]">
                  {isAiThinking ? (
                    <span className="text-yellow-300 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                      思考中，正打算拆散你的牌...
                    </span>
                  ) : aiActionMessage ? (
                    <span className="text-yellow-200 italic">{aiActionMessage}</span>
                  ) : (
                    <span>静静等待轮流，准备发动攻势</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI 张数计数球 */}
            <div className="text-right">
              <span className="text-[10px] text-slate-200 block uppercase font-mono">AI 手牌剩余</span>
              <strong className="text-xl sm:text-2xl font-black text-rose-300 font-mono">
                {aiCards.length}
              </strong>
              <span className="text-[10px] text-rose-200 font-bold ml-1">张</span>
            </div>
          </div>

          {/* AI 扑克牌显示区域：不暴露正面，展现极简反背，呈微弧形排列感 */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 pt-2 relative min-h-[100px] sm:min-h-[150px]">
            {aiCards.length === 0 ? (
              <div className="text-center text-rose-400 font-bold text-xs sm:text-sm py-4">
                👋 手中空空如也，AI 已经全部跑光了！
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full">
                {aiCards.map((card, i) => (
                  <div
                    key={card.id}
                    className="transition-transform duration-300"
                    style={{
                      transform: gamePhase === 'ai_turn' ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <CardView card={card} isFaceDown={true} index={i} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==================== 桌面中间区 (桌面对决与摸排堆极其瞩目区域) ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* 左侧：发牌堆/弃牌堆交互区 (占领7列) */}
          <div className="md:col-span-7 bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 flex flex-col justify-between relative shadow-xl">
            
            {/* 背景桌案花色点缀 */}
            <div className="absolute top-2 right-2 text-[2rem] text-white/20 opacity-45 pointer-events-none">
              ♣ ♦ ♥ ♠
            </div>

            <div className="text-center md:text-left mb-4 shrink-0">
              <h3 className="text-xs sm:text-sm font-bold text-yellow-300 tracking-wider font-sans">
                桌面对垒区
              </h3>
              <p className="text-[10px] text-slate-200 mt-1">
                点击左侧摸牌堆，在手上无合适选择时抽取新牌；将玩家可用卡牌直接点击并拖洒到弃牌堆中！
              </p>
            </div>

            {/* A. 两个核心扑克牌堆组合 */}
            <div className="flex items-center justify-center gap-10 sm:gap-16 py-6 flex-1">
              {/* 摸牌堆 (Draw Pile) */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black text-slate-100 font-mono tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                  摸牌堆 ({drawPile.length})
                </span>
                
                {drawPile.length > 0 ? (
                  <motion.div
                    whileHover={gamePhase === 'player_turn' && !hasDrawnThisTurn ? { scale: 1.05, y: -4 } : {}}
                    whileTap={gamePhase === 'player_turn' && !hasDrawnThisTurn ? { scale: 0.95 } : {}}
                    onClick={handlePlayerDrawCard}
                    id="deck-draw-pile"
                    className={`
                      relative w-20 h-28 sm:w-24 sm:h-36 rounded-2xl cursor-pointer select-none
                      ${gamePhase === 'player_turn' && !hasDrawnThisTurn ? 'ring-4 ring-yellow-400 shadow-2xl border-yellow-300' : 'opacity-80 cursor-not-allowed'}
                    `}
                  >
                    {/* 使用两层堆叠做出 3D 牌堆厚实层感 */}
                    <div className="absolute top-1 left-1 w-full h-full bg-rose-900 rounded-2xl shadow-md border border-white/10" />
                    <div className="absolute top-2 left-2 w-full h-full bg-rose-950 rounded-2xl shadow-md border border-white/10" />
                    
                    {/* 实体顶牌 */}
                    <div className="absolute top-0 left-0 w-full h-full bg-radial from-rose-800 to-rose-950 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg overflow-hidden">
                      {/* 印花 */}
                      <div className="absolute inset-1 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                        <span className="text-[11px] text-yellow-300 font-medium font-serif select-none mt-1 group-hover:scale-110 transition-transform">
                          摸一张
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                    <span className="text-xs text-slate-300 font-mono italic">掏空了</span>
                  </div>
                )}
                
                <span className="text-[10px] text-center text-slate-200 max-w-[100px] leading-tight">
                  {gamePhase === 'player_turn' ? (
                    hasDrawnThisTurn ? (
                      <span className="text-slate-300">本轮已摸牌</span>
                    ) : (
                      <span className="text-yellow-300 font-bold animate-pulse">👈 点我摸一张</span>
                    )
                  ) : (
                    <span>等待轮流</span>
                  )}
                </span>
              </div>

              {/* 转换箭头符号 */}
              <div className="text-white/40 shrink-0 hidden sm:block">
                <ArrowRightLeft id="arrow-transition-indicator" className="w-6 h-6 animate-pulse" />
              </div>

              {/* 弃牌堆 (Discard Pile) */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black text-slate-100 font-mono tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                  弃牌堆
                </span>

                {discardPile.length > 0 ? (
                  <div className="relative w-20 h-28 sm:w-24 sm:h-36 select-none shadow-lg">
                    {/* 底层杂碎牌影，做出错落地落在桌面的质感 */}
                    {discardPile.slice(1, 3).map((oldCard, oldIdx) => (
                      <div
                        key={`old-${oldIdx}`}
                        className="absolute w-full h-full bg-white/70 border border-slate-200 rounded-2xl shadow-sm opacity-50"
                        style={{
                          transform: `rotate(${(oldIdx + 1) * -8}deg) translate(${(oldIdx + 1) * -3}px, ${(oldIdx + 1) * 2}px)`,
                          zIndex: 5 - oldIdx,
                        }}
                      />
                    ))}

                    {/* 最上面崭新的弃牌堆头牌 */}
                    <div style={{ zIndex: 10 }}>
                      <CardView card={discardPile[0]} isPlayable={false} highlight8={false} />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-2xl border bg-white/5 border-white/10 flex items-center justify-center" />
                )}

                <span className="text-[10px] text-center text-slate-300 max-w-[100px] leading-tight">
                  上面是主推牌
                </span>
              </div>
            </div>

            {/* B. 大框通告：当下必须要满足的属性要求（重点显示，防止犯错） */}
            <div className="bg-white/5 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 text-center flex flex-col items-center justify-center mt-3 shrink-0 shadow-lg">
              <span className="text-[10px] text-slate-200 uppercase tracking-widest font-mono">
                当前出牌判定基准
              </span>
              
              <div className="flex items-center gap-2 sm:gap-3.5 mt-2 flex-wrap justify-center">
                <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-200">花色判定：</span>
                  <span className={`text-sm sm:text-base font-black ${activeSuit === 'hearts' || activeSuit === 'diamonds' ? 'text-red-400 drop-shadow-[0_1px_4px_rgba(239,68,68,0.2)]' : 'text-slate-100'}`}>
                    {SUIT_TEXTS[activeSuit].char} {SUIT_TEXTS[activeSuit].name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-200">点数判定：</span>
                  <span className="text-sm sm:text-base text-yellow-300 font-extrabold font-serif">
                    {activeRank}
                  </span>
                </div>
              </div>

              {/* 针对 8 点改变的花色进行强提醒 */}
              {activeRank === '8' && (
                <div className="mt-3.5 text-xs text-yellow-200 bg-white/10 border border-white/20 rounded-lg p-2 font-bold px-4 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>万能魔法生效！限时指定花色为【{SUIT_TEXTS[activeSuit].name}】，你有【8】或该花色可出！</span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：战局回放日志 (占领5列) */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <GameLogs logs={logs} onClearLogs={() => setLogs([])} />
            
            {/* 回合提示和局况公告 */}
            <div className="bg-white/10 backdrop-blur-md p-4.5 rounded-2xl border border-white/20 mt-4 flex flex-col justify-center items-center shadow-lg text-center flex-1">
              {gamePhase === 'player_turn' ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <span className="absolute -inset-1 rounded-full bg-yellow-400/20 animate-ping" />
                    <span className="text-xs bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 px-3.5 py-1 rounded-full font-black tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 你的出牌回合
                    </span>
                  </div>
                  <p className="text-xs text-white mt-3 font-sans font-bold">
                    {hasPlayableCardsInHand(playerCards) ? (
                      <span>挑选高亮卡牌打入战场，或趁此谋定后动打出【8】点改变乾坤！</span>
                    ) : (
                      <span>无卡可出，请点击发牌堆进行【摸牌】！最多扣抽 1 张牌。</span>
                    )}
                  </p>
                </div>
              ) : gamePhase === 'ai_turn' ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3.5 py-1 rounded-full font-black tracking-wide">
                    🤖 AI 的出牌回合...
                  </span>
                  <p className="text-xs text-slate-200 mt-3 animate-pulse italic">
                    AI 正在研究目前弃牌堆属性，盘算要使用的诡计...
                  </p>
                </div>
              ) : gamePhase === 'wildcard_selection' ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3.5 py-1 rounded-full font-black tracking-wide">
                    🌟 改变星象：请选择花色
                  </span>
                  <p className="text-xs text-slate-200 mt-3">
                    点击弹出框中的四大花色，将能让 AI 彻底措手不及！
                  </p>
                </div>
              ) : gamePhase === 'game_over' ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs bg-violet-500/20 border border-violet-500/40 text-violet-300 px-3.5 py-1 rounded-full font-black tracking-wide flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-300" /> 对决已画上句号
                  </span>
                  <button
                    onClick={() => startNewGame()}
                    className="mt-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl border-b-2 border-yellow-700 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    重新发牌 再来一盘！
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-300 italic">初始化就绪</div>
              )}
            </div>
          </div>
        </section>

        {/* ==================== 玩家手牌控制区域 (底部) ==================== */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-5 border border-white/20 shadow-2xl relative overflow-hidden">
          
          {/* 光影饰带 */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-emerald-400 opacity-40" />

          {/* 标牌 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-1.5 leading-none">
                <User className="w-4 h-4 text-yellow-300 shrink-0" /> 我的魔法手牌
                <span className="text-xs text-slate-300 font-mono">({playerCards.length} 张剩余)</span>
              </h3>
            </div>

            {/* 当处于需要 Pass 的尴尬期，极高亮弹出跳过回合按钮 */}
            {gamePhase === 'player_turn' && hasDrawnThisTurn && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayerPass}
                id="btn-player-pass"
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl border border-white/20 flex items-center gap-1 shadow-lg cursor-pointer"
              >
                <span>结束本轮回合 (Pass)</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* 玩家手牌陈列轴 - 支持自适应横向卷动排版，确保移动端不会溢出溃崩 */}
          <div className="flex justify-center min-h-[90px] sm:min-h-[160px] py-2">
            {playerCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="text-yellow-300 font-black text-sm sm:text-lg animate-bounce">
                  ✨ 恭喜你！手牌彻底清空成功！
                </div>
                <p className="text-xs text-slate-200 mt-1">
                  你在本次疯狂8点大战中打出神级收尾！
                </p>
              </div>
            ) : (
              // 叠加重叠手牌排列逻辑，牌多时横轴溢出横向游览
              <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex justify-center py-2 px-4">
                <div className="flex gap-2 sm:gap-3 items-center justify-center max-w-full">
                  {playerCards.map((card) => {
                    const playable = shouldHighlightPlayerCard(card);
                    return (
                      <div
                        key={card.id}
                        className="transition-all duration-300 transform"
                      >
                        <CardView
                          card={card}
                          isFaceDown={false}
                          isPlayable={playable}
                          onClick={() => handlePlayerPlayCard(card)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 出手友情点拨 */}
          {gamePhase === 'player_turn' && playerCards.length > 0 && (
            <div className="flex justify-center mt-2.5">
              {hasPlayableCardsInHand(playerCards) ? (
                <span className="text-[10px] sm:text-xs text-yellow-300 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  💡 友情点拨：具有黄金色光晕包裹的牌都是目前可出的牌哦！
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs text-rose-300 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/15 flex items-center gap-1 animate-pulse">
                  ⚠ 友情警告：你的手卡无法和当前契合。无需惊慌，快去摸一张牌吧！
                </span>
              )}
            </div>
          )}
        </section>
      </main>

      {/* 3. 页脚信息栏 */}
      <footer className="mt-8 text-center text-[11px] text-white/50 font-mono tracking-wider px-4">
        <p>© 2026 Max Crazy Eights. 由顶级游戏设计师荣誉出品 • 面向全年龄趣味认知对局</p>
        <p className="mt-0.5 opacity-60">
          基于 React TypeScript 与 Tailwind CSS 零延迟本地极速对战
        </p>
      </footer>

      {/* ==================== 遮罩弹窗组 ==================== */}
      
      {/* A. 规则弹窗 */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* B. 8万用牌的花色点选框 */}
      <SuitSelector
        isOpen={showSuitSelector}
        onSelect={handleSuitSelect}
      />
    </div>
  );
}
