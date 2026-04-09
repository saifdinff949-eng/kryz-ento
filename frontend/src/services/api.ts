import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth - Phone
export const checkPhone = async (phone: string) => {
  const response = await api.post('/auth/check-phone', { phone });
  return response.data;
};

export const registerUser = async (phone: string, name: string) => {
  const response = await api.post('/auth/register', { phone, name });
  return response.data;
};

export const loginUser = async (phone: string) => {
  const response = await api.post('/auth/login', { phone });
  return response.data;
};

// User
export const getUser = async (userId: string) => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
};

export const updateGems = async (userId: string, gemsChange: number) => {
  const response = await api.post('/user/gems', { user_id: userId, gems_change: gemsChange });
  return response.data;
};

export const updateDarkMode = async (userId: string, darkMode: boolean) => {
  const response = await api.post('/user/dark-mode', { user_id: userId, dark_mode: darkMode });
  return response.data;
};

// Tasks
export const getTasksStatus = async (userId: string) => {
  const response = await api.get(`/tasks/${userId}`);
  return response.data;
};

export const completeTask = async (userId: string, taskId: string) => {
  const response = await api.post('/tasks/complete', { user_id: userId, task_id: taskId });
  return response.data;
};

// Games
export const getGameStatus = async (userId: string, gameType: string) => {
  const response = await api.get(`/games/${userId}/${gameType}`);
  return response.data;
};

export const recordGamePlay = async (userId: string, gameType: string, won: boolean) => {
  const response = await api.post('/games/play', { user_id: userId, game_type: gameType, won });
  return response.data;
};

// Services
export const createServiceRequest = async (
  userId: string,
  serviceType: string,
  usernameOrUrl: string,
  quantity: number,
  gemsCost: number
) => {
  const response = await api.post('/services/request', {
    user_id: userId,
    service_type: serviceType,
    username_or_url: usernameOrUrl,
    quantity,
    gems_cost: gemsCost,
  });
  return response.data;
};

// Instagram
export const getInstagramProfile = async (username: string) => {
  const response = await api.post('/instagram/profile', { username });
  return response.data;
};

export const getInstagramVideo = async (url: string) => {
  const response = await api.post('/instagram/video', { url });
  return response.data;
};

// AI Help
export const getAIHelp = async (userId: string, message: string) => {
  const response = await api.post('/ai/help', { user_id: userId, message });
  return response.data;
};

export default api;
