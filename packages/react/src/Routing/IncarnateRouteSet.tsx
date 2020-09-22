import React, { FC, PropsWithChildren } from 'react';
import { IncarnateRedirect, IncarnateRoute } from '../.';

export type IncarnateRouteSetProps = {
  defaultSubPath?: string;
} & PropsWithChildren<any>;

export const IncarnateRouteSet: FC<IncarnateRouteSetProps> = props => {
  const { children, defaultSubPath } = props;

  return (
    <>
      {typeof defaultSubPath === 'string' && (
        <IncarnateRoute subPath="/" exact>
          <IncarnateRedirect to={defaultSubPath} replace />
        </IncarnateRoute>
      )}
      {children}
    </>
  );
};
