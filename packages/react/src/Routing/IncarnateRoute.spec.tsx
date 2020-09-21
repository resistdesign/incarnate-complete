import expect from 'expect.js';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { IncarnateRoute } from './IncarnateRoute';
import { MemoryRouter } from 'react-router-dom';

const renderInBrowserRouter = (incRoute: any) =>
  render(<MemoryRouter initialEntries={['']}>{incRoute}</MemoryRouter>);

const suite = {
  beforeEach: () => {
    cleanup();
  },
  'should render': () => {
    const ir = renderInBrowserRouter(<IncarnateRoute />);

    expect(ir).to.be.ok();
  },
  'should render its children': async () => {
    const textContent = 'TEXT_CONTENT';
    const ir = renderInBrowserRouter(
      <IncarnateRoute subPath="/">{textContent}</IncarnateRoute>
    );

    const found = await ir.findByText(textContent);

    expect(found).to.be.ok();
  },
};

export { suite as IncarnateRoute };
