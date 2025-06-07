# Ngomong App

A secure end-to-end encrypted messaging application built with Ionic, Angular, and SQLite.

## 📱 Overview

Ngomong App is a privacy-focused messaging application that implements the Double Ratchet encryption algorithm (similar to Signal Protocol) to provide secure, end-to-end encrypted communication. The app is built for both mobile (iOS/Android) and web platforms using Ionic and Angular.

## 🔐 Security Features

- **End-to-End Encryption**: All messages are encrypted using the Double Ratchet algorithm
- **Forward Secrecy**: Past messages remain secure even if keys are compromised
- **Break-in Recovery**: Security is restored even after a compromise
- **Local Database**: All data is stored locally on your device
- **No Message Backups**: Messages never leave your device

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Ionic 8 + Angular 19
- **UI Components**: Ionic Components
- **Database**:
  - **Mobile**: SQLite (via `@capacitor-community/sqlite`)
  - **Web**: Dexie.js (IndexedDB wrapper)
- **Build System**: Angular CLI
- **Package Manager**: npm
- **Capacitor**: For native platform integration

### App Structure

```
ngomong-app/
├── migrations/          # SQLite migration files
├── queries/             # SQL query files for services
├── sqlite-migration-tools/  # Custom tools for DB generation
├── src/
│   ├── app/
│   │   ├── auth/        # Authentication components
│   │   ├── core/        # Core services and utilities
│   │   │   ├── api/        # API services
│   │   │   ├── auth/       # Authentication services
│   │   │   ├── database/   # Database models and services
│   │   │   └── util/       # Utility services (encryption, etc.)
│   │   ├── home/        # Home page components
│   │   └── ...
│   ├── assets/          # Static assets
│   ├── environments/    # Environment configurations
│   └── ...
└── ...
```

## ✨ Features

- **User Authentication**: Register and login with email verification
- **Contact Management**: Add and manage contacts
- **Secure Messaging**: Send and receive encrypted messages
- **Message History**: View conversation history stored locally
- **Responsive Design**: Works on mobile and desktop
- **Dark Mode Support**: System-based dark mode

## 📦 Database Structure

The application uses a SQLite database with the following main tables:

1. **users**: User account information
2. **contacts**: User's contacts
3. **sessions**: Encryption session data
4. **conversations**: Message thread data
5. **messages**: Individual messages
6. **devices**: Multi-device support data

## 🔒 Encryption Implementation

The encryption is implemented using the Double Ratchet algorithm:

1. **Identity Keys**: Long-term keys that identify each user
2. **Ratchet Keys**: Ephemeral key pairs that evolve during conversations
3. **Message Keys**: One-time keys derived from the ratchet process

See `src/app/core/util/service/double-ratchet.md` for detailed documentation.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v7+)
- Ionic CLI (`npm install -g @ionic/cli`)
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ngomong-app.git
   cd ngomong-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate database files:
   ```bash
   npm run generate-db
   ```

### Running the App

#### Web Development Server

```bash
npm start
```

#### iOS

```bash
ionic capacitor add ios
ionic capacitor build ios
```

#### Android

```bash
ionic capacitor add android
ionic capacitor build android
```

## 🛠️ Development Tools

### Database Migrations

The project includes custom SQLite migration tools to manage database schema changes:

```bash
# Generate all database files
npm run generate-db

# Generate specific components
npm run generate-migrations
npm run generate-models
npm run generate-dexie
npm run generate-services
```

## 📝 Configuration

### Environment Configuration

Edit the environment files in `src/environments/` to configure:

- API URL
- Production flags
- Other environment-specific settings

### Database Configuration

Database settings can be modified in `src/app/core/database/database.config.ts`.

## 📱 Building for Production

### Web

```bash
npm run build --prod
```

### iOS/Android

```bash
ionic capacitor copy ios --prod
ionic capacitor copy android --prod
```

## 🧪 Running Tests

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Credits

Built with ❤️ by Ngomong Team
