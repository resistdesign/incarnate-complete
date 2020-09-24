import expect from 'expect.js';
import React, { FC } from 'react';
import { cleanup, render } from '@testing-library/react';
import { IncarnateRoute, IncarnateRouter, IncarnateRouterProps } from '../.';
import { MemoryRouter } from 'react-router-dom';
import { IncarnateRouteSet } from './IncarnateRouteSet';

const IncarnateMemoryRouter: FC<IncarnateRouterProps> = props => (
  <IncarnateRouter
    routerType={MemoryRouter}
    routerProps={{
      initialEntries: [''],
    }}
    {...props}
  />
);

const suite = {
  beforeEach: () => cleanup(),
  'should render': async () => {
    const testText = 'TEST_TEXT';
    const irs = render(
      <IncarnateMemoryRouter>
        <IncarnateRouteSet>{testText}</IncarnateRouteSet>
      </IncarnateMemoryRouter>
    );
    const found = await irs.findByText(testText);

    expect(found).to.be.ok();
  },
  'should redirect to the defaultSubPath when no subPath is supplied': async () => {
    const testText = 'TEST_TEXT';
    const subPath = 'sub-path';
    const irs = render(
      <IncarnateMemoryRouter>
        <IncarnateRouteSet defaultSubPath={subPath}>
          <IncarnateRoute subPath={subPath}>{testText}</IncarnateRoute>
        </IncarnateRouteSet>
      </IncarnateMemoryRouter>
    );
    const found = await irs.findByText(testText);

    expect(found).to.be.ok();
  },
  'should NOT redirect to the defaultSubPath when a subPath IS supplied': async () => {
    const goodText = 'GOOD_TEXT';
    const badText = 'BAD_TEXT';
    const goodPath = 'good-path';
    const badPath = 'bad-path';
    const irs = render(
      <IncarnateMemoryRouter
        routerProps={{
          initialEntries: [`/${goodPath}`],
        }}
      >
        <IncarnateRouteSet defaultSubPath={badPath}>
          <IncarnateRoute subPath={badPath}>{badText}</IncarnateRoute>
          <IncarnateRoute subPath={goodPath}>{goodText}</IncarnateRoute>
        </IncarnateRouteSet>
      </IncarnateMemoryRouter>
    );
    const foundGood = await irs.findByText(goodText);

    let foundBad;

    try {
      foundBad = await irs.findByText(badText);
    } catch (error) {
      // Ignore
    }

    expect(foundGood).to.be.ok();
    expect(foundBad).to.be(undefined);
  },
};

export { suite as IncarnateRouteSet };
