// install-deps.js - A script to install required dependencies
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if running from the project root
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('This script must be run from the project root directory.');
  process.exit(1);
}

// Install dependencies
console.log('Installing required dependencies...');
try {
  console.log('Installing marked for Markdown parsing...');
  execSync('npm install marked --save', { stdio: 'inherit' });
  
  console.log('Installing dompurify for HTML sanitization...');
  execSync('npm install dompurify --save', { stdio: 'inherit' });
  
  console.log('Installing jsdom (required by dompurify)...');
  execSync('npm install jsdom --save', { stdio: 'inherit' });
  
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  console.log('\nPlease install them manually:');
  console.log('npm install marked dompurify jsdom --save');
  process.exit(1);
}

// Check for existing files and create backup if needed
const filesToCheck = [
  'src/message-formatter.js',
  'src/markdown-styles.css'
];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    console.log(`Creating backup of existing ${file} to ${backupPath}`);
    fs.copyFileSync(filePath, backupPath);
  }
});

console.log('\nSetup complete! You can now run the application with rich text support.');
console.log('To start the application, run: npm start');
