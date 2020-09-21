import expect from 'expect.js';
import React, { FC } from 'react';
import { cleanup, render } from '@testing-library/react';
import { IncarnateRouter } from './IncarnateRouter';
import { MemoryRouter } from 'react-router-dom';

const IncarnateMemoryRouter: FC<any> = props => (
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
};

export { suite as IncarnateRouter };
