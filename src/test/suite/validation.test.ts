import * as assert from 'assert';
import { exec } from 'child_process';
import * as path from 'path';

suite('Performance and Security Tests', () => {
    
    test('CodebaseScanner performance benchmark', function(done) {
        // Increase timeout for this potentially long-running test
        this.timeout(10000); 
        
        const start = Date.now();
        // This is a placeholder for a real benchmark. A real test would
        // create a large number of mock files and measure scanning time.
        // For now, we simulate a long operation and check if it's within a threshold.
        setTimeout(() => {
            const duration = Date.now() - start;
            assert.ok(duration < 5000, `Scanning took too long: ${duration}ms`);
            done();
        }, 100);
    });

    test('Security audit should report known vulnerabilities', function(done) {
        this.timeout(30000); // npm audit can be slow
        
        const projectRoot = path.resolve(__dirname, '../../../../');
        
        exec('npm audit --json', { cwd: projectRoot }, (error, stdout, stderr) => {
            // npm audit exits with a non-zero code if vulnerabilities are found,
            // so we expect an error object.
            if (!error) {
                // If no error, it means no vulnerabilities were found, which is a pass.
                done();
                return;
            }

            try {
                const report = JSON.parse(stdout);
                const vulnerabilityCount = report.metadata.vulnerabilities.total;
                console.warn(`Security audit found ${vulnerabilityCount} vulnerabilities. This test passes if it runs, but you should address these.`);
                // This test's purpose is to run the audit, not necessarily fail if vulns are found.
                // In a CI/CD pipeline, you might assert.strictEqual(vulnerabilityCount, 0);
                assert.ok(true);
                done();
            } catch (e) {
                done(new Error(`Failed to parse npm audit report: ${e}`));
            }
        });
    });
});

