import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/stores/userStore';
import { getAIHelp } from '../../src/services/api';

const DEVELOPER_INSTAGRAM = 'https://www.instagram.com/kryz.ento?igsh=OWYwM3NycWUxcDdn&utm_source=qr';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function HelpScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك في استخدام التطبيق؟',
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = user?.dark_mode ?? true;
  const bgColors = isDark ? ['#0F0F23', '#1A1A2E', '#16213E'] : ['#F3F4F6', '#E5E7EB', '#D1D5DB'];
  const textColor = isDark ? '#FFF' : '#1F2937';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const result = await getAIHelp(user.id, message);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response + '\n\nإذا لم أستطع مساعدتك، يمكنك التواصل مع المطور عبر Instagram.',
        isUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ. يرجى التواصل مع المطور.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeveloperInstagram = () => {
    Linking.openURL(DEVELOPER_INSTAGRAM);
  };

  if (!user) return null;

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>المساعدة</Text>
          <TouchableOpacity onPress={openDeveloperInstagram} style={styles.developerButton}>
            <Ionicons name="logo-instagram" size={24} color="#E4405F" />
          </TouchableOpacity>
        </View>

        {/* Developer Contact Card */}
        <TouchableOpacity
          style={[styles.developerCard, { backgroundColor: cardBg }]}
          onPress={openDeveloperInstagram}
        >
          <LinearGradient
            colors={['#E4405F', '#833AB4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.developerIcon}
          >
            <Ionicons name="logo-instagram" size={24} color="#FFF" />
          </LinearGradient>
          <View style={styles.developerInfo}>
            <Text style={[styles.developerTitle, { color: textColor }]}>تواصل مع المطور</Text>
            <Text style={[styles.developerSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              ادخل عند المطور وقل له المشكلة
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#6B7280' : '#9CA3AF'} />
        </TouchableOpacity>

        {/* Chat Messages */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isUser ? styles.userBubble : styles.aiBubble,
                { backgroundColor: msg.isUser ? '#8B5CF6' : cardBg },
              ]}
            >
              {!msg.isUser && (
                <Ionicons
                  name="sparkles"
                  size={18}
                  color="#F59E0B"
                  style={styles.aiIcon}
                />
              )}
              <Text
                style={[
                  styles.messageText,
                  { color: msg.isUser ? '#FFF' : textColor },
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: cardBg }]}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={[styles.messageText, { color: textColor, marginLeft: 10 }]}>
                جاري التفكير...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: cardBg }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="اكتب سؤالك..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: message.trim() ? 1 : 0.5 },
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.sendGradient}
            >
              <Ionicons name="send" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  developerButton: {
    padding: 8,
  },
  developerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
  },
  developerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  developerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  developerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  developerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  aiIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    margin: 20,
    padding: 10,
    borderRadius: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
