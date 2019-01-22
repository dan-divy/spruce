"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const os_1 = require("os");
const path = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ini = require('ini');
const lockfile = require('@yarnpkg/lockfile');
const pacote = require('pacote');
const npmPackageJsonCache = new Map();
let npmrc;
function readOptions(yarn = false) {
    // TODO: have a way to read options without using fs directly.
    const cwd = process.cwd();
    const baseFilename = yarn ? 'yarnrc' : 'npmrc';
    const dotFilename = '.' + baseFilename;
    let globalPrefix;
    if (process.env.PREFIX) {
        globalPrefix = process.env.PREFIX;
    }
    else {
        globalPrefix = path.dirname(process.execPath);
        if (process.platform !== 'win32') {
            globalPrefix = path.dirname(globalPrefix);
        }
    }
    const defaultConfigLocations = [
        path.join(globalPrefix, 'etc', baseFilename),
        path.join(os_1.homedir(), dotFilename),
    ];
    const projectConfigLocations = [];
    const root = path.parse(cwd).root;
    for (let curDir = path.dirname(cwd); curDir && curDir !== root; curDir = path.dirname(curDir)) {
        projectConfigLocations.unshift(path.join(curDir, dotFilename));
    }
    projectConfigLocations.push(path.join(cwd, dotFilename));
    let options = {};
    for (const location of [...defaultConfigLocations, ...projectConfigLocations]) {
        if (fs_1.existsSync(location)) {
            const data = fs_1.readFileSync(location, 'utf8');
            options = Object.assign({}, options, (yarn ? lockfile.parse(data) : ini.parse(data)));
            if (options.cafile) {
                const cafile = path.resolve(path.dirname(location), options.cafile);
                delete options.cafile;
                try {
                    options.ca = fs_1.readFileSync(cafile, 'utf8').replace(/\r?\n/, '\\n');
                }
                catch (_a) { }
            }
        }
    }
    // Substitute any environment variable references
    for (const key in options) {
        options[key] = options[key].replace(/\$\{([^\}]+)\}/, (_, name) => process.env[name] || '');
    }
    return options;
}
/**
 * Get the NPM repository's package.json for a package. This is p
 * @param {string} packageName The package name to fetch.
 * @param {string} registryUrl The NPM Registry URL to use.
 * @param {LoggerApi} logger A logger instance to log debug information.
 * @returns An observable that will put the pacakge.json content.
 * @private
 */
