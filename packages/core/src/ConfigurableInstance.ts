export type ObjectOf<Type> = { [key: string]: Type };

export interface IConfigurableInstance extends ObjectOf<any> {}

export default class ConfigurableInstance implements IConfigurableInstance {
  constructor(config: IConfigurableInstance = {}) {
    Object.assign(this, config);
  }
}
