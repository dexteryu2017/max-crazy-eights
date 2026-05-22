/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string; // 唯一标识符
  suit: Suit;
  rank: Rank;
  value: number; // 牌的大小数值, e.g., A=1, 2=2, ..., J=11, Q=12, K=13
}

export type PlayerType = 'player' | 'ai';

export interface GameLog {
  id: string;
  timestamp: string;
  sender: 'player' | 'ai' | 'system';
  message: string;
  type: 'play' | 'draw' | 'declare' | 'pass' | 'win' | 'info';
  card?: Card;
}

export interface GameStats {
  playerWins: number;
  aiWins: number;
  gamesPlayed: number;
}

export type GameDifficulty = 'easy' | 'smart';

export type GamePhase = 'setup' | 'player_turn' | 'ai_turn' | 'wildcard_selection' | 'game_over';
