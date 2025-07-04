const fs = require('fs');
const path = require('path');

describe('Website Static Files Tests', () => {
  const webInterfacePath = path.join(__dirname, '../../../src/web-interface');

  describe('Required Files Existence', () => {
    test('index.html should exist and be readable', () => {
      const indexPath = path.join(webInterfacePath, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(100);
    });

    test('styles.css should exist and be readable', () => {
      const stylesPath = path.join(webInterfacePath, 'styles.css');
      expect(fs.existsSync(stylesPath)).toBe(true);
      
      const content = fs.readFileSync(stylesPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(100);
    });

    test('main.js should exist and be readable', () => {
      const mainJsPath = path.join(webInterfacePath, 'main.js');
      expect(fs.existsSync(mainJsPath)).toBe(true);
      
      const content = fs.readFileSync(mainJsPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(10);
    });

    test('essential JavaScript modules should exist', () => {
      const essentialModules = [
        'config.js',
        'spamScan.js',
        'smtpTest.js',
        'networkTests.js',
        'base64Decoder.js',
        'timeTools.js'
      ];

      essentialModules.forEach(module => {
        const modulePath = path.join(webInterfacePath, module);
        expect(fs.existsSync(modulePath)).toBe(true);
        
        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content.length).toBeGreaterThan(10);
      });
    });
  });

  describe('HTML Structure Validation', () => {
    let htmlContent;

    beforeAll(() => {
      const indexPath = path.join(webInterfacePath, 'index.html');
      htmlContent = fs.readFileSync(indexPath, 'utf8');
    });

    test('should have proper HTML5 structure', () => {
      expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
      expect(htmlContent).toMatch(/<html[^>]*>/i);
      expect(htmlContent).toMatch(/<head>/i);
      expect(htmlContent).toMatch(/<body>/i);
      expect(htmlContent).toMatch(/<\/html>/i);
    });

    test('should include required meta tags', () => {
      expect(htmlContent).toMatch(/<meta charset/i);
      expect(htmlContent).toMatch(/<meta name="viewport"/i);
    });

    test('should include CSS and JS references', () => {
      expect(htmlContent).toMatch(/styles\.css/);
      expect(htmlContent).toMatch(/main\.js/);
    });

    test('should have proper title', () => {
      expect(htmlContent).toMatch(/<title>[^<]+<\/title>/i);
    });

    test('should have navigation elements', () => {
      expect(htmlContent).toMatch(/nav|menu/i);
    });

    test('should include form elements', () => {
      expect(htmlContent).toMatch(/<input|<button|<textarea/i);
    });
  });

  describe('CSS Validation', () => {
    let cssContent;

    beforeAll(() => {
      const stylesPath = path.join(webInterfacePath, 'styles.css');
      cssContent = fs.readFileSync(stylesPath, 'utf8');
    });

    test('should have basic CSS rules', () => {
      expect(cssContent).toMatch(/body[\s\n,]*[\{,]/i);
      expect(cssContent).toMatch(/\w+\s*{[^}]+}/); // At least one CSS rule
    });

    test('should have responsive design', () => {
      expect(cssContent).toMatch(/@media/i);
    });

    test('should have balanced braces', () => {
      const openBraces = (cssContent.match(/\{/g) || []).length;
      const closeBraces = (cssContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should include basic styling', () => {
      const basicProperties = ['color', 'background', 'padding', 'margin', 'font'];
      const hasBasicStyling = basicProperties.some(prop => 
        cssContent.includes(prop)
      );
      expect(hasBasicStyling).toBe(true);
    });
  });

  describe('JavaScript Module Validation', () => {
    test('config.js should define configuration', () => {
      const configPath = path.join(webInterfacePath, 'config.js');
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      expect(configContent).toMatch(/api|endpoint|url|port/i);
    });

    test('spamScan.js should handle spam scanning', () => {
      const spamScanPath = path.join(webInterfacePath, 'spamScan.js');
      const spamScanContent = fs.readFileSync(spamScanPath, 'utf8');
      
      expect(spamScanContent).toMatch(/spam|scan|email/i);
      expect(spamScanContent).toMatch(/file|upload|FormData/i);
    });

    test('smtpTest.js should handle SMTP testing', () => {
      const smtpTestPath = path.join(webInterfacePath, 'smtpTest.js');
      const smtpTestContent = fs.readFileSync(smtpTestPath, 'utf8');
      
      expect(smtpTestContent).toMatch(/smtp|mail/i);
      expect(smtpTestContent).toMatch(/host|port|server/i);
    });

    test('networkTests.js should handle network testing', () => {
      const networkTestsPath = path.join(webInterfacePath, 'networkTests.js');
      const networkTestsContent = fs.readFileSync(networkTestsPath, 'utf8');
      
      expect(networkTestsContent).toMatch(/ping|traceroute|network/i);
      expect(networkTestsContent).toMatch(/host|target|domain/i);
    });

    test('base64Decoder.js should handle base64 operations', () => {
      const base64Path = path.join(webInterfacePath, 'base64Decoder.js');
      const base64Content = fs.readFileSync(base64Path, 'utf8');
      
      expect(base64Content).toMatch(/base64|encode|decode/i);
    });

    test('timeTools.js should handle time operations', () => {
      const timeToolsPath = path.join(webInterfacePath, 'timeTools.js');
      const timeToolsContent = fs.readFileSync(timeToolsPath, 'utf8');
      
      expect(timeToolsContent).toMatch(/time|epoch|date/i);
      expect(timeToolsContent).toMatch(/convert|format/i);
    });
  });

  describe('JavaScript Syntax Validation', () => {
    test('all JavaScript files should have valid basic syntax', () => {
      const jsFiles = fs.readdirSync(webInterfacePath)
        .filter(file => file.endsWith('.js'))
        .filter(file => !file.includes('test'));

      jsFiles.forEach(jsFile => {
        const filePath = path.join(webInterfacePath, jsFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        expect(content).not.toMatch(/\}\s*\{/); // Likely missing semicolon
        
        // Check for balanced braces
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        expect(Math.abs(openBraces - closeBraces)).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('File Size Validation', () => {
    test('files should not be empty', () => {
      const importantFiles = [
        'index.html',
        'styles.css',
        'main.js',
        'config.js',
        'spamScan.js'
      ];

      importantFiles.forEach(file => {
        const filePath = path.join(webInterfacePath, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          expect(stats.size).toBeGreaterThan(10);
        }
      });
    });

    test('no files should be excessively large', () => {
      const files = fs.readdirSync(webInterfacePath);
      
      files.forEach(file => {
        const filePath = path.join(webInterfacePath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // No single file should be larger than 5MB
          expect(stats.size).toBeLessThan(5 * 1024 * 1024);
        }
      });
    });
  });

  describe('Error Handling in JavaScript', () => {
    test('JavaScript files should have error handling', () => {
      const criticalFiles = [
        'spamScan.js',
        'smtpTest.js',
        'networkTests.js',
        'base64Decoder.js'
      ];

      criticalFiles.forEach(file => {
        const filePath = path.join(webInterfacePath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          const hasErrorHandling = 
            content.includes('try') ||
            content.includes('catch') ||
            content.includes('.catch(') ||
            content.includes('error') ||
            content.includes('Error');
            
          expect(hasErrorHandling).toBe(true);
        }
      });
    });
  });
}); 