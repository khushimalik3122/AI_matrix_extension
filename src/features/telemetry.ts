import * as vscode from 'vscode';
import { logger } from '../utils/logger';

// A basic, privacy-focused telemetry service.
// In a real extension, you would use a service like Application Insights.
export class TelemetryService {
    private reporter: vscode.TelemetrySender;
    private isEnabled: boolean;

    constructor(extensionId: string, extensionVersion: string) {
        // Check VS Code's global telemetry setting
        this.isEnabled = vscode.workspace.getConfiguration('telemetry').get<boolean>('enableTelemetry', true);
        
        // This is a mock sender. Replace with a real one for production.
        this.reporter = {
            sendEventData: (eventName, data) => {
                if (this.isEnabled) {
                    logger.log(`[TELEMETRY] Event: ${eventName}`, data);
                }
            },
            sendErrorData: (error, data) => {
                if (this.isEnabled) {
                    logger.error(`[TELEMETRY] Error: ${error.name}`, data);
                }
            },
            dispose: () => {}
        };

        if (!this.isEnabled) {
            logger.log("Telemetry is disabled by user settings.");
        }
    }

    /**
     * Sends a telemetry event.
     * @param eventName A unique name for the event.
     * @param properties Optional properties to include with the event.
     */
    public sendEvent(eventName: string, properties?: { [key: string]: string }): void {
        this.reporter.sendEventData(eventName, properties);
    }

    /**
     * Sends an error event.
     * @param error The error object.
     * @param properties Optional properties to include with the error.
     */
    public sendError(error: Error, properties?: { [key: string]: string }): void {
        this.reporter.sendErrorData(error, properties);
    }

    public dispose(): void {
        this.reporter.dispose();
    }
}

