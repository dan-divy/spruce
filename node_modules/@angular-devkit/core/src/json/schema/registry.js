"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ajv = require("ajv");
const http = require("http");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const Url = require("url");
const exception_1 = require("../../exception/exception");
const utils_1 = require("../../utils");
const interface_1 = require("../interface");
const visitor_1 = require("./visitor");
class SchemaValidationException extends exception_1.BaseException {
    constructor(errors, baseMessage = 'Schema validation failed with the following errors:') {
        if (!errors || errors.length === 0) {
            super('Schema validation failed.');
            return;
        }
        const messages = SchemaValidationException.createMessages(errors);
        super(`${baseMessage}\n  ${messages.join('\n  ')}`);
        this.errors = errors;
    }
    static createMessages(errors) {
        if (!errors || errors.length === 0) {
            return [];
        }
        const messages = errors.map((err) => {
            let message = `Data path ${JSON.stringify(err.dataPath)} ${err.message}`;
            if (err.keyword === 'additionalProperties') {
                message += `(${err.params.additionalProperty})`;
            }
            return message + '.';
        });
        return messages;
    }
}
exports.SchemaValidationException = SchemaValidationException;
class CoreSchemaRegistry {
    constructor(formats = []) {
        /**
         * Build an AJV instance that will be used to validate schemas.
         */
        this._uriCache = new Map();
        this._uriHandlers = new Set();
        this._pre = new utils_1.PartiallyOrderedSet();
        this._post = new utils_1.PartiallyOrderedSet();
        this._smartDefaultKeyword = false;
        this._sourceMap = new Map();
        const formatsObj = {};
        for (const format of formats) {
            formatsObj[format.name] = format.formatter;
        }
        this._ajv = ajv({
            formats: formatsObj,
            loadSchema: (uri) => this._fetch(uri),
            schemaId: 'auto',
            passContext: true,
        });
        this._ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
        this._ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
    }
    _fetch(uri) {
        const maybeSchema = this._uriCache.get(uri);
        if (maybeSchema) {
            return Promise.resolve(maybeSchema);
        }
        // Try all handlers, one after the other.
        for (const maybeHandler of this._uriHandlers) {
            const handler = maybeHandler(uri);
            if (handler) {
                // The AJV API only understands Promises.
                return rxjs_1.from(handler).pipe(operators_1.tap(json => this._uriCache.set(uri, json))).toPromise();
            }
        }
        // If none are found, handle using http client.
        return new Promise((resolve, reject) => {
            http.get(uri, res => {
                if (!res.statusCode || res.statusCode >= 300) {
                    // Consume the rest of the data to free memory.
                    res.resume();
                    reject(new Error(`Request failed. Status Code: ${res.statusCode}`));
                }
                else {
                    res.setEncoding('utf8');
                    let data = '';
                    res.on('data', chunk => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            this._uriCache.set(uri, json);
                            resolve(json);
                        }
                        catch (err) {
                            reject(err);
                        }
                    });
                }
            });
        });
    }
    /**
     * Add a transformation step before the validation of any Json.
     * @param {JsonVisitor} visitor The visitor to transform every value.
     * @param {JsonVisitor[]} deps A list of other visitors to run before.
     */
    addPreTransform(visitor, deps) {
        this._pre.add(visitor, deps);
    }
    /**
     * Add a transformation step after the validation of any Json. The JSON will not be validated
     * after the POST, so if transformations are not compatible with the Schema it will not result
     * in an error.
     * @param {JsonVisitor} visitor The visitor to transform every value.
     * @param {JsonVisitor[]} deps A list of other visitors to run before.
     */
    addPostTransform(visitor, deps) {
        this._post.add(visitor, deps);
    }
    _resolver(ref, validate) {
        if (!validate || !validate.refs || !validate.refVal || !ref) {
            return {};
        }
        let refMap = validate;
        const rootRefMap = validate.root;
        // Resolve from the root if it's different.
        if (validate.root && validate.schema !== rootRefMap.schema) {
            refMap = rootRefMap;
        }
        const schema = refMap.schema ? typeof refMap.schema == 'object' && refMap.schema : null;
        const maybeId = schema ? schema.id || schema.$id : null;
        if (typeof maybeId == 'string') {
            ref = Url.resolve(maybeId, ref);
        }
        let fullReference = (ref[0] === '#' && maybeId) ? maybeId + ref : ref;
        if (fullReference.endsWith('#')) {
            fullReference = fullReference.slice(0, -1);
        }
        // tslint:disable-next-line:no-any
        const context = validate.refVal[validate.refs[fullReference]];
        if (typeof context == 'function') {
            // Context will be a function if the schema isn't loaded yet, and an actual schema if it's
            // synchronously available.
            return { context, schema: context && context.schema };
        }
        else {
            return { context: validate, schema: context };
        }
    }
    /**
     * Flatten the Schema, resolving and replacing all the refs. Makes it into a synchronous schema
     * that is also easier to traverse. Does not cache the result.
     *
     * @param schema The schema or URI to flatten.
     * @returns An Observable of the flattened schema object.
     */
    flatten(schema) {
        this._ajv.removeSchema(schema);
        // Supports both synchronous and asynchronous compilation, by trying the synchronous
        // version first, then if refs are missing this will fails.
        // We also add any refs from external fetched schemas so that those will also be used
        // in synchronous (if available).
        let validator;
        try {
            this._currentCompilationSchemaInfo = undefined;
            validator = rxjs_1.of(this._ajv.compile(schema)).pipe(operators_1.tap(() => this._currentCompilationSchemaInfo = undefined));
        }
        catch (e) {
            // Propagate the error.
            if (!(e instanceof ajv.MissingRefError)) {
                return rxjs_1.throwError(e);
            }
            this._currentCompilationSchemaInfo = undefined;
            validator = rxjs_1.from(this._ajv.compileAsync(schema)).pipe(operators_1.tap(() => this._currentCompilationSchemaInfo = undefined));
        }
        return validator.pipe(operators_1.switchMap(validate => {
            const self = this;
            function visitor(current, pointer, parentSchema, index) {
                if (current
                    && parentSchema
                    && index
                    && interface_1.isJsonObject(current)
                    && current.hasOwnProperty('$ref')
                    && typeof current['$ref'] == 'string') {
                    const resolved = self._resolver(current['$ref'], validate);
                    if (resolved.schema) {
                        parentSchema[index] = resolved.schema;
                    }
                }
            }
            const schema = utils_1.deepCopy(validate.schema);
            visitor_1.visitJsonSchema(schema, visitor);
            return rxjs_1.of(schema);
        }));
    }
    /**
     * Compile and return a validation function for the Schema.
     *
     * @param schema The schema to validate. If a string, will fetch the schema before compiling it
     * (using schema as a URI).
     * @returns An Observable of the Validation function.
     */
    compile(schema) {
        const schemaInfo = {
            smartDefaultRecord: new Map(),
            promptDefinitions: [],
        };
        this._ajv.removeSchema(schema);
        // Supports both synchronous and asynchronous compilation, by trying the synchronous
        // version first, then if refs are missing this will fails.
        // We also add any refs from external fetched schemas so that those will also be used
        // in synchronous (if available).
        let validator;
        try {
            this._currentCompilationSchemaInfo = schemaInfo;
            validator = rxjs_1.of(this._ajv.compile(schema));
        }
        catch (e) {
            // Propagate the error.
            if (!(e instanceof ajv.MissingRefError)) {
                return rxjs_1.throwError(e);
            }
            try {
                validator = rxjs_1.from(this._ajv.compileAsync(schema));
            }
            catch (e) {
                return rxjs_1.throwError(e);
            }
        }
        return validator
            .pipe(operators_1.map(validate => (data, options) => {
            const validationOptions = Object.assign({ withPrompts: true, applyPostTransforms: true, applyPreTransforms: true }, options);
            const validationContext = {
                promptFieldsWithValue: new Set(),
            };
            let result = rxjs_1.of(data);
            if (validationOptions.applyPreTransforms) {
                // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
                result = result.pipe(...[...this._pre].map(visitor => operators_1.concatMap((data) => {
                    return visitor_1.visitJson(data, visitor, schema, this._resolver, validate);
                })));
            }
            return result.pipe(operators_1.switchMap(updateData => this._applySmartDefaults(updateData, schemaInfo.smartDefaultRecord)), operators_1.switchMap(updatedData => {
                if (validationOptions.withPrompts === false) {
                    return rxjs_1.of(updatedData);
                }
                const visitor = (value, pointer) => {
                    if (value !== undefined) {
                        validationContext.promptFieldsWithValue.add(pointer);
                    }
                    return value;
                };
                return visitor_1.visitJson(updatedData, visitor, schema, this._resolver, validate);
            }), operators_1.switchMap(updatedData => {
                if (validationOptions.withPrompts === false) {
                    return rxjs_1.of(updatedData);
                }
                const definitions = schemaInfo.promptDefinitions
                    .filter(def => !validationContext.promptFieldsWithValue.has(def.id));
                if (this._promptProvider && definitions.length > 0) {
                    return rxjs_1.from(this._applyPrompts(updatedData, definitions));
                }
                else {
                    return rxjs_1.of(updatedData);
                }
            }), operators_1.switchMap(updatedData => {
                const result = validate.call(validationContext, updatedData);
                return typeof result == 'boolean'
                    ? rxjs_1.of([updatedData, result])
                    : rxjs_1.from(result
                        .then(r => [updatedData, true])
                        .catch((err) => {
                        if (err.ajv) {
                            validate.errors = err.errors;
                            return Promise.resolve([updatedData, false]);
                        }
                        return Promise.reject(err);
                    }));
            }), operators_1.switchMap(([data, valid]) => {
                if (valid) {
                    let result = rxjs_1.of(data);
                    if (validationOptions.applyPostTransforms) {
                        // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
                        result = result.pipe(...[...this._post].map(visitor => operators_1.concatMap((data) => {
                            return visitor_1.visitJson(data, visitor, schema, this._resolver, validate);
                        })));
                    }
                    return result.pipe(operators_1.map(data => [data, valid]));
                }
                else {
                    return rxjs_1.of([data, valid]);
                }
            }), operators_1.map(([data, valid]) => {
                if (valid) {
                    return { data, success: true };
                }
                return {
                    data,
                    success: false,
                    errors: (validate.errors || []),
                };
            }));
        }));
    }
    addFormat(format) {
        // tslint:disable-next-line:no-any
        const validate = (data) => {
            const result = format.formatter.validate(data);
            if (typeof result == 'boolean') {
                return result;
            }
            else {
                return result.toPromise();
            }
        };
        this._ajv.addFormat(format.name, {
            async: format.formatter.async,
            validate,
        });
    }
    addSmartDefaultProvider(source, provider) {
        if (this._sourceMap.has(source)) {
            throw new Error(source);
        }
        this._sourceMap.set(source, provider);
        if (!this._smartDefaultKeyword) {
            this._smartDefaultKeyword = true;
            this._ajv.addKeyword('$default', {
                errors: false,
                valid: true,
                compile: (schema, _parentSchema, it) => {
                    const compilationSchemInfo = this._currentCompilationSchemaInfo;
                    if (compilationSchemInfo === undefined) {
                        return () => true;
                    }
                    // We cheat, heavily.
                    compilationSchemInfo.smartDefaultRecord.set(
                    // tslint:disable-next-line:no-any
                    JSON.stringify(it.dataPathArr.slice(1, it.dataLevel + 1)), schema);
                    return () => true;
                },
                metaSchema: {
                    type: 'object',
                    properties: {
                        '$source': { type: 'string' },
                    },
                    additionalProperties: true,
                    required: ['$source'],
                },
            });
        }
    }
    registerUriHandler(handler) {
        this._uriHandlers.add(handler);
    }
    usePromptProvider(provider) {
        const isSetup = !!this._promptProvider;
        this._promptProvider = provider;
        if (isSetup) {
            return;
        }
        this._ajv.addKeyword('x-prompt', {
            errors: false,
            valid: true,
            compile: (schema, parentSchema, it) => {
                const compilationSchemInfo = this._currentCompilationSchemaInfo;
                if (!compilationSchemInfo) {
                    return () => true;
                }
                // tslint:disable-next-line:no-any
                const pathArray = it.dataPathArr.slice(1, it.dataLevel + 1);
                const path = '/' + pathArray.map(p => p.replace(/^\'/, '').replace(/\'$/, '')).join('/');
                let type;
                let items;
                let message;
                if (typeof schema == 'string') {
                    message = schema;
                }
                else {
                    message = schema.message;
                    type = schema.type;
                    items = schema.items;
                }
                if (!type) {
                    if (parentSchema.type === 'boolean') {
                        type = 'confirmation';
                    }
                    else if (Array.isArray(parentSchema.enum)) {
                        type = 'list';
                    }
                    else {
                        type = 'input';
                    }
                }
                if (type === 'list' && !items) {
                    if (Array.isArray(parentSchema.enum)) {
                        type = 'list';
                        items = [];
                        for (const value of parentSchema.enum) {
                            if (typeof value == 'string') {
                                items.push(value);
                            }
                            else if (typeof value == 'object') {
                                // Invalid
                            }
                            else {
                                items.push({ label: value.toString(), value });
                            }
                        }
                    }
                }
                const definition = {
                    id: path,
                    type,
                    message,
                    priority: 0,
                    raw: schema,
                    items,
                    default: typeof parentSchema.default == 'object' ? undefined : parentSchema.default,
                    async validator(data) {
                        const result = it.self.validate(parentSchema, data);
                        if (typeof result === 'boolean') {
                            return result;
                        }
                        else {
                            try {
                                await result;
                                return true;
                            }
                            catch (_a) {
                                return false;
                            }
                        }
                    },
                };
                compilationSchemInfo.promptDefinitions.push(definition);
                return function () {
                    // If 'this' is undefined in the call, then it defaults to the global
                    // 'this'.
                    if (this && this.promptFieldsWithValue) {
                        this.promptFieldsWithValue.add(path);
                    }
                    return true;
                };
            },
            metaSchema: {
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'object',
                        properties: {
                            'type': { type: 'string' },
                            'message': { type: 'string' },
                        },
                        additionalProperties: true,
                        required: ['message'],
                    },
                ],
            },
        });
    }
    _applyPrompts(data, prompts) {
        const provider = this._promptProvider;
        if (!provider) {
            return rxjs_1.of(data);
        }
        prompts.sort((a, b) => b.priority - a.priority);
        return rxjs_1.from(provider(prompts)).pipe(operators_1.map(answers => {
            for (const path in answers) {
                const pathFragments = path.split('/').map(pf => {
                    if (/^\d+$/.test(pf)) {
                        return pf;
                    }
                    else {
                        return '\'' + pf + '\'';
                    }
                });
                CoreSchemaRegistry._set(data, pathFragments.slice(1), answers[path], null, undefined, true);
            }
            return data;
        }));
    }
    static _set(
    // tslint:disable-next-line:no-any
    data, fragments, value, 
    // tslint:disable-next-line:no-any
    parent = null, parentProperty, force) {
        for (let i = 0; i < fragments.length; i++) {
            const f = fragments[i];
            if (f[0] == 'i') {
                if (!Array.isArray(data)) {
                    return;
                }
                for (let j = 0; j < data.length; j++) {
                    CoreSchemaRegistry._set(data[j], fragments.slice(i + 1), value, data, '' + j);
                }
                return;
            }
            else if (f.startsWith('key')) {
                if (typeof data !== 'object') {
                    return;
                }
                Object.getOwnPropertyNames(data).forEach(property => {
                    CoreSchemaRegistry._set(data[property], fragments.slice(i + 1), value, data, property);
                });
                return;
            }
            else if (f.startsWith('\'') && f[f.length - 1] == '\'') {
                const property = f
                    .slice(1, -1)
                    .replace(/\\'/g, '\'')
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\f/g, '\f')
                    .replace(/\\t/g, '\t');
                // We know we need an object because the fragment is a property key.
                if (!data && parent !== null && parentProperty) {
                    data = parent[parentProperty] = {};
                }
                parent = data;
                parentProperty = property;
                data = data[property];
            }
            else {
                return;
            }
        }
        if (parent && parentProperty && (force || parent[parentProperty] === undefined)) {
            parent[parentProperty] = value;
        }
    }
    _applySmartDefaults(data, smartDefaults) {
        // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
        return rxjs_1.of(data).pipe(...[...smartDefaults.entries()].map(([pointer, schema]) => {
            return operators_1.concatMap(data => {
                const fragments = JSON.parse(pointer);
                const source = this._sourceMap.get(schema.$source);
                let value = source ? source(schema) : rxjs_1.of(undefined);
                if (!utils_1.isObservable(value)) {
                    value = rxjs_1.of(value);
                }
                return value.pipe(
                // Synchronously set the new data at the proper JsonSchema path.
                operators_1.tap(x => CoreSchemaRegistry._set(data, fragments, x)), 
                // But return the data object.
                operators_1.map(() => data));
            });
        }));
    }
}
exports.CoreSchemaRegistry = CoreSchemaRegistry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2pzb24vc2NoZW1hL3JlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsMkJBQTJCO0FBQzNCLDZCQUE2QjtBQUM3QiwrQkFBd0Q7QUFDeEQsOENBQWdFO0FBQ2hFLDJCQUEyQjtBQUMzQix5REFBMEQ7QUFDMUQsdUNBQTBFO0FBQzFFLDRDQUE4RTtBQWU5RSx1Q0FBdUQ7QUFtQnZELE1BQWEseUJBQTBCLFNBQVEseUJBQWE7SUFHMUQsWUFDRSxNQUErQixFQUMvQixXQUFXLEdBQUcscURBQXFEO1FBRW5FLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFFbkMsT0FBTztTQUNSO1FBRUQsTUFBTSxRQUFRLEdBQUcseUJBQXlCLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLEtBQUssQ0FBQyxHQUFHLFdBQVcsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUErQjtRQUMxRCxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEMsSUFBSSxPQUFPLEdBQUcsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLENB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QVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsOEJBQThCO2dCQUM5QixlQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQ2hCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF4b0JELGdEQXdvQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyBhanYgZnJvbSAnYWp2JztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tLCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwLCBtYXAsIHN3aXRjaE1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgVXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBQYXJ0aWFsbHlPcmRlcmVkU2V0LCBkZWVwQ29weSwgaXNPYnNlcnZhYmxlIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgSnNvbkFycmF5LCBKc29uT2JqZWN0LCBKc29uVmFsdWUsIGlzSnNvbk9iamVjdCB9IGZyb20gJy4uL2ludGVyZmFjZSc7XG5pbXBvcnQge1xuICBKc29uUG9pbnRlcixcbiAgSnNvblZpc2l0b3IsXG4gIFByb21wdERlZmluaXRpb24sXG4gIFByb21wdFByb3ZpZGVyLFxuICBTY2hlbWFGb3JtYXQsXG4gIFNjaGVtYUZvcm1hdHRlcixcbiAgU2NoZW1hUmVnaXN0cnksXG4gIFNjaGVtYVZhbGlkYXRvcixcbiAgU2NoZW1hVmFsaWRhdG9yRXJyb3IsXG4gIFNjaGVtYVZhbGlkYXRvck9wdGlvbnMsXG4gIFNjaGVtYVZhbGlkYXRvclJlc3VsdCxcbiAgU21hcnREZWZhdWx0UHJvdmlkZXIsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IHZpc2l0SnNvbiwgdmlzaXRKc29uU2NoZW1hIH0gZnJvbSAnLi92aXNpdG9yJztcblxuLy8gVGhpcyBpbnRlcmZhY2Ugc2hvdWxkIGJlIGV4cG9ydGVkIGZyb20gYWp2LCBidXQgdGhleSBvbmx5IGV4cG9ydCB0aGUgY2xhc3MgYW5kIG5vdCB0aGUgdHlwZS5cbmludGVyZmFjZSBBanZWYWxpZGF0aW9uRXJyb3Ige1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGVycm9yczogQXJyYXk8YWp2LkVycm9yT2JqZWN0PjtcbiAgYWp2OiB0cnVlO1xuICB2YWxpZGF0aW9uOiB0cnVlO1xufVxuXG5pbnRlcmZhY2UgQWp2UmVmTWFwIHtcbiAgcmVmczogc3RyaW5nW107XG4gIHJlZlZhbDogYW55OyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWFueVxuICBzY2hlbWE6IEpzb25PYmplY3Q7XG59XG5cbmV4cG9ydCB0eXBlIFVyaUhhbmRsZXIgPSAodXJpOiBzdHJpbmcpID0+XG4gIE9ic2VydmFibGU8SnNvbk9iamVjdD4gfCBQcm9taXNlPEpzb25PYmplY3Q+IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGNsYXNzIFNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yczogU2NoZW1hVmFsaWRhdG9yRXJyb3JbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlcnJvcnM/OiBTY2hlbWFWYWxpZGF0b3JFcnJvcltdLFxuICAgIGJhc2VNZXNzYWdlID0gJ1NjaGVtYSB2YWxpZGF0aW9uIGZhaWxlZCB3aXRoIHRoZSBmb2xsb3dpbmcgZXJyb3JzOicsXG4gICkge1xuICAgIGlmICghZXJyb3JzIHx8IGVycm9ycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHN1cGVyKCdTY2hlbWEgdmFsaWRhdGlvbiBmYWlsZWQuJyk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtZXNzYWdlcyA9IFNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24uY3JlYXRlTWVzc2FnZXMoZXJyb3JzKTtcbiAgICBzdXBlcihgJHtiYXNlTWVzc2FnZX1cXG4gICR7bWVzc2FnZXMuam9pbignXFxuICAnKX1gKTtcbiAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlTWVzc2FnZXMoZXJyb3JzPzogU2NoZW1hVmFsaWRhdG9yRXJyb3JbXSk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIWVycm9ycyB8fCBlcnJvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgbWVzc2FnZXMgPSBlcnJvcnMubWFwKChlcnIpID0+IHtcbiAgICAgIGxldCBtZXNzYWdlID0gYERhdGEgcGF0aCAke0pTT04uc3RyaW5naWZ5KGVyci5kYXRhUGF0aCl9ICR7ZXJyLm1lc3NhZ2V9YDtcbiAgICAgIGlmIChlcnIua2V5d29yZCA9PT0gJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJykge1xuICAgICAgICBtZXNzYWdlICs9IGAoJHtlcnIucGFyYW1zLmFkZGl0aW9uYWxQcm9wZXJ0eX0pYDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1lc3NhZ2UgKyAnLic7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWVzc2FnZXM7XG4gIH1cbn1cblxuaW50ZXJmYWNlIFNjaGVtYUluZm8ge1xuICBzbWFydERlZmF1bHRSZWNvcmQ6IE1hcDxzdHJpbmcsIEpzb25PYmplY3Q+O1xuICBwcm9tcHREZWZpbml0aW9uczogQXJyYXk8UHJvbXB0RGVmaW5pdGlvbj47XG59XG5cbmV4cG9ydCBjbGFzcyBDb3JlU2NoZW1hUmVnaXN0cnkgaW1wbGVtZW50cyBTY2hlbWFSZWdpc3RyeSB7XG4gIHByaXZhdGUgX2FqdjogYWp2LkFqdjtcbiAgcHJpdmF0ZSBfdXJpQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgSnNvbk9iamVjdD4oKTtcbiAgcHJpdmF0ZSBfdXJpSGFuZGxlcnMgPSBuZXcgU2V0PFVyaUhhbmRsZXI+KCk7XG4gIHByaXZhdGUgX3ByZSA9IG5ldyBQYXJ0aWFsbHlPcmRlcmVkU2V0PEpzb25WaXNpdG9yPigpO1xuICBwcml2YXRlIF9wb3N0ID0gbmV3IFBhcnRpYWxseU9yZGVyZWRTZXQ8SnNvblZpc2l0b3I+KCk7XG5cbiAgcHJpdmF0ZSBfY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbz86IFNjaGVtYUluZm87XG5cbiAgcHJpdmF0ZSBfc21hcnREZWZhdWx0S2V5d29yZCA9IGZhbHNlO1xuICBwcml2YXRlIF9wcm9tcHRQcm92aWRlcj86IFByb21wdFByb3ZpZGVyO1xuICBwcml2YXRlIF9zb3VyY2VNYXAgPSBuZXcgTWFwPHN0cmluZywgU21hcnREZWZhdWx0UHJvdmlkZXI8e30+PigpO1xuXG4gIGNvbnN0cnVjdG9yKGZvcm1hdHM6IFNjaGVtYUZvcm1hdFtdID0gW10pIHtcbiAgICAvKipcbiAgICAgKiBCdWlsZCBhbiBBSlYgaW5zdGFuY2UgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdmFsaWRhdGUgc2NoZW1hcy5cbiAgICAgKi9cblxuICAgIGNvbnN0IGZvcm1hdHNPYmo6IHsgW25hbWU6IHN0cmluZ106IFNjaGVtYUZvcm1hdHRlciB9ID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGZvcm1hdCBvZiBmb3JtYXRzKSB7XG4gICAgICBmb3JtYXRzT2JqW2Zvcm1hdC5uYW1lXSA9IGZvcm1hdC5mb3JtYXR0ZXI7XG4gICAgfVxuXG4gICAgdGhpcy5fYWp2ID0gYWp2KHtcbiAgICAgIGZvcm1hdHM6IGZvcm1hdHNPYmosXG4gICAgICBsb2FkU2NoZW1hOiAodXJpOiBzdHJpbmcpID0+IHRoaXMuX2ZldGNoKHVyaSksXG4gICAgICBzY2hlbWFJZDogJ2F1dG8nLFxuICAgICAgcGFzc0NvbnRleHQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9hanYuYWRkTWV0YVNjaGVtYShyZXF1aXJlKCdhanYvbGliL3JlZnMvanNvbi1zY2hlbWEtZHJhZnQtMDQuanNvbicpKTtcbiAgICB0aGlzLl9hanYuYWRkTWV0YVNjaGVtYShyZXF1aXJlKCdhanYvbGliL3JlZnMvanNvbi1zY2hlbWEtZHJhZnQtMDYuanNvbicpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2ZldGNoKHVyaTogc3RyaW5nKTogUHJvbWlzZTxKc29uT2JqZWN0PiB7XG4gICAgY29uc3QgbWF5YmVTY2hlbWEgPSB0aGlzLl91cmlDYWNoZS5nZXQodXJpKTtcblxuICAgIGlmIChtYXliZVNjaGVtYSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtYXliZVNjaGVtYSk7XG4gICAgfVxuXG4gICAgLy8gVHJ5IGFsbCBoYW5kbGVycywgb25lIGFmdGVyIHRoZSBvdGhlci5cbiAgICBmb3IgKGNvbnN0IG1heWJlSGFuZGxlciBvZiB0aGlzLl91cmlIYW5kbGVycykge1xuICAgICAgY29uc3QgaGFuZGxlciA9IG1heWJlSGFuZGxlcih1cmkpO1xuICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgLy8gVGhlIEFKViBBUEkgb25seSB1bmRlcnN0YW5kcyBQcm9taXNlcy5cbiAgICAgICAgcmV0dXJuIGZyb20oaGFuZGxlcikucGlwZShcbiAgICAgICAgICB0YXAoanNvbiA9PiB0aGlzLl91cmlDYWNoZS5zZXQodXJpLCBqc29uKSksXG4gICAgICAgICkudG9Qcm9taXNlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgbm9uZSBhcmUgZm91bmQsIGhhbmRsZSB1c2luZyBodHRwIGNsaWVudC5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SnNvbk9iamVjdD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaHR0cC5nZXQodXJpLCByZXMgPT4ge1xuICAgICAgICBpZiAoIXJlcy5zdGF0dXNDb2RlIHx8IHJlcy5zdGF0dXNDb2RlID49IDMwMCkge1xuICAgICAgICAgIC8vIENvbnN1bWUgdGhlIHJlc3Qgb2YgdGhlIGRhdGEgdG8gZnJlZSBtZW1vcnkuXG4gICAgICAgICAgcmVzLnJlc3VtZSgpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFJlcXVlc3QgZmFpbGVkLiBTdGF0dXMgQ29kZTogJHtyZXMuc3RhdHVzQ29kZX1gKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICAgICAgbGV0IGRhdGEgPSAnJztcbiAgICAgICAgICByZXMub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICAgICAgICBkYXRhICs9IGNodW5rO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlcy5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICAgIHRoaXMuX3VyaUNhY2hlLnNldCh1cmksIGpzb24pO1xuICAgICAgICAgICAgICByZXNvbHZlKGpzb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB0cmFuc2Zvcm1hdGlvbiBzdGVwIGJlZm9yZSB0aGUgdmFsaWRhdGlvbiBvZiBhbnkgSnNvbi5cbiAgICogQHBhcmFtIHtKc29uVmlzaXRvcn0gdmlzaXRvciBUaGUgdmlzaXRvciB0byB0cmFuc2Zvcm0gZXZlcnkgdmFsdWUuXG4gICAqIEBwYXJhbSB7SnNvblZpc2l0b3JbXX0gZGVwcyBBIGxpc3Qgb2Ygb3RoZXIgdmlzaXRvcnMgdG8gcnVuIGJlZm9yZS5cbiAgICovXG4gIGFkZFByZVRyYW5zZm9ybSh2aXNpdG9yOiBKc29uVmlzaXRvciwgZGVwcz86IEpzb25WaXNpdG9yW10pIHtcbiAgICB0aGlzLl9wcmUuYWRkKHZpc2l0b3IsIGRlcHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHRyYW5zZm9ybWF0aW9uIHN0ZXAgYWZ0ZXIgdGhlIHZhbGlkYXRpb24gb2YgYW55IEpzb24uIFRoZSBKU09OIHdpbGwgbm90IGJlIHZhbGlkYXRlZFxuICAgKiBhZnRlciB0aGUgUE9TVCwgc28gaWYgdHJhbnNmb3JtYXRpb25zIGFyZSBub3QgY29tcGF0aWJsZSB3aXRoIHRoZSBTY2hlbWEgaXQgd2lsbCBub3QgcmVzdWx0XG4gICAqIGluIGFuIGVycm9yLlxuICAgKiBAcGFyYW0ge0pzb25WaXNpdG9yfSB2aXNpdG9yIFRoZSB2aXNpdG9yIHRvIHRyYW5zZm9ybSBldmVyeSB2YWx1ZS5cbiAgICogQHBhcmFtIHtKc29uVmlzaXRvcltdfSBkZXBzIEEgbGlzdCBvZiBvdGhlciB2aXNpdG9ycyB0byBydW4gYmVmb3JlLlxuICAgKi9cbiAgYWRkUG9zdFRyYW5zZm9ybSh2aXNpdG9yOiBKc29uVmlzaXRvciwgZGVwcz86IEpzb25WaXNpdG9yW10pIHtcbiAgICB0aGlzLl9wb3N0LmFkZCh2aXNpdG9yLCBkZXBzKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZXIoXG4gICAgcmVmOiBzdHJpbmcsXG4gICAgdmFsaWRhdGU6IGFqdi5WYWxpZGF0ZUZ1bmN0aW9uLFxuICApOiB7IGNvbnRleHQ/OiBhanYuVmFsaWRhdGVGdW5jdGlvbiwgc2NoZW1hPzogSnNvbk9iamVjdCB9IHtcbiAgICBpZiAoIXZhbGlkYXRlIHx8ICF2YWxpZGF0ZS5yZWZzIHx8ICF2YWxpZGF0ZS5yZWZWYWwgfHwgIXJlZikge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGxldCByZWZNYXAgPSB2YWxpZGF0ZSBhcyBBanZSZWZNYXA7XG4gICAgY29uc3Qgcm9vdFJlZk1hcCA9IHZhbGlkYXRlLnJvb3QgYXMgQWp2UmVmTWFwO1xuXG4gICAgLy8gUmVzb2x2ZSBmcm9tIHRoZSByb290IGlmIGl0J3MgZGlmZmVyZW50LlxuICAgIGlmICh2YWxpZGF0ZS5yb290ICYmIHZhbGlkYXRlLnNjaGVtYSAhPT0gcm9vdFJlZk1hcC5zY2hlbWEpIHtcbiAgICAgIHJlZk1hcCA9IHJvb3RSZWZNYXA7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hID0gcmVmTWFwLnNjaGVtYSA/IHR5cGVvZiByZWZNYXAuc2NoZW1hID09ICdvYmplY3QnICYmIHJlZk1hcC5zY2hlbWEgOiBudWxsO1xuICAgIGNvbnN0IG1heWJlSWQgPSBzY2hlbWEgPyAoc2NoZW1hIGFzIEpzb25PYmplY3QpLmlkIHx8IChzY2hlbWEgYXMgSnNvbk9iamVjdCkuJGlkIDogbnVsbDtcblxuICAgIGlmICh0eXBlb2YgbWF5YmVJZCA9PSAnc3RyaW5nJykge1xuICAgICAgcmVmID0gVXJsLnJlc29sdmUobWF5YmVJZCwgcmVmKTtcbiAgICB9XG5cbiAgICBsZXQgZnVsbFJlZmVyZW5jZSA9IChyZWZbMF0gPT09ICcjJyAmJiBtYXliZUlkKSA/IG1heWJlSWQgKyByZWYgOiByZWY7XG4gICAgaWYgKGZ1bGxSZWZlcmVuY2UuZW5kc1dpdGgoJyMnKSkge1xuICAgICAgZnVsbFJlZmVyZW5jZSA9IGZ1bGxSZWZlcmVuY2Uuc2xpY2UoMCwgLTEpO1xuICAgIH1cblxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICBjb25zdCBjb250ZXh0ID0gdmFsaWRhdGUucmVmVmFsWyh2YWxpZGF0ZS5yZWZzIGFzIGFueSlbZnVsbFJlZmVyZW5jZV1dO1xuXG4gICAgaWYgKHR5cGVvZiBjb250ZXh0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIENvbnRleHQgd2lsbCBiZSBhIGZ1bmN0aW9uIGlmIHRoZSBzY2hlbWEgaXNuJ3QgbG9hZGVkIHlldCwgYW5kIGFuIGFjdHVhbCBzY2hlbWEgaWYgaXQnc1xuICAgICAgLy8gc3luY2hyb25vdXNseSBhdmFpbGFibGUuXG4gICAgICByZXR1cm4geyBjb250ZXh0LCBzY2hlbWE6IGNvbnRleHQgJiYgY29udGV4dC5zY2hlbWEgYXMgSnNvbk9iamVjdCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4geyBjb250ZXh0OiB2YWxpZGF0ZSwgc2NoZW1hOiBjb250ZXh0IGFzIEpzb25PYmplY3QgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbiB0aGUgU2NoZW1hLCByZXNvbHZpbmcgYW5kIHJlcGxhY2luZyBhbGwgdGhlIHJlZnMuIE1ha2VzIGl0IGludG8gYSBzeW5jaHJvbm91cyBzY2hlbWFcbiAgICogdGhhdCBpcyBhbHNvIGVhc2llciB0byB0cmF2ZXJzZS4gRG9lcyBub3QgY2FjaGUgdGhlIHJlc3VsdC5cbiAgICpcbiAgICogQHBhcmFtIHNjaGVtYSBUaGUgc2NoZW1hIG9yIFVSSSB0byBmbGF0dGVuLlxuICAgKiBAcmV0dXJucyBBbiBPYnNlcnZhYmxlIG9mIHRoZSBmbGF0dGVuZWQgc2NoZW1hIG9iamVjdC5cbiAgICovXG4gIGZsYXR0ZW4oc2NoZW1hOiBKc29uT2JqZWN0KTogT2JzZXJ2YWJsZTxKc29uT2JqZWN0PiB7XG4gICAgdGhpcy5fYWp2LnJlbW92ZVNjaGVtYShzY2hlbWEpO1xuXG4gICAgLy8gU3VwcG9ydHMgYm90aCBzeW5jaHJvbm91cyBhbmQgYXN5bmNocm9ub3VzIGNvbXBpbGF0aW9uLCBieSB0cnlpbmcgdGhlIHN5bmNocm9ub3VzXG4gICAgLy8gdmVyc2lvbiBmaXJzdCwgdGhlbiBpZiByZWZzIGFyZSBtaXNzaW5nIHRoaXMgd2lsbCBmYWlscy5cbiAgICAvLyBXZSBhbHNvIGFkZCBhbnkgcmVmcyBmcm9tIGV4dGVybmFsIGZldGNoZWQgc2NoZW1hcyBzbyB0aGF0IHRob3NlIHdpbGwgYWxzbyBiZSB1c2VkXG4gICAgLy8gaW4gc3luY2hyb25vdXMgKGlmIGF2YWlsYWJsZSkuXG4gICAgbGV0IHZhbGlkYXRvcjogT2JzZXJ2YWJsZTxhanYuVmFsaWRhdGVGdW5jdGlvbj47XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2N1cnJlbnRDb21waWxhdGlvblNjaGVtYUluZm8gPSB1bmRlZmluZWQ7XG4gICAgICB2YWxpZGF0b3IgPSBvZih0aGlzLl9hanYuY29tcGlsZShzY2hlbWEpKS5waXBlKFxuICAgICAgICB0YXAoKCkgPT4gdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbyA9IHVuZGVmaW5lZCksXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFByb3BhZ2F0ZSB0aGUgZXJyb3IuXG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgKGFqdi5NaXNzaW5nUmVmRXJyb3IgYXMge30gYXMgRnVuY3Rpb24pKSkge1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgIHZhbGlkYXRvciA9IGZyb20odGhpcy5fYWp2LmNvbXBpbGVBc3luYyhzY2hlbWEpKS5waXBlKFxuICAgICAgICB0YXAoKCkgPT4gdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbyA9IHVuZGVmaW5lZCksXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB2YWxpZGF0b3IucGlwZShcbiAgICAgIHN3aXRjaE1hcCh2YWxpZGF0ZSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGZ1bmN0aW9uIHZpc2l0b3IoXG4gICAgICAgICAgY3VycmVudDogSnNvbk9iamVjdCB8IEpzb25BcnJheSxcbiAgICAgICAgICBwb2ludGVyOiBKc29uUG9pbnRlcixcbiAgICAgICAgICBwYXJlbnRTY2hlbWE/OiBKc29uT2JqZWN0IHwgSnNvbkFycmF5LFxuICAgICAgICAgIGluZGV4Pzogc3RyaW5nLFxuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoY3VycmVudFxuICAgICAgICAgICAgJiYgcGFyZW50U2NoZW1hXG4gICAgICAgICAgICAmJiBpbmRleFxuICAgICAgICAgICAgJiYgaXNKc29uT2JqZWN0KGN1cnJlbnQpXG4gICAgICAgICAgICAmJiBjdXJyZW50Lmhhc093blByb3BlcnR5KCckcmVmJylcbiAgICAgICAgICAgICYmIHR5cGVvZiBjdXJyZW50WyckcmVmJ10gPT0gJ3N0cmluZydcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gc2VsZi5fcmVzb2x2ZXIoY3VycmVudFsnJHJlZiddIGFzIHN0cmluZywgdmFsaWRhdGUpO1xuXG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuc2NoZW1hKSB7XG4gICAgICAgICAgICAgIChwYXJlbnRTY2hlbWEgYXMgSnNvbk9iamVjdClbaW5kZXhdID0gcmVzb2x2ZWQuc2NoZW1hO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjaGVtYSA9IGRlZXBDb3B5KHZhbGlkYXRlLnNjaGVtYSBhcyBKc29uT2JqZWN0KTtcbiAgICAgICAgdmlzaXRKc29uU2NoZW1hKHNjaGVtYSwgdmlzaXRvcik7XG5cbiAgICAgICAgcmV0dXJuIG9mKHNjaGVtYSk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgYW5kIHJldHVybiBhIHZhbGlkYXRpb24gZnVuY3Rpb24gZm9yIHRoZSBTY2hlbWEuXG4gICAqXG4gICAqIEBwYXJhbSBzY2hlbWEgVGhlIHNjaGVtYSB0byB2YWxpZGF0ZS4gSWYgYSBzdHJpbmcsIHdpbGwgZmV0Y2ggdGhlIHNjaGVtYSBiZWZvcmUgY29tcGlsaW5nIGl0XG4gICAqICh1c2luZyBzY2hlbWEgYXMgYSBVUkkpLlxuICAgKiBAcmV0dXJucyBBbiBPYnNlcnZhYmxlIG9mIHRoZSBWYWxpZGF0aW9uIGZ1bmN0aW9uLlxuICAgKi9cbiAgY29tcGlsZShzY2hlbWE6IEpzb25PYmplY3QpOiBPYnNlcnZhYmxlPFNjaGVtYVZhbGlkYXRvcj4ge1xuICAgIGNvbnN0IHNjaGVtYUluZm86IFNjaGVtYUluZm8gPSB7XG4gICAgICBzbWFydERlZmF1bHRSZWNvcmQ6IG5ldyBNYXA8c3RyaW5nLCBKc29uT2JqZWN0PigpLFxuICAgICAgcHJvbXB0RGVmaW5pdGlvbnM6IFtdLFxuICAgIH07XG5cbiAgICB0aGlzLl9hanYucmVtb3ZlU2NoZW1hKHNjaGVtYSk7XG5cbiAgICAvLyBTdXBwb3J0cyBib3RoIHN5bmNocm9ub3VzIGFuZCBhc3luY2hyb25vdXMgY29tcGlsYXRpb24sIGJ5IHRyeWluZyB0aGUgc3luY2hyb25vdXNcbiAgICAvLyB2ZXJzaW9uIGZpcnN0LCB0aGVuIGlmIHJlZnMgYXJlIG1pc3NpbmcgdGhpcyB3aWxsIGZhaWxzLlxuICAgIC8vIFdlIGFsc28gYWRkIGFueSByZWZzIGZyb20gZXh0ZXJuYWwgZmV0Y2hlZCBzY2hlbWFzIHNvIHRoYXQgdGhvc2Ugd2lsbCBhbHNvIGJlIHVzZWRcbiAgICAvLyBpbiBzeW5jaHJvbm91cyAoaWYgYXZhaWxhYmxlKS5cbiAgICBsZXQgdmFsaWRhdG9yOiBPYnNlcnZhYmxlPGFqdi5WYWxpZGF0ZUZ1bmN0aW9uPjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbyA9IHNjaGVtYUluZm87XG4gICAgICB2YWxpZGF0b3IgPSBvZih0aGlzLl9hanYuY29tcGlsZShzY2hlbWEpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBQcm9wYWdhdGUgdGhlIGVycm9yLlxuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIChhanYuTWlzc2luZ1JlZkVycm9yIGFzIHt9IGFzIEZ1bmN0aW9uKSkpIHtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhbGlkYXRvciA9IGZyb20odGhpcy5fYWp2LmNvbXBpbGVBc3luYyhzY2hlbWEpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkYXRvclxuICAgICAgLnBpcGUoXG4gICAgICAgIG1hcCh2YWxpZGF0ZSA9PiAoZGF0YTogSnNvblZhbHVlLCBvcHRpb25zPzogU2NoZW1hVmFsaWRhdG9yT3B0aW9ucykgPT4ge1xuICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25PcHRpb25zOiBTY2hlbWFWYWxpZGF0b3JPcHRpb25zID0ge1xuICAgICAgICAgICAgd2l0aFByb21wdHM6IHRydWUsXG4gICAgICAgICAgICBhcHBseVBvc3RUcmFuc2Zvcm1zOiB0cnVlLFxuICAgICAgICAgICAgYXBwbHlQcmVUcmFuc2Zvcm1zOiB0cnVlLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25Db250ZXh0ID0ge1xuICAgICAgICAgICAgcHJvbXB0RmllbGRzV2l0aFZhbHVlOiBuZXcgU2V0PHN0cmluZz4oKSxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbGV0IHJlc3VsdCA9IG9mKGRhdGEpO1xuICAgICAgICAgIGlmICh2YWxpZGF0aW9uT3B0aW9ucy5hcHBseVByZVRyYW5zZm9ybXMpIHtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnkgaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2lzc3Vlcy8zOTg5XG4gICAgICAgICAgICByZXN1bHQgPSAocmVzdWx0IGFzIGFueSkucGlwZShcbiAgICAgICAgICAgICAgLi4uWy4uLnRoaXMuX3ByZV0ubWFwKHZpc2l0b3IgPT4gY29uY2F0TWFwKChkYXRhOiBKc29uVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlzaXRKc29uKGRhdGEsIHZpc2l0b3IsIHNjaGVtYSwgdGhpcy5fcmVzb2x2ZXIsIHZhbGlkYXRlKTtcbiAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVzdWx0LnBpcGUoXG4gICAgICAgICAgICBzd2l0Y2hNYXAodXBkYXRlRGF0YSA9PiB0aGlzLl9hcHBseVNtYXJ0RGVmYXVsdHMoXG4gICAgICAgICAgICAgIHVwZGF0ZURhdGEsXG4gICAgICAgICAgICAgIHNjaGVtYUluZm8uc21hcnREZWZhdWx0UmVjb3JkLFxuICAgICAgICAgICAgKSksXG4gICAgICAgICAgICBzd2l0Y2hNYXAodXBkYXRlZERhdGEgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsaWRhdGlvbk9wdGlvbnMud2l0aFByb21wdHMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mKHVwZGF0ZWREYXRhKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHZpc2l0b3I6IEpzb25WaXNpdG9yID0gKHZhbHVlLCBwb2ludGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25Db250ZXh0LnByb21wdEZpZWxkc1dpdGhWYWx1ZS5hZGQocG9pbnRlcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIHJldHVybiB2aXNpdEpzb24odXBkYXRlZERhdGEsIHZpc2l0b3IsIHNjaGVtYSwgdGhpcy5fcmVzb2x2ZXIsIHZhbGlkYXRlKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3dpdGNoTWFwKHVwZGF0ZWREYXRhID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbGlkYXRpb25PcHRpb25zLndpdGhQcm9tcHRzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvZih1cGRhdGVkRGF0YSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBkZWZpbml0aW9ucyA9IHNjaGVtYUluZm8ucHJvbXB0RGVmaW5pdGlvbnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGRlZiA9PiAhdmFsaWRhdGlvbkNvbnRleHQucHJvbXB0RmllbGRzV2l0aFZhbHVlLmhhcyhkZWYuaWQpKTtcblxuICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvbXB0UHJvdmlkZXIgJiYgZGVmaW5pdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcm9tKHRoaXMuX2FwcGx5UHJvbXB0cyh1cGRhdGVkRGF0YSwgZGVmaW5pdGlvbnMpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2YodXBkYXRlZERhdGEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN3aXRjaE1hcCh1cGRhdGVkRGF0YSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlLmNhbGwodmFsaWRhdGlvbkNvbnRleHQsIHVwZGF0ZWREYXRhKTtcblxuICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHJlc3VsdCA9PSAnYm9vbGVhbidcbiAgICAgICAgICAgICAgICA/IG9mKFt1cGRhdGVkRGF0YSwgcmVzdWx0XSlcbiAgICAgICAgICAgICAgICA6IGZyb20oKHJlc3VsdCBhcyBQcm9taXNlPGJvb2xlYW4+KVxuICAgICAgICAgICAgICAgICAgLnRoZW4ociA9PiBbdXBkYXRlZERhdGEsIHRydWVdKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6IEVycm9yIHwgQWp2VmFsaWRhdGlvbkVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoZXJyIGFzIEFqdlZhbGlkYXRpb25FcnJvcikuYWp2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGUuZXJyb3JzID0gKGVyciBhcyBBanZWYWxpZGF0aW9uRXJyb3IpLmVycm9ycztcblxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW3VwZGF0ZWREYXRhLCBmYWxzZV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN3aXRjaE1hcCgoW2RhdGEsIHZhbGlkXTogW0pzb25WYWx1ZSwgYm9vbGVhbl0pID0+IHtcbiAgICAgICAgICAgICAgaWYgKHZhbGlkKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IG9mKGRhdGEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRpb25PcHRpb25zLmFwcGx5UG9zdFRyYW5zZm9ybXMpIHtcbiAgICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnkgaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2lzc3Vlcy8zOTg5XG4gICAgICAgICAgICAgICAgICByZXN1bHQgPSAocmVzdWx0IGFzIGFueSkucGlwZShcbiAgICAgICAgICAgICAgICAgICAgLi4uWy4uLnRoaXMuX3Bvc3RdLm1hcCh2aXNpdG9yID0+IGNvbmNhdE1hcCgoZGF0YTogSnNvblZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpc2l0SnNvbihkYXRhLCB2aXNpdG9yLCBzY2hlbWEsIHRoaXMuX3Jlc29sdmVyLCB2YWxpZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5waXBlKFxuICAgICAgICAgICAgICAgICAgbWFwKGRhdGEgPT4gW2RhdGEsIHZhbGlkXSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2YoW2RhdGEsIHZhbGlkXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbWFwKChbZGF0YSwgdmFsaWRdOiBbSnNvblZhbHVlLCBib29sZWFuXSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkYXRhLCBzdWNjZXNzOiB0cnVlIH0gYXMgU2NoZW1hVmFsaWRhdG9yUmVzdWx0O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yczogKHZhbGlkYXRlLmVycm9ycyB8fCBbXSksXG4gICAgICAgICAgICAgIH0gYXMgU2NoZW1hVmFsaWRhdG9yUmVzdWx0O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgYWRkRm9ybWF0KGZvcm1hdDogU2NoZW1hRm9ybWF0KTogdm9pZCB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIGNvbnN0IHZhbGlkYXRlID0gKGRhdGE6IGFueSkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZm9ybWF0LmZvcm1hdHRlci52YWxpZGF0ZShkYXRhKTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVzdWx0LnRvUHJvbWlzZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9hanYuYWRkRm9ybWF0KGZvcm1hdC5uYW1lLCB7XG4gICAgICBhc3luYzogZm9ybWF0LmZvcm1hdHRlci5hc3luYyxcbiAgICAgIHZhbGlkYXRlLFxuICAgIC8vIEFKViB0eXBpbmdzIGxpc3QgYGNvbXBhcmVgIGFzIHJlcXVpcmVkLCBidXQgaXQgaXMgb3B0aW9uYWwuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIH0gYXMgYW55KTtcbiAgfVxuXG4gIGFkZFNtYXJ0RGVmYXVsdFByb3ZpZGVyPFQ+KHNvdXJjZTogc3RyaW5nLCBwcm92aWRlcjogU21hcnREZWZhdWx0UHJvdmlkZXI8VD4pIHtcbiAgICBpZiAodGhpcy5fc291cmNlTWFwLmhhcyhzb3VyY2UpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3Ioc291cmNlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zb3VyY2VNYXAuc2V0KHNvdXJjZSwgcHJvdmlkZXIpO1xuXG4gICAgaWYgKCF0aGlzLl9zbWFydERlZmF1bHRLZXl3b3JkKSB7XG4gICAgICB0aGlzLl9zbWFydERlZmF1bHRLZXl3b3JkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5fYWp2LmFkZEtleXdvcmQoJyRkZWZhdWx0Jywge1xuICAgICAgICBlcnJvcnM6IGZhbHNlLFxuICAgICAgICB2YWxpZDogdHJ1ZSxcbiAgICAgICAgY29tcGlsZTogKHNjaGVtYSwgX3BhcmVudFNjaGVtYSwgaXQpID0+IHtcbiAgICAgICAgICBjb25zdCBjb21waWxhdGlvblNjaGVtSW5mbyA9IHRoaXMuX2N1cnJlbnRDb21waWxhdGlvblNjaGVtYUluZm87XG4gICAgICAgICAgaWYgKGNvbXBpbGF0aW9uU2NoZW1JbmZvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFdlIGNoZWF0LCBoZWF2aWx5LlxuICAgICAgICAgIGNvbXBpbGF0aW9uU2NoZW1JbmZvLnNtYXJ0RGVmYXVsdFJlY29yZC5zZXQoXG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSgoaXQgYXMgYW55KS5kYXRhUGF0aEFyci5zbGljZSgxLCAoaXQgYXMgYW55KS5kYXRhTGV2ZWwgKyAxKSBhcyBzdHJpbmdbXSksXG4gICAgICAgICAgICBzY2hlbWEsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiAoKSA9PiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBtZXRhU2NoZW1hOiB7XG4gICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgJyRzb3VyY2UnOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczogdHJ1ZSxcbiAgICAgICAgICByZXF1aXJlZDogWyAnJHNvdXJjZScgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyVXJpSGFuZGxlcihoYW5kbGVyOiBVcmlIYW5kbGVyKSB7XG4gICAgdGhpcy5fdXJpSGFuZGxlcnMuYWRkKGhhbmRsZXIpO1xuICB9XG5cbiAgdXNlUHJvbXB0UHJvdmlkZXIocHJvdmlkZXI6IFByb21wdFByb3ZpZGVyKSB7XG4gICAgY29uc3QgaXNTZXR1cCA9ICEhdGhpcy5fcHJvbXB0UHJvdmlkZXI7XG5cbiAgICB0aGlzLl9wcm9tcHRQcm92aWRlciA9IHByb3ZpZGVyO1xuXG4gICAgaWYgKGlzU2V0dXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9hanYuYWRkS2V5d29yZCgneC1wcm9tcHQnLCB7XG4gICAgICBlcnJvcnM6IGZhbHNlLFxuICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICBjb21waWxlOiAoc2NoZW1hLCBwYXJlbnRTY2hlbWE6IEpzb25PYmplY3QsIGl0KSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBpbGF0aW9uU2NoZW1JbmZvID0gdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbztcbiAgICAgICAgaWYgKCFjb21waWxhdGlvblNjaGVtSW5mbykge1xuICAgICAgICAgIHJldHVybiAoKSA9PiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICAgICBjb25zdCBwYXRoQXJyYXkgPSAoKGl0IGFzIGFueSkuZGF0YVBhdGhBcnIgYXMgc3RyaW5nW10pLnNsaWNlKDEsIGl0LmRhdGFMZXZlbCArIDEpO1xuICAgICAgICBjb25zdCBwYXRoID0gJy8nICsgcGF0aEFycmF5Lm1hcChwID0+IHAucmVwbGFjZSgvXlxcJy8sICcnKS5yZXBsYWNlKC9cXCckLywgJycpKS5qb2luKCcvJyk7XG5cbiAgICAgICAgbGV0IHR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IGl0ZW1zOiBBcnJheTxzdHJpbmcgfCB7IGxhYmVsOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIH0+IHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgbWVzc2FnZTogc3RyaW5nO1xuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgIG1lc3NhZ2UgPSBzY2hlbWE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWVzc2FnZSA9IHNjaGVtYS5tZXNzYWdlO1xuICAgICAgICAgIHR5cGUgPSBzY2hlbWEudHlwZTtcbiAgICAgICAgICBpdGVtcyA9IHNjaGVtYS5pdGVtcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgIGlmIChwYXJlbnRTY2hlbWEudHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICB0eXBlID0gJ2NvbmZpcm1hdGlvbic7XG4gICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcmVudFNjaGVtYS5lbnVtKSkge1xuICAgICAgICAgICAgdHlwZSA9ICdsaXN0JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHlwZSA9ICdpbnB1dCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdsaXN0JyAmJiAhaXRlbXMpIHtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJlbnRTY2hlbWEuZW51bSkpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnbGlzdCc7XG4gICAgICAgICAgICBpdGVtcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBwYXJlbnRTY2hlbWEuZW51bSkge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgLy8gSW52YWxpZFxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goeyBsYWJlbDogdmFsdWUudG9TdHJpbmcoKSwgdmFsdWUgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWZpbml0aW9uOiBQcm9tcHREZWZpbml0aW9uID0ge1xuICAgICAgICAgIGlkOiBwYXRoLFxuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICBwcmlvcml0eTogMCxcbiAgICAgICAgICByYXc6IHNjaGVtYSxcbiAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICBkZWZhdWx0OiB0eXBlb2YgcGFyZW50U2NoZW1hLmRlZmF1bHQgPT0gJ29iamVjdCcgPyB1bmRlZmluZWQgOiBwYXJlbnRTY2hlbWEuZGVmYXVsdCxcbiAgICAgICAgICBhc3luYyB2YWxpZGF0b3IoZGF0YTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBpdC5zZWxmLnZhbGlkYXRlKHBhcmVudFNjaGVtYSwgZGF0YSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlc3VsdDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbXBpbGF0aW9uU2NoZW1JbmZvLnByb21wdERlZmluaXRpb25zLnB1c2goZGVmaW5pdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IHsgcHJvbXB0RmllbGRzV2l0aFZhbHVlOiBTZXQ8c3RyaW5nPiB9KSB7XG4gICAgICAgICAgLy8gSWYgJ3RoaXMnIGlzIHVuZGVmaW5lZCBpbiB0aGUgY2FsbCwgdGhlbiBpdCBkZWZhdWx0cyB0byB0aGUgZ2xvYmFsXG4gICAgICAgICAgLy8gJ3RoaXMnLlxuICAgICAgICAgIGlmICh0aGlzICYmIHRoaXMucHJvbXB0RmllbGRzV2l0aFZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnByb21wdEZpZWxkc1dpdGhWYWx1ZS5hZGQocGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgbWV0YVNjaGVtYToge1xuICAgICAgICBvbmVPZjogW1xuICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgJ3R5cGUnOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICdtZXNzYWdlJzogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB0cnVlLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsgJ21lc3NhZ2UnIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9hcHBseVByb21wdHM8VD4oZGF0YTogVCwgcHJvbXB0czogQXJyYXk8UHJvbXB0RGVmaW5pdGlvbj4pOiBPYnNlcnZhYmxlPFQ+IHtcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMuX3Byb21wdFByb3ZpZGVyO1xuICAgIGlmICghcHJvdmlkZXIpIHtcbiAgICAgIHJldHVybiBvZihkYXRhKTtcbiAgICB9XG5cbiAgICBwcm9tcHRzLnNvcnQoKGEsIGIpID0+IGIucHJpb3JpdHkgLSBhLnByaW9yaXR5KTtcblxuICAgIHJldHVybiBmcm9tKHByb3ZpZGVyKHByb21wdHMpKS5waXBlKFxuICAgICAgbWFwKGFuc3dlcnMgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHBhdGggaW4gYW5zd2Vycykge1xuICAgICAgICAgIGNvbnN0IHBhdGhGcmFnbWVudHMgPSBwYXRoLnNwbGl0KCcvJykubWFwKHBmID0+IHtcbiAgICAgICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHBmKSkge1xuICAgICAgICAgICAgICByZXR1cm4gcGY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gJ1xcJycgKyBwZiArICdcXCcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgQ29yZVNjaGVtYVJlZ2lzdHJ5Ll9zZXQoXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgcGF0aEZyYWdtZW50cy5zbGljZSgxKSxcbiAgICAgICAgICAgIGFuc3dlcnNbcGF0aF0gYXMge30sXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX3NldChcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgZGF0YTogYW55LFxuICAgIGZyYWdtZW50czogc3RyaW5nW10sXG4gICAgdmFsdWU6IHt9LFxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICBwYXJlbnQ6IGFueSB8IG51bGwgPSBudWxsLFxuICAgIHBhcmVudFByb3BlcnR5Pzogc3RyaW5nLFxuICAgIGZvcmNlPzogYm9vbGVhbixcbiAgKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGYgPSBmcmFnbWVudHNbaV07XG5cbiAgICAgIGlmIChmWzBdID09ICdpJykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBDb3JlU2NoZW1hUmVnaXN0cnkuX3NldChkYXRhW2pdLCBmcmFnbWVudHMuc2xpY2UoaSArIDEpLCB2YWx1ZSwgZGF0YSwgJycgKyBqKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoZi5zdGFydHNXaXRoKCdrZXknKSkge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZGF0YSkuZm9yRWFjaChwcm9wZXJ0eSA9PiB7XG4gICAgICAgICAgQ29yZVNjaGVtYVJlZ2lzdHJ5Ll9zZXQoZGF0YVtwcm9wZXJ0eV0sIGZyYWdtZW50cy5zbGljZShpICsgMSksIHZhbHVlLCBkYXRhLCBwcm9wZXJ0eSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoZi5zdGFydHNXaXRoKCdcXCcnKSAmJiBmW2YubGVuZ3RoIC0gMV0gPT0gJ1xcJycpIHtcbiAgICAgICAgY29uc3QgcHJvcGVydHkgPSBmXG4gICAgICAgICAgLnNsaWNlKDEsIC0xKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFxcJy9nLCAnXFwnJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcXFxyL2csICdcXHInKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFxcZi9nLCAnXFxmJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxcXHQvZywgJ1xcdCcpO1xuXG4gICAgICAgIC8vIFdlIGtub3cgd2UgbmVlZCBhbiBvYmplY3QgYmVjYXVzZSB0aGUgZnJhZ21lbnQgaXMgYSBwcm9wZXJ0eSBrZXkuXG4gICAgICAgIGlmICghZGF0YSAmJiBwYXJlbnQgIT09IG51bGwgJiYgcGFyZW50UHJvcGVydHkpIHtcbiAgICAgICAgICBkYXRhID0gcGFyZW50W3BhcmVudFByb3BlcnR5XSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IGRhdGE7XG4gICAgICAgIHBhcmVudFByb3BlcnR5ID0gcHJvcGVydHk7XG5cbiAgICAgICAgZGF0YSA9IGRhdGFbcHJvcGVydHldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50UHJvcGVydHkgJiYgKGZvcmNlIHx8IHBhcmVudFtwYXJlbnRQcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHBhcmVudFtwYXJlbnRQcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hcHBseVNtYXJ0RGVmYXVsdHM8VD4oXG4gICAgZGF0YTogVCxcbiAgICBzbWFydERlZmF1bHRzOiBNYXA8c3RyaW5nLCBKc29uT2JqZWN0PixcbiAgKTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RpdmVYL3J4anMvaXNzdWVzLzM5ODlcbiAgICByZXR1cm4gKG9mKGRhdGEpIGFzIGFueSkucGlwZShcbiAgICAgIC4uLlsuLi5zbWFydERlZmF1bHRzLmVudHJpZXMoKV0ubWFwKChbcG9pbnRlciwgc2NoZW1hXSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uY2F0TWFwPFQsIFQ+KGRhdGEgPT4ge1xuICAgICAgICAgIGNvbnN0IGZyYWdtZW50cyA9IEpTT04ucGFyc2UocG9pbnRlcik7XG4gICAgICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5fc291cmNlTWFwLmdldCgoc2NoZW1hIGFzIEpzb25PYmplY3QpLiRzb3VyY2UgYXMgc3RyaW5nKTtcblxuICAgICAgICAgIGxldCB2YWx1ZSA9IHNvdXJjZSA/IHNvdXJjZShzY2hlbWEpIDogb2YodW5kZWZpbmVkKTtcblxuICAgICAgICAgIGlmICghaXNPYnNlcnZhYmxlKHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBvZih2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuICh2YWx1ZSBhcyBPYnNlcnZhYmxlPHt9PikucGlwZShcbiAgICAgICAgICAgIC8vIFN5bmNocm9ub3VzbHkgc2V0IHRoZSBuZXcgZGF0YSBhdCB0aGUgcHJvcGVyIEpzb25TY2hlbWEgcGF0aC5cbiAgICAgICAgICAgIHRhcCh4ID0+IENvcmVTY2hlbWFSZWdpc3RyeS5fc2V0KGRhdGEsIGZyYWdtZW50cywgeCkpLFxuICAgICAgICAgICAgLy8gQnV0IHJldHVybiB0aGUgZGF0YSBvYmplY3QuXG4gICAgICAgICAgICBtYXAoKCkgPT4gZGF0YSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG59XG4iXX0=