import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/stores/userStore';
import { getUser } from '../src/services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, updateGems, logout } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user) {
        const userData = await getUser(user.id);
        updateGems(userData.gems);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
    setRefreshing(false);
  };

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const menuItems = [
    {
      id: 'tasks',
      title: 'المهام اليومية',
      icon: 'checkmark-circle',
      color: '#10B981',
      route: '/tasks',
    },
    {
      id: 'games',
      title: 'الألعاب',
      icon: 'game-controller',
      color: '#EC4899',
      route: '/games',
    },
    {
      id: 'services',
      title: 'الخدمات',
      icon: 'trending-up',
      color: '#8B5CF6',
      route: '/services',
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      icon: 'settings',
      color: '#F59E0B',
      route: '/settings/main',
    },
  ];

  if (!user) return null;

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>{user.name?.charAt(0) || 'U'}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.greeting, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                مرحباً بك!
              </Text>
              <Text style={[styles.userName, { color: textColor }]}>{user.name}</Text>
            </View>
          </View>
          
          {/* Gems Display */}
          <TouchableOpacity style={styles.gemsContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gemsGradient}
            >
              <Ionicons name="diamond" size={20} color="#FFF" />
              <Text style={styles.gemsText}>{user.gems}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { backgroundColor: cardBg }]}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeContent}>
              <Ionicons name="sparkles" size={40} color="#FFD700" />
              <View style={styles.welcomeTextContainer}>
                <Text style={[styles.welcomeTitle, { color: textColor }]}>kryz en app</Text>
                <Text style={[styles.welcomeSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  اكتشف عالم الجواهر والمكافآت
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuCard, { backgroundColor: cardBg }]}
              onPress={() => router.push(item.route as any)}
            >
              <LinearGradient
                colors={[item.color + '30', item.color + '10']}
                style={styles.menuIconContainer}
              >
                <Ionicons name={item.icon as any} size={32} color={item.color} />
              </LinearGradient>
              <Text style={[styles.menuTitle, { color: textColor }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsContainer, { backgroundColor: cardBg }]}>
          <Text style={[styles.statsTitle, { color: textColor }]}>إحصائياتك</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={24} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: textColor }]}>{user.gems}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>جوهرة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: textColor }]}>VIP</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>المستوى</Text>
            </View>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gemsContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gemsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gemsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  welcomeCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  welcomeGradient: {
    padding: 20,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    marginLeft: 15,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  menuCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  menuIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
