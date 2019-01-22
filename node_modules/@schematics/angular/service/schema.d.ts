/**
 * Creates a new, generic service definition in the given or default project.
 */
export interface Schema {
    /**
     * When true (the default), creates files at the top level of the project.
     */
    flat?: boolean;
    /**
     * When true, applies lint fixes after generating the pipe.
     */
    lintFix?: boolean;
    /**
     * The name of the service.
     */
    name: string;
    /**
     * The path at which to create the service, relative to the workspace root.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * When true (the default), generates a  "spec.ts" test file for the new service.
     */
    spec?: boolean;
}
