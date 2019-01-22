export interface Schema {
    /**
     * Initial repository commit information.
     */
    commit?: null | Commit;
    /**
     * When true, links the CLI to the global version (internal development only).
     */
    linkCli?: boolean;
    /**
     * When true, creates a project without any testing frameworks
     */
    minimal?: boolean;
    /**
     * The name of the workspace.
     */
    name: string;
    /**
     * The path where new projects will be created.
     */
    newProjectRoot?: string;
    /**
     * When true, does not initialize a git repository.
     */
    skipGit?: boolean;
    /**
     * When true, does not install packages for dependencies.
     */
    skipInstall?: boolean;
    /**
     * The version of the Angular CLI to use.
     */
    version: string;
}
export interface Commit {
    email: string;
    message?: string;
    name: string;
}
