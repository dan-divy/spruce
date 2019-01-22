"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
require("symbol-observable");
// symbol polyfill must go first
// tslint:disable-next-line:ordered-imports import-groups
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const fs = require("fs");
const path = require("path");
const semver_1 = require("semver");
const stream_1 = require("stream");
const config_1 = require("../utilities/config");
const packageJson = require('../package.json');
function _fromPackageJson(cwd) {
    cwd = cwd || process.cwd();
    do {
        const packageJsonPath = path.join(cwd, 'node_modules/@angular/cli/package.json');
        if (fs.existsSync(packageJsonPath)) {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            if (content) {
                const json = JSON.parse(content);
                if (json['version']) {
                    return new semver_1.SemVer(json['version']);
                }
            }
        }
        // Check the parent.
        cwd = path.dirname(cwd);
    } while (cwd != path.dirname(cwd));
    return null;
}
// Check if we need to profile this CLI run.
if (process.env['NG_CLI_PROFILING']) {
    let profiler;
    try {
        profiler = require('v8-profiler-node8'); // tslint:disable-line:no-implicit-dependencies
    }
    catch (err) {
        throw new Error(`Could not require 'v8-profiler-node8'. You must install it separetely with ` +
            `'npm install v8-profiler-node8 --no-save'.\n\nOriginal error:\n\n${err}`);
    }
    profiler.startProfiling();
    const exitHandler = (options) => {
        if (options.cleanup) {
            const cpuProfile = profiler.stopProfiling();
            fs.writeFileSync(path.resolve(process.cwd(), process.env.NG_CLI_PROFILING || '') + '.cpuprofile', JSON.stringify(cpuProfile));
        }
        if (options.exit) {
            process.exit();
        }
    };
    process.on('exit', () => exitHandler({ cleanup: true }));
    process.on('SIGINT', () => exitHandler({ exit: true }));
    process.on('uncaughtException', () => exitHandler({ exit: true }));
}
let cli;
try {
    const projectLocalCli = node_1.resolve('@angular/cli', {
        checkGlobal: false,
        basedir: process.cwd(),
        preserveSymlinks: true,
    });
    // This was run from a global, check local version.
    const globalVersion = new semver_1.SemVer(packageJson['version']);
    let localVersion;
    let shouldWarn = false;
    try {
        localVersion = _fromPackageJson();
        shouldWarn = localVersion != null && globalVersion.compare(localVersion) > 0;
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        shouldWarn = true;
    }
    if (shouldWarn && config_1.isWarningEnabled('versionMismatch')) {
        const warning = core_1.terminal.yellow(core_1.tags.stripIndents `
    Your global Angular CLI version (${globalVersion}) is greater than your local
    version (${localVersion}). The local Angular CLI version is used.

    To disable this warning use "ng config -g cli.warnings.versionMismatch false".
    `);
        // Don't show warning colorised on `ng completion`
        if (process.argv[2] !== 'completion') {
            // eslint-disable-next-line no-console
            console.error(warning);
        }
        else {
            // eslint-disable-next-line no-console
            console.error(warning);
            process.exit(1);
        }
    }
    // No error implies a projectLocalCli, which will load whatever
    // version of ng-cli you have installed in a local package.json
    cli = require(projectLocalCli);
}
catch (_a) {
    // If there is an error, resolve could not find the ng-cli
    // library from a package.json. Instead, include it from a relative
    // path to this script file (which is likely a globally installed
    // npm package). Most common cause for hitting this is `ng new`
    cli = require('./cli');
}
if ('default' in cli) {
    cli = cli['default'];
}
// This is required to support 1.x local versions with a 6+ global
let standardInput;
try {
    standardInput = process.stdin;
}
catch (e) {
    delete process.stdin;
    process.stdin = new stream_1.Duplex();
    standardInput = process.stdin;
}
cli({
    cliArgs: process.argv.slice(2),
    inputStream: standardInput,
    outputStream: process.stdout,
})
    .then((exitCode) => {
    process.exit(exitCode);
})
    .catch((err) => {
    console.error('Unknown error: ' + err.toString());
    process.exit(127);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvbGliL2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCw2QkFBMkI7QUFDM0IsZ0NBQWdDO0FBQ2hDLHlEQUF5RDtBQUN6RCwrQ0FBc0Q7QUFDdEQsb0RBQW9EO0FBQ3BELHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQWdDO0FBQ2hDLG1DQUFnQztBQUNoQyxnREFBdUQ7QUFFdkQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFL0MsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFZO0lBQ3BDLEdBQUcsR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRTNCLEdBQUc7UUFDRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ2pGLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNsQyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRCxJQUFJLE9BQU8sRUFBRTtnQkFDWCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDbkIsT0FBTyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztpQkFDcEM7YUFDRjtTQUNGO1FBRUQsb0JBQW9CO1FBQ3BCLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3pCLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFFbkMsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0QsNENBQTRDO0FBQzVDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO0lBQ25DLElBQUksUUFHSCxDQUFDO0lBQ0YsSUFBSTtRQUNGLFFBQVEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLCtDQUErQztLQUN6RjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyw2RUFBNkU7WUFDM0Ysb0VBQW9FLEdBQUcsRUFBRSxDQUFDLENBQUM7S0FDOUU7SUFFRCxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7SUFFMUIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxPQUE4QyxFQUFFLEVBQUU7UUFDckUsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQ25CLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM1QyxFQUFFLENBQUMsYUFBYSxDQUNkLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDLEdBQUcsYUFBYSxFQUMvRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUMzQixDQUFDO1NBQ0g7UUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDaEIsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6RCxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hELE9BQU8sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNwRTtBQUVELElBQUksR0FBRyxDQUFDO0FBQ1IsSUFBSTtJQUNGLE1BQU0sZUFBZSxHQUFHLGNBQU8sQ0FDN0IsY0FBYyxFQUNkO1FBQ0UsV0FBVyxFQUFFLEtBQUs7UUFDbEIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDdEIsZ0JBQWdCLEVBQUUsSUFBSTtLQUN2QixDQUNGLENBQUM7SUFFRixtREFBbUQ7SUFDbkQsTUFBTSxhQUFhLEdBQUcsSUFBSSxlQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDekQsSUFBSSxZQUFZLENBQUM7SUFDakIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBRXZCLElBQUk7UUFDRixZQUFZLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztRQUNsQyxVQUFVLEdBQUcsWUFBWSxJQUFJLElBQUksSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUM5RTtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1Ysc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsVUFBVSxHQUFHLElBQUksQ0FBQztLQUNuQjtJQUVELElBQUksVUFBVSxJQUFJLHlCQUFnQixDQUFDLGlCQUFpQixDQUFDLEVBQUU7UUFDckQsTUFBTSxPQUFPLEdBQUcsZUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFJLENBQUMsWUFBWSxDQUFBO3VDQUNkLGFBQWE7ZUFDckMsWUFBWTs7O0tBR3RCLENBQUMsQ0FBQztRQUNILGtEQUFrRDtRQUNsRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssWUFBWSxFQUFFO1lBQ2xDLHNDQUFzQztZQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3hCO2FBQU07WUFDSCxzQ0FBc0M7WUFDeEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pCO0tBQ0Y7SUFFRCwrREFBK0Q7SUFDL0QsK0RBQStEO0lBQy9ELEdBQUcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7Q0FDaEM7QUFBQyxXQUFNO0lBQ04sMERBQTBEO0lBQzFELG1FQUFtRTtJQUNuRSxpRUFBaUU7SUFDakUsK0RBQStEO0lBQy9ELEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDeEI7QUFFRCxJQUFJLFNBQVMsSUFBSSxHQUFHLEVBQUU7SUFDcEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUN0QjtBQUVELGtFQUFrRTtBQUNsRSxJQUFJLGFBQWEsQ0FBQztBQUNsQixJQUFJO0lBQ0YsYUFBYSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7Q0FDL0I7QUFBQyxPQUFPLENBQUMsRUFBRTtJQUNWLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztJQUNyQixPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksZUFBTSxFQUFFLENBQUM7SUFDN0IsYUFBYSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7Q0FDL0I7QUFFRCxHQUFHLENBQUM7SUFDRixPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzlCLFdBQVcsRUFBRSxhQUFhO0lBQzFCLFlBQVksRUFBRSxPQUFPLENBQUMsTUFBTTtDQUM3QixDQUFDO0tBQ0MsSUFBSSxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFO0lBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDO0tBQ0QsS0FBSyxDQUFDLENBQUMsR0FBVSxFQUFFLEVBQUU7SUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICdzeW1ib2wtb2JzZXJ2YWJsZSc7XG4vLyBzeW1ib2wgcG9seWZpbGwgbXVzdCBnbyBmaXJzdFxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm9yZGVyZWQtaW1wb3J0cyBpbXBvcnQtZ3JvdXBzXG5pbXBvcnQgeyB0YWdzLCB0ZXJtaW5hbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBTZW1WZXIgfSBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgRHVwbGV4IH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IGlzV2FybmluZ0VuYWJsZWQgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcblxuY29uc3QgcGFja2FnZUpzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcblxuZnVuY3Rpb24gX2Zyb21QYWNrYWdlSnNvbihjd2Q/OiBzdHJpbmcpIHtcbiAgY3dkID0gY3dkIHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgZG8ge1xuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHBhdGguam9pbihjd2QsICdub2RlX21vZHVsZXMvQGFuZ3VsYXIvY2xpL3BhY2thZ2UuanNvbicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocGFja2FnZUpzb25QYXRoLCAndXRmLTgnKTtcbiAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICBpZiAoanNvblsndmVyc2lvbiddKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTZW1WZXIoanNvblsndmVyc2lvbiddKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIHRoZSBwYXJlbnQuXG4gICAgY3dkID0gcGF0aC5kaXJuYW1lKGN3ZCk7XG4gIH0gd2hpbGUgKGN3ZCAhPSBwYXRoLmRpcm5hbWUoY3dkKSk7XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLy8gQ2hlY2sgaWYgd2UgbmVlZCB0byBwcm9maWxlIHRoaXMgQ0xJIHJ1bi5cbmlmIChwcm9jZXNzLmVudlsnTkdfQ0xJX1BST0ZJTElORyddKSB7XG4gIGxldCBwcm9maWxlcjoge1xuICAgIHN0YXJ0UHJvZmlsaW5nOiAobmFtZT86IHN0cmluZywgcmVjc2FtcGxlcz86IGJvb2xlYW4pID0+IHZvaWQ7XG4gICAgc3RvcFByb2ZpbGluZzogKG5hbWU/OiBzdHJpbmcpID0+IGFueTsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1hbnlcbiAgfTtcbiAgdHJ5IHtcbiAgICBwcm9maWxlciA9IHJlcXVpcmUoJ3Y4LXByb2ZpbGVyLW5vZGU4Jyk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlcXVpcmUgJ3Y4LXByb2ZpbGVyLW5vZGU4Jy4gWW91IG11c3QgaW5zdGFsbCBpdCBzZXBhcmV0ZWx5IHdpdGggYCArXG4gICAgICBgJ25wbSBpbnN0YWxsIHY4LXByb2ZpbGVyLW5vZGU4IC0tbm8tc2F2ZScuXFxuXFxuT3JpZ2luYWwgZXJyb3I6XFxuXFxuJHtlcnJ9YCk7XG4gIH1cblxuICBwcm9maWxlci5zdGFydFByb2ZpbGluZygpO1xuXG4gIGNvbnN0IGV4aXRIYW5kbGVyID0gKG9wdGlvbnM6IHsgY2xlYW51cD86IGJvb2xlYW4sIGV4aXQ/OiBib29sZWFuIH0pID0+IHtcbiAgICBpZiAob3B0aW9ucy5jbGVhbnVwKSB7XG4gICAgICBjb25zdCBjcHVQcm9maWxlID0gcHJvZmlsZXIuc3RvcFByb2ZpbGluZygpO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgICAgcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIHByb2Nlc3MuZW52Lk5HX0NMSV9QUk9GSUxJTkcgfHwgJycpICsgJy5jcHVwcm9maWxlJyxcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoY3B1UHJvZmlsZSksXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmV4aXQpIHtcbiAgICAgIHByb2Nlc3MuZXhpdCgpO1xuICAgIH1cbiAgfTtcblxuICBwcm9jZXNzLm9uKCdleGl0JywgKCkgPT4gZXhpdEhhbmRsZXIoeyBjbGVhbnVwOiB0cnVlIH0pKTtcbiAgcHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4gZXhpdEhhbmRsZXIoeyBleGl0OiB0cnVlIH0pKTtcbiAgcHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoKSA9PiBleGl0SGFuZGxlcih7IGV4aXQ6IHRydWUgfSkpO1xufVxuXG5sZXQgY2xpO1xudHJ5IHtcbiAgY29uc3QgcHJvamVjdExvY2FsQ2xpID0gcmVzb2x2ZShcbiAgICAnQGFuZ3VsYXIvY2xpJyxcbiAgICB7XG4gICAgICBjaGVja0dsb2JhbDogZmFsc2UsXG4gICAgICBiYXNlZGlyOiBwcm9jZXNzLmN3ZCgpLFxuICAgICAgcHJlc2VydmVTeW1saW5rczogdHJ1ZSxcbiAgICB9LFxuICApO1xuXG4gIC8vIFRoaXMgd2FzIHJ1biBmcm9tIGEgZ2xvYmFsLCBjaGVjayBsb2NhbCB2ZXJzaW9uLlxuICBjb25zdCBnbG9iYWxWZXJzaW9uID0gbmV3IFNlbVZlcihwYWNrYWdlSnNvblsndmVyc2lvbiddKTtcbiAgbGV0IGxvY2FsVmVyc2lvbjtcbiAgbGV0IHNob3VsZFdhcm4gPSBmYWxzZTtcblxuICB0cnkge1xuICAgIGxvY2FsVmVyc2lvbiA9IF9mcm9tUGFja2FnZUpzb24oKTtcbiAgICBzaG91bGRXYXJuID0gbG9jYWxWZXJzaW9uICE9IG51bGwgJiYgZ2xvYmFsVmVyc2lvbi5jb21wYXJlKGxvY2FsVmVyc2lvbikgPiAwO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIHNob3VsZFdhcm4gPSB0cnVlO1xuICB9XG5cbiAgaWYgKHNob3VsZFdhcm4gJiYgaXNXYXJuaW5nRW5hYmxlZCgndmVyc2lvbk1pc21hdGNoJykpIHtcbiAgICBjb25zdCB3YXJuaW5nID0gdGVybWluYWwueWVsbG93KHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgIFlvdXIgZ2xvYmFsIEFuZ3VsYXIgQ0xJIHZlcnNpb24gKCR7Z2xvYmFsVmVyc2lvbn0pIGlzIGdyZWF0ZXIgdGhhbiB5b3VyIGxvY2FsXG4gICAgdmVyc2lvbiAoJHtsb2NhbFZlcnNpb259KS4gVGhlIGxvY2FsIEFuZ3VsYXIgQ0xJIHZlcnNpb24gaXMgdXNlZC5cblxuICAgIFRvIGRpc2FibGUgdGhpcyB3YXJuaW5nIHVzZSBcIm5nIGNvbmZpZyAtZyBjbGkud2FybmluZ3MudmVyc2lvbk1pc21hdGNoIGZhbHNlXCIuXG4gICAgYCk7XG4gICAgLy8gRG9uJ3Qgc2hvdyB3YXJuaW5nIGNvbG9yaXNlZCBvbiBgbmcgY29tcGxldGlvbmBcbiAgICBpZiAocHJvY2Vzcy5hcmd2WzJdICE9PSAnY29tcGxldGlvbicpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3Iod2FybmluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3Iod2FybmluZyk7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gTm8gZXJyb3IgaW1wbGllcyBhIHByb2plY3RMb2NhbENsaSwgd2hpY2ggd2lsbCBsb2FkIHdoYXRldmVyXG4gIC8vIHZlcnNpb24gb2YgbmctY2xpIHlvdSBoYXZlIGluc3RhbGxlZCBpbiBhIGxvY2FsIHBhY2thZ2UuanNvblxuICBjbGkgPSByZXF1aXJlKHByb2plY3RMb2NhbENsaSk7XG59IGNhdGNoIHtcbiAgLy8gSWYgdGhlcmUgaXMgYW4gZXJyb3IsIHJlc29sdmUgY291bGQgbm90IGZpbmQgdGhlIG5nLWNsaVxuICAvLyBsaWJyYXJ5IGZyb20gYSBwYWNrYWdlLmpzb24uIEluc3RlYWQsIGluY2x1ZGUgaXQgZnJvbSBhIHJlbGF0aXZlXG4gIC8vIHBhdGggdG8gdGhpcyBzY3JpcHQgZmlsZSAod2hpY2ggaXMgbGlrZWx5IGEgZ2xvYmFsbHkgaW5zdGFsbGVkXG4gIC8vIG5wbSBwYWNrYWdlKS4gTW9zdCBjb21tb24gY2F1c2UgZm9yIGhpdHRpbmcgdGhpcyBpcyBgbmcgbmV3YFxuICBjbGkgPSByZXF1aXJlKCcuL2NsaScpO1xufVxuXG5pZiAoJ2RlZmF1bHQnIGluIGNsaSkge1xuICBjbGkgPSBjbGlbJ2RlZmF1bHQnXTtcbn1cblxuLy8gVGhpcyBpcyByZXF1aXJlZCB0byBzdXBwb3J0IDEueCBsb2NhbCB2ZXJzaW9ucyB3aXRoIGEgNisgZ2xvYmFsXG5sZXQgc3RhbmRhcmRJbnB1dDtcbnRyeSB7XG4gIHN0YW5kYXJkSW5wdXQgPSBwcm9jZXNzLnN0ZGluO1xufSBjYXRjaCAoZSkge1xuICBkZWxldGUgcHJvY2Vzcy5zdGRpbjtcbiAgcHJvY2Vzcy5zdGRpbiA9IG5ldyBEdXBsZXgoKTtcbiAgc3RhbmRhcmRJbnB1dCA9IHByb2Nlc3Muc3RkaW47XG59XG5cbmNsaSh7XG4gIGNsaUFyZ3M6IHByb2Nlc3MuYXJndi5zbGljZSgyKSxcbiAgaW5wdXRTdHJlYW06IHN0YW5kYXJkSW5wdXQsXG4gIG91dHB1dFN0cmVhbTogcHJvY2Vzcy5zdGRvdXQsXG59KVxuICAudGhlbigoZXhpdENvZGU6IG51bWJlcikgPT4ge1xuICAgIHByb2Nlc3MuZXhpdChleGl0Q29kZSk7XG4gIH0pXG4gIC5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gZXJyb3I6ICcgKyBlcnIudG9TdHJpbmcoKSk7XG4gICAgcHJvY2Vzcy5leGl0KDEyNyk7XG4gIH0pO1xuIl19