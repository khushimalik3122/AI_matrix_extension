/**
 * Represents a single file to be generated in the project structure.
 */
export interface GeneratedFile {
    /** The full path of the file relative to the project root, e.g., "src/components/Button.tsx". */
    path: string;
    /** The initial content of the file. */
    content: string;
}

/**
 * Represents a single dependency for the project (e.g., an npm package).
 */
export interface Dependency {
    /** The name of the package, e.g., "react". */
    name: string;
    /** The version of the package, e.g., "latest" or "^18.2.0". */
    version: string;
    /** The type of dependency. */
    type: 'production' | 'development';
}

/**
 * Represents a single API endpoint for a backend service.
 */
export interface ApiEndpoint {
    /** The URL path, e.g., "/api/users/:id". */
    path: string;
    /** The HTTP method. */
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** A brief description of what the endpoint does. */
    description: string;
}

/**
 * Represents a table in a database.
 */
export interface DatabaseSchema {
    /** The name of the table, e.g., "users". */
    tableName: string;
    /** A brief description of the table's purpose. */
    description: string;
    /** A list of columns in the table. */
    columns: {
        name: string;
        type: string; // e.g., 'VARCHAR(255)', 'INTEGER', 'BOOLEAN'
        isPrimaryKey?: boolean;
        isForeignKey?: boolean;
        references?: string; // e.g., 'posts(id)'
        isNullable?: boolean;
    }[];
}

/**
 * The complete, detailed technical plan for a project, generated from a ProjectBlueprint.
 */
export interface DetailedBlueprint {
    /** A list of all files to be created. */
    fileStructure: GeneratedFile[];
    /** A list of all project dependencies. */
    dependencies: Dependency[];
    /** An optional list of API endpoints to be implemented. */
    apiEndpoints?: ApiEndpoint[];
    /** An optional list of database schemas to be created. */
    databaseSchemas?: DatabaseSchema[];
}
