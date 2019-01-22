"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ts = require("typescript");
const change_1 = require("./change");
/**
 * Add Import `import { symbolName } from fileName` if the import doesn't exit
 * already. Assumes fileToEdit can be resolved and accessed.
 * @param fileToEdit (file we want to add import to)
 * @param symbolName (item to import)
 * @param fileName (path to the file)
 * @param isDefault (if true, import follows style for importing default exports)
 * @return Change
 */
function insertImport(source, fileToEdit, symbolName, fileName, isDefault = false) {
    const rootNode = source;
    const allImports = findNodes(rootNode, ts.SyntaxKind.ImportDeclaration);
    // get nodes that map to import statements from the file fileName
    const relevantImports = allImports.filter(node => {
        // StringLiteral of the ImportDeclaration is the import file (fileName in this case).
        const importFiles = node.getChildren()
            .filter(child => child.kind === ts.SyntaxKind.StringLiteral)
            .map(n => n.text);
        return importFiles.filter(file => file === fileName).length === 1;
    });
    if (relevantImports.length > 0) {
        let importsAsterisk = false;
        // imports from import file
        const imports = [];
        relevantImports.forEach(n => {
            Array.prototype.push.apply(imports, findNodes(n, ts.SyntaxKind.Identifier));
            if (findNodes(n, ts.SyntaxKind.AsteriskToken).length > 0) {
                importsAsterisk = true;
            }
        });
        // if imports * from fileName, don't add symbolName
        if (importsAsterisk) {
            return new change_1.NoopChange();
        }
        const importTextNodes = imports.filter(n => n.text === symbolName);
        // insert import if it's not there
        if (importTextNodes.length === 0) {
            const fallbackPos = findNodes(relevantImports[0], ts.SyntaxKind.CloseBraceToken)[0].getStart() ||
                findNodes(relevantImports[0], ts.SyntaxKind.FromKeyword)[0].getStart();
            return insertAfterLastOccurrence(imports, `, ${symbolName}`, fileToEdit, fallbackPos);
        }
        return new change_1.NoopChange();
    }
    // no such import declaration exists
    const useStrict = findNodes(rootNode, ts.SyntaxKind.StringLiteral)
        .filter((n) => n.text === 'use strict');
    let fallbackPos = 0;
    if (useStrict.length > 0) {
        fallbackPos = useStrict[0].end;
    }
    const open = isDefault ? '' : '{ ';
    const close = isDefault ? '' : ' }';
    // if there are no imports or 'use strict' statement, insert import at beginning of file
    const insertAtBeginning = allImports.length === 0 && useStrict.length === 0;
    const separator = insertAtBeginning ? '' : ';\n';
    const toInsert = `${separator}import ${open}${symbolName}${close}` +
        ` from '${fileName}'${insertAtBeginning ? ';\n' : ''}`;
    return insertAfterLastOccurrence(allImports, toInsert, fileToEdit, fallbackPos, ts.SyntaxKind.StringLiteral);
}
exports.insertImport = insertImport;
/**
 * Find all nodes from the AST in the subtree of node of SyntaxKind kind.
 * @param node
 * @param kind
 * @param max The maximum number of items to return.
 * @return all nodes of kind, or [] if none is found
 */
function findNodes(node, kind, max = Infinity) {
    if (!node || max == 0) {
        return [];
    }
    const arr = [];
    if (node.kind === kind) {
        arr.push(node);
        max--;
    }
    if (max > 0) {
        for (const child of node.getChildren()) {
            findNodes(child, kind, max).forEach(node => {
                if (max > 0) {
                    arr.push(node);
                }
                max--;
            });
            if (max <= 0) {
                break;
            }
        }
    }
    return arr;
}
exports.findNodes = findNodes;
/**
 * Get all the nodes from a source.
 * @param sourceFile The source file object.
 * @returns {Observable<ts.Node>} An observable of all the nodes in the source.
 */
function getSourceNodes(sourceFile) {
    const nodes = [sourceFile];
    const result = [];
    while (nodes.length > 0) {
        const node = nodes.shift();
        if (node) {
            result.push(node);
            if (node.getChildCount(sourceFile) >= 0) {
                nodes.unshift(...node.getChildren());
            }
        }
    }
    return result;
}
exports.getSourceNodes = getSourceNodes;
function findNode(node, kind, text) {
    if (node.kind === kind && node.getText() === text) {
        // throw new Error(node.getText());
        return node;
    }
    let foundNode = null;
    ts.forEachChild(node, childNode => {
        foundNode = foundNode || findNode(childNode, kind, text);
    });
    return foundNode;
}
exports.findNode = findNode;
/**
 * Helper for sorting nodes.
 * @return function to sort nodes in increasing order of position in sourceFile
 */
function nodesByPosition(first, second) {
    return first.getStart() - second.getStart();
}
/**
 * Insert `toInsert` after the last occurence of `ts.SyntaxKind[nodes[i].kind]`
 * or after the last of occurence of `syntaxKind` if the last occurence is a sub child
 * of ts.SyntaxKind[nodes[i].kind] and save the changes in file.
 *
 * @param nodes insert after the last occurence of nodes
 * @param toInsert string to insert
 * @param file file to insert changes into
 * @param fallbackPos position to insert if toInsert happens to be the first occurence
 * @param syntaxKind the ts.SyntaxKind of the subchildren to insert after
 * @return Change instance
 * @throw Error if toInsert is first occurence but fall back is not set
 */
function insertAfterLastOccurrence(nodes, toInsert, file, fallbackPos, syntaxKind) {
    // sort() has a side effect, so make a copy so that we won't overwrite the parent's object.
    let lastItem = [...nodes].sort(nodesByPosition).pop();
    if (!lastItem) {
        throw new Error();
    }
    if (syntaxKind) {
        lastItem = findNodes(lastItem, syntaxKind).sort(nodesByPosition).pop();
    }
    if (!lastItem && fallbackPos == undefined) {
        throw new Error(`tried to insert ${toInsert} as first occurence with no fallback position`);
    }
    const lastItemPosition = lastItem ? lastItem.getEnd() : fallbackPos;
    return new change_1.InsertChange(file, lastItemPosition, toInsert);
}
exports.insertAfterLastOccurrence = insertAfterLastOccurrence;
function getContentOfKeyLiteral(_source, node) {
    if (node.kind == ts.SyntaxKind.Identifier) {
        return node.text;
    }
    else if (node.kind == ts.SyntaxKind.StringLiteral) {
        return node.text;
    }
    else {
        return null;
    }
}
exports.getContentOfKeyLiteral = getContentOfKeyLiteral;
function _angularImportsFromNode(node, _sourceFile) {
    const ms = node.moduleSpecifier;
    let modulePath;
    switch (ms.kind) {
        case ts.SyntaxKind.StringLiteral:
            modulePath = ms.text;
            break;
        default:
            return {};
    }
    if (!modulePath.startsWith('@angular/')) {
        return {};
    }
    if (node.importClause) {
        if (node.importClause.name) {
            // This is of the form `import Name from 'path'`. Ignore.
            return {};
        }
        else if (node.importClause.namedBindings) {
            const nb = node.importClause.namedBindings;
            if (nb.kind == ts.SyntaxKind.NamespaceImport) {
                // This is of the form `import * as name from 'path'`. Return `name.`.
                return {
                    [nb.name.text + '.']: modulePath,
                };
            }
            else {
                // This is of the form `import {a,b,c} from 'path'`
                const namedImports = nb;
                return namedImports.elements
                    .map((is) => is.propertyName ? is.propertyName.text : is.name.text)
                    .reduce((acc, curr) => {
                    acc[curr] = modulePath;
                    return acc;
                }, {});
            }
        }
        return {};
    }
    else {
        // This is of the form `import 'path';`. Nothing to do.
        return {};
    }
}
function getDecoratorMetadata(source, identifier, module) {
    const angularImports = findNodes(source, ts.SyntaxKind.ImportDeclaration)
        .map((node) => _angularImportsFromNode(node, source))
        .reduce((acc, current) => {
        for (const key of Object.keys(current)) {
            acc[key] = current[key];
        }
        return acc;
    }, {});
    return getSourceNodes(source)
        .filter(node => {
        return node.kind == ts.SyntaxKind.Decorator
            && node.expression.kind == ts.SyntaxKind.CallExpression;
    })
        .map(node => node.expression)
        .filter(expr => {
        if (expr.expression.kind == ts.SyntaxKind.Identifier) {
            const id = expr.expression;
            return id.getFullText(source) == identifier
                && angularImports[id.getFullText(source)] === module;
        }
        else if (expr.expression.kind == ts.SyntaxKind.PropertyAccessExpression) {
            // This covers foo.NgModule when importing * as foo.
            const paExpr = expr.expression;
            // If the left expression is not an identifier, just give up at that point.
            if (paExpr.expression.kind !== ts.SyntaxKind.Identifier) {
                return false;
            }
            const id = paExpr.name.text;
            const moduleId = paExpr.expression.getText(source);
            return id === identifier && (angularImports[moduleId + '.'] === module);
        }
        return false;
    })
        .filter(expr => expr.arguments[0]
        && expr.arguments[0].kind == ts.SyntaxKind.ObjectLiteralExpression)
        .map(expr => expr.arguments[0]);
}
exports.getDecoratorMetadata = getDecoratorMetadata;
function findClassDeclarationParent(node) {
    if (ts.isClassDeclaration(node)) {
        return node;
    }
    return node.parent && findClassDeclarationParent(node.parent);
}
/**
 * Given a source file with @NgModule class(es), find the name of the first @NgModule class.
 *
 * @param source source file containing one or more @NgModule
 * @returns the name of the first @NgModule, or `undefined` if none is found
 */
