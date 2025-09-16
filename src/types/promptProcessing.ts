/**
 * Represents the structured plan for a new software project,
 * as understood by the AI from a user's natural language prompt.
 */
export interface ProjectBlueprint {
    /** A descriptive name for the project, e.g., "my-react-dashboard". */
    projectName: string;
    
    /** The general category of the project. */
    projectType: 'web-app' | 'backend-api' | 'cli-tool' | 'library' | 'mobile-app' | 'unknown';
    
    /** A list of key technologies, frameworks, and libraries. */
    technologies: string[];
    
    /** A list of core features or user stories. */
    features: string[];
    
    /** A brief, one-sentence summary of the project's purpose. */
    summary: string;
}

/**
 * Represents the AI's response when a prompt is too ambiguous
 * to create a full project blueprint.
 */
export interface ClarificationResponse {
    /** A list of questions to ask the user to get the necessary details. */
    clarifyingQuestions: string[];
}
