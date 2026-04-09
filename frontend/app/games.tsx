import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/stores/userStore';

const { width } = Dimensions.get('window');

export default function GamesScreen() {
  const router = useRouter();
  const { user } = useUserStore();

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user]);

  const games = [
    {
      id: 'tictactoe',
      title: 'X O',
      subtitle: 'لعبة إكس أو',
      description: 'تحدى الذكاء الاصطناعي - صعب جداً!',
      icon: 'grid',
      color: '#EC4899',
      route: '/games/tictactoe',
      reward: '50 جوهرة للفوز',
      maxPlays: '5 محاولات يومياً',
    },
    {
      id: 'carrace',
      title: 'سباق السيارات',
      subtitle: 'Car Racing',
      description: 'اربح 400km للحصول على المكافأة',
      icon: 'car-sport',
      color: '#8B5CF6',
      route: '/games/carrace',
      reward: '50 جوهرة لكل 400km',
      maxPlays: '5 محاولات يومياً',
    },
  ];

  if (!user) return null;

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>الألعاب</Text>
        <View style={styles.gemsContainer}>
          <Ionicons name="diamond" size={18} color="#8B5CF6" />
          <Text style={[styles.gemsText, { color: textColor }]}>{user.gems}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            العب واربح الجواهر! لديك 5 محاولات يومياً لكل لعبة.
          </Text>
        </View>

        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { backgroundColor: cardBg }]}
            onPress={() => router.push(game.route as any)}
          >
            <LinearGradient
              colors={[game.color + '40', game.color + '20']}
              style={styles.gameIconContainer}
            >
              <Ionicons name={game.icon as any} size={40} color={game.color} />
            </LinearGradient>
            <View style={styles.gameInfo}>
              <Text style={[styles.gameTitle, { color: textColor }]}>{game.title}</Text>
              <Text style={[styles.gameSubtitle, { color: game.color }]}>{game.subtitle}</Text>
              <Text style={[styles.gameDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {game.description}
              </Text>
              <View style={styles.gameDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="diamond" size={14} color="#8B5CF6" />
                  <Text style={styles.detailText}>{game.reward}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={14} color="#F59E0B" />
                  <Text style={styles.detailText}>{game.maxPlays}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="play-circle" size={40} color={game.color} />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  gemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gemsText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  gameIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  gameDescription: {
    fontSize: 12,
    marginTop: 6,
  },
  gameDetails: {
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 6,
  },
});
