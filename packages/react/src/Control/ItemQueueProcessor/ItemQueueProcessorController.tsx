import Queue from './Queue';

export type ItemQueueProcessorControllerConfig = {
  /**
   * @type {Queue}
   * */
  errorQueue: Queue;

  /**
   * @type {Function}
   * */
  getInputMap: () => { [key: string]: any };

  /**
   * @type {Function}
   * */
  getErrorMap: () => { [key: string]: any };

  /**
   * @type {Function}
   * */
  setInputMap: (inputMap: { [key: string]: any }) => void;

  /**
   * @type {Function}
   * */
  setErrorMap: (errorMap: { [key: string]: any }) => void;

  /**
   * @type {Function}
   * */
  invalidateQueueUpdater: () => void;
};

export default class ItemQueueProcessorController {
  /**
   * @type {Queue}
   * */
  errorQueue: Queue;

  /**
   * @type {Function}
   * */
  getInputMap: () => { [key: string]: any };

  /**
   * @type {Function}
   * */
  getErrorMap: () => { [key: string]: any };

  /**
   * @type {Function}
   * */
  setInputMap: (inputMap: { [key: string]: any }) => void;

  /**
   * @type {Function}
   * */
  setErrorMap: (errorMap: { [key: string]: any }) => void;

  /**
   * @type {Function}
   * */
  invalidateQueueUpdater: () => void;

  constructor(config: ItemQueueProcessorControllerConfig) {
    this.errorQueue = config.errorQueue;
    this.getInputMap = config.getInputMap;
    this.getErrorMap = config.getErrorMap;
    this.setInputMap = config.setInputMap;
    this.setErrorMap = config.setErrorMap;
    this.invalidateQueueUpdater = config.invalidateQueueUpdater;
  }

  getNewInputMap = () => ({ ...this.getInputMap() });

  getAllInputKeys = () => Object.keys(this.getNewInputMap());

  getNewErrorMap = () => ({ ...this.getErrorMap() });

  getAllErrorKeys = () => Object.keys(this.getNewErrorMap());

  dismissErrorList = (keys: string[] = [], cancelItems = false) => {
    const newErrorMap = this.getNewErrorMap();

    this.setErrorMap(
      Object.keys(newErrorMap)
        .filter((k: string) => keys.indexOf(k) === -1)
        .reduce<{ [key: string]: any }>(
          (acc, k) => ({
            ...acc,
            [k]: newErrorMap[k],
          }),
          {}
        )
    );

    if (cancelItems) {
      const newInputMap = this.getNewInputMap();

      this.setInputMap(
        Object.keys(newInputMap)
          .filter((k: string) => keys.indexOf(k) === -1)
          .reduce<{ [key: string]: any }>(
            (acc, k) => ({
              ...acc,
              [k]: newInputMap[k],
            }),
            {}
          )
      );
    }
  };

  dismissError = (key: string, cancelItem = false) =>
    this.dismissErrorList([key], cancelItem);

  dismissAllErrors = (cancelItems = false) =>
    this.dismissErrorList(this.getAllErrorKeys(), cancelItems);

  retryErrorList = (keys: string[] = []) => {
    this.dismissErrorList(keys);

    this.errorQueue.removeKeys(keys);
    this.invalidateQueueUpdater();
  };

  retryError = (key: string) => this.retryErrorList([key]);

  retryAllErrors = () => this.retryErrorList(this.getAllErrorKeys());
}
