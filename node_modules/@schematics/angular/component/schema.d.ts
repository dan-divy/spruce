/**
 * Creates a new generic component definition in the given or default project.
 */
export interface Schema {
    /**
     * The change detection strategy to use in the new component.
     */
    changeDetection?: ChangeDetection;
    /**
     * When true, the new component is the entry component of the declaring NgModule.
     */
    entryComponent?: boolean;
    /**
     * When true, the declaring NgModule exports this component.
     */
    export?: boolean;
    /**
     * When true, creates the new files at the top level of the current project.
     */
    flat?: boolean;
    /**
     * When true, includes styles inline in the component.ts file. Only CSS styles can be
     * included inline. By default, an external styles file is created and referenced in the
     * component.ts file.
     */
    inlineStyle?: boolean;
    /**
     * When true, includes template inline in the component.ts file. By default, an external
     * template file is created and referenced in the component.ts file.
     */
    inlineTemplate?: boolean;
    /**
     * When true, applies lint fixes after generating the component.
     */
    lintFix?: boolean;
    /**
     * The declaring NgModule.
     */
    module?: string;
    /**
     * The name of the component.
     */
    name: string;
    /**
     * The path at which to create the component file, relative to the current workspace.
     * Default is a folder with the same name as the component in the project root.
     */
    path?: string;
    /**
     * The prefix to apply to the generated component selector.
     */
    prefix?: string;
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * The HTML selector to use for this component.
     */
    selector?: string;
    /**
     * When true, does not import this component into the owning NgModule.
     */
    skipImport?: boolean;
    /**
     * When true (the default), generates a  "spec.ts" test file for the new component.
     */
    spec?: boolean;
    /**
     * The file extension to use for style files.
     */
    styleext?: string;
    /**
     * The view encapsulation strategy to use in the new component.
     */
    viewEncapsulation?: ViewEncapsulation;
}
/**
 * The change detection strategy to use in the new component.
 */
export declare enum ChangeDetection {
    Default = "Default",
    OnPush = "OnPush"
}
/**
 * The view encapsulation strategy to use in the new component.
 */
export declare enum ViewEncapsulation {
    Emulated = "Emulated",
    Native = "Native",
    None = "None",
    ShadowDOM = "ShadowDom"
}
