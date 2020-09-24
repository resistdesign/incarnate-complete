import expect from 'expect.js';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { LifePod } from './LifePod';
import { Incarnate } from './Incarnate';

const suite = {
  beforeEach: () => cleanup(),
  'should render': () => {
    const lp = render(<LifePod />);

    expect(lp).to.be.ok();
  },
  'should render its children': async () => {
    const textContent = 'TEXT_CONTENT';
    const lp = render(<LifePod factory={() => true}>{textContent}</LifePod>);
    const found = await lp.findByText(textContent);

    expect(found).to.be.ok();
  },
  'should attach itself to a parent Incarnate': () => {
    const testValue = 'TEST_VALUE';

    let depValue;

    render(
      <Incarnate>
        <LifePod name="TestValue" factory={() => testValue} />
        <LifePod
          dependencies={{
            tv: 'TestValue',
          }}
          factory={({ tv }) => (depValue = tv)}
        />
      </Incarnate>
    );

    expect(depValue).to.equal(testValue);
  },
  'should resolve values asynchronously': async () => {
    const testValue = 'TEST_VALUE';

    let depValue: string | undefined;

    await new Promise((res, rej) => {
      render(
        <Incarnate>
          <LifePod name="TestValue" factory={() => testValue} />
          <LifePod
            dependencies={{
              tv: 'TestValue',
            }}
            factory={async ({ tv }) => {
              depValue = tv;

              res();
            }}
          />
        </Incarnate>
      );

      try {
        expect(depValue).to.be(undefined);
      } catch (error) {
        rej(error);
      }
    });

    expect(depValue).to.equal(testValue);
  },
  'should resolve dependencies asynchronously': async () => {
    const testValue = 'TEST_VALUE';

    let depValue: string | undefined;

    await new Promise((res, rej) => {
      render(
        <Incarnate>
          <LifePod name="TestValue" factory={async () => testValue} />
          <LifePod
            dependencies={{
              tv: 'TestValue',
            }}
            factory={({ tv }) => {
              depValue = tv;

              if (typeof depValue !== 'undefined') {
                res();
              }
            }}
          />
        </Incarnate>
      );

      try {
        expect(depValue).to.be(undefined);
      } catch (error) {
        rej(error);
      }
    });

    expect(depValue).to.equal(testValue);
  },
  'should resolve dependencies from a nested Incarnate': () => {
    const nestedTextValue = 'NESTED_TEXT_VALUE';

    let depValue;

    render(
      <Incarnate>
        <Incarnate name="Nested">
          <LifePod name="Value" factory={() => nestedTextValue} />
        </Incarnate>
        <LifePod
          dependencies={{
            nv: 'Nested.Value',
          }}
          factory={({ nv }) => (depValue = nv)}
        />
      </Incarnate>
    );

    expect(depValue).to.equal(nestedTextValue);
  },
  'should resolve asynchronous dependencies from a nested Incarnate': async () => {
    const nestedTextValue = 'NESTED_TEXT_VALUE';

    let depValue: string | undefined;

    await new Promise((res, rej) => {
      render(
        <Incarnate>
          <Incarnate name="Nested">
            <LifePod name="Value" factory={async () => nestedTextValue} />
          </Incarnate>
          <LifePod
            dependencies={{
              nv: 'Nested.Value',
            }}
            factory={({ nv }) => {
              depValue = nv;

              if (typeof depValue !== 'undefined') {
                res();
              }
            }}
          />
        </Incarnate>
      );

      try {
        expect(depValue).to.be(undefined);
      } catch (error) {
        rej(error);
      }
    });

    expect(depValue).to.equal(nestedTextValue);
  },
  'should map dependencies to props': async () => {
    const depValue = 'DEP_VALUE';
    const lp = render(
      <Incarnate>
        <LifePod name="Dep" factory={() => depValue} />
        <LifePod
          dependencies={{
            dep: 'Dep',
          }}
          mapToProps={({ dep: children }) => ({ children })}
        >
          <div />
        </LifePod>
      </Incarnate>
    );
    const depValueResult = await lp.findByText(depValue);

    expect(depValueResult).to.be.ok();
  },
  'should store an error at the errorDependencyPath': async () => {
    const errorValue = { message: 'ERROR_VALUE' };
    const errorDepPath = 'Errors.TargetDepError';
    const lp = render(
      <Incarnate>
        <LifePod
          name="DepWithError"
          factory={() => {
            throw errorValue;
          }}
          errorDependencyPath={errorDepPath}
        />
        <LifePod
          name="TargetDep"
          dependencies={{
            dep: 'DepWithError',
          }}
          mapToProps={({ dep: children }) => ({ children })}
        >
          <div />
        </LifePod>
        <LifePod
          name="ErrorDisplay"
          dependencies={{
            ev: errorDepPath,
          }}
          factory={({ ev }) => ({ children: ev?.message })}
        >
          <div />
        </LifePod>
      </Incarnate>
    );
    const found = await lp.findByText(errorValue.message);

    expect(found).to.be.ok();
  },
};

export { suite as LifePod };
