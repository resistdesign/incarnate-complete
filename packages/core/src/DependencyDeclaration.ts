/**
 * Declare an available dependency with various types of requirements.
 * */
import ConfigurableInstance, {ObjectOf} from './ConfigurableInstance';

export default class DependencyDeclaration extends ConfigurableInstance {
    /**
     * A map of named dependencies.
     * @type {Object.<string|*>}
     * */
    dependencies?: ObjectOf<any>;

    /**
     * A map of named getters.
     * @type {Object.<string|Function>}
     * */
    getters?: ObjectOf<Function>;

    /**
     * A map of named setters.
     * @type {Object.<string|Function>}
     * */
    setters?: ObjectOf<Function>;

    /**
     * A map of named invalidators.
     * @type {Object.<string|Function>}
     * */
    invalidators?: ObjectOf<Function>;

    /**
     * A map of named change handler receivers.
     * @type {Object.<string|Function>}
     * */
    listeners?: ObjectOf<Function>;

    /**
     * The factory function used to create the value of the dependency.
     * @type {Function}
     * @param {DependencyDeclaration} dependencyValues A `DependencyDeclaration` with resolved values rather than paths.
     * @returns {*|Promise} The value of the dependency.
     * */
    factory?: (dependencyValues: ObjectOf<any>) => Promise<any> | any;

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
}
