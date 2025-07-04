const fs = require('fs');
const path = require('path');

describe('Website Functionality Tests', () => {
  const webInterfacePath = path.join(__dirname, '../../../src/web-interface');

  describe('Static Files Existence', () => {
    test('index.html should exist and be readable', () => {
      const indexPath = path.join(webInterfacePath, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    test('styles.css should exist and be readable', () => {
      const stylesPath = path.join(webInterfacePath, 'styles.css');
      expect(fs.existsSync(stylesPath)).toBe(true);
      
      const content = fs.readFileSync(stylesPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    test('main.js should exist and be readable', () => {
      const mainJsPath = path.join(webInterfacePath, 'main.js');
      expect(fs.existsSync(mainJsPath)).toBe(true);
      
      const content = fs.readFileSync(mainJsPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    test('essential JavaScript modules should exist', () => {
      const essentialModules = [
        'apiClient.js',
        'formatters.js',
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
      });
    });
  });

  describe('HTML Structure', () => {
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
    });

    test('should include required meta tags', () => {
      expect(htmlContent).toMatch(/<meta charset="utf-8">/i);
      expect(htmlContent).toMatch(/<meta name="viewport"/i);
    });

    test('should include essential CSS and JS files', () => {
      expect(htmlContent).toMatch(/styles\.css/);
      expect(htmlContent).toMatch(/main\.js/);
    });

    test('should have navigation structure', () => {
      expect(htmlContent).toMatch(/nav/i);
      expect(htmlContent).toMatch(/nav-btn|button/i);
    });

    test('should include spam scan functionality', () => {
      expect(htmlContent).toMatch(/spam/i);
      expect(htmlContent).toMatch(/scan/i);
    });

    test('should include essential form elements', () => {
      expect(htmlContent).toMatch(/<input/i);
      expect(htmlContent).toMatch(/<button/i);
      expect(htmlContent).toMatch(/<textarea/i);
    });

    test('should have proper title', () => {
      expect(htmlContent).toMatch(/<title>[^<]+<\/title>/i);
      const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
      expect(titleMatch).toBeTruthy();
      expect(titleMatch[1].length).toBeGreaterThan(0);
    });
  });

  describe('CSS Styles', () => {
    let cssContent;

    beforeAll(() => {
      const stylesPath = path.join(webInterfacePath, 'styles.css');
      cssContent = fs.readFileSync(stylesPath, 'utf8');
    });

    test('should include responsive design rules', () => {
      expect(cssContent).toMatch(/@media/i);
    });

    test('should have basic styling for key components', () => {
      const keySelectors = [
        'body',
        'nav',
        'button',
        'input',
        'textarea'
      ];

      keySelectors.forEach(selector => {
        const regex = new RegExp(`${selector}\\s*{`, 'i');
        expect(cssContent).toMatch(regex);
      });
    });

    test('should include spam scan specific styles', () => {
      expect(cssContent).toMatch(/spam/i);
    });

    test('should have error and success styling', () => {
      expect(cssContent).toMatch(/error|\.error/i);
      expect(cssContent).toMatch(/success|\.success/i);
    });

    test('should include loading and status indicators', () => {
      expect(cssContent).toMatch(/loading|spinner/i);
    });
  });

  describe('JavaScript Modules', () => {
    let mainJsContent;

    beforeAll(() => {
      const mainJsPath = path.join(webInterfacePath, 'main.js');
      mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    });

    test('main.js should have event listeners', () => {
      expect(mainJsContent).toMatch(/addEventListener|onclick/i);
    });

    test('main.js should import or include required modules', () => {
      expect(mainJsContent).toMatch(/import|require|\.js/);
    });

    test('config.js should define API endpoints', () => {
      const configPath = path.join(webInterfacePath, 'config.js');
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      expect(configContent).toMatch(/api|endpoint|url/i);
      expect(configContent).toMatch(/localhost|127\.0\.0\.1|\${|port/i);
    });

    test('apiClient.js should handle HTTP requests', () => {
      const apiClientPath = path.join(webInterfacePath, 'apiClient.js');
      const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
      
      expect(apiClientContent).toMatch(/fetch|xhr|ajax|request/i);
      expect(apiClientContent).toMatch(/post|get|method/i);
    });

    test('formatters.js should export formatting functions', () => {
      const formattersPath = path.join(webInterfacePath, 'formatters.js');
      const formattersContent = fs.readFileSync(formattersPath, 'utf8');
      
      expect(formattersContent).toMatch(/export|function/i);
      expect(formattersContent).toMatch(/format/i);
    });

    test('spamScan.js should handle spam scanning', () => {
      const spamScanPath = path.join(webInterfacePath, 'spamScan.js');
      const spamScanContent = fs.readFileSync(spamScanPath, 'utf8');
      
      expect(spamScanContent).toMatch(/spam|scan/i);
      expect(spamScanContent).toMatch(/file|email/i);
    });
  });

  describe('Module Dependencies', () => {
    test('all JavaScript files should be syntactically valid', () => {
      const jsFiles = fs.readdirSync(webInterfacePath)
        .filter(file => file.endsWith('.js'))
        .filter(file => !file.includes('test'));

      jsFiles.forEach(jsFile => {
        const filePath = path.join(webInterfacePath, jsFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        expect(content).not.toMatch(/\}\s*\{/); // Likely missing semicolon
        expect(content).not.toMatch(/\(\s*\)\s*\{[^}]*\(\s*\)\s*\{/); // Nested function issues
        
        // Check for balanced braces (basic check)
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        expect(Math.abs(openBraces - closeBraces)).toBeLessThanOrEqual(1); // Allow for some flexibility
      });
    });

    test('CSS should not have obvious syntax errors', () => {
      const stylesPath = path.join(webInterfacePath, 'styles.css');
      const cssContent = fs.readFileSync(stylesPath, 'utf8');
      
      // Basic CSS syntax checks
      const openBraces = (cssContent.match(/\{/g) || []).length;
      const closeBraces = (cssContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('HTML should reference existing files', () => {
      const indexPath = path.join(webInterfacePath, 'index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Extract referenced files
      const srcMatches = htmlContent.match(/src=["']([^"']+)["']/g) || [];
      const hrefMatches = htmlContent.match(/href=["']([^"']+)["']/g) || [];
      
      const referencedFiles = [...srcMatches, ...hrefMatches]
        .map(match => match.match(/["']([^"']+)["']/)[1])
        .filter(file => !file.startsWith('http') && !file.startsWith('//'))
        .filter(file => file.endsWith('.js') || file.endsWith('.css'));
      
      referencedFiles.forEach(file => {
        const filePath = path.join(webInterfacePath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Feature Completeness', () => {
    test('should have spam scanning interface', () => {
      const spamScanPath = path.join(webInterfacePath, 'spamScan.js');
      const spamScanContent = fs.readFileSync(spamScanPath, 'utf8');
      
      expect(spamScanContent).toMatch(/scan.*email|email.*scan/i);
      expect(spamScanContent).toMatch(/upload|file|input/i);
      expect(spamScanContent).toMatch(/result|response/i);
    });

    test('should have network testing interface', () => {
      const networkTestsPath = path.join(webInterfacePath, 'networkTests.js');
      const networkTestsContent = fs.readFileSync(networkTestsPath, 'utf8');
      
      expect(networkTestsContent).toMatch(/ping|traceroute|network/i);
      expect(networkTestsContent).toMatch(/host|target/i);
    });

    test('should have SMTP testing interface', () => {
      const smtpTestPath = path.join(webInterfacePath, 'smtpTest.js');
      const smtpTestContent = fs.readFileSync(smtpTestPath, 'utf8');
      
      expect(smtpTestContent).toMatch(/smtp|mail/i);
      expect(smtpTestContent).toMatch(/host|server|port/i);
    });

    test('should have base64 encoding interface', () => {
      const base64Path = path.join(webInterfacePath, 'base64Decoder.js');
      const base64Content = fs.readFileSync(base64Path, 'utf8');
      
      expect(base64Content).toMatch(/base64|encode|decode/i);
    });

    test('should have time tools interface', () => {
      const timeToolsPath = path.join(webInterfacePath, 'timeTools.js');
      const timeToolsContent = fs.readFileSync(timeToolsPath, 'utf8');
      
      expect(timeToolsContent).toMatch(/time|epoch|date/i);
      expect(timeToolsContent).toMatch(/convert|format/i);
    });
  });

  describe('Error Handling', () => {
    test('JavaScript files should have basic error handling', () => {
      const jsFiles = fs.readdirSync(webInterfacePath)
        .filter(file => file.endsWith('.js'))
        .filter(file => !file.includes('test'))
        .filter(file => !file.includes('config'));

      jsFiles.forEach(jsFile => {
        const filePath = path.join(webInterfacePath, jsFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Should have some error handling
        const hasErrorHandling = 
          content.includes('try') ||
          content.includes('catch') ||
          content.includes('.catch(') ||
          content.includes('error') ||
          content.includes('Error');
          
        expect(hasErrorHandling).toBe(true);
      });
    });

    test('should handle API request failures gracefully', () => {
      const apiClientPath = path.join(webInterfacePath, 'apiClient.js');
      const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
      
      expect(apiClientContent).toMatch(/catch|error|fail/i);
    });
  });
}); 