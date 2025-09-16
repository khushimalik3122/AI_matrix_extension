"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitIntegration = void 0;
const logger_1 = require("../utils/logger");
class GitIntegration {
    constructor(providerManager) {
        this.providerManager = providerManager;
    }
    /**
     * Generates a conventional commit message based on code changes (diff).
     * @param diff The git diff of the staged changes.
     * @returns A formatted conventional commit message.
     */
    async generateCommitMessage(diff) {
        if (diff.trim().length === 0)
            return null;
        const prompt = `
            You are an expert developer. Based on the following git diff, write a concise and informative conventional commit message.
            The message must follow the Conventional Commits specification.
            
            Format: <type>[optional scope]: <description>
            
            [optional body]
            
            [optional footer]

            - The subject line must be 50 characters or less.
            - Type must be one of: feat, fix, build, chore, ci, docs, style, refactor, perf, test.
            - Provide only the commit message, with no other text or explanation.

            Git Diff:
            ---
            ${diff}
            ---
        `;
        try {
            return await this.providerManager.generateResponse(prompt, { temperature: 0.0 });
        }
        catch (error) {
            logger_1.logger.error(`Error generating commit message: ${error.message}`);
            return "fix: unexpected error during commit message generation";
        }
    }
    /**
     * Creates a pull request description from a diff and branch name.
     * @param diff The git diff of the entire branch.
     * @param branchName The name of the branch being merged.
     * @returns A formatted pull request description in Markdown.
     */
    async generatePullRequestDescription(diff, branchName) {
        const prompt = `
            You are a senior technical lead. Write a comprehensive pull request description in Markdown for the changes described in the following git diff.
            The branch name is '${branchName}'.

            The description should have three sections:
            1.  **Summary:** A high-level overview of the changes and the problem being solved.
            2.  **Changes Made:** A bulleted list of the specific changes.
            3.  **Testing:** Instructions on how to test and verify the changes.

            Git Diff:
            ---
            ${diff}
            ---
        `;
        try {
            return await this.providerManager.generateResponse(prompt, { maxTokens: 1024 });
        }
        catch (error) {
            logger_1.logger.error(`Error generating PR description: ${error.message}`);
            return `### Error\nCould not generate PR description: ${error.message}`;
        }
    }
    /**
     * Summarizes code review comments into a concise report.
     * @param comments A string containing all the comments from a code review.
     * @returns A summary of the code review feedback.
     */
    async summarizeCodeReview(comments) {
        const prompt = `
            As an engineering manager, summarize the following code review comments.
            Group the feedback into key themes and identify the most critical action items.

            Code Review Comments:
            ---
            ${comments}
            ---

            Provide a summary in Markdown with sections for "Key Feedback" and "Action Items".
        `;
        try {
            return await this.providerManager.generateResponse(prompt);
        }
        catch (error) {
            logger_1.logger.error(`Error summarizing code review: ${error.message}`);
            return `### Error\nCould not summarize review: ${error.message}`;
        }
    }
    /**
     * Suggests a conventional branch name based on a task description.
     * @param taskDescription A natural language description of the task.
     * @returns A suggested branch name (e.g., 'feat/add-login-button').
     */
    async suggestBranchName(taskDescription) {
        const prompt = `
            You are a Git expert. Based on the following task description, suggest a concise, conventional branch name.
            The format should be 'type/short-description-in-kebab-case'.
            - 'type' should be one of: feat, fix, chore, docs, refactor, test.
            - Provide only the branch name and nothing else.

            Task: "${taskDescription}"
        `;
        try {
            const response = await this.providerManager.generateResponse(prompt, { temperature: 0.0 });
            return response.trim().replace(/\s+/g, '-'); // Ensure no spaces
        }
        catch (error) {
            logger_1.logger.error(`Error suggesting branch name: ${error.message}`);
            return "fix/branch-name-generation-error";
        }
    }
}
exports.GitIntegration = GitIntegration;
//# sourceMappingURL=gitIntegration.js.map