import expect from 'expect.js';
import { HashMatrix } from './index';

const suite = {
  'should be a class': () => {
    expect(HashMatrix).to.be.a(Function);
  },
  'should immutably set values in a nested structure': () => {
    const targetPath = 'Target.Path';
    const targetSubPath = 'Target.Path.Sub';
    const tpObj = {};
    const tspValue = 'TARGET_SUB_PATH_VALUE';
    const hm = new HashMatrix();

    hm.setPath(targetPath, tpObj);

    const initialTPVCheck = hm.getPath(targetPath);

    hm.setPath(targetSubPath, tspValue);

    const finalTPVCheck = hm.getPath(targetPath);
    const tspValueCheck = hm.getPath(targetSubPath);

    expect(initialTPVCheck).to.equal(tpObj);
    expect(finalTPVCheck).to.not.equal(initialTPVCheck);
    expect(tspValueCheck).to.equal(tspValue);
  },
  invalidate: {
    'should set the HashMatrix value to `undefined`': () => {
      const hm = new HashMatrix({ hashMatrix: {} });
      const initialHMValue = hm.getValue();

      hm.invalidate();

      const finalHMValue = hm.getValue();

      expect(initialHMValue).to.be.an(Object);
      expect(finalHMValue).to.be(undefined);
    },
  },
  addChangeHandler: {
    'should notify listeners when the value of a path has changed': () => {
      const testHMValue = { one: { two: 'VALUE_TWO' } };
      const anotherTestValue = 'ANOTHER_TEST_VALUE';
      const valuePath = 'one.two';
      const hm = new HashMatrix({ hashMatrix: testHMValue });

      let v1: any, v2: any;

      const l1 = () => (v1 = hm.getPath(valuePath));
      const l2 = () => (v2 = hm.getPath(valuePath));
      const initialPathValue = hm.getPath(valuePath);

      hm.addChangeHandler(valuePath, l1);
      hm.addChangeHandler(valuePath, l2);

      hm.setPath(valuePath, anotherTestValue);

      hm.removeChangeHandler(valuePath, l1);
      hm.removeChangeHandler(valuePath, l2);

      expect(initialPathValue).to.equal(testHMValue.one.two);
      expect(v1).to.equal(anotherTestValue);
      expect(v2).to.equal(anotherTestValue);
    },
  },
  preventInvalidation: {
    'should prevent the HashMatrix value from being set to `undefined`': () => {
      const testHMValue = {};
      const hm = new HashMatrix({
        hashMatrix: testHMValue,
        preventInvalidation: true,
      });
      const initialHMValue = hm.getValue();

      hm.invalidate();

      const finalHMValue = hm.getValue();

      expect(initialHMValue).to.equal(testHMValue);
      expect(finalHMValue).to.equal(testHMValue);
    },
  },
  debounceInvalidationMS: {
    'should delay the invalidation of the HashMatrix by the given number of milliseconds': async () => {
      const debounceValues = {
        before: 50,
        actual: 100,
        after: 200,
      };
      const testHMValue = {};
      const hm = new HashMatrix({
        hashMatrix: testHMValue,
        debounceInvalidationMS: debounceValues.actual,
      });
      const initialHMValue = hm.getValue();

      hm.invalidate();

      const beforeTimeHMValue = await new Promise(res =>
        setTimeout(() => res(hm.getValue()), debounceValues.before)
      );
      const afterTimeHMValue = await new Promise(res =>
        setTimeout(() => res(hm.getValue()), debounceValues.after)
      );

      expect(initialHMValue).to.equal(testHMValue);
      expect(beforeTimeHMValue).to.equal(testHMValue);
      expect(afterTimeHMValue).to.be(undefined);
    },
  },
};

export { suite as HashMatrix };
