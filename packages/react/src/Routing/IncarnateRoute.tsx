import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import { History, Location } from 'history';
import QS from 'qs';
import INC from '@incarnate/core';
import { ProxyIncarnate } from './ProxyIncarnate';
import { IncarnateContext } from '../Context';

const URL_DELIMITER = '/';
const QS_OPTIONS = {
  ignoreQueryPrefix: true,
  depth: Infinity,
  parameterLimit: Infinity,
  allowDots: true,
};

export type IncarnateRouteValues = {
  history: History;
  location: Location;
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
  ROUTE_PROPS: 'ROUTE_PROPS',
};
export const IncarnateRoutePathContext = createContext<string>('');

const { Provider: RoutePathProvider } = IncarnateRoutePathContext;
const { Provider: IncarnateProvider } = IncarnateContext;

export const IncarnateRoute: FC<IncarnateRouteProps> = props => {
  const { children, subPath = '', isDefault = false, ...routeProps } = props;
  const currentRoutePath = useContext(IncarnateRoutePathContext);
  const newRoutePath = getUrl(currentRoutePath, subPath);
  const location = useLocation();
  const parentMatchHookValue = useRouteMatch({
    path: getUrl(currentRoutePath),
    ...routeProps,
    location,
  });
  const parentMatch = isDefault ? parentMatchHookValue : null;
  const newMatch = useRouteMatch({
    path: newRoutePath,
    ...routeProps,
    location,
  });
  const match = isDefault && parentMatch ? parentMatch || newMatch : newMatch;
  const renderChildren = !!match
    ? typeof children !== 'undefined'
      ? children
      : null
    : null;
  const history = useHistory<any>() as any;
  const matchObject: { [key: string]: any } = !!match ? match : {};
  const newRouteProps: IncarnateRouteValues = {
    ...matchObject,
    history,
    location: location as Location,
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
  const routePropsInvalidator = useRef<Function | undefined>(undefined);
  const parentIncarnate = useContext(IncarnateContext);
  const routeContextIncarnate = useMemo<INC>(
    () =>
      new ProxyIncarnate(
        parentIncarnate,
        new INC({
          subMap: {
            [PATH_NAMES.ROUTE_PROPS]: {
              invalidators: {
                invalidateSelf: PATH_NAMES.ROUTE_PROPS,
              },
              factory: ({ invalidateSelf }) => {
                routePropsInvalidator.current = invalidateSelf;

                return newRouteProps;
              },
            },
          },
        })
      ),
    [parentIncarnate, newRouteProps]
  );

  useEffect(() => {
    const unlisten = history.listen(() => {
      if (routePropsInvalidator.current instanceof Function) {
        routePropsInvalidator.current();
      }
    });

    return () => {
      if (unlisten instanceof Function) {
        unlisten();
      }
    };
  }, [history]);

  return !!match ? (
    <RoutePathProvider value={newRoutePath}>
      <IncarnateProvider value={routeContextIncarnate}>
        {renderChildren instanceof Function
          ? (renderChildren as Function)(newRouteProps)
          : renderChildren}
      </IncarnateProvider>
    </RoutePathProvider>
  ) : null;
};
