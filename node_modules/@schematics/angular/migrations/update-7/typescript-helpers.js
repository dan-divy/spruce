"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const dependencies_1 = require("../../utility/dependencies");
const json_utils_1 = require("../../utility/json-utils");
const latest_versions_1 = require("../../utility/latest-versions");
function typeScriptHelpersRule() {
    return schematics_1.chain([
        _updateTsConfig(),
        (tree, context) => {
            const existing = dependencies_1.getPackageJsonDependency(tree, 'tslib');
            const type = existing ? existing.type : dependencies_1.NodeDependencyType.Default;
            dependencies_1.addPackageJsonDependency(tree, {
                type,
                name: 'tslib',
                version: latest_versions_1.latestVersions.TsLib,
                overwrite: true,
            });
            context.addTask(new tasks_1.NodePackageInstallTask());
        },
    ]);
}
exports.typeScriptHelpersRule = typeScriptHelpersRule;
function _updateTsConfig() {
    return (host) => {
        const tsConfigPath = '/tsconfig.json';
        const buffer = host.read(tsConfigPath);
        if (!buffer) {
            return host;
        }
        const tsCfgAst = core_1.parseJsonAst(buffer.toString(), core_1.JsonParseMode.Loose);
        if (tsCfgAst.kind !== 'object') {
            return host;
        }
        const compilerOptions = json_utils_1.findPropertyInAstObject(tsCfgAst, 'compilerOptions');
        if (!compilerOptions || compilerOptions.kind !== 'object') {
            return host;
        }
        const importHelpers = json_utils_1.findPropertyInAstObject(compilerOptions, 'importHelpers');
        if (importHelpers && importHelpers.value === true) {
            return host;
        }
        const recorder = host.beginUpdate(tsConfigPath);
        if (importHelpers) {
            const { start, end } = importHelpers;
            recorder.remove(start.offset, end.offset - start.offset);
            recorder.insertLeft(start.offset, 'true');
        }
        else {
            json_utils_1.insertPropertyInAstObjectInOrder(recorder, compilerOptions, 'importHelpers', true, 4);
        }
        host.commitUpdate(recorder);
        return host;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC1oZWxwZXJzLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbWlncmF0aW9ucy91cGRhdGUtNy90eXBlc2NyaXB0LWhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBbUU7QUFDbkUsMkRBQStEO0FBQy9ELDREQUEwRTtBQUMxRSw2REFJb0M7QUFDcEMseURBR2tDO0FBQ2xDLG1FQUErRDtBQUUvRCxTQUFnQixxQkFBcUI7SUFDbkMsT0FBTyxrQkFBSyxDQUFDO1FBQ1gsZUFBZSxFQUFFO1FBQ2pCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ2hCLE1BQU0sUUFBUSxHQUFHLHVDQUF3QixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6RCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlDQUFrQixDQUFDLE9BQU8sQ0FBQztZQUVuRSx1Q0FBd0IsQ0FDdEIsSUFBSSxFQUNKO2dCQUNFLElBQUk7Z0JBQ0osSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLGdDQUFjLENBQUMsS0FBSztnQkFDN0IsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FDRixDQUFDO1lBRUYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLDhCQUFzQixFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXBCRCxzREFvQkM7QUFFRCxTQUFTLGVBQWU7SUFDdEIsT0FBTyxDQUFDLElBQVUsRUFBRSxFQUFFO1FBQ3BCLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDO1FBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLFFBQVEsR0FBRyxtQkFBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxvQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RFLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sZUFBZSxHQUFHLG9DQUF1QixDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyxlQUFlLElBQUksZUFBZSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sYUFBYSxHQUFHLG9DQUF1QixDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNoRixJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRTtZQUNqRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLGFBQWEsQ0FBQztZQUNyQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekQsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzNDO2FBQU07WUFDTCw2Q0FBZ0MsQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDdkY7UUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTVCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEpzb25QYXJzZU1vZGUsIHBhcnNlSnNvbkFzdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFJ1bGUsIFRyZWUsIGNoYWluIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7XG4gIE5vZGVEZXBlbmRlbmN5VHlwZSxcbiAgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5LFxuICBnZXRQYWNrYWdlSnNvbkRlcGVuZGVuY3ksXG59IGZyb20gJy4uLy4uL3V0aWxpdHkvZGVwZW5kZW5jaWVzJztcbmltcG9ydCB7XG4gIGZpbmRQcm9wZXJ0eUluQXN0T2JqZWN0LFxuICBpbnNlcnRQcm9wZXJ0eUluQXN0T2JqZWN0SW5PcmRlcixcbn0gZnJvbSAnLi4vLi4vdXRpbGl0eS9qc29uLXV0aWxzJztcbmltcG9ydCB7IGxhdGVzdFZlcnNpb25zIH0gZnJvbSAnLi4vLi4vdXRpbGl0eS9sYXRlc3QtdmVyc2lvbnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gdHlwZVNjcmlwdEhlbHBlcnNSdWxlKCk6IFJ1bGUge1xuICByZXR1cm4gY2hhaW4oW1xuICAgIF91cGRhdGVUc0NvbmZpZygpLFxuICAgICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IGdldFBhY2thZ2VKc29uRGVwZW5kZW5jeSh0cmVlLCAndHNsaWInKTtcbiAgICAgIGNvbnN0IHR5cGUgPSBleGlzdGluZyA/IGV4aXN0aW5nLnR5cGUgOiBOb2RlRGVwZW5kZW5jeVR5cGUuRGVmYXVsdDtcblxuICAgICAgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5KFxuICAgICAgICB0cmVlLFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBuYW1lOiAndHNsaWInLFxuICAgICAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zLlRzTGliLFxuICAgICAgICAgIG92ZXJ3cml0ZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzaygpKTtcbiAgICB9LFxuICBdKTtcbn1cblxuZnVuY3Rpb24gX3VwZGF0ZVRzQ29uZmlnKCk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBjb25zdCB0c0NvbmZpZ1BhdGggPSAnL3RzY29uZmlnLmpzb24nO1xuICAgIGNvbnN0IGJ1ZmZlciA9IGhvc3QucmVhZCh0c0NvbmZpZ1BhdGgpO1xuICAgIGlmICghYnVmZmVyKSB7XG4gICAgICByZXR1cm4gaG9zdDtcbiAgICB9XG5cbiAgICBjb25zdCB0c0NmZ0FzdCA9IHBhcnNlSnNvbkFzdChidWZmZXIudG9TdHJpbmcoKSwgSnNvblBhcnNlTW9kZS5Mb29zZSk7XG4gICAgaWYgKHRzQ2ZnQXN0LmtpbmQgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gaG9zdDtcbiAgICB9XG5cbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBmaW5kUHJvcGVydHlJbkFzdE9iamVjdCh0c0NmZ0FzdCwgJ2NvbXBpbGVyT3B0aW9ucycpO1xuICAgIGlmICghY29tcGlsZXJPcHRpb25zIHx8IGNvbXBpbGVyT3B0aW9ucy5raW5kICE9PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIGhvc3Q7XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0SGVscGVycyA9IGZpbmRQcm9wZXJ0eUluQXN0T2JqZWN0KGNvbXBpbGVyT3B0aW9ucywgJ2ltcG9ydEhlbHBlcnMnKTtcbiAgICBpZiAoaW1wb3J0SGVscGVycyAmJiBpbXBvcnRIZWxwZXJzLnZhbHVlID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gaG9zdDtcbiAgICB9XG5cbiAgICBjb25zdCByZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUodHNDb25maWdQYXRoKTtcbiAgICBpZiAoaW1wb3J0SGVscGVycykge1xuICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBpbXBvcnRIZWxwZXJzO1xuICAgICAgcmVjb3JkZXIucmVtb3ZlKHN0YXJ0Lm9mZnNldCwgZW5kLm9mZnNldCAtIHN0YXJ0Lm9mZnNldCk7XG4gICAgICByZWNvcmRlci5pbnNlcnRMZWZ0KHN0YXJ0Lm9mZnNldCwgJ3RydWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0UHJvcGVydHlJbkFzdE9iamVjdEluT3JkZXIocmVjb3JkZXIsIGNvbXBpbGVyT3B0aW9ucywgJ2ltcG9ydEhlbHBlcnMnLCB0cnVlLCA0KTtcbiAgICB9XG4gICAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG4iXX0=