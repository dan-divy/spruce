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
const node_1 = require("@angular-devkit/core/node");
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
const inquirer = require("inquirer");
const systemPath = require("path");
const workspace_loader_1 = require("../models/workspace-loader");
const config_1 = require("../utilities/config");
const json_schema_1 = require("../utilities/json-schema");
const package_manager_1 = require("../utilities/package-manager");
const command_1 = require("./command");
const parser_1 = require("./parser");
class UnknownCollectionError extends Error {
    constructor(collectionName) {
        super(`Invalid collection (${collectionName}).`);
    }
}
exports.UnknownCollectionError = UnknownCollectionError;
class SchematicCommand extends command_1.Command {
    constructor(context, description, logger, _engineHost = new tools_1.NodeModulesEngineHost()) {
        super(context, description, logger);
        this._engineHost = _engineHost;
        this.allowPrivateSchematics = false;
        this._host = new node_1.NodeJsSyncHost();
        this.collectionName = '@schematics/angular';
        this._engine = new schematics_1.SchematicEngine(this._engineHost);
    }
    async initialize(options) {
        await this._loadWorkspace();
        this.createWorkflow(options);
        if (this.schematicName) {
            // Set the options.
            const collection = this.getCollection(this.collectionName);
            const schematic = this.getSchematic(collection, this.schematicName, true);
            const options = await json_schema_1.parseJsonSchemaToOptions(this._workflow.registry, schematic.description.schemaJson || {});
            this.description.options.push(...options.filter(x => !x.hidden));
        }
    }
    async printHelp(options) {
        await super.printHelp(options);
        this.logger.info('');
        const subCommandOption = this.description.options.filter(x => x.subcommands)[0];
        if (!subCommandOption || !subCommandOption.subcommands) {
            return 0;
        }
        const schematicNames = Object.keys(subCommandOption.subcommands);
        if (schematicNames.length > 1) {
            this.logger.info('Available Schematics:');
            const namesPerCollection = {};
            schematicNames.forEach(name => {
                let [collectionName, schematicName] = name.split(/:/, 2);
                if (!schematicName) {
                    schematicName = collectionName;
                    collectionName = this.collectionName;
                }
                if (!namesPerCollection[collectionName]) {
                    namesPerCollection[collectionName] = [];
                }
                namesPerCollection[collectionName].push(schematicName);
            });
            const defaultCollection = this.getDefaultSchematicCollection();
            Object.keys(namesPerCollection).forEach(collectionName => {
                const isDefault = defaultCollection == collectionName;
                this.logger.info(`  Collection "${collectionName}"${isDefault ? ' (default)' : ''}:`);
                namesPerCollection[collectionName].forEach(schematicName => {
                    this.logger.info(`    ${schematicName}`);
                });
            });
        }
        else if (schematicNames.length == 1) {
            this.logger.info('Help for schematic ' + schematicNames[0]);
            await this.printHelpSubcommand(subCommandOption.subcommands[schematicNames[0]]);
        }
        return 0;
    }
    async printHelpUsage() {
        const subCommandOption = this.description.options.filter(x => x.subcommands)[0];
        if (!subCommandOption || !subCommandOption.subcommands) {
            return;
        }
        const schematicNames = Object.keys(subCommandOption.subcommands);
        if (schematicNames.length == 1) {
            this.logger.info(this.description.description);
            const opts = this.description.options.filter(x => x.positional === undefined);
            const [collectionName, schematicName] = schematicNames[0].split(/:/)[0];
            // Display <collectionName:schematicName> if this is not the default collectionName,
            // otherwise just show the schematicName.
            const displayName = collectionName == this.getDefaultSchematicCollection()
                ? schematicName
                : schematicNames[0];
            const schematicOptions = subCommandOption.subcommands[schematicNames[0]].options;
            const schematicArgs = schematicOptions.filter(x => x.positional !== undefined);
            const argDisplay = schematicArgs.length > 0
                ? ' ' + schematicArgs.map(a => `<${core_1.strings.dasherize(a.name)}>`).join(' ')
                : '';
            this.logger.info(core_1.tags.oneLine `
        usage: ng ${this.description.name} ${displayName}${argDisplay}
        ${opts.length > 0 ? `[options]` : ``}
      `);
            this.logger.info('');
        }
        else {
            await super.printHelpUsage();
        }
    }
    getEngineHost() {
        return this._engineHost;
    }
    getEngine() {
        return this._engine;
    }
    getCollection(collectionName) {
        const engine = this.getEngine();
        const collection = engine.createCollection(collectionName);
        if (collection === null) {
            throw new UnknownCollectionError(collectionName);
        }
        return collection;
    }
    getSchematic(collection, schematicName, allowPrivate) {
        return collection.createSchematic(schematicName, allowPrivate);
    }
    setPathOptions(options, workingDir) {
        if (workingDir === '') {
            return {};
        }
        return options
            .filter(o => o.format === 'path')
            .map(o => o.name)
            .reduce((acc, curr) => {
            acc[curr] = workingDir;
            return acc;
        }, {});
    }
    /*
     * Runtime hook to allow specifying customized workflow
     */
    createWorkflow(options) {
        if (this._workflow) {
            return this._workflow;
        }
        const { force, dryRun } = options;
        const fsHost = new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), core_1.normalize(this.workspace.root));
        const workflow = new tools_1.NodeWorkflow(fsHost, {
            force,
            dryRun,
            packageManager: package_manager_1.getPackageManager(this.workspace.root),
            root: core_1.normalize(this.workspace.root),
        });
        this._engineHost.registerOptionsTransform(tools_1.validateOptionsWithSchema(workflow.registry));
        if (options.defaults) {
            workflow.registry.addPreTransform(core_1.schema.transforms.addUndefinedDefaults);
        }
        else {
            workflow.registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        }
        workflow.registry.addSmartDefaultProvider('projectName', () => {
            if (this._workspace) {
                try {
                    return this._workspace.getProjectByPath(core_1.normalize(process.cwd()))
                        || this._workspace.getDefaultProjectName();
                }
                catch (e) {
                    if (e instanceof core_1.experimental.workspace.AmbiguousProjectPathException) {
                        this.logger.warn(core_1.tags.oneLine `
              Two or more projects are using identical roots.
              Unable to determine project using current working directory.
              Using default workspace project instead.
            `);
                        return this._workspace.getDefaultProjectName();
                    }
                    throw e;
                }
            }
            return undefined;
        });
        if (options.interactive !== false && process.stdout.isTTY) {
            workflow.registry.usePromptProvider((definitions) => {
                const questions = definitions.map(definition => {
                    const question = {
                        name: definition.id,
                        message: definition.message,
                        default: definition.default,
                    };
                    const validator = definition.validator;
                    if (validator) {
                        question.validate = input => validator(input);
                    }
                    switch (definition.type) {
                        case 'confirmation':
                            question.type = 'confirm';
                            break;
                        case 'list':
                            question.type = 'list';
                            question.choices = definition.items && definition.items.map(item => {
                                if (typeof item == 'string') {
                                    return item;
                                }
                                else {
                                    return {
                                        name: item.label,
                                        value: item.value,
                                    };
                                }
                            });
                            break;
                        default:
                            question.type = definition.type;
                            break;
                    }
                    return question;
                });
                return inquirer.prompt(questions);
            });
        }
        return this._workflow = workflow;
    }
    getDefaultSchematicCollection() {
        let workspace = config_1.getWorkspace('local');
        if (workspace) {
            const project = config_1.getProjectByCwd(workspace);
            if (project && workspace.getProjectCli(project)) {
                const value = workspace.getProjectCli(project)['defaultCollection'];
                if (typeof value == 'string') {
                    return value;
                }
            }
            if (workspace.getCli()) {
                const value = workspace.getCli()['defaultCollection'];
                if (typeof value == 'string') {
                    return value;
                }
            }
        }
        workspace = config_1.getWorkspace('global');
        if (workspace && workspace.getCli()) {
            const value = workspace.getCli()['defaultCollection'];
            if (typeof value == 'string') {
                return value;
            }
        }
        return this.collectionName;
    }
    async runSchematic(options) {
        const { schematicOptions, debug, dryRun } = options;
        let { collectionName, schematicName } = options;
        let nothingDone = true;
        let loggingQueue = [];
        let error = false;
        const workflow = this._workflow;
        const workingDir = core_1.normalize(systemPath.relative(this.workspace.root, process.cwd()));
        // Get the option object from the schematic schema.
        const schematic = this.getSchematic(this.getCollection(collectionName), schematicName, this.allowPrivateSchematics);
        // Update the schematic and collection name in case they're not the same as the ones we
        // received in our options, e.g. after alias resolution or extension.
        collectionName = schematic.collection.description.name;
        schematicName = schematic.description.name;
        // TODO: Remove warning check when 'targets' is default
        if (collectionName !== this.collectionName) {
            const [ast, configPath] = config_1.getWorkspaceRaw('local');
            if (ast) {
                const projectsKeyValue = ast.properties.find(p => p.key.value === 'projects');
                if (!projectsKeyValue || projectsKeyValue.value.kind !== 'object') {
                    return;
                }
                const positions = [];
                for (const projectKeyValue of projectsKeyValue.value.properties) {
                    const projectNode = projectKeyValue.value;
                    if (projectNode.kind !== 'object') {
                        continue;
                    }
                    const targetsKeyValue = projectNode.properties.find(p => p.key.value === 'targets');
                    if (targetsKeyValue) {
                        positions.push(targetsKeyValue.start);
                    }
                }
                if (positions.length > 0) {
                    const warning = core_1.tags.oneLine `
            WARNING: This command may not execute successfully.
            The package/collection may not support the 'targets' field within '${configPath}'.
            This can be corrected by renaming the following 'targets' fields to 'architect':
          `;
                    const locations = positions
                        .map((p, i) => `${i + 1}) Line: ${p.line + 1}; Column: ${p.character + 1}`)
                        .join('\n');
                    this.logger.warn(warning + '\n' + locations + '\n');
                }
            }
        }
        // Set the options of format "path".
        let o = null;
        let args;
        if (!schematic.description.schemaJson) {
            args = await this.parseFreeFormArguments(schematicOptions || []);
        }
        else {
            o = await json_schema_1.parseJsonSchemaToOptions(workflow.registry, schematic.description.schemaJson);
            args = await this.parseArguments(schematicOptions || [], o);
        }
        const pathOptions = o ? this.setPathOptions(o, workingDir) : {};
        let input = Object.assign(pathOptions, args);
        // Read the default values from the workspace.
        const projectName = input.project !== undefined ? '' + input.project : null;
        const defaults = config_1.getSchematicDefaults(collectionName, schematicName, projectName);
        input = Object.assign({}, defaults, input, options.additionalOptions);
        workflow.reporter.subscribe((event) => {
            nothingDone = false;
            // Strip leading slash to prevent confusion.
            const eventPath = event.path.startsWith('/') ? event.path.substr(1) : event.path;
            switch (event.kind) {
                case 'error':
                    error = true;
                    const desc = event.description == 'alreadyExist' ? 'already exists' : 'does not exist.';
                    this.logger.warn(`ERROR! ${eventPath} ${desc}.`);
                    break;
                case 'update':
                    loggingQueue.push(core_1.tags.oneLine `
            ${core_1.terminal.white('UPDATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'create':
                    loggingQueue.push(core_1.tags.oneLine `
            ${core_1.terminal.green('CREATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'delete':
                    loggingQueue.push(`${core_1.terminal.yellow('DELETE')} ${eventPath}`);
                    break;
                case 'rename':
                    loggingQueue.push(`${core_1.terminal.blue('RENAME')} ${eventPath} => ${event.to}`);
                    break;
            }
        });
        workflow.lifeCycle.subscribe(event => {
            if (event.kind == 'end' || event.kind == 'post-tasks-start') {
                if (!error) {
                    // Output the logging queue, no error happened.
                    loggingQueue.forEach(log => this.logger.info(log));
                }
                loggingQueue = [];
                error = false;
            }
        });
        return new Promise((resolve) => {
            workflow.execute({
                collection: collectionName,
                schematic: schematicName,
                options: input,
                debug: debug,
                logger: this.logger,
                allowPrivate: this.allowPrivateSchematics,
            })
                .subscribe({
                error: (err) => {
                    // In case the workflow was not successful, show an appropriate error message.
                    if (err instanceof schematics_1.UnsuccessfulWorkflowExecution) {
                        // "See above" because we already printed the error.
                        this.logger.fatal('The Schematic workflow failed. See above.');
                    }
                    else if (debug) {
                        this.logger.fatal(`An error occured:\n${err.message}\n${err.stack}`);
                    }
                    else {
                        this.logger.fatal(err.message);
                    }
                    resolve(1);
                },
                complete: () => {
                    const showNothingDone = !(options.showNothingDone === false);
                    if (nothingDone && showNothingDone) {
                        this.logger.info('Nothing to be done.');
                    }
                    if (dryRun) {
                        this.logger.warn(`\nNOTE: The "dryRun" flag means no changes were made.`);
                    }
                    resolve();
                },
            });
        });
    }
    async parseFreeFormArguments(schematicOptions) {
        return parser_1.parseFreeFormArguments(schematicOptions);
    }
    async parseArguments(schematicOptions, options) {
        return parser_1.parseArguments(schematicOptions, options, this.logger);
    }
    async _loadWorkspace() {
        if (this._workspace) {
            return;
        }
        const workspaceLoader = new workspace_loader_1.WorkspaceLoader(this._host);
        try {
            this._workspace = await workspaceLoader.loadWorkspace(this.workspace.root);
        }
        catch (err) {
            if (!this.allowMissingWorkspace) {
                // Ignore missing workspace
                throw err;
            }
        }
    }
}
exports.SchematicCommand = SchematicCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLWNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL21vZGVscy9zY2hlbWF0aWMtY29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQVU4QjtBQUM5QixvREFBMkQ7QUFDM0QsMkRBTW9DO0FBQ3BDLDREQVMwQztBQUMxQyxxQ0FBcUM7QUFDckMsbUNBQW1DO0FBQ25DLGlFQUE2RDtBQUM3RCxnREFLNkI7QUFDN0IsMERBQW9FO0FBQ3BFLGtFQUFpRTtBQUNqRSx1Q0FBd0Q7QUFFeEQscUNBQWtFO0FBb0JsRSxNQUFhLHNCQUF1QixTQUFRLEtBQUs7SUFDL0MsWUFBWSxjQUFzQjtRQUNoQyxLQUFLLENBQUMsdUJBQXVCLGNBQWMsSUFBSSxDQUFDLENBQUM7SUFDbkQsQ0FBQztDQUNGO0FBSkQsd0RBSUM7QUFFRCxNQUFzQixnQkFFcEIsU0FBUSxpQkFBVTtJQVVsQixZQUNFLE9BQXVCLEVBQ3ZCLFdBQStCLEVBQy9CLE1BQXNCLEVBQ0wsY0FBd0MsSUFBSSw2QkFBcUIsRUFBRTtRQUVwRixLQUFLLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUZuQixnQkFBVyxHQUFYLFdBQVcsQ0FBd0Q7UUFiN0UsMkJBQXNCLEdBQVksS0FBSyxDQUFDO1FBQ3pDLFVBQUssR0FBRyxJQUFJLHFCQUFjLEVBQUUsQ0FBQztRQUszQixtQkFBYyxHQUFHLHFCQUFxQixDQUFDO1FBVS9DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSw0QkFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFzQjtRQUM1QyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTdCLElB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O0lBQ2xELENBQUM7SUFFUyxLQUFLLENBQUMsY0FBYyxDQUM1QixnQkFBMEIsRUFDMUIsT0FBd0I7UUFFeEIsT0FBTyx1QkFBYyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVPLEtBQUssQ0FBQyxjQUFjO1FBQzFCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixPQUFPO1NBQ1I7UUFDRCxNQUFNLGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXhELElBQUk7WUFDRixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzVFO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFO2dCQUMvQiwyQkFBMkI7Z0JBQzNCLE1BQU0sR0FBRyxDQUFDO2FBQ1g7U0FDRjtJQUNILENBQUM7Q0FDRjtBQWxlRCw0Q0FrZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBleHBlcmltZW50YWwsXG4gIGpzb24sXG4gIGxvZ2dpbmcsXG4gIG5vcm1hbGl6ZSxcbiAgc2NoZW1hLFxuICBzdHJpbmdzLFxuICB0YWdzLFxuICB0ZXJtaW5hbCxcbiAgdmlydHVhbEZzLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHtcbiAgRHJ5UnVuRXZlbnQsXG4gIEVuZ2luZSxcbiAgU2NoZW1hdGljRW5naW5lLFxuICBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbixcbiAgd29ya2Zsb3csXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uLFxuICBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpYyxcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MsXG4gIE5vZGVNb2R1bGVzRW5naW5lSG9zdCxcbiAgTm9kZVdvcmtmbG93LFxuICB2YWxpZGF0ZU9wdGlvbnNXaXRoU2NoZW1hLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgKiBhcyBpbnF1aXJlciBmcm9tICdpbnF1aXJlcic7XG5pbXBvcnQgKiBhcyBzeXN0ZW1QYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgV29ya3NwYWNlTG9hZGVyIH0gZnJvbSAnLi4vbW9kZWxzL3dvcmtzcGFjZS1sb2FkZXInO1xuaW1wb3J0IHtcbiAgZ2V0UHJvamVjdEJ5Q3dkLFxuICBnZXRTY2hlbWF0aWNEZWZhdWx0cyxcbiAgZ2V0V29ya3NwYWNlLFxuICBnZXRXb3Jrc3BhY2VSYXcsXG59IGZyb20gJy4uL3V0aWxpdGllcy9jb25maWcnO1xuaW1wb3J0IHsgcGFyc2VKc29uU2NoZW1hVG9PcHRpb25zIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2pzb24tc2NoZW1hJztcbmltcG9ydCB7IGdldFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vdXRpbGl0aWVzL3BhY2thZ2UtbWFuYWdlcic7XG5pbXBvcnQgeyBCYXNlQ29tbWFuZE9wdGlvbnMsIENvbW1hbmQgfSBmcm9tICcuL2NvbW1hbmQnO1xuaW1wb3J0IHsgQXJndW1lbnRzLCBDb21tYW5kQ29udGV4dCwgQ29tbWFuZERlc2NyaXB0aW9uLCBPcHRpb24gfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBwYXJzZUFyZ3VtZW50cywgcGFyc2VGcmVlRm9ybUFyZ3VtZW50cyB9IGZyb20gJy4vcGFyc2VyJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2VTY2hlbWF0aWNTY2hlbWEge1xuICBkZWJ1Zz86IGJvb2xlYW47XG4gIGRyeVJ1bj86IGJvb2xlYW47XG4gIGZvcmNlPzogYm9vbGVhbjtcbiAgaW50ZXJhY3RpdmU/OiBib29sZWFuO1xuICBkZWZhdWx0cz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuU2NoZW1hdGljT3B0aW9ucyBleHRlbmRzIEJhc2VTY2hlbWF0aWNTY2hlbWEge1xuICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nO1xuICBzY2hlbWF0aWNOYW1lOiBzdHJpbmc7XG4gIGFkZGl0aW9uYWxPcHRpb25zPzogeyBba2V5OiBzdHJpbmddOiB7fSB9O1xuICBzY2hlbWF0aWNPcHRpb25zPzogc3RyaW5nW107XG4gIHNob3dOb3RoaW5nRG9uZT86IGJvb2xlYW47XG59XG5cblxuZXhwb3J0IGNsYXNzIFVua25vd25Db2xsZWN0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgSW52YWxpZCBjb2xsZWN0aW9uICgke2NvbGxlY3Rpb25OYW1lfSkuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNjaGVtYXRpY0NvbW1hbmQ8XG4gIFQgZXh0ZW5kcyAoQmFzZVNjaGVtYXRpY1NjaGVtYSAmIEJhc2VDb21tYW5kT3B0aW9ucyksXG4+IGV4dGVuZHMgQ29tbWFuZDxUPiB7XG4gIHJlYWRvbmx5IGFsbG93UHJpdmF0ZVNjaGVtYXRpY3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfaG9zdCA9IG5ldyBOb2RlSnNTeW5jSG9zdCgpO1xuICBwcml2YXRlIF93b3Jrc3BhY2U6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlO1xuICBwcml2YXRlIHJlYWRvbmx5IF9lbmdpbmU6IEVuZ2luZTxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPjtcbiAgcHJvdGVjdGVkIF93b3JrZmxvdzogd29ya2Zsb3cuQmFzZVdvcmtmbG93O1xuXG4gIHByb3RlY3RlZCBjb2xsZWN0aW9uTmFtZSA9ICdAc2NoZW1hdGljcy9hbmd1bGFyJztcbiAgcHJvdGVjdGVkIHNjaGVtYXRpY05hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29udGV4dDogQ29tbWFuZENvbnRleHQsXG4gICAgZGVzY3JpcHRpb246IENvbW1hbmREZXNjcmlwdGlvbixcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2VuZ2luZUhvc3Q6IEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSA9IG5ldyBOb2RlTW9kdWxlc0VuZ2luZUhvc3QoKSxcbiAgKSB7XG4gICAgc3VwZXIoY29udGV4dCwgZGVzY3JpcHRpb24sIGxvZ2dlcik7XG4gICAgdGhpcy5fZW5naW5lID0gbmV3IFNjaGVtYXRpY0VuZ2luZSh0aGlzLl9lbmdpbmVIb3N0KTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBpbml0aWFsaXplKG9wdGlvbnM6IFQgJiBBcmd1bWVudHMpIHtcbiAgICBhd2FpdCB0aGlzLl9sb2FkV29ya3NwYWNlKCk7XG4gICAgdGhpcy5jcmVhdGVXb3JrZmxvdyhvcHRpb25zKTtcblxuICAgIGlmICh0aGlzLnNjaGVtYXRpY05hbWUpIHtcbiAgICAgIC8vIFNldCB0aGUgb3B0aW9ucy5cbiAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLmdldENvbGxlY3Rpb24odGhpcy5jb2xsZWN0aW9uTmFtZSk7XG4gICAgICBjb25zdCBzY2hlbWF0aWMgPSB0aGlzLmdldFNjaGVtYXRpYyhjb2xsZWN0aW9uLCB0aGlzLnNjaGVtYXRpY05hbWUsIHRydWUpO1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHBhcnNlSnNvblNjaGVtYVRvT3B0aW9ucyhcbiAgICAgICAgdGhpcy5fd29ya2Zsb3cucmVnaXN0cnksXG4gICAgICAgIHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5zY2hlbWFKc29uIHx8IHt9LFxuICAgICAgKTtcblxuICAgICAgdGhpcy5kZXNjcmlwdGlvbi5vcHRpb25zLnB1c2goLi4ub3B0aW9ucy5maWx0ZXIoeCA9PiAheC5oaWRkZW4pKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcHJpbnRIZWxwKG9wdGlvbnM6IFQgJiBBcmd1bWVudHMpIHtcbiAgICBhd2FpdCBzdXBlci5wcmludEhlbHAob3B0aW9ucyk7XG4gICAgdGhpcy5sb2dnZXIuaW5mbygnJyk7XG5cbiAgICBjb25zdCBzdWJDb21tYW5kT3B0aW9uID0gdGhpcy5kZXNjcmlwdGlvbi5vcHRpb25zLmZpbHRlcih4ID0+IHguc3ViY29tbWFuZHMpWzBdO1xuXG4gICAgaWYgKCFzdWJDb21tYW5kT3B0aW9uIHx8ICFzdWJDb21tYW5kT3B0aW9uLnN1YmNvbW1hbmRzKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWF0aWNOYW1lcyA9IE9iamVjdC5rZXlzKHN1YkNvbW1hbmRPcHRpb24uc3ViY29tbWFuZHMpO1xuXG4gICAgaWYgKHNjaGVtYXRpY05hbWVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0F2YWlsYWJsZSBTY2hlbWF0aWNzOicpO1xuXG4gICAgICBjb25zdCBuYW1lc1BlckNvbGxlY3Rpb246IHsgW2M6IHN0cmluZ106IHN0cmluZ1tdIH0gPSB7fTtcbiAgICAgIHNjaGVtYXRpY05hbWVzLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGxldCBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdID0gbmFtZS5zcGxpdCgvOi8sIDIpO1xuICAgICAgICBpZiAoIXNjaGVtYXRpY05hbWUpIHtcbiAgICAgICAgICBzY2hlbWF0aWNOYW1lID0gY29sbGVjdGlvbk5hbWU7XG4gICAgICAgICAgY29sbGVjdGlvbk5hbWUgPSB0aGlzLmNvbGxlY3Rpb25OYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFuYW1lc1BlckNvbGxlY3Rpb25bY29sbGVjdGlvbk5hbWVdKSB7XG4gICAgICAgICAgbmFtZXNQZXJDb2xsZWN0aW9uW2NvbGxlY3Rpb25OYW1lXSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgbmFtZXNQZXJDb2xsZWN0aW9uW2NvbGxlY3Rpb25OYW1lXS5wdXNoKHNjaGVtYXRpY05hbWUpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGRlZmF1bHRDb2xsZWN0aW9uID0gdGhpcy5nZXREZWZhdWx0U2NoZW1hdGljQ29sbGVjdGlvbigpO1xuICAgICAgT2JqZWN0LmtleXMobmFtZXNQZXJDb2xsZWN0aW9uKS5mb3JFYWNoKGNvbGxlY3Rpb25OYW1lID0+IHtcbiAgICAgICAgY29uc3QgaXNEZWZhdWx0ID0gZGVmYXVsdENvbGxlY3Rpb24gPT0gY29sbGVjdGlvbk5hbWU7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oXG4gICAgICAgICAgYCAgQ29sbGVjdGlvbiBcIiR7Y29sbGVjdGlvbk5hbWV9XCIke2lzRGVmYXVsdCA/ICcgKGRlZmF1bHQpJyA6ICcnfTpgLFxuICAgICAgICApO1xuXG4gICAgICAgIG5hbWVzUGVyQ29sbGVjdGlvbltjb2xsZWN0aW9uTmFtZV0uZm9yRWFjaChzY2hlbWF0aWNOYW1lID0+IHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGAgICAgJHtzY2hlbWF0aWNOYW1lfWApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoc2NoZW1hdGljTmFtZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0hlbHAgZm9yIHNjaGVtYXRpYyAnICsgc2NoZW1hdGljTmFtZXNbMF0pO1xuICAgICAgYXdhaXQgdGhpcy5wcmludEhlbHBTdWJjb21tYW5kKHN1YkNvbW1hbmRPcHRpb24uc3ViY29tbWFuZHNbc2NoZW1hdGljTmFtZXNbMF1dKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGFzeW5jIHByaW50SGVscFVzYWdlKCkge1xuICAgIGNvbnN0IHN1YkNvbW1hbmRPcHRpb24gPSB0aGlzLmRlc2NyaXB0aW9uLm9wdGlvbnMuZmlsdGVyKHggPT4geC5zdWJjb21tYW5kcylbMF07XG5cbiAgICBpZiAoIXN1YkNvbW1hbmRPcHRpb24gfHwgIXN1YkNvbW1hbmRPcHRpb24uc3ViY29tbWFuZHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWF0aWNOYW1lcyA9IE9iamVjdC5rZXlzKHN1YkNvbW1hbmRPcHRpb24uc3ViY29tbWFuZHMpO1xuICAgIGlmIChzY2hlbWF0aWNOYW1lcy5sZW5ndGggPT0gMSkge1xuICAgICAgdGhpcy5sb2dnZXIuaW5mbyh0aGlzLmRlc2NyaXB0aW9uLmRlc2NyaXB0aW9uKTtcblxuICAgICAgY29uc3Qgb3B0cyA9IHRoaXMuZGVzY3JpcHRpb24ub3B0aW9ucy5maWx0ZXIoeCA9PiB4LnBvc2l0aW9uYWwgPT09IHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdID0gc2NoZW1hdGljTmFtZXNbMF0uc3BsaXQoLzovKVswXTtcblxuICAgICAgLy8gRGlzcGxheSA8Y29sbGVjdGlvbk5hbWU6c2NoZW1hdGljTmFtZT4gaWYgdGhpcyBpcyBub3QgdGhlIGRlZmF1bHQgY29sbGVjdGlvbk5hbWUsXG4gICAgICAvLyBvdGhlcndpc2UganVzdCBzaG93IHRoZSBzY2hlbWF0aWNOYW1lLlxuICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSBjb2xsZWN0aW9uTmFtZSA9PSB0aGlzLmdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uKClcbiAgICAgICAgPyBzY2hlbWF0aWNOYW1lXG4gICAgICAgIDogc2NoZW1hdGljTmFtZXNbMF07XG5cbiAgICAgIGNvbnN0IHNjaGVtYXRpY09wdGlvbnMgPSBzdWJDb21tYW5kT3B0aW9uLnN1YmNvbW1hbmRzW3NjaGVtYXRpY05hbWVzWzBdXS5vcHRpb25zO1xuICAgICAgY29uc3Qgc2NoZW1hdGljQXJncyA9IHNjaGVtYXRpY09wdGlvbnMuZmlsdGVyKHggPT4geC5wb3NpdGlvbmFsICE9PSB1bmRlZmluZWQpO1xuICAgICAgY29uc3QgYXJnRGlzcGxheSA9IHNjaGVtYXRpY0FyZ3MubGVuZ3RoID4gMFxuICAgICAgICA/ICcgJyArIHNjaGVtYXRpY0FyZ3MubWFwKGEgPT4gYDwke3N0cmluZ3MuZGFzaGVyaXplKGEubmFtZSl9PmApLmpvaW4oJyAnKVxuICAgICAgICA6ICcnO1xuXG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKHRhZ3Mub25lTGluZWBcbiAgICAgICAgdXNhZ2U6IG5nICR7dGhpcy5kZXNjcmlwdGlvbi5uYW1lfSAke2Rpc3BsYXlOYW1lfSR7YXJnRGlzcGxheX1cbiAgICAgICAgJHtvcHRzLmxlbmd0aCA+IDAgPyBgW29wdGlvbnNdYCA6IGBgfVxuICAgICAgYCk7XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKCcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc3VwZXIucHJpbnRIZWxwVXNhZ2UoKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RW5naW5lSG9zdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lSG9zdDtcbiAgfVxuICBwcm90ZWN0ZWQgZ2V0RW5naW5lKCk6XG4gICAgICBFbmdpbmU8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4ge1xuICAgIHJldHVybiB0aGlzLl9lbmdpbmU7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZTogc3RyaW5nKTogRmlsZVN5c3RlbUNvbGxlY3Rpb24ge1xuICAgIGNvbnN0IGVuZ2luZSA9IHRoaXMuZ2V0RW5naW5lKCk7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGVuZ2luZS5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcblxuICAgIGlmIChjb2xsZWN0aW9uID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgVW5rbm93bkNvbGxlY3Rpb25FcnJvcihjb2xsZWN0aW9uTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0U2NoZW1hdGljKFxuICAgIGNvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uLFxuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZyxcbiAgICBhbGxvd1ByaXZhdGU/OiBib29sZWFuLFxuICApOiBGaWxlU3lzdGVtU2NoZW1hdGljIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5jcmVhdGVTY2hlbWF0aWMoc2NoZW1hdGljTmFtZSwgYWxsb3dQcml2YXRlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzZXRQYXRoT3B0aW9ucyhvcHRpb25zOiBPcHRpb25bXSwgd29ya2luZ0Rpcjogc3RyaW5nKSB7XG4gICAgaWYgKHdvcmtpbmdEaXIgPT09ICcnKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgICAgIC5maWx0ZXIobyA9PiBvLmZvcm1hdCA9PT0gJ3BhdGgnKVxuICAgICAgLm1hcChvID0+IG8ubmFtZSlcbiAgICAgIC5yZWR1Y2UoKGFjYywgY3VycikgPT4ge1xuICAgICAgICBhY2NbY3Vycl0gPSB3b3JraW5nRGlyO1xuXG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LCB7fSBhcyB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSk7XG4gIH1cblxuICAvKlxuICAgKiBSdW50aW1lIGhvb2sgdG8gYWxsb3cgc3BlY2lmeWluZyBjdXN0b21pemVkIHdvcmtmbG93XG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlV29ya2Zsb3cob3B0aW9uczogQmFzZVNjaGVtYXRpY1NjaGVtYSk6IHdvcmtmbG93LkJhc2VXb3JrZmxvdyB7XG4gICAgaWYgKHRoaXMuX3dvcmtmbG93KSB7XG4gICAgICByZXR1cm4gdGhpcy5fd29ya2Zsb3c7XG4gICAgfVxuXG4gICAgY29uc3QgeyBmb3JjZSwgZHJ5UnVuIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IGZzSG9zdCA9IG5ldyB2aXJ0dWFsRnMuU2NvcGVkSG9zdChuZXcgTm9kZUpzU3luY0hvc3QoKSwgbm9ybWFsaXplKHRoaXMud29ya3NwYWNlLnJvb3QpKTtcblxuICAgIGNvbnN0IHdvcmtmbG93ID0gbmV3IE5vZGVXb3JrZmxvdyhcbiAgICAgICAgZnNIb3N0LFxuICAgICAgICB7XG4gICAgICAgICAgZm9yY2UsXG4gICAgICAgICAgZHJ5UnVuLFxuICAgICAgICAgIHBhY2thZ2VNYW5hZ2VyOiBnZXRQYWNrYWdlTWFuYWdlcih0aGlzLndvcmtzcGFjZS5yb290KSxcbiAgICAgICAgICByb290OiBub3JtYWxpemUodGhpcy53b3Jrc3BhY2Uucm9vdCksXG4gICAgICAgIH0sXG4gICAgKTtcblxuICAgIHRoaXMuX2VuZ2luZUhvc3QucmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtKHZhbGlkYXRlT3B0aW9uc1dpdGhTY2hlbWEod29ya2Zsb3cucmVnaXN0cnkpKTtcblxuICAgIGlmIChvcHRpb25zLmRlZmF1bHRzKSB7XG4gICAgICB3b3JrZmxvdy5yZWdpc3RyeS5hZGRQcmVUcmFuc2Zvcm0oc2NoZW1hLnRyYW5zZm9ybXMuYWRkVW5kZWZpbmVkRGVmYXVsdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3b3JrZmxvdy5yZWdpc3RyeS5hZGRQb3N0VHJhbnNmb3JtKHNjaGVtYS50cmFuc2Zvcm1zLmFkZFVuZGVmaW5lZERlZmF1bHRzKTtcbiAgICB9XG5cbiAgICB3b3JrZmxvdy5yZWdpc3RyeS5hZGRTbWFydERlZmF1bHRQcm92aWRlcigncHJvamVjdE5hbWUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fd29ya3NwYWNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSlcbiAgICAgICAgICAgIHx8IHRoaXMuX3dvcmtzcGFjZS5nZXREZWZhdWx0UHJvamVjdE5hbWUoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5BbWJpZ3VvdXNQcm9qZWN0UGF0aEV4Y2VwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2Fybih0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAgIFR3byBvciBtb3JlIHByb2plY3RzIGFyZSB1c2luZyBpZGVudGljYWwgcm9vdHMuXG4gICAgICAgICAgICAgIFVuYWJsZSB0byBkZXRlcm1pbmUgcHJvamVjdCB1c2luZyBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlxuICAgICAgICAgICAgICBVc2luZyBkZWZhdWx0IHdvcmtzcGFjZSBwcm9qZWN0IGluc3RlYWQuXG4gICAgICAgICAgICBgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmtzcGFjZS5nZXREZWZhdWx0UHJvamVjdE5hbWUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgaWYgKG9wdGlvbnMuaW50ZXJhY3RpdmUgIT09IGZhbHNlICYmIHByb2Nlc3Muc3Rkb3V0LmlzVFRZKSB7XG4gICAgICB3b3JrZmxvdy5yZWdpc3RyeS51c2VQcm9tcHRQcm92aWRlcigoZGVmaW5pdGlvbnM6IEFycmF5PHNjaGVtYS5Qcm9tcHREZWZpbml0aW9uPikgPT4ge1xuICAgICAgICBjb25zdCBxdWVzdGlvbnM6IGlucXVpcmVyLlF1ZXN0aW9ucyA9IGRlZmluaXRpb25zLm1hcChkZWZpbml0aW9uID0+IHtcbiAgICAgICAgICBjb25zdCBxdWVzdGlvbjogaW5xdWlyZXIuUXVlc3Rpb24gPSB7XG4gICAgICAgICAgICBuYW1lOiBkZWZpbml0aW9uLmlkLFxuICAgICAgICAgICAgbWVzc2FnZTogZGVmaW5pdGlvbi5tZXNzYWdlLFxuICAgICAgICAgICAgZGVmYXVsdDogZGVmaW5pdGlvbi5kZWZhdWx0LFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBkZWZpbml0aW9uLnZhbGlkYXRvcjtcbiAgICAgICAgICBpZiAodmFsaWRhdG9yKSB7XG4gICAgICAgICAgICBxdWVzdGlvbi52YWxpZGF0ZSA9IGlucHV0ID0+IHZhbGlkYXRvcihpbnB1dCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc3dpdGNoIChkZWZpbml0aW9uLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NvbmZpcm1hdGlvbic6XG4gICAgICAgICAgICAgIHF1ZXN0aW9uLnR5cGUgPSAnY29uZmlybSc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbGlzdCc6XG4gICAgICAgICAgICAgIHF1ZXN0aW9uLnR5cGUgPSAnbGlzdCc7XG4gICAgICAgICAgICAgIHF1ZXN0aW9uLmNob2ljZXMgPSBkZWZpbml0aW9uLml0ZW1zICYmIGRlZmluaXRpb24uaXRlbXMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubGFiZWwsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpdGVtLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHF1ZXN0aW9uLnR5cGUgPSBkZWZpbml0aW9uLnR5cGU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBxdWVzdGlvbjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGlucXVpcmVyLnByb21wdChxdWVzdGlvbnMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3dvcmtmbG93ID0gd29ya2Zsb3c7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFNjaGVtYXRpY0NvbGxlY3Rpb24oKTogc3RyaW5nIHtcbiAgICBsZXQgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdsb2NhbCcpO1xuXG4gICAgaWYgKHdvcmtzcGFjZSkge1xuICAgICAgY29uc3QgcHJvamVjdCA9IGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2UpO1xuICAgICAgaWYgKHByb2plY3QgJiYgd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdCkpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0UHJvamVjdENsaShwcm9qZWN0KVsnZGVmYXVsdENvbGxlY3Rpb24nXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHdvcmtzcGFjZS5nZXRDbGkoKSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHdvcmtzcGFjZS5nZXRDbGkoKVsnZGVmYXVsdENvbGxlY3Rpb24nXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gICAgaWYgKHdvcmtzcGFjZSAmJiB3b3Jrc3BhY2UuZ2V0Q2xpKCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gd29ya3NwYWNlLmdldENsaSgpWydkZWZhdWx0Q29sbGVjdGlvbiddO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuY29sbGVjdGlvbk5hbWU7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcnVuU2NoZW1hdGljKG9wdGlvbnM6IFJ1blNjaGVtYXRpY09wdGlvbnMpIHtcbiAgICBjb25zdCB7IHNjaGVtYXRpY09wdGlvbnMsIGRlYnVnLCBkcnlSdW4gfSA9IG9wdGlvbnM7XG4gICAgbGV0IHsgY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWUgfSA9IG9wdGlvbnM7XG5cbiAgICBsZXQgbm90aGluZ0RvbmUgPSB0cnVlO1xuICAgIGxldCBsb2dnaW5nUXVldWU6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IGVycm9yID0gZmFsc2U7XG5cbiAgICBjb25zdCB3b3JrZmxvdyA9IHRoaXMuX3dvcmtmbG93O1xuXG4gICAgY29uc3Qgd29ya2luZ0RpciA9IG5vcm1hbGl6ZShzeXN0ZW1QYXRoLnJlbGF0aXZlKHRoaXMud29ya3NwYWNlLnJvb3QsIHByb2Nlc3MuY3dkKCkpKTtcblxuICAgIC8vIEdldCB0aGUgb3B0aW9uIG9iamVjdCBmcm9tIHRoZSBzY2hlbWF0aWMgc2NoZW1hLlxuICAgIGNvbnN0IHNjaGVtYXRpYyA9IHRoaXMuZ2V0U2NoZW1hdGljKFxuICAgICAgdGhpcy5nZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKSxcbiAgICAgIHNjaGVtYXRpY05hbWUsXG4gICAgICB0aGlzLmFsbG93UHJpdmF0ZVNjaGVtYXRpY3MsXG4gICAgKTtcbiAgICAvLyBVcGRhdGUgdGhlIHNjaGVtYXRpYyBhbmQgY29sbGVjdGlvbiBuYW1lIGluIGNhc2UgdGhleSdyZSBub3QgdGhlIHNhbWUgYXMgdGhlIG9uZXMgd2VcbiAgICAvLyByZWNlaXZlZCBpbiBvdXIgb3B0aW9ucywgZS5nLiBhZnRlciBhbGlhcyByZXNvbHV0aW9uIG9yIGV4dGVuc2lvbi5cbiAgICBjb2xsZWN0aW9uTmFtZSA9IHNjaGVtYXRpYy5jb2xsZWN0aW9uLmRlc2NyaXB0aW9uLm5hbWU7XG4gICAgc2NoZW1hdGljTmFtZSA9IHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5uYW1lO1xuXG4gICAgLy8gVE9ETzogUmVtb3ZlIHdhcm5pbmcgY2hlY2sgd2hlbiAndGFyZ2V0cycgaXMgZGVmYXVsdFxuICAgIGlmIChjb2xsZWN0aW9uTmFtZSAhPT0gdGhpcy5jb2xsZWN0aW9uTmFtZSkge1xuICAgICAgY29uc3QgW2FzdCwgY29uZmlnUGF0aF0gPSBnZXRXb3Jrc3BhY2VSYXcoJ2xvY2FsJyk7XG4gICAgICBpZiAoYXN0KSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RzS2V5VmFsdWUgPSBhc3QucHJvcGVydGllcy5maW5kKHAgPT4gcC5rZXkudmFsdWUgPT09ICdwcm9qZWN0cycpO1xuICAgICAgICBpZiAoIXByb2plY3RzS2V5VmFsdWUgfHwgcHJvamVjdHNLZXlWYWx1ZS52YWx1ZS5raW5kICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uczoganNvbi5Qb3NpdGlvbltdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcHJvamVjdEtleVZhbHVlIG9mIHByb2plY3RzS2V5VmFsdWUudmFsdWUucHJvcGVydGllcykge1xuICAgICAgICAgIGNvbnN0IHByb2plY3ROb2RlID0gcHJvamVjdEtleVZhbHVlLnZhbHVlO1xuICAgICAgICAgIGlmIChwcm9qZWN0Tm9kZS5raW5kICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHRhcmdldHNLZXlWYWx1ZSA9IHByb2plY3ROb2RlLnByb3BlcnRpZXMuZmluZChwID0+IHAua2V5LnZhbHVlID09PSAndGFyZ2V0cycpO1xuICAgICAgICAgIGlmICh0YXJnZXRzS2V5VmFsdWUpIHtcbiAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKHRhcmdldHNLZXlWYWx1ZS5zdGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3Qgd2FybmluZyA9IHRhZ3Mub25lTGluZWBcbiAgICAgICAgICAgIFdBUk5JTkc6IFRoaXMgY29tbWFuZCBtYXkgbm90IGV4ZWN1dGUgc3VjY2Vzc2Z1bGx5LlxuICAgICAgICAgICAgVGhlIHBhY2thZ2UvY29sbGVjdGlvbiBtYXkgbm90IHN1cHBvcnQgdGhlICd0YXJnZXRzJyBmaWVsZCB3aXRoaW4gJyR7Y29uZmlnUGF0aH0nLlxuICAgICAgICAgICAgVGhpcyBjYW4gYmUgY29ycmVjdGVkIGJ5IHJlbmFtaW5nIHRoZSBmb2xsb3dpbmcgJ3RhcmdldHMnIGZpZWxkcyB0byAnYXJjaGl0ZWN0JzpcbiAgICAgICAgICBgO1xuXG4gICAgICAgICAgY29uc3QgbG9jYXRpb25zID0gcG9zaXRpb25zXG4gICAgICAgICAgICAubWFwKChwLCBpKSA9PiBgJHtpICsgMX0pIExpbmU6ICR7cC5saW5lICsgMX07IENvbHVtbjogJHtwLmNoYXJhY3RlciArIDF9YClcbiAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcblxuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4od2FybmluZyArICdcXG4nICsgbG9jYXRpb25zICsgJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBvcHRpb25zIG9mIGZvcm1hdCBcInBhdGhcIi5cbiAgICBsZXQgbzogT3B0aW9uW10gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgYXJnczogQXJndW1lbnRzO1xuXG4gICAgaWYgKCFzY2hlbWF0aWMuZGVzY3JpcHRpb24uc2NoZW1hSnNvbikge1xuICAgICAgYXJncyA9IGF3YWl0IHRoaXMucGFyc2VGcmVlRm9ybUFyZ3VtZW50cyhzY2hlbWF0aWNPcHRpb25zIHx8IFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbyA9IGF3YWl0IHBhcnNlSnNvblNjaGVtYVRvT3B0aW9ucyh3b3JrZmxvdy5yZWdpc3RyeSwgc2NoZW1hdGljLmRlc2NyaXB0aW9uLnNjaGVtYUpzb24pO1xuICAgICAgYXJncyA9IGF3YWl0IHRoaXMucGFyc2VBcmd1bWVudHMoc2NoZW1hdGljT3B0aW9ucyB8fCBbXSwgbyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aE9wdGlvbnMgPSBvID8gdGhpcy5zZXRQYXRoT3B0aW9ucyhvLCB3b3JraW5nRGlyKSA6IHt9O1xuICAgIGxldCBpbnB1dCA9IE9iamVjdC5hc3NpZ24ocGF0aE9wdGlvbnMsIGFyZ3MpO1xuXG4gICAgLy8gUmVhZCB0aGUgZGVmYXVsdCB2YWx1ZXMgZnJvbSB0aGUgd29ya3NwYWNlLlxuICAgIGNvbnN0IHByb2plY3ROYW1lID0gaW5wdXQucHJvamVjdCAhPT0gdW5kZWZpbmVkID8gJycgKyBpbnB1dC5wcm9qZWN0IDogbnVsbDtcbiAgICBjb25zdCBkZWZhdWx0cyA9IGdldFNjaGVtYXRpY0RlZmF1bHRzKGNvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lLCBwcm9qZWN0TmFtZSk7XG4gICAgaW5wdXQgPSB7XG4gICAgICAuLi5kZWZhdWx0cyxcbiAgICAgIC4uLmlucHV0LFxuICAgICAgLi4ub3B0aW9ucy5hZGRpdGlvbmFsT3B0aW9ucyxcbiAgICB9O1xuXG4gICAgd29ya2Zsb3cucmVwb3J0ZXIuc3Vic2NyaWJlKChldmVudDogRHJ5UnVuRXZlbnQpID0+IHtcbiAgICAgIG5vdGhpbmdEb25lID0gZmFsc2U7XG5cbiAgICAgIC8vIFN0cmlwIGxlYWRpbmcgc2xhc2ggdG8gcHJldmVudCBjb25mdXNpb24uXG4gICAgICBjb25zdCBldmVudFBhdGggPSBldmVudC5wYXRoLnN0YXJ0c1dpdGgoJy8nKSA/IGV2ZW50LnBhdGguc3Vic3RyKDEpIDogZXZlbnQucGF0aDtcblxuICAgICAgc3dpdGNoIChldmVudC5raW5kKSB7XG4gICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgICAgICAgY29uc3QgZGVzYyA9IGV2ZW50LmRlc2NyaXB0aW9uID09ICdhbHJlYWR5RXhpc3QnID8gJ2FscmVhZHkgZXhpc3RzJyA6ICdkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYEVSUk9SISAke2V2ZW50UGF0aH0gJHtkZXNjfS5gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaCh0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAke3Rlcm1pbmFsLndoaXRlKCdVUERBVEUnKX0gJHtldmVudFBhdGh9ICgke2V2ZW50LmNvbnRlbnQubGVuZ3RofSBieXRlcylcbiAgICAgICAgICBgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaCh0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAke3Rlcm1pbmFsLmdyZWVuKCdDUkVBVEUnKX0gJHtldmVudFBhdGh9ICgke2V2ZW50LmNvbnRlbnQubGVuZ3RofSBieXRlcylcbiAgICAgICAgICBgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaChgJHt0ZXJtaW5hbC55ZWxsb3coJ0RFTEVURScpfSAke2V2ZW50UGF0aH1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVuYW1lJzpcbiAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaChgJHt0ZXJtaW5hbC5ibHVlKCdSRU5BTUUnKX0gJHtldmVudFBhdGh9ID0+ICR7ZXZlbnQudG99YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB3b3JrZmxvdy5saWZlQ3ljbGUuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgIGlmIChldmVudC5raW5kID09ICdlbmQnIHx8IGV2ZW50LmtpbmQgPT0gJ3Bvc3QtdGFza3Mtc3RhcnQnKSB7XG4gICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAvLyBPdXRwdXQgdGhlIGxvZ2dpbmcgcXVldWUsIG5vIGVycm9yIGhhcHBlbmVkLlxuICAgICAgICAgIGxvZ2dpbmdRdWV1ZS5mb3JFYWNoKGxvZyA9PiB0aGlzLmxvZ2dlci5pbmZvKGxvZykpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nZ2luZ1F1ZXVlID0gW107XG4gICAgICAgIGVycm9yID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8bnVtYmVyIHwgdm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIHdvcmtmbG93LmV4ZWN1dGUoe1xuICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgc2NoZW1hdGljOiBzY2hlbWF0aWNOYW1lLFxuICAgICAgICBvcHRpb25zOiBpbnB1dCxcbiAgICAgICAgZGVidWc6IGRlYnVnLFxuICAgICAgICBsb2dnZXI6IHRoaXMubG9nZ2VyLFxuICAgICAgICBhbGxvd1ByaXZhdGU6IHRoaXMuYWxsb3dQcml2YXRlU2NoZW1hdGljcyxcbiAgICAgIH0pXG4gICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgZXJyb3I6IChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgLy8gSW4gY2FzZSB0aGUgd29ya2Zsb3cgd2FzIG5vdCBzdWNjZXNzZnVsLCBzaG93IGFuIGFwcHJvcHJpYXRlIGVycm9yIG1lc3NhZ2UuXG4gICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uKSB7XG4gICAgICAgICAgICAvLyBcIlNlZSBhYm92ZVwiIGJlY2F1c2Ugd2UgYWxyZWFkeSBwcmludGVkIHRoZSBlcnJvci5cbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKCdUaGUgU2NoZW1hdGljIHdvcmtmbG93IGZhaWxlZC4gU2VlIGFib3ZlLicpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGVidWcpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKGBBbiBlcnJvciBvY2N1cmVkOlxcbiR7ZXJyLm1lc3NhZ2V9XFxuJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKDEpO1xuICAgICAgICB9LFxuICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHNob3dOb3RoaW5nRG9uZSA9ICEob3B0aW9ucy5zaG93Tm90aGluZ0RvbmUgPT09IGZhbHNlKTtcbiAgICAgICAgICBpZiAobm90aGluZ0RvbmUgJiYgc2hvd05vdGhpbmdEb25lKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdOb3RoaW5nIHRvIGJlIGRvbmUuJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkcnlSdW4pIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFxcbk5PVEU6IFRoZSBcImRyeVJ1blwiIGZsYWcgbWVhbnMgbm8gY2hhbmdlcyB3ZXJlIG1hZGUuYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHBhcnNlRnJlZUZvcm1Bcmd1bWVudHMoc2NoZW1hdGljT3B0aW9uczogc3RyaW5nW10pIHtcbiAgICByZXR1cm4gcGFyc2VGcmVlRm9ybUFyZ3VtZW50cyhzY2hlbWF0aWNPcHRpb25zKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBwYXJzZUFyZ3VtZW50cyhcbiAgICBzY2hlbWF0aWNPcHRpb25zOiBzdHJpbmdbXSxcbiAgICBvcHRpb25zOiBPcHRpb25bXSB8IG51bGwsXG4gICk6IFByb21pc2U8QXJndW1lbnRzPiB7XG4gICAgcmV0dXJuIHBhcnNlQXJndW1lbnRzKHNjaGVtYXRpY09wdGlvbnMsIG9wdGlvbnMsIHRoaXMubG9nZ2VyKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2xvYWRXb3Jrc3BhY2UoKSB7XG4gICAgaWYgKHRoaXMuX3dvcmtzcGFjZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3b3Jrc3BhY2VMb2FkZXIgPSBuZXcgV29ya3NwYWNlTG9hZGVyKHRoaXMuX2hvc3QpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3dvcmtzcGFjZSA9IGF3YWl0IHdvcmtzcGFjZUxvYWRlci5sb2FkV29ya3NwYWNlKHRoaXMud29ya3NwYWNlLnJvb3QpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKCF0aGlzLmFsbG93TWlzc2luZ1dvcmtzcGFjZSkge1xuICAgICAgICAvLyBJZ25vcmUgbWlzc2luZyB3b3Jrc3BhY2VcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19