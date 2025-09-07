const { app, BrowserWindow, Menu, ipcMain, desktopCapturer, screen, autoUpdater } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Simple logger for now
const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
};

let mainWindow;

function createWindow() {
  logger.info('Creating main window');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
    logger.info('Loaded development server URL');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    logger.info('Loaded production build');
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logger.info('Main window shown');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    logger.info('Main window closed');
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  logger.info('Creating application menu');
  
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Start/Stop Tracking',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('toggle-tracking');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('open-settings');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  logger.info('Application menu created');
}

// IPC handlers for screenshot functionality
ipcMain.handle('capture-screenshot', async () => {
  try {
    logger.info('Screenshot capture requested');
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length > 0) {
      const source = sources[0];
      const result = {
        success: true,
        dataURL: source.thumbnail.toDataURL(),
        timestamp: new Date().toISOString()
      };
      logger.info('Screenshot captured successfully');
      return result;
    } else {
      const error = { success: false, error: 'No screen sources available' };
      logger.warn('No screen sources available');
      return error;
    }
  } catch (error) {
    const result = { success: false, error: error.message };
    logger.error('Screenshot capture failed:', error.message);
    return result;
  }
});

ipcMain.handle('get-screen-info', async () => {
  try {
    logger.info('Screen info requested');
    const displays = screen.getAllDisplays();
    const result = {
      success: true,
      displays: displays.map(display => ({
        id: display.id,
        bounds: display.bounds,
        scaleFactor: display.scaleFactor,
        isPrimary: display === screen.getPrimaryDisplay()
      }))
    };
    logger.info('Screen info retrieved successfully');
    return result;
  } catch (error) {
    const result = { success: false, error: error.message };
    logger.error('Failed to get screen info:', error.message);
    return result;
  }
});

// Update-related IPC handlers
ipcMain.handle('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.handle('install-update', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall();
  }
});

// Authentication IPC handlers
ipcMain.handle('open-auth-url', async () => {
  const { shell } = require('electron');
  const authUrl = 'https://jirabridge.alchemytech.in/?from=electron';
  logger.info('Opening auth URL:', authUrl);
  await shell.openExternal(authUrl);
});


// Auto-updater configuration
function setupAutoUpdater() {
  if (isDev) {
    logger.info('Auto-updater disabled in development mode');
    return;
  }

  // Configure auto-updater for GitHub releases
  const server = 'https://api.github.com/repos/MananAlchemy/JiraBridge/releases/latest';
  const url = `https://github.com/MananAlchemy/JiraBridge/releases/download/v${app.getVersion()}`;
  
  autoUpdater.setFeedURL({ url });
  
  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    logger.info('Update available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    logger.error('Auto-updater error:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    logger.info(log_message);
    
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  // Check for updates on startup
  autoUpdater.checkForUpdates();
}

// Register deeplink protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('jira-bridge', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('jira-bridge');
}

// Function to decode JWT token
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('Error decoding JWT:', error);
    return null;
  }
}

// Handle deeplink protocol
app.on('open-url', (event, url) => {
  event.preventDefault();
  logger.info('Received deeplink:', url);
  
  // Parse the URL to extract authentication data
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Get the JWT token
    const token = params.get('token');
    
    let userData = {
      id: params.get('id'),
      email: params.get('email'),
      name: params.get('name'),
      avatar: params.get('avatar'),
      token: token
    };
    
    // If we have a JWT token, decode it to get user information
    if (token) {
      const decodedToken = decodeJWT(token);
      if (decodedToken) {
        userData = {
          id: decodedToken.sub || userData.id,
          email: decodedToken.email || userData.email,
          name: decodedToken.name || userData.name,
          avatar: decodedToken.picture || userData.avatar,
          token: token
        };
      }
    }
    
    logger.info('Parsed user data:', userData);
    
    // Send user data to renderer process
    if (mainWindow) {
      mainWindow.webContents.send('auth-success', userData);
      mainWindow.show();
      mainWindow.focus();
    }
  } catch (error) {
    logger.error('Error parsing deeplink URL:', error);
  }
});

// Handle deeplink on Windows
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  
  // Handle deeplink from command line arguments
  const url = commandLine.find(arg => arg.startsWith('jira-bridge://'));
  if (url) {
    logger.info('Received deeplink from second instance:', url);
    // Process the URL similar to open-url event
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Get the JWT token
      const token = params.get('token');
      
      let userData = {
        id: params.get('id'),
        email: params.get('email'),
        name: params.get('name'),
        avatar: params.get('avatar'),
        token: token
      };
      
      // If we have a JWT token, decode it to get user information
      if (token) {
        const decodedToken = decodeJWT(token);
        if (decodedToken) {
          userData = {
            id: decodedToken.sub || userData.id,
            email: decodedToken.email || userData.email,
            name: decodedToken.name || userData.name,
            avatar: decodedToken.picture || userData.avatar,
            token: token
          };
        }
      }
      
      if (mainWindow) {
        mainWindow.webContents.send('auth-success', userData);
      }
    } catch (error) {
      logger.error('Error parsing deeplink from second instance:', error);
    }
  }
});

// App event handlers
app.whenReady().then(() => {
  logger.info('App ready, initializing...');
  createWindow();
  createMenu();
  setupAutoUpdater();
  logger.info('Electron application initialized successfully');
});

// macOS specific: re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  // macOS specific: keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    logger.info('All windows closed, quitting application');
    app.quit();
  }
});

// Handle certificate error (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
