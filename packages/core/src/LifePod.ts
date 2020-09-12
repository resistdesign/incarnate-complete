import HashMatrix, {HashMatrixPathPartType} from './HashMatrix';
import {DependencyDeclaration} from './DependencyDeclaration';
import {ObjectOf} from './ConfigurableInstance';

const getMergedDependencies = (depStructure: DependencyDeclaration = {}, merge?: boolean) => {
    if (merge === false) {
        return depStructure;
    }

    const {
        dependencies,
        getters,
        setters,
        invalidators,
        listeners
    } = depStructure;

    return {
        ...dependencies,
        ...getters,
        ...setters,
        ...invalidators,
        ...listeners
    };
};

/**
 * A container used to resolve a `DependencyDeclaration`.
 * @see DependencyDeclaration
 * */
export default class LifePod extends HashMatrix implements DependencyDeclaration {
    static DEFAULT_NAME = 'LifePod';

    static ERROR_MESSAGES = {
        RESOLUTION_TIMEOUT: 'RESOLUTION_TIMEOUT'
    };

    _dependencies?: ObjectOf<HashMatrix>;

    /**
     * @returns {Object.<HashMatrix>} A map of named dependencies.
     * */
    get dependencies(): ObjectOf<HashMatrix> | undefined {
        return this._dependencies;
    }

    /**
     * @param {Object.<HashMatrix>} value A map of named dependencies.
     * */
    set dependencies(value: ObjectOf<HashMatrix> | undefined) {
        if (!!this._dependencies) {
            this.removeDependencyMapChangeHandlers(this._dependencies);
            this.removeDependencyMapErrorHandlers(this._dependencies);
        }

        this._dependencies = value;

        if (!!this._dependencies) {
            this.addDependencyMapChangeHandlers(this._dependencies);
            this.addDependencyMapErrorHandlers(this._dependencies);
        }
    }

    /**
     * A map of named getters.
     * `getter(path = ''):*`
     * @type {Object.<Function>}
     * */
    getters?: ObjectOf<Function>;

    /**
     * A map of named setters.
     * `setter(value = *, subPath = '')`
     * @type {Object.<Function>}
     * */
    setters?: ObjectOf<Function>;

    /**
     * A map of named invalidators.
     * `invalidator(subPath = '')`
     * @type {Object.<Function>}
     * */
    invalidators?: ObjectOf<Function>;

    /**
     * A map of named change handler receivers.
     * `listen(handler):Function (unlisten)`
     * @type {Object.<Function>}
     * */
    listeners?: ObjectOf<Function>;

    /**
     * The factory function used to create the value of the dependency.
     * @type {Function}
     * @param {DependencyDeclaration} dependencyValues A `DependencyDeclaration` with resolved values rather than paths.
     * @returns {*|Promise} The value of the dependency.
     * */
    factory?: DependencyDeclaration['factory'];

    /**
     * If `true`, the `factory` is NOT called until **none** of the `dependencies` are `undefined`.
     * @type {boolean}
     * */
    strict?: boolean;

    /**
     * Always call the `factory` when calling `getPath`, even if there is an existing value.
     * @type {boolean}
     * */
    noCache?: boolean;

    /**
     * Merge all dependency types into one `Object` when being passed to the `factory`. Default: `true`
     * @type {boolean}
     * */
    mergeDeps?: boolean;

    /**
     * @param {DependencyDeclaration} dependencyDeclaration The `DependencyDeclaration` to be resolved.
     * */
    constructor({
                    dependencies = [],
                    ...cleanDependencyDeclaration
                }: DependencyDeclaration = {}) {
        super(cleanDependencyDeclaration);

        this.dependencies = dependencies;
    }

    handleDependencyChange = () => {
        this.invalidate();
    };

    addDependencyChangeHandler = (dependency?: HashMatrix) => {
        if (dependency instanceof HashMatrix) {
            dependency.addChangeHandler('', this.handleDependencyChange);
        }
    };

    removeDependencyChangeHandler = (dependency?: HashMatrix) => {
        if (dependency instanceof HashMatrix) {
            dependency.removeChangeHandler('', this.handleDependencyChange);
        }
    };

    addDependencyMapChangeHandlers = (dependencyMap: ObjectOf<HashMatrix> = {}) => {
        Object
            .keys(dependencyMap)
            .forEach(k => this.addDependencyChangeHandler(dependencyMap[k]));
    };

    removeDependencyMapChangeHandlers = (dependencyMap: ObjectOf<HashMatrix> = {}) => {
        Object
            .keys(dependencyMap)
            .forEach(k => this.removeDependencyChangeHandler(dependencyMap[k]));
    };

    handleDependencyError = (error?: any, path?: HashMatrixPathPartType, causePath?: string, target?: string) => {
        const dependencyError = new Error('A dependency failed to resolve.');

        if (typeof error === 'object') {
            (dependencyError as ObjectOf<any>).source = {
                error,
                path,
                causePath,
                target
            };
        }

        this.setError([], dependencyError);
    };

