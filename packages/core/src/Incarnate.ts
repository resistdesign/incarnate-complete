import HashMatrix, { HashMatrixPathPartType } from './HashMatrix';
import LifePod from './LifePod';
import { ObjectOf } from './ConfigurableInstance';
import { DependencyDeclaration } from './DependencyDeclaration';
import { SubMapDeclaration } from './SubMapDeclaration';

const STANDARD_DEPENDENCY_NAMES = {
  GLOBAL: 'GLOBAL',
};
const STANDARD_DEPENDENCIES = {
  [STANDARD_DEPENDENCY_NAMES.GLOBAL]: {
    factory: () => window || global,
  },
};

/**
 * Manage the lifecycle of application dependencies.
 * Use dependencies as application entry-points and keep track of live changes.
 * */
export default class Incarnate extends HashMatrix {
  static DEFAULT_NAME = 'Incarnate';

  /**
   * The names of the dependencies supplied with a standard instance of `Incarnate`.
   * @type {Object.<string>}
   * */
  static STANDARD_DEPENDENCY_NAMES = STANDARD_DEPENDENCY_NAMES;

  static ERRORS = {
    UNSATISFIED_SHARED_DEPENDENCY: 'UNSATISFIED_SHARED_DEPENDENCY',
  };

  /**
   * The map of dependency and subMap declarations.
   * @type {Object.<DependencyDeclaration|SubMapDeclaration|Incarnate|LifePod|HashMatrix>}
   * */
  subMap?: ObjectOf<
    DependencyDeclaration | SubMapDeclaration | Incarnate | LifePod | HashMatrix
  >;

  _parsedSubMap: ObjectOf<HashMatrix> = {};

  /**
   * If `true`, `LifePod` factories will NOT be called until **none** of the `dependencies` are `undefined`.
   * @type {boolean}
   * */
  strict?: boolean;

  /**
   * @param {SubMapDeclaration} subMapDeclaration The `SubMapDeclaration` to be managed.
   * */
  constructor(subMapDeclaration: SubMapDeclaration = {}) {
    super(subMapDeclaration);

    if (!(this.hashMatrix instanceof Object)) {
      this.hashMatrix = {};
    }

    this.subMap = {
      ...STANDARD_DEPENDENCIES,
      ...this.subMap,
    };
  }

  createLifePod(
    name?: string,
    dependencyDeclaration: DependencyDeclaration = {}
  ) {
    const {
      dependencies = {},
      getters = {},
      setters = {},
      invalidators = {},
      listeners = {},
      strict = this.strict,
      pathDelimiter = this.pathDelimiter,
      ...otherConfig
    }: DependencyDeclaration = dependencyDeclaration;
    const newDependencyDeclaration: DependencyDeclaration = {
      ...otherConfig,
      name: this.getPathString(name, this.name),
      targetPath: name,
      hashMatrix: this,
      dependencies: this.getDependenciesFromMap(dependencies),
      getters: this.createFromMap(getters, this.createGetter),
      setters: this.createFromMap(setters, this.createSetter),
      invalidators: this.createFromMap(invalidators, this.createInvalidator),
      listeners: this.createFromMap(listeners, this.createListener),
      strict,
      pathDelimiter,
    };

    return new LifePod(newDependencyDeclaration);
  }

  createIncarnate(name?: string, subMapDeclaration: SubMapDeclaration = {}) {
    const {
      subMap = {},
      shared = {},
      strict = this.strict,
      pathDelimiter = this.pathDelimiter,
      ...otherConfig
    }: SubMapDeclaration = subMapDeclaration;
    const parsedSharedMap = Object.keys(shared).reduce(
      (acc: ObjectOf<HashMatrix>, k) => {
        const p = shared[k];

        acc[k] = this.getDependency(p);

        return acc;
      },
      {}
    );
    const subMapWithShared = {
      ...subMap,
      ...parsedSharedMap,
    };
    const newSubMapDeclaration: SubMapDeclaration = {
      ...otherConfig,
      name: this.getPathString(name, this.name),
      targetPath: name,
      hashMatrix: this,
      subMap: subMapWithShared,
      strict,
      pathDelimiter,
    };

    for (const k in subMap) {
      const depDec = subMap[k];

      if (depDec === true && !shared.hasOwnProperty(k)) {
        throw {
          message: Incarnate.ERRORS.UNSATISFIED_SHARED_DEPENDENCY,
          data: k,
          subject: subMapDeclaration,
          context: this,
        };
      }
    }

    return new Incarnate(newSubMapDeclaration);
  }

