"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const architect_1 = require("@angular-devkit/architect");
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const json_schema_1 = require("../utilities/json-schema");
const command_1 = require("./command");
const parser_1 = require("./parser");
const workspace_loader_1 = require("./workspace-loader");
class ArchitectCommand extends command_1.Command {
    constructor() {
        super(...arguments);
        this._host = new node_1.NodeJsSyncHost();
        // If this command supports running multiple targets.
        this.multiTarget = false;
    }
    async initialize(options) {
        await super.initialize(options);
        this._registry = new core_1.json.schema.CoreSchemaRegistry();
        this._registry.addPostTransform(core_1.json.schema.transforms.addUndefinedDefaults);
        await this._loadWorkspaceAndArchitect();
        if (!options.project && this.target) {
            const projectNames = this.getProjectNamesByTarget(this.target);
            const leftovers = options['--'];
            if (projectNames.length > 1 && leftovers && leftovers.length > 0) {
                // Verify that all builders are the same, otherwise error out (since the meaning of an
                // option could vary from builder to builder).
                const builders = [];
                for (const projectName of projectNames) {
                    const targetSpec = this._makeTargetSpecifier(options);
                    const targetDesc = this._architect.getBuilderConfiguration({
                        project: projectName,
                        target: targetSpec.target,
                    });
                    if (builders.indexOf(targetDesc.builder) == -1) {
                        builders.push(targetDesc.builder);
                    }
                }
                if (builders.length > 1) {
                    throw new Error(core_1.tags.oneLine `
            Architect commands with command line overrides cannot target different builders. The
            '${this.target}' target would run on projects ${projectNames.join()} which have the
            following builders: ${'\n  ' + builders.join('\n  ')}
          `);
                }
            }
        }
        const targetSpec = this._makeTargetSpecifier(options);
        if (this.target && !targetSpec.project) {
            const projects = this.getProjectNamesByTarget(this.target);
            if (projects.length === 1) {
                // If there is a single target, use it to parse overrides.
                targetSpec.project = projects[0];
            }
        }
        if ((!targetSpec.project || !targetSpec.target) && !this.multiTarget) {
            if (options.help) {
                // This is a special case where we just return.
                return;
            }
            throw new Error('Cannot determine project or target for Architect command.');
        }
        if (this.target) {
            // Add options IF there's only one builder of this kind.
            const targetSpec = this._makeTargetSpecifier(options);
            const projectNames = targetSpec.project
                ? [targetSpec.project]
                : this.getProjectNamesByTarget(this.target);
            const builderConfigurations = [];
            for (const projectName of projectNames) {
                const targetDesc = this._architect.getBuilderConfiguration({
                    project: projectName,
                    target: targetSpec.target,
                });
                if (!builderConfigurations.find(b => b.builder === targetDesc.builder)) {
                    builderConfigurations.push(targetDesc);
                }
            }
            if (builderConfigurations.length == 1) {
                const builderConf = builderConfigurations[0];
                const builderDesc = await this._architect.getBuilderDescription(builderConf).toPromise();
                this.description.options.push(...(await json_schema_1.parseJsonSchemaToOptions(this._registry, builderDesc.schema)));
            }
        }
    }
    async run(options) {
        return await this.runArchitectTarget(options);
    }
    async runSingleTarget(targetSpec, options) {
        // We need to build the builderSpec twice because architect does not understand
        // overrides separately (getting the configuration builds the whole project, including
        // overrides).
        const builderConf = this._architect.getBuilderConfiguration(targetSpec);
        const builderDesc = await this._architect.getBuilderDescription(builderConf).toPromise();
        const targetOptionArray = await json_schema_1.parseJsonSchemaToOptions(this._registry, builderDesc.schema);
        const overrides = parser_1.parseArguments(options, targetOptionArray, this.logger);
        if (overrides['--']) {
            (overrides['--'] || []).forEach(additional => {
                this.logger.fatal(`Unknown option: '${additional.split(/=/)[0]}'`);
            });
            return 1;
        }
        const realBuilderConf = this._architect.getBuilderConfiguration(Object.assign({}, targetSpec, { overrides }));
        const builderContext = {
            logger: this.logger,
            targetSpecifier: targetSpec,
        };
        const result = await this._architect.run(realBuilderConf, builderContext).toPromise();
        return result.success ? 0 : 1;
    }
    async runArchitectTarget(options) {
        const extra = options['--'] || [];
        try {
            const targetSpec = this._makeTargetSpecifier(options);
            if (!targetSpec.project && this.target) {
                // This runs each target sequentially.
                // Running them in parallel would jumble the log messages.
                let result = 0;
                for (const project of this.getProjectNamesByTarget(this.target)) {
                    result |= await this.runSingleTarget(Object.assign({}, targetSpec, { project }), extra);
                }
                return result;
            }
            else {
                return await this.runSingleTarget(targetSpec, extra);
            }
        }
        catch (e) {
            if (e instanceof core_1.schema.SchemaValidationException) {
                const newErrors = [];
                for (const schemaError of e.errors) {
                    if (schemaError.keyword === 'additionalProperties') {
                        const unknownProperty = schemaError.params.additionalProperty;
                        if (unknownProperty in options) {
                            const dashes = unknownProperty.length === 1 ? '-' : '--';
                            this.logger.fatal(`Unknown option: '${dashes}${unknownProperty}'`);
                            continue;
                        }
                    }
                    newErrors.push(schemaError);
                }
                if (newErrors.length > 0) {
                    this.logger.error(new core_1.schema.SchemaValidationException(newErrors).message);
                }
                return 1;
            }
            else {
                throw e;
            }
        }
    }
    getProjectNamesByTarget(targetName) {
        const allProjectsForTargetName = this._workspace.listProjectNames().map(projectName => this._architect.listProjectTargets(projectName).includes(targetName) ? projectName : null).filter(x => !!x);
        if (this.multiTarget) {
            // For multi target commands, we always list all projects that have the target.
            return allProjectsForTargetName;
        }
        else {
            // For single target commands, we try the default project first,
            // then the full list if it has a single project, then error out.
            const maybeDefaultProject = this._workspace.getDefaultProjectName();
            if (maybeDefaultProject && allProjectsForTargetName.includes(maybeDefaultProject)) {
                return [maybeDefaultProject];
            }
            if (allProjectsForTargetName.length === 1) {
                return allProjectsForTargetName;
            }
            throw new Error(`Could not determine a single project for the '${targetName}' target.`);
        }
    }
    async _loadWorkspaceAndArchitect() {
        const workspaceLoader = new workspace_loader_1.WorkspaceLoader(this._host);
        const workspace = await workspaceLoader.loadWorkspace(this.workspace.root);
        this._workspace = workspace;
        this._architect = await new architect_1.Architect(workspace).loadArchitect().toPromise();
    }
    _makeTargetSpecifier(commandOptions) {
        let project, target, configuration;
        if (commandOptions.target) {
            [project, target, configuration] = commandOptions.target.split(':');
            if (commandOptions.configuration) {
                configuration = commandOptions.configuration;
            }
        }
        else {
            project = commandOptions.project;
            target = this.target;
            configuration = commandOptions.configuration;
            if (!configuration && commandOptions.prod) {
                configuration = 'production';
            }
        }
        if (!project) {
            project = '';
        }
        if (!target) {
            target = '';
        }
        return {
            project,
            configuration,
            target,
        };
    }
}
exports.ArchitectCommand = ArchitectCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJjaGl0ZWN0LWNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvY2xpL21vZGVscy9hcmNoaXRlY3QtY29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILHlEQUttQztBQUNuQywrQ0FBd0U7QUFDeEUsb0RBQWdGO0FBQ2hGLDBEQUFvRTtBQUNwRSx1Q0FBd0Q7QUFFeEQscUNBQTBDO0FBQzFDLHlEQUFxRDtBQVNyRCxNQUFzQixnQkFFcEIsU0FBUSxpQkFBZ0M7SUFGMUM7O1FBR1UsVUFBSyxHQUFHLElBQUkscUJBQWMsRUFBRSxDQUFDO1FBS3JDLHFEQUFxRDtRQUMzQyxnQkFBVyxHQUFHLEtBQUssQ0FBQztJQXVPaEMsQ0FBQztJQW5PUSxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQTRDO1FBQ2xFLE1BQU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVoQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksV0FBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsV0FBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUU3RSxNQUFNLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBRXhDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEMsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ2hFLHNGQUFzRjtnQkFDdEYsOENBQThDO2dCQUU5QyxNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7Z0JBQzlCLEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFO29CQUN0QyxNQUFNLFVBQVUsR0FBb0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDO3dCQUN6RCxPQUFPLEVBQUUsV0FBVzt3QkFDcEIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO3FCQUMxQixDQUFDLENBQUM7b0JBRUgsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTt3QkFDOUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQ25DO2lCQUNGO2dCQUVELElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQTs7ZUFFdkIsSUFBSSxDQUFDLE1BQU0sa0NBQWtDLFlBQVksQ0FBQyxJQUFJLEVBQUU7a0NBQzdDLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztXQUNyRCxDQUFDLENBQUM7aUJBQ0o7YUFDRjtTQUNGO1FBRUQsTUFBTSxVQUFVLEdBQW9CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV2RSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQ3RDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFM0QsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDekIsMERBQTBEO2dCQUMxRCxVQUFVLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNsQztTQUNGO1FBRUQsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEUsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFO2dCQUNoQiwrQ0FBK0M7Z0JBQy9DLE9BQU87YUFDUjtZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsMkRBQTJELENBQUMsQ0FBQztTQUM5RTtRQUVELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLHdEQUF3RDtZQUN4RCxNQUFNLFVBQVUsR0FBb0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxPQUFPO2dCQUNyQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU5QyxNQUFNLHFCQUFxQixHQUEyQixFQUFFLENBQUM7WUFDekQsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUU7Z0JBQ3RDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUM7b0JBQ3pELE9BQU8sRUFBRSxXQUFXO29CQUNwQixNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07aUJBQzFCLENBQUMsQ0FBQztnQkFFSCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3RFLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDeEM7YUFDRjtZQUVELElBQUkscUJBQXFCLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDckMsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFFekYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FDL0IsTUFBTSxzQ0FBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FDbkUsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQTRDO1FBQ3BELE9BQU8sTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVTLEtBQUssQ0FBQyxlQUFlLENBQUMsVUFBMkIsRUFBRSxPQUFpQjtRQUM1RSwrRUFBK0U7UUFDL0Usc0ZBQXNGO1FBQ3RGLGNBQWM7UUFDZCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN6RixNQUFNLGlCQUFpQixHQUFHLE1BQU0sc0NBQXdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0YsTUFBTSxTQUFTLEdBQUcsdUJBQWMsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTFFLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25CLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JFLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUNELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsdUJBQXVCLG1CQUFNLFVBQVUsSUFBRSxTQUFTLElBQUcsQ0FBQztRQUM5RixNQUFNLGNBQWMsR0FBNEI7WUFDOUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLGVBQWUsRUFBRSxVQUFVO1NBQzVCLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUV0RixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFUyxLQUFLLENBQUMsa0JBQWtCLENBQ2hDLE9BQTRDO1FBRTVDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFbEMsSUFBSTtZQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUN0QyxzQ0FBc0M7Z0JBQ3RDLDBEQUEwRDtnQkFDMUQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNmLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDL0QsTUFBTSxJQUFJLE1BQU0sSUFBSSxDQUFDLGVBQWUsbUJBQU0sVUFBVSxJQUFFLE9BQU8sS0FBSSxLQUFLLENBQUMsQ0FBQztpQkFDekU7Z0JBRUQsT0FBTyxNQUFNLENBQUM7YUFDZjtpQkFBTTtnQkFDTCxPQUFPLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDdEQ7U0FDRjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFlBQVksYUFBTSxDQUFDLHlCQUF5QixFQUFFO2dCQUNqRCxNQUFNLFNBQVMsR0FBa0MsRUFBRSxDQUFDO2dCQUNwRCxLQUFLLE1BQU0sV0FBVyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUU7b0JBQ2xDLElBQUksV0FBVyxDQUFDLE9BQU8sS0FBSyxzQkFBc0IsRUFBRTt3QkFDbEQsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQzt3QkFDOUQsSUFBSSxlQUFlLElBQUksT0FBTyxFQUFFOzRCQUM5QixNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7NEJBQ3pELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLG9CQUFvQixNQUFNLEdBQUcsZUFBZSxHQUFHLENBQUMsQ0FBQzs0QkFDbkUsU0FBUzt5QkFDVjtxQkFDRjtvQkFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2lCQUM3QjtnQkFFRCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLGFBQU0sQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDNUU7Z0JBRUQsT0FBTyxDQUFDLENBQUM7YUFDVjtpQkFBTTtnQkFDTCxNQUFNLENBQUMsQ0FBQzthQUNUO1NBQ0Y7SUFDSCxDQUFDO0lBRU8sdUJBQXVCLENBQUMsVUFBa0I7UUFDaEQsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQ3BGLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDMUYsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFhLENBQUM7UUFFL0IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLCtFQUErRTtZQUMvRSxPQUFPLHdCQUF3QixDQUFDO1NBQ2pDO2FBQU07WUFDTCxnRUFBZ0U7WUFDaEUsaUVBQWlFO1lBQ2pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BFLElBQUksbUJBQW1CLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7Z0JBQ2pGLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2FBQzlCO1lBRUQsSUFBSSx3QkFBd0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN6QyxPQUFPLHdCQUF3QixDQUFDO2FBQ2pDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsVUFBVSxXQUFXLENBQUMsQ0FBQztTQUN6RjtJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsMEJBQTBCO1FBQ3RDLE1BQU0sZUFBZSxHQUFHLElBQUksa0NBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFeEQsTUFBTSxTQUFTLEdBQUcsTUFBTSxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0UsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLElBQUkscUJBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMvRSxDQUFDO0lBRU8sb0JBQW9CLENBQUMsY0FBdUM7UUFDbEUsSUFBSSxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQztRQUVuQyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUU7WUFDekIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXBFLElBQUksY0FBYyxDQUFDLGFBQWEsRUFBRTtnQkFDaEMsYUFBYSxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUM7YUFDOUM7U0FDRjthQUFNO1lBQ0wsT0FBTyxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUM7WUFDakMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDckIsYUFBYSxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUM7WUFDN0MsSUFBSSxDQUFDLGFBQWEsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFO2dCQUN6QyxhQUFhLEdBQUcsWUFBWSxDQUFDO2FBQzlCO1NBQ0Y7UUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osT0FBTyxHQUFHLEVBQUUsQ0FBQztTQUNkO1FBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sR0FBRyxFQUFFLENBQUM7U0FDYjtRQUVELE9BQU87WUFDTCxPQUFPO1lBQ1AsYUFBYTtZQUNiLE1BQU07U0FDUCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBaFBELDRDQWdQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIEFyY2hpdGVjdCxcbiAgQnVpbGRlckNvbmZpZ3VyYXRpb24sXG4gIEJ1aWxkZXJDb250ZXh0LFxuICBUYXJnZXRTcGVjaWZpZXIsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgZXhwZXJpbWVudGFsLCBqc29uLCBzY2hlbWEsIHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCwgY3JlYXRlQ29uc29sZUxvZ2dlciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHsgcGFyc2VKc29uU2NoZW1hVG9PcHRpb25zIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2pzb24tc2NoZW1hJztcbmltcG9ydCB7IEJhc2VDb21tYW5kT3B0aW9ucywgQ29tbWFuZCB9IGZyb20gJy4vY29tbWFuZCc7XG5pbXBvcnQgeyBBcmd1bWVudHMgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBwYXJzZUFyZ3VtZW50cyB9IGZyb20gJy4vcGFyc2VyJztcbmltcG9ydCB7IFdvcmtzcGFjZUxvYWRlciB9IGZyb20gJy4vd29ya3NwYWNlLWxvYWRlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXJjaGl0ZWN0Q29tbWFuZE9wdGlvbnMgZXh0ZW5kcyBCYXNlQ29tbWFuZE9wdGlvbnMge1xuICBwcm9qZWN0Pzogc3RyaW5nO1xuICBjb25maWd1cmF0aW9uPzogc3RyaW5nO1xuICBwcm9kPzogYm9vbGVhbjtcbiAgdGFyZ2V0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQXJjaGl0ZWN0Q29tbWFuZDxcbiAgVCBleHRlbmRzIEFyY2hpdGVjdENvbW1hbmRPcHRpb25zID0gQXJjaGl0ZWN0Q29tbWFuZE9wdGlvbnMsXG4+IGV4dGVuZHMgQ29tbWFuZDxBcmNoaXRlY3RDb21tYW5kT3B0aW9ucz4ge1xuICBwcml2YXRlIF9ob3N0ID0gbmV3IE5vZGVKc1N5bmNIb3N0KCk7XG4gIHByb3RlY3RlZCBfYXJjaGl0ZWN0OiBBcmNoaXRlY3Q7XG4gIHByb3RlY3RlZCBfd29ya3NwYWNlOiBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZTtcbiAgcHJvdGVjdGVkIF9yZWdpc3RyeToganNvbi5zY2hlbWEuU2NoZW1hUmVnaXN0cnk7XG5cbiAgLy8gSWYgdGhpcyBjb21tYW5kIHN1cHBvcnRzIHJ1bm5pbmcgbXVsdGlwbGUgdGFyZ2V0cy5cbiAgcHJvdGVjdGVkIG11bHRpVGFyZ2V0ID0gZmFsc2U7XG5cbiAgdGFyZ2V0OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgcHVibGljIGFzeW5jIGluaXRpYWxpemUob3B0aW9uczogQXJjaGl0ZWN0Q29tbWFuZE9wdGlvbnMgJiBBcmd1bWVudHMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5pbml0aWFsaXplKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fcmVnaXN0cnkgPSBuZXcganNvbi5zY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KCk7XG4gICAgdGhpcy5fcmVnaXN0cnkuYWRkUG9zdFRyYW5zZm9ybShqc29uLnNjaGVtYS50cmFuc2Zvcm1zLmFkZFVuZGVmaW5lZERlZmF1bHRzKTtcblxuICAgIGF3YWl0IHRoaXMuX2xvYWRXb3Jrc3BhY2VBbmRBcmNoaXRlY3QoKTtcblxuICAgIGlmICghb3B0aW9ucy5wcm9qZWN0ICYmIHRoaXMudGFyZ2V0KSB7XG4gICAgICBjb25zdCBwcm9qZWN0TmFtZXMgPSB0aGlzLmdldFByb2plY3ROYW1lc0J5VGFyZ2V0KHRoaXMudGFyZ2V0KTtcbiAgICAgIGNvbnN0IGxlZnRvdmVycyA9IG9wdGlvbnNbJy0tJ107XG4gICAgICBpZiAocHJvamVjdE5hbWVzLmxlbmd0aCA+IDEgJiYgbGVmdG92ZXJzICYmIGxlZnRvdmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCBidWlsZGVycyBhcmUgdGhlIHNhbWUsIG90aGVyd2lzZSBlcnJvciBvdXQgKHNpbmNlIHRoZSBtZWFuaW5nIG9mIGFuXG4gICAgICAgIC8vIG9wdGlvbiBjb3VsZCB2YXJ5IGZyb20gYnVpbGRlciB0byBidWlsZGVyKS5cblxuICAgICAgICBjb25zdCBidWlsZGVyczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0TmFtZSBvZiBwcm9qZWN0TmFtZXMpIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXRTcGVjOiBUYXJnZXRTcGVjaWZpZXIgPSB0aGlzLl9tYWtlVGFyZ2V0U3BlY2lmaWVyKG9wdGlvbnMpO1xuICAgICAgICAgIGNvbnN0IHRhcmdldERlc2MgPSB0aGlzLl9hcmNoaXRlY3QuZ2V0QnVpbGRlckNvbmZpZ3VyYXRpb24oe1xuICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdE5hbWUsXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFNwZWMudGFyZ2V0LFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGJ1aWxkZXJzLmluZGV4T2YodGFyZ2V0RGVzYy5idWlsZGVyKSA9PSAtMSkge1xuICAgICAgICAgICAgYnVpbGRlcnMucHVzaCh0YXJnZXREZXNjLmJ1aWxkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChidWlsZGVycy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRhZ3Mub25lTGluZWBcbiAgICAgICAgICAgIEFyY2hpdGVjdCBjb21tYW5kcyB3aXRoIGNvbW1hbmQgbGluZSBvdmVycmlkZXMgY2Fubm90IHRhcmdldCBkaWZmZXJlbnQgYnVpbGRlcnMuIFRoZVxuICAgICAgICAgICAgJyR7dGhpcy50YXJnZXR9JyB0YXJnZXQgd291bGQgcnVuIG9uIHByb2plY3RzICR7cHJvamVjdE5hbWVzLmpvaW4oKX0gd2hpY2ggaGF2ZSB0aGVcbiAgICAgICAgICAgIGZvbGxvd2luZyBidWlsZGVyczogJHsnXFxuICAnICsgYnVpbGRlcnMuam9pbignXFxuICAnKX1cbiAgICAgICAgICBgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldFNwZWM6IFRhcmdldFNwZWNpZmllciA9IHRoaXMuX21ha2VUYXJnZXRTcGVjaWZpZXIob3B0aW9ucyk7XG5cbiAgICBpZiAodGhpcy50YXJnZXQgJiYgIXRhcmdldFNwZWMucHJvamVjdCkge1xuICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLmdldFByb2plY3ROYW1lc0J5VGFyZ2V0KHRoaXMudGFyZ2V0KTtcblxuICAgICAgaWYgKHByb2plY3RzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIHNpbmdsZSB0YXJnZXQsIHVzZSBpdCB0byBwYXJzZSBvdmVycmlkZXMuXG4gICAgICAgIHRhcmdldFNwZWMucHJvamVjdCA9IHByb2plY3RzWzBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgoIXRhcmdldFNwZWMucHJvamVjdCB8fCAhdGFyZ2V0U3BlYy50YXJnZXQpICYmICF0aGlzLm11bHRpVGFyZ2V0KSB7XG4gICAgICBpZiAob3B0aW9ucy5oZWxwKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlcmUgd2UganVzdCByZXR1cm4uXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZGV0ZXJtaW5lIHByb2plY3Qgb3IgdGFyZ2V0IGZvciBBcmNoaXRlY3QgY29tbWFuZC4nKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50YXJnZXQpIHtcbiAgICAgIC8vIEFkZCBvcHRpb25zIElGIHRoZXJlJ3Mgb25seSBvbmUgYnVpbGRlciBvZiB0aGlzIGtpbmQuXG4gICAgICBjb25zdCB0YXJnZXRTcGVjOiBUYXJnZXRTcGVjaWZpZXIgPSB0aGlzLl9tYWtlVGFyZ2V0U3BlY2lmaWVyKG9wdGlvbnMpO1xuICAgICAgY29uc3QgcHJvamVjdE5hbWVzID0gdGFyZ2V0U3BlYy5wcm9qZWN0XG4gICAgICAgID8gW3RhcmdldFNwZWMucHJvamVjdF1cbiAgICAgICAgOiB0aGlzLmdldFByb2plY3ROYW1lc0J5VGFyZ2V0KHRoaXMudGFyZ2V0KTtcblxuICAgICAgY29uc3QgYnVpbGRlckNvbmZpZ3VyYXRpb25zOiBCdWlsZGVyQ29uZmlndXJhdGlvbltdID0gW107XG4gICAgICBmb3IgKGNvbnN0IHByb2plY3ROYW1lIG9mIHByb2plY3ROYW1lcykge1xuICAgICAgICBjb25zdCB0YXJnZXREZXNjID0gdGhpcy5fYXJjaGl0ZWN0LmdldEJ1aWxkZXJDb25maWd1cmF0aW9uKHtcbiAgICAgICAgICBwcm9qZWN0OiBwcm9qZWN0TmFtZSxcbiAgICAgICAgICB0YXJnZXQ6IHRhcmdldFNwZWMudGFyZ2V0LFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWJ1aWxkZXJDb25maWd1cmF0aW9ucy5maW5kKGIgPT4gYi5idWlsZGVyID09PSB0YXJnZXREZXNjLmJ1aWxkZXIpKSB7XG4gICAgICAgICAgYnVpbGRlckNvbmZpZ3VyYXRpb25zLnB1c2godGFyZ2V0RGVzYyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGJ1aWxkZXJDb25maWd1cmF0aW9ucy5sZW5ndGggPT0gMSkge1xuICAgICAgICBjb25zdCBidWlsZGVyQ29uZiA9IGJ1aWxkZXJDb25maWd1cmF0aW9uc1swXTtcbiAgICAgICAgY29uc3QgYnVpbGRlckRlc2MgPSBhd2FpdCB0aGlzLl9hcmNoaXRlY3QuZ2V0QnVpbGRlckRlc2NyaXB0aW9uKGJ1aWxkZXJDb25mKS50b1Byb21pc2UoKTtcblxuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uLm9wdGlvbnMucHVzaCguLi4oXG4gICAgICAgICAgYXdhaXQgcGFyc2VKc29uU2NoZW1hVG9PcHRpb25zKHRoaXMuX3JlZ2lzdHJ5LCBidWlsZGVyRGVzYy5zY2hlbWEpXG4gICAgICAgICkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJ1bihvcHRpb25zOiBBcmNoaXRlY3RDb21tYW5kT3B0aW9ucyAmIEFyZ3VtZW50cykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJ1bkFyY2hpdGVjdFRhcmdldChvcHRpb25zKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBydW5TaW5nbGVUYXJnZXQodGFyZ2V0U3BlYzogVGFyZ2V0U3BlY2lmaWVyLCBvcHRpb25zOiBzdHJpbmdbXSkge1xuICAgIC8vIFdlIG5lZWQgdG8gYnVpbGQgdGhlIGJ1aWxkZXJTcGVjIHR3aWNlIGJlY2F1c2UgYXJjaGl0ZWN0IGRvZXMgbm90IHVuZGVyc3RhbmRcbiAgICAvLyBvdmVycmlkZXMgc2VwYXJhdGVseSAoZ2V0dGluZyB0aGUgY29uZmlndXJhdGlvbiBidWlsZHMgdGhlIHdob2xlIHByb2plY3QsIGluY2x1ZGluZ1xuICAgIC8vIG92ZXJyaWRlcykuXG4gICAgY29uc3QgYnVpbGRlckNvbmYgPSB0aGlzLl9hcmNoaXRlY3QuZ2V0QnVpbGRlckNvbmZpZ3VyYXRpb24odGFyZ2V0U3BlYyk7XG4gICAgY29uc3QgYnVpbGRlckRlc2MgPSBhd2FpdCB0aGlzLl9hcmNoaXRlY3QuZ2V0QnVpbGRlckRlc2NyaXB0aW9uKGJ1aWxkZXJDb25mKS50b1Byb21pc2UoKTtcbiAgICBjb25zdCB0YXJnZXRPcHRpb25BcnJheSA9IGF3YWl0IHBhcnNlSnNvblNjaGVtYVRvT3B0aW9ucyh0aGlzLl9yZWdpc3RyeSwgYnVpbGRlckRlc2Muc2NoZW1hKTtcbiAgICBjb25zdCBvdmVycmlkZXMgPSBwYXJzZUFyZ3VtZW50cyhvcHRpb25zLCB0YXJnZXRPcHRpb25BcnJheSwgdGhpcy5sb2dnZXIpO1xuXG4gICAgaWYgKG92ZXJyaWRlc1snLS0nXSkge1xuICAgICAgKG92ZXJyaWRlc1snLS0nXSB8fCBbXSkuZm9yRWFjaChhZGRpdGlvbmFsID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZmF0YWwoYFVua25vd24gb3B0aW9uOiAnJHthZGRpdGlvbmFsLnNwbGl0KC89LylbMF19J2ApO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBjb25zdCByZWFsQnVpbGRlckNvbmYgPSB0aGlzLl9hcmNoaXRlY3QuZ2V0QnVpbGRlckNvbmZpZ3VyYXRpb24oeyAuLi50YXJnZXRTcGVjLCBvdmVycmlkZXMgfSk7XG4gICAgY29uc3QgYnVpbGRlckNvbnRleHQ6IFBhcnRpYWw8QnVpbGRlckNvbnRleHQ+ID0ge1xuICAgICAgbG9nZ2VyOiB0aGlzLmxvZ2dlcixcbiAgICAgIHRhcmdldFNwZWNpZmllcjogdGFyZ2V0U3BlYyxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX2FyY2hpdGVjdC5ydW4ocmVhbEJ1aWxkZXJDb25mLCBidWlsZGVyQ29udGV4dCkudG9Qcm9taXNlKCk7XG5cbiAgICByZXR1cm4gcmVzdWx0LnN1Y2Nlc3MgPyAwIDogMTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBydW5BcmNoaXRlY3RUYXJnZXQoXG4gICAgb3B0aW9uczogQXJjaGl0ZWN0Q29tbWFuZE9wdGlvbnMgJiBBcmd1bWVudHMsXG4gICk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgZXh0cmEgPSBvcHRpb25zWyctLSddIHx8IFtdO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRhcmdldFNwZWMgPSB0aGlzLl9tYWtlVGFyZ2V0U3BlY2lmaWVyKG9wdGlvbnMpO1xuICAgICAgaWYgKCF0YXJnZXRTcGVjLnByb2plY3QgJiYgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgLy8gVGhpcyBydW5zIGVhY2ggdGFyZ2V0IHNlcXVlbnRpYWxseS5cbiAgICAgICAgLy8gUnVubmluZyB0aGVtIGluIHBhcmFsbGVsIHdvdWxkIGp1bWJsZSB0aGUgbG9nIG1lc3NhZ2VzLlxuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHRoaXMuZ2V0UHJvamVjdE5hbWVzQnlUYXJnZXQodGhpcy50YXJnZXQpKSB7XG4gICAgICAgICAgcmVzdWx0IHw9IGF3YWl0IHRoaXMucnVuU2luZ2xlVGFyZ2V0KHsgLi4udGFyZ2V0U3BlYywgcHJvamVjdCB9LCBleHRyYSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuU2luZ2xlVGFyZ2V0KHRhcmdldFNwZWMsIGV4dHJhKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIHNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5ld0Vycm9yczogc2NoZW1hLlNjaGVtYVZhbGlkYXRvckVycm9yW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBzY2hlbWFFcnJvciBvZiBlLmVycm9ycykge1xuICAgICAgICAgIGlmIChzY2hlbWFFcnJvci5rZXl3b3JkID09PSAnYWRkaXRpb25hbFByb3BlcnRpZXMnKSB7XG4gICAgICAgICAgICBjb25zdCB1bmtub3duUHJvcGVydHkgPSBzY2hlbWFFcnJvci5wYXJhbXMuYWRkaXRpb25hbFByb3BlcnR5O1xuICAgICAgICAgICAgaWYgKHVua25vd25Qcm9wZXJ0eSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRhc2hlcyA9IHVua25vd25Qcm9wZXJ0eS5sZW5ndGggPT09IDEgPyAnLScgOiAnLS0nO1xuICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5mYXRhbChgVW5rbm93biBvcHRpb246ICcke2Rhc2hlc30ke3Vua25vd25Qcm9wZXJ0eX0nYCk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdFcnJvcnMucHVzaChzY2hlbWFFcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3RXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihuZXcgc2NoZW1hLlNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24obmV3RXJyb3JzKS5tZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFByb2plY3ROYW1lc0J5VGFyZ2V0KHRhcmdldE5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWUgPSB0aGlzLl93b3Jrc3BhY2UubGlzdFByb2plY3ROYW1lcygpLm1hcChwcm9qZWN0TmFtZSA9PlxuICAgICAgdGhpcy5fYXJjaGl0ZWN0Lmxpc3RQcm9qZWN0VGFyZ2V0cyhwcm9qZWN0TmFtZSkuaW5jbHVkZXModGFyZ2V0TmFtZSkgPyBwcm9qZWN0TmFtZSA6IG51bGwsXG4gICAgKS5maWx0ZXIoeCA9PiAhIXgpIGFzIHN0cmluZ1tdO1xuXG4gICAgaWYgKHRoaXMubXVsdGlUYXJnZXQpIHtcbiAgICAgIC8vIEZvciBtdWx0aSB0YXJnZXQgY29tbWFuZHMsIHdlIGFsd2F5cyBsaXN0IGFsbCBwcm9qZWN0cyB0aGF0IGhhdmUgdGhlIHRhcmdldC5cbiAgICAgIHJldHVybiBhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBzaW5nbGUgdGFyZ2V0IGNvbW1hbmRzLCB3ZSB0cnkgdGhlIGRlZmF1bHQgcHJvamVjdCBmaXJzdCxcbiAgICAgIC8vIHRoZW4gdGhlIGZ1bGwgbGlzdCBpZiBpdCBoYXMgYSBzaW5nbGUgcHJvamVjdCwgdGhlbiBlcnJvciBvdXQuXG4gICAgICBjb25zdCBtYXliZURlZmF1bHRQcm9qZWN0ID0gdGhpcy5fd29ya3NwYWNlLmdldERlZmF1bHRQcm9qZWN0TmFtZSgpO1xuICAgICAgaWYgKG1heWJlRGVmYXVsdFByb2plY3QgJiYgYWxsUHJvamVjdHNGb3JUYXJnZXROYW1lLmluY2x1ZGVzKG1heWJlRGVmYXVsdFByb2plY3QpKSB7XG4gICAgICAgIHJldHVybiBbbWF5YmVEZWZhdWx0UHJvamVjdF07XG4gICAgICB9XG5cbiAgICAgIGlmIChhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWU7XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGRldGVybWluZSBhIHNpbmdsZSBwcm9qZWN0IGZvciB0aGUgJyR7dGFyZ2V0TmFtZX0nIHRhcmdldC5gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9sb2FkV29ya3NwYWNlQW5kQXJjaGl0ZWN0KCkge1xuICAgIGNvbnN0IHdvcmtzcGFjZUxvYWRlciA9IG5ldyBXb3Jrc3BhY2VMb2FkZXIodGhpcy5faG9zdCk7XG5cbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCB3b3Jrc3BhY2VMb2FkZXIubG9hZFdvcmtzcGFjZSh0aGlzLndvcmtzcGFjZS5yb290KTtcblxuICAgIHRoaXMuX3dvcmtzcGFjZSA9IHdvcmtzcGFjZTtcbiAgICB0aGlzLl9hcmNoaXRlY3QgPSBhd2FpdCBuZXcgQXJjaGl0ZWN0KHdvcmtzcGFjZSkubG9hZEFyY2hpdGVjdCgpLnRvUHJvbWlzZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWFrZVRhcmdldFNwZWNpZmllcihjb21tYW5kT3B0aW9uczogQXJjaGl0ZWN0Q29tbWFuZE9wdGlvbnMpOiBUYXJnZXRTcGVjaWZpZXIge1xuICAgIGxldCBwcm9qZWN0LCB0YXJnZXQsIGNvbmZpZ3VyYXRpb247XG5cbiAgICBpZiAoY29tbWFuZE9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICBbcHJvamVjdCwgdGFyZ2V0LCBjb25maWd1cmF0aW9uXSA9IGNvbW1hbmRPcHRpb25zLnRhcmdldC5zcGxpdCgnOicpO1xuXG4gICAgICBpZiAoY29tbWFuZE9wdGlvbnMuY29uZmlndXJhdGlvbikge1xuICAgICAgICBjb25maWd1cmF0aW9uID0gY29tbWFuZE9wdGlvbnMuY29uZmlndXJhdGlvbjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvamVjdCA9IGNvbW1hbmRPcHRpb25zLnByb2plY3Q7XG4gICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldDtcbiAgICAgIGNvbmZpZ3VyYXRpb24gPSBjb21tYW5kT3B0aW9ucy5jb25maWd1cmF0aW9uO1xuICAgICAgaWYgKCFjb25maWd1cmF0aW9uICYmIGNvbW1hbmRPcHRpb25zLnByb2QpIHtcbiAgICAgICAgY29uZmlndXJhdGlvbiA9ICdwcm9kdWN0aW9uJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHByb2plY3QgPSAnJztcbiAgICB9XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgIHRhcmdldCA9ICcnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBwcm9qZWN0LFxuICAgICAgY29uZmlndXJhdGlvbixcbiAgICAgIHRhcmdldCxcbiAgICB9O1xuICB9XG59XG4iXX0=