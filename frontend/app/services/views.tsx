import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/stores/userStore';
import { getInstagramVideo, createServiceRequest } from '../../src/services/api';

const OFFER_URL = 'https://nooseamazingbatch.com/ik2zjzhvzs?key=97814a98bf6b2a43347abed4cb2153dc';

const PACKAGES = [
  { quantity: 1000, gems: 400 },
  { quantity: 1500, gems: 500 },
  { quantity: 2000, gems: 600 },
];

const EMAILJS_SERVICE = 'service_rkaw7te';
const EMAILJS_TEMPLATE = 'template_dauarzf';
const EMAILJS_PUBLIC_KEY = 'L9gViSwmmvXSDKAK-';

export default function ViewsScreen() {
  const router = useRouter();
  const { user, updateGems } = useUserStore();
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGES[0] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'input' | 'searching' | 'confirm' | 'offer' | 'success'>('input');
  const progressAnim = useState(new Animated.Value(0))[0];

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user]);

  const animateProgress = (target: number, duration: number = 2000) => {
    Animated.timing(progressAnim, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return prev + 1;
      });
    }, duration / target);
  };

  const handleSubmit = async () => {
    if (!videoUrl.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رابط الفيديو');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('خطأ', 'يرجى اختيار عدد المشاهدات');
      return;
    }
    if ((user?.gems || 0) < selectedPackage.gems) {
      Alert.alert('خطأ', 'الجواهر غير كافية');
      return;
    }

    setShowModal(true);
    setStep('searching');
    setProgress(0);
    progressAnim.setValue(0);
    animateProgress(65, 3000);

    try {
      await getInstagramVideo(videoUrl);
    } catch (error) {
      console.log('Video lookup error:', error);
    }
    
    setTimeout(() => setStep('confirm'), 3000);
  };

  const handleConfirm = () => {
    setStep('offer');
    animateProgress(97, 2000);
  };

  const handleOfferComplete = async () => {
    await Linking.openURL(OFFER_URL);
    
    setTimeout(async () => {
      animateProgress(100, 1000);
      setStep('success');

      try {
        await sendEmailNotification();
      } catch (e) {
        console.error('Email error:', e);
      }

      if (user && selectedPackage) {
        try {
          const result = await createServiceRequest(
            user.id,
            'views',
            videoUrl,
            selectedPackage.quantity,
            selectedPackage.gems
          );
          updateGems(result.remaining_gems);
        } catch (error) {
          console.error('Service request error:', error);
        }
      }
    }, 5000);
  };

  const sendEmailNotification = async () => {
    const data = {
      service_id: EMAILJS_SERVICE,
      template_id: EMAILJS_TEMPLATE,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        service_type: 'مشاهدات',
        username: videoUrl,
        quantity: selectedPackage?.quantity,
        user_phone: user?.phone,
        user_name: user?.name,
        timestamp: new Date().toISOString(),
        device: 'Mobile App',
      },
    };

    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setStep('input');
    setProgress(0);
    setVideoUrl('');
    setSelectedPackage(null);
    progressAnim.setValue(0);
  };

  if (!user) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>المشاهدات</Text>
        <View style={styles.gemsContainer}>
          <Ionicons name="diamond" size={18} color="#8B5CF6" />
          <Text style={[styles.gemsText, { color: textColor }]}>{user.gems}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.inputCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.inputLabel, { color: textColor }]}>رابط الفيديو</Text>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="link" size={20} color="#8B5CF6" />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="ادخل رابط الفيديو"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>اختر العدد</Text>
        <View style={styles.packagesGrid}>
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackage?.quantity === pkg.quantity;
            const canAfford = (user.gems || 0) >= pkg.gems;
            return (
              <TouchableOpacity
                key={pkg.quantity}
                style={[
                  styles.packageCard,
                  { backgroundColor: cardBg },
                  isSelected && styles.packageSelected,
                  !canAfford && styles.packageDisabled,
                ]}
                onPress={() => canAfford && setSelectedPackage(pkg)}
                disabled={!canAfford}
              >
                <Text style={[styles.packageQuantity, { color: isSelected ? '#8B5CF6' : textColor }]}>
                  {pkg.quantity}
                </Text>
                <Text style={[styles.packageLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  مشاهدة
                </Text>
                <View style={styles.packageGems}>
                  <Ionicons name="diamond" size={14} color="#8B5CF6" />
                  <Text style={styles.packageGemsText}>{pkg.gems}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={!videoUrl || !selectedPackage}
        >
          <LinearGradient
            colors={videoUrl && selectedPackage ? ['#8B5CF6', '#EC4899'] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            <Ionicons name="send" size={20} color="#FFF" />
            <Text style={styles.submitText}>إرسال</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A2E' : '#FFF' }]}>
            {step === 'searching' && (
              <>
                <Ionicons name="search" size={50} color="#8B5CF6" />
                <Text style={[styles.modalTitle, { color: textColor }]}>جاري البحث عن الفيديو</Text>
                <View style={styles.progressContainer}>
                  <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
              </>
            )}

            {step === 'confirm' && (
              <>
                <Ionicons name="videocam" size={60} color="#8B5CF6" />
                <Text style={[styles.modalTitle, { color: textColor }]}>هذا هو الفيديو؟</Text>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.confirmGradient}>
                    <Text style={styles.confirmText}>نعم</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={[styles.cancelText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>إلغاء</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'offer' && (
              <>
                <Ionicons name="warning" size={50} color="#F59E0B" />
                <Text style={[styles.modalTitle, { color: textColor }]}>أكمل العرض</Text>
                <View style={styles.progressContainer}>
                  <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
                <TouchableOpacity style={styles.offerButton} onPress={handleOfferComplete}>
                  <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.offerGradient}>
                    <Text style={styles.offerText}>أكمل العرض</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step === 'success' && (
              <>
                <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                <Text style={[styles.modalTitle, { color: textColor }]}>تم التحقق شكراً!</Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  سوف يتم معالجة طلبك بعد ساعة
                </Text>
                <TouchableOpacity style={styles.doneButton} onPress={closeModal}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.doneGradient}>
                    <Text style={styles.doneText}>حسناً</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  gemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gemsText: { fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  inputCard: { padding: 20, borderRadius: 20, marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 16, marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageCard: {
    width: '31%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageSelected: { borderColor: '#8B5CF6' },
  packageDisabled: { opacity: 0.5 },
  packageQuantity: { fontSize: 20, fontWeight: 'bold' },
  packageLabel: { fontSize: 12, marginTop: 4 },
  packageGems: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  packageGemsText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  submitButton: { marginTop: 20, borderRadius: 30, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, marginTop: 10, textAlign: 'center' },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  progressText: { color: '#8B5CF6', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  confirmButton: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  confirmGradient: { paddingVertical: 14, paddingHorizontal: 40 },
  confirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelText: { marginTop: 15, fontSize: 14 },
  offerButton: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  offerGradient: { paddingVertical: 14, paddingHorizontal: 30 },
  offerText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  doneButton: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  doneGradient: { paddingVertical: 14, paddingHorizontal: 40 },
  doneText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