function getFirstNgModuleName(source) {
    // First, find the @NgModule decorators.
    const ngModulesMetadata = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    if (ngModulesMetadata.length === 0) {
        return undefined;
    }
    // Then walk parent pointers up the AST, looking for the ClassDeclaration parent of the NgModule
    // metadata.
    const moduleClass = findClassDeclarationParent(ngModulesMetadata[0]);
    if (!moduleClass || !moduleClass.name) {
        return undefined;
    }
    // Get the class name of the module ClassDeclaration.
    return moduleClass.name.text;
}
exports.getFirstNgModuleName = getFirstNgModuleName;
function addSymbolToNgModuleMetadata(source, ngModulePath, metadataField, symbolName, importPath = null) {
    const nodes = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    let node = nodes[0]; // tslint:disable-line:no-any
    // Find the decorator declaration.
    if (!node) {
        return [];
    }
    // Get all the children property assignment of object literals.
    const matchingProperties = node.properties
        .filter(prop => prop.kind == ts.SyntaxKind.PropertyAssignment)
        // Filter out every fields that's not "metadataField". Also handles string literals
        // (but not expressions).
        .filter((prop) => {
        const name = prop.name;
        switch (name.kind) {
            case ts.SyntaxKind.Identifier:
                return name.getText(source) == metadataField;
            case ts.SyntaxKind.StringLiteral:
                return name.text == metadataField;
        }
        return false;
    });
    // Get the last node of the array literal.
    if (!matchingProperties) {
        return [];
    }
    if (matchingProperties.length == 0) {
        // We haven't found the field in the metadata declaration. Insert a new field.
        const expr = node;
        let position;
        let toInsert;
        if (expr.properties.length == 0) {
            position = expr.getEnd() - 1;
            toInsert = `  ${metadataField}: [${symbolName}]\n`;
        }
        else {
            node = expr.properties[expr.properties.length - 1];
            position = node.getEnd();
            // Get the indentation of the last element, if any.
            const text = node.getFullText(source);
            const matches = text.match(/^\r?\n\s*/);
            if (matches && matches.length > 0) {
                toInsert = `,${matches[0]}${metadataField}: [${symbolName}]`;
            }
            else {
                toInsert = `, ${metadataField}: [${symbolName}]`;
            }
        }
        if (importPath !== null) {
            return [
                new change_1.InsertChange(ngModulePath, position, toInsert),
                insertImport(source, ngModulePath, symbolName.replace(/\..*$/, ''), importPath),
            ];
        }
        else {
            return [new change_1.InsertChange(ngModulePath, position, toInsert)];
        }
    }
    const assignment = matchingProperties[0];
    // If it's not an array, nothing we can do really.
    if (assignment.initializer.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return [];
    }
    const arrLiteral = assignment.initializer;
    if (arrLiteral.elements.length == 0) {
        // Forward the property.
        node = arrLiteral;
    }
    else {
        node = arrLiteral.elements;
    }
    if (!node) {
        console.error('No app module found. Please add your new class to your component.');
        return [];
    }
    if (Array.isArray(node)) {
        const nodeArray = node;
        const symbolsArray = nodeArray.map(node => node.getText());
        if (symbolsArray.includes(symbolName)) {
            return [];
        }
        node = node[node.length - 1];
    }
    let toInsert;
    let position = node.getEnd();
    if (node.kind == ts.SyntaxKind.ObjectLiteralExpression) {
        // We haven't found the field in the metadata declaration. Insert a new
        // field.
        const expr = node;
        if (expr.properties.length == 0) {
            position = expr.getEnd() - 1;
            toInsert = `  ${symbolName}\n`;
        }
        else {
            // Get the indentation of the last element, if any.
            const text = node.getFullText(source);
            if (text.match(/^\r?\r?\n/)) {
                toInsert = `,${text.match(/^\r?\n\s*/)[0]}${symbolName}`;
            }
            else {
                toInsert = `, ${symbolName}`;
            }
        }
    }
    else if (node.kind == ts.SyntaxKind.ArrayLiteralExpression) {
        // We found the field but it's empty. Insert it just before the `]`.
        position--;
        toInsert = `${symbolName}`;
    }
    else {
        // Get the indentation of the last element, if any.
        const text = node.getFullText(source);
        if (text.match(/^\r?\n/)) {
            toInsert = `,${text.match(/^\r?\n(\r?)\s*/)[0]}${symbolName}`;
        }
        else {
            toInsert = `, ${symbolName}`;
        }
    }
    if (importPath !== null) {
        return [
            new change_1.InsertChange(ngModulePath, position, toInsert),
            insertImport(source, ngModulePath, symbolName.replace(/\..*$/, ''), importPath),
        ];
    }
    return [new change_1.InsertChange(ngModulePath, position, toInsert)];
}
exports.addSymbolToNgModuleMetadata = addSymbolToNgModuleMetadata;
/**
 * Custom function to insert a declaration (component, pipe, directive)
 * into NgModule declarations. It also imports the component.
 */
function addDeclarationToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'declarations', classifiedName, importPath);
}
exports.addDeclarationToModule = addDeclarationToModule;
/**
 * Custom function to insert an NgModule into NgModule imports. It also imports the module.
 */
function addImportToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'imports', classifiedName, importPath);
}
exports.addImportToModule = addImportToModule;
/**
 * Custom function to insert a provider into NgModule. It also imports it.
 */
function addProviderToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'providers', classifiedName, importPath);
}
exports.addProviderToModule = addProviderToModule;
/**
 * Custom function to insert an export into NgModule. It also imports it.
 */
function addExportToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'exports', classifiedName, importPath);
}
exports.addExportToModule = addExportToModule;
/**
 * Custom function to insert an export into NgModule. It also imports it.
 */
function addBootstrapToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'bootstrap', classifiedName, importPath);
}
exports.addBootstrapToModule = addBootstrapToModule;
/**
 * Custom function to insert an entryComponent into NgModule. It also imports it.
 */
function addEntryComponentToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'entryComponents', classifiedName, importPath);
}
exports.addEntryComponentToModule = addEntryComponentToModule;
/**
 * Determine if an import already exists.
 */
function isImported(source, classifiedName, importPath) {
    const allNodes = getSourceNodes(source);
    const matchingNodes = allNodes
        .filter(node => node.kind === ts.SyntaxKind.ImportDeclaration)
        .filter((imp) => imp.moduleSpecifier.kind === ts.SyntaxKind.StringLiteral)
        .filter((imp) => {
        return imp.moduleSpecifier.text === importPath;
    })
        .filter((imp) => {
        if (!imp.importClause) {
            return false;
        }
        const nodes = findNodes(imp.importClause, ts.SyntaxKind.ImportSpecifier)
            .filter(n => n.getText() === classifiedName);
        return nodes.length > 0;
    });
    return matchingNodes.length > 0;
}
exports.isImported = isImported;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LXV0aWxzLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9hc3QtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxpQ0FBaUM7QUFDakMscUNBQTREO0FBRzVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLE1BQXFCLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUM3RCxRQUFnQixFQUFFLFNBQVMsR0FBRyxLQUFLO0lBQzlELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQztJQUN4QixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUV4RSxpRUFBaUU7SUFDakUsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMvQyxxRkFBcUY7UUFDckYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRTthQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO2FBQzNELEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLENBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFMUMsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7SUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQzlCLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztRQUM1QiwyQkFBMkI7UUFDM0IsTUFBTSxPQUFPLEdBQWMsRUFBRSxDQUFDO1FBQzlCLGVB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bmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBDaGFuZ2UsIEluc2VydENoYW5nZSwgTm9vcENoYW5nZSB9IGZyb20gJy4vY2hhbmdlJztcblxuXG4vKipcbiAqIEFkZCBJbXBvcnQgYGltcG9ydCB7IHN5bWJvbE5hbWUgfSBmcm9tIGZpbGVOYW1lYCBpZiB0aGUgaW1wb3J0IGRvZXNuJ3QgZXhpdFxuICogYWxyZWFkeS4gQXNzdW1lcyBmaWxlVG9FZGl0IGNhbiBiZSByZXNvbHZlZCBhbmQgYWNjZXNzZWQuXG4gKiBAcGFyYW0gZmlsZVRvRWRpdCAoZmlsZSB3ZSB3YW50IHRvIGFkZCBpbXBvcnQgdG8pXG4gKiBAcGFyYW0gc3ltYm9sTmFtZSAoaXRlbSB0byBpbXBvcnQpXG4gKiBAcGFyYW0gZmlsZU5hbWUgKHBhdGggdG8gdGhlIGZpbGUpXG4gKiBAcGFyYW0gaXNEZWZhdWx0IChpZiB0cnVlLCBpbXBvcnQgZm9sbG93cyBzdHlsZSBmb3IgaW1wb3J0aW5nIGRlZmF1bHQgZXhwb3J0cylcbiAqIEByZXR1cm4gQ2hhbmdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRJbXBvcnQoc291cmNlOiB0cy5Tb3VyY2VGaWxlLCBmaWxlVG9FZGl0OiBzdHJpbmcsIHN5bWJvbE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWU6IHN0cmluZywgaXNEZWZhdWx0ID0gZmFsc2UpOiBDaGFuZ2Uge1xuICBjb25zdCByb290Tm9kZSA9IHNvdXJjZTtcbiAgY29uc3QgYWxsSW1wb3J0cyA9IGZpbmROb2Rlcyhyb290Tm9kZSwgdHMuU3ludGF4S2luZC5JbXBvcnREZWNsYXJhdGlvbik7XG5cbiAgLy8gZ2V0IG5vZGVzIHRoYXQgbWFwIHRvIGltcG9ydCBzdGF0ZW1lbnRzIGZyb20gdGhlIGZpbGUgZmlsZU5hbWVcbiAgY29uc3QgcmVsZXZhbnRJbXBvcnRzID0gYWxsSW1wb3J0cy5maWx0ZXIobm9kZSA9PiB7XG4gICAgLy8gU3RyaW5nTGl0ZXJhbCBvZiB0aGUgSW1wb3J0RGVjbGFyYXRpb24gaXMgdGhlIGltcG9ydCBmaWxlIChmaWxlTmFtZSBpbiB0aGlzIGNhc2UpLlxuICAgIGNvbnN0IGltcG9ydEZpbGVzID0gbm9kZS5nZXRDaGlsZHJlbigpXG4gICAgICAuZmlsdGVyKGNoaWxkID0+IGNoaWxkLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbClcbiAgICAgIC5tYXAobiA9PiAobiBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0KTtcblxuICAgIHJldHVybiBpbXBvcnRGaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlID09PSBmaWxlTmFtZSkubGVuZ3RoID09PSAxO1xuICB9KTtcblxuICBpZiAocmVsZXZhbnRJbXBvcnRzLmxlbmd0aCA+IDApIHtcbiAgICBsZXQgaW1wb3J0c0FzdGVyaXNrID0gZmFsc2U7XG4gICAgLy8gaW1wb3J0cyBmcm9tIGltcG9ydCBmaWxlXG4gICAgY29uc3QgaW1wb3J0czogdHMuTm9kZVtdID0gW107XG4gICAgcmVsZXZhbnRJbXBvcnRzLmZvckVhY2gobiA9PiB7XG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShpbXBvcnRzLCBmaW5kTm9kZXMobiwgdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSk7XG4gICAgICBpZiAoZmluZE5vZGVzKG4sIHRzLlN5bnRheEtpbmQuQXN0ZXJpc2tUb2tlbikubGVuZ3RoID4gMCkge1xuICAgICAgICBpbXBvcnRzQXN0ZXJpc2sgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaWYgaW1wb3J0cyAqIGZyb20gZmlsZU5hbWUsIGRvbid0IGFkZCBzeW1ib2xOYW1lXG4gICAgaWYgKGltcG9ydHNBc3Rlcmlzaykge1xuICAgICAgcmV0dXJuIG5ldyBOb29wQ2hhbmdlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0VGV4dE5vZGVzID0gaW1wb3J0cy5maWx0ZXIobiA9PiAobiBhcyB0cy5JZGVudGlmaWVyKS50ZXh0ID09PSBzeW1ib2xOYW1lKTtcblxuICAgIC8vIGluc2VydCBpbXBvcnQgaWYgaXQncyBub3QgdGhlcmVcbiAgICBpZiAoaW1wb3J0VGV4dE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgZmFsbGJhY2tQb3MgPVxuICAgICAgICBmaW5kTm9kZXMocmVsZXZhbnRJbXBvcnRzWzBdLCB0cy5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbilbMF0uZ2V0U3RhcnQoKSB8fFxuICAgICAgICBmaW5kTm9kZXMocmVsZXZhbnRJbXBvcnRzWzBdLCB0cy5TeW50YXhLaW5kLkZyb21LZXl3b3JkKVswXS5nZXRTdGFydCgpO1xuXG4gICAgICByZXR1cm4gaW5zZXJ0QWZ0ZXJMYXN0T2NjdXJyZW5jZShpbXBvcnRzLCBgLCAke3N5bWJvbE5hbWV9YCwgZmlsZVRvRWRpdCwgZmFsbGJhY2tQb3MpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTm9vcENoYW5nZSgpO1xuICB9XG5cbiAgLy8gbm8gc3VjaCBpbXBvcnQgZGVjbGFyYXRpb24gZXhpc3RzXG4gIGNvbnN0IHVzZVN0cmljdCA9IGZpbmROb2Rlcyhyb290Tm9kZSwgdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsKVxuICAgIC5maWx0ZXIoKG46IHRzLlN0cmluZ0xpdGVyYWwpID0+IG4udGV4dCA9PT0gJ3VzZSBzdHJpY3QnKTtcbiAgbGV0IGZhbGxiYWNrUG9zID0gMDtcbiAgaWYgKHVzZVN0cmljdC5sZW5ndGggPiAwKSB7XG4gICAgZmFsbGJhY2tQb3MgPSB1c2VTdHJpY3RbMF0uZW5kO1xuICB9XG4gIGNvbnN0IG9wZW4gPSBpc0RlZmF1bHQgPyAnJyA6ICd7ICc7XG4gIGNvbnN0IGNsb3NlID0gaXNEZWZhdWx0ID8gJycgOiAnIH0nO1xuICAvLyBpZiB0aGVyZSBhcmUgbm8gaW1wb3J0cyBvciAndXNlIHN0cmljdCcgc3RhdGVtZW50LCBpbnNlcnQgaW1wb3J0IGF0IGJlZ2lubmluZyBvZiBmaWxlXG4gIGNvbnN0IGluc2VydEF0QmVnaW5uaW5nID0gYWxsSW1wb3J0cy5sZW5ndGggPT09IDAgJiYgdXNlU3RyaWN0Lmxlbmd0aCA9PT0gMDtcbiAgY29uc3Qgc2VwYXJhdG9yID0gaW5zZXJ0QXRCZWdpbm5pbmcgPyAnJyA6ICc7XFxuJztcbiAgY29uc3QgdG9JbnNlcnQgPSBgJHtzZXBhcmF0b3J9aW1wb3J0ICR7b3Blbn0ke3N5bWJvbE5hbWV9JHtjbG9zZX1gICtcbiAgICBgIGZyb20gJyR7ZmlsZU5hbWV9JyR7aW5zZXJ0QXRCZWdpbm5pbmcgPyAnO1xcbicgOiAnJ31gO1xuXG4gIHJldHVybiBpbnNlcnRBZnRlckxhc3RPY2N1cnJlbmNlKFxuICAgIGFsbEltcG9ydHMsXG4gICAgdG9JbnNlcnQsXG4gICAgZmlsZVRvRWRpdCxcbiAgICBmYWxsYmFja1BvcyxcbiAgICB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwsXG4gICk7XG59XG5cblxuLyoqXG4gKiBGaW5kIGFsbCBub2RlcyBmcm9tIHRoZSBBU1QgaW4gdGhlIHN1YnRyZWUgb2Ygbm9kZSBvZiBTeW50YXhLaW5kIGtpbmQuXG4gKiBAcGFyYW0gbm9kZVxuICogQHBhcmFtIGtpbmRcbiAqIEBwYXJhbSBtYXggVGhlIG1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIHRvIHJldHVybi5cbiAqIEByZXR1cm4gYWxsIG5vZGVzIG9mIGtpbmQsIG9yIFtdIGlmIG5vbmUgaXMgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmROb2Rlcyhub2RlOiB0cy5Ob2RlLCBraW5kOiB0cy5TeW50YXhLaW5kLCBtYXggPSBJbmZpbml0eSk6IHRzLk5vZGVbXSB7XG4gIGlmICghbm9kZSB8fCBtYXggPT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IGFycjogdHMuTm9kZVtdID0gW107XG4gIGlmIChub2RlLmtpbmQgPT09IGtpbmQpIHtcbiAgICBhcnIucHVzaChub2RlKTtcbiAgICBtYXgtLTtcbiAgfVxuICBpZiAobWF4ID4gMCkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5nZXRDaGlsZHJlbigpKSB7XG4gICAgICBmaW5kTm9kZXMoY2hpbGQsIGtpbmQsIG1heCkuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgaWYgKG1heCA+IDApIHtcbiAgICAgICAgICBhcnIucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBtYXgtLTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAobWF4IDw9IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFycjtcbn1cblxuXG4vKipcbiAqIEdldCBhbGwgdGhlIG5vZGVzIGZyb20gYSBzb3VyY2UuXG4gKiBAcGFyYW0gc291cmNlRmlsZSBUaGUgc291cmNlIGZpbGUgb2JqZWN0LlxuICogQHJldHVybnMge09ic2VydmFibGU8dHMuTm9kZT59IEFuIG9ic2VydmFibGUgb2YgYWxsIHRoZSBub2RlcyBpbiB0aGUgc291cmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U291cmNlTm9kZXMoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IHRzLk5vZGVbXSB7XG4gIGNvbnN0IG5vZGVzOiB0cy5Ob2RlW10gPSBbc291cmNlRmlsZV07XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gIHdoaWxlIChub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzLnNoaWZ0KCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XG4gICAgICBpZiAobm9kZS5nZXRDaGlsZENvdW50KHNvdXJjZUZpbGUpID49IDApIHtcbiAgICAgICAgbm9kZXMudW5zaGlmdCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTm9kZShub2RlOiB0cy5Ob2RlLCBraW5kOiB0cy5TeW50YXhLaW5kLCB0ZXh0OiBzdHJpbmcpOiB0cy5Ob2RlIHwgbnVsbCB7XG4gIGlmIChub2RlLmtpbmQgPT09IGtpbmQgJiYgbm9kZS5nZXRUZXh0KCkgPT09IHRleHQpIHtcbiAgICAvLyB0aHJvdyBuZXcgRXJyb3Iobm9kZS5nZXRUZXh0KCkpO1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgbGV0IGZvdW5kTm9kZTogdHMuTm9kZSB8IG51bGwgPSBudWxsO1xuICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgY2hpbGROb2RlID0+IHtcbiAgICBmb3VuZE5vZGUgPSBmb3VuZE5vZGUgfHwgZmluZE5vZGUoY2hpbGROb2RlLCBraW5kLCB0ZXh0KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGZvdW5kTm9kZTtcbn1cblxuXG4vKipcbiAqIEhlbHBlciBmb3Igc29ydGluZyBub2Rlcy5cbiAqIEByZXR1cm4gZnVuY3Rpb24gdG8gc29ydCBub2RlcyBpbiBpbmNyZWFzaW5nIG9yZGVyIG9mIHBvc2l0aW9uIGluIHNvdXJjZUZpbGVcbiAqL1xuZnVuY3Rpb24gbm9kZXNCeVBvc2l0aW9uKGZpcnN0OiB0cy5Ob2RlLCBzZWNvbmQ6IHRzLk5vZGUpOiBudW1iZXIge1xuICByZXR1cm4gZmlyc3QuZ2V0U3RhcnQoKSAtIHNlY29uZC5nZXRTdGFydCgpO1xufVxuXG5cbi8qKlxuICogSW5zZXJ0IGB0b0luc2VydGAgYWZ0ZXIgdGhlIGxhc3Qgb2NjdXJlbmNlIG9mIGB0cy5TeW50YXhLaW5kW25vZGVzW2ldLmtpbmRdYFxuICogb3IgYWZ0ZXIgdGhlIGxhc3Qgb2Ygb2NjdXJlbmNlIG9mIGBzeW50YXhLaW5kYCBpZiB0aGUgbGFzdCBvY2N1cmVuY2UgaXMgYSBzdWIgY2hpbGRcbiAqIG9mIHRzLlN5bnRheEtpbmRbbm9kZXNbaV0ua2luZF0gYW5kIHNhdmUgdGhlIGNoYW5nZXMgaW4gZmlsZS5cbiAqXG4gKiBAcGFyYW0gbm9kZXMgaW5zZXJ0IGFmdGVyIHRoZSBsYXN0IG9jY3VyZW5jZSBvZiBub2Rlc1xuICogQHBhcmFtIHRvSW5zZXJ0IHN0cmluZyB0byBpbnNlcnRcbiAqIEBwYXJhbSBmaWxlIGZpbGUgdG8gaW5zZXJ0IGNoYW5nZXMgaW50b1xuICogQHBhcmFtIGZhbGxiYWNrUG9zIHBvc2l0aW9uIHRvIGluc2VydCBpZiB0b0luc2VydCBoYXBwZW5zIHRvIGJlIHRoZSBmaXJzdCBvY2N1cmVuY2VcbiAqIEBwYXJhbSBzeW50YXhLaW5kIHRoZSB0cy5TeW50YXhLaW5kIG9mIHRoZSBzdWJjaGlsZHJlbiB0byBpbnNlcnQgYWZ0ZXJcbiAqIEByZXR1cm4gQ2hhbmdlIGluc3RhbmNlXG4gKiBAdGhyb3cgRXJyb3IgaWYgdG9JbnNlcnQgaXMgZmlyc3Qgb2NjdXJlbmNlIGJ1dCBmYWxsIGJhY2sgaXMgbm90IHNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0QWZ0ZXJMYXN0T2NjdXJyZW5jZShub2RlczogdHMuTm9kZVtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9JbnNlcnQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrUG9zOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW50YXhLaW5kPzogdHMuU3ludGF4S2luZCk6IENoYW5nZSB7XG4gIC8vIHNvcnQoKSBoYXMgYSBzaWRlIGVmZmVjdCwgc28gbWFrZSBhIGNvcHkgc28gdGhhdCB3ZSB3b24ndCBvdmVyd3JpdGUgdGhlIHBhcmVudCdzIG9iamVjdC5cbiAgbGV0IGxhc3RJdGVtID0gWy4uLm5vZGVzXS5zb3J0KG5vZGVzQnlQb3NpdGlvbikucG9wKCk7XG4gIGlmICghbGFzdEl0ZW0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfVxuICBpZiAoc3ludGF4S2luZCkge1xuICAgIGxhc3RJdGVtID0gZmluZE5vZGVzKGxhc3RJdGVtLCBzeW50YXhLaW5kKS5zb3J0KG5vZGVzQnlQb3NpdGlvbikucG9wKCk7XG4gIH1cbiAgaWYgKCFsYXN0SXRlbSAmJiBmYWxsYmFja1BvcyA9PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHRyaWVkIHRvIGluc2VydCAke3RvSW5zZXJ0fSBhcyBmaXJzdCBvY2N1cmVuY2Ugd2l0aCBubyBmYWxsYmFjayBwb3NpdGlvbmApO1xuICB9XG4gIGNvbnN0IGxhc3RJdGVtUG9zaXRpb246IG51bWJlciA9IGxhc3RJdGVtID8gbGFzdEl0ZW0uZ2V0RW5kKCkgOiBmYWxsYmFja1BvcztcblxuICByZXR1cm4gbmV3IEluc2VydENoYW5nZShmaWxlLCBsYXN0SXRlbVBvc2l0aW9uLCB0b0luc2VydCk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRlbnRPZktleUxpdGVyYWwoX3NvdXJjZTogdHMuU291cmNlRmlsZSwgbm9kZTogdHMuTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAobm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgIHJldHVybiAobm9kZSBhcyB0cy5JZGVudGlmaWVyKS50ZXh0O1xuICB9IGVsc2UgaWYgKG5vZGUua2luZCA9PSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpIHtcbiAgICByZXR1cm4gKG5vZGUgYXMgdHMuU3RyaW5nTGl0ZXJhbCkudGV4dDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIF9hbmd1bGFySW1wb3J0c0Zyb21Ob2RlKG5vZGU6IHRzLkltcG9ydERlY2xhcmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBtcyA9IG5vZGUubW9kdWxlU3BlY2lmaWVyO1xuICBsZXQgbW9kdWxlUGF0aDogc3RyaW5nO1xuICBzd2l0Y2ggKG1zLmtpbmQpIHtcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbDpcbiAgICAgIG1vZHVsZVBhdGggPSAobXMgYXMgdHMuU3RyaW5nTGl0ZXJhbCkudGV4dDtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ge307XG4gIH1cblxuICBpZiAoIW1vZHVsZVBhdGguc3RhcnRzV2l0aCgnQGFuZ3VsYXIvJykpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICBpZiAobm9kZS5pbXBvcnRDbGF1c2UpIHtcbiAgICBpZiAobm9kZS5pbXBvcnRDbGF1c2UubmFtZSkge1xuICAgICAgLy8gVGhpcyBpcyBvZiB0aGUgZm9ybSBgaW1wb3J0IE5hbWUgZnJvbSAncGF0aCdgLiBJZ25vcmUuXG4gICAgICByZXR1cm4ge307XG4gICAgfSBlbHNlIGlmIChub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzKSB7XG4gICAgICBjb25zdCBuYiA9IG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3M7XG4gICAgICBpZiAobmIua2luZCA9PSB0cy5TeW50YXhLaW5kLk5hbWVzcGFjZUltcG9ydCkge1xuICAgICAgICAvLyBUaGlzIGlzIG9mIHRoZSBmb3JtIGBpbXBvcnQgKiBhcyBuYW1lIGZyb20gJ3BhdGgnYC4gUmV0dXJuIGBuYW1lLmAuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgWyhuYiBhcyB0cy5OYW1lc3BhY2VJbXBvcnQpLm5hbWUudGV4dCArICcuJ106IG1vZHVsZVBhdGgsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIG9mIHRoZSBmb3JtIGBpbXBvcnQge2EsYixjfSBmcm9tICdwYXRoJ2BcbiAgICAgICAgY29uc3QgbmFtZWRJbXBvcnRzID0gbmIgYXMgdHMuTmFtZWRJbXBvcnRzO1xuXG4gICAgICAgIHJldHVybiBuYW1lZEltcG9ydHMuZWxlbWVudHNcbiAgICAgICAgICAubWFwKChpczogdHMuSW1wb3J0U3BlY2lmaWVyKSA9PiBpcy5wcm9wZXJ0eU5hbWUgPyBpcy5wcm9wZXJ0eU5hbWUudGV4dCA6IGlzLm5hbWUudGV4dClcbiAgICAgICAgICAucmVkdWNlKChhY2M6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSwgY3Vycjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBhY2NbY3Vycl0gPSBtb2R1bGVQYXRoO1xuXG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgIH0sIHt9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBpcyBvZiB0aGUgZm9ybSBgaW1wb3J0ICdwYXRoJztgLiBOb3RoaW5nIHRvIGRvLlxuICAgIHJldHVybiB7fTtcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNvcmF0b3JNZXRhZGF0YShzb3VyY2U6IHRzLlNvdXJjZUZpbGUsIGlkZW50aWZpZXI6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGU6IHN0cmluZyk6IHRzLk5vZGVbXSB7XG4gIGNvbnN0IGFuZ3VsYXJJbXBvcnRzOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ31cbiAgICA9IGZpbmROb2Rlcyhzb3VyY2UsIHRzLlN5bnRheEtpbmQuSW1wb3J0RGVjbGFyYXRpb24pXG4gICAgLm1hcCgobm9kZTogdHMuSW1wb3J0RGVjbGFyYXRpb24pID0+IF9hbmd1bGFySW1wb3J0c0Zyb21Ob2RlKG5vZGUsIHNvdXJjZSkpXG4gICAgLnJlZHVjZSgoYWNjOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30sIGN1cnJlbnQ6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSkgPT4ge1xuICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY3VycmVudCkpIHtcbiAgICAgICAgYWNjW2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuXG4gIHJldHVybiBnZXRTb3VyY2VOb2Rlcyhzb3VyY2UpXG4gICAgLmZpbHRlcihub2RlID0+IHtcbiAgICAgIHJldHVybiBub2RlLmtpbmQgPT0gdHMuU3ludGF4S2luZC5EZWNvcmF0b3JcbiAgICAgICAgJiYgKG5vZGUgYXMgdHMuRGVjb3JhdG9yKS5leHByZXNzaW9uLmtpbmQgPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbjtcbiAgICB9KVxuICAgIC5tYXAobm9kZSA9PiAobm9kZSBhcyB0cy5EZWNvcmF0b3IpLmV4cHJlc3Npb24gYXMgdHMuQ2FsbEV4cHJlc3Npb24pXG4gICAgLmZpbHRlcihleHByID0+IHtcbiAgICAgIGlmIChleHByLmV4cHJlc3Npb24ua2luZCA9PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIpIHtcbiAgICAgICAgY29uc3QgaWQgPSBleHByLmV4cHJlc3Npb24gYXMgdHMuSWRlbnRpZmllcjtcblxuICAgICAgICByZXR1cm4gaWQuZ2V0RnVsbFRleHQoc291cmNlKSA9PSBpZGVudGlmaWVyXG4gICAgICAgICAgJiYgYW5ndWxhckltcG9ydHNbaWQuZ2V0RnVsbFRleHQoc291cmNlKV0gPT09IG1vZHVsZTtcbiAgICAgIH0gZWxzZSBpZiAoZXhwci5leHByZXNzaW9uLmtpbmQgPT0gdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgICAgICAgLy8gVGhpcyBjb3ZlcnMgZm9vLk5nTW9kdWxlIHdoZW4gaW1wb3J0aW5nICogYXMgZm9vLlxuICAgICAgICBjb25zdCBwYUV4cHIgPSBleHByLmV4cHJlc3Npb24gYXMgdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uO1xuICAgICAgICAvLyBJZiB0aGUgbGVmdCBleHByZXNzaW9uIGlzIG5vdCBhbiBpZGVudGlmaWVyLCBqdXN0IGdpdmUgdXAgYXQgdGhhdCBwb2ludC5cbiAgICAgICAgaWYgKHBhRXhwci5leHByZXNzaW9uLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlkID0gcGFFeHByLm5hbWUudGV4dDtcbiAgICAgICAgY29uc3QgbW9kdWxlSWQgPSAocGFFeHByLmV4cHJlc3Npb24gYXMgdHMuSWRlbnRpZmllcikuZ2V0VGV4dChzb3VyY2UpO1xuXG4gICAgICAgIHJldHVybiBpZCA9PT0gaWRlbnRpZmllciAmJiAoYW5ndWxhckltcG9ydHNbbW9kdWxlSWQgKyAnLiddID09PSBtb2R1bGUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSlcbiAgICAuZmlsdGVyKGV4cHIgPT4gZXhwci5hcmd1bWVudHNbMF1cbiAgICAgICAgICAgICAgICAgJiYgZXhwci5hcmd1bWVudHNbMF0ua2luZCA9PSB0cy5TeW50YXhLaW5kLk9iamVjdExpdGVyYWxFeHByZXNzaW9uKVxuICAgIC5tYXAoZXhwciA9PiBleHByLmFyZ3VtZW50c1swXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbik7XG59XG5cbmZ1bmN0aW9uIGZpbmRDbGFzc0RlY2xhcmF0aW9uUGFyZW50KG5vZGU6IHRzLk5vZGUpOiB0cy5DbGFzc0RlY2xhcmF0aW9ufHVuZGVmaW5lZCB7XG4gIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHJldHVybiBub2RlLnBhcmVudCAmJiBmaW5kQ2xhc3NEZWNsYXJhdGlvblBhcmVudChub2RlLnBhcmVudCk7XG59XG5cbi8qKlxuICogR2l2ZW4gYSBzb3VyY2UgZmlsZSB3aXRoIEBOZ01vZHVsZSBjbGFzcyhlcyksIGZpbmQgdGhlIG5hbWUgb2YgdGhlIGZpcnN0IEBOZ01vZHVsZSBjbGFzcy5cbiAqXG4gKiBAcGFyYW0gc291cmNlIHNvdXJjZSBmaWxlIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgQE5nTW9kdWxlXG4gKiBAcmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgZmlyc3QgQE5nTW9kdWxlLCBvciBgdW5kZWZpbmVkYCBpZiBub25lIGlzIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaXJzdE5nTW9kdWxlTmFtZShzb3VyY2U6IHRzLlNvdXJjZUZpbGUpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgLy8gRmlyc3QsIGZpbmQgdGhlIEBOZ01vZHVsZSBkZWNvcmF0b3JzLlxuICBjb25zdCBuZ01vZHVsZXNNZXRhZGF0YSA9IGdldERlY29yYXRvck1ldGFkYXRhKHNvdXJjZSwgJ05nTW9kdWxlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgaWYgKG5nTW9kdWxlc01ldGFkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBUaGVuIHdhbGsgcGFyZW50IHBvaW50ZXJzIHVwIHRoZSBBU1QsIGxvb2tpbmcgZm9yIHRoZSBDbGFzc0RlY2xhcmF0aW9uIHBhcmVudCBvZiB0aGUgTmdNb2R1bGVcbiAgLy8gbWV0YWRhdGEuXG4gIGNvbnN0IG1vZHVsZUNsYXNzID0gZmluZENsYXNzRGVjbGFyYXRpb25QYXJlbnQobmdNb2R1bGVzTWV0YWRhdGFbMF0pO1xuICBpZiAoIW1vZHVsZUNsYXNzIHx8ICFtb2R1bGVDbGFzcy5uYW1lKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIEdldCB0aGUgY2xhc3MgbmFtZSBvZiB0aGUgbW9kdWxlIENsYXNzRGVjbGFyYXRpb24uXG4gIHJldHVybiBtb2R1bGVDbGFzcy5uYW1lLnRleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTeW1ib2xUb05nTW9kdWxlTWV0YWRhdGEoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgbmdNb2R1bGVQYXRoOiBzdHJpbmcsXG4gIG1ldGFkYXRhRmllbGQ6IHN0cmluZyxcbiAgc3ltYm9sTmFtZTogc3RyaW5nLFxuICBpbXBvcnRQYXRoOiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbik6IENoYW5nZVtdIHtcbiAgY29uc3Qgbm9kZXMgPSBnZXREZWNvcmF0b3JNZXRhZGF0YShzb3VyY2UsICdOZ01vZHVsZScsICdAYW5ndWxhci9jb3JlJyk7XG4gIGxldCBub2RlOiBhbnkgPSBub2Rlc1swXTsgIC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tYW55XG5cbiAgLy8gRmluZCB0aGUgZGVjb3JhdG9yIGRlY2xhcmF0aW9uLlxuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBHZXQgYWxsIHRoZSBjaGlsZHJlbiBwcm9wZXJ0eSBhc3NpZ25tZW50IG9mIG9iamVjdCBsaXRlcmFscy5cbiAgY29uc3QgbWF0Y2hpbmdQcm9wZXJ0aWVzOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudFtdID1cbiAgICAobm9kZSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikucHJvcGVydGllc1xuICAgIC5maWx0ZXIocHJvcCA9PiBwcm9wLmtpbmQgPT0gdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFzc2lnbm1lbnQpXG4gICAgLy8gRmlsdGVyIG91dCBldmVyeSBmaWVsZHMgdGhhdCdzIG5vdCBcIm1ldGFkYXRhRmllbGRcIi4gQWxzbyBoYW5kbGVzIHN0cmluZyBsaXRlcmFsc1xuICAgIC8vIChidXQgbm90IGV4cHJlc3Npb25zKS5cbiAgICAuZmlsdGVyKChwcm9wOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBwcm9wLm5hbWU7XG4gICAgICBzd2l0Y2ggKG5hbWUua2luZCkge1xuICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcjpcbiAgICAgICAgICByZXR1cm4gKG5hbWUgYXMgdHMuSWRlbnRpZmllcikuZ2V0VGV4dChzb3VyY2UpID09IG1ldGFkYXRhRmllbGQ7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsOlxuICAgICAgICAgIHJldHVybiAobmFtZSBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0ID09IG1ldGFkYXRhRmllbGQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAvLyBHZXQgdGhlIGxhc3Qgbm9kZSBvZiB0aGUgYXJyYXkgbGl0ZXJhbC5cbiAgaWYgKCFtYXRjaGluZ1Byb3BlcnRpZXMpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgaWYgKG1hdGNoaW5nUHJvcGVydGllcy5sZW5ndGggPT0gMCkge1xuICAgIC8vIFdlIGhhdmVuJ3QgZm91bmQgdGhlIGZpZWxkIGluIHRoZSBtZXRhZGF0YSBkZWNsYXJhdGlvbi4gSW5zZXJ0IGEgbmV3IGZpZWxkLlxuICAgIGNvbnN0IGV4cHIgPSBub2RlIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuICAgIGxldCBwb3NpdGlvbjogbnVtYmVyO1xuICAgIGxldCB0b0luc2VydDogc3RyaW5nO1xuICAgIGlmIChleHByLnByb3BlcnRpZXMubGVuZ3RoID09IDApIHtcbiAgICAgIHBvc2l0aW9uID0gZXhwci5nZXRFbmQoKSAtIDE7XG4gICAgICB0b0luc2VydCA9IGAgICR7bWV0YWRhdGFGaWVsZH06IFske3N5bWJvbE5hbWV9XVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSBleHByLnByb3BlcnRpZXNbZXhwci5wcm9wZXJ0aWVzLmxlbmd0aCAtIDFdO1xuICAgICAgcG9zaXRpb24gPSBub2RlLmdldEVuZCgpO1xuICAgICAgLy8gR2V0IHRoZSBpbmRlbnRhdGlvbiBvZiB0aGUgbGFzdCBlbGVtZW50LCBpZiBhbnkuXG4gICAgICBjb25zdCB0ZXh0ID0gbm9kZS5nZXRGdWxsVGV4dChzb3VyY2UpO1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHRleHQubWF0Y2goL15cXHI/XFxuXFxzKi8pO1xuICAgICAgaWYgKG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRvSW5zZXJ0ID0gYCwke21hdGNoZXNbMF19JHttZXRhZGF0YUZpZWxkfTogWyR7c3ltYm9sTmFtZX1dYDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvSW5zZXJ0ID0gYCwgJHttZXRhZGF0YUZpZWxkfTogWyR7c3ltYm9sTmFtZX1dYDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGltcG9ydFBhdGggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIG5ldyBJbnNlcnRDaGFuZ2UobmdNb2R1bGVQYXRoLCBwb3NpdGlvbiwgdG9JbnNlcnQpLFxuICAgICAgICBpbnNlcnRJbXBvcnQoc291cmNlLCBuZ01vZHVsZVBhdGgsIHN5bWJvbE5hbWUucmVwbGFjZSgvXFwuLiokLywgJycpLCBpbXBvcnRQYXRoKSxcbiAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbbmV3IEluc2VydENoYW5nZShuZ01vZHVsZVBhdGgsIHBvc2l0aW9uLCB0b0luc2VydCldO1xuICAgIH1cbiAgfVxuICBjb25zdCBhc3NpZ25tZW50ID0gbWF0Y2hpbmdQcm9wZXJ0aWVzWzBdIGFzIHRzLlByb3BlcnR5QXNzaWdubWVudDtcblxuICAvLyBJZiBpdCdzIG5vdCBhbiBhcnJheSwgbm90aGluZyB3ZSBjYW4gZG8gcmVhbGx5LlxuICBpZiAoYXNzaWdubWVudC5pbml0aWFsaXplci5raW5kICE9PSB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBhcnJMaXRlcmFsID0gYXNzaWdubWVudC5pbml0aWFsaXplciBhcyB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uO1xuICBpZiAoYXJyTGl0ZXJhbC5lbGVtZW50cy5sZW5ndGggPT0gMCkge1xuICAgIC8vIEZvcndhcmQgdGhlIHByb3BlcnR5LlxuICAgIG5vZGUgPSBhcnJMaXRlcmFsO1xuICB9IGVsc2Uge1xuICAgIG5vZGUgPSBhcnJMaXRlcmFsLmVsZW1lbnRzO1xuICB9XG5cbiAgaWYgKCFub2RlKSB7XG4gICAgY29uc29sZS5lcnJvcignTm8gYXBwIG1vZHVsZSBmb3VuZC4gUGxlYXNlIGFkZCB5b3VyIG5ldyBjbGFzcyB0byB5b3VyIGNvbXBvbmVudC4nKTtcblxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSB7XG4gICAgY29uc3Qgbm9kZUFycmF5ID0gbm9kZSBhcyB7fSBhcyBBcnJheTx0cy5Ob2RlPjtcbiAgICBjb25zdCBzeW1ib2xzQXJyYXkgPSBub2RlQXJyYXkubWFwKG5vZGUgPT4gbm9kZS5nZXRUZXh0KCkpO1xuICAgIGlmIChzeW1ib2xzQXJyYXkuaW5jbHVkZXMoc3ltYm9sTmFtZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBub2RlID0gbm9kZVtub2RlLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgbGV0IHRvSW5zZXJ0OiBzdHJpbmc7XG4gIGxldCBwb3NpdGlvbiA9IG5vZGUuZ2V0RW5kKCk7XG4gIGlmIChub2RlLmtpbmQgPT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIC8vIFdlIGhhdmVuJ3QgZm91bmQgdGhlIGZpZWxkIGluIHRoZSBtZXRhZGF0YSBkZWNsYXJhdGlvbi4gSW5zZXJ0IGEgbmV3XG4gICAgLy8gZmllbGQuXG4gICAgY29uc3QgZXhwciA9IG5vZGUgYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG4gICAgaWYgKGV4cHIucHJvcGVydGllcy5sZW5ndGggPT0gMCkge1xuICAgICAgcG9zaXRpb24gPSBleHByLmdldEVuZCgpIC0gMTtcbiAgICAgIHRvSW5zZXJ0ID0gYCAgJHtzeW1ib2xOYW1lfVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEdldCB0aGUgaW5kZW50YXRpb24gb2YgdGhlIGxhc3QgZWxlbWVudCwgaWYgYW55LlxuICAgICAgY29uc3QgdGV4dCA9IG5vZGUuZ2V0RnVsbFRleHQoc291cmNlKTtcbiAgICAgIGlmICh0ZXh0Lm1hdGNoKC9eXFxyP1xccj9cXG4vKSkge1xuICAgICAgICB0b0luc2VydCA9IGAsJHt0ZXh0Lm1hdGNoKC9eXFxyP1xcblxccyovKVswXX0ke3N5bWJvbE5hbWV9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvSW5zZXJ0ID0gYCwgJHtzeW1ib2xOYW1lfWA7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKG5vZGUua2luZCA9PSB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pIHtcbiAgICAvLyBXZSBmb3VuZCB0aGUgZmllbGQgYnV0IGl0J3MgZW1wdHkuIEluc2VydCBpdCBqdXN0IGJlZm9yZSB0aGUgYF1gLlxuICAgIHBvc2l0aW9uLS07XG4gICAgdG9JbnNlcnQgPSBgJHtzeW1ib2xOYW1lfWA7XG4gIH0gZWxzZSB7XG4gICAgLy8gR2V0IHRoZSBpbmRlbnRhdGlvbiBvZiB0aGUgbGFzdCBlbGVtZW50LCBpZiBhbnkuXG4gICAgY29uc3QgdGV4dCA9IG5vZGUuZ2V0RnVsbFRleHQoc291cmNlKTtcbiAgICBpZiAodGV4dC5tYXRjaCgvXlxccj9cXG4vKSkge1xuICAgICAgdG9JbnNlcnQgPSBgLCR7dGV4dC5tYXRjaCgvXlxccj9cXG4oXFxyPylcXHMqLylbMF19JHtzeW1ib2xOYW1lfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvSW5zZXJ0ID0gYCwgJHtzeW1ib2xOYW1lfWA7XG4gICAgfVxuICB9XG4gIGlmIChpbXBvcnRQYXRoICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBJbnNlcnRDaGFuZ2UobmdNb2R1bGVQYXRoLCBwb3NpdGlvbiwgdG9JbnNlcnQpLFxuICAgICAgaW5zZXJ0SW1wb3J0KHNvdXJjZSwgbmdNb2R1bGVQYXRoLCBzeW1ib2xOYW1lLnJlcGxhY2UoL1xcLi4qJC8sICcnKSwgaW1wb3J0UGF0aCksXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiBbbmV3IEluc2VydENoYW5nZShuZ01vZHVsZVBhdGgsIHBvc2l0aW9uLCB0b0luc2VydCldO1xufVxuXG4vKipcbiAqIEN1c3RvbSBmdW5jdGlvbiB0byBpbnNlcnQgYSBkZWNsYXJhdGlvbiAoY29tcG9uZW50LCBwaXBlLCBkaXJlY3RpdmUpXG4gKiBpbnRvIE5nTW9kdWxlIGRlY2xhcmF0aW9ucy4gSXQgYWxzbyBpbXBvcnRzIHRoZSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWNsYXJhdGlvblRvTW9kdWxlKHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZVBhdGg6IHN0cmluZywgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFBhdGg6IHN0cmluZyk6IENoYW5nZVtdIHtcbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShcbiAgICBzb3VyY2UsIG1vZHVsZVBhdGgsICdkZWNsYXJhdGlvbnMnLCBjbGFzc2lmaWVkTmFtZSwgaW1wb3J0UGF0aCk7XG59XG5cbi8qKlxuICogQ3VzdG9tIGZ1bmN0aW9uIHRvIGluc2VydCBhbiBOZ01vZHVsZSBpbnRvIE5nTW9kdWxlIGltcG9ydHMuIEl0IGFsc28gaW1wb3J0cyB0aGUgbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkSW1wb3J0VG9Nb2R1bGUoc291cmNlOiB0cy5Tb3VyY2VGaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZVBhdGg6IHN0cmluZywgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRQYXRoOiBzdHJpbmcpOiBDaGFuZ2VbXSB7XG5cbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShzb3VyY2UsIG1vZHVsZVBhdGgsICdpbXBvcnRzJywgY2xhc3NpZmllZE5hbWUsIGltcG9ydFBhdGgpO1xufVxuXG4vKipcbiAqIEN1c3RvbSBmdW5jdGlvbiB0byBpbnNlcnQgYSBwcm92aWRlciBpbnRvIE5nTW9kdWxlLiBJdCBhbHNvIGltcG9ydHMgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRQcm92aWRlclRvTW9kdWxlKHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZVBhdGg6IHN0cmluZywgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFBhdGg6IHN0cmluZyk6IENoYW5nZVtdIHtcbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShzb3VyY2UsIG1vZHVsZVBhdGgsICdwcm92aWRlcnMnLCBjbGFzc2lmaWVkTmFtZSwgaW1wb3J0UGF0aCk7XG59XG5cbi8qKlxuICogQ3VzdG9tIGZ1bmN0aW9uIHRvIGluc2VydCBhbiBleHBvcnQgaW50byBOZ01vZHVsZS4gSXQgYWxzbyBpbXBvcnRzIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRXhwb3J0VG9Nb2R1bGUoc291cmNlOiB0cy5Tb3VyY2VGaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZVBhdGg6IHN0cmluZywgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRQYXRoOiBzdHJpbmcpOiBDaGFuZ2VbXSB7XG4gIHJldHVybiBhZGRTeW1ib2xUb05nTW9kdWxlTWV0YWRhdGEoc291cmNlLCBtb2R1bGVQYXRoLCAnZXhwb3J0cycsIGNsYXNzaWZpZWROYW1lLCBpbXBvcnRQYXRoKTtcbn1cblxuLyoqXG4gKiBDdXN0b20gZnVuY3Rpb24gdG8gaW5zZXJ0IGFuIGV4cG9ydCBpbnRvIE5nTW9kdWxlLiBJdCBhbHNvIGltcG9ydHMgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRCb290c3RyYXBUb01vZHVsZShzb3VyY2U6IHRzLlNvdXJjZUZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlUGF0aDogc3RyaW5nLCBjbGFzc2lmaWVkTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFBhdGg6IHN0cmluZyk6IENoYW5nZVtdIHtcbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShzb3VyY2UsIG1vZHVsZVBhdGgsICdib290c3RyYXAnLCBjbGFzc2lmaWVkTmFtZSwgaW1wb3J0UGF0aCk7XG59XG5cbi8qKlxuICogQ3VzdG9tIGZ1bmN0aW9uIHRvIGluc2VydCBhbiBlbnRyeUNvbXBvbmVudCBpbnRvIE5nTW9kdWxlLiBJdCBhbHNvIGltcG9ydHMgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRFbnRyeUNvbXBvbmVudFRvTW9kdWxlKHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZVBhdGg6IHN0cmluZywgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFBhdGg6IHN0cmluZyk6IENoYW5nZVtdIHtcbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShcbiAgICBzb3VyY2UsIG1vZHVsZVBhdGgsXG4gICAgJ2VudHJ5Q29tcG9uZW50cycsIGNsYXNzaWZpZWROYW1lLCBpbXBvcnRQYXRoLFxuICApO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhbiBpbXBvcnQgYWxyZWFkeSBleGlzdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0ltcG9ydGVkKHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzaWZpZWROYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgYWxsTm9kZXMgPSBnZXRTb3VyY2VOb2Rlcyhzb3VyY2UpO1xuICBjb25zdCBtYXRjaGluZ05vZGVzID0gYWxsTm9kZXNcbiAgICAuZmlsdGVyKG5vZGUgPT4gbm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkltcG9ydERlY2xhcmF0aW9uKVxuICAgIC5maWx0ZXIoKGltcDogdHMuSW1wb3J0RGVjbGFyYXRpb24pID0+IGltcC5tb2R1bGVTcGVjaWZpZXIua2luZCA9PT0gdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsKVxuICAgIC5maWx0ZXIoKGltcDogdHMuSW1wb3J0RGVjbGFyYXRpb24pID0+IHtcbiAgICAgIHJldHVybiAoaW1wLm1vZHVsZVNwZWNpZmllciBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0ID09PSBpbXBvcnRQYXRoO1xuICAgIH0pXG4gICAgLmZpbHRlcigoaW1wOiB0cy5JbXBvcnREZWNsYXJhdGlvbikgPT4ge1xuICAgICAgaWYgKCFpbXAuaW1wb3J0Q2xhdXNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5vZGVzID0gZmluZE5vZGVzKGltcC5pbXBvcnRDbGF1c2UsIHRzLlN5bnRheEtpbmQuSW1wb3J0U3BlY2lmaWVyKVxuICAgICAgICAuZmlsdGVyKG4gPT4gbi5nZXRUZXh0KCkgPT09IGNsYXNzaWZpZWROYW1lKTtcblxuICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA+IDA7XG4gICAgfSk7XG5cbiAgcmV0dXJuIG1hdGNoaW5nTm9kZXMubGVuZ3RoID4gMDtcbn1cbiJdfQ==