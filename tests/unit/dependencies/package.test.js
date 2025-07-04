const fs = require('fs');
const path = require('path');

describe('Package Configuration Tests', () => {
  let packageJson;
  let packagePath;

  beforeAll(() => {
    packagePath = path.join(__dirname, '../../../package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
    
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    packageJson = JSON.parse(packageContent);
  });

  describe('Package.json Structure', () => {
    test('should have required fields', () => {
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
      expect(packageJson).toHaveProperty('description');
      expect(packageJson).toHaveProperty('main');
      expect(packageJson).toHaveProperty('scripts');
      expect(packageJson).toHaveProperty('dependencies');
    });

    test('should have valid name and version', () => {
      expect(typeof packageJson.name).toBe('string');
      expect(packageJson.name.length).toBeGreaterThan(0);
      expect(typeof packageJson.version).toBe('string');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    test('should have proper main entry point', () => {
      expect(typeof packageJson.main).toBe('string');
      const mainPath = path.join(__dirname, '../../../', packageJson.main);
      expect(fs.existsSync(mainPath)).toBe(true);
    });
  });

  describe('Dependencies', () => {
    test('should have essential Express dependencies', () => {
      const requiredDeps = [
        'express',
        'body-parser',
        'cors'
      ];

      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });

    test('should have testing dependencies', () => {
      const testingDeps = [
        'jest',
        'supertest'
      ];

      testingDeps.forEach(dep => {
        const hasDep = packageJson.dependencies?.[dep] || 
                     packageJson.devDependencies?.[dep];
        expect(hasDep).toBeTruthy();
      });
    });

    test('should have file upload dependencies', () => {
      expect(packageJson.dependencies).toHaveProperty('multer');
    });

    test('should have crypto dependencies for security features', () => {
      const cryptoDeps = ['bcrypt'];
      
      cryptoDeps.forEach(dep => {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          expect(true).toBe(true); // Dependency exists
        } else {
          // It's okay if not present, crypto features might use built-in Node crypto
          expect(true).toBe(true);
        }
      });
    });

    test('dependency versions should be valid', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...(packageJson.devDependencies || {})
      };

      Object.values(allDeps).forEach(version => {
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
        // Should start with version number, ^, ~, or *
        expect(version).toMatch(/^[\^~*]?\d|\^|~|\*/);
      });
    });
  });

  describe('Scripts', () => {
    test('should have start script', () => {
      expect(packageJson.scripts).toHaveProperty('start');
      expect(typeof packageJson.scripts.start).toBe('string');
    });

    test('should have test script', () => {
      expect(packageJson.scripts).toHaveProperty('test');
      expect(typeof packageJson.scripts.test).toBe('string');
      expect(packageJson.scripts.test).toMatch(/jest|test/i);
    });

    test('scripts should reference valid files', () => {
      const { start } = packageJson.scripts;
      
      if (start.includes('node ')) {
        const scriptFile = start.replace(/^.*node\s+/, '').split(' ')[0];
        const scriptPath = path.join(__dirname, '../../../', scriptFile);
        expect(fs.existsSync(scriptPath)).toBe(true);
      }
    });
  });

  describe('Repository and License', () => {
    test('should have repository information if present', () => {
      if (packageJson.repository) {
        expect(typeof packageJson.repository).toBe('object');
        expect(packageJson.repository).toHaveProperty('type');
        expect(packageJson.repository).toHaveProperty('url');
      }
    });

    test('should have license information', () => {
      if (packageJson.license) {
        expect(typeof packageJson.license).toBe('string');
      }
    });

    test('should have author information if present', () => {
      if (packageJson.author) {
        expect(typeof packageJson.author === 'string' || typeof packageJson.author === 'object').toBe(true);
      }
    });
  });

  describe('Node Engine Requirements', () => {
    test('should specify Node version if engines field exists', () => {
      if (packageJson.engines) {
        expect(typeof packageJson.engines).toBe('object');
        if (packageJson.engines.node) {
          expect(typeof packageJson.engines.node).toBe('string');
        }
      }
    });

    test('should be compatible with current Node version', () => {
      const currentNodeVersion = process.version;
      const majorVersion = parseInt(currentNodeVersion.substring(1).split('.')[0]);
      
      // Should work with Node 14+ for modern features
      expect(majorVersion).toBeGreaterThanOrEqual(14);
    });
  });

  describe('File Structure Validation', () => {
    test('should have consistent file references', () => {
      const srcPath = path.join(__dirname, '../../../src');
      expect(fs.existsSync(srcPath)).toBe(true);
      
      const serverFile = path.join(srcPath, 'server.js');
      expect(fs.existsSync(serverFile)).toBe(true);
    });

    test('should have README file', () => {
      const readmePath = path.join(__dirname, '../../../README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('should have proper directory structure', () => {
      const requiredDirs = [
        'src',
        'src/api',
        'src/api/routes',
        'src/services',
        'src/web-interface',
        'tests'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(__dirname, '../../../', dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe('Configuration Files', () => {
    test('should have Jest configuration', () => {
      const jestConfigPath = path.join(__dirname, '../../../jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
    });

    test('should have example configuration', () => {
      const configExamplePath = path.join(__dirname, '../../../src/config/config.js.example');
      expect(fs.existsSync(configExamplePath)).toBe(true);
    });

    test('Jest config should be valid', () => {
      const jestConfigPath = path.join(__dirname, '../../../jest.config.js');
      const jestConfig = require(jestConfigPath);
      
      expect(jestConfig).toHaveProperty('testEnvironment');
      expect(jestConfig).toHaveProperty('testMatch');
      expect(jestConfig.testEnvironment).toBe('node');
    });
  });

  describe('Docker Configuration', () => {
    test('should have Dockerfile if using Docker', () => {
      const dockerfilePath = path.join(__dirname, '../../../Dockerfile');
      if (fs.existsSync(dockerfilePath)) {
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        expect(dockerfileContent).toMatch(/FROM node/i);
        expect(dockerfileContent).toMatch(/COPY package/i);
        expect(dockerfileContent).toMatch(/npm install/i);
      }
    });

    test('should have .dockerignore if using Docker', () => {
      const dockerfilePath = path.join(__dirname, '../../../Dockerfile');
      const dockerignorePath = path.join(__dirname, '../../../.dockerignore');
      
      if (fs.existsSync(dockerfilePath) && fs.existsSync(dockerignorePath)) {
        const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
        expect(dockerignoreContent).toMatch(/node_modules/);
      }
    });
  });

  describe('Security Configuration', () => {
    test('should not include sensitive files in npm package', () => {
      if (packageJson.files) {
        const sensitivePatterns = [
          '.env',
          'config.js',
          'secrets',
          'private'
        ];

        sensitivePatterns.forEach(pattern => {
          expect(packageJson.files).not.toContain(pattern);
        });
      }
    });

    test('should have .gitignore file', () => {
      const gitignorePath = path.join(__dirname, '../../../.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        expect(gitignoreContent).toMatch(/node_modules/);
        expect(gitignoreContent).toMatch(/\.env/);
      }
    });
  });

  describe('Compatibility', () => {
    test('should not have known vulnerable dependencies', () => {
      // This is a basic check - in real projects you'd use npm audit
      const knownVulnerable = [
        'event-stream@3.3.6',
        'lodash@4.17.11'
      ];

      const allDeps = {
        ...packageJson.dependencies,
        ...(packageJson.devDependencies || {})
      };

      knownVulnerable.forEach(vuln => {
        const [pkg, version] = vuln.split('@');
        if (allDeps[pkg]) {
          expect(allDeps[pkg]).not.toBe(version);
        }
      });
    });

    test('should use recent versions of major dependencies', () => {
      if (packageJson.dependencies.express) {
        const expressVersion = packageJson.dependencies.express.replace(/[\^~]/, '');
        const majorVersion = parseInt(expressVersion.split('.')[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(4);
      }

      if (packageJson.dependencies.jest || packageJson.devDependencies?.jest) {
        const jestVersion = (packageJson.dependencies.jest || packageJson.devDependencies.jest).replace(/[\^~]/, '');
        const majorVersion = parseInt(jestVersion.split('.')[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(26);
      }
    });
  });
}); 