export interface Schema {
    /**
     * Initial git repository commit information.
     */
    commit?: CommitUnion;
    /**
     * When true (the default), creates a new initial app project in the new workspace.
     */
    createApplication?: boolean;
    /**
     * The directory name to create the workspace in.
     */
    directory?: string;
    /**
     * EXPERIMENTAL: When true, creates a new app that uses the Ivy rendering engine.
     */
    experimentalIvy?: boolean;
    /**
     * When true, includes styles inline in the component TS file. By default, an external
     * styles file is created and referenced in the component TS file.
     */
    inlineStyle?: boolean;
    /**
     * When true, includes template inline in the component TS file. By default, an external
     * template file is created and referenced in the component TS file.
     */
    inlineTemplate?: boolean;
    /**
     * When true, links the CLI to the global version (internal development only).
     */
    linkCli?: boolean;
    /**
     * When true, creates a project without any testing frameworks.
     */
    minimal?: boolean;
    /**
     * The name of the new workspace and initial project.
     */
    name: string;
    /**
     * The path where new projects will be created, relative to the new workspace root.
     */
    newProjectRoot?: string;
    /**
     * The prefix to apply to generated selectors for the initial project.
     */
    prefix?: string;
    /**
     * When true, generates a routing module for the initial project.
     */
    routing?: boolean;
    /**
     * When true, does not initialize a git repository.
     */
    skipGit?: boolean;
    /**
     * When true, does not install dependency packages.
     */
    skipInstall?: boolean;
    /**
     * When true, does not generate "spec.ts" test files for the new project.
     */
    skipTests?: boolean;
    /**
     * The file extension to use for style files.
     */
    style?: string;
    /**
     * The version of the Angular CLI to use.
     */
    version: string;
    /**
     * The view encapsulation strategy to use in the initial project.
     */
    viewEncapsulation?: ViewEncapsulation;
}
/**
 * Initial git repository commit information.
 */
export declare type CommitUnion = boolean | CommitObject;
export interface CommitObject {
    email: string;
    message?: string;
    name: string;
}
/**
 * The view encapsulation strategy to use in the initial project.
 */
export declare enum ViewEncapsulation {
    Emulated = "Emulated",
    Native = "Native",
    None = "None",
    ShadowDOM = "ShadowDom"
}
