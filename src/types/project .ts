/**
 * Represents a single file to be generated as part of a project.
 */
export interface GeneratedFile {
    /**
     * The path of the file, relative to the project root.
     * e.g., 'src/app.js' or 'package.json'
     */
    path: string;

    /**
     * The content of the file.
     */
    content: string;
}

/**
 * Represents the complete structure and content of a project to be generated.
 */
export interface ProjectBlueprint {
    /**
     * A descriptive name for the project.
     */
    projectName: string;

    /**
     * An array of files to be created in the project.
     */
    files: GeneratedFile[];
}
