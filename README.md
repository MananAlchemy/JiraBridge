# JiraBridge

A professional desktop screenshot management application built with React, TypeScript, and Electron.

## 🚀 Features

- **Real Screenshot Capture**: Uses Electron's desktop capturer for actual screen capture
- **Google Authentication**: Secure user authentication with Google OAuth
- **Cloud Sync**: Automatic synchronization of screenshots (simulated)
- **Auto Updates**: Built-in update mechanism
- **Settings Management**: Configurable screenshot intervals, quality, and preferences
- **Modern UI**: Beautiful interface built with Tailwind CSS
- **Cross-Platform**: Supports macOS, Windows, and Linux
- **Jira Integration**: Time tracking and work logging with Tempo Timesheets

## ⚙️ Environment Setup

Before running the application, you need to set up environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Jira configuration:
   ```bash
   # Required: Your Jira admin token for Tempo API access
   REACT_APP_JIRA_ADMIN_TOKEN=your_actual_token_here
   
   # Optional: Jira URL (defaults to https://jira.alchemytech.in)
   REACT_APP_JIRA_URL=https://your-jira-instance.com
   
   # Optional: Debug mode
   REACT_APP_DEBUG_JIRA=false
   ```

**Important**: Never commit your `.env` file to version control. It contains sensitive information.

## 🏗️ Architecture

### Project Structure

```
├── electron/                    # Electron main process
│   ├── modules/                # Modular Electron components
│   │   ├── screenshot-manager.ts
│   │   ├── window-manager.ts
│   │   ├── menu-manager.ts
│   │   └── ipc-handler.ts
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts
│   │   └── file-manager.ts
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts
│   ├── config/                 # Configuration
│   │   └── app.config.ts
│   ├── main.js                 # Main Electron process
│   └── preload.js              # Preload script
├── src/                        # React application
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Business logic services
│   ├── utils/                  # Utility functions
│   ├── constants/              # Application constants
│   ├── types/                  # TypeScript definitions
│   └── contexts/               # React contexts
└── dist/                       # Built application
```

### Key Design Principles

1. **Modular Architecture**: Code is organized into focused, reusable modules
2. **Type Safety**: Comprehensive TypeScript definitions throughout
3. **Error Handling**: Robust error handling with logging
4. **Separation of Concerns**: Clear separation between UI, business logic, and data
5. **Scalability**: Architecture designed to scale with additional features

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd screencapture-pro

# Install dependencies
npm install
```

### Development Commands

```bash
# Start development server (web version)
npm run dev

# Start Electron app in development mode
npm run electron:dev

# Build for production
npm run build

# Run Electron app (production build)
npm run electron

# Build distribution packages
npm run electron:dist

# Lint code
npm run lint
```

### Development Workflow

1. **Web Development**: Use `npm run dev` for rapid web development
2. **Desktop Testing**: Use `npm run electron:dev` for desktop app testing
3. **Production Build**: Use `npm run build` followed by `npm run electron`

## 📁 Code Organization

### Electron Main Process

- **`main.js`**: Application entry point and lifecycle management
- **`modules/`**: Modular components for different responsibilities
  - `screenshot-manager.ts`: Handles screenshot capture logic
  - `window-manager.ts`: Manages application windows
  - `menu-manager.ts`: Creates and manages application menus
  - `ipc-handler.ts`: Handles inter-process communication
- **`utils/`**: Utility functions for logging and file management
- **`config/`**: Application configuration and constants

### React Application

- **`components/`**: Reusable UI components
- **`hooks/`**: Custom React hooks for state management
- **`services/`**: Business logic and external API interactions
- **`utils/`**: Utility functions for formatting, storage, etc.
- **`constants/`**: Application-wide constants and enums
- **`types/`**: TypeScript type definitions

### Key Services

- **`electron.service.ts`**: Handles Electron API interactions
- **`storage.ts`**: Manages local storage operations
- **`logger.ts`**: Centralized logging functionality

## 🔧 Configuration

### Application Settings

The app supports various configuration options:

- Screenshot interval (minutes)
- Screenshot quality (low, medium, high)
- Auto-sync settings
- Theme preferences
- Notification settings

### Environment Variables

- `NODE_ENV`: Set to 'development' for dev mode
- Custom environment variables can be added as needed

## 🚀 Building and Distribution

### Development Build

```bash
npm run build
npm run electron
```

### Distribution Packages

```bash
npm run electron:dist
```

This creates platform-specific installers:
- **macOS**: DMG file
- **Windows**: NSIS installer
- **Linux**: AppImage

## 🧪 Testing

### Manual Testing

1. **Screenshot Capture**: Test real screenshot functionality
2. **Settings**: Verify settings persistence
3. **Sync**: Test sync simulation
4. **Keyboard Shortcuts**: Test menu shortcuts
5. **Error Handling**: Test error scenarios

### Automated Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📝 Best Practices

### Code Quality

1. **TypeScript**: Use strict typing throughout
2. **Error Handling**: Always handle errors gracefully
3. **Logging**: Use structured logging for debugging
4. **Performance**: Optimize for large screenshot collections
5. **Security**: Validate all user inputs

### Development

1. **Modular Design**: Keep components focused and reusable
2. **Documentation**: Document complex logic and APIs
3. **Testing**: Write tests for critical functionality
4. **Performance**: Monitor and optimize performance
5. **Accessibility**: Ensure UI is accessible

## 🔮 Future Enhancements

- [ ] Real cloud storage integration
- [ ] Advanced screenshot editing
- [ ] Batch operations
- [ ] Search and filtering
- [ ] Export options
- [ ] Plugin system
- [ ] Advanced analytics
- [ ] Team collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

Built with ❤️ using React, TypeScript, and Electron
