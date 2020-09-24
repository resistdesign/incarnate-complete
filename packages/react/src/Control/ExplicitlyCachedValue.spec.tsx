import expect from 'expect.js';
import React from 'react';
import { render } from '@testing-library/react';
import { ExplicitlyCachedValue } from './ExplicitlyCachedValue';
import { Incarnate, LifePod } from '../.';

const suite = {
  'should render': () => {
    const ecv = render(
      <Incarnate>
        <ExplicitlyCachedValue name="ECV" dependencyPath="Something" />
      </Incarnate>
    );

    expect(ecv).to.be.ok();
  },
  'should cache a value despite invalidation of the target dependency': () => {
    const testValue = 'TEST_VALUE';
    const dependencyPath = 'Dep.Path';

    let depPathValue: any, ultimateECValue: any;

    const ecv = render(
      <Incarnate>
        <ExplicitlyCachedValue name="ECV" dependencyPath={dependencyPath} />
        <LifePod
          name="TestPod"
          getters={{
            getECV: 'ECV',
            getDepPath: dependencyPath,
          }}
          setters={{
            setDepPath: dependencyPath,
          }}
          invalidators={{
            invalidateDepPath: dependencyPath,
          }}
          factory={({ getECV, getDepPath, setDepPath, invalidateDepPath }) => {
            setDepPath(testValue);
            invalidateDepPath();

            depPathValue = getDepPath();
            ultimateECValue = getECV();
          }}
        />
      </Incarnate>
    );

    expect(ecv).to.be.ok();
    expect(depPathValue).to.be(undefined);
    expect(ultimateECValue).to.equal(testValue);
  },
};

export { suite as ExplicitlyCachedValue };
