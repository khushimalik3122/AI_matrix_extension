"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintGenerator = void 0;
const logger_1 = require("../utils/logger");
class BlueprintGenerator {
    constructor(providerManager) {
        this.providerManager = providerManager;
    }
    /**
     * Takes a high-level ProjectBlueprint and generates a detailed technical plan.
     * @param blueprint The high-level project requirements.
     * @returns A DetailedBlueprint containing file structures, dependencies, etc.
     */
    async generate(blueprint) {
        const prompt = this.constructPrompt(blueprint);
        try {
            logger_1.logger.log("Generating detailed blueprint from AI...");
            const response = await this.providerManager.generateResponse(prompt, {
                temperature: 0.0, // We want deterministic output for planning
                maxTokens: 4096,
            });
            const detailedBlueprint = this.parseJsonResponse(response);
            // Basic validation
            if (!detailedBlueprint.fileStructure || !detailedBlueprint.dependencies) {
                throw new Error("AI response is missing required fields 'fileStructure' or 'dependencies'.");
            }
            logger_1.logger.log(`Successfully generated blueprint with ${detailedBlueprint.fileStructure.length} files and ${detailedBlueprint.dependencies.length} dependencies.`);
            return detailedBlueprint;
        }
        catch (error) {
            logger_1.logger.error(`Error generating detailed blueprint: ${error.message}`);
            return null;
        }
    }
    constructPrompt(blueprint) {
        return `
            You are a senior software architect responsible for planning a new project.
            Based on the following high-level requirements, generate a complete and detailed technical blueprint.

            High-Level Requirements:
            ---
            Project Name: ${blueprint.projectName}
            Project Type: ${blueprint.projectType}
            Technologies: ${blueprint.technologies.join(', ')}
            Features:
            - ${blueprint.features.join('\n- ')}
            Summary: ${blueprint.summary}
            ---

            Your task is to generate a detailed plan that a junior developer can follow to scaffold the entire project.
            Your response MUST be a single, valid JSON object with NO other text or markdown.
            The JSON object must conform to the following schema:

            \`\`\`json
            {
              "fileStructure": [{ "path": "string", "content": "string" }],
              "dependencies": [{ "name": "string", "version": "string", "type": "'production' | 'development'" }],
              "apiEndpoints": [{ "path": "string", "method": "'GET' | 'POST' | ...", "description": "string" }],
              "databaseSchemas": [{ "tableName": "string", "description": "string", "columns": [{ "name": "string", "type": "string", ... }] }]
            }
            \`\`\`

            Instructions:
            1.  **fileStructure**: Create a logical directory structure. Include boilerplate content for key files (e.g., package.json, main entry points, example components). For a web app, include basic HTML, CSS, and JS.
            2.  **dependencies**: List all necessary libraries and tools. Use "latest" for version numbers. Distinguish between 'production' and 'development' dependencies.
            3.  **apiEndpoints**: If the project is a 'backend-api' or a 'web-app' with a server, define the RESTful API endpoints.
            4.  **databaseSchemas**: If the project requires a database, define the necessary tables, columns, and relationships.
        `;
    }
    parseJsonResponse(jsonString) {
        try {
            const match = jsonString.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw new Error("No valid JSON object found in the response.");
        }
        catch (error) {
            logger_1.logger.error(`Failed to parse JSON response for blueprint: ${jsonString}`);
            throw new Error("The AI returned an invalid JSON format for the detailed blueprint.");
        }
    }
}
exports.BlueprintGenerator = BlueprintGenerator;
//# sourceMappingURL=blueprintGenerator.js.map