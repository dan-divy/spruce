"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
/**
 * A Logger that sends information to STDOUT and STDERR.
 */
function createConsoleLogger(verbose = false, stdout = process.stdout, stderr = process.stderr) {
    const logger = new src_1.logging.IndentLogger('cling');
    logger
        .pipe(operators_1.filter(entry => (entry.level != 'debug' || verbose)))
        .subscribe(entry => {
        let color = x => src_1.terminal.dim(src_1.terminal.white(x));
        let output = stdout;
        switch (entry.level) {
            case 'info':
                color = src_1.terminal.white;
                break;
            case 'warn':
                color = (x) => src_1.terminal.bold(src_1.terminal.yellow(x));
                output = stderr;
                break;
            case 'fatal':
            case 'error':
                color = (x) => src_1.terminal.bold(src_1.terminal.red(x));
                output = stderr;
                break;
        }
        // If we do console.log(message) or process.stdout.write(message + '\n'), the process might
        // stop before the whole message is written and the stream is flushed. This happens when
        // streams are asynchronous.
        //
        // NodeJS IO streams are different depending on platform and usage. In POSIX environment,
        // for example, they're asynchronous when writing to a pipe, but synchronous when writing
        // to a TTY. In windows, it's the other way around. You can verify which is which with
        // stream.isTTY and platform, but this is not good enough.
        // In the async case, one should wait for the callback before sending more data or
        // continuing the process. In our case it would be rather hard to do (but not impossible).
        //
        // Instead we take the easy way out and simply chunk the message and call the write
        // function while the buffer drain itself asynchronously. With a smaller chunk size than
        // the buffer, we are mostly certain that it works. In this case, the chunk has been picked
        // as half a page size (4096/2 = 2048), minus some bytes for the color formatting.
        // On POSIX it seems the buffer is 2 pages (8192), but just to be sure (could be different
        // by platform).
        //
        // For more details, see https://nodejs.org/api/process.html#process_a_note_on_process_i_o
        const chunkSize = 2000; // Small chunk.
        let message = entry.message;
        while (message) {
            const chunk = message.slice(0, chunkSize);
            message = message.slice(chunkSize);
            output.write(color(chunk));
        }
        output.write('\n');
    });
    return logger;
}
exports.createConsoleLogger = createConsoleLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWxvZ2dlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9ub2RlL2NsaS1sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCw4Q0FBd0M7QUFDeEMsZ0NBQTJDO0FBTTNDOztHQUVHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQ2pDLE9BQU8sR0FBRyxLQUFLLEVBQ2YsU0FBd0IsT0FBTyxDQUFDLE1BQU0sRUFDdEMsU0FBd0IsT0FBTyxDQUFDLE1BQU07SUFFdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxhQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU07U0FDSCxJQUFJLENBQUMsa0JBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztTQUMxRCxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDakIsSUFBSSxLQUFLLEdBQTBCLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBUSxDQUFDLEdBQUcsQ0FBQyxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEUsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3BCLFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRTtZQUNuQixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLGNBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZCLE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxjQUFRLENBQUMsSUFBSSxDQUFDLGNBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekQsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDaEIsTUFBTTtZQUNSLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxPQUFPO2dCQUNWLEtBQUssR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsY0FBUSxDQUFDLElBQUksQ0FBQyxjQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBQ2hCLE1BQU07U0FDVDtRQUVELDJGQUEyRjtRQUMzRix3RkFBd0Y7UUFDeEYsNEJBQTRCO1FBQzVCLEVBQUU7UUFDRix5RkFBeUY7UUFDekYseUZBQXlGO1FBQ3pGLHNGQUFzRjtRQUN0RiwwREFBMEQ7UUFDMUQsa0ZBQWtGO1FBQ2xGLDBGQUEwRjtRQUMxRixFQUFFO1FBQ0YsbUZBQW1GO1FBQ25GLHdGQUF3RjtRQUN4RiwyRkFBMkY7UUFDM0Ysa0ZBQWtGO1FBQ2xGLDBGQUEwRjtRQUMxRixnQkFBZ0I7UUFDaEIsRUFBRTtRQUNGLDBGQUEwRjtRQUMxRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBRSxlQUFlO1FBQ3hDLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDNUIsT0FBTyxPQUFPLEVBQUU7WUFDZCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztJQUVMLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUF6REQsa0RBeURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgbG9nZ2luZywgdGVybWluYWwgfSBmcm9tICcuLi9zcmMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2Nlc3NPdXRwdXQge1xuICB3cml0ZShidWZmZXI6IHN0cmluZyB8IEJ1ZmZlcik6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQSBMb2dnZXIgdGhhdCBzZW5kcyBpbmZvcm1hdGlvbiB0byBTVERPVVQgYW5kIFNUREVSUi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnNvbGVMb2dnZXIoXG4gIHZlcmJvc2UgPSBmYWxzZSxcbiAgc3Rkb3V0OiBQcm9jZXNzT3V0cHV0ID0gcHJvY2Vzcy5zdGRvdXQsXG4gIHN0ZGVycjogUHJvY2Vzc091dHB1dCA9IHByb2Nlc3Muc3RkZXJyLFxuKTogbG9nZ2luZy5Mb2dnZXIge1xuICBjb25zdCBsb2dnZXIgPSBuZXcgbG9nZ2luZy5JbmRlbnRMb2dnZXIoJ2NsaW5nJyk7XG5cbiAgbG9nZ2VyXG4gICAgLnBpcGUoZmlsdGVyKGVudHJ5ID0+IChlbnRyeS5sZXZlbCAhPSAnZGVidWcnIHx8IHZlcmJvc2UpKSlcbiAgICAuc3Vic2NyaWJlKGVudHJ5ID0+IHtcbiAgICAgIGxldCBjb2xvcjogKHM6IHN0cmluZykgPT4gc3RyaW5nID0geCA9PiB0ZXJtaW5hbC5kaW0odGVybWluYWwud2hpdGUoeCkpO1xuICAgICAgbGV0IG91dHB1dCA9IHN0ZG91dDtcbiAgICAgIHN3aXRjaCAoZW50cnkubGV2ZWwpIHtcbiAgICAgICAgY2FzZSAnaW5mbyc6XG4gICAgICAgICAgY29sb3IgPSB0ZXJtaW5hbC53aGl0ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnd2Fybic6XG4gICAgICAgICAgY29sb3IgPSAoeDogc3RyaW5nKSA9PiB0ZXJtaW5hbC5ib2xkKHRlcm1pbmFsLnllbGxvdyh4KSk7XG4gICAgICAgICAgb3V0cHV0ID0gc3RkZXJyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdmYXRhbCc6XG4gICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICBjb2xvciA9ICh4OiBzdHJpbmcpID0+IHRlcm1pbmFsLmJvbGQodGVybWluYWwucmVkKHgpKTtcbiAgICAgICAgICBvdXRwdXQgPSBzdGRlcnI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGRvIGNvbnNvbGUubG9nKG1lc3NhZ2UpIG9yIHByb2Nlc3Muc3Rkb3V0LndyaXRlKG1lc3NhZ2UgKyAnXFxuJyksIHRoZSBwcm9jZXNzIG1pZ2h0XG4gICAgICAvLyBzdG9wIGJlZm9yZSB0aGUgd2hvbGUgbWVzc2FnZSBpcyB3cml0dGVuIGFuZCB0aGUgc3RyZWFtIGlzIGZsdXNoZWQuIFRoaXMgaGFwcGVucyB3aGVuXG4gICAgICAvLyBzdHJlYW1zIGFyZSBhc3luY2hyb25vdXMuXG4gICAgICAvL1xuICAgICAgLy8gTm9kZUpTIElPIHN0cmVhbXMgYXJlIGRpZmZlcmVudCBkZXBlbmRpbmcgb24gcGxhdGZvcm0gYW5kIHVzYWdlLiBJbiBQT1NJWCBlbnZpcm9ubWVudCxcbiAgICAgIC8vIGZvciBleGFtcGxlLCB0aGV5J3JlIGFzeW5jaHJvbm91cyB3aGVuIHdyaXRpbmcgdG8gYSBwaXBlLCBidXQgc3luY2hyb25vdXMgd2hlbiB3cml0aW5nXG4gICAgICAvLyB0byBhIFRUWS4gSW4gd2luZG93cywgaXQncyB0aGUgb3RoZXIgd2F5IGFyb3VuZC4gWW91IGNhbiB2ZXJpZnkgd2hpY2ggaXMgd2hpY2ggd2l0aFxuICAgICAgLy8gc3RyZWFtLmlzVFRZIGFuZCBwbGF0Zm9ybSwgYnV0IHRoaXMgaXMgbm90IGdvb2QgZW5vdWdoLlxuICAgICAgLy8gSW4gdGhlIGFzeW5jIGNhc2UsIG9uZSBzaG91bGQgd2FpdCBmb3IgdGhlIGNhbGxiYWNrIGJlZm9yZSBzZW5kaW5nIG1vcmUgZGF0YSBvclxuICAgICAgLy8gY29udGludWluZyB0aGUgcHJvY2Vzcy4gSW4gb3VyIGNhc2UgaXQgd291bGQgYmUgcmF0aGVyIGhhcmQgdG8gZG8gKGJ1dCBub3QgaW1wb3NzaWJsZSkuXG4gICAgICAvL1xuICAgICAgLy8gSW5zdGVhZCB3ZSB0YWtlIHRoZSBlYXN5IHdheSBvdXQgYW5kIHNpbXBseSBjaHVuayB0aGUgbWVzc2FnZSBhbmQgY2FsbCB0aGUgd3JpdGVcbiAgICAgIC8vIGZ1bmN0aW9uIHdoaWxlIHRoZSBidWZmZXIgZHJhaW4gaXRzZWxmIGFzeW5jaHJvbm91c2x5LiBXaXRoIGEgc21hbGxlciBjaHVuayBzaXplIHRoYW5cbiAgICAgIC8vIHRoZSBidWZmZXIsIHdlIGFyZSBtb3N0bHkgY2VydGFpbiB0aGF0IGl0IHdvcmtzLiBJbiB0aGlzIGNhc2UsIHRoZSBjaHVuayBoYXMgYmVlbiBwaWNrZWRcbiAgICAgIC8vIGFzIGhhbGYgYSBwYWdlIHNpemUgKDQwOTYvMiA9IDIwNDgpLCBtaW51cyBzb21lIGJ5dGVzIGZvciB0aGUgY29sb3IgZm9ybWF0dGluZy5cbiAgICAgIC8vIE9uIFBPU0lYIGl0IHNlZW1zIHRoZSBidWZmZXIgaXMgMiBwYWdlcyAoODE5MiksIGJ1dCBqdXN0IHRvIGJlIHN1cmUgKGNvdWxkIGJlIGRpZmZlcmVudFxuICAgICAgLy8gYnkgcGxhdGZvcm0pLlxuICAgICAgLy9cbiAgICAgIC8vIEZvciBtb3JlIGRldGFpbHMsIHNlZSBodHRwczovL25vZGVqcy5vcmcvYXBpL3Byb2Nlc3MuaHRtbCNwcm9jZXNzX2Ffbm90ZV9vbl9wcm9jZXNzX2lfb1xuICAgICAgY29uc3QgY2h1bmtTaXplID0gMjAwMDsgIC8vIFNtYWxsIGNodW5rLlxuICAgICAgbGV0IG1lc3NhZ2UgPSBlbnRyeS5tZXNzYWdlO1xuICAgICAgd2hpbGUgKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBtZXNzYWdlLnNsaWNlKDAsIGNodW5rU2l6ZSk7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnNsaWNlKGNodW5rU2l6ZSk7XG4gICAgICAgIG91dHB1dC53cml0ZShjb2xvcihjaHVuaykpO1xuICAgICAgfVxuICAgICAgb3V0cHV0LndyaXRlKCdcXG4nKTtcbiAgICB9KTtcblxuICByZXR1cm4gbG9nZ2VyO1xufVxuIl19