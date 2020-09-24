import expect from 'expect.js';
import React, { FC } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render } from '@testing-library/react';
import { IncarnateRoute } from './IncarnateRoute';
import { IncarnateRouteSet } from './IncarnateRouteSet';
import { LifePod } from '../.';
import { IncarnateRouter, IncarnateRouterProps } from './IncarnateRouter';

const IncarnateMemoryRouter: FC<IncarnateRouterProps> = props => (
  <IncarnateRouter
    routerType={MemoryRouter}
    routerProps={{
      initialEntries: [''],
    }}
    {...props}
  />
);
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
  'should supply ROUTE_PROPS to Incarnate components': async () => {
    const paramValue = 'PARAM_VALUE';
    const anotherParamValue = 'ANOTHER_PARAM_VALUE';

    const ir = render(
      <IncarnateMemoryRouter
        routerProps={{
          initialEntries: [`/shown/${paramValue}/${anotherParamValue}`],
        }}
      >
        <IncarnateRouteSet>
          <IncarnateRoute subPath="shown">
            <IncarnateRouteSet>
              <IncarnateRoute subPath=":value">
                <LifePod
                  dependencies={{
                    params: 'ROUTE_PROPS.params',
                  }}
                  mapToProps={({ params: { value: children } }) => ({
                    children,
                  })}
                >
                  <div />
                </LifePod>
                <IncarnateRoute subPath=":anotherValue">
                  <LifePod
                    dependencies={{
                      params: 'ROUTE_PROPS.params',
                    }}
                    mapToProps={({ params: { anotherValue: children } }) => ({
                      children,
                    })}
                  >
                    <div />
                  </LifePod>
                </IncarnateRoute>
              </IncarnateRoute>
            </IncarnateRouteSet>
          </IncarnateRoute>
        </IncarnateRouteSet>
      </IncarnateMemoryRouter>
    );

    const paramValueResult = await ir.findByText(paramValue);
    const anotherParamValueResult = await ir.findByText(anotherParamValue);

    expect(paramValueResult).to.be.ok();
    expect(anotherParamValueResult).to.be.ok();
  },
  'should update ROUTE_PROPS when the history location changes': async () => {
    const testTextPrefix = 'PRODUCT=';

    let history: any;

    const ir = render(
      <IncarnateMemoryRouter
        routerProps={{
          initialEntries: ['/multiply/2/2'],
        }}
      >
        <IncarnateRoute subPath="multiply/:x/:y">
          <LifePod
            dependencies={{
              routeProps: 'ROUTE_PROPS',
            }}
            mapToProps={({ routeProps }) => {
              const { params: { x = 2, y = 2 } = {} } = routeProps || {
                params: {},
              };
              const product = parseInt(`${x}`, 10) * parseInt(`${y}`);

              history = routeProps.history;

              return { children: `${testTextPrefix}${product}` };
            }}
          >
            <div />
          </LifePod>
        </IncarnateRoute>
      </IncarnateMemoryRouter>
    );
    const initialFound = await ir.findByText([testTextPrefix, 4].join(''));

    await new Promise(res => {
      let resTO: any;

      const unlisten = history.listen(() => {
        clearTimeout(resTO);

        unlisten();

        res();
      });

      resTO = setTimeout(res, 1000);
      history.push('/multiply/3/6');
    });

    const finalFound = await ir.findByText([testTextPrefix, 18].join(''));

    expect(initialFound).to.be.ok();
    expect(finalFound).to.be.ok();
  },
};

export { suite as IncarnateRoute };
