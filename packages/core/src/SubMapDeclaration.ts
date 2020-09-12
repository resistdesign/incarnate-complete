import { IConfigurableInstance, ObjectOf } from './ConfigurableInstance';
import { DependencyDeclaration } from './DependencyDeclaration';
import { HashMatrixPathPartType } from './HashMatrix';

/**
 * Declare an available map of dependencies.
 * */
export interface SubMapDeclaration extends IConfigurableInstance {
  /**
   * The map of dependencies.
   * @type {Object.<DependencyDeclaration>}
   * */
  subMap?: ObjectOf<DependencyDeclaration | true>;

  /**
   * The dependencies from the current level that should be shared to the `subMap`.
   * Keys are the keys from the `subMap`, values are the paths to the dependencies to be shared.
   * @type {Object.<string>}
   * */
  shared?: ObjectOf<HashMatrixPathPartType>;
}
