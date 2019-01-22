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
const config_1 = require("../utility/config");
const dependencies_1 = require("../utility/dependencies");
const latest_versions_1 = require("../utility/latest-versions");
const validation_1 = require("../utility/validation");
const workspace_models_1 = require("../utility/workspace-models");
function updateJsonFile(host, path, callback) {
    const source = host.read(path);
    if (source) {
        const sourceText = source.toString('utf-8');
        const json = core_1.parseJson(sourceText);
        callback(json);
        host.overwrite(path, JSON.stringify(json, null, 2));
    }
    return host;
}
function updateTsConfig(packageName, distRoot) {
    return (host) => {
        if (!host.exists('tsconfig.json')) {
            return host;
        }
        return updateJsonFile(host, 'tsconfig.json', (tsconfig) => {
            if (!tsconfig.compilerOptions.paths) {
                tsconfig.compilerOptions.paths = {};
            }
            if (!tsconfig.compilerOptions.paths[packageName]) {
                tsconfig.compilerOptions.paths[packageName] = [];
            }
            tsconfig.compilerOptions.paths[packageName].push(distRoot);
            // deep import & secondary entrypoint support
            const deepPackagePath = packageName + '/*';
            if (!tsconfig.compilerOptions.paths[deepPackagePath]) {
                tsconfig.compilerOptions.paths[deepPackagePath] = [];
            }
            tsconfig.compilerOptions.paths[deepPackagePath].push(distRoot + '/*');
        });
    };
}
function addDependenciesToPackageJson() {
    return (host) => {
        [
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: '@angular/compiler-cli',
                version: latest_versions_1.latestVersions.Angular,
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: '@angular-devkit/build-ng-packagr',
                version: latest_versions_1.latestVersions.DevkitBuildNgPackagr,
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: '@angular-devkit/build-angular',
                version: latest_versions_1.latestVersions.DevkitBuildNgPackagr,
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: 'ng-packagr',
                version: '^4.2.0',
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: 'tsickle',
                version: '>=0.29.0',
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: 'tslib',
                version: latest_versions_1.latestVersions.TsLib,
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: 'typescript',
                version: latest_versions_1.latestVersions.TypeScript,
            },
        ].forEach(dependency => dependencies_1.addPackageJsonDependency(host, dependency));
        return host;
    };
}
function addAppToWorkspaceFile(options, workspace, projectRoot, projectName) {
    const project = {
        root: projectRoot,
        sourceRoot: `${projectRoot}/src`,
        projectType: workspace_models_1.ProjectType.Library,
        prefix: options.prefix || 'lib',
        architect: {
            build: {
                builder: workspace_models_1.Builders.NgPackagr,
                options: {
                    tsConfig: `${projectRoot}/tsconfig.lib.json`,
                    project: `${projectRoot}/ng-package.json`,
                },
            },
            test: {
                builder: workspace_models_1.Builders.Karma,
                options: {
                    main: `${projectRoot}/src/test.ts`,
                    tsConfig: `${projectRoot}/tsconfig.spec.json`,
                    karmaConfig: `${projectRoot}/karma.conf.js`,
                },
            },
            lint: {
                builder: workspace_models_1.Builders.TsLint,
                options: {
                    tsConfig: [
                        `${projectRoot}/tsconfig.lib.json`,
                        `${projectRoot}/tsconfig.spec.json`,
                    ],
                    exclude: [
                        '**/node_modules/**',
                    ],
                },
            },
        },
    };
    return config_1.addProjectToWorkspace(workspace, projectName, project);
}
function default_1(options) {
    return (host, context) => {
        if (!options.name) {
            throw new schematics_1.SchematicsException(`Invalid options, "name" is required.`);
        }
        const prefix = options.prefix || 'lib';
        validation_1.validateProjectName(options.name);
        // If scoped project (i.e. "@foo/bar"), convert projectDir to "foo/bar".
        const projectName = options.name;
        const packageName = core_1.strings.dasherize(projectName);
        let scopeName = null;
        if (/^@.*\/.*/.test(options.name)) {
            const [scope, name] = options.name.split('/');
            scopeName = scope.replace(/^@/, '');
            options.name = name;
        }
        const workspace = config_1.getWorkspace(host);
        const newProjectRoot = workspace.newProjectRoot;
        const scopeFolder = scopeName ? core_1.strings.dasherize(scopeName) + '/' : '';
        const folderName = `${scopeFolder}${core_1.strings.dasherize(options.name)}`;
        const projectRoot = `${newProjectRoot}/${folderName}`;
        const distRoot = `dist/${folderName}`;
        const sourceDir = `${projectRoot}/src/lib`;
        const relativePathToWorkspaceRoot = projectRoot.split('/').map(x => '..').join('/');
        const templateSource = schematics_1.apply(schematics_1.url('./files'), [
            schematics_1.template(Object.assign({}, core_1.strings, options, { packageName,
                projectRoot,
                distRoot,
                relativePathToWorkspaceRoot,
                prefix, angularLatestVersion: latest_versions_1.latestVersions.Angular.replace('~', '').replace('^', '') })),
        ]);
        return schematics_1.chain([
            schematics_1.branchAndMerge(schematics_1.mergeWith(templateSource)),
            addAppToWorkspaceFile(options, workspace, projectRoot, projectName),
            options.skipPackageJson ? schematics_1.noop() : addDependenciesToPackageJson(),
            options.skipTsConfig ? schematics_1.noop() : updateTsConfig(packageName, distRoot),
            schematics_1.schematic('module', {
                name: options.name,
                commonModule: false,
                flat: true,
                path: sourceDir,
                project: options.name,
            }),
            schematics_1.schematic('component', {
                name: options.name,
                selector: `${prefix}-${options.name}`,
                inlineStyle: true,
                inlineTemplate: true,
                flat: true,
                path: sourceDir,
                export: true,
                project: options.name,
            }),
            schematics_1.schematic('service', {
                name: options.name,
                flat: true,
                path: sourceDir,
                project: options.name,
            }),
            (_tree, context) => {
                if (!options.skipPackageJson && !options.skipInstall) {
                    context.addTask(new tasks_1.NodePackageInstallTask());
                }
            },
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9saWJyYXJ5L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQTBEO0FBQzFELDJEQWFvQztBQUNwQyw0REFBMEU7QUFDMUUsOENBRzJCO0FBQzNCLDBEQUF1RjtBQUN2RixnRUFBNEQ7QUFDNUQsc0RBQTREO0FBQzVELGtFQUtxQztBQWdCckMsU0FBUyxjQUFjLENBQUksSUFBVSxFQUFFLElBQVksRUFBRSxRQUF5QjtJQUM1RSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLElBQUksTUFBTSxFQUFFO1FBQ1YsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxNQUFNLElBQUksR0FBRyxnQkFBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLFFBQVEsQ0FBQyxJQUFlLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNyRDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLFdBQW1CLEVBQUUsUUFBZ0I7SUFFM0QsT0FBTyxDQUFDLElBQVUsRUFBRSxFQUFFO1FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUM7U0FBRTtRQUVuRCxPQUFPLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLENBQUMsUUFBNkIsRUFBRSxFQUFFO1lBQzdFLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRTtnQkFDbkMs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QUFPLENBQUMsSUFBSTthQUN0QixDQUFDO1lBQ0YsQ0FBQyxLQUFXLEVBQUUsT0FBeUIsRUFBRSxFQUFFO2dCQUN6QyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7b0JBQ3BELE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSw4QkFBc0IsRUFBRSxDQUFDLENBQUM7aUJBQy9DO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUFqRkQsNEJBaUZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgcGFyc2VKc29uLCBzdHJpbmdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGJyYW5jaEFuZE1lcmdlLFxuICBjaGFpbixcbiAgbWVyZ2VXaXRoLFxuICBub29wLFxuICBzY2hlbWF0aWMsXG4gIHRlbXBsYXRlLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2sgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQge1xuICBhZGRQcm9qZWN0VG9Xb3Jrc3BhY2UsXG4gIGdldFdvcmtzcGFjZSxcbn0gZnJvbSAnLi4vdXRpbGl0eS9jb25maWcnO1xuaW1wb3J0IHsgTm9kZURlcGVuZGVuY3lUeXBlLCBhZGRQYWNrYWdlSnNvbkRlcGVuZGVuY3kgfSBmcm9tICcuLi91dGlsaXR5L2RlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyBsYXRlc3RWZXJzaW9ucyB9IGZyb20gJy4uL3V0aWxpdHkvbGF0ZXN0LXZlcnNpb25zJztcbmltcG9ydCB7IHZhbGlkYXRlUHJvamVjdE5hbWUgfSBmcm9tICcuLi91dGlsaXR5L3ZhbGlkYXRpb24nO1xuaW1wb3J0IHtcbiAgQnVpbGRlcnMsXG4gIFByb2plY3RUeXBlLFxuICBXb3Jrc3BhY2VQcm9qZWN0LFxuICBXb3Jrc3BhY2VTY2hlbWEsXG59IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlLW1vZGVscyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgTGlicmFyeU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmludGVyZmFjZSBVcGRhdGVKc29uRm48VD4ge1xuICAob2JqOiBUKTogVCB8IHZvaWQ7XG59XG5cbnR5cGUgVHNDb25maWdQYXJ0aWFsVHlwZSA9IHtcbiAgY29tcGlsZXJPcHRpb25zOiB7XG4gICAgYmFzZVVybDogc3RyaW5nLFxuICAgIHBhdGhzOiB7XG4gICAgICBba2V5OiBzdHJpbmddOiBzdHJpbmdbXTtcbiAgICB9LFxuICB9LFxufTtcblxuZnVuY3Rpb24gdXBkYXRlSnNvbkZpbGU8VD4oaG9zdDogVHJlZSwgcGF0aDogc3RyaW5nLCBjYWxsYmFjazogVXBkYXRlSnNvbkZuPFQ+KTogVHJlZSB7XG4gIGNvbnN0IHNvdXJjZSA9IGhvc3QucmVhZChwYXRoKTtcbiAgaWYgKHNvdXJjZSkge1xuICAgIGNvbnN0IHNvdXJjZVRleHQgPSBzb3VyY2UudG9TdHJpbmcoJ3V0Zi04Jyk7XG4gICAgY29uc3QganNvbiA9IHBhcnNlSnNvbihzb3VyY2VUZXh0KTtcbiAgICBjYWxsYmFjayhqc29uIGFzIHt9IGFzIFQpO1xuICAgIGhvc3Qub3ZlcndyaXRlKHBhdGgsIEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKTtcbiAgfVxuXG4gIHJldHVybiBob3N0O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVUc0NvbmZpZyhwYWNrYWdlTmFtZTogc3RyaW5nLCBkaXN0Um9vdDogc3RyaW5nKSB7XG5cbiAgcmV0dXJuIChob3N0OiBUcmVlKSA9PiB7XG4gICAgaWYgKCFob3N0LmV4aXN0cygndHNjb25maWcuanNvbicpKSB7IHJldHVybiBob3N0OyB9XG5cbiAgICByZXR1cm4gdXBkYXRlSnNvbkZpbGUoaG9zdCwgJ3RzY29uZmlnLmpzb24nLCAodHNjb25maWc6IFRzQ29uZmlnUGFydGlhbFR5cGUpID0+IHtcbiAgICAgIGlmICghdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG4gICAgICAgIHRzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRocyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKCF0c2NvbmZpZy5jb21waWxlck9wdGlvbnMucGF0aHNbcGFja2FnZU5hbWVdKSB7XG4gICAgICAgIHRzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRoc1twYWNrYWdlTmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHRzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRoc1twYWNrYWdlTmFtZV0ucHVzaChkaXN0Um9vdCk7XG5cbiAgICAgIC8vIGRlZXAgaW1wb3J0ICYgc2Vjb25kYXJ5IGVudHJ5cG9pbnQgc3VwcG9ydFxuICAgICAgY29uc3QgZGVlcFBhY2thZ2VQYXRoID0gcGFja2FnZU5hbWUgKyAnLyonO1xuICAgICAgaWYgKCF0c2NvbmZpZy5jb21waWxlck9wdGlvbnMucGF0aHNbZGVlcFBhY2thZ2VQYXRoXSkge1xuICAgICAgICB0c2NvbmZpZy5jb21waWxlck9wdGlvbnMucGF0aHNbZGVlcFBhY2thZ2VQYXRoXSA9IFtdO1xuICAgICAgfVxuICAgICAgdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzW2RlZXBQYWNrYWdlUGF0aF0ucHVzaChkaXN0Um9vdCArICcvKicpO1xuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGREZXBlbmRlbmNpZXNUb1BhY2thZ2VKc29uKCkge1xuXG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRldixcbiAgICAgICAgbmFtZTogJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaScsXG4gICAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zLkFuZ3VsYXIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiBOb2RlRGVwZW5kZW5jeVR5cGUuRGV2LFxuICAgICAgICBuYW1lOiAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLW5nLXBhY2thZ3InLFxuICAgICAgICB2ZXJzaW9uOiBsYXRlc3RWZXJzaW9ucy5EZXZraXRCdWlsZE5nUGFja2FncixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgIG5hbWU6ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcicsXG4gICAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zLkRldmtpdEJ1aWxkTmdQYWNrYWdyLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRldixcbiAgICAgICAgbmFtZTogJ25nLXBhY2thZ3InLFxuICAgICAgICB2ZXJzaW9uOiAnXjQuMi4wJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgIG5hbWU6ICd0c2lja2xlJyxcbiAgICAgICAgdmVyc2lvbjogJz49MC4yOS4wJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgIG5hbWU6ICd0c2xpYicsXG4gICAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zLlRzTGliLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRldixcbiAgICAgICAgbmFtZTogJ3R5cGVzY3JpcHQnLFxuICAgICAgICB2ZXJzaW9uOiBsYXRlc3RWZXJzaW9ucy5UeXBlU2NyaXB0LFxuICAgICAgfSxcbiAgICBdLmZvckVhY2goZGVwZW5kZW5jeSA9PiBhZGRQYWNrYWdlSnNvbkRlcGVuZGVuY3koaG9zdCwgZGVwZW5kZW5jeSkpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZEFwcFRvV29ya3NwYWNlRmlsZShvcHRpb25zOiBMaWJyYXJ5T3B0aW9ucywgd29ya3NwYWNlOiBXb3Jrc3BhY2VTY2hlbWEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdFJvb3Q6IHN0cmluZywgcHJvamVjdE5hbWU6IHN0cmluZyk6IFJ1bGUge1xuXG4gIGNvbnN0IHByb2plY3Q6IFdvcmtzcGFjZVByb2plY3Q8UHJvamVjdFR5cGUuTGlicmFyeT4gPSB7XG4gICAgcm9vdDogcHJvamVjdFJvb3QsXG4gICAgc291cmNlUm9vdDogYCR7cHJvamVjdFJvb3R9L3NyY2AsXG4gICAgcHJvamVjdFR5cGU6IFByb2plY3RUeXBlLkxpYnJhcnksXG4gICAgcHJlZml4OiBvcHRpb25zLnByZWZpeCB8fCAnbGliJyxcbiAgICBhcmNoaXRlY3Q6IHtcbiAgICAgIGJ1aWxkOiB7XG4gICAgICAgIGJ1aWxkZXI6IEJ1aWxkZXJzLk5nUGFja2FncixcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIHRzQ29uZmlnOiBgJHtwcm9qZWN0Um9vdH0vdHNjb25maWcubGliLmpzb25gLFxuICAgICAgICAgIHByb2plY3Q6IGAke3Byb2plY3RSb290fS9uZy1wYWNrYWdlLmpzb25gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRlc3Q6IHtcbiAgICAgICAgYnVpbGRlcjogQnVpbGRlcnMuS2FybWEsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBtYWluOiBgJHtwcm9qZWN0Um9vdH0vc3JjL3Rlc3QudHNgLFxuICAgICAgICAgIHRzQ29uZmlnOiBgJHtwcm9qZWN0Um9vdH0vdHNjb25maWcuc3BlYy5qc29uYCxcbiAgICAgICAgICBrYXJtYUNvbmZpZzogYCR7cHJvamVjdFJvb3R9L2thcm1hLmNvbmYuanNgLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGxpbnQ6IHtcbiAgICAgICAgYnVpbGRlcjogQnVpbGRlcnMuVHNMaW50LFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgdHNDb25maWc6IFtcbiAgICAgICAgICAgIGAke3Byb2plY3RSb290fS90c2NvbmZpZy5saWIuanNvbmAsXG4gICAgICAgICAgICBgJHtwcm9qZWN0Um9vdH0vdHNjb25maWcuc3BlYy5qc29uYCxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIGFkZFByb2plY3RUb1dvcmtzcGFjZSh3b3Jrc3BhY2UsIHByb2plY3ROYW1lLCBwcm9qZWN0KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IExpYnJhcnlPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGlmICghb3B0aW9ucy5uYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgSW52YWxpZCBvcHRpb25zLCBcIm5hbWVcIiBpcyByZXF1aXJlZC5gKTtcbiAgICB9XG4gICAgY29uc3QgcHJlZml4ID0gb3B0aW9ucy5wcmVmaXggfHwgJ2xpYic7XG5cbiAgICB2YWxpZGF0ZVByb2plY3ROYW1lKG9wdGlvbnMubmFtZSk7XG5cbiAgICAvLyBJZiBzY29wZWQgcHJvamVjdCAoaS5lLiBcIkBmb28vYmFyXCIpLCBjb252ZXJ0IHByb2plY3REaXIgdG8gXCJmb28vYmFyXCIuXG4gICAgY29uc3QgcHJvamVjdE5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgY29uc3QgcGFja2FnZU5hbWUgPSBzdHJpbmdzLmRhc2hlcml6ZShwcm9qZWN0TmFtZSk7XG4gICAgbGV0IHNjb3BlTmFtZSA9IG51bGw7XG4gICAgaWYgKC9eQC4qXFwvLiovLnRlc3Qob3B0aW9ucy5uYW1lKSkge1xuICAgICAgY29uc3QgW3Njb3BlLCBuYW1lXSA9IG9wdGlvbnMubmFtZS5zcGxpdCgnLycpO1xuICAgICAgc2NvcGVOYW1lID0gc2NvcGUucmVwbGFjZSgvXkAvLCAnJyk7XG4gICAgICBvcHRpb25zLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBuZXdQcm9qZWN0Um9vdCA9IHdvcmtzcGFjZS5uZXdQcm9qZWN0Um9vdDtcblxuICAgIGNvbnN0IHNjb3BlRm9sZGVyID0gc2NvcGVOYW1lID8gc3RyaW5ncy5kYXNoZXJpemUoc2NvcGVOYW1lKSArICcvJyA6ICcnO1xuICAgIGNvbnN0IGZvbGRlck5hbWUgPSBgJHtzY29wZUZvbGRlcn0ke3N0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSl9YDtcbiAgICBjb25zdCBwcm9qZWN0Um9vdCA9IGAke25ld1Byb2plY3RSb290fS8ke2ZvbGRlck5hbWV9YDtcbiAgICBjb25zdCBkaXN0Um9vdCA9IGBkaXN0LyR7Zm9sZGVyTmFtZX1gO1xuXG4gICAgY29uc3Qgc291cmNlRGlyID0gYCR7cHJvamVjdFJvb3R9L3NyYy9saWJgO1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdCA9IHByb2plY3RSb290LnNwbGl0KCcvJykubWFwKHggPT4gJy4uJykuam9pbignLycpO1xuXG4gICAgY29uc3QgdGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoJy4vZmlsZXMnKSwgW1xuICAgICAgdGVtcGxhdGUoe1xuICAgICAgICAuLi5zdHJpbmdzLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBwYWNrYWdlTmFtZSxcbiAgICAgICAgcHJvamVjdFJvb3QsXG4gICAgICAgIGRpc3RSb290LFxuICAgICAgICByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3QsXG4gICAgICAgIHByZWZpeCxcbiAgICAgICAgYW5ndWxhckxhdGVzdFZlcnNpb246IGxhdGVzdFZlcnNpb25zLkFuZ3VsYXIucmVwbGFjZSgnficsICcnKS5yZXBsYWNlKCdeJywgJycpLFxuICAgICAgfSksXG4gICAgICAvLyBUT0RPOiBNb3ZpbmcgaW5zaWRlIGBicmFuY2hBbmRNZXJnZWAgc2hvdWxkIHdvcmsgYnV0IGlzIGJ1Z2dlZCByaWdodCBub3cuXG4gICAgICAvLyBUaGUgX19wcm9qZWN0Um9vdF9fIGlzIGJlaW5nIHVzZWQgbWVhbndoaWxlLlxuICAgICAgLy8gbW92ZShwcm9qZWN0Um9vdCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgYnJhbmNoQW5kTWVyZ2UobWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKSksXG4gICAgICBhZGRBcHBUb1dvcmtzcGFjZUZpbGUob3B0aW9ucywgd29ya3NwYWNlLCBwcm9qZWN0Um9vdCwgcHJvamVjdE5hbWUpLFxuICAgICAgb3B0aW9ucy5za2lwUGFja2FnZUpzb24gPyBub29wKCkgOiBhZGREZXBlbmRlbmNpZXNUb1BhY2thZ2VKc29uKCksXG4gICAgICBvcHRpb25zLnNraXBUc0NvbmZpZyA/IG5vb3AoKSA6IHVwZGF0ZVRzQ29uZmlnKHBhY2thZ2VOYW1lLCBkaXN0Um9vdCksXG4gICAgICBzY2hlbWF0aWMoJ21vZHVsZScsIHtcbiAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICBjb21tb25Nb2R1bGU6IGZhbHNlLFxuICAgICAgICBmbGF0OiB0cnVlLFxuICAgICAgICBwYXRoOiBzb3VyY2VEaXIsXG4gICAgICAgIHByb2plY3Q6IG9wdGlvbnMubmFtZSxcbiAgICAgIH0pLFxuICAgICAgc2NoZW1hdGljKCdjb21wb25lbnQnLCB7XG4gICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgc2VsZWN0b3I6IGAke3ByZWZpeH0tJHtvcHRpb25zLm5hbWV9YCxcbiAgICAgICAgaW5saW5lU3R5bGU6IHRydWUsXG4gICAgICAgIGlubGluZVRlbXBsYXRlOiB0cnVlLFxuICAgICAgICBmbGF0OiB0cnVlLFxuICAgICAgICBwYXRoOiBzb3VyY2VEaXIsXG4gICAgICAgIGV4cG9ydDogdHJ1ZSxcbiAgICAgICAgcHJvamVjdDogb3B0aW9ucy5uYW1lLFxuICAgICAgfSksXG4gICAgICBzY2hlbWF0aWMoJ3NlcnZpY2UnLCB7XG4gICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgZmxhdDogdHJ1ZSxcbiAgICAgICAgcGF0aDogc291cmNlRGlyLFxuICAgICAgICBwcm9qZWN0OiBvcHRpb25zLm5hbWUsXG4gICAgICB9KSxcbiAgICAgIChfdHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2tpcFBhY2thZ2VKc29uICYmICFvcHRpb25zLnNraXBJbnN0YWxsKSB7XG4gICAgICAgICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIF0pO1xuICB9O1xufVxuIl19