/**
 * Generates a new, generic end-to-end test definition for the given or default project.
 */
export interface Schema {
    /**
     * The name of the new e2e app.
     */
    name: string;
    /**
     * The root folder for the new test app.
     */
    projectRoot?: string;
    /**
     * The name of the app being tested.
     */
    relatedAppName: string;
    /**
     * The HTML selector for the root component of the test app.
     */
    rootSelector?: string;
}
