#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting JiraBridge release process...\n');

// Check if we're in a git repository
try {
  execSync('git status', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Not in a git repository. Please run "git init" first.');
  process.exit(1);
}

// Get current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version: ${currentVersion}`);

// Check for production environment file
const envProdPath = path.join(__dirname, '.env.production');
const envProdTemplatePath = path.join(__dirname, 'env.production');

if (!fs.existsSync(envProdPath) && fs.existsSync(envProdTemplatePath)) {
  console.log('📋 Creating production environment file...');
  fs.copyFileSync(envProdTemplatePath, envProdPath);
  console.log('✅ Production environment file created from template');
}

// Build the application for production
console.log('\n🔨 Building application for production...');
try {
  execSync('npm run build:prod', { stdio: 'inherit' });
  console.log('✅ Production build completed successfully');
} catch (error) {
  console.error('❌ Production build failed:', error.message);
  process.exit(1);
}

// Build Electron app for production
console.log('\n⚡ Building Electron app for production...');
try {
  execSync('npm run electron:dist:prod', { stdio: 'inherit' });
  console.log('✅ Electron production build completed successfully');
} catch (error) {
  console.error('❌ Electron production build failed:', error.message);
  process.exit(1);
}

// Check if dist-electron directory exists
const distDir = path.join(__dirname, 'dist-electron');
if (!fs.existsSync(distDir)) {
  console.error('❌ dist-electron directory not found');
  process.exit(1);
}

// List built files
console.log('\n📁 Built files:');
const files = fs.readdirSync(distDir);
files.forEach(file => {
  const filePath = path.join(distDir, file);
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   - ${file} (${size} MB)`);
  }
});

console.log('\n🎉 Release build completed!');
console.log('\n📋 Next steps:');
console.log('1. Go to https://github.com/MananAlchemy/JiraBridge/releases');
console.log('2. Click "Create a new release"');
console.log(`3. Tag version: v${currentVersion}`);
console.log('4. Release title: JiraBridge v' + currentVersion);
console.log('5. Upload all files from dist-electron/ folder');
console.log('6. Publish the release');
console.log('\n💡 Users will automatically receive updates when you publish new releases!');

// Optional: Create a release notes template
const releaseNotes = `# JiraBridge v${currentVersion}

## What's New
- Initial release of JiraBridge
- Screenshot capture functionality
- Google authentication
- Auto-updates enabled

## Installation
Download the appropriate file for your operating system:
- **Windows**: JiraBridge-Setup-${currentVersion}.exe
- **macOS**: JiraBridge-${currentVersion}.dmg
- **Linux**: JiraBridge-${currentVersion}.AppImage

## Features
- Real-time screenshot capture
- Cloud sync (simulated)
- Automatic updates
- Cross-platform support

## Support
For issues and feature requests, please visit: https://github.com/MananAlchemy/JiraBridge/issues
`;

fs.writeFileSync('RELEASE_NOTES.md', releaseNotes);
console.log('\n📝 Release notes template created: RELEASE_NOTES.md');
console.log('   Copy the content to your GitHub release description.');
