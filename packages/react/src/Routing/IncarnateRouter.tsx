import React, { FC } from 'react';
import { Incarnate, IncarnateProps } from '../.';
import { IncarnateRoute } from './IncarnateRoute';

const DEFAULT_ROUTE_PATH = '/';

export type IncarnateRouterProps = {
  name?: string;
  inc?: IncarnateProps;
};

export const IncarnateRouter: FC<IncarnateRouterProps> = props => {
  const { children, name, inc } = props;

  return (
    <Incarnate {...{ ...inc, name }}>
      <IncarnateRoute subPath={DEFAULT_ROUTE_PATH}>{children}</IncarnateRoute>
    </Incarnate>
  );
};
