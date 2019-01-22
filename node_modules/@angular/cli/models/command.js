"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-global-tslint-disable no-any
const core_1 = require("@angular-devkit/core");
const path = require("path");
const config_1 = require("../utilities/config");
const interface_1 = require("./interface");
class Command {
    constructor(context, description, logger) {
        this.description = description;
        this.logger = logger;
        this.allowMissingWorkspace = false;
        this.workspace = context.workspace;
    }
    static setCommandMap(map) {
        this.commandMap = map;
    }
    async initialize(options) {
        return;
    }
    async printHelp(options) {
        await this.printHelpUsage();
        await this.printHelpOptions();
        return 0;
    }
    async printJsonHelp(_options) {
        this.logger.info(JSON.stringify(this.description));
        return 0;
    }
    async printHelpUsage() {
        this.logger.info(this.description.description);
        const name = this.description.name;
        const args = this.description.options.filter(x => x.positional !== undefined);
        const opts = this.description.options.filter(x => x.positional === undefined);
        const argDisplay = args && args.length > 0
            ? ' ' + args.map(a => `<${a.name}>`).join(' ')
            : '';
        const optionsDisplay = opts && opts.length > 0
            ? ` [options]`
            : ``;
        this.logger.info(`usage: ng ${name}${argDisplay}${optionsDisplay}`);
        this.logger.info('');
    }
    async printHelpSubcommand(subcommand) {
        this.logger.info(subcommand.description);
        await this.printHelpOptions(subcommand.options);
    }
    async printHelpOptions(options = this.description.options) {
        const args = options.filter(opt => opt.positional !== undefined);
        const opts = options.filter(opt => opt.positional === undefined);
        const formatDescription = (description) => `    ${description.replace(/\n/g, '\n    ')}`;
        if (args.length > 0) {
            this.logger.info(`arguments:`);
            args.forEach(o => {
                this.logger.info(`  ${core_1.terminal.cyan(o.name)}`);
                if (o.description) {
                    this.logger.info(formatDescription(o.description));
                }
            });
        }
        if (options.length > 0) {
            if (args.length > 0) {
                this.logger.info('');
            }
            this.logger.info(`options:`);
            opts
                .filter(o => !o.hidden)
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(o => {
                const aliases = o.aliases && o.aliases.length > 0
                    ? '(' + o.aliases.map(a => `-${a}`).join(' ') + ')'
                    : '';
                this.logger.info(`  ${core_1.terminal.cyan('--' + core_1.strings.dasherize(o.name))} ${aliases}`);
                if (o.description) {
                    this.logger.info(formatDescription(o.description));
                }
            });
        }
    }
    async validateScope(scope) {
        switch (scope === undefined ? this.description.scope : scope) {
            case interface_1.CommandScope.OutProject:
                if (this.workspace.configFile) {
                    this.logger.fatal(core_1.tags.oneLine `
            The ${this.description.name} command requires to be run outside of a project, but a
            project definition was found at "${path.join(this.workspace.root, this.workspace.configFile)}".
          `);
                    throw 1;
                }
                break;
            case interface_1.CommandScope.InProject:
                if (!this.workspace.configFile || config_1.getWorkspace('local') === null) {
                    this.logger.fatal(core_1.tags.oneLine `
            The ${this.description.name} command requires to be run in an Angular project, but a
            project definition could not be found.
          `);
                    throw 1;
                }
                break;
            case interface_1.CommandScope.Everywhere:
                // Can't miss this.
                break;
        }
    }
    async validateAndRun(options) {
        if (!(options.help === true || options.help === 'json' || options.help === 'JSON')) {
            await this.validateScope();
        }
        await this.initialize(options);
        if (options.help === true) {
            return this.printHelp(options);
        }
        else if (options.help === 'json' || options.help === 'JSON') {
            return this.printJsonHelp(options);
        }
        else {
            return await this.run(options);
        }
    }
}
exports.Command = Command;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvbW9kZWxzL2NvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxpREFBaUQ7QUFDakQsK0NBQXdFO0FBQ3hFLDZCQUE2QjtBQUM3QixnREFBbUQ7QUFDbkQsMkNBUXFCO0FBTXJCLE1BQXNCLE9BQU87SUFTM0IsWUFDRSxPQUF1QixFQUNQLFdBQStCLEVBQzVCLE1BQXNCO1FBRHpCLGdCQUFXLEdBQVgsV0FBVyxDQUFvQjtRQUM1QixXQUFNLEdBQU4sTUFBTSxDQUFnQjtRQVhwQywwQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFhbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ3JDLENBQUM7SUFWRCxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQTBCO1FBQzdDLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO0lBQ3hCLENBQUM7SUFVRCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQXNCO1FBQ3JDLE9BQU87SUFDVCxDQUFDO0lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFzQjtRQUNwQyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRTlCLE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBdUI7UUFDekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUVuRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFUyxLQUFLLENBQUMsY0FBYztRQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcs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LENBQUMsT0FBTyxDQUFDLENBQUM7U0FDaEM7YUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQzdELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwQzthQUFNO1lBQ0wsT0FBTyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDaEM7SUFDSCxDQUFDO0NBQ0Y7QUEzSUQsMEJBMklDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1nbG9iYWwtdHNsaW50LWRpc2FibGUgbm8tYW55XG5pbXBvcnQgeyBsb2dnaW5nLCBzdHJpbmdzLCB0YWdzLCB0ZXJtaW5hbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcbmltcG9ydCB7XG4gIEFyZ3VtZW50cyxcbiAgQ29tbWFuZENvbnRleHQsXG4gIENvbW1hbmREZXNjcmlwdGlvbixcbiAgQ29tbWFuZERlc2NyaXB0aW9uTWFwLFxuICBDb21tYW5kU2NvcGUsXG4gIENvbW1hbmRXb3Jrc3BhY2UsXG4gIE9wdGlvbiwgU3ViQ29tbWFuZERlc2NyaXB0aW9uLFxufSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZUNvbW1hbmRPcHRpb25zIHtcbiAgaGVscD86IGJvb2xlYW4gfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21tYW5kPFQgZXh0ZW5kcyBCYXNlQ29tbWFuZE9wdGlvbnMgPSBCYXNlQ29tbWFuZE9wdGlvbnM+IHtcbiAgcHVibGljIGFsbG93TWlzc2luZ1dvcmtzcGFjZSA9IGZhbHNlO1xuICBwdWJsaWMgd29ya3NwYWNlOiBDb21tYW5kV29ya3NwYWNlO1xuXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tbWFuZE1hcDogQ29tbWFuZERlc2NyaXB0aW9uTWFwO1xuICBzdGF0aWMgc2V0Q29tbWFuZE1hcChtYXA6IENvbW1hbmREZXNjcmlwdGlvbk1hcCkge1xuICAgIHRoaXMuY29tbWFuZE1hcCA9IG1hcDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRleHQ6IENvbW1hbmRDb250ZXh0LFxuICAgIHB1YmxpYyByZWFkb25seSBkZXNjcmlwdGlvbjogQ29tbWFuZERlc2NyaXB0aW9uLFxuICAgIHByb3RlY3RlZCByZWFkb25seSBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyLFxuICApIHtcbiAgICB0aGlzLndvcmtzcGFjZSA9IGNvbnRleHQud29ya3NwYWNlO1xuICB9XG5cbiAgYXN5bmMgaW5pdGlhbGl6ZShvcHRpb25zOiBUICYgQXJndW1lbnRzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXN5bmMgcHJpbnRIZWxwKG9wdGlvbnM6IFQgJiBBcmd1bWVudHMpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGF3YWl0IHRoaXMucHJpbnRIZWxwVXNhZ2UoKTtcbiAgICBhd2FpdCB0aGlzLnByaW50SGVscE9wdGlvbnMoKTtcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgYXN5bmMgcHJpbnRKc29uSGVscChfb3B0aW9uczogVCAmIEFyZ3VtZW50cyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhKU09OLnN0cmluZ2lmeSh0aGlzLmRlc2NyaXB0aW9uKSk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBwcmludEhlbHBVc2FnZSgpIHtcbiAgICB0aGlzLmxvZ2dlci5pbmZvKHRoaXMuZGVzY3JpcHRpb24uZGVzY3JpcHRpb24pO1xuXG4gICAgY29uc3QgbmFtZSA9IHRoaXMuZGVzY3JpcHRpb24ubmFtZTtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5kZXNjcmlwdGlvbi5vcHRpb25zLmZpbHRlcih4ID0+IHgucG9zaXRpb25hbCAhPT0gdW5kZWZpbmVkKTtcbiAgICBjb25zdCBvcHRzID0gdGhpcy5kZXNjcmlwdGlvbi5vcHRpb25zLmZpbHRlcih4ID0+IHgucG9zaXRpb25hbCA9PT0gdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGFyZ0Rpc3BsYXkgPSBhcmdzICYmIGFyZ3MubGVuZ3RoID4gMFxuICAgICAgPyAnICcgKyBhcmdzLm1hcChhID0+IGA8JHthLm5hbWV9PmApLmpvaW4oJyAnKVxuICAgICAgOiAnJztcbiAgICBjb25zdCBvcHRpb25zRGlzcGxheSA9IG9wdHMgJiYgb3B0cy5sZW5ndGggPiAwXG4gICAgICA/IGAgW29wdGlvbnNdYFxuICAgICAgOiBgYDtcblxuICAgIHRoaXMubG9nZ2VyLmluZm8oYHVzYWdlOiBuZyAke25hbWV9JHthcmdEaXNwbGF5fSR7b3B0aW9uc0Rpc3BsYXl9YCk7XG4gICAgdGhpcy5sb2dnZXIuaW5mbygnJyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcHJpbnRIZWxwU3ViY29tbWFuZChzdWJjb21tYW5kOiBTdWJDb21tYW5kRGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLmxvZ2dlci5pbmZvKHN1YmNvbW1hbmQuZGVzY3JpcHRpb24pO1xuXG4gICAgYXdhaXQgdGhpcy5wcmludEhlbHBPcHRpb25zKHN1YmNvbW1hbmQub3B0aW9ucyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcHJpbnRIZWxwT3B0aW9ucyhvcHRpb25zOiBPcHRpb25bXSA9IHRoaXMuZGVzY3JpcHRpb24ub3B0aW9ucykge1xuICAgIGNvbnN0IGFyZ3MgPSBvcHRpb25zLmZpbHRlcihvcHQgPT4gb3B0LnBvc2l0aW9uYWwgIT09IHVuZGVmaW5lZCk7XG4gICAgY29uc3Qgb3B0cyA9IG9wdGlvbnMuZmlsdGVyKG9wdCA9PiBvcHQucG9zaXRpb25hbCA9PT0gdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGZvcm1hdERlc2NyaXB0aW9uID0gKGRlc2NyaXB0aW9uOiBzdHJpbmcpID0+XG4gICAgICBgICAgICR7ZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxuL2csICdcXG4gICAgJyl9YDtcblxuICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oYGFyZ3VtZW50czpgKTtcbiAgICAgIGFyZ3MuZm9yRWFjaChvID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhgICAke3Rlcm1pbmFsLmN5YW4oby5uYW1lKX1gKTtcbiAgICAgICAgaWYgKG8uZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGZvcm1hdERlc2NyaXB0aW9uKG8uZGVzY3JpcHRpb24pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnJyk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKGBvcHRpb25zOmApO1xuICAgICAgb3B0c1xuICAgICAgICAuZmlsdGVyKG8gPT4gIW8uaGlkZGVuKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSlcbiAgICAgICAgLmZvckVhY2gobyA9PiB7XG4gICAgICAgICAgY29uc3QgYWxpYXNlcyA9IG8uYWxpYXNlcyAmJiBvLmFsaWFzZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyAnKCcgKyBvLmFsaWFzZXMubWFwKGEgPT4gYC0ke2F9YCkuam9pbignICcpICsgJyknXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oYCAgJHt0ZXJtaW5hbC5jeWFuKCctLScgKyBzdHJpbmdzLmRhc2hlcml6ZShvLm5hbWUpKX0gJHthbGlhc2VzfWApO1xuICAgICAgICAgIGlmIChvLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGZvcm1hdERlc2NyaXB0aW9uKG8uZGVzY3JpcHRpb24pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHZhbGlkYXRlU2NvcGUoc2NvcGU/OiBDb21tYW5kU2NvcGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBzd2l0Y2ggKHNjb3BlID09PSB1bmRlZmluZWQgPyB0aGlzLmRlc2NyaXB0aW9uLnNjb3BlIDogc2NvcGUpIHtcbiAgICAgIGNhc2UgQ29tbWFuZFNjb3BlLk91dFByb2plY3Q6XG4gICAgICAgIGlmICh0aGlzLndvcmtzcGFjZS5jb25maWdGaWxlKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIuZmF0YWwodGFncy5vbmVMaW5lYFxuICAgICAgICAgICAgVGhlICR7dGhpcy5kZXNjcmlwdGlvbi5uYW1lfSBjb21tYW5kIHJlcXVpcmVzIHRvIGJlIHJ1biBvdXRzaWRlIG9mIGEgcHJvamVjdCwgYnV0IGFcbiAgICAgICAgICAgIHByb2plY3QgZGVmaW5pdGlvbiB3YXMgZm91bmQgYXQgXCIke3BhdGguam9pbihcbiAgICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2Uucm9vdCxcbiAgICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2UuY29uZmlnRmlsZSxcbiAgICAgICAgICAgICl9XCIuXG4gICAgICAgICAgYCk7XG4gICAgICAgICAgdGhyb3cgMTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tbWFuZFNjb3BlLkluUHJvamVjdDpcbiAgICAgICAgaWYgKCF0aGlzLndvcmtzcGFjZS5jb25maWdGaWxlIHx8IGdldFdvcmtzcGFjZSgnbG9jYWwnKSA9PT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKHRhZ3Mub25lTGluZWBcbiAgICAgICAgICAgIFRoZSAke3RoaXMuZGVzY3JpcHRpb24ubmFtZX0gY29tbWFuZCByZXF1aXJlcyB0byBiZSBydW4gaW4gYW4gQW5ndWxhciBwcm9qZWN0LCBidXQgYVxuICAgICAgICAgICAgcHJvamVjdCBkZWZpbml0aW9uIGNvdWxkIG5vdCBiZSBmb3VuZC5cbiAgICAgICAgICBgKTtcbiAgICAgICAgICB0aHJvdyAxO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21tYW5kU2NvcGUuRXZlcnl3aGVyZTpcbiAgICAgICAgLy8gQ2FuJ3QgbWlzcyB0aGlzLlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBhYnN0cmFjdCBhc3luYyBydW4ob3B0aW9uczogVCAmIEFyZ3VtZW50cyk6IFByb21pc2U8bnVtYmVyIHwgdm9pZD47XG5cbiAgYXN5bmMgdmFsaWRhdGVBbmRSdW4ob3B0aW9uczogVCAmIEFyZ3VtZW50cyk6IFByb21pc2U8bnVtYmVyIHwgdm9pZD4ge1xuICAgIGlmICghKG9wdGlvbnMuaGVscCA9PT0gdHJ1ZSB8fCBvcHRpb25zLmhlbHAgPT09ICdqc29uJyB8fCBvcHRpb25zLmhlbHAgPT09ICdKU09OJykpIHtcbiAgICAgIGF3YWl0IHRoaXMudmFsaWRhdGVTY29wZSgpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUob3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5oZWxwID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcmludEhlbHAob3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmhlbHAgPT09ICdqc29uJyB8fCBvcHRpb25zLmhlbHAgPT09ICdKU09OJykge1xuICAgICAgcmV0dXJuIHRoaXMucHJpbnRKc29uSGVscChvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuKG9wdGlvbnMpO1xuICAgIH1cbiAgfVxufVxuIl19