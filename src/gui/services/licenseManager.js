const crypto = require('crypto');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { machineIdSync } = require('node-machine-id');

class LicenseManager {
  constructor() {
    this.licenseServer = process.env.LICENSE_SERVER || 'https://api.yourlicense.com';
    this.licenseFile = path.join(os.homedir(), '.solana-protector', 'license.dat');
    this.encryptionKey = this.deriveEncryptionKey();
    this.currentLicense = null;
    this.usageTracker = {
      launchesUsed: 0,
      lastReset: new Date().toISOString().split('T')[0] // Today's date
    };
  }

  // Generate hardware fingerprint for license binding
  generateHardwareFingerprint() {
    const machineId = machineIdSync();
    const cpuInfo = os.cpus()[0].model;
    const totalMem = os.totalmem();
    const platform = os.platform();
    const arch = os.arch();
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${machineId}-${cpuInfo}-${totalMem}-${platform}-${arch}`)
      .digest('hex');
    
    return fingerprint;
  }

  // Derive encryption key from hardware
  deriveEncryptionKey() {
    const fingerprint = this.generateHardwareFingerprint();
    const salt = 'solana-protector-2024';
    
    return crypto.pbkdf2Sync(fingerprint, salt, 10000, 32, 'sha256');
  }

  // Encrypt sensitive data
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  decrypt(encryptedText) {
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encrypted = textParts.join(':');
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt license data');
    }
  }

  // Generate license key (server-side)
  static generateLicenseKey(userInfo, plan, expirationDate) {
    const data = {
      email: userInfo.email,
      plan: plan,
      expires: expirationDate,
      issued: new Date().toISOString(),
      version: '1.0',
      features: LicenseManager.getPlanFeatures(plan)
    };

    const licenseData = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', process.env.LICENSE_SIGNING_KEY || 'default-key')
      .update(licenseData)
      .digest('hex');

    const license = {
      data: Buffer.from(licenseData).toString('base64'),
      signature: signature
    };

    return Buffer.from(JSON.stringify(license)).toString('base64');
  }

  // Get features for each plan
  static getPlanFeatures(plan) {
    const features = {
      trial: {
        maxLaunches: 3,
        maxBuyAmount: 1.0,
        advancedProtection: false,
        customWhitelists: false,
        prioritySupport: false,
        duration: 7 // days
      },
      starter: {
        maxLaunches: 25,
        maxBuyAmount: 5.0,
        advancedProtection: true,
        customWhitelists: true,
        prioritySupport: false,
        duration: 30 // days
      },
      professional: {
        maxLaunches: 100,
        maxBuyAmount: 20.0,
        advancedProtection: true,
        customWhitelists: true,
        prioritySupport: true,
        duration: 30 // days
      },
      enterprise: {
        maxLaunches: -1, // unlimited
        maxBuyAmount: -1, // unlimited
        advancedProtection: true,
        customWhitelists: true,
        prioritySupport: true,
        duration: 365 // days
      }
    };

    return features[plan] || features.trial;
  }

  // Validate license key
  async validateLicense(licenseKey = null) {
    try {
      // Load from file if no key provided
      if (!licenseKey) {
        licenseKey = await this.loadLicenseFromFile();
      }

      if (!licenseKey) {
        return { valid: false, reason: 'No license found' };
      }

      // Decode license
      const license = JSON.parse(Buffer.from(licenseKey, 'base64').toString());
      const licenseData = JSON.parse(Buffer.from(license.data, 'base64').toString());

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.LICENSE_SIGNING_KEY || 'default-key')
        .update(Buffer.from(license.data, 'base64').toString())
        .digest('hex');

      if (license.signature !== expectedSignature) {
        return { valid: false, reason: 'Invalid license signature' };
      }

      // Check expiration
      const expirationDate = new Date(licenseData.expires);
      const now = new Date();
      
      if (now > expirationDate) {
        return { valid: false, reason: 'License expired' };
      }

      // Check hardware binding (for non-trial licenses)
      if (licenseData.plan !== 'trial') {
        const result = await this.verifyHardwareBinding(licenseData);
        if (!result.valid) {
          return result;
        }
      }

      // Check usage limits
      const usageCheck = await this.checkUsageLimits(licenseData);
      if (!usageCheck.valid) {
        return usageCheck;
      }

      // Online validation (if internet available)
      try {
        const onlineCheck = await this.validateOnline(licenseKey);
        if (!onlineCheck.valid) {
          return onlineCheck;
        }
      } catch (error) {
        // Allow offline usage if online check fails
        console.warn('Online license validation failed, allowing offline usage');
      }

      this.currentLicense = licenseData;
      return { 
        valid: true, 
        license: licenseData,
        remainingLaunches: this.getRemainingLaunches(licenseData)
      };

    } catch (error) {
      return { valid: false, reason: 'License validation error: ' + error.message };
    }
  }

  // Verify hardware binding
  async verifyHardwareBinding(licenseData) {
    if (!licenseData.hardwareId) {
      return { valid: false, reason: 'License not bound to this machine' };
    }

    const currentFingerprint = this.generateHardwareFingerprint();
    if (licenseData.hardwareId !== currentFingerprint) {
      return { valid: false, reason: 'License bound to different hardware' };
    }

    return { valid: true };
  }

  // Check usage limits
  async checkUsageLimits(licenseData) {
    await this.loadUsageData();

    const features = licenseData.features;
    const today = new Date().toISOString().split('T')[0];

    // Reset usage if new day
    if (this.usageTracker.lastReset !== today) {
      this.usageTracker.launchesUsed = 0;
      this.usageTracker.lastReset = today;
      await this.saveUsageData();
    }

    // Check launch limits
    if (features.maxLaunches > 0 && this.usageTracker.launchesUsed >= features.maxLaunches) {
      return { valid: false, reason: 'Daily launch limit exceeded' };
    }

    return { valid: true };
  }

  // Validate license online
  async validateOnline(licenseKey) {
    const fingerprint = this.generateHardwareFingerprint();
    
    const response = await axios.post(`${this.licenseServer}/validate`, {
      licenseKey: licenseKey,
      hardwareId: fingerprint,
      version: require('../../package.json').version,
      timestamp: Date.now()
    }, {
      timeout: 5000 // 5 second timeout
    });

    if (!response.data.valid) {
      return { valid: false, reason: response.data.reason || 'Online validation failed' };
    }

    return { valid: true };
  }

  // Activate license
  async activateLicense(licenseKey) {
    // First validate the license
    const validation = await this.validateLicense(licenseKey);
    if (!validation.valid) {
      return validation;
    }

    // Bind to hardware (for non-trial licenses)
    const licenseData = validation.license;
    if (licenseData.plan !== 'trial') {
      licenseData.hardwareId = this.generateHardwareFingerprint();
      licenseData.activatedAt = new Date().toISOString();
    }

    // Save license to file
    await this.saveLicenseToFile(licenseKey, licenseData);

    // Register activation online
    try {
      await this.registerActivation(licenseKey);
    } catch (error) {
      console.warn('Failed to register activation online:', error.message);
    }

    this.currentLicense = licenseData;
    return { valid: true, license: licenseData };
  }

  // Register activation with server
  async registerActivation(licenseKey) {
    const fingerprint = this.generateHardwareFingerprint();
    
    await axios.post(`${this.licenseServer}/activate`, {
      licenseKey: licenseKey,
      hardwareId: fingerprint,
      platform: os.platform(),
      version: require('../../package.json').version,
      timestamp: Date.now()
    });
  }

  // Save license to encrypted file
  async saveLicenseToFile(licenseKey, licenseData) {
    const licenseDir = path.dirname(this.licenseFile);
    
    try {
      await fs.mkdir(licenseDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const encryptedData = this.encrypt(JSON.stringify({
      key: licenseKey,
      data: licenseData,
      savedAt: new Date().toISOString()
    }));

    await fs.writeFile(this.licenseFile, encryptedData);
  }

  // Load license from file
  async loadLicenseFromFile() {
    try {
      const encryptedData = await fs.readFile(this.licenseFile, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      const licenseInfo = JSON.parse(decryptedData);
      
      this.currentLicense = licenseInfo.data;
      return licenseInfo.key;
    } catch (error) {
      return null;
    }
  }

  // Load usage tracking data
  async loadUsageData() {
    try {
      const usageFile = path.join(os.homedir(), '.solana-protector', 'usage.dat');
      const encryptedData = await fs.readFile(usageFile, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      this.usageTracker = JSON.parse(decryptedData);
    } catch (error) {
      // Use default usage tracker
    }
  }

  // Save usage tracking data
  async saveUsageData() {
    try {
      const usageFile = path.join(os.homedir(), '.solana-protector', 'usage.dat');
      const encryptedData = this.encrypt(JSON.stringify(this.usageTracker));
      await fs.writeFile(usageFile, encryptedData);
    } catch (error) {
      console.error('Failed to save usage data:', error);
    }
  }

  // Increment usage counter
  async incrementUsage() {
    if (!this.currentLicense) {
      throw new Error('No valid license found');
    }

    await this.loadUsageData();
    this.usageTracker.launchesUsed++;
    await this.saveUsageData();

    // Report usage to server
    try {
      await this.reportUsage();
    } catch (error) {
      console.warn('Failed to report usage to server:', error.message);
    }
  }

  // Report usage to server
  async reportUsage() {
    const fingerprint = this.generateHardwareFingerprint();
    
    await axios.post(`${this.licenseServer}/usage`, {
      hardwareId: fingerprint,
      launchesUsed: this.usageTracker.launchesUsed,
      date: this.usageTracker.lastReset,
      timestamp: Date.now()
    });
  }

  // Get remaining launches
  getRemainingLaunches(licenseData = null) {
    const license = licenseData || this.currentLicense;
    if (!license) return 0;

    const features = license.features;
    if (features.maxLaunches < 0) return -1; // unlimited

    return Math.max(0, features.maxLaunches - this.usageTracker.launchesUsed);
  }

  // Get license info
  async getLicenseInfo() {
    if (!this.currentLicense) {
      return { valid: false };
    }

    await this.loadUsageData();

    return {
      valid: true,
      plan: this.currentLicense.plan,
      email: this.currentLicense.email,
      expires: this.currentLicense.expires,
      features: this.currentLicense.features,
      usage: {
        launchesUsed: this.usageTracker.launchesUsed,
        remainingLaunches: this.getRemainingLaunches(),
        resetDate: this.usageTracker.lastReset
      },
      hardwareId: this.currentLicense.hardwareId ? 
        this.currentLicense.hardwareId.substring(0, 8) + '...' : null
    };
  }

  // Deactivate license
  async deactivateLicense() {
    try {
      await fs.unlink(this.licenseFile);
      
      // Notify server
      if (this.currentLicense && this.currentLicense.hardwareId) {
        await axios.post(`${this.licenseServer}/deactivate`, {
          hardwareId: this.currentLicense.hardwareId,
          timestamp: Date.now()
        });
      }
      
      this.currentLicense = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if feature is available
  hasFeature(featureName) {
    if (!this.currentLicense) return false;
    return this.currentLicense.features[featureName] === true;
  }

  // Get feature limit
  getFeatureLimit(featureName) {
    if (!this.currentLicense) return 0;
    return this.currentLicense.features[featureName] || 0;
  }

  // Check if can use protection (checks license and usage)
  async canUseProtection() {
    const validation = await this.validateLicense();
    return validation.valid && this.getRemainingLaunches() !== 0;
  }
}

module.exports = LicenseManager;