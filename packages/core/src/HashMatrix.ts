import ConfigurableInstance, {
  IConfigurableInstance,
  ObjectOf,
} from './ConfigurableInstance';

export type HashMatrixPathPartType = string | string[];

export interface IHashMatrix extends IConfigurableInstance {
  /**
   * The name of this `HashMatrix`.
   * @type {string}
   * */
  name?: string;

  /**
   * The target path for a proxied `HashMatrix`.
   * @type {Array|string}
   * */
  targetPath?: string | string[];

  /**
   * An automatically maintained structure that acts as the source of all values.
   * If set a to a `HashMatrix`, it will be proxied.
   * @type {Object.<*>|HashMatrix}
   * */
  hashMatrix?: any | ObjectOf<any> | HashMatrix;

  /**
   * The `string` used to delimit all paths.
   * @type {string}
   * */
  pathDelimiter?: string;

  /**
   * An optional number of milliseconds to wait before invalidating the value of the `HashMatrix`.
   * @type {number}
   * */
  debounceInvalidationMS?: number;

  /**
   * An optional flag used to prevent invalidation and keep the current value of the `HashMatrix`.
   * @type {boolean}
   * */
  preventInvalidation?: boolean;
}

/**
 * An object used to invalidate a path.
 * */
const INVALID = {};

/**
 * Easily manage a data structure that can be dynamically built
 * from paths with out throwing errors for accessing undefined
 * portions of the structure.
 * */
export default class HashMatrix extends ConfigurableInstance {
  static DEFAULT_NAME = 'HashMatrix';
  static DEFAULT_PATH_DELIMITER = '.';
  static ERRORS: ObjectOf<string> = {
    INVALID_PATH_DELIMITER: 'INVALID_PATH_DELIMITER',
  };

  static keyIsNumeric(key: string | number) {
    let numeric = false;

    try {
      numeric = Number.isInteger(parseInt(`${key}`, 10));
    } catch (error) {
      // Ignore.
    }

    return numeric;
  }

  _changeHandlerMap: ObjectOf<Function[]> = {};

  _errorHandlerMap: ObjectOf<Function[]> = {};

  /**
   * The name of this `HashMatrix`.
   * @type {string}
   * */
  name?: string;

  /**
   * The target path for a proxied `HashMatrix`.
   * @type {Array|string}
   * */
  targetPath?: string | string[];

  /**
   * An automatically maintained structure that acts as the source of all values.
   * If set a to a `HashMatrix`, it will be proxied.
   * @type {Object.<*>|HashMatrix}
   * */
  hashMatrix?: any | ObjectOf<any> | HashMatrix;

  /**
   * The `string` used to delimit all paths.
   * @type {string}
   * */
  pathDelimiter?: string;

  /**
   * An optional number of milliseconds to wait before invalidating the value of the `HashMatrix`.
   * @type {number}
   * */
  debounceInvalidationMS?: number;

  /**
   * An optional flag used to prevent invalidation and keep the current value of the `HashMatrix`.
   * @type {boolean}
   * */
  preventInvalidation?: boolean;

  constructor(config: IHashMatrix = {}) {
    super(config);

    if (typeof this.pathDelimiter !== 'string') {
      this.pathDelimiter = HashMatrix.DEFAULT_PATH_DELIMITER;
    }

    this._setDefaultName();
  }

  _setDefaultName() {
    if (!this.hasOwnProperty('name')) {
      if (
        typeof (this.constructor as ObjectOf<any>).DEFAULT_NAME === 'string'
      ) {
        this.name = (this.constructor as ObjectOf<any>).DEFAULT_NAME;
      } else {
        this.name = HashMatrix.DEFAULT_NAME;
      }
    }
  }

  getChangeHandlerList(path: HashMatrixPathPartType) {
    const pathString = this.getPathString(path);

    return this._changeHandlerMap[pathString] || [];
  }

  setChangeHandlerList(
    path: HashMatrixPathPartType,
    handlerList: Function[] = []
  ) {
    const pathString = this.getPathString(path);

    this._changeHandlerMap[pathString] = handlerList;
  }

