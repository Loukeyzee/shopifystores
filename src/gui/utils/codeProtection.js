const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class CodeProtection {
  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.obfuscationMap = new Map();
    this.protectedModules = new Map();
  }

  // Generate encryption key from environment
  generateEncryptionKey() {
    const keyData = process.env.CODE_PROTECTION_KEY || 'default-protection-key-2024';
    return crypto.createHash('sha256').update(keyData).digest();
  }

  // Obfuscate JavaScript code
  obfuscateCode(code) {
    // Replace variable names with obfuscated ones
    const variableMap = new Map();
    let obfuscatedCode = code;
    let varCounter = 0;

    // Common patterns to obfuscate
    const patterns = [
      // Function names
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      // Variable declarations
      /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      // Class names
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      // Method names
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    ];

    patterns.forEach(pattern => {
      obfuscatedCode = obfuscatedCode.replace(pattern, (match, varName) => {
        if (!variableMap.has(varName)) {
          variableMap.set(varName, `_${this.generateObfuscatedName(varCounter++)}`);
        }
        return match.replace(varName, variableMap.get(varName));
      });
    });

    // Add anti-debugging measures
    const antiDebugCode = this.generateAntiDebugCode();
    obfuscatedCode = antiDebugCode + '\n' + obfuscatedCode;

    // Add integrity checks
    const integrityCode = this.generateIntegrityChecks();
    obfuscatedCode = integrityCode + '\n' + obfuscatedCode;

    return obfuscatedCode;
  }

  // Generate obfuscated variable name
  generateObfuscatedName(index) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    let num = index;
    
    do {
      result = chars[num % chars.length] + result;
      num = Math.floor(num / chars.length);
    } while (num > 0);
    
    return result;
  }

  // Generate anti-debugging code
  generateAntiDebugCode() {
    return `
// Anti-debugging measures
(function() {
  let devtools = false;
  const threshold = 160;
  
  setInterval(function() {
    if (typeof window !== 'undefined' && (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold)) {
      devtools = true;
      throw new Error('DevTools detected - Application terminated');
    }
  }, 500);

  // Prevent console access
  if (typeof console !== 'undefined') {
    console.log = console.warn = console.error = console.info = 
    console.debug = console.trace = function() {};
  }

  // Prevent debugging
  setInterval(function() {
    const before = Date.now();
    debugger;
    const after = Date.now();
    if (after - before > 100) {
      throw new Error('Debugger detected - Application terminated');
    }
  }, 1000);
})();
`;
  }

  // Generate integrity checks
  generateIntegrityChecks() {
    return `
// Integrity verification
(function() {
  const expectedChecksum = '${this.generateRandomChecksum()}';
  const currentChecksum = require('crypto').createHash('md5')
    .update(require('fs').readFileSync(__filename))
    .digest('hex');
  
  if (currentChecksum !== expectedChecksum) {
    // File has been modified - could be tampering
    console.warn('File integrity check failed');
  }
  
  // Check for common reverse engineering tools
  const processNames = require('child_process').execSync('tasklist').toString().toLowerCase();
  const suspiciousProcesses = ['cheat', 'hack', 'crack', 'ida', 'ollydbg', 'x64dbg'];
  
  suspiciousProcesses.forEach(proc => {
    if (processNames.includes(proc)) {
      process.exit(1);
    }
  });
})();
`;
  }

  // Generate random checksum for integrity
  generateRandomChecksum() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Encrypt code
  encryptCode(code) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    
    let encrypted = cipher.update(code, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex')
    };
  }

  // Decrypt code
  decryptCode(encryptedData, iv) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt protected code');
    }
  }

  // Protect a JavaScript file
  protectFile(filePath, outputPath) {
    try {
      const originalCode = fs.readFileSync(filePath, 'utf8');
      
      // First obfuscate
      const obfuscatedCode = this.obfuscateCode(originalCode);
      
      // Then encrypt
      const { encrypted, iv } = this.encryptCode(obfuscatedCode);
      
      // Create loader code
      const loaderCode = this.generateLoaderCode(encrypted, iv);
      
      // Write protected file
      fs.writeFileSync(outputPath, loaderCode);
      
      console.log(`Protected: ${filePath} -> ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to protect ${filePath}:`, error);
      return false;
    }
  }

  // Generate loader code that decrypts and executes
  generateLoaderCode(encryptedCode, iv) {
    return `
const crypto = require('crypto');
const vm = require('vm');

class ProtectedModule {
  constructor() {
    this.key = this.deriveKey();
  }

  deriveKey() {
    const keyData = process.env.CODE_PROTECTION_KEY || 'default-protection-key-2024';
    return crypto.createHash('sha256').update(keyData).digest();
  }

  execute() {
    try {
      // Anti-tampering check
      this.performSecurityChecks();
      
      // Decrypt and execute
      const decipher = crypto.createDecipher('aes-256-cbc', this.key);
      let decrypted = decipher.update('${encryptedCode}', 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Execute in isolated context
      const context = {
        require: require,
        module: module,
        exports: exports,
        __filename: __filename,
        __dirname: __dirname,
        process: process,
        global: global,
        console: console
      };
      
      vm.createContext(context);
      vm.runInContext(decrypted, context);
      
      return context.module.exports;
    } catch (error) {
      throw new Error('Protected module execution failed');
    }
  }

  performSecurityChecks() {
    // Check if running in development environment
    if (process.env.NODE_ENV === 'development') {
      return; // Allow in development
    }

    // Check for debugging
    const start = Date.now();
    debugger;
    if (Date.now() - start > 100) {
      throw new Error('Debugging detected');
    }

    // Check for common analysis tools
    const forbidden = ['ida', 'olly', 'x64dbg', 'cheat', 'hack'];
    try {
      const processes = require('child_process').execSync('tasklist').toString().toLowerCase();
      forbidden.forEach(tool => {
        if (processes.includes(tool)) {
          throw new Error('Analysis tool detected');
        }
      });
    } catch (e) {
      // Ignore process check errors
    }

    // Verify file integrity
    try {
      const fs = require('fs');
      const fileContent = fs.readFileSync(__filename, 'utf8');
      const lines = fileContent.split('\\n');
      if (lines.length < 50) { // Minimum expected lines
        throw new Error('File appears to be modified');
      }
    } catch (e) {
      // Ignore file check errors
    }
  }
}

module.exports = new ProtectedModule().execute();
`;
  }

  // Protect all files in a directory
  protectDirectory(sourceDir, outputDir, extensions = ['.js']) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = this.getAllFiles(sourceDir, extensions);
    let protectedCount = 0;

    files.forEach(file => {
      const relativePath = path.relative(sourceDir, file);
      const outputPath = path.join(outputDir, relativePath);
      const outputDirPath = path.dirname(outputPath);

      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }

      if (this.protectFile(file, outputPath)) {
        protectedCount++;
      }
    });

    console.log(`Protected ${protectedCount} files`);
    return protectedCount;
  }

  // Get all files with specified extensions
  getAllFiles(dir, extensions) {
    let files = [];
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  // Create encrypted require function
  createEncryptedRequire() {
    const originalRequire = module.constructor.prototype.require;
    
    module.constructor.prototype.require = function(id) {
      // Check if this is a protected module
      if (this.protectedModules && this.protectedModules.has(id)) {
        return this.protectedModules.get(id);
      }
      
      // Use original require
      return originalRequire.apply(this, arguments);
    }.bind(this);
  }

  // Register protected module
  registerProtectedModule(id, moduleExports) {
    this.protectedModules.set(id, moduleExports);
  }

  // Generate build script for protection
  generateBuildScript() {
    return `
const CodeProtection = require('./utils/codeProtection');
const path = require('path');

const protector = new CodeProtection();

// Protect core modules
const coreModules = [
  './services/jitoClient.js',
  './services/sniperDetector.js',
  './services/launchProtector.js',
  './services/licenseManager.js'
];

console.log('Protecting core modules...');

coreModules.forEach(module => {
  const inputPath = path.resolve(module);
  const outputPath = path.resolve(module.replace('.js', '.protected.js'));
  protector.protectFile(inputPath, outputPath);
});

console.log('Code protection complete!');
`;
  }

  // Generate integrity verification
  generateFileIntegrity(filePath) {
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return {
      file: filePath,
      hash: hash,
      size: content.length,
      timestamp: new Date().toISOString()
    };
  }

  // Verify file integrity
  verifyFileIntegrity(filePath, expectedHash) {
    try {
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      return actualHash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  // Create integrity manifest
  createIntegrityManifest(directory) {
    const files = this.getAllFiles(directory, ['.js', '.json']);
    const manifest = {
      created: new Date().toISOString(),
      files: {}
    };

    files.forEach(file => {
      const relativePath = path.relative(directory, file);
      manifest.files[relativePath] = this.generateFileIntegrity(file);
    });

    return manifest;
  }

  // Verify integrity manifest
  verifyIntegrityManifest(directory, manifest) {
    const results = {
      valid: true,
      modified: [],
      missing: []
    };

    Object.keys(manifest.files).forEach(relativePath => {
      const fullPath = path.join(directory, relativePath);
      const expectedHash = manifest.files[relativePath].hash;

      if (!fs.existsSync(fullPath)) {
        results.missing.push(relativePath);
        results.valid = false;
      } else if (!this.verifyFileIntegrity(fullPath, expectedHash)) {
        results.modified.push(relativePath);
        results.valid = false;
      }
    });

    return results;
  }
}

// Export both class and utility functions
module.exports = {
  CodeProtection,
  
  // Utility function for encrypted require
  encryptedRequire: function(modulePath) {
    // This would be used in the protected application
    const protector = new CodeProtection();
    return protector.loadProtectedModule(modulePath);
  },
  
  // Utility to protect single file
  protectFile: function(inputPath, outputPath) {
    const protector = new CodeProtection();
    return protector.protectFile(inputPath, outputPath);
  },
  
  // Utility to protect directory
  protectDirectory: function(sourceDir, outputDir) {
    const protector = new CodeProtection();
    return protector.protectDirectory(sourceDir, outputDir);
  }
};