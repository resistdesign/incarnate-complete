import { ConfigurableInstance } from '@incarnate/core';
import { ObjectOf } from '../../../types/base';

export interface ISystemsManager {
  getParameter: Function;
}

/**
 * Load named configurations from parameter storage.
 * */
export default class ConfigLoader extends ConfigurableInstance {
  static getFullPath = (basePath = '', name = '') => {
    return `${basePath}/${name}`.replace(/\/\//g, '/');
  };

  /**
   * The base path for all configurations to be loaded.
   * @type {string}
   * */
  basePath?: string;

  /**
   * The Systems Manager instance.
   * @type {ISystemsManager}
   * */
  ssm?: ISystemsManager;

  _cache: ObjectOf<any> = {};

  /**
   * Load a configuration by name.
   * @param {string} name The name of the configuration.
   * @param {boolean} useCache Use a cached value if available, and cache the value if not.
   * @returns {string} The configuration data.
   * */
  loadConfig = async (name = '', useCache = true) => {
    let configData = undefined;

    if (useCache && this._cache.hasOwnProperty(name)) {
      configData = this._cache[name];
    } else if (!!this.ssm) {
      const {
        Parameter: { Value },
      } = await this.ssm
        .getParameter({
          Name: ConfigLoader.getFullPath(this.basePath, name),
          WithDecryption: true,
        })
        .promise();
      configData = Value;

      if (useCache) {
        this._cache[name] = configData;
      }
    } else {
      throw new Error('ssm is required.');
    }

    return configData;
  };

  /**
   * Load a configuration by name.
   * @param {string} name The name of the configuration.
   * @param {boolean} useCache Use a cached value if available, and cache the value if not.
   * @returns {string} The configuration data.
   * */
  loadJSONConfig = async (name = '', useCache = true) => {
    const configData = await this.loadConfig(name, useCache);

    return typeof configData === 'undefined'
      ? configData
      : JSON.parse(configData);
  };
}
