import expect from 'expect.js';
import {ConfigurableInstance} from './index';
import {IConfigurableInstance} from './ConfigurableInstance';

export default {
  ConfigurableInstance: {
    'should be a class': () => {
      expect(ConfigurableInstance).to.be.a(Function);
    },
    'should assign values to itself from the config parameter': () => {
      const configurableInstance: IConfigurableInstance = new ConfigurableInstance({
        testProperty: 'Heirloom'
      });
      const {testProperty} = configurableInstance;

      expect(testProperty).to.equal('Heirloom');
    }
  }
};
