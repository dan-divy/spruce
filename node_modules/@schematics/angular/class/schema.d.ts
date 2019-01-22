/**
 * Creates a new generic class definition in the given or default project.
 */
export interface Schema {
    /**
     * The name of the new class.
     */
    name: string;
    /**
     * The path at which to create the class, relative to the workspace root.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project: string;
    /**
     * When true, generates a "spec.ts" test file for the new class.
     */
    spec?: boolean;
    /**
     * Adds a developer-defined type to the filename, in the format "name.type.ts".
     */
    type?: string;
}
