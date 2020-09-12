/**
 * Declare an available dependency with various types of requirements.
 * */
import { IConfigurableInstance, ObjectOf } from './ConfigurableInstance';
import { HashMatrixPathPartType } from './HashMatrix';

export interface DependencyDeclaration extends IConfigurableInstance {
  /**
   * A map of named dependencies.
   * @type {Object.<string|*>}
   * */
  dependencies?: ObjectOf<HashMatrixPathPartType | any>;

  /**
   * A map of named getters.
   * @type {Object.<string|Function>}
   * */
  getters?: ObjectOf<HashMatrixPathPartType | Function>;

  /**
   * A map of named setters.
   * @type {Object.<string|Function>}
   * */
  setters?: ObjectOf<HashMatrixPathPartType | Function>;

  /**
   * A map of named invalidators.
   * @type {Object.<string|Function>}
   * */
  invalidators?: ObjectOf<HashMatrixPathPartType | Function>;

  /**
   * A map of named change handler receivers.
   * @type {Object.<string|Function>}
   * */
  listeners?: ObjectOf<HashMatrixPathPartType | Function>;

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
