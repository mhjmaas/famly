# Famly: Family Management & Organization App

Famly is a comprehensive family organization app designed to streamline task management, allowance tracking, shared calendar events, and more - all in one place. This README outlines the core features for our minimum viable product (MVP) as well as extended ideas for future development.

## Getting started with development

### Start database

```bash
docker run --name mongodb-famly -d -p 27017:27017 mongo
```

### Start minio

```bash
docker run --name minio-famly -d -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=famly-dev-access" -e "MINIO_ROOT_PASSWORD=famly-dev-secret-min-32-chars" minio/minio server /data --console-address ":9001"
```

### Start API

```bash
pnpm run dev:api
```

### Start Web

```bash
pnpm run dev:web
```

## 🧩 Core Features (MVP)

### 👥 Family Management

- Create and manage family profiles (parents, kids, grandparents)
- Role-based permissions (parental control, view-only, assigner, etc.)
- Shared avatars or character icons

### ✅ Task & Chore Management

- Assign tasks or chores to family members
- Schedule repeating tasks with custom frequencies
- Track progress and completion status
- Notifications and reminders for upcoming tasks
- Approve completed chores through parent verification
- Reward points or allowances tied to task completion

### 💰 Allowance & Rewards

- Connect tasks to allowance (virtual or real currency)
- Gamified leaderboard showing family member rankings
- Progress bars and badges ("Helper of the Week")
- Parent payment option for reward payouts

### 📅 Shared Calendar

- Family-wide shared calendar with event synchronization
- Events, birthdays, appointments, and reminders
- Integration with Google/Apple calendars
- "Who's driving today?" rotation tracker

### 🏡 House Management

- Shared shopping list/grocery list with item tracking
- Household inventory management (pantry, supplies)
- Maintenance reminders (filters, garbage days, etc.)
- Centralized home documents storage (manuals, receipts, warranties)

### 📍 Location & Safety

- Real-time location sharing (opt-in feature)
- "Check-in" feature ("I'm at school", "Arrived home")
- Safe zones with customizable notifications
- Emergency contacts list

## 💡 Extended / Future Ideas

### 📸 Family Moments / Memories

- Upload images and short videos to private family feed
- Tag family members in memories
- Memory timeline view by year/month
- "Today in family history" reminders

### 📔 Shared Diary or Journal

- Family diary for capturing daily moments
- Shared journaling prompts ("What made you smile today?")
- Optional AI-generated weekly summaries

### 💬 Family Chat

- In-app messaging for family communication
- Group chats and private conversations
- Push notifications for new messages
- Media sharing (photos, videos)

### 🎮 Gamification Layer

- Level up avatars based on chores completed
- Streaks and family achievements
- Unlockable cosmetic rewards or themes
- "Family challenges" (e.g., Walk 10,000 steps each!)

### 🧠 AI & Smart Assistant Features

- Smart scheduling with auto-suggested chore times
- AI summary of weekly events
- Family mood tracker based on diary entries
- AI-driven chore suggestions

### 🛒 Integrations

- Voice assistant integration (Alexa/Google Home)
- IoT integrations (smart fridge, etc.)
- Apple Family Sharing / Screen Time sync
- Messaging app reminders (WhatsApp, Telegram)

## 🚀 Getting Started

[Coming soon - development in progress]

## 📸 Screenshots

[Coming soon - screenshots of the app interface]

## 🛠️ Development

### Prerequisites

- Node.js v16+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
git clone https://github.com/yourusername/famly.git
cd famly
npm install
```

### Running the App

For iOS:

```
npx react-native run-ios
```

For Android:

```
npx react-native run-android
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
