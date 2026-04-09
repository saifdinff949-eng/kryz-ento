import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/stores/userStore';
import { updateDarkMode } from '../../src/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateDarkMode: updateLocalDarkMode, logout } = useUserStore();

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user]);

  const handleDarkModeToggle = async (value: boolean) => {
    if (!user) return;
    updateLocalDarkMode(value);
    try {
      await updateDarkMode(user.id, value);
    } catch (error) {
      console.error('Error updating dark mode:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!user) return null;

  const settingsItems = [
    {
      id: 'dark',
      title: 'Dark',
      subtitle: 'الوضع الليلي',
      icon: 'moon',
      color: '#8B5CF6',
      type: 'toggle',
      value: isDark,
      onToggle: handleDarkModeToggle,
    },
    {
      id: 'tasks',
      title: 'المهام اليومية',
      subtitle: 'اكمل المهام واحصل على جواهر',
      icon: 'checkmark-circle',
      color: '#10B981',
      type: 'link',
      route: '/tasks',
    },
    {
      id: 'gems',
      title: 'اجمع الجواهر',
      subtitle: 'العب واربح المزيد',
      icon: 'diamond',
      color: '#EC4899',
      type: 'link',
      route: '/games',
    },
    {
      id: 'help',
      title: 'المساعدة',
      subtitle: 'تواصل معنا',
      icon: 'help-circle',
      color: '#F59E0B',
      type: 'link',
      route: '/settings/help',
    },
    {
      id: 'logout',
      title: 'تسجيل الخروج',
      subtitle: 'الخروج من الحساب',
      icon: 'log-out',
      color: '#EF4444',
      type: 'button',
      onPress: handleLogout,
    },
  ];

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>الإعدادات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        <View style={[styles.userCard, { backgroundColor: cardBg }]}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.userAvatar}
          >
            <Text style={styles.userAvatarText}>{user.name?.charAt(0) || 'U'}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: textColor }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {user.phone || ''}
            </Text>
          </View>
          <View style={styles.userGems}>
            <Ionicons name="diamond" size={20} color="#8B5CF6" />
            <Text style={[styles.userGemsText, { color: textColor }]}>{user.gems}</Text>
          </View>
        </View>

        {/* Settings Items */}
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.settingCard, { backgroundColor: cardBg }]}
            onPress={() => {
              if (item.type === 'link' && item.route) {
                router.push(item.route as any);
              } else if (item.type === 'button' && item.onPress) {
                item.onPress();
              }
            }}
            disabled={item.type === 'toggle'}
          >
            <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.settingSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {item.subtitle}
              </Text>
            </View>
            {item.type === 'toggle' ? (
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: '#374151', true: '#8B5CF6' }}
                thumbColor={item.value ? '#FFF' : '#FFF'}
              />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? '#6B7280' : '#9CA3AF'}
              />
            )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userGems: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userGemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 14,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
