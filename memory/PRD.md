# kryz en app - Project Documentation

## App Overview
**kryz en app** is a comprehensive mobile application built with Expo React Native that offers:
- Google OAuth Authentication
- Gems collection system
- Daily tasks with rewards
- Mini games (Tic Tac Toe, Car Racing)
- Instagram services (Followers, Views, Likes, Shares)
- AI-powered help system
- Dark mode support

## Features

### 1. Authentication
- Google OAuth login using provided Client ID
- Automatic user creation with 100 welcome gems
- Secure session management

### 2. Daily Tasks (المهام اليومية)
- 17 tasks with various links (Instagram, YouTube, TikTok)
- 50 gems reward per task
- 20-hour cooldown between completions

### 3. Games (الألعاب)
- **Tic Tac Toe (X O)**: Very hard AI (minimax algorithm), 50 gems per win, 5 plays/day
- **Car Racing**: Reach 400km for 50 gems, 5 plays/day

### 4. Services (الخدمات)
- **Followers**: 100-400 followers (300-700 gems)
- **Views**: 1000-2000 views (400-600 gems)
- **Likes**: 100 likes (400 gems)
- **Shares**: 250 shares (200 gems)

### 5. Settings (الإعدادات)
- Dark mode toggle
- Help with AI assistant
- Logout functionality

## API Keys Used
- Google Client ID: `427985088897-s691uf82crrffmuk3i2pveh0kg2m9jht.apps.googleusercontent.com`
- OpenAI API Key: For AI help assistant
- RapidAPI Key: For Instagram profile/video lookup
- EmailJS: For service request notifications

## EmailJS Configuration
- Service ID: `service_rkaw7te`
- Template ID: `template_dauarzf`
- Public Key: `L9gViSwmmvXSDKAK-`

## Developer Contact
Instagram: https://www.instagram.com/kryz.ento

## Technical Stack
- Frontend: Expo React Native with TypeScript
- Backend: FastAPI with Python
- Database: MongoDB
- State Management: Zustand
- Styling: React Native StyleSheet with LinearGradient

## File Structure
```
frontend/
├── app/
│   ├── index.tsx          # Login screen
│   ├── home.tsx           # Main dashboard
│   ├── tasks.tsx          # Daily tasks
│   ├── games.tsx          # Games menu
│   ├── games/
│   │   ├── tictactoe.tsx  # X O game
│   │   └── carrace.tsx    # Car racing game
│   ├── services.tsx       # Services menu
│   ├── services/
│   │   ├── followers.tsx  # Followers service
│   │   ├── views.tsx      # Views service
│   │   ├── likes.tsx      # Likes service
│   │   └── shares.tsx     # Shares service
│   └── settings/
│       ├── main.tsx       # Settings screen
│       └── help.tsx       # AI help screen
└── src/
    ├── stores/
    │   └── userStore.ts   # Zustand store
    └── services/
        └── api.ts         # API service
```
