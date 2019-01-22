"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const find_up_1 = require("../utilities/find-up");
class WorkspaceLoader {
    constructor(_host) {
        this._host = _host;
        // TODO: add remaining fallbacks.
        this._configFileNames = [
            core_1.normalize('.angular.json'),
            core_1.normalize('angular.json'),
        ];
    }
    loadWorkspace(projectPath) {
        return this._loadWorkspaceFromPath(this._getProjectWorkspaceFilePath(projectPath));
    }
    // TODO: do this with the host instead of fs.
    _getProjectWorkspaceFilePath(projectPath) {
        // Find the workspace file, either where specified, in the Angular CLI project
        // (if it's in node_modules) or from the current process.
        const workspaceFilePath = (projectPath && find_up_1.findUp(this._configFileNames, projectPath))
            || find_up_1.findUp(this._configFileNames, process.cwd())
            || find_up_1.findUp(this._configFileNames, __dirname);
        if (workspaceFilePath) {
            return core_1.normalize(workspaceFilePath);
        }
        else {
            throw new Error(`Local workspace file ('angular.json') could not be found.`);
        }
    }
    _loadWorkspaceFromPath(workspacePath) {
        const workspaceRoot = core_1.dirname(workspacePath);
        const workspaceFileName = core_1.basename(workspacePath);
        const workspace = new core_1.experimental.workspace.Workspace(workspaceRoot, this._host);
        return workspace.loadWorkspaceFromHost(workspaceFileName).toPromise();
    }
}
exports.WorkspaceLoader = WorkspaceLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvbW9kZWxzL3dvcmtzcGFjZS1sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQ0FPOEI7QUFDOUIsa0RBQThDO0FBRzlDLE1BQWEsZUFBZTtJQU0xQixZQUFvQixLQUFxQjtRQUFyQixVQUFLLEdBQUwsS0FBSyxDQUFnQjtRQUx6QyxpQ0FBaUM7UUFDekIscUJBQWdCLEdBQUc7WUFDekIsZ0JBQVMsQ0FBQyxlQUFlLENBQUM7WUFDMUIsZ0JBQVMsQ0FBQyxjQUFjLENBQUM7U0FDMUIsQ0FBQztJQUMyQyxDQUFDO0lBRTlDLGFBQWEsQ0FBQyxXQUFvQjtRQUNoQyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBRUQsNkNBQTZDO0lBQ3JDLDRCQUE0QixDQUFDLFdBQW9CO1FBQ3ZELDhFQUE4RTtRQUM5RSx5REFBeUQ7UUFDekQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFdBQVcsSUFBSSxnQkFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsQ0FBQztlQUNoRixnQkFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7ZUFDNUMsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFOUMsSUFBSSxpQkFBaUIsRUFBRTtZQUNyQixPQUFPLGdCQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUNyQzthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQywyREFBMkQsQ0FBQyxDQUFDO1NBQzlFO0lBQ0gsQ0FBQztJQUVPLHNCQUFzQixDQUFDLGFBQW1CO1FBQ2hELE1BQU0sYUFBYSxHQUFHLGNBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QyxNQUFNLGlCQUFpQixHQUFHLGVBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNsRCxNQUFNLFNBQVMsR0FBRyxJQUFJLG1CQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWxGLE9BQU8sU0FBUyxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDeEUsQ0FBQztDQUNGO0FBbENELDBDQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUGF0aCxcbiAgYmFzZW5hbWUsXG4gIGRpcm5hbWUsXG4gIGV4cGVyaW1lbnRhbCxcbiAgbm9ybWFsaXplLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGZpbmRVcCB9IGZyb20gJy4uL3V0aWxpdGllcy9maW5kLXVwJztcblxuXG5leHBvcnQgY2xhc3MgV29ya3NwYWNlTG9hZGVyIHtcbiAgLy8gVE9ETzogYWRkIHJlbWFpbmluZyBmYWxsYmFja3MuXG4gIHByaXZhdGUgX2NvbmZpZ0ZpbGVOYW1lcyA9IFtcbiAgICBub3JtYWxpemUoJy5hbmd1bGFyLmpzb24nKSxcbiAgICBub3JtYWxpemUoJ2FuZ3VsYXIuanNvbicpLFxuICBdO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9ob3N0OiB2aXJ0dWFsRnMuSG9zdCkgeyB9XG5cbiAgbG9hZFdvcmtzcGFjZShwcm9qZWN0UGF0aD86IHN0cmluZyk6IFByb21pc2U8ZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2U+IHtcbiAgICByZXR1cm4gdGhpcy5fbG9hZFdvcmtzcGFjZUZyb21QYXRoKHRoaXMuX2dldFByb2plY3RXb3Jrc3BhY2VGaWxlUGF0aChwcm9qZWN0UGF0aCkpO1xuICB9XG5cbiAgLy8gVE9ETzogZG8gdGhpcyB3aXRoIHRoZSBob3N0IGluc3RlYWQgb2YgZnMuXG4gIHByaXZhdGUgX2dldFByb2plY3RXb3Jrc3BhY2VGaWxlUGF0aChwcm9qZWN0UGF0aD86IHN0cmluZyk6IFBhdGgge1xuICAgIC8vIEZpbmQgdGhlIHdvcmtzcGFjZSBmaWxlLCBlaXRoZXIgd2hlcmUgc3BlY2lmaWVkLCBpbiB0aGUgQW5ndWxhciBDTEkgcHJvamVjdFxuICAgIC8vIChpZiBpdCdzIGluIG5vZGVfbW9kdWxlcykgb3IgZnJvbSB0aGUgY3VycmVudCBwcm9jZXNzLlxuICAgIGNvbnN0IHdvcmtzcGFjZUZpbGVQYXRoID0gKHByb2plY3RQYXRoICYmIGZpbmRVcCh0aGlzLl9jb25maWdGaWxlTmFtZXMsIHByb2plY3RQYXRoKSlcbiAgICAgIHx8IGZpbmRVcCh0aGlzLl9jb25maWdGaWxlTmFtZXMsIHByb2Nlc3MuY3dkKCkpXG4gICAgICB8fCBmaW5kVXAodGhpcy5fY29uZmlnRmlsZU5hbWVzLCBfX2Rpcm5hbWUpO1xuXG4gICAgaWYgKHdvcmtzcGFjZUZpbGVQYXRoKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplKHdvcmtzcGFjZUZpbGVQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBMb2NhbCB3b3Jrc3BhY2UgZmlsZSAoJ2FuZ3VsYXIuanNvbicpIGNvdWxkIG5vdCBiZSBmb3VuZC5gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9sb2FkV29ya3NwYWNlRnJvbVBhdGgod29ya3NwYWNlUGF0aDogUGF0aCkge1xuICAgIGNvbnN0IHdvcmtzcGFjZVJvb3QgPSBkaXJuYW1lKHdvcmtzcGFjZVBhdGgpO1xuICAgIGNvbnN0IHdvcmtzcGFjZUZpbGVOYW1lID0gYmFzZW5hbWUod29ya3NwYWNlUGF0aCk7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gbmV3IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlKHdvcmtzcGFjZVJvb3QsIHRoaXMuX2hvc3QpO1xuXG4gICAgcmV0dXJuIHdvcmtzcGFjZS5sb2FkV29ya3NwYWNlRnJvbUhvc3Qod29ya3NwYWNlRmlsZU5hbWUpLnRvUHJvbWlzZSgpO1xuICB9XG59XG4iXX0=