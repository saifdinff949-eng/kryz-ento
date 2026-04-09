import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/stores/userStore';
import { getTasksStatus, completeTask } from '../src/services/api';

interface Task {
  id: string;
  title: string;
  url: string;
  gems: number;
  icon: string;
  color: string;
}

const TASKS: Task[] = [
  // Noose links (5 times)
  { id: 'noose_1', title: 'مهمة 1', url: 'https://nooseamazingbatch.com/ik2zjzhvzs?key=97814a98bf6b2a43347abed4cb2153dc', gems: 30, icon: 'gift', color: '#EC4899' },
  { id: 'noose_2', title: 'مهمة 2', url: 'https://nooseamazingbatch.com/ik2zjzhvzs?key=97814a98bf6b2a43347abed4cb2153dc', gems: 30, icon: 'gift', color: '#8B5CF6' },
  { id: 'noose_3', title: 'مهمة 3', url: 'https://nooseamazingbatch.com/ik2zjzhvzs?key=97814a98bf6b2a43347abed4cb2153dc', gems: 30, icon: 'gift', color: '#10B981' },
  { id: 'noose_4', title: 'مهمة 4', url: 'https://nooseamazingbatch.com/ik2zjzhvzs?key=97814a98bf6b2a43347abed4cb2153dc', gems: 30, icon: 'gift', color: '#F59E0B' },
  { id: 'noose_5', title: 'مهمة 5', url: 'https://nooseamazingbatch.com/ik2zjzhvzs?key=97814a98bf6b2a43347abed4cb2153dc', gems: 30, icon: 'gift', color: '#EF4444' },
  // Instagram
  { id: 'ig_reel_1', title: 'Instagram Reel 1', url: 'https://www.instagram.com/reel/DW1FR_viJ90/?igsh=MWUxcWc5c2FsNnE5', gems: 30, icon: 'logo-instagram', color: '#E4405F' },
  { id: 'ig_reel_2', title: 'Instagram Reel 2', url: 'https://www.instagram.com/reel/DWy15x6CNh5/?igsh=NHp6dGxtbG4zaWFp', gems: 30, icon: 'logo-instagram', color: '#E4405F' },
  { id: 'ig_profile', title: 'kryz.ento Profile', url: 'https://www.instagram.com/kryz.ento?igsh=OWYwM3NycWUxcDdn&utm_source=qr', gems: 30, icon: 'logo-instagram', color: '#E4405F' },
  { id: 'ig_reel_3', title: 'Instagram Reel 3', url: 'https://www.instagram.com/reel/DWdjNLpKiXX/?igsh=d3FoZWJ0azkwYmQz', gems: 30, icon: 'logo-instagram', color: '#E4405F' },
  { id: 'ig_reel_4', title: 'Instagram Reel 4', url: 'https://www.instagram.com/reel/DWbDg5FqGBJ/?igsh=YTNjbmdnYjZsN2J0', gems: 30, icon: 'logo-instagram', color: '#E4405F' },
  { id: 'ig_yassin', title: 'yassin_yass8', url: 'https://www.instagram.com/yassin_yass8?igsh=bXY1ZzZ2ampqajFv&utm_source=qr', gems: 30, icon: 'logo-instagram', color: '#E4405F' },
  // YouTube
  { id: 'yt_channel', title: 'kryz-ento Channel', url: 'https://www.youtube.com/@kryz-ento', gems: 30, icon: 'logo-youtube', color: '#FF0000' },
  { id: 'yt_short_1', title: 'YouTube Short 1', url: 'https://youtube.com/shorts/GtN_3JZXI3w?is=JFXi-1113aMCT_ur', gems: 30, icon: 'logo-youtube', color: '#FF0000' },
  { id: 'yt_drave', title: 'drave_n_1 Channel', url: 'https://www.youtube.com/@drave_n_1', gems: 30, icon: 'logo-youtube', color: '#FF0000' },
  { id: 'yt_short_2', title: 'YouTube Short 2', url: 'https://youtube.com/shorts/sn9VxZzvOkM?is=ngG5FdEUrAZVCXYR', gems: 30, icon: 'logo-youtube', color: '#FF0000' },
  // TikTok
  { id: 'tt_amin', title: 'mt_amin.ff TikTok', url: 'https://www.tiktok.com/@mt_amin.ff', gems: 30, icon: 'musical-notes', color: '#000000' },
  { id: 'tt_video', title: 'TikTok Video', url: 'https://vm.tiktok.com/ZNR4DYj81/', gems: 30, icon: 'musical-notes', color: '#000000' },
];

export default function TasksScreen() {
  const router = useRouter();
  const { user, updateGems } = useUserStore();
  const [tasksStatus, setTasksStatus] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!user) {
      router.replace('/');
    } else {
      loadTasksStatus();
    }
  }, [user]);

  const loadTasksStatus = async () => {
    if (!user) return;
    try {
      const result = await getTasksStatus(user.id);
      setTasksStatus(result.tasks || {});
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasksStatus();
    setRefreshing(false);
  };

  const handleTaskPress = async (task: Task) => {
    const status = tasksStatus[task.id];
    if (status && !status.available) {
      const hours = Math.ceil(status.remaining_seconds / 3600);
      Alert.alert('انتظر!', `هذه المهمة غير متاحة. حاول بعد ${hours} ساعات`);
      return;
    }

    // Open the URL
    try {
      await Linking.openURL(task.url);
      
      // Mark task as complete after opening
      setTimeout(async () => {
        try {
          if (user) {
            const result = await completeTask(user.id, task.id);
            updateGems(result.gems);
            Alert.alert('تهانينا!', `حصلت على ${task.gems} جوهرة!`);
            loadTasksStatus();
          }
        } catch (error: any) {
          if (error.response?.status !== 400) {
            console.error('Error completing task:', error);
          }
        }
      }, 3000);
    } catch (error) {
      Alert.alert('خطأ', 'لا يمكن فتح الرابط');
    }
  };

  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  if (!user) return null;

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>المهام اليومية</Text>
        <View style={styles.gemsContainer}>
          <Ionicons name="diamond" size={18} color="#8B5CF6" />
          <Text style={[styles.gemsText, { color: textColor }]}>{user.gems}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
          <Ionicons name="information-circle" size={24} color="#8B5CF6" />
          <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            أكمل المهام واحصل على 30 جوهرة لكل مهمة. المهام تتجدد كل 20 ساعة.
          </Text>
        </View>

        {TASKS.map((task) => {
          const status = tasksStatus[task.id];
          const isAvailable = !status || status.available;
          
          return (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                { backgroundColor: cardBg },
                !isAvailable && styles.taskCardDisabled,
              ]}
              onPress={() => handleTaskPress(task)}
              disabled={!isAvailable}
            >
              <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                <Ionicons name={task.icon as any} size={24} color={task.color} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: textColor }]}>{task.title}</Text>
                <View style={styles.taskReward}>
                  <Ionicons name="diamond" size={14} color="#8B5CF6" />
                  <Text style={styles.taskRewardText}>+{task.gems}</Text>
                </View>
              </View>
              {isAvailable ? (
                <Ionicons name="chevron-forward" size={24} color={isDark ? '#6B7280' : '#9CA3AF'} />
              ) : (
                <View style={styles.cooldownBadge}>
                  <Ionicons name="time" size={14} color="#F59E0B" />
                  <Text style={styles.cooldownText}>{formatCooldown(status.remaining_seconds)}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  taskCardDisabled: {
    opacity: 0.6,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskRewardText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  cooldownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cooldownText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