  convertDeclaration(
    name?: string,
    declaration: DependencyDeclaration | SubMapDeclaration | HashMatrix = {}
  ) {
    if (declaration instanceof HashMatrix) {
      return declaration;
    }

    const { subMap } = declaration;

    if (subMap instanceof Object) {
      return this.createIncarnate(name, declaration);
    } else {
      return this.createLifePod(name, declaration);
    }
  }

  /**
   * Get a dependency by path.
   * @param {Array|string} path The path to the dependency.
   * @returns {Incarnate|LifePod|HashMatrix} The dependency.
   * */
  getDependency = (path: HashMatrixPathPartType = ''): HashMatrix => {
    const pathArray = this.getPathArray(path);
    const pathString = this.getPathString(pathArray);

    if (!pathArray.length) {
      return this;
    }

    const name = pathArray.shift() || '';
    const stringName = `${name}`;
    const subPath = [...pathArray];

    if (
      !this._parsedSubMap.hasOwnProperty(stringName) &&
      this.subMap?.hasOwnProperty(stringName)
    ) {
      this._parsedSubMap[stringName] = this.convertDeclaration(
        name,
        this.subMap[stringName]
      );
    }

    const dep = this._parsedSubMap[stringName];

    if (dep instanceof Incarnate) {
      return dep.getDependency(subPath);
    } else if (!!dep) {
      if (subPath.length) {
        if (dep instanceof LifePod) {
          return new LifePod({
            name: pathString,
            targetPath: subPath,
            hashMatrix: dep,
            strict: this.strict,
          });
        } else {
          return new HashMatrix({
            name: pathString,
            targetPath: subPath,
            hashMatrix: dep,
          });
        }
      } else {
        return dep;
      }
    } else {
      return new HashMatrix({
        name: pathString,
        targetPath: [name, ...subPath],
        hashMatrix: this,
      });
    }
  };

  getDependenciesFromMap(
    dependencyMap: ObjectOf<string> = {}
  ): ObjectOf<HashMatrix> {
    return Object.keys(dependencyMap).reduce((acc: ObjectOf<HashMatrix>, k) => {
      const depPath = dependencyMap[k];
      acc[k] = this.getDependency(depPath);

      return acc;
    }, {});
  }

  createFromMap(
    map: ObjectOf<HashMatrixPathPartType | Function> = {},
    creator: (path?: HashMatrixPathPartType) => Function
  ): ObjectOf<Function> {
    return Object.keys(map).reduce((acc: ObjectOf<Function>, k) => {
      const pathOrFunction = map[k];

      if (pathOrFunction instanceof Function) {
        acc[k] = pathOrFunction;
      } else {
        acc[k] = creator(pathOrFunction);
      }

      return acc;
    }, {});
  }

  createGetter = (path?: HashMatrixPathPartType) => {
    return (subPath = []) => {
      // TRICKY: Get the `dep` "just in time" to avoid recursion.
      const dep = this.getDependency(path);

      return dep.getPath(subPath);
    };
  };

  createSetter = (path?: HashMatrixPathPartType) => {
    return (value?: any, subPath = []) => {
      // TRICKY: Get the `dep` "just in time" to avoid recursion.
      const dep = this.getDependency(path);

      return dep.setPath(subPath, value);
    };
  };

  createInvalidator = (path?: HashMatrixPathPartType) => {
    return (subPath = []) => {
      // TRICKY: Get the `dep` "just in time" to avoid recursion.
      const dep = this.getDependency(path);

      return dep.invalidatePath(subPath);
    };
  };

  createListener = (path?: HashMatrixPathPartType) => {
    return (handler: Function, subPath = []) => {
      // TRICKY: Get the `dep` "just in time" to avoid recursion.
      const dep = this.getDependency(path);

      return dep.addChangeHandler(subPath, handler);
    };
  };

  /**
   * The same as `getPath` but triggers `LifePod` dependency resolution.
   * */
  getResolvedPath(path?: HashMatrixPathPartType) {
    const dep = this.getDependency(path);

    if (dep instanceof LifePod) {
      return dep.getValue();
    } else {
      return this.getPath(path);
    }
  }

  /**
   * The same as `getPath` but triggers `LifePod` dependency resolution and waits for a value.
   * */
  async getResolvedPathAsync(path: HashMatrixPathPartType, timeoutMS?: number) {
    const dep = this.getDependency(path);

    if (dep instanceof LifePod) {
      return await dep.getValueAsync(timeoutMS);
    } else {
      return this.getPath(path);
    }
  }
}
