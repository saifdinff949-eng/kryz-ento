import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  picture?: string;
  gems: number;
  dark_mode: boolean;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateGems: (gems: number) => void;
  updateDarkMode: (dark_mode: boolean) => void;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  
  setUser: async (user) => {
    set({ user, isLoading: false });
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
  },
  
  updateGems: (gems) => {
    const user = get().user;
    if (user) {
      const updatedUser = { ...user, gems };
      set({ user: updatedUser });
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },
  
  updateDarkMode: (dark_mode) => {
    const user = get().user;
    if (user) {
      const updatedUser = { ...user, dark_mode };
      set({ user: updatedUser });
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isLoading: false });
  },
  
  loadUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        set({ user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },
}));
