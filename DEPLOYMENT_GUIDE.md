# 🚀 ScreenCapture Pro - Deployment & Distribution Guide

## 📋 Table of Contents
1. [Automatic Updates Setup](#automatic-updates-setup)
2. [Distribution Methods](#distribution-methods)
3. [Build & Release Process](#build--release-process)
4. [Update Server Setup](#update-server-setup)
5. [Distribution Platforms](#distribution-platforms)

---

## 🔄 Automatic Updates Setup

### **1. Update Server Options**

#### **Option A: GitHub Releases (Recommended for Free)**
```bash
# Update your package.json publish config
"publish": {
  "provider": "github",
  "owner": "your-github-username",
  "repo": "screencapture-pro"
}
```

#### **Option B: Custom Server**
```bash
# Update the server URL in main.js
const server = 'https://your-domain.com';
```

#### **Option C: Electron Forge (Alternative)**
```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
```

### **2. Code Signing (Required for Auto-Updates)**

#### **macOS Code Signing**
```bash
# Get Apple Developer Certificate
# Add to package.json:
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

#### **Windows Code Signing**
```bash
# Get code signing certificate
# Add to package.json:
"win": {
  "certificateFile": "path/to/certificate.p12",
  "certificatePassword": "password"
}
```

---

## 📦 Distribution Methods

### **1. Direct Distribution**

#### **Build for All Platforms**
```bash
# Build for current platform
npm run electron:dist

# Build for specific platforms (requires setup)
npm run build:mac    # macOS
npm run build:win    # Windows  
npm run build:linux  # Linux
```

#### **Add Build Scripts to package.json**
```json
{
  "scripts": {
    "build:mac": "npm run build && electron-builder --mac",
    "build:win": "npm run build && electron-builder --win",
    "build:linux": "npm run build && electron-builder --linux",
    "build:all": "npm run build && electron-builder --mac --win --linux"
  }
}
```

### **2. GitHub Releases (Free)**

#### **Setup GitHub Actions**
Create `.github/workflows/build.yml`:
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build app
      run: npm run build
      
    - name: Build Electron app
      run: npm run electron:dist
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.os }}-build
        path: dist-electron/
```

### **3. Distribution Platforms**

#### **A. GitHub Releases (Free)**
- ✅ Free hosting
- ✅ Automatic updates
- ✅ Version management
- ✅ Download statistics

#### **B. Microsoft Store (Windows)**
- ✅ Built-in updates
- ✅ Security scanning
- ❌ Requires Microsoft account
- ❌ Review process

#### **C. Mac App Store (macOS)**
- ✅ Built-in updates
- ✅ Security scanning
- ❌ Requires Apple Developer account ($99/year)
- ❌ Strict review process

#### **D. Snap Store (Linux)**
- ✅ Built-in updates
- ✅ Easy installation
- ❌ Limited to Ubuntu/Debian

#### **E. Your Own Website**
- ✅ Full control
- ✅ Custom branding
- ❌ Need hosting
- ❌ Manual update management

---

## 🏗️ Build & Release Process

### **1. Development Workflow**

```bash
# 1. Make changes
git add .
git commit -m "Add new feature"

# 2. Update version
npm version patch  # or minor, major

# 3. Build and test
npm run build
npm run electron

# 4. Create release
git push origin main --tags
```

### **2. Release Checklist**

- [ ] Update version in `package.json`
- [ ] Update changelog
- [ ] Test on all platforms
- [ ] Build release packages
- [ ] Upload to distribution platform
- [ ] Announce release

### **3. Version Management**

```bash
# Semantic versioning
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

---

## 🌐 Update Server Setup

### **1. GitHub Releases (Easiest)**

#### **Setup Steps:**
1. Create GitHub repository
2. Update `package.json` publish config
3. Set up GitHub Actions (optional)
4. Create releases manually or via CI/CD

#### **Manual Release Process:**
```bash
# 1. Build the app
npm run electron:dist

# 2. Create GitHub release
# Go to GitHub → Releases → Create new release
# Upload the built files from dist-electron/

# 3. Auto-updater will work automatically
```

### **2. Custom Update Server**

#### **Simple Node.js Server:**
```javascript
// update-server.js
const express = require('express');
const app = express();

app.get('/update/:platform/:version', (req, res) => {
  const { platform, version } = req.params;
  
  // Check if update is available
  const latestVersion = '1.0.1';
  const needsUpdate = version !== latestVersion;
  
  if (needsUpdate) {
    res.json({
      url: `https://your-server.com/releases/${platform}/latest`,
      version: latestVersion,
      notes: 'Bug fixes and improvements'
    });
  } else {
    res.status(204).send();
  }
});

app.listen(3000);
```

---

## 📱 Distribution Platforms

### **1. GitHub Releases (Recommended)**

#### **Pros:**
- ✅ Free
- ✅ Automatic updates work
- ✅ Version management
- ✅ Download statistics
- ✅ Easy to set up

#### **Cons:**
- ❌ No app store benefits
- ❌ Users need to download manually

### **2. Microsoft Store**

#### **Setup:**
1. Create Microsoft Partner Center account
2. Submit app for review
3. Handle updates through store

#### **Pros:**
- ✅ Built-in updates
- ✅ Security scanning
- ✅ Easy installation

#### **Cons:**
- ❌ Review process
- ❌ Store policies
- ❌ Revenue sharing

### **3. Mac App Store**

#### **Setup:**
1. Apple Developer account ($99/year)
2. Code signing certificates
3. App Store review process

#### **Pros:**
- ✅ Built-in updates
- ✅ Security scanning
- ✅ Easy installation

#### **Cons:**
- ❌ Annual fee
- ❌ Strict review process
- ❌ Revenue sharing

---

## 🚀 Quick Start Guide

### **1. Immediate Setup (GitHub Releases)**

```bash
# 1. Update package.json
# Change "your-github-username" to your actual GitHub username

# 2. Build your app
npm run electron:dist

# 3. Create GitHub release
# - Go to your GitHub repo
# - Click "Releases" → "Create a new release"
# - Upload files from dist-electron/ folder
# - Publish release

# 4. Auto-updates will work automatically!
```

### **2. Advanced Setup (Custom Server)**

```bash
# 1. Set up update server
# 2. Update server URL in main.js
# 3. Deploy server
# 4. Build and distribute app
```

### **3. App Store Distribution**

```bash
# 1. Get developer accounts
# 2. Set up code signing
# 3. Follow platform guidelines
# 4. Submit for review
```

---

## 📊 Monitoring & Analytics

### **1. Update Statistics**
- Track download counts
- Monitor update success rates
- Analyze user adoption

### **2. Error Tracking**
- Implement crash reporting
- Monitor update failures
- Track user feedback

### **3. Usage Analytics**
- Screen capture frequency
- Feature usage
- Performance metrics

---

## 🔧 Troubleshooting

### **Common Issues:**

1. **Auto-updater not working**
   - Check code signing
   - Verify server URL
   - Check network connectivity

2. **Build failures**
   - Update dependencies
   - Check platform requirements
   - Verify build configuration

3. **Distribution issues**
   - Check file permissions
   - Verify upload process
   - Test download links

---

## 📞 Support

For questions about deployment:
- Check Electron documentation
- Review platform-specific guides
- Test thoroughly before release

Remember: Always test your updates on multiple platforms before releasing!
