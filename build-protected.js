const { CodeProtection } = require('./src/gui/utils/codeProtection');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProtectedBuild {
  constructor() {
    this.protector = new CodeProtection();
    this.buildDir = './dist-protected';
    this.sourceDir = './src';
  }

  async build() {
    console.log('🚀 Starting protected build process...');
    
    try {
      // Step 1: Clean build directory
      await this.cleanBuildDir();
      
      // Step 2: Copy and protect source files
      await this.protectSourceFiles();
      
      // Step 3: Create protected package.json
      await this.createProtectedPackageJson();
      
      // Step 4: Install dependencies
      await this.installDependencies();
      
      // Step 5: Build React frontend
      await this.buildFrontend();
      
      // Step 6: Package with Electron Builder
      await this.packageApplication();
      
      // Step 7: Create license generator
      await this.createLicenseGenerator();
      
      console.log('✅ Protected build completed successfully!');
      console.log('📦 Find your executable in: ./dist/');
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async cleanBuildDir() {
    console.log('🧹 Cleaning build directory...');
    
    try {
      await fs.rm(this.buildDir, { recursive: true, force: true });
      await fs.rm('./dist', { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    await fs.mkdir(this.buildDir, { recursive: true });
  }

  async protectSourceFiles() {
    console.log('🔒 Protecting source files...');
    
    // List of files to protect
    const filesToProtect = [
      'src/services/jitoClient.js',
      'src/services/sniperDetector.js',
      'src/services/launchProtector.js',
      'src/services/multiTenantManager.js',
      'src/utils/logger.js',
      'src/config/index.js',
      'src/gui/services/licenseManager.js',
      'src/gui/services/protectionService.js'
    ];

    // Copy and protect core files
    for (const file of filesToProtect) {
      const inputPath = path.resolve(file);
      const outputPath = path.resolve(this.buildDir, file.replace('.js', '.protected.js'));
      const outputDir = path.dirname(outputPath);
      
      await fs.mkdir(outputDir, { recursive: true });
      
      if (await this.fileExists(inputPath)) {
        await this.protector.protectFile(inputPath, outputPath);
        console.log(`  ✓ Protected: ${file}`);
      } else {
        console.warn(`  ⚠ Skipped (not found): ${file}`);
      }
    }

    // Copy other files without protection
    const filesToCopy = [
      'src/gui/main.js',
      'src/gui/preload.js',
      'src/gui/utils/codeProtection.js',
      'src/api/server.js',
      'src/index.js',
      'src/saas.js'
    ];

    for (const file of filesToCopy) {
      const inputPath = path.resolve(file);
      const outputPath = path.resolve(this.buildDir, file);
      const outputDir = path.dirname(outputPath);
      
      await fs.mkdir(outputDir, { recursive: true });
      
      if (await this.fileExists(inputPath)) {
        await fs.copyFile(inputPath, outputPath);
        console.log(`  ✓ Copied: ${file}`);
      }
    }

    // Copy frontend
    await this.copyDirectory('src/gui/frontend', path.join(this.buildDir, 'src/gui/frontend'));
    
    // Copy assets
    await this.copyDirectory('assets', path.join(this.buildDir, 'assets'));
  }

  async createProtectedPackageJson() {
    console.log('📄 Creating protected package.json...');
    
    const originalPackage = JSON.parse(await fs.readFile('./package.json', 'utf8'));
    
    const protectedPackage = {
      ...originalPackage,
      name: "solana-launch-protector",
      productName: "Solana Launch Protector",
      description: "Advanced anti-sniper protection for Solana token launches",
      version: "1.0.0",
      main: "./src/gui/main.js",
      homepage: "https://yourwebsite.com",
      author: {
        name: "Your Company",
        email: "support@yourwebsite.com"
      },
      build: {
        appId: "com.yourcompany.solana-protector",
        productName: "Solana Launch Protector",
        directories: {
          output: "../dist"
        },
        files: [
          "src/**/*",
          "assets/**/*",
          "node_modules/**/*"
        ],
        mac: {
          category: "public.app-category.finance",
          icon: "assets/icon.icns",
          hardenedRuntime: true,
          gatekeeperAssess: false,
          notarize: false
        },
        win: {
          target: [
            {
              target: "nsis",
              arch: ["x64", "ia32"]
            }
          ],
          icon: "assets/icon.ico",
          publisherName: "Your Company"
        },
        linux: {
          target: [
            {
              target: "AppImage",
              arch: ["x64"]
            }
          ],
          icon: "assets/icon.png",
          category: "Office"
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: "Solana Launch Protector"
        }
      },
      scripts: {
        start: "electron .",
        dev: "NODE_ENV=development electron .",
        build: "electron-builder",
        dist: "electron-builder --publish=never"
      }
    };

    await fs.writeFile(
      path.join(this.buildDir, 'package.json'), 
      JSON.stringify(protectedPackage, null, 2)
    );
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    process.chdir(this.buildDir);
    
    try {
      execSync('npm install --production', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      throw error;
    }
    
    process.chdir('..');
  }

  async buildFrontend() {
    console.log('⚛️ Building React frontend...');
    
    const frontendDir = path.join(this.buildDir, 'src/gui/frontend');
    process.chdir(frontendDir);
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build frontend:', error);
      throw error;
    }
    
    process.chdir('../../../../');
  }

  async packageApplication() {
    console.log('📱 Packaging application...');
    
    process.chdir(this.buildDir);
    
    try {
      // Install electron-builder if not present
      execSync('npm install --save-dev electron-builder', { stdio: 'inherit' });
      
      // Build for current platform
      execSync('npm run dist', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to package application:', error);
      throw error;
    }
    
    process.chdir('..');
  }

  async createLicenseGenerator() {
    console.log('🔑 Creating license generator...');
    
    const licenseGeneratorCode = `
const crypto = require('crypto');
const readline = require('readline');

class LicenseGenerator {
  constructor() {
    this.signingKey = process.env.LICENSE_SIGNING_KEY || 'your-secret-signing-key-2024';
  }

  generateLicense(email, plan, durationDays = 30) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);
    
    const features = this.getPlanFeatures(plan);
    
    const data = {
      email: email,
      plan: plan,
      expires: expirationDate.toISOString(),
      issued: new Date().toISOString(),
      version: '1.0',
      features: features
    };

    const licenseData = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', this.signingKey)
      .update(licenseData)
      .digest('hex');

    const license = {
      data: Buffer.from(licenseData).toString('base64'),
      signature: signature
    };

    return Buffer.from(JSON.stringify(license)).toString('base64');
  }

  getPlanFeatures(plan) {
    const features = {
      trial: {
        maxLaunches: 3,
        maxBuyAmount: 1.0,
        advancedProtection: false,
        customWhitelists: false,
        prioritySupport: false,
        duration: 7
      },
      starter: {
        maxLaunches: 25,
        maxBuyAmount: 5.0,
        advancedProtection: true,
        customWhitelists: true,
        prioritySupport: false,
        duration: 30
      },
      professional: {
        maxLaunches: 100,
        maxBuyAmount: 20.0,
        advancedProtection: true,
        customWhitelists: true,
        prioritySupport: true,
        duration: 30
      },
      enterprise: {
        maxLaunches: -1,
        maxBuyAmount: -1,
        advancedProtection: true,
        customWhitelists: true,
        prioritySupport: true,
        duration: 365
      }
    };

    return features[plan] || features.trial;
  }

  async interactive() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log('\\n🔑 License Generator for Solana Launch Protector\\n');

    try {
      const email = await question('Enter customer email: ');
      const plan = await question('Enter plan (trial/starter/professional/enterprise): ');
      const duration = await question('Enter duration in days (default 30): ') || '30';

      const licenseKey = this.generateLicense(email, plan, parseInt(duration));

      console.log('\\n✅ License generated successfully!\\n');
      console.log('License Key:');
      console.log('-'.repeat(80));
      console.log(licenseKey);
      console.log('-'.repeat(80));
      console.log('\\nSend this license key to the customer.');
      console.log('\\n📧 Email Template:');
      console.log(\`
Subject: Your Solana Launch Protector License

Dear Customer,

Thank you for purchasing Solana Launch Protector!

Your license details:
- Email: \${email}
- Plan: \${plan}
- Duration: \${duration} days

License Key:
\${licenseKey}

To activate:
1. Open Solana Launch Protector
2. Go to License menu > Enter License Key
3. Paste the license key above
4. Click Activate

Support: support@yourwebsite.com
Documentation: https://docs.yourwebsite.com

Best regards,
Solana Launch Protector Team
      \`);

    } catch (error) {
      console.error('Error generating license:', error);
    } finally {
      rl.close();
    }
  }
}

// Run interactive mode if called directly
if (require.main === module) {
  const generator = new LicenseGenerator();
  generator.interactive();
}

module.exports = LicenseGenerator;
`;

    await fs.writeFile('./license-generator.js', licenseGeneratorCode);
    console.log('  ✓ License generator created: ./license-generator.js');
  }

  async copyDirectory(source, destination) {
    await fs.mkdir(destination, { recursive: true });
    
    const items = await fs.readdir(source, { withFileTypes: true });
    
    for (const item of items) {
      const sourcePath = path.join(source, item.name);
      const destPath = path.join(destination, item.name);
      
      if (item.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Run the build
if (require.main === module) {
  const builder = new ProtectedBuild();
  builder.build();
}

module.exports = ProtectedBuild;