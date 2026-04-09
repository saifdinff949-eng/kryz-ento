import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/stores/userStore';
import { COUNTRY_CODES, CountryCode } from '../src/data/countryCodes';
import { checkPhone, loginUser, registerUser } from '../src/services/api';

const { width, height } = Dimensions.get('window');

// Firebase - optional for web OTP
let firebaseAuth: any = null;
let firebaseRecaptchaVerifier: any = null;
let firebaseSignInWithPhoneNumber: any = null;

try {
  const firebaseModule = require('../src/config/firebase');
  firebaseAuth = firebaseModule.auth;
  firebaseRecaptchaVerifier = firebaseModule.RecaptchaVerifier;
  firebaseSignInWithPhoneNumber = firebaseModule.signInWithPhoneNumber;
} catch (e) {
  console.log('Firebase not available, using backend-only auth');
}

export default function LoginScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  
  // Phone input
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  // OTP input
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef<Array<TextInput | null>>([]);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  // Name input
  const [userName, setUserName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/home');
    }
  }, [user]);

  useEffect(() => {
    // Initialize recaptcha for web (if Firebase available)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && firebaseAuth && firebaseRecaptchaVerifier) {
      try {
        // Will be initialized when sending OTP
      } catch (error) {
        console.log('RecaptchaVerifier error:', error);
      }
    }
  }, []);

  const getFullPhoneNumber = () => {
    return `${selectedCountry.dialCode}${phoneNumber}`;
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setIsLoading(true);
    const fullPhone = getFullPhoneNumber();

    try {
      // Check if phone exists via backend
      const checkResponse = await checkPhone(fullPhone);
      
      if (checkResponse.exists) {
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
      }

      // Try Firebase OTP on web
      if (Platform.OS === 'web' && firebaseAuth && firebaseSignInWithPhoneNumber && firebaseRecaptchaVerifier) {
        try {
          const recaptcha = new firebaseRecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
            size: 'invisible',
          });
          const confirmation = await firebaseSignInWithPhoneNumber(firebaseAuth, fullPhone, recaptcha);
          setConfirmationResult(confirmation);
        } catch (firebaseError) {
          console.log('Firebase OTP error, using backend-only auth:', firebaseError);
        }
      }

      setStep('otp');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      // Even if backend check fails, proceed to OTP
      setIsNewUser(true);
      setStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setIsLoading(true);
    const fullPhone = getFullPhoneNumber();

    try {
      // Try Firebase OTP verification
      if (confirmationResult) {
        try {
          await confirmationResult.confirm(otpCode);
        } catch (firebaseError) {
          console.log('Firebase verify failed, using backend auth:', firebaseError);
        }
      }

      // If existing user, login directly
      if (!isNewUser) {
        try {
          const response = await loginUser(fullPhone);
          await setUser(response.user);
          router.replace('/home');
          return;
        } catch (loginError: any) {
          // User not found, treat as new
          setIsNewUser(true);
          setStep('name');
          return;
        }
      }
      
      // New user - go to name input
      setStep('name');
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert('خطأ', 'فشل التحقق. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!userName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسمك');
      return;
    }

    setIsLoading(true);
    const fullPhone = getFullPhoneNumber();

    try {
      const response = await registerUser(fullPhone, userName.trim());
      await setUser(response.user);
      router.replace('/home');
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.response?.data?.detail === 'رقم الهاتف مسجل مسبقاً') {
        // Phone already registered, try login instead
        try {
          const loginResponse = await loginUser(fullPhone);
          await setUser(loginResponse.user);
          router.replace('/home');
          return;
        } catch (loginErr) {
          Alert.alert('خطأ', 'رقم الهاتف مسجل مسبقاً');
          setStep('phone');
        }
      } else {
        Alert.alert('خطأ', 'فشل التسجيل. حاول مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.nameAr}</Text>
      <Text style={styles.countryDialCode}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A2E', '#16213E']}
      style={styles.container}
    >
      {/* Recaptcha container for web */}
      {Platform.OS === 'web' && <View nativeID="recaptcha-container" />}

      {/* Background decoration */}
      <View style={styles.bgDecoration1} />
      <View style={styles.bgDecoration2} />
      <View style={styles.bgDecoration3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Text style={styles.logoText}>K</Text>
            </LinearGradient>
            <Text style={styles.appName}>kryz en app</Text>
            <Text style={styles.tagline}>عالمك الرقمي المميز</Text>
          </View>

          {/* Phone Input Step */}
          {step === 'phone' && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>تسجيل الدخول</Text>
              <Text style={styles.formSubtitle}>أدخل رقم هاتفك للمتابعة</Text>

              {/* Country Selector */}
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countrySelectorFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countrySelectorText}>{selectedCountry.nameAr}</Text>
                <Text style={styles.countrySelectorCode}>{selectedCountry.dialCode}</Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Phone Input */}
              <View style={styles.phoneInputContainer}>
                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="رقم الهاتف"
                  placeholderTextColor="#6B7280"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[styles.submitButton, (!phoneNumber || isLoading) && styles.submitButtonDisabled]}
                onPress={handleSendOTP}
                disabled={!phoneNumber || isLoading}
              >
                <LinearGradient
                  colors={phoneNumber ? ['#8B5CF6', '#EC4899'] : ['#4B5563', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#FFF" />
                      <Text style={styles.submitText}>إرسال رمز التحقق</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>رمز التحقق</Text>
              <Text style={styles.formSubtitle}>
                أدخل الرمز المرسل إلى {selectedCountry.dialCode}{phoneNumber}
              </Text>

              {/* OTP Inputs */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.submitButton, (otp.join('').length !== 6 || isLoading) && styles.submitButtonDisabled]}
                onPress={handleVerifyOTP}
                disabled={otp.join('').length !== 6 || isLoading}
              >
                <LinearGradient
                  colors={otp.join('').length === 6 ? ['#8B5CF6', '#EC4899'] : ['#4B5563', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      <Text style={styles.submitText}>تأكيد</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                }}
              >
                <Text style={styles.backButtonText}>تغيير رقم الهاتف</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Name Input Step */}
          {step === 'name' && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>أهلاً بك!</Text>
              <Text style={styles.formSubtitle}>أدخل اسمك للمتابعة</Text>

              {/* Name Input */}
              <View style={styles.nameInputContainer}>
                <Ionicons name="person" size={20} color="#8B5CF6" />
                <TextInput
                  style={styles.nameInput}
                  placeholder="اسمك"
                  placeholderTextColor="#6B7280"
                  value={userName}
                  onChangeText={setUserName}
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.submitButton, (!userName.trim() || isLoading) && styles.submitButtonDisabled]}
                onPress={handleRegister}
                disabled={!userName.trim() || isLoading}
              >
                <LinearGradient
                  colors={userName.trim() ? ['#10B981', '#059669'] : ['#4B5563', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="rocket" size={20} color="#FFF" />
                      <Text style={styles.submitText}>ابدأ الآن</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <Ionicons name="diamond" size={24} color="#8B5CF6" />
              <Text style={styles.featureText}>اجمع الجواهر</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="game-controller" size={24} color="#EC4899" />
              <Text style={styles.featureText}>العب واربح</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={24} color="#F59E0B" />
              <Text style={styles.featureText}>خدمات مميزة</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر الدولة</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDecoration1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
  },
  bgDecoration3: {
    position: 'absolute',
    top: height * 0.3,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logoText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 15,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  countrySelectorFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  countrySelectorText: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  countrySelectorCode: {
    color: '#9CA3AF',
    fontSize: 14,
    marginRight: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  dialCode: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    textAlign: 'left',
  },
  submitButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    marginLeft: 10,
    textAlign: 'right',
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  countryDialCode: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
