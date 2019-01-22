"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
function default_1(options) {
    if (!options.name) {
        throw new schematics_1.SchematicsException(`Invalid options, "name" is required.`);
    }
    if (!options.directory) {
        options.directory = options.name;
    }
    const workspaceOptions = {
        name: options.name,
        version: options.version,
        newProjectRoot: options.newProjectRoot || 'projects',
        minimal: options.minimal,
    };
    const applicationOptions = {
        projectRoot: '',
        name: options.name,
        experimentalIvy: options.experimentalIvy,
        inlineStyle: options.inlineStyle,
        inlineTemplate: options.inlineTemplate,
        prefix: options.prefix,
        viewEncapsulation: options.viewEncapsulation,
        routing: options.routing,
        style: options.style,
        skipTests: options.skipTests,
        skipPackageJson: false,
        // always 'skipInstall' here, so that we do it after the move
        skipInstall: true,
        minimal: options.minimal,
    };
    return schematics_1.chain([
        schematics_1.mergeWith(schematics_1.apply(schematics_1.empty(), [
            schematics_1.schematic('workspace', workspaceOptions),
            options.createApplication ? schematics_1.schematic('application', applicationOptions) : schematics_1.noop,
            schematics_1.move(options.directory || options.name),
        ])),
        (_host, context) => {
            let packageTask;
            if (!options.skipInstall) {
                packageTask = context.addTask(new tasks_1.NodePackageInstallTask(options.directory));
                if (options.linkCli) {
                    packageTask = context.addTask(new tasks_1.NodePackageLinkTask('@angular/cli', options.directory), [packageTask]);
                }
            }
            if (!options.skipGit) {
                const commit = typeof options.commit == 'object'
                    ? options.commit
                    : (!!options.commit ? {} : false);
                context.addTask(new tasks_1.RepositoryInitializerTask(options.directory, commit), packageTask ? [packageTask] : []);
            }
        },
    ]);
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9uZy1uZXcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwyREFZb0M7QUFDcEMsNERBSTBDO0FBTTFDLG1CQUF5QixPQUFxQjtJQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtRQUNqQixNQUFNLElBQUksZ0NBQW1CLENBQUMsc0NBQXNDLENBQUMsQ0FBQztLQUN2RTtJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1FBQ3RCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztLQUNsQztJQUVELE1BQU0sZ0JBQWdCLEdBQXFCO1FBQ3pDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtRQUNsQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDeEIsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjLElBQUksVUFBVTtRQUNwRCxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87S0FDekIsQ0FBQztJQUNGLE1BQU0sa0JBQWtCLEdBQXVCO1FBQzdDLFdBQVcsRUFBRSxFQUFFO1FBQ2YsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1FBQ2xCLGVBQWUsRUFBRSxPQUFPLENBQUMsZUFBZTtRQUN4QyxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7UUFDaEMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO1FBQ3RDLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtRQUN0QixpQkFBaUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCO1FBQzVDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztRQUN4QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO1FBQzVCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLDZEQUE2RDtRQUM3RCxXQUFXLEVBQUUsSUFBSTtRQUNqQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87S0FDekIsQ0FBQztJQUVGLE9BQU8sa0JBQUssQ0FBQztRQUNYLHNCQUFTLENBQ1Asa0JBQUssQ0FBQyxrQkFBSyxFQUFFLEVBQUU7WUFDYixzQkFBUyxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQztZQUN4QyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLHNCQUFTLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFJO1lBQy9FLGlCQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDO1NBQ3hDLENBQUMsQ0FDSDtRQUNELENBQUMsS0FBVyxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUN6QyxJQUFJLFdBQVcsQ0FBQztZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtnQkFDeEIsV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSw4QkFBc0IsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDN0UsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO29CQUNuQixXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FDM0IsSUFBSSwyQkFBbUIsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUMxRCxDQUFDLFdBQVcsQ0FBQyxDQUNkLENBQUM7aUJBQ0g7YUFDRjtZQUNELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO2dCQUNwQixNQUFNLE1BQU0sR0FBRyxPQUFPLE9BQU8sQ0FBQyxNQUFNLElBQUksUUFBUTtvQkFDOUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNO29CQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFcEMsT0FBTyxDQUFDLE9BQU8sQ0FDYixJQUFJLGlDQUF5QixDQUMzQixPQUFPLENBQUMsU0FBUyxFQUNqQixNQUFNLENBQ1AsRUFDRCxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDakMsQ0FBQzthQUNIO1FBQ0gsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFsRUQsNEJBa0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGNoYWluLFxuICBlbXB0eSxcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICBub29wLFxuICBzY2hlbWF0aWMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2ssXG4gIE5vZGVQYWNrYWdlTGlua1Rhc2ssXG4gIFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2ssXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBBcHBsaWNhdGlvbk9wdGlvbnMgfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9zY2hlbWEnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFdvcmtzcGFjZU9wdGlvbnMgfSBmcm9tICcuLi93b3Jrc3BhY2Uvc2NoZW1hJztcbmltcG9ydCB7IFNjaGVtYSBhcyBOZ05ld09wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IE5nTmV3T3B0aW9ucyk6IFJ1bGUge1xuICBpZiAoIW9wdGlvbnMubmFtZSkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBJbnZhbGlkIG9wdGlvbnMsIFwibmFtZVwiIGlzIHJlcXVpcmVkLmApO1xuICB9XG5cbiAgaWYgKCFvcHRpb25zLmRpcmVjdG9yeSkge1xuICAgIG9wdGlvbnMuZGlyZWN0b3J5ID0gb3B0aW9ucy5uYW1lO1xuICB9XG5cbiAgY29uc3Qgd29ya3NwYWNlT3B0aW9uczogV29ya3NwYWNlT3B0aW9ucyA9IHtcbiAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgdmVyc2lvbjogb3B0aW9ucy52ZXJzaW9uLFxuICAgIG5ld1Byb2plY3RSb290OiBvcHRpb25zLm5ld1Byb2plY3RSb290IHx8ICdwcm9qZWN0cycsXG4gICAgbWluaW1hbDogb3B0aW9ucy5taW5pbWFsLFxuICB9O1xuICBjb25zdCBhcHBsaWNhdGlvbk9wdGlvbnM6IEFwcGxpY2F0aW9uT3B0aW9ucyA9IHtcbiAgICBwcm9qZWN0Um9vdDogJycsXG4gICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgIGV4cGVyaW1lbnRhbEl2eTogb3B0aW9ucy5leHBlcmltZW50YWxJdnksXG4gICAgaW5saW5lU3R5bGU6IG9wdGlvbnMuaW5saW5lU3R5bGUsXG4gICAgaW5saW5lVGVtcGxhdGU6IG9wdGlvbnMuaW5saW5lVGVtcGxhdGUsXG4gICAgcHJlZml4OiBvcHRpb25zLnByZWZpeCxcbiAgICB2aWV3RW5jYXBzdWxhdGlvbjogb3B0aW9ucy52aWV3RW5jYXBzdWxhdGlvbixcbiAgICByb3V0aW5nOiBvcHRpb25zLnJvdXRpbmcsXG4gICAgc3R5bGU6IG9wdGlvbnMuc3R5bGUsXG4gICAgc2tpcFRlc3RzOiBvcHRpb25zLnNraXBUZXN0cyxcbiAgICBza2lwUGFja2FnZUpzb246IGZhbHNlLFxuICAgIC8vIGFsd2F5cyAnc2tpcEluc3RhbGwnIGhlcmUsIHNvIHRoYXQgd2UgZG8gaXQgYWZ0ZXIgdGhlIG1vdmVcbiAgICBza2lwSW5zdGFsbDogdHJ1ZSxcbiAgICBtaW5pbWFsOiBvcHRpb25zLm1pbmltYWwsXG4gIH07XG5cbiAgcmV0dXJuIGNoYWluKFtcbiAgICBtZXJnZVdpdGgoXG4gICAgICBhcHBseShlbXB0eSgpLCBbXG4gICAgICAgIHNjaGVtYXRpYygnd29ya3NwYWNlJywgd29ya3NwYWNlT3B0aW9ucyksXG4gICAgICAgIG9wdGlvbnMuY3JlYXRlQXBwbGljYXRpb24gPyBzY2hlbWF0aWMoJ2FwcGxpY2F0aW9uJywgYXBwbGljYXRpb25PcHRpb25zKSA6IG5vb3AsXG4gICAgICAgIG1vdmUob3B0aW9ucy5kaXJlY3RvcnkgfHwgb3B0aW9ucy5uYW1lKSxcbiAgICAgIF0pLFxuICAgICksXG4gICAgKF9ob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgICBsZXQgcGFja2FnZVRhc2s7XG4gICAgICBpZiAoIW9wdGlvbnMuc2tpcEluc3RhbGwpIHtcbiAgICAgICAgcGFja2FnZVRhc2sgPSBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2sob3B0aW9ucy5kaXJlY3RvcnkpKTtcbiAgICAgICAgaWYgKG9wdGlvbnMubGlua0NsaSkge1xuICAgICAgICAgIHBhY2thZ2VUYXNrID0gY29udGV4dC5hZGRUYXNrKFxuICAgICAgICAgICAgbmV3IE5vZGVQYWNrYWdlTGlua1Rhc2soJ0Bhbmd1bGFyL2NsaScsIG9wdGlvbnMuZGlyZWN0b3J5KSxcbiAgICAgICAgICAgIFtwYWNrYWdlVGFza10sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFvcHRpb25zLnNraXBHaXQpIHtcbiAgICAgICAgY29uc3QgY29tbWl0ID0gdHlwZW9mIG9wdGlvbnMuY29tbWl0ID09ICdvYmplY3QnXG4gICAgICAgICAgPyBvcHRpb25zLmNvbW1pdFxuICAgICAgICAgIDogKCEhb3B0aW9ucy5jb21taXQgPyB7fSA6IGZhbHNlKTtcblxuICAgICAgICBjb250ZXh0LmFkZFRhc2soXG4gICAgICAgICAgbmV3IFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2soXG4gICAgICAgICAgICBvcHRpb25zLmRpcmVjdG9yeSxcbiAgICAgICAgICAgIGNvbW1pdCxcbiAgICAgICAgICApLFxuICAgICAgICAgIHBhY2thZ2VUYXNrID8gW3BhY2thZ2VUYXNrXSA6IFtdLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0sXG4gIF0pO1xufVxuIl19