function getNpmPackageJson(packageName, registryUrl, _logger, usingYarn = false) {
    const cachedResponse = npmPackageJsonCache.get(packageName);
    if (cachedResponse) {
        return cachedResponse;
    }
    if (!npmrc) {
        try {
            npmrc = readOptions();
        }
        catch (_a) { }
        if (usingYarn) {
            try {
                npmrc = Object.assign({}, npmrc, readOptions(true));
            }
            catch (_b) { }
        }
    }
    const resultPromise = pacote.packument(packageName, Object.assign({ 'full-metadata': true }, npmrc, (registryUrl ? { registry: registryUrl } : {})));
    const response = rxjs_1.from(resultPromise).pipe(operators_1.shareReplay());
    npmPackageJsonCache.set(packageName, response);
    return response;
}
exports.getNpmPackageJson = getNpmPackageJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9zY2hlbWF0aWNzL3VwZGF0ZS91cGRhdGUvbnBtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsMkJBQThDO0FBQzlDLDJCQUE2QjtBQUM3Qiw2QkFBNkI7QUFDN0IsK0JBQXdDO0FBQ3hDLDhDQUE2QztBQUc3QyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDOUMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWdELENBQUM7QUFDcEYsSUFBSSxLQUFnQyxDQUFDO0FBR3JDLFNBQVMsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLO0lBQy9CLDhEQUE4RDtJQUM5RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUMvQyxNQUFNLFdBQVcsR0FBRyxHQUFHLEdBQUcsWUFBWSxDQUFDO0lBRXZDLElBQUksWUFBb0IsQ0FBQztJQUN6QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFO1FBQ3RCLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztLQUNuQztTQUFNO1FBQ0wsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUU7WUFDaEMsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDM0M7S0FDRjtJQUVELE1BQU0sc0JB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V0FBTSxHQUFHO1NBQ1o7S0FDRjtJQUVELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQ3BDLFdBQVcsa0JBRVQsZUFBZSxFQUFFLElBQUksSUFDbEIsS0FBSyxFQUNMLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBRXBELENBQUM7SUFFRixNQUFNLFFBQVEsR0FBRyxXQUFJLENBQTJCLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBVyxFQUFFLENBQUMsQ0FBQztJQUNuRixtQkFBbUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRS9DLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFwQ0QsOENBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgbG9nZ2luZyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGhvbWVkaXIgfSBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgc2hhcmVSZXBsYXkgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24gfSBmcm9tICcuL25wbS1wYWNrYWdlLWpzb24nO1xuXG5jb25zdCBpbmkgPSByZXF1aXJlKCdpbmknKTtcbmNvbnN0IGxvY2tmaWxlID0gcmVxdWlyZSgnQHlhcm5wa2cvbG9ja2ZpbGUnKTtcbmNvbnN0IHBhY290ZSA9IHJlcXVpcmUoJ3BhY290ZScpO1xuXG5jb25zdCBucG1QYWNrYWdlSnNvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8TnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uPj4oKTtcbmxldCBucG1yYzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcblxuXG5mdW5jdGlvbiByZWFkT3B0aW9ucyh5YXJuID0gZmFsc2UpOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9IHtcbiAgLy8gVE9ETzogaGF2ZSBhIHdheSB0byByZWFkIG9wdGlvbnMgd2l0aG91dCB1c2luZyBmcyBkaXJlY3RseS5cbiAgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgYmFzZUZpbGVuYW1lID0geWFybiA/ICd5YXJucmMnIDogJ25wbXJjJztcbiAgY29uc3QgZG90RmlsZW5hbWUgPSAnLicgKyBiYXNlRmlsZW5hbWU7XG5cbiAgbGV0IGdsb2JhbFByZWZpeDogc3RyaW5nO1xuICBpZiAocHJvY2Vzcy5lbnYuUFJFRklYKSB7XG4gICAgZ2xvYmFsUHJlZml4ID0gcHJvY2Vzcy5lbnYuUFJFRklYO1xuICB9IGVsc2Uge1xuICAgIGdsb2JhbFByZWZpeCA9IHBhdGguZGlybmFtZShwcm9jZXNzLmV4ZWNQYXRoKTtcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykge1xuICAgICAgZ2xvYmFsUHJlZml4ID0gcGF0aC5kaXJuYW1lKGdsb2JhbFByZWZpeCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGVmYXVsdENvbmZpZ0xvY2F0aW9ucyA9IFtcbiAgICBwYXRoLmpvaW4oZ2xvYmFsUHJlZml4LCAnZXRjJywgYmFzZUZpbGVuYW1lKSxcbiAgICBwYXRoLmpvaW4oaG9tZWRpcigpLCBkb3RGaWxlbmFtZSksXG4gIF07XG5cbiAgY29uc3QgcHJvamVjdENvbmZpZ0xvY2F0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgcm9vdCA9IHBhdGgucGFyc2UoY3dkKS5yb290O1xuICBmb3IgKGxldCBjdXJEaXIgPSBwYXRoLmRpcm5hbWUoY3dkKTsgY3VyRGlyICYmIGN1ckRpciAhPT0gcm9vdDsgY3VyRGlyID0gcGF0aC5kaXJuYW1lKGN1ckRpcikpIHtcbiAgICBwcm9qZWN0Q29uZmlnTG9jYXRpb25zLnVuc2hpZnQocGF0aC5qb2luKGN1ckRpciwgZG90RmlsZW5hbWUpKTtcbiAgfVxuICBwcm9qZWN0Q29uZmlnTG9jYXRpb25zLnB1c2gocGF0aC5qb2luKGN3ZCwgZG90RmlsZW5hbWUpKTtcblxuICBsZXQgb3B0aW9uczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuICBmb3IgKGNvbnN0IGxvY2F0aW9uIG9mIFsuLi5kZWZhdWx0Q29uZmlnTG9jYXRpb25zLCAuLi5wcm9qZWN0Q29uZmlnTG9jYXRpb25zXSkge1xuICAgIGlmIChleGlzdHNTeW5jKGxvY2F0aW9uKSkge1xuICAgICAgY29uc3QgZGF0YSA9IHJlYWRGaWxlU3luYyhsb2NhdGlvbiwgJ3V0ZjgnKTtcbiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIC4uLih5YXJuID8gbG9ja2ZpbGUucGFyc2UoZGF0YSkgOiBpbmkucGFyc2UoZGF0YSkpLFxuICAgICAgfTtcblxuICAgICAgaWYgKG9wdGlvbnMuY2FmaWxlKSB7XG4gICAgICAgIGNvbnN0IGNhZmlsZSA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobG9jYXRpb24pLCBvcHRpb25zLmNhZmlsZSk7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmNhZmlsZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvcHRpb25zLmNhID0gcmVhZEZpbGVTeW5jKGNhZmlsZSwgJ3V0ZjgnKS5yZXBsYWNlKC9cXHI/XFxuLywgJ1xcXFxuJyk7XG4gICAgICAgIH0gY2F0Y2ggeyB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU3Vic3RpdHV0ZSBhbnkgZW52aXJvbm1lbnQgdmFyaWFibGUgcmVmZXJlbmNlc1xuICBmb3IgKGNvbnN0IGtleSBpbiBvcHRpb25zKSB7XG4gICAgb3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldLnJlcGxhY2UoL1xcJFxceyhbXlxcfV0rKVxcfS8sIChfLCBuYW1lKSA9PiBwcm9jZXNzLmVudltuYW1lXSB8fCAnJyk7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucztcbn1cblxuLyoqXG4gKiBHZXQgdGhlIE5QTSByZXBvc2l0b3J5J3MgcGFja2FnZS5qc29uIGZvciBhIHBhY2thZ2UuIFRoaXMgaXMgcFxuICogQHBhcmFtIHtzdHJpbmd9IHBhY2thZ2VOYW1lIFRoZSBwYWNrYWdlIG5hbWUgdG8gZmV0Y2guXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVnaXN0cnlVcmwgVGhlIE5QTSBSZWdpc3RyeSBVUkwgdG8gdXNlLlxuICogQHBhcmFtIHtMb2dnZXJBcGl9IGxvZ2dlciBBIGxvZ2dlciBpbnN0YW5jZSB0byBsb2cgZGVidWcgaW5mb3JtYXRpb24uXG4gKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgd2lsbCBwdXQgdGhlIHBhY2FrZ2UuanNvbiBjb250ZW50LlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5wbVBhY2thZ2VKc29uKFxuICBwYWNrYWdlTmFtZTogc3RyaW5nLFxuICByZWdpc3RyeVVybDogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICBfbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgdXNpbmdZYXJuID0gZmFsc2UsXG4pOiBPYnNlcnZhYmxlPFBhcnRpYWw8TnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uPj4ge1xuICBjb25zdCBjYWNoZWRSZXNwb25zZSA9IG5wbVBhY2thZ2VKc29uQ2FjaGUuZ2V0KHBhY2thZ2VOYW1lKTtcbiAgaWYgKGNhY2hlZFJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIGNhY2hlZFJlc3BvbnNlO1xuICB9XG5cbiAgaWYgKCFucG1yYykge1xuICAgIHRyeSB7XG4gICAgICBucG1yYyA9IHJlYWRPcHRpb25zKCk7XG4gICAgfSBjYXRjaCB7IH1cblxuICAgIGlmICh1c2luZ1lhcm4pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5wbXJjID0geyAuLi5ucG1yYywgLi4ucmVhZE9wdGlvbnModHJ1ZSkgfTtcbiAgICAgIH0gY2F0Y2ggeyB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVzdWx0UHJvbWlzZSA9IHBhY290ZS5wYWNrdW1lbnQoXG4gICAgcGFja2FnZU5hbWUsXG4gICAge1xuICAgICAgJ2Z1bGwtbWV0YWRhdGEnOiB0cnVlLFxuICAgICAgLi4ubnBtcmMsXG4gICAgICAuLi4ocmVnaXN0cnlVcmwgPyB7IHJlZ2lzdHJ5OiByZWdpc3RyeVVybCB9IDoge30pLFxuICAgIH0sXG4gICk7XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBmcm9tPE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbj4ocmVzdWx0UHJvbWlzZSkucGlwZShzaGFyZVJlcGxheSgpKTtcbiAgbnBtUGFja2FnZUpzb25DYWNoZS5zZXQocGFja2FnZU5hbWUsIHJlc3BvbnNlKTtcblxuICByZXR1cm4gcmVzcG9uc2U7XG59XG4iXX0=