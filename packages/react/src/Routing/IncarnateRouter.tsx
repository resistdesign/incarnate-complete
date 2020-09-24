import React, { FC } from 'react';
import { Incarnate, IncarnateProps } from '../Incarnate';
import { IncarnateRoute } from './IncarnateRoute';
import {
  BrowserRouter,
  Router,
  MemoryRouter,
  HashRouter,
  StaticRouter,
} from 'react-router-dom';

const DEFAULT_ROUTE_PATH = '/';

export type IncarnateRouterProps = {
  name?: string;
  inc?: IncarnateProps;
  routerType?:
    | typeof BrowserRouter
    | typeof Router
    | typeof MemoryRouter
    | typeof HashRouter
    | typeof StaticRouter;
  routerProps?: { [key: string]: any };
};

export const IncarnateRouter: FC<IncarnateRouterProps> = props => {
  const {
    children,
    name,
    inc,
    routerType = BrowserRouter,
    routerProps,
  } = props;
  const RouterClass = routerType as any;

  return (
    <Incarnate {...{ ...inc, name }}>
      <RouterClass {...routerProps}>
        <IncarnateRoute subPath={DEFAULT_ROUTE_PATH}>{children}</IncarnateRoute>
      </RouterClass>
    </Incarnate>
  );
};
