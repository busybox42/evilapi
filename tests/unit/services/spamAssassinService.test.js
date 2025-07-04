// Mock child_process module
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

const { spawn } = require('child_process');
const { scanEmailWithSpamAssassin } = require('../../../src/services/spamAssassinService');

describe('SpamAssassin Service', () => {
  let mockSpamcProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock process object
    mockSpamcProcess = {
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      },
      stdin: {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        writable: true
      },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockSpamcProcess);
  });

  describe('Input Validation', () => {
    test('should reject invalid email content', async () => {
      await expect(scanEmailWithSpamAssassin(null)).rejects.toThrow('Invalid email content provided');
      await expect(scanEmailWithSpamAssassin(undefined)).rejects.toThrow('Invalid email content provided');
      await expect(scanEmailWithSpamAssassin(123)).rejects.toThrow('Invalid email content provided');
    });

    test('should reject emails over size limit', async () => {
      const largeContent = 'x'.repeat(1024 * 1024 + 1); // Over 1MB
      
      const result = await scanEmailWithSpamAssassin(largeContent);
      
      expect(result.decision).toBe('Content Too Large');
      expect(result.score).toBe('N/A');
      expect(result.details[0].ruleName).toBe('SIZE_LIMIT');
    });
  });

  describe('Successful Scanning', () => {
    test('should process small emails successfully', async (done) => {
      const emailContent = 'Subject: Test\nFrom: test@example.com\n\nTest email content';
      const mockOutput = '0 / 0\nContent analysis details:\n';

      // Mock successful process execution
      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockSpamcProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(mockOutput)), 5);
        }
      });

      mockSpamcProcess.stdin.write.mockReturnValue(true);

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.score).toBe('0 / 0');
        expect(result.decision).toBe('Scan Complete (No Rules)');
        expect(spawn).toHaveBeenCalledWith('spamc', ['-R'], { stdio: ['pipe', 'pipe', 'pipe'] });
        done();
      }).catch(done);
    });

    test('should handle chunked writing for larger emails', async (done) => {
      const emailContent = 'x'.repeat(200 * 1024); // 200KB - should trigger chunking
      const mockOutput = '2.5 / 5\nContent analysis details:\n2.5 TEST_RULE Test rule triggered\n';

      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockSpamcProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(mockOutput)), 5);
        }
      });

      mockSpamcProcess.stdin.write.mockReturnValue(true);

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.score).toBe('2.5 / 5');
        expect(result.decision).toBe('Suspicious Content');
        expect(mockSpamcProcess.stdin.write).toHaveBeenCalled();
        done();
      }).catch(done);
    });

    test('should detect spam correctly', async (done) => {
      const emailContent = 'Subject: URGENT LOTTERY WIN\n\nYou have won $1,000,000!';
      const mockOutput = '15.2 / 5\nSpam\nContent analysis details:\n5.0 LOTTERY_SPAM Lottery spam detected\n10.2 URGENT_SUBJECT Urgent subject line\n';

      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockSpamcProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(mockOutput)), 5);
        }
      });

      mockSpamcProcess.stdin.write.mockReturnValue(true);

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.score).toBe('15.2 / 5');
        expect(result.decision).toBe('Spam Detected');
        expect(result.details).toHaveLength(2);
        expect(result.details[0].ruleName).toBe('LOTTERY_SPAM');
        expect(result.details[1].ruleName).toBe('URGENT_SUBJECT');
        done();
      }).catch(done);
    });
  });

  describe('Error Handling', () => {
    test('should handle process spawn errors', async (done) => {
      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('spawn error')), 10);
        }
      });

      const resultPromise = scanEmailWithSpamAssassin('test email');
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Service Unavailable');
        expect(result.score).toBe('Unavailable');
        done();
      }).catch(done);
    });

    test('should handle process exit with error code', async (done) => {
      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(1), 10); // Exit with error code 1
        }
      });

      const resultPromise = scanEmailWithSpamAssassin('test email');
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Scan Failed');
        expect(result.score).toBe('Error');
        done();
      }).catch(done);
    });

    test('should handle stdin write errors', async (done) => {
      const emailContent = 'test email';

      mockSpamcProcess.stdin.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('EPIPE')), 10);
        }
      });

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Cannot Send Content');
        expect(result.score).toBe('Communication Error');
        done();
      }).catch(done);
    });

    test('should handle timeout', async (done) => {
      const emailContent = 'test email';

      // Don't trigger any events - should timeout
      mockSpamcProcess.on.mockImplementation(() => {});
      mockSpamcProcess.stdout.on.mockImplementation(() => {});
      mockSpamcProcess.stderr.on.mockImplementation(() => {});
      mockSpamcProcess.stdin.on.mockImplementation(() => {});

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Scan Timeout');
        expect(result.score).toBe('Timeout');
        expect(mockSpamcProcess.kill).toHaveBeenCalledWith('SIGKILL');
        done();
      }).catch(done);
    }, 15000); // Allow time for timeout

    test('should handle empty SpamAssassin output', async (done) => {
      const emailContent = 'test email';

      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockSpamcProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('')), 5);
        }
      });

      mockSpamcProcess.stdin.write.mockReturnValue(true);

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Empty Response');
        expect(result.score).toBe('No Output');
        done();
      }).catch(done);
    });

    test('should handle malformed SpamAssassin output', async (done) => {
      const emailContent = 'test email';
      const mockOutput = 'Invalid output format\nNot parseable\n';

      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockSpamcProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(mockOutput)), 5);
        }
      });

      mockSpamcProcess.stdin.write.mockReturnValue(true);

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.score).toBe('Invalid output format');
        expect(result.decision).toBe('Unknown');
        done();
      }).catch(done);
    });

    test('should handle stdin becoming unwritable', async (done) => {
      const emailContent = 'test email';
      
      mockSpamcProcess.stdin.writable = false;

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Cannot Send Content');
        expect(result.score).toBe('Communication Error');
        done();
      }).catch(done);
    });
  });

  describe('Chunked Writing', () => {
    test('should handle drain events during chunked writing', async (done) => {
      const emailContent = 'x'.repeat(200 * 1024); // Large enough to trigger chunking
      const mockOutput = '0 / 0\n';

      mockSpamcProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => callback(0), 50);
        }
      });

      mockSpamcProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(mockOutput)), 25);
        }
      });

      // Simulate buffer full scenario
      let writeCallCount = 0;
      mockSpamcProcess.stdin.write.mockImplementation(() => {
        writeCallCount++;
        return writeCallCount % 2 === 0; // Return false every other call to simulate buffer full
      });

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.score).toBe('0 / 0');
        expect(mockSpamcProcess.stdin.write).toHaveBeenCalled();
        done();
      }).catch(done);
    });

    test('should handle write timeout during chunked writing', async (done) => {
      const emailContent = 'x'.repeat(200 * 1024);

      // Mock stdin.write to always return false (buffer always full)
      mockSpamcProcess.stdin.write.mockReturnValue(false);
      
      // Never trigger drain event to simulate timeout
      mockSpamcProcess.stdin.on.mockImplementation(() => {});

      const resultPromise = scanEmailWithSpamAssassin(emailContent);
      
      resultPromise.then(result => {
        expect(result.decision).toBe('Write Timeout');
        expect(result.score).toBe('Timeout');
        done();
      }).catch(done);
    }, 8000);
  });
}); 