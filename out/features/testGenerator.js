"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGenerator = void 0;
const logger_1 = require("../utils/logger");
class TestGenerator {
    constructor(providerManager, codeParser) {
        this.providerManager = providerManager;
        this.codeParser = codeParser;
    }
    /**
     * Generates unit tests for a selected function or class.
     * @param document The document containing the code.
     * @param range The range of the code to test.
     * @param framework The testing framework to use.
     * @returns The generated test code as a string.
     */
    async generateUnitTests(document, range, framework) {
        const codeToTest = document.getText(range);
        if (codeToTest.trim().length === 0)
            return null;
        const prompt = `
            You are a software quality assurance engineer. Your task is to write a complete, runnable unit test file for the following code snippet.
            
            Instructions:
            1. Use the '${framework}' testing framework and its assertion library (e.g., Jest's expect, Chai's assert).
            2. Cover the happy path, edge cases, and potential error conditions.
            3. Generate mock data and mock any imported dependencies where necessary.
            4. The response should be only the code for the test file. Do not include explanations or markdown.

            Code to test (${document.languageId}):
            ---
            ${codeToTest}
            ---
        `;
        try {
            return await this.providerManager.generateResponse({ prompt, temperature: 0.1 });
        }
        catch (error) {
            logger_1.logger.error(`Error generating unit tests: ${error.message}`);
            return `// Sorry, an error occurred while generating tests: ${error.message}`;
        }
    }
    /**
     * Scaffolds an integration test for a component or module.
     * @param document The document representing the module to test.
     * @returns The generated integration test code.
     */
    async scaffoldIntegrationTest(document, framework) {
        const fileContent = document.getText();
        const prompt = `
            You are a senior QA architect. Create a scaffolding for an integration test file for the following module.
            The goal is to test how this module interacts with other parts of a hypothetical system.

            Instructions:
            1. Use the '${framework}' testing framework.
            2. Identify the primary functions/classes exposed by this module.
            3. Write a test suite structure with placeholder tests (e.g., using 'it.todo()' or comments) for realistic integration scenarios.
            4. Include setup and teardown logic (e.g., 'beforeEach', 'afterAll') for things like database connections or server setup.
            5. Return only the code for the test file.

            Module to create integration test for (${document.fileName}):
            ---
            ${fileContent.substring(0, 4000)}
            ---
        `;
        try {
            return await this.providerManager.generateResponse({ prompt, maxTokens: 1500 });
        }
        catch (error) {
            logger_1.logger.error(`Error scaffolding integration test: ${error.message}`);
            return `// Sorry, an error occurred while scaffolding the test: ${error.message}`;
        }
    }
    /**
     * Analyzes code and suggests test cases required for high code coverage.
     * @param document The document containing the code.
     * @param range The range of the code to analyze.
     * @returns A markdown string listing suggested test cases.
     */
    async suggestCoverageCases(document, range) {
        const codeToAnalyze = document.getText(range);
        if (codeToAnalyze.trim().length === 0)
            return null;
        const prompt = `
            As a test engineer, analyze the following code snippet and identify all the logical paths and conditions that need to be tested to achieve high code coverage.
            Do not write the tests themselves. Instead, provide a checklist of test scenarios.

            Code to analyze:
            ---
            ${codeToAnalyze}
            ---

            Provide a response in Markdown format, listing the scenarios needed to test every 'if/else' branch, loop condition, and 'try/catch' block.
        `;
        try {
            return await this.providerManager.generateResponse({ prompt });
        }
        catch (error) {
            logger_1.logger.error(`Error suggesting coverage cases: ${error.message}`);
            return `### Error\nCould not analyze code for coverage: ${error.message}`;
        }
    }
}
exports.TestGenerator = TestGenerator;
//# sourceMappingURL=testGenerator.js.map