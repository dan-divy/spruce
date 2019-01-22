/**
 * Extracts i18n messages from source code.
 */
export interface Schema {
    /**
     * A named build target, as specified in the "configurations" section of angular.json.
     * Each named target is accompanied by a configuration of option defaults for that target.
     */
    configuration?: string;
    /**
     * Shows a help message for this command in the console.
     */
    help?: HelpUnion;
    /**
     * When true, sets the build configuration to the production target.
     * All builds make use of bundling and limited tree-shaking. A production build also runs
     * limited dead code elimination.
     */
    prod?: boolean;
    /**
     * The name of the project to build. Can be an app or a library.
     */
    project?: string;
}
/**
 * Shows a help message for this command in the console.
 */
export declare type HelpUnion = boolean | HelpEnum;
export declare enum HelpEnum {
    HelpJSON = "JSON",
    JSON = "json"
}
