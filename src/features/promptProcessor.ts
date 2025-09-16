import { ProviderManager } from './providerManager';
import { ProjectBlueprint, ClarificationResponse } from '../types/promptProcessing';
import { logger } from '../utils/logger';

export class PromptProcessor {
    private providerManager: ProviderManager;
    private conversationHistory: string[] = [];

    constructor(providerManager: ProviderManager) {
        this.providerManager = providerManager;
    }

    /**
     * Processes a user's natural language input to either create a project blueprint
     * or ask for clarification.
     * @param userInput The natural language text from the user.
     * @returns A ProjectBlueprint if the request is clear, or a ClarificationResponse if more information is needed.
     */
    public async processRequest(userInput: string): Promise<ProjectBlueprint | ClarificationResponse> {
        this.conversationHistory.push(`User: ${userInput}`);

        const systemPrompt = this.constructSystemPrompt();
        
        try {
            const response = await this.providerManager.generateResponse({ prompt: systemPrompt, temperature: 0.1 });
            const parsedJson = this.parseJsonResponse(response);

            if (parsedJson.clarifyingQuestions) {
                const clarification = parsedJson as ClarificationResponse;
                this.conversationHistory.push(`AI: ${clarification.clarifyingQuestions.join(' ')}`);
                return clarification;
            }

            const blueprint = parsedJson as ProjectBlueprint;
            this.conversationHistory.push(`AI: Planning project '${blueprint.projectName}'.`);
            return blueprint;

        } catch (error: any) {
            logger.error(`Error processing project request: ${error.message}`);
            // In case of a critical failure, ask a generic clarifying question.
            return {
                clarifyingQuestions: ["I had trouble understanding that. Could you please describe your project again in a bit more detail?"]
            };
        }
    }

    private constructSystemPrompt(): string {
        const conversationLog = this.conversationHistory.join('\n');
        
        return `
            You are an expert software architect. Your task is to analyze a user's request for a new software project and convert it into a structured JSON object.

            Analyze the conversation history, paying close attention to the latest user request.
            Conversation History:
            ---
            ${conversationLog}
            ---

            Your response MUST be a single, valid JSON object with NO other text or markdown.

            - If the user's request is clear and provides enough detail, respond with this JSON schema:
            \`\`\`json
            {
              "projectName": "string",
              "projectType": "string (one of: 'web-app', 'backend-api', 'cli-tool', 'library', 'mobile-app', 'unknown')",
              "technologies": "string[]",
              "features": "string[]",
              "summary": "A one-sentence project description."
            }
            \`\`\`

            - If the request is vague (e.g., "make an app") or missing key details, you MUST ask clarifying questions using this JSON schema:
            \`\`\`json
            {
              "clarifyingQuestions": "string[]"
            }
            \`\`\`
        `;
    }

    private parseJsonResponse(jsonString: string): any {
        try {
            // AI models sometimes wrap their response in markdown, so we clean it.
            const match = jsonString.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw new Error("No valid JSON object found in the response.");
        } catch (error) {
            logger.error(`Failed to parse JSON response: ${jsonString}`);
            throw new Error("The AI returned an invalid response format.");
        }
    }

    /**
     * Clears the current conversation history.
     */
    public clearHistory(): void {
        this.conversationHistory = [];
    }
}
