import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/stores/userStore';
import { getGameStatus, recordGamePlay } from '../../src/services/api';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 100) / 3;

type Player = 'X' | 'O' | null;
type Board = Player[];

export default function TicTacToeScreen() {
  const router = useRouter();
  const { user, updateGems } = useUserStore();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player>(null);
  const [playsRemaining, setPlaysRemaining] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!user) {
      router.replace('/');
    } else {
      loadGameStatus();
    }
  }, [user]);

  const loadGameStatus = async () => {
    if (!user) return;
    try {
      const status = await getGameStatus(user.id, 'tictactoe');
      setPlaysRemaining(status.plays_remaining);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game status:', error);
      setIsLoading(false);
    }
  };

  const checkWinner = (board: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const isBoardFull = (board: Board): boolean => {
    return board.every(cell => cell !== null);
  };

  // Minimax AI - unbeatable
  const minimax = (board: Board, depth: number, isMaximizing: boolean): number => {
    const winner = checkWinner(board);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (isBoardFull(board)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          best = Math.max(best, minimax(board, depth + 1, false));
          board[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          best = Math.min(best, minimax(board, depth + 1, true));
          board[i] = null;
        }
      }
      return best;
    }
  };

  const getBestMove = (board: Board): number => {
    let bestVal = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const moveVal = minimax(board, 0, false);
        board[i] = null;

        if (moveVal > bestVal) {
          bestMove = i;
          bestVal = moveVal;
        }
      }
    }

    return bestMove;
  };

  const handleCellPress = (index: number) => {
    if (board[index] || gameOver || !isPlayerTurn || playsRemaining <= 0) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const playerWinner = checkWinner(newBoard);
    if (playerWinner || isBoardFull(newBoard)) {
      handleGameEnd(newBoard, playerWinner);
      return;
    }

    // AI move
    setTimeout(() => {
      const aiMove = getBestMove([...newBoard]);
      if (aiMove !== -1) {
        const aiBoard = [...newBoard];
        aiBoard[aiMove] = 'O';
        setBoard(aiBoard);
        setIsPlayerTurn(true);

        const aiWinner = checkWinner(aiBoard);
        if (aiWinner || isBoardFull(aiBoard)) {
          handleGameEnd(aiBoard, aiWinner);
        }
      }
    }, 500);
  };

  const handleGameEnd = async (finalBoard: Board, winner: Player) => {
    setGameOver(true);
    setWinner(winner);

    const won = winner === 'X';
    
    try {
      if (user) {
        const result = await recordGamePlay(user.id, 'tictactoe', won);
        setPlaysRemaining(result.plays_remaining);
        if (won) {
          updateGems(result.total_gems);
          Alert.alert('تهانينا! 🎉', `فزت وحصلت على 50 جوهرة!`);
        } else if (winner === 'O') {
          Alert.alert('خسرت! 😔', 'الذكاء الاصطناعي فاز. حاول مرة أخرى!');
        } else {
          Alert.alert('تعادل! 🤝', 'لعبة جيدة!');
        }
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const resetGame = () => {
    if (playsRemaining <= 0) {
      Alert.alert('انتهت المحاولات', 'عد غداً للعب مرة أخرى!');
      return;
    }
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  if (!user) return null;

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>X O</Text>
        <View style={styles.playsContainer}>
          <Ionicons name="game-controller" size={18} color="#EC4899" />
          <Text style={[styles.playsText, { color: textColor }]}>{playsRemaining}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Game Info */}
        <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.turnText, { color: textColor }]}>
            {gameOver
              ? winner === 'X'
                ? '🎉 فزت!'
                : winner === 'O'
                ? '😔 خسرت'
                : '🤝 تعادل'
              : isPlayerTurn
              ? 'دورك (X)'
              : 'دور الذكاء (O)'}
          </Text>
        </View>

        {/* Board */}
        <View style={[styles.board, { backgroundColor: cardBg }]}>
          {board.map((cell, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.cell,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
              ]}
              onPress={() => handleCellPress(index)}
              disabled={gameOver || !isPlayerTurn || cell !== null}
            >
              {cell === 'X' && (
                <Text style={[styles.cellText, { color: '#EC4899' }]}>X</Text>
              )}
              {cell === 'O' && (
                <Text style={[styles.cellText, { color: '#8B5CF6' }]}>O</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Controls */}
        {gameOver && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetGame}
            disabled={playsRemaining <= 0}
          >
            <LinearGradient
              colors={playsRemaining > 0 ? ['#EC4899', '#8B5CF6'] : ['#6B7280', '#4B5563']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resetGradient}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.resetText}>
                {playsRemaining > 0 ? 'لعب مرة أخرى' : 'انتهت المحاولات'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Reward Info */}
        <View style={[styles.rewardCard, { backgroundColor: cardBg }]}>
          <Ionicons name="diamond" size={24} color="#8B5CF6" />
          <Text style={[styles.rewardText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            50 جوهرة لكل فوز!
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  playsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  playsText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoCard: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    marginBottom: 30,
  },
  turnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  board: {
    width: CELL_SIZE * 3 + 20,
    height: CELL_SIZE * 3 + 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 20,
    padding: 10,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 30,
    borderRadius: 30,
    overflow: 'hidden',
  },
  resetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
  },
  resetText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
  },
  rewardText: {
    fontSize: 16,
    marginLeft: 10,
  },
});
