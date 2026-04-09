import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/stores/userStore';
import { getGameStatus, recordGamePlay } from '../../src/services/api';

const { width, height } = Dimensions.get('window');
const GAME_WIDTH = width - 40;
const GAME_HEIGHT = height * 0.5;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 80;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 60;

export default function CarRaceScreen() {
  const router = useRouter();
  const { user, updateGems } = useUserStore();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [distance, setDistance] = useState(0);
  const [carLane, setCarLane] = useState(1); // 0, 1, 2
  const [obstacles, setObstacles] = useState<Array<{ lane: number; y: number; id: number }>>([]);
  const [gameOver, setGameOver] = useState(false);
  const [playsRemaining, setPlaysRemaining] = useState(5);
  const [won, setWon] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleIdRef = useRef(0);
  const carAnimation = useRef(new Animated.Value(1)).current;

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const LANE_WIDTH = GAME_WIDTH / 3;
  const TARGET_DISTANCE = 400;

  useEffect(() => {
    if (!user) {
      router.replace('/');
    } else {
      loadGameStatus();
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [user]);

  const loadGameStatus = async () => {
    if (!user) return;
    try {
      const status = await getGameStatus(user.id, 'car_racing');
      setPlaysRemaining(status.plays_remaining);
    } catch (error) {
      console.error('Error loading game status:', error);
    }
  };

  const startGame = () => {
    if (playsRemaining <= 0) {
      Alert.alert('انتهت المحاولات', 'عد غداً للعب مرة أخرى!');
      return;
    }
    setIsPlaying(true);
    setDistance(0);
    setCarLane(1);
    setObstacles([]);
    setGameOver(false);
    setWon(false);
    obstacleIdRef.current = 0;
    
    gameLoopRef.current = setInterval(gameLoop, 50);
  };

  const gameLoop = () => {
    setDistance(prev => {
      const newDistance = prev + 2;
      if (newDistance >= TARGET_DISTANCE) {
        endGame(true);
        return TARGET_DISTANCE;
      }
      return newDistance;
    });

    // Add obstacles
    if (Math.random() < 0.03) {
      const lane = Math.floor(Math.random() * 3);
      setObstacles(prev => [
        ...prev,
        { lane, y: -OBSTACLE_HEIGHT, id: obstacleIdRef.current++ },
      ]);
    }

    // Move obstacles
    setObstacles(prev => {
      return prev
        .map(obs => ({ ...obs, y: obs.y + 8 }))
        .filter(obs => obs.y < GAME_HEIGHT + OBSTACLE_HEIGHT);
    });
  };

  // Check collision
  useEffect(() => {
    if (!isPlaying) return;
    
    const carY = GAME_HEIGHT - CAR_HEIGHT - 20;
    const carX = carLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;

    for (const obs of obstacles) {
      const obsX = obs.lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_WIDTH) / 2;
      const obsY = obs.y;

      if (
        obsY + OBSTACLE_HEIGHT > carY &&
        obsY < carY + CAR_HEIGHT &&
        obsX + OBSTACLE_WIDTH > carX &&
        obsX < carX + CAR_WIDTH
      ) {
        endGame(false);
        break;
      }
    }
  }, [obstacles, carLane, isPlaying]);

  const endGame = async (isWin: boolean) => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    setIsPlaying(false);
    setGameOver(true);
    setWon(isWin);

    try {
      if (user) {
        const result = await recordGamePlay(user.id, 'car_racing', isWin);
        setPlaysRemaining(result.plays_remaining);
        if (isWin) {
          updateGems(result.total_gems);
          Alert.alert('🎉 مبروك!', 'قطعت 400km وحصلت على 50 جوهرة!');
        } else {
          Alert.alert('💥 اصطدمت!', `قطعت ${Math.floor(distance)}km. حاول مرة أخرى!`);
        }
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const moveCar = (direction: 'left' | 'right') => {
    if (!isPlaying) return;
    
    Animated.sequence([
      Animated.timing(carAnimation, {
        toValue: direction === 'left' ? 0.8 : 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(carAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setCarLane(prev => {
      if (direction === 'left' && prev > 0) return prev - 1;
      if (direction === 'right' && prev < 2) return prev + 1;
      return prev;
    });
  };

  if (!user) return null;

  const carX = carLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>سباق السيارات</Text>
        <View style={styles.playsContainer}>
          <Ionicons name="game-controller" size={18} color="#8B5CF6" />
          <Text style={[styles.playsText, { color: textColor }]}>{playsRemaining}</Text>
        </View>
      </View>

      {/* Distance Display */}
      <View style={styles.distanceContainer}>
        <Text style={[styles.distanceText, { color: textColor }]}>
          {Math.floor(distance)} km / {TARGET_DISTANCE} km
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(distance / TARGET_DISTANCE) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { backgroundColor: cardBg }]}>
        {/* Road lanes */}
        <View style={styles.road}>
          {[0, 1].map(i => (
            <View
              key={i}
              style={[
                styles.laneLine,
                { left: LANE_WIDTH * (i + 1) - 2 },
              ]}
            />
          ))}
        </View>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <View
            key={obs.id}
            style={[
              styles.obstacle,
              {
                left: obs.lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_WIDTH) / 2,
                top: obs.y,
              },
            ]}
          >
            <Ionicons name="car" size={40} color="#EF4444" />
          </View>
        ))}

        {/* Player Car */}
        <Animated.View
          style={[
            styles.car,
            {
              left: carX,
              bottom: 20,
              transform: [{ scaleX: carAnimation }],
            },
          ]}
        >
          <Ionicons name="car-sport" size={50} color="#8B5CF6" />
        </Animated.View>

        {/* Start Overlay */}
        {!isPlaying && !gameOver && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.startGradient}
              >
                <Ionicons name="play" size={40} color="#FFF" />
                <Text style={styles.startText}>ابدأ اللعب</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <Text style={[styles.gameOverText, { color: won ? '#10B981' : '#EF4444' }]}>
              {won ? '🎉 فزت!' : '💥 اصطدمت!'}
            </Text>
            <Text style={styles.finalDistance}>{Math.floor(distance)} km</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={startGame}
              disabled={playsRemaining <= 0}
            >
              <LinearGradient
                colors={playsRemaining > 0 ? ['#8B5CF6', '#EC4899'] : ['#6B7280', '#4B5563']}
                style={styles.retryGradient}
              >
                <Ionicons name="refresh" size={24} color="#FFF" />
                <Text style={styles.retryText}>
                  {playsRemaining > 0 ? 'حاول مرة أخرى' : 'انتهت المحاولات'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      {isPlaying && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => moveCar('left')}
          >
            <Ionicons name="arrow-back" size={40} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => moveCar('right')}
          >
            <Ionicons name="arrow-forward" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  playsText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  distanceContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 5,
  },
  gameArea: {
    marginHorizontal: 20,
    height: GAME_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  road: {
    flex: 1,
    position: 'relative',
  },
  laneLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  obstacle: {
    position: 'absolute',
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  car: {
    position: 'absolute',
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  startText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  finalDistance: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
