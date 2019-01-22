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
const schematic_command_1 = require("../models/schematic-command");
const find_up_1 = require("../utilities/find-up");
const package_manager_1 = require("../utilities/package-manager");
class UpdateCommand extends schematic_command_1.SchematicCommand {
    constructor() {
        super(...arguments);
        this.allowMissingWorkspace = true;
        this.collectionName = '@schematics/update';
        this.schematicName = 'update';
    }
    async parseArguments(schematicOptions, schema) {
        const args = await super.parseArguments(schematicOptions, schema);
        const maybeArgsLeftovers = args['--'];
        if (maybeArgsLeftovers
            && maybeArgsLeftovers.length == 1
            && maybeArgsLeftovers[0] == '@angular/cli'
            && args.migrateOnly === undefined
            && args.from === undefined) {
            // Check for a 1.7 angular-cli.json file.
            const oldConfigFileNames = [
                core_1.normalize('.angular-cli.json'),
                core_1.normalize('angular-cli.json'),
            ];
            const oldConfigFilePath = find_up_1.findUp(oldConfigFileNames, process.cwd())
                || find_up_1.findUp(oldConfigFileNames, __dirname);
            if (oldConfigFilePath) {
                args.migrateOnly = true;
                args.from = '1.0.0';
            }
        }
        // Move `--` to packages.
        if (args.packages == undefined && args['--']) {
            args.packages = args['--'];
            delete args['--'];
        }
        return args;
    }
    async run(options) {
        const packageManager = package_manager_1.getPackageManager(this.workspace.root);
        return this.runSchematic({
            collectionName: this.collectionName,
            schematicName: this.schematicName,
            schematicOptions: options['--'],
            dryRun: !!options.dryRun,
            force: false,
            showNothingDone: false,
            additionalOptions: { packageManager },
        });
    }
}
exports.UpdateCommand = UpdateCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWltcGwuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2NvbW1hbmRzL3VwZGF0ZS1pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQWlEO0FBRWpELG1FQUErRDtBQUMvRCxrREFBOEM7QUFDOUMsa0VBQWlFO0FBR2pFLE1BQWEsYUFBYyxTQUFRLG9DQUFxQztJQUF4RTs7UUFDa0IsMEJBQXFCLEdBQUcsSUFBSSxDQUFDO1FBRTdDLG1CQUFjLEdBQUcsb0JBQW9CLENBQUM7UUFDdEMsa0JBQWEsR0FBRyxRQUFRLENBQUM7SUErQzNCLENBQUM7SUE3Q0MsS0FBSyxDQUFDLGNBQWMsQ0FBQyxnQkFBMEIsRUFBRSxNQUFnQjtRQUMvRCxNQUFNLElBQUksR0FBRyxNQUFNLEtBQUssQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdEMsSUFBSSxrQkFBa0I7ZUFDZixrQkFBa0IsQ0FBQyxNQUFNLElBQUksQ0FBQztlQUM5QixrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjO2VBQ3ZDLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUztlQUM5QixJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUM5Qix5Q0FBeUM7WUFDekMsTUFBTSxrQkFBa0IsR0FBRztnQkFDekIsZ0JBQVMsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDOUIsZ0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQzthQUM5QixDQUFDO1lBQ0YsTUFBTSxpQkFBaUIsR0FBRyxnQkFBTSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzttQkFDekMsZ0JBQU0sQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVoRSxJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7YUFDckI7U0FDRjtRQUVELHlCQUF5QjtRQUN6QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNuQjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBd0M7UUFDaEQsTUFBTSxjQUFjLEdBQUcsbUNBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU5RCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDdkIsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1lBQ25DLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQy9CLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU07WUFDeEIsS0FBSyxFQUFFLEtBQUs7WUFDWixlQUFlLEVBQUUsS0FBSztZQUN0QixpQkFBaUIsRUFBRSxFQUFFLGNBQWMsRUFBRTtTQUN0QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFuREQsc0NBbURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgQXJndW1lbnRzLCBPcHRpb24gfSBmcm9tICcuLi9tb2RlbHMvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYXRpY0NvbW1hbmQgfSBmcm9tICcuLi9tb2RlbHMvc2NoZW1hdGljLWNvbW1hbmQnO1xuaW1wb3J0IHsgZmluZFVwIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2ZpbmQtdXAnO1xuaW1wb3J0IHsgZ2V0UGFja2FnZU1hbmFnZXIgfSBmcm9tICcuLi91dGlsaXRpZXMvcGFja2FnZS1tYW5hZ2VyJztcbmltcG9ydCB7IFNjaGVtYSBhcyBVcGRhdGVDb21tYW5kU2NoZW1hIH0gZnJvbSAnLi91cGRhdGUnO1xuXG5leHBvcnQgY2xhc3MgVXBkYXRlQ29tbWFuZCBleHRlbmRzIFNjaGVtYXRpY0NvbW1hbmQ8VXBkYXRlQ29tbWFuZFNjaGVtYT4ge1xuICBwdWJsaWMgcmVhZG9ubHkgYWxsb3dNaXNzaW5nV29ya3NwYWNlID0gdHJ1ZTtcblxuICBjb2xsZWN0aW9uTmFtZSA9ICdAc2NoZW1hdGljcy91cGRhdGUnO1xuICBzY2hlbWF0aWNOYW1lID0gJ3VwZGF0ZSc7XG5cbiAgYXN5bmMgcGFyc2VBcmd1bWVudHMoc2NoZW1hdGljT3B0aW9uczogc3RyaW5nW10sIHNjaGVtYTogT3B0aW9uW10pOiBQcm9taXNlPEFyZ3VtZW50cz4ge1xuICAgIGNvbnN0IGFyZ3MgPSBhd2FpdCBzdXBlci5wYXJzZUFyZ3VtZW50cyhzY2hlbWF0aWNPcHRpb25zLCBzY2hlbWEpO1xuICAgIGNvbnN0IG1heWJlQXJnc0xlZnRvdmVycyA9IGFyZ3NbJy0tJ107XG5cbiAgICBpZiAobWF5YmVBcmdzTGVmdG92ZXJzXG4gICAgICAgICYmIG1heWJlQXJnc0xlZnRvdmVycy5sZW5ndGggPT0gMVxuICAgICAgICAmJiBtYXliZUFyZ3NMZWZ0b3ZlcnNbMF0gPT0gJ0Bhbmd1bGFyL2NsaSdcbiAgICAgICAgJiYgYXJncy5taWdyYXRlT25seSA9PT0gdW5kZWZpbmVkXG4gICAgICAgICYmIGFyZ3MuZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBDaGVjayBmb3IgYSAxLjcgYW5ndWxhci1jbGkuanNvbiBmaWxlLlxuICAgICAgY29uc3Qgb2xkQ29uZmlnRmlsZU5hbWVzID0gW1xuICAgICAgICBub3JtYWxpemUoJy5hbmd1bGFyLWNsaS5qc29uJyksXG4gICAgICAgIG5vcm1hbGl6ZSgnYW5ndWxhci1jbGkuanNvbicpLFxuICAgICAgXTtcbiAgICAgIGNvbnN0IG9sZENvbmZpZ0ZpbGVQYXRoID0gZmluZFVwKG9sZENvbmZpZ0ZpbGVOYW1lcywgcHJvY2Vzcy5jd2QoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgZmluZFVwKG9sZENvbmZpZ0ZpbGVOYW1lcywgX19kaXJuYW1lKTtcblxuICAgICAgaWYgKG9sZENvbmZpZ0ZpbGVQYXRoKSB7XG4gICAgICAgIGFyZ3MubWlncmF0ZU9ubHkgPSB0cnVlO1xuICAgICAgICBhcmdzLmZyb20gPSAnMS4wLjAnO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1vdmUgYC0tYCB0byBwYWNrYWdlcy5cbiAgICBpZiAoYXJncy5wYWNrYWdlcyA9PSB1bmRlZmluZWQgJiYgYXJnc1snLS0nXSkge1xuICAgICAgYXJncy5wYWNrYWdlcyA9IGFyZ3NbJy0tJ107XG4gICAgICBkZWxldGUgYXJnc1snLS0nXTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJncztcbiAgfVxuXG4gIGFzeW5jIHJ1bihvcHRpb25zOiBVcGRhdGVDb21tYW5kU2NoZW1hICYgQXJndW1lbnRzKSB7XG4gICAgY29uc3QgcGFja2FnZU1hbmFnZXIgPSBnZXRQYWNrYWdlTWFuYWdlcih0aGlzLndvcmtzcGFjZS5yb290KTtcblxuICAgIHJldHVybiB0aGlzLnJ1blNjaGVtYXRpYyh7XG4gICAgICBjb2xsZWN0aW9uTmFtZTogdGhpcy5jb2xsZWN0aW9uTmFtZSxcbiAgICAgIHNjaGVtYXRpY05hbWU6IHRoaXMuc2NoZW1hdGljTmFtZSxcbiAgICAgIHNjaGVtYXRpY09wdGlvbnM6IG9wdGlvbnNbJy0tJ10sXG4gICAgICBkcnlSdW46ICEhb3B0aW9ucy5kcnlSdW4sXG4gICAgICBmb3JjZTogZmFsc2UsXG4gICAgICBzaG93Tm90aGluZ0RvbmU6IGZhbHNlLFxuICAgICAgYWRkaXRpb25hbE9wdGlvbnM6IHsgcGFja2FnZU1hbmFnZXIgfSxcbiAgICB9KTtcbiAgfVxufVxuIl19