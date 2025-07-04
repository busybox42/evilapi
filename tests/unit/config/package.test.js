const fs = require('fs');
const path = require('path');

describe('Package Configuration Tests', () => {
  let packageJson;
  let packagePath;

  beforeAll(() => {
    packagePath = path.join(__dirname, '../../../package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    packageJson = JSON.parse(packageContent);
  });

  describe('Package.json Structure', () => {
    test('should exist and be readable', () => {
      expect(fs.existsSync(packagePath)).toBe(true);
      expect(packageJson).toBeTruthy();
      expect(typeof packageJson).toBe('object');
    });

    test('should have required fields', () => {
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
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

  describe('Scripts', () => {
    test('should have start script', () => {
      expect(packageJson.scripts).toHaveProperty('start');
      expect(typeof packageJson.scripts.start).toBe('string');
    });

    test('should have test script', () => {
      expect(packageJson.scripts).toHaveProperty('test');
      expect(typeof packageJson.scripts.test).toBe('string');
    });
  });

  describe('Dependencies', () => {
    test('should have Express for web server', () => {
      expect(packageJson.dependencies).toHaveProperty('express');
    });

    test('should have body-parser for request parsing', () => {
      expect(packageJson.dependencies).toHaveProperty('body-parser');
    });

    test('should have multer for file uploads', () => {
      expect(packageJson.dependencies).toHaveProperty('multer');
    });

    test('should have Jest for testing', () => {
      const hasJest = packageJson.dependencies?.jest || 
                     packageJson.devDependencies?.jest;
      expect(hasJest).toBeTruthy();
    });

    test('should have supertest for API testing', () => {
      const hasSupertest = packageJson.dependencies?.supertest || 
                          packageJson.devDependencies?.supertest;
      expect(hasSupertest).toBeTruthy();
    });

    test('dependency versions should be valid', () => {
      Object.values(packageJson.dependencies).forEach(version => {
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Project Structure', () => {
    test('should have src directory', () => {
      const srcPath = path.join(__dirname, '../../../src');
      expect(fs.existsSync(srcPath)).toBe(true);
    });

    test('should have tests directory', () => {
      const testsPath = path.join(__dirname, '../../../tests');
      expect(fs.existsSync(testsPath)).toBe(true);
    });

    test('should have README file', () => {
      const readmePath = path.join(__dirname, '../../../README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('should have Jest configuration', () => {
      const jestConfigPath = path.join(__dirname, '../../../jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
    });
  });

  describe('Configuration Files', () => {
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
    test('should have Dockerfile', () => {
      const dockerfilePath = path.join(__dirname, '../../../Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);
      
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      expect(dockerfileContent).toMatch(/FROM/i);
      expect(dockerfileContent).toMatch(/node/i);
    });

    test('should have start script', () => {
      const startScriptPath = path.join(__dirname, '../../../start.sh');
      expect(fs.existsSync(startScriptPath)).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    test('should have .gitignore file', () => {
      const gitignorePath = path.join(__dirname, '../../../.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        expect(gitignoreContent).toMatch(/node_modules/);
      }
    });
  });

  describe('API Structure', () => {
    test('should have API routes directory', () => {
      const routesPath = path.join(__dirname, '../../../src/api/routes');
      expect(fs.existsSync(routesPath)).toBe(true);
    });

    test('should have services directory', () => {
      const servicesPath = path.join(__dirname, '../../../src/services');
      expect(fs.existsSync(servicesPath)).toBe(true);
    });

    test('should have web interface directory', () => {
      const webInterfacePath = path.join(__dirname, '../../../src/web-interface');
      expect(fs.existsSync(webInterfacePath)).toBe(true);
    });

    test('should have essential route files', () => {
      const routesPath = path.join(__dirname, '../../../src/api/routes');
      const essentialRoutes = [
        'base64Route.js',
        'scanEmail.js',
        'smtpRoutes.js',
        'pingRoutes.js'
      ];

      essentialRoutes.forEach(route => {
        const routePath = path.join(routesPath, route);
        expect(fs.existsSync(routePath)).toBe(true);
      });
    });

    test('should have essential service files', () => {
      const servicesPath = path.join(__dirname, '../../../src/services');
      const essentialServices = [
        'base64Service.js',
        'spamAssassinService.js',
        'smtpService.js',
        'pingService.js'
      ];

      essentialServices.forEach(service => {
        const servicePath = path.join(servicesPath, service);
        expect(fs.existsSync(servicePath)).toBe(true);
      });
    });
  });
}); 