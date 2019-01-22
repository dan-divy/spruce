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
const fs_1 = require("fs");
const path_1 = require("path");
const find_up_1 = require("../utilities/find-up");
const json_schema_1 = require("../utilities/json-schema");
const command_1 = require("./command");
const parser = require("./parser");
/**
 * Run a command.
 * @param args Raw unparsed arguments.
 * @param logger The logger to use.
 * @param workspace Workspace information.
 * @param commands The map of supported commands.
 */
async function runCommand(args, logger, workspace, commands) {
    if (commands === undefined) {
        const commandMapPath = find_up_1.findUp('commands.json', __dirname);
        if (commandMapPath === null) {
            throw new Error('Unable to find command map.');
        }
        const cliDir = path_1.dirname(commandMapPath);
        const commandsText = fs_1.readFileSync(commandMapPath).toString('utf-8');
        const commandJson = core_1.json.parseJson(commandsText, core_1.JsonParseMode.Loose, { path: commandMapPath });
        if (!core_1.isJsonObject(commandJson)) {
            throw Error('Invalid command.json');
        }
        commands = {};
        for (const commandName of Object.keys(commandJson)) {
            const commandValue = commandJson[commandName];
            if (typeof commandValue == 'string') {
                commands[commandName] = path_1.resolve(cliDir, commandValue);
            }
        }
    }
    // This registry is exclusively used for flattening schemas, and not for validating.
    const registry = new core_1.schema.CoreSchemaRegistry([]);
    registry.registerUriHandler((uri) => {
        if (uri.startsWith('ng-cli://')) {
            const content = fs_1.readFileSync(path_1.join(__dirname, '..', uri.substr('ng-cli://'.length)), 'utf-8');
            return Promise.resolve(JSON.parse(content));
        }
        else {
            return null;
        }
    });
    // Normalize the commandMap
    const commandMap = {};
    for (const name of Object.keys(commands)) {
        const schemaPath = commands[name];
        const schemaContent = fs_1.readFileSync(schemaPath, 'utf-8');
        const schema = core_1.json.parseJson(schemaContent, core_1.JsonParseMode.Loose, { path: schemaPath });
        if (!core_1.isJsonObject(schema)) {
            throw new Error('Invalid command JSON loaded from ' + JSON.stringify(schemaPath));
        }
        commandMap[name] =
            await json_schema_1.parseJsonSchemaToCommandDescription(name, schemaPath, registry, schema);
    }
    let commandName = undefined;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg in commandMap) {
            commandName = arg;
            args.splice(i, 1);
            break;
        }
        else if (!arg.startsWith('-')) {
            commandName = arg;
            args.splice(i, 1);
            break;
        }
    }
    // if no commands were found, use `help`.
    if (commandName === undefined) {
        if (args.length === 1 && args[0] === '--version') {
            commandName = 'version';
        }
        else {
            commandName = 'help';
        }
    }
    let description = null;
    if (commandName !== undefined) {
        if (commandMap[commandName]) {
            description = commandMap[commandName];
        }
        else {
            Object.keys(commandMap).forEach(name => {
                const commandDescription = commandMap[name];
                const aliases = commandDescription.aliases;
                let found = false;
                if (aliases) {
                    if (aliases.some(alias => alias === commandName)) {
                        found = true;
                    }
                }
                if (found) {
                    if (description) {
                        throw new Error('Found multiple commands with the same alias.');
                    }
                    commandName = name;
                    description = commandDescription;
                }
            });
        }
    }
    if (!commandName) {
        logger.error(core_1.tags.stripIndent `
        We could not find a command from the arguments and the help command seems to be disabled.
        This is an issue with the CLI itself. If you see this comment, please report it and
        provide your repository.
      `);
        return 1;
    }
    if (!description) {
        const commandsDistance = {};
        const name = commandName;
        const allCommands = Object.keys(commandMap).sort((a, b) => {
            if (!(a in commandsDistance)) {
                commandsDistance[a] = core_1.strings.levenshtein(a, name);
            }
            if (!(b in commandsDistance)) {
                commandsDistance[b] = core_1.strings.levenshtein(b, name);
            }
            return commandsDistance[a] - commandsDistance[b];
        });
        logger.error(core_1.tags.stripIndent `
        The specified command ("${commandName}") is invalid. For a list of available options,
        run "ng help".

        Did you mean "${allCommands[0]}"?
    `);
        return 1;
    }
    try {
        const parsedOptions = parser.parseArguments(args, description.options, logger);
        command_1.Command.setCommandMap(commandMap);
        const command = new description.impl({ workspace }, description, logger);
        return await command.validateAndRun(parsedOptions);
    }
    catch (e) {
        if (e instanceof parser.ParseArgumentException) {
            logger.fatal('Cannot parse arguments. See below for the reasons.');
            logger.fatal('    ' + e.comments.join('\n    '));
            return 1;
        }
        else {
            throw e;
        }
    }
}
exports.runCommand = runCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL21vZGVscy9jb21tYW5kLXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQVE4QjtBQUM5QiwyQkFBa0M7QUFDbEMsK0JBQThDO0FBQzlDLGtEQUE4QztBQUM5QywwREFBK0U7QUFDL0UsdUNBQW9DO0FBTXBDLG1DQUFtQztBQU9uQzs7Ozs7O0dBTUc7QUFDSSxLQUFLLFVBQVUsVUFBVSxDQUM5QixJQUFjLEVBQ2QsTUFBc0IsRUFDdEIsU0FBMkIsRUFDM0IsUUFBNEI7SUFFNUIsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1FBQzFCLE1BQU0sY0FBYyxHQUFHLGdCQUFNLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFELElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtZQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7UUFDRCxNQUFNLE1BQU0sR0FBRyxjQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdkMsTUFBTSxZQUFZLEdBQUcsaUJBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEUsTUFBTSxXQUFXLEdBQUcsV0FBSSxDQUFDLFNBQVMsQ0FDaEMsWUFBWSxFQUNaLG9CQUFhLENBQUMsS0FBSyxFQUNuQixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FDekIsQ0FBQztRQUNGLElBQUksQ0FBQyxtQkFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzlCLE1BQU0sS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7U0FDckM7UUFFRCxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2QsS0FBSyxNQUFNLFdBQVcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ2xE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QU0sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRWpELE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7YUFBTTtZQUNMLE1BQU0sQ0FBQyxDQUFDO1NBQ1Q7S0FDRjtBQUNILENBQUM7QUEvSkQsZ0NBK0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgSnNvblBhcnNlTW9kZSxcbiAgaXNKc29uT2JqZWN0LFxuICBqc29uLFxuICBsb2dnaW5nLFxuICBzY2hlbWEsXG4gIHN0cmluZ3MsXG4gIHRhZ3MsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbmRVcCB9IGZyb20gJy4uL3V0aWxpdGllcy9maW5kLXVwJztcbmltcG9ydCB7IHBhcnNlSnNvblNjaGVtYVRvQ29tbWFuZERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2pzb24tc2NoZW1hJztcbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tICcuL2NvbW1hbmQnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZERlc2NyaXB0aW9uLFxuICBDb21tYW5kRGVzY3JpcHRpb25NYXAsXG4gIENvbW1hbmRXb3Jrc3BhY2UsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCAqIGFzIHBhcnNlciBmcm9tICcuL3BhcnNlcic7XG5cblxuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kTWFwT3B0aW9ucyB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZztcbn1cblxuLyoqXG4gKiBSdW4gYSBjb21tYW5kLlxuICogQHBhcmFtIGFyZ3MgUmF3IHVucGFyc2VkIGFyZ3VtZW50cy5cbiAqIEBwYXJhbSBsb2dnZXIgVGhlIGxvZ2dlciB0byB1c2UuXG4gKiBAcGFyYW0gd29ya3NwYWNlIFdvcmtzcGFjZSBpbmZvcm1hdGlvbi5cbiAqIEBwYXJhbSBjb21tYW5kcyBUaGUgbWFwIG9mIHN1cHBvcnRlZCBjb21tYW5kcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkNvbW1hbmQoXG4gIGFyZ3M6IHN0cmluZ1tdLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyLFxuICB3b3Jrc3BhY2U6IENvbW1hbmRXb3Jrc3BhY2UsXG4gIGNvbW1hbmRzPzogQ29tbWFuZE1hcE9wdGlvbnMsXG4pOiBQcm9taXNlPG51bWJlciB8IHZvaWQ+IHtcbiAgaWYgKGNvbW1hbmRzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBjb21tYW5kTWFwUGF0aCA9IGZpbmRVcCgnY29tbWFuZHMuanNvbicsIF9fZGlybmFtZSk7XG4gICAgaWYgKGNvbW1hbmRNYXBQYXRoID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIGNvbW1hbmQgbWFwLicpO1xuICAgIH1cbiAgICBjb25zdCBjbGlEaXIgPSBkaXJuYW1lKGNvbW1hbmRNYXBQYXRoKTtcbiAgICBjb25zdCBjb21tYW5kc1RleHQgPSByZWFkRmlsZVN5bmMoY29tbWFuZE1hcFBhdGgpLnRvU3RyaW5nKCd1dGYtOCcpO1xuICAgIGNvbnN0IGNvbW1hbmRKc29uID0ganNvbi5wYXJzZUpzb24oXG4gICAgICBjb21tYW5kc1RleHQsXG4gICAgICBKc29uUGFyc2VNb2RlLkxvb3NlLFxuICAgICAgeyBwYXRoOiBjb21tYW5kTWFwUGF0aCB9LFxuICAgICk7XG4gICAgaWYgKCFpc0pzb25PYmplY3QoY29tbWFuZEpzb24pKSB7XG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBjb21tYW5kLmpzb24nKTtcbiAgICB9XG5cbiAgICBjb21tYW5kcyA9IHt9O1xuICAgIGZvciAoY29uc3QgY29tbWFuZE5hbWUgb2YgT2JqZWN0LmtleXMoY29tbWFuZEpzb24pKSB7XG4gICAgICBjb25zdCBjb21tYW5kVmFsdWUgPSBjb21tYW5kSnNvbltjb21tYW5kTmFtZV07XG4gICAgICBpZiAodHlwZW9mIGNvbW1hbmRWYWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICBjb21tYW5kc1tjb21tYW5kTmFtZV0gPSByZXNvbHZlKGNsaURpciwgY29tbWFuZFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIHJlZ2lzdHJ5IGlzIGV4Y2x1c2l2ZWx5IHVzZWQgZm9yIGZsYXR0ZW5pbmcgc2NoZW1hcywgYW5kIG5vdCBmb3IgdmFsaWRhdGluZy5cbiAgY29uc3QgcmVnaXN0cnkgPSBuZXcgc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeShbXSk7XG4gIHJlZ2lzdHJ5LnJlZ2lzdGVyVXJpSGFuZGxlcigodXJpOiBzdHJpbmcpID0+IHtcbiAgICBpZiAodXJpLnN0YXJ0c1dpdGgoJ25nLWNsaTovLycpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4nLCB1cmkuc3Vic3RyKCduZy1jbGk6Ly8nLmxlbmd0aCkpLCAndXRmLTgnKTtcblxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShKU09OLnBhcnNlKGNvbnRlbnQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcblxuICAvLyBOb3JtYWxpemUgdGhlIGNvbW1hbmRNYXBcbiAgY29uc3QgY29tbWFuZE1hcDogQ29tbWFuZERlc2NyaXB0aW9uTWFwID0ge307XG4gIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhjb21tYW5kcykpIHtcbiAgICBjb25zdCBzY2hlbWFQYXRoID0gY29tbWFuZHNbbmFtZV07XG4gICAgY29uc3Qgc2NoZW1hQ29udGVudCA9IHJlYWRGaWxlU3luYyhzY2hlbWFQYXRoLCAndXRmLTgnKTtcbiAgICBjb25zdCBzY2hlbWEgPSBqc29uLnBhcnNlSnNvbihzY2hlbWFDb250ZW50LCBKc29uUGFyc2VNb2RlLkxvb3NlLCB7IHBhdGg6IHNjaGVtYVBhdGggfSk7XG4gICAgaWYgKCFpc0pzb25PYmplY3Qoc2NoZW1hKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbW1hbmQgSlNPTiBsb2FkZWQgZnJvbSAnICsgSlNPTi5zdHJpbmdpZnkoc2NoZW1hUGF0aCkpO1xuICAgIH1cblxuICAgIGNvbW1hbmRNYXBbbmFtZV0gPVxuICAgICAgYXdhaXQgcGFyc2VKc29uU2NoZW1hVG9Db21tYW5kRGVzY3JpcHRpb24obmFtZSwgc2NoZW1hUGF0aCwgcmVnaXN0cnksIHNjaGVtYSk7XG4gIH1cblxuICBsZXQgY29tbWFuZE5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXTtcblxuICAgIGlmIChhcmcgaW4gY29tbWFuZE1hcCkge1xuICAgICAgY29tbWFuZE5hbWUgPSBhcmc7XG4gICAgICBhcmdzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH0gZWxzZSBpZiAoIWFyZy5zdGFydHNXaXRoKCctJykpIHtcbiAgICAgIGNvbW1hbmROYW1lID0gYXJnO1xuICAgICAgYXJncy5zcGxpY2UoaSwgMSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBpZiBubyBjb21tYW5kcyB3ZXJlIGZvdW5kLCB1c2UgYGhlbHBgLlxuICBpZiAoY29tbWFuZE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdID09PSAnLS12ZXJzaW9uJykge1xuICAgICAgY29tbWFuZE5hbWUgPSAndmVyc2lvbic7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbW1hbmROYW1lID0gJ2hlbHAnO1xuICAgIH1cbiAgfVxuXG4gIGxldCBkZXNjcmlwdGlvbjogQ29tbWFuZERlc2NyaXB0aW9uIHwgbnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvbW1hbmROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoY29tbWFuZE1hcFtjb21tYW5kTmFtZV0pIHtcbiAgICAgIGRlc2NyaXB0aW9uID0gY29tbWFuZE1hcFtjb21tYW5kTmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIE9iamVjdC5rZXlzKGNvbW1hbmRNYXApLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbW1hbmREZXNjcmlwdGlvbiA9IGNvbW1hbmRNYXBbbmFtZV07XG4gICAgICAgIGNvbnN0IGFsaWFzZXMgPSBjb21tYW5kRGVzY3JpcHRpb24uYWxpYXNlcztcblxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGFsaWFzZXMpIHtcbiAgICAgICAgICBpZiAoYWxpYXNlcy5zb21lKGFsaWFzID0+IGFsaWFzID09PSBjb21tYW5kTmFtZSkpIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRm91bmQgbXVsdGlwbGUgY29tbWFuZHMgd2l0aCB0aGUgc2FtZSBhbGlhcy4nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29tbWFuZE5hbWUgPSBuYW1lO1xuICAgICAgICAgIGRlc2NyaXB0aW9uID0gY29tbWFuZERlc2NyaXB0aW9uO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbW1hbmROYW1lKSB7XG4gICAgbG9nZ2VyLmVycm9yKHRhZ3Muc3RyaXBJbmRlbnRgXG4gICAgICAgIFdlIGNvdWxkIG5vdCBmaW5kIGEgY29tbWFuZCBmcm9tIHRoZSBhcmd1bWVudHMgYW5kIHRoZSBoZWxwIGNvbW1hbmQgc2VlbXMgdG8gYmUgZGlzYWJsZWQuXG4gICAgICAgIFRoaXMgaXMgYW4gaXNzdWUgd2l0aCB0aGUgQ0xJIGl0c2VsZi4gSWYgeW91IHNlZSB0aGlzIGNvbW1lbnQsIHBsZWFzZSByZXBvcnQgaXQgYW5kXG4gICAgICAgIHByb3ZpZGUgeW91ciByZXBvc2l0b3J5LlxuICAgICAgYCk7XG5cbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBjb21tYW5kc0Rpc3RhbmNlID0ge30gYXMgeyBbbmFtZTogc3RyaW5nXTogbnVtYmVyIH07XG4gICAgY29uc3QgbmFtZSA9IGNvbW1hbmROYW1lO1xuICAgIGNvbnN0IGFsbENvbW1hbmRzID0gT2JqZWN0LmtleXMoY29tbWFuZE1hcCkuc29ydCgoYSwgYikgPT4ge1xuICAgICAgaWYgKCEoYSBpbiBjb21tYW5kc0Rpc3RhbmNlKSkge1xuICAgICAgICBjb21tYW5kc0Rpc3RhbmNlW2FdID0gc3RyaW5ncy5sZXZlbnNodGVpbihhLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmICghKGIgaW4gY29tbWFuZHNEaXN0YW5jZSkpIHtcbiAgICAgICAgY29tbWFuZHNEaXN0YW5jZVtiXSA9IHN0cmluZ3MubGV2ZW5zaHRlaW4oYiwgbmFtZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb21tYW5kc0Rpc3RhbmNlW2FdIC0gY29tbWFuZHNEaXN0YW5jZVtiXTtcbiAgICB9KTtcblxuICAgIGxvZ2dlci5lcnJvcih0YWdzLnN0cmlwSW5kZW50YFxuICAgICAgICBUaGUgc3BlY2lmaWVkIGNvbW1hbmQgKFwiJHtjb21tYW5kTmFtZX1cIikgaXMgaW52YWxpZC4gRm9yIGEgbGlzdCBvZiBhdmFpbGFibGUgb3B0aW9ucyxcbiAgICAgICAgcnVuIFwibmcgaGVscFwiLlxuXG4gICAgICAgIERpZCB5b3UgbWVhbiBcIiR7YWxsQ29tbWFuZHNbMF19XCI/XG4gICAgYCk7XG5cbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkT3B0aW9ucyA9IHBhcnNlci5wYXJzZUFyZ3VtZW50cyhhcmdzLCBkZXNjcmlwdGlvbi5vcHRpb25zLCBsb2dnZXIpO1xuICAgIENvbW1hbmQuc2V0Q29tbWFuZE1hcChjb21tYW5kTWFwKTtcbiAgICBjb25zdCBjb21tYW5kID0gbmV3IGRlc2NyaXB0aW9uLmltcGwoeyB3b3Jrc3BhY2UgfSwgZGVzY3JpcHRpb24sIGxvZ2dlcik7XG5cbiAgICByZXR1cm4gYXdhaXQgY29tbWFuZC52YWxpZGF0ZUFuZFJ1bihwYXJzZWRPcHRpb25zKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgcGFyc2VyLlBhcnNlQXJndW1lbnRFeGNlcHRpb24pIHtcbiAgICAgIGxvZ2dlci5mYXRhbCgnQ2Fubm90IHBhcnNlIGFyZ3VtZW50cy4gU2VlIGJlbG93IGZvciB0aGUgcmVhc29ucy4nKTtcbiAgICAgIGxvZ2dlci5mYXRhbCgnICAgICcgKyBlLmNvbW1lbnRzLmpvaW4oJ1xcbiAgICAnKSk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufVxuIl19