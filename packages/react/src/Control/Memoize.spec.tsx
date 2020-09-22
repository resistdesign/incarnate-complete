import expect from 'expect.js';
import React from 'react';
import { render } from '@testing-library/react';
import { Memoize } from './Memoize';
import { Incarnate, LifePod } from '../.';

const suite = {
  'should render': () => {
    const m = render(
      <Incarnate>
        <Memoize name="Mem" dependencyPath="Something" />
      </Incarnate>
    );

    expect(m).to.be.ok();
  },
  'should keep a history of the values of the target dependency': () => {
    const depPath = 'Dep.Path';
    const testValueList = [...new Array(10)].map((_x, i) => `TEST_ITEM_${i}`);

    let memValue: any;

    const m = render(
      <Incarnate>
        <Memoize name="Mem" dependencyPath={depPath} />
        <LifePod
          name="DepUpdater"
          setters={{
            setDepPath: depPath,
          }}
          factory={({ setDepPath }) => {
            testValueList.forEach(it => setDepPath(it));
          }}
        />
        <LifePod
          name="MemWatcher"
          dependencies={{
            mem: 'Mem',
          }}
          factory={({ mem }) => {
            memValue = mem;
          }}
        />
      </Incarnate>
    );

    expect(m).to.be.ok();
    expect(memValue).to.eql([undefined, ...testValueList]);
  },
  'should filter memoized values': () => {
    const depPath = 'Dep.Path';
    const testValueList = [...new Array(10)].map((_x, i) => `TEST_ITEM_${i}`);

    let memValue: any;

    const m = render(
      <Incarnate>
        <Memoize
          name="Mem"
          dependencyPath={depPath}
          filter={v => typeof v !== 'undefined'}
        />
        <LifePod
          name="DepUpdater"
          setters={{
            setDepPath: depPath,
          }}
          factory={({ setDepPath }) => {
            testValueList.forEach(it => setDepPath(it));
          }}
        />
        <LifePod
          name="MemWatcher"
          dependencies={{
            mem: 'Mem',
          }}
          factory={({ mem }) => {
            memValue = mem;
          }}
        />
      </Incarnate>
    );

    expect(m).to.be.ok();
    expect(memValue).to.eql(testValueList);
  },
};

export { suite as Memoize };
