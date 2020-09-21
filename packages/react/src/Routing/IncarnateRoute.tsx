import React, { createContext, FC, ReactNode, useContext } from 'react';
import { useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import QS from 'qs';
import { Incarnate, LifePod } from '../.';

const URL_DELIMITER = '/';
const QS_OPTIONS = {
  ignoreQueryPrefix: true,
  depth: Infinity,
  parameterLimit: Infinity,
  allowDots: true,
};

export type IncarnateRouteProps = {
  children?: ReactNode | Function;
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
  const location = useLocation();
  const history = useHistory();

  const matchObject: { [key: string]: any } = !!match ? match : {};
  const newRouteProps: { [key: string]: any } = {
    ...matchObject,
    history,
    location,
    params: matchObject.params,
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

  return (
    <RoutePathProvider value={newRoutePath}>
      <RoutePropListProvider value={newRoutePropsList}>
        <LifePod
          name={PATH_NAMES.ROUTE_PROPS_LIST}
          noCache
          override
          factory={() => newRoutePropsList}
        />
        <Incarnate name={PATH_NAMES.ROUTE_PROPS}>
          {Object.keys(newRouteProps).map((k: string) => (
            <LifePod
              key={`${PATH_NAMES.ROUTE_PROPS}:${k}`}
              name={k}
              noCache
              override
              factory={() => newRouteProps[k]}
            />
          ))}
        </Incarnate>
        {renderChildren instanceof Function
          ? (renderChildren as Function)(newRouteProps)
          : renderChildren}
      </RoutePropListProvider>
    </RoutePathProvider>
  );
};
