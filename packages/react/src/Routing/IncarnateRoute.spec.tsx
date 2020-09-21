import expect from 'expect.js';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { IncarnateRoute } from './IncarnateRoute';
import { MemoryRouter } from 'react-router-dom';
import { IncarnateRouteSet } from './IncarnateRouteSet';

const renderInMemoryRouter = (incRoute: any, props?: { [key: string]: any }) =>
  render(
    <MemoryRouter initialEntries={['']} {...props}>
      {incRoute}
    </MemoryRouter>
  );

const suite = {
  beforeEach: () => {
    cleanup();
  },
  'should render': () => {
    const ir = renderInMemoryRouter(<IncarnateRoute />);

    expect(ir).to.be.ok();
  },
  'should render its children': async () => {
    const textContent = 'TEXT_CONTENT';
    const ir = renderInMemoryRouter(
      <IncarnateRoute subPath="/">{textContent}</IncarnateRoute>
    );

    const found = await ir.findByText(textContent);

    expect(found).to.be.ok();
  },
  'should render the correct route': async () => {
    const shownText = 'SHOWN_TEXT';
    const hiddenText = 'HIDDEN_TEXT';
    const ir = renderInMemoryRouter(
      <IncarnateRouteSet>
        <IncarnateRoute subPath="shown">{shownText}</IncarnateRoute>
        <IncarnateRoute subPath="hidden">{hiddenText}</IncarnateRoute>
      </IncarnateRouteSet>,
      {
        initialEntries: ['/shown'],
      }
    );

    let shownResult, hiddenResult;

    try {
      shownResult = await ir.findByText(shownText);
      hiddenResult = await ir.findByText(hiddenText);
    } catch (error) {
      // Ignore.
    }

    expect(shownResult).to.be.ok();
    expect(hiddenResult).to.not.be.ok();
  },
  'should render the correct nested route': async () => {
    const shownText = 'SHOWN_TEXT';
    const hiddenText = 'HIDDEN_TEXT';
    const ir = renderInMemoryRouter(
      <IncarnateRouteSet>
        <IncarnateRoute subPath="shown">
          <IncarnateRouteSet>
            <IncarnateRoute subPath="nested">{shownText}</IncarnateRoute>
            <IncarnateRoute subPath="hidden">{hiddenText}</IncarnateRoute>
          </IncarnateRouteSet>
        </IncarnateRoute>
        <IncarnateRoute subPath="hidden">{hiddenText}</IncarnateRoute>
      </IncarnateRouteSet>,
      {
        initialEntries: ['/shown/nested'],
      }
    );

    let shownResult, hiddenResult;

    try {
      shownResult = await ir.findByText(shownText);
      hiddenResult = await ir.findByText(hiddenText);
    } catch (error) {
      // Ignore.
    }

    expect(shownResult).to.be.ok();
    expect(hiddenResult).to.not.be.ok();
  },
  'should render the correct nested route with params': async () => {
    const hiddenText = 'HIDDEN_TEXT';
    const nestedParamValue = 'NESTED_PARAM_VALUE';
    const ir = renderInMemoryRouter(
      <IncarnateRouteSet>
        <IncarnateRoute subPath="shown">
          <IncarnateRouteSet>
            <IncarnateRoute subPath=":nested">
              {({ params }) => <div>{params.nested}</div>}
            </IncarnateRoute>
            <IncarnateRoute subPath="hidden">{hiddenText}</IncarnateRoute>
          </IncarnateRouteSet>
        </IncarnateRoute>
        <IncarnateRoute subPath="hidden">{hiddenText}</IncarnateRoute>
      </IncarnateRouteSet>,
      {
        initialEntries: [`/shown/${nestedParamValue}`],
      }
    );

    let nestedParamValueResult, hiddenResult;

    try {
      nestedParamValueResult = await ir.findByText(nestedParamValue);
      hiddenResult = await ir.findByText(hiddenText);
    } catch (error) {
      // Ignore.
    }

    expect(nestedParamValueResult).to.be.ok();
    expect(hiddenResult).to.not.be.ok();
  },
};

export { suite as IncarnateRoute };
