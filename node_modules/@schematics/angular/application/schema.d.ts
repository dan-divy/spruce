/**
 * Generates a new basic app definition in the "projects" subfolder of the workspace.
 */
export interface Schema {
    /**
     * EXPERIMENTAL: True to create a new app that uses the Ivy rendering engine.
     */
    experimentalIvy?: boolean;
    /**
     * When true, includes styles inline in the root component.ts file. Only CSS styles can be
     * included inline. Default is false, meaning that an external styles file is created and
     * referenced in the root component.ts file.
     */
    inlineStyle?: boolean;
    /**
     * When true, includes template inline in the root component.ts file. Default is false,
     * meaning that an external template file is created and referenced in the root component.ts
     * file.
     */
    inlineTemplate?: boolean;
    /**
     * When true, creates a bare-bones project without any testing frameworks.
     */
    minimal?: boolean;
    /**
     * The name of the new app.
     */
    name: string;
    /**
     * A prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * The root directory of the new app.
     */
    projectRoot?: string;
    /**
     * When true, creates a routing NgModule.
     */
    routing?: boolean;
    /**
     * Skip installing dependency packages.
     */
    skipInstall?: boolean;
    /**
     * When true, does not add dependencies to the "package.json" file.
     */
    skipPackageJson?: boolean;
    /**
     * When true, does not create "spec.ts" test files for the app.
     */
    skipTests?: boolean;
    /**
     * The file extension to use for style files.
     */
    style?: string;
    /**
     * The view encapsulation strategy to use in the new app.
     */
    viewEncapsulation?: ViewEncapsulation;
}
/**
 * The view encapsulation strategy to use in the new app.
 */
export declare enum ViewEncapsulation {
    Emulated = "Emulated",
    Native = "Native",
    None = "None",
    ShadowDOM = "ShadowDom"
}
