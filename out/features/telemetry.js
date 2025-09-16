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
exports.TelemetryService = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
// A basic, privacy-focused telemetry service.
// In a real extension, you would use a service like Application Insights.
class TelemetryService {
    constructor(extensionId, extensionVersion) {
        // Check VS Code's global telemetry setting
        this.isEnabled = vscode.workspace.getConfiguration('telemetry').get('enableTelemetry', true);
        // This is a mock sender. Replace with a real one for production.
        this.reporter = {
            sendEventData: (eventName, data) => {
                if (this.isEnabled) {
                    logger_1.logger.log(`[TELEMETRY] Event: ${eventName}`, data);
                }
            },
            sendErrorData: (error, data) => {
                if (this.isEnabled) {
                    logger_1.logger.error(`[TELEMETRY] Error: ${error.name}`, data);
                }
            },
            dispose: () => { }
        };
        if (!this.isEnabled) {
            logger_1.logger.log("Telemetry is disabled by user settings.");
        }
    }
    /**
     * Sends a telemetry event.
     * @param eventName A unique name for the event.
     * @param properties Optional properties to include with the event.
     */
    sendEvent(eventName, properties) {
        this.reporter.sendEventData(eventName, properties);
    }
    /**
     * Sends an error event.
     * @param error The error object.
     * @param properties Optional properties to include with the error.
     */
    sendError(error, properties) {
        this.reporter.sendErrorData(error, properties);
    }
    dispose() {
        this.reporter.dispose();
    }
}
exports.TelemetryService = TelemetryService;
//# sourceMappingURL=telemetry.js.map