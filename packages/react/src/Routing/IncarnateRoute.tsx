import React, { createContext, FC, ReactNode, useContext } from 'react';
import { useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import { History, Location } from 'history';
import QS from 'qs';
import { LifePod } from '../.';

const URL_DELIMITER = '/';
const QS_OPTIONS = {
  ignoreQueryPrefix: true,
  depth: Infinity,
  parameterLimit: Infinity,
  allowDots: true,
};

export type IncarnateRouteValues = {
  history: History<any>;
  location: Location<any>;
  params: { [key: string]: any };
  query: { [key: string]: any };
  setQuery: (query: { [key: string]: any }) => void;
  [key: string]: any;
};
export type IncarnateRouteProps = {
  children?: ReactNode | ((routeValues: IncarnateRouteValues) => any);
  subPath?: string;
  strict?: boolean;
  exact?: boolean;
  sensitive?: boolean;
  isDefault?: boolean;
};

export const getQueryObjectFromLocation = ({ search = '' } = {}) => {
  return QS.parse(search, QS_OPTIONS);
};
export const createQueryString = (query = {}) => {
  return QS.stringify(query, QS_OPTIONS);
};
export const getUrl = (parentUrl = '', url = '') => {
  const parentEndsWithDelimiter =
    parentUrl.split('').reverse()[0] === URL_DELIMITER;
  const urlStartsWithDelimiter = url.split('')[0] === URL_DELIMITER;

  if (parentEndsWithDelimiter && urlStartsWithDelimiter) {
    const newParent = parentUrl.slice(0, -1);

    return `${newParent}${url}`;
  } else if (parentEndsWithDelimiter || urlStartsWithDelimiter) {
    return `${parentUrl}${url}`;
  } else {
    return `${parentUrl}${URL_DELIMITER}${url}`;
  }
};
export const ROUTE_PATH_DELIMITER = '/';
export const PATH_NAMES = {
  ROUTE_PROPS_LIST: 'ROUTE_PROPS_LIST',
  ROUTE_PROPS: 'ROUTE_PROPS',
};
export const IncarnateRoutePathContext = createContext<string>('');
export const IncarnateRoutePropListContext = createContext<any[]>([]);

const { Provider: RoutePathProvider } = IncarnateRoutePathContext;
const { Provider: RoutePropListProvider } = IncarnateRoutePropListContext;

export const IncarnateRoute: FC<IncarnateRouteProps> = props => {
  const { children, subPath = '', isDefault = false, ...routeProps } = props;
  const currentRoutePath = useContext(IncarnateRoutePathContext);
  const newRoutePath = getUrl(currentRoutePath, subPath);
  const parentMatchHookValue = useRouteMatch({
    path: getUrl(currentRoutePath),
    ...routeProps,
  });
  const parentMatch = isDefault ? parentMatchHookValue : null;
  const newMatch = useRouteMatch({
    path: newRoutePath,
    ...routeProps,
  });
  const match = isDefault && parentMatch ? parentMatch || newMatch : newMatch;
  const renderChildren = !!match
    ? typeof children !== 'undefined'
      ? children
      : null
    : null;
  const routePropsList = useContext(IncarnateRoutePropListContext);
  const location = useLocation<any>() as any;
  const history = useHistory<any>() as any;
  const matchObject: { [key: string]: any } = !!match ? match : {};
  const newRouteProps: IncarnateRouteValues = {
    ...matchObject,
    history,
    location,
    params: { ...matchObject.params },
    query: getQueryObjectFromLocation(location),
    setQuery: (query = {}) => {
      const { pathname } = location;

      if (!!history) {
        history.push({
          pathname,
          search: createQueryString(query),
        });
      }
    },
  };
  const newRoutePropsList = [newRouteProps, ...routePropsList];

  return !!match ? (
    <RoutePathProvider value={newRoutePath}>
      <RoutePropListProvider value={newRoutePropsList}>
        <LifePod
          name={PATH_NAMES.ROUTE_PROPS_LIST}
          noCache
          override
          factory={() => newRoutePropsList}
        />
        <LifePod
          name={PATH_NAMES.ROUTE_PROPS}
          noCache
          override
          factory={() => newRouteProps}
        />
        {renderChildren instanceof Function
          ? (renderChildren as Function)(newRouteProps)
          : renderChildren}
      </RoutePropListProvider>
    </RoutePathProvider>
  ) : null;
};