  addChangeHandler(
    path: HashMatrixPathPartType = '',
    handler: Function
  ): Function | void {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.addChangeHandler(
        this.getPathArray(path, this.targetPath),
        handler
      );
    }

    if (!!handler) {
      const handlerList: Function[] = this.getChangeHandlerList(path);

      if (handlerList.indexOf(handler) === -1) {
        handlerList.push(handler);

        this.setChangeHandlerList(path, handlerList);

        return () => this.removeChangeHandler(path, handler);
      }
    }
  }

  removeChangeHandler(
    path: HashMatrixPathPartType = '',
    handler: Function
  ): void {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.removeChangeHandler(
        this.getPathArray(path, this.targetPath),
        handler
      );
    }

    const handlerList = this.getChangeHandlerList(path);

    if (handlerList.indexOf(handler) !== -1) {
      const newHandlerList: Function[] = [];

      handlerList.forEach(h => {
        if (h !== handler) {
          newHandlerList.push(h);
        }
      });

      this.setChangeHandlerList(path, newHandlerList);
    }
  }

  onChange(path: HashMatrixPathPartType, causePath: string) {
    const handlerList = this.getChangeHandlerList(path);

    handlerList.forEach(h => h(path, causePath, this));
  }

  getErrorHandlerList(path: HashMatrixPathPartType): Function[] {
    const pathString = this.getPathString(path);

    return this._errorHandlerMap[pathString] || [];
  }

  setErrorHandlerList(
    path: HashMatrixPathPartType,
    handlerList: Function[] = []
  ) {
    const pathString = this.getPathString(path);

    this._errorHandlerMap[pathString] = handlerList;
  }

  addErrorHandler(
    path: HashMatrixPathPartType = '',
    handler: Function
  ): Function | void {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.addErrorHandler(
        this.getPathArray(path, this.targetPath),
        handler
      );
    }

    if (!!handler) {
      const handlerList = this.getErrorHandlerList(path);

      if (handlerList.indexOf(handler) === -1) {
        handlerList.push(handler);

        this.setErrorHandlerList(path, handlerList);

        return () => this.removeErrorHandler(path, handler);
      }
    }
  }

  removeErrorHandler(
    path: HashMatrixPathPartType = '',
    handler: Function
  ): void {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.removeErrorHandler(
        this.getPathArray(path, this.targetPath),
        handler
      );
    }

    const handlerList = this.getErrorHandlerList(path);

    if (handlerList.indexOf(handler) !== -1) {
      const newHandlerList: Function[] = [];

      handlerList.forEach(h => {
        if (h !== handler) {
          newHandlerList.push(h);
        }
      });

      this.setErrorHandlerList(path, newHandlerList);
    }
  }

  onError(error: any, path: HashMatrixPathPartType, causePath: string) {
    const handlerList = this.getErrorHandlerList(path);

    handlerList.forEach((h: Function) => h(error, path, causePath, this));
  }

  getBasePathArray(path: HashMatrixPathPartType = ''): string[] {
    return path instanceof Array
      ? [...path]
      : path === ''
      ? []
      : `${path}`.split(this.pathDelimiter as string);
  }

  getPathArray(
    path: HashMatrixPathPartType = '',
    prefixPath: HashMatrixPathPartType = ''
  ): string[] {
    const prefixPathArray = this.getBasePathArray(prefixPath);
    const pathArray = this.getBasePathArray(path);

    return [...prefixPathArray, ...pathArray];
  }

  getPathString(
    path?: HashMatrixPathPartType,
    prefixPath?: HashMatrixPathPartType
  ): string {
    return this.getPathArray(path, prefixPath).join(this.pathDelimiter);
  }

  dispatchChanges(path?: string | string[]) {
    const pathArray = this.getPathArray(path);
    const pathString = this.getPathString(pathArray);

    // Notify lifecycle listeners of changes all the way up the path.

    if (pathArray.length) {
      const currentPath = [...pathArray];

      // TRICKY: Start with the deepest path and move up to the most shallow.
      while (currentPath.length) {
        this.onChange(
          // Path as a string.
          this.getPathString(currentPath),
          // The cause path.
          pathString
        );
        currentPath.pop();
      }
    }

    this.onChange('', pathString);
  }

  dispatchErrors(error: any, path: HashMatrixPathPartType) {
    const pathArray = this.getPathArray(path);
    const pathString = this.getPathString(pathArray);

    // Notify lifecycle listeners of errors all the way up the path.

    if (pathArray.length) {
      const currentPath = [...pathArray];

      // TRICKY: Start with the deepest path and move up to the most shallow.
      while (currentPath.length) {
        this.onError(
          // The error.
          error,
          // Path as a string.
          this.getPathString(currentPath),
          // The cause path.
          pathString
        );
        currentPath.pop();
      }
    }

    this.onError(error, '', pathString);
  }

  _setErrorInternal(path: HashMatrixPathPartType, error: any): void {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.setError(
        this.getPathArray(path, this.targetPath),
        error
      );
    }

    this.dispatchErrors(error, path);
  }

  setError(path: HashMatrixPathPartType, error: any) {
    return this._setErrorInternal(path, error);
  }

  _getPathInternal(path?: HashMatrixPathPartType): any {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.getPath(this.getPathArray(path, this.targetPath));
    }

    const pathArray = this.getPathArray(path);

    if (pathArray.length) {
      let value,
        currentValue = this.hashMatrix,
        finished = true;

      for (const part of pathArray) {
        // Don't fail, just return `undefined`.
        try {
          currentValue = currentValue?.[part];
        } catch (error) {
          finished = false;
          break;
        }
      }

      // TRICKY: Don't select the current value if the full path wasn't processed.
      if (finished) {
        value = currentValue;
      }

      return value;
    } else {
      return this.hashMatrix;
    }
  }

  getPath(path?: HashMatrixPathPartType) {
    return this._getPathInternal(path);
  }

  _setPathInternal(path?: HashMatrixPathPartType, value?: any): void {
    if (this.hashMatrix instanceof HashMatrix) {
      return this.hashMatrix.setPath(
        this.getPathArray(path, this.targetPath),
        value
      );
    }

    const targetValue = value === INVALID ? undefined : value;
    const pathArray = this.getPathArray(path);

    // TRICKY: DO NOT set if the value is exactly equal.
    if (targetValue !== this._getPathInternal(path)) {
      const newHashMatrix = {
        ...this.hashMatrix,
      };

      if (pathArray.length) {
        const lastIndex = pathArray.length - 1;
        const lastPart = pathArray[lastIndex];

        let currentValue = newHashMatrix;

        for (let i = 0; i < lastIndex; i++) {
          const part = pathArray[i];
          const nextPart = pathArray[i + 1];

          // TRICKY: Build out the tree is it's not there.
          if (typeof currentValue[part] === 'undefined') {
            currentValue[part] = HashMatrix.keyIsNumeric(nextPart) ? [] : {};
          } else if (currentValue[part] instanceof Array) {
            currentValue[part] = [...currentValue[part]];
          } else if (currentValue[part] instanceof Object) {
            currentValue[part] = {
              ...currentValue[part],
            };
          }

          currentValue = currentValue[part];
        }

        currentValue[lastPart] = targetValue;

        this.hashMatrix = newHashMatrix;
      } else {
        this.hashMatrix = targetValue;
      }

      this.dispatchChanges(pathArray);
    } else if (value === INVALID) {
      this.dispatchChanges(pathArray);
    }
  }

  setPath(path: HashMatrixPathPartType, value: any) {
    return this._setPathInternal(path, value);
  }

  invalidatePath(path: HashMatrixPathPartType) {
    this.setPath(path, INVALID);
  }

  getValue() {
    return this.getPath([]);
  }

  setValue(value: any) {
    return this.setPath([], value);
  }

  _invalidationDebounceTimeout?: any;

  invalidate() {
    if (!this.preventInvalidation) {
      if (typeof this.debounceInvalidationMS === 'number') {
        clearTimeout(this._invalidationDebounceTimeout);
        this._invalidationDebounceTimeout = setTimeout(
          () => this.setValue(INVALID),
          this.debounceInvalidationMS
        );
      } else {
        this.setValue(INVALID);
      }
    }
  }
}
