/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { experimental, virtualFs } from '@angular-devkit/core';
export declare class WorkspaceLoader {
    private _host;
    private _configFileNames;
    constructor(_host: virtualFs.Host);
    loadWorkspace(projectPath?: string): Promise<experimental.workspace.Workspace>;
    private _getProjectWorkspaceFilePath;
    private _loadWorkspaceFromPath;
}
