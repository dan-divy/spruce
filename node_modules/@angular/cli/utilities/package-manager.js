"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("./config");
function supports(name) {
    try {
        child_process_1.execSync(`${name} --version`, { stdio: 'ignore' });
        return true;
    }
    catch (_a) {
        return false;
    }
}
function supportsYarn() {
    return supports('yarn');
}
exports.supportsYarn = supportsYarn;
function supportsNpm() {
    return supports('npm');
}
exports.supportsNpm = supportsNpm;
function getPackageManager(root) {
    let packageManager = config_1.getConfiguredPackageManager();
    if (packageManager) {
        return packageManager;
    }
    const hasYarn = supportsYarn();
    const hasYarnLock = fs_1.existsSync(path_1.join(root, 'yarn.lock'));
    const hasNpm = supportsNpm();
    const hasNpmLock = fs_1.existsSync(path_1.join(root, 'package-lock.json'));
    if (hasYarn && hasYarnLock && !hasNpmLock) {
        packageManager = 'yarn';
    }
    else if (hasNpm && hasNpmLock && !hasYarnLock) {
        packageManager = 'npm';
    }
    else if (hasYarn && !hasNpm) {
        packageManager = 'yarn';
    }
    else if (hasNpm && !hasYarn) {
        packageManager = 'npm';
    }
    // TODO: This should eventually inform the user of ambiguous package manager usage.
    //       Potentially with a prompt to choose and optionally set as the default.
    return packageManager || 'npm';
}
exports.getPackageManager = getPackageManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL2NsaS91dGlsaXRpZXMvcGFja2FnZS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsaURBQXlDO0FBQ3pDLDJCQUFnQztBQUNoQywrQkFBNEI7QUFDNUIscUNBQXVEO0FBRXZELFNBQVMsUUFBUSxDQUFDLElBQVk7SUFDNUIsSUFBSTtRQUNGLHdCQUFRLENBQUMsR0FBRyxJQUFJLFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRW5ELE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFBQyxXQUFNO1FBQ04sT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUM7QUFFRCxTQUFnQixZQUFZO0lBQzFCLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFGRCxvQ0FFQztBQUVELFNBQWdCLFdBQVc7SUFDekIsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUZELGtDQUVDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtJQUM1QyxJQUFJLGNBQWMsR0FBRyxvQ0FBMkIsRUFBRSxDQUFDO0lBQ25ELElBQUksY0FBYyxFQUFFO1FBQ2xCLE9BQU8sY0FBYyxDQUFDO0tBQ3ZCO0lBRUQsTUFBTSxPQUFPLEdBQUcsWUFBWSxFQUFFLENBQUM7SUFDL0IsTUFBTSxXQUFXLEdBQUcsZUFBVSxDQUFDLFdBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUN4RCxNQUFNLE1BQU0sR0FBRyxXQUFXLEVBQUUsQ0FBQztJQUM3QixNQUFNLFVBQVUsR0FBRyxlQUFVLENBQUMsV0FBSSxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7SUFFL0QsSUFBSSxPQUFPLElBQUksV0FBVyxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ3pDLGNBQWMsR0FBRyxNQUFNLENBQUM7S0FDekI7U0FBTSxJQUFJLE1BQU0sSUFBSSxVQUFVLElBQUksQ0FBQyxXQUFXLEVBQUU7UUFDL0MsY0FBYyxHQUFHLEtBQUssQ0FBQztLQUN4QjtTQUFNLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQzdCLGNBQWMsR0FBRyxNQUFNLENBQUM7S0FDekI7U0FBTSxJQUFJLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUM3QixjQUFjLEdBQUcsS0FBSyxDQUFDO0tBQ3hCO0lBRUQsbUZBQW1GO0lBQ25GLCtFQUErRTtJQUMvRSxPQUFPLGNBQWMsSUFBSSxLQUFLLENBQUM7QUFDakMsQ0FBQztBQXhCRCw4Q0F3QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGdldENvbmZpZ3VyZWRQYWNrYWdlTWFuYWdlciB9IGZyb20gJy4vY29uZmlnJztcblxuZnVuY3Rpb24gc3VwcG9ydHMobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgZXhlY1N5bmMoYCR7bmFtZX0gLS12ZXJzaW9uYCwgeyBzdGRpbzogJ2lnbm9yZScgfSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdXBwb3J0c1lhcm4oKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdXBwb3J0cygneWFybicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3VwcG9ydHNOcG0oKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdXBwb3J0cygnbnBtJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWNrYWdlTWFuYWdlcihyb290OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcGFja2FnZU1hbmFnZXIgPSBnZXRDb25maWd1cmVkUGFja2FnZU1hbmFnZXIoKTtcbiAgaWYgKHBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgcmV0dXJuIHBhY2thZ2VNYW5hZ2VyO1xuICB9XG5cbiAgY29uc3QgaGFzWWFybiA9IHN1cHBvcnRzWWFybigpO1xuICBjb25zdCBoYXNZYXJuTG9jayA9IGV4aXN0c1N5bmMoam9pbihyb290LCAneWFybi5sb2NrJykpO1xuICBjb25zdCBoYXNOcG0gPSBzdXBwb3J0c05wbSgpO1xuICBjb25zdCBoYXNOcG1Mb2NrID0gZXhpc3RzU3luYyhqb2luKHJvb3QsICdwYWNrYWdlLWxvY2suanNvbicpKTtcblxuICBpZiAoaGFzWWFybiAmJiBoYXNZYXJuTG9jayAmJiAhaGFzTnBtTG9jaykge1xuICAgIHBhY2thZ2VNYW5hZ2VyID0gJ3lhcm4nO1xuICB9IGVsc2UgaWYgKGhhc05wbSAmJiBoYXNOcG1Mb2NrICYmICFoYXNZYXJuTG9jaykge1xuICAgIHBhY2thZ2VNYW5hZ2VyID0gJ25wbSc7XG4gIH0gZWxzZSBpZiAoaGFzWWFybiAmJiAhaGFzTnBtKSB7XG4gICAgcGFja2FnZU1hbmFnZXIgPSAneWFybic7XG4gIH0gZWxzZSBpZiAoaGFzTnBtICYmICFoYXNZYXJuKSB7XG4gICAgcGFja2FnZU1hbmFnZXIgPSAnbnBtJztcbiAgfVxuXG4gIC8vIFRPRE86IFRoaXMgc2hvdWxkIGV2ZW50dWFsbHkgaW5mb3JtIHRoZSB1c2VyIG9mIGFtYmlndW91cyBwYWNrYWdlIG1hbmFnZXIgdXNhZ2UuXG4gIC8vICAgICAgIFBvdGVudGlhbGx5IHdpdGggYSBwcm9tcHQgdG8gY2hvb3NlIGFuZCBvcHRpb25hbGx5IHNldCBhcyB0aGUgZGVmYXVsdC5cbiAgcmV0dXJuIHBhY2thZ2VNYW5hZ2VyIHx8ICducG0nO1xufVxuIl19