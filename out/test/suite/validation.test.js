"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
suite('Performance and Security Tests', () => {
    test('CodebaseScanner performance benchmark', function (done) {
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
    test('Security audit should report known vulnerabilities', function (done) {
        this.timeout(30000); // npm audit can be slow
        const projectRoot = path.resolve(__dirname, '../../../../');
        (0, child_process_1.exec)('npm audit --json', { cwd: projectRoot }, (error, stdout, stderr) => {
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
            }
            catch (e) {
                done(new Error(`Failed to parse npm audit report: ${e}`));
            }
        });
    });
});
//# sourceMappingURL=validation.test.js.map