import React, { useEffect } from 'react';
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

export default function ServicesScreen() {
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

  const services = [
    {
      id: 'followers',
      title: 'المتابعين',
      subtitle: 'Followers',
      description: 'زيادة متابعين إنستاغرام',
      icon: 'people',
      color: '#EC4899',
      route: '/services/followers',
    },
    {
      id: 'views',
      title: 'المشاهدات',
      subtitle: 'Views',
      description: 'زيادة مشاهدات الفيديو',
      icon: 'eye',
      color: '#8B5CF6',
      route: '/services/views',
    },
    {
      id: 'likes',
      title: 'اللايكات',
      subtitle: 'Likes',
      description: 'زيادة إعجابات المنشورات',
      icon: 'heart',
      color: '#EF4444',
      route: '/services/likes',
    },
    {
      id: 'shares',
      title: 'الشير',
      subtitle: 'Shares',
      description: 'زيادة مشاركات المحتوى',
      icon: 'share-social',
      color: '#10B981',
      route: '/services/shares',
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
        <Text style={[styles.headerTitle, { color: textColor }]}>الخدمات</Text>
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
          <Ionicons name="information-circle" size={24} color="#8B5CF6" />
          <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            استخدم الجواهر للحصول على خدمات إنستاغرام المميزة!
          </Text>
        </View>

        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: cardBg }]}
              onPress={() => router.push(service.route as any)}
            >
              <LinearGradient
                colors={[service.color + '40', service.color + '20']}
                style={styles.serviceIconContainer}
              >
                <Ionicons name={service.icon as any} size={36} color={service.color} />
              </LinearGradient>
              <Text style={[styles.serviceTitle, { color: textColor }]}>{service.title}</Text>
              <Text style={[styles.serviceSubtitle, { color: service.color }]}>
                {service.subtitle}
              </Text>
              <Text style={[styles.serviceDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {service.description}
              </Text>
            </TouchableOpacity>
          ))}
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  serviceDescription: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});
