import expect from 'expect.js';
import React, { FC } from 'react';
import { cleanup, render } from '@testing-library/react';
import { IncarnateRouter, IncarnateRouterProps } from './IncarnateRouter';
import { MemoryRouter } from 'react-router-dom';
import { IncarnateRoute } from './IncarnateRoute';

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
  'should render': () => {
    const ir = render(<IncarnateMemoryRouter />);

    expect(ir).to.be.ok();
  },
  'should render its children': async () => {
    const textContent = 'TEXT_CONTENT';
    const ir = render(
      <IncarnateMemoryRouter>{textContent}</IncarnateMemoryRouter>
    );
    const found = await ir.findByText(textContent);

    expect(found).to.be.ok();
  },
  'should render IncarnateRoute components': async () => {
    const textContent = 'TEXT_CONTENT';
    const ir = render(
      <IncarnateMemoryRouter
        routerProps={{
          initialEntries: ['/shown'],
        }}
      >
        <IncarnateRoute subPath="shown">{textContent}</IncarnateRoute>
      </IncarnateMemoryRouter>
    );
    const found = await ir.findByText(textContent);

    expect(found).to.be.ok();
  },
};

export { suite as IncarnateRouter };
