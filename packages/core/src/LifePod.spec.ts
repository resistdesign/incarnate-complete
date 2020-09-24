import expect from 'expect.js';
import LifePod from './LifePod';

const suite = {
  'should be a class': () => {
    expect(LifePod).to.be.a(Function);
  },
  getValue: {
    'should resolve a synchronous value': () => {
      const lifePod = new LifePod({
        factory: () => {
          return 'Tomato';
        },
      });
      const testDep = lifePod.getValue();

      expect(testDep).to.equal('Tomato');
    },
  },
  getValueAsync: {
    'should resolve an asynchronous value': async () => {
      const lifePod = new LifePod({
        factory: async () => {
          return 'Tomato';
        },
      });
      const testDep = await lifePod.getValueAsync();

      expect(testDep).to.equal('Tomato');
    },
  },
};

export { suite as LifePod };
