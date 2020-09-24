import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useLocation, useHistory, matchPath } from 'react-router-dom';
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
  const { children, subPath = '', ...routeProps } = props;
  const currentRoutePath = useContext(IncarnateRoutePathContext);
  const newRoutePath = getUrl(currentRoutePath, subPath);
  const location = useLocation();
  const history = useHistory();
  const match = matchPath(location.pathname, {
    path: newRoutePath,
    ...routeProps,
    location: location,
  });
  const renderChildren = !!match
    ? typeof children !== 'undefined'
      ? children
      : null
    : null;
  const routePropsInvalidator = useRef<Function | undefined>(undefined);
  const parentIncarnate = useContext(IncarnateContext);
  const newRouteProps = useRef<IncarnateRouteValues | undefined>(undefined);
  const setNewRouteProps = useCallback(
    newHistory => {
      const newLocation = newHistory.location;
      const newMatch = matchPath(newLocation?.pathname, {
        path: newRoutePath,
        location: newLocation,
        exact: routeProps.exact,
        sensitive: routeProps.sensitive,
        strict: routeProps.strict,
      });
      const matchObject = !!newMatch ? newMatch : { params: {} };

      newRouteProps.current = {
        ...matchObject,
        history: newHistory as any,
        location: newLocation as any,
        params: { ...matchObject.params },
        query: getQueryObjectFromLocation(newLocation),
        setQuery: (query = {}) => {
          const { pathname = '' } = newLocation || {};

          newHistory?.push({
            pathname,
            search: createQueryString(query),
          });
        },
      };
    },
    [newRoutePath, routeProps.exact, routeProps.sensitive, routeProps.strict]
  );
  const localIncarnate = useMemo<INC>(
    () =>
      new INC({
        subMap: {
          [PATH_NAMES.ROUTE_PROPS]: {
            factory: (): IncarnateRouteValues =>
              newRouteProps.current as IncarnateRouteValues,
          },
        },
      }),
    []
  );
  const routeContextIncarnate = useMemo<ProxyIncarnate>(() => {
    routePropsInvalidator.current = localIncarnate?.createInvalidator(
      PATH_NAMES.ROUTE_PROPS
    );
    setNewRouteProps(history);

    return new ProxyIncarnate(parentIncarnate, localIncarnate);
  }, [history, parentIncarnate, localIncarnate, setNewRouteProps]);

  useEffect(() => {
    const unlisten = history?.listen(() => {
      setNewRouteProps(history);

      if (routePropsInvalidator.current instanceof Function) {
        routePropsInvalidator.current();
      }
    });

    return () => {
      if (unlisten instanceof Function) {
        unlisten();
      }
    };
  }, [history, setNewRouteProps]);

  return !!match ? (
    <RoutePathProvider value={newRoutePath}>
      <IncarnateProvider value={routeContextIncarnate}>
        {renderChildren instanceof Function
          ? (renderChildren as Function)(newRouteProps.current)
          : renderChildren}
      </IncarnateProvider>
    </RoutePathProvider>
  ) : null;
};