    addDependencyErrorHandler = (dependency?: HashMatrix) => {
        if (dependency instanceof HashMatrix) {
            dependency.addErrorHandler('', this.handleDependencyError);
        }
    };

    removeDependencyErrorHandler = (dependency?: HashMatrix) => {
        if (dependency instanceof HashMatrix) {
            dependency.removeErrorHandler('', this.handleDependencyError);
        }
    };

    addDependencyMapErrorHandlers = (dependencyMap: ObjectOf<HashMatrix | undefined> = {}) => {
        Object
            .keys(dependencyMap)
            .forEach(k => this.addDependencyErrorHandler(dependencyMap[k]));
    };

    removeDependencyMapErrorHandlers = (dependencyMap: ObjectOf<HashMatrix | undefined> = {}) => {
        Object
            .keys(dependencyMap)
            .forEach(k => this.removeDependencyErrorHandler(dependencyMap[k]));
    };

    resolveDependency(dependency?: HashMatrix) {
        if (dependency instanceof HashMatrix) {
            return dependency.getValue();
        }
    }

    resolveDependencyMap(dependencyMap: ObjectOf<HashMatrix | undefined> = {}): DependencyDeclaration | void {
        const dependencyValueMap: ObjectOf<any> = {};
        const resolvedDependencyDeclaration: DependencyDeclaration = {
            dependencies: dependencyValueMap,
            getters: this.getters,
            setters: this.setters,
            invalidators: this.invalidators,
            listeners: this.listeners
        };

        for (const k in dependencyMap) {
            const dep: HashMatrix | undefined = dependencyMap[k];
            const depValue = this.resolveDependency(dep);

            if (this.strict && typeof depValue === 'undefined') {
                return;
            } else {
                dependencyValueMap[k] = depValue;
            }
        }

        return resolvedDependencyDeclaration;
    }

    async handleFactoryPromise(factoryPromise: Promise<any>) {
        if (!!factoryPromise) {
            let value = undefined;

            try {
                value = await factoryPromise;
            } catch (error) {
                this.setError([], error);
            }

            this.resolving = false;

            super.setPath([], value);
        }
    }

    resolving = false;

    resolve() {
        let resolvedValue;

        if (!this.resolving) {
            this.resolving = true;

            if (this.factory instanceof Function) {
                const resolvedDependencyDeclaration = this.resolveDependencyMap(this.dependencies);

                if (typeof resolvedDependencyDeclaration !== 'undefined') {
                    try {
                        resolvedValue = this.factory(getMergedDependencies(
                            resolvedDependencyDeclaration,
                            this.mergeDeps
                        ));
                    } catch (error) {
                        this.setError(
                            [],
                            error
                        );
                    }

                    if (resolvedValue instanceof Promise) {
                        this.handleFactoryPromise(resolvedValue);
                    } else {
                        this.resolving = false;
                    }
                } else {
                    // No resolved dependencies.
                    resolvedValue = undefined;

                    this.resolving = false;
                }
            } else {
                resolvedValue = super.getPath([]);

                this.resolving = false;
            }
        }

        return resolvedValue;
    }

    /**
     * @override
     * */
    getPath(path: HashMatrixPathPartType) {
        const directValue = super.getPath([]);

        let value;

        if (typeof directValue === 'undefined' || this.noCache) {
            const resolvedDirectValue = this.resolve();

            if (this.resolving) {
                value = undefined;
            } else {
                super.setPath([], resolvedDirectValue);

                value = super.getPath(path);
            }
        } else {
            value = super.getPath(path);
        }

        return value;
    }

    /**
     * The same as `getPath` but asynchronous and will wait for a value.
     * */
    async getPathAsync(path: HashMatrixPathPartType, timeoutMS?: number) {
        const pathString = this.getPathString(path);

        return new Promise((res, rej) => {
            let timeoutIdentifier: any = undefined;

            const handlers = {
                remove: () => {
                    clearTimeout(timeoutIdentifier);
                    this.removeChangeHandler(pathString, handlers.onChange);
                    this.removeErrorHandler(pathString, handlers.onError);
                },
                onChange: () => {
                    try {
                        const value = this.getPath(path);

                        if (typeof value !== 'undefined') {
                            handlers.remove();

                            res(value);
                        }
                    } catch (error) {
                        const {message = ''} = error || {};

                        handlers.remove();

                        rej({
                            message,
                            subject: this,
                            data: path,
                            error
                        });
                    }
                },
                onError: (e: any) => {
                    handlers.remove();

                    rej(e);
                }
            };

            this.addChangeHandler(pathString, handlers.onChange);
            this.addErrorHandler(pathString, handlers.onError);

            if (typeof timeoutMS === 'number') {
                timeoutIdentifier = setTimeout(() => handlers.onError(new Error(LifePod.ERROR_MESSAGES.RESOLUTION_TIMEOUT)), timeoutMS);
            }

            handlers.onChange();
        });
    }

    /**
     * The same as `getValue` but asynchronous and will wait for a value.
     * */
    async getValueAsync(timeoutMS?: number) {
        return this.getPathAsync([], timeoutMS);
    }
}
