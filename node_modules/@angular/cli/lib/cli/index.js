"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("@angular-devkit/core/node");
const command_runner_1 = require("../../models/command-runner");
const config_1 = require("../../utilities/config");
const project_1 = require("../../utilities/project");
async function default_1(options) {
    const logger = node_1.createConsoleLogger();
    let projectDetails = project_1.getWorkspaceDetails();
    if (projectDetails === null) {
        const [, localPath] = config_1.getWorkspaceRaw('local');
        if (localPath !== null) {
            logger.fatal(`An invalid configuration file was found ['${localPath}'].`
                + ' Please delete the file before running the command.');
            return 1;
        }
        projectDetails = { root: process.cwd() };
    }
    try {
        const maybeExitCode = await command_runner_1.runCommand(options.cliArgs, logger, projectDetails);
        if (typeof maybeExitCode === 'number') {
            console.assert(Number.isInteger(maybeExitCode));
            return maybeExitCode;
        }
        return 0;
    }
    catch (err) {
        if (err instanceof Error) {
            logger.fatal(err.message);
            if (err.stack) {
                logger.fatal(err.stack);
            }
        }
        else if (typeof err === 'string') {
            logger.fatal(err);
        }
        else if (typeof err === 'number') {
            // Log nothing.
        }
        else {
            logger.fatal('An unexpected error occurred: ' + JSON.stringify(err));
        }
        if (options.testing) {
            debugger;
            throw err;
        }
        return 1;
    }
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL2xpYi9jbGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxvREFBZ0U7QUFDaEUsZ0VBQXlEO0FBQ3pELG1EQUF5RDtBQUN6RCxxREFBOEQ7QUFHL0MsS0FBSyxvQkFBVSxPQUFpRDtJQUM3RSxNQUFNLE1BQU0sR0FBRywwQkFBbUIsRUFBRSxDQUFDO0lBRXJDLElBQUksY0FBYyxHQUFHLDZCQUFtQixFQUFFLENBQUM7SUFDM0MsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1FBQzNCLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxHQUFHLHdCQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxLQUFLLENBQUMsNkNBQTZDLFNBQVMsS0FBSztrQkFDM0QscURBQXFELENBQUMsQ0FBQztZQUVwRSxPQUFPLENBQUMsQ0FBQztTQUNWO1FBRUQsY0FBYyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0tBQzFDO0lBRUQsSUFBSTtRQUNGLE1BQU0sYUFBYSxHQUFHLE1BQU0sMkJBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNoRixJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRTtZQUNyQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUVoRCxPQUFPLGFBQWEsQ0FBQztTQUN0QjtRQUVELE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksR0FBRyxZQUFZLEtBQUssRUFBRTtZQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQixJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDekI7U0FDRjthQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbkI7YUFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtZQUNsQyxlQUFlO1NBQ2hCO2FBQU07WUFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUN0RTtRQUVELElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUNuQixRQUFRLENBQUM7WUFDVCxNQUFNLEdBQUcsQ0FBQztTQUNYO1FBRUQsT0FBTyxDQUFDLENBQUM7S0FDVjtBQUNILENBQUM7QUE5Q0QsNEJBOENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVDb25zb2xlTG9nZ2VyIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBydW5Db21tYW5kIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2NvbW1hbmQtcnVubmVyJztcbmltcG9ydCB7IGdldFdvcmtzcGFjZVJhdyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb25maWcnO1xuaW1wb3J0IHsgZ2V0V29ya3NwYWNlRGV0YWlscyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9wcm9qZWN0JztcblxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbihvcHRpb25zOiB7IHRlc3Rpbmc/OiBib29sZWFuLCBjbGlBcmdzOiBzdHJpbmdbXSB9KSB7XG4gIGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUNvbnNvbGVMb2dnZXIoKTtcblxuICBsZXQgcHJvamVjdERldGFpbHMgPSBnZXRXb3Jrc3BhY2VEZXRhaWxzKCk7XG4gIGlmIChwcm9qZWN0RGV0YWlscyA9PT0gbnVsbCkge1xuICAgIGNvbnN0IFssIGxvY2FsUGF0aF0gPSBnZXRXb3Jrc3BhY2VSYXcoJ2xvY2FsJyk7XG4gICAgaWYgKGxvY2FsUGF0aCAhPT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmZhdGFsKGBBbiBpbnZhbGlkIGNvbmZpZ3VyYXRpb24gZmlsZSB3YXMgZm91bmQgWycke2xvY2FsUGF0aH0nXS5gXG4gICAgICAgICAgICAgICAgICsgJyBQbGVhc2UgZGVsZXRlIHRoZSBmaWxlIGJlZm9yZSBydW5uaW5nIHRoZSBjb21tYW5kLicpO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBwcm9qZWN0RGV0YWlscyA9IHsgcm9vdDogcHJvY2Vzcy5jd2QoKSB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtYXliZUV4aXRDb2RlID0gYXdhaXQgcnVuQ29tbWFuZChvcHRpb25zLmNsaUFyZ3MsIGxvZ2dlciwgcHJvamVjdERldGFpbHMpO1xuICAgIGlmICh0eXBlb2YgbWF5YmVFeGl0Q29kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnNvbGUuYXNzZXJ0KE51bWJlci5pc0ludGVnZXIobWF5YmVFeGl0Q29kZSkpO1xuXG4gICAgICByZXR1cm4gbWF5YmVFeGl0Q29kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBsb2dnZXIuZmF0YWwoZXJyLm1lc3NhZ2UpO1xuICAgICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgICBsb2dnZXIuZmF0YWwoZXJyLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsb2dnZXIuZmF0YWwoZXJyKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlcnIgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBMb2cgbm90aGluZy5cbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLmZhdGFsKCdBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkOiAnICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMudGVzdGluZykge1xuICAgICAgZGVidWdnZXI7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIDE7XG4gIH1cbn1cbiJdfQ==