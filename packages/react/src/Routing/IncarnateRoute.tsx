import React, {createContext, FC, useContext} from 'react';
import {useRouteMatch, useLocation, useHistory} from 'react-router-dom';
import QS from 'qs';
import {Incarnate, LifePod} from '../.';

const QS_OPTIONS = {
    ignoreQueryPrefix: true,
    depth: Infinity,
    parameterLimit: Infinity,
    allowDots: true
};

export type IncarnateRouteProps = {
    subPath?: string;
    strict?: boolean;
    exact?: boolean;
    sensitive?: boolean;
};

export const getQueryObjectFromLocation = ({search = ''} = {}) => {
    return QS.parse(
        search,
        QS_OPTIONS
    );
};
export const createQueryString = (query = {}) => {
    return QS.stringify(
        query,
        QS_OPTIONS
    );
};
export const ROUTE_PATH_DELIMITER = '/';
export const PATH_NAMES = {
    ROUTE_PROPS_LIST: 'ROUTE_PROPS_LIST',
    ROUTE_PROPS: 'ROUTE_PROPS'
};
export const IncarnateRoutePathContext = createContext<string>('');
export const IncarnateRoutePropListContext = createContext<any[]>([]);

const {Provider: RoutePathProvider} = IncarnateRoutePathContext;
const {Provider: RoutePropListProvider} = IncarnateRoutePropListContext;

const getPathParts = (path: string = ''): string[] => path.split('/').filter(p => !!p);
const getPathFromParts = (parts: string[] = []): string => parts.join(ROUTE_PATH_DELIMITER);

export const IncarnateRoute: FC<IncarnateRouteProps> = (props) => {
    const {
        children,
        subPath = '',
        ...routeProps
    } = props;
    const currentRoutePath = useContext(IncarnateRoutePathContext);
    const routePropsList = useContext(IncarnateRoutePropListContext);
    const currentRoutePathParts = getPathParts(currentRoutePath);
    const subPathParts = getPathParts(subPath);
    const newRoutePath = getPathFromParts([
        ...currentRoutePathParts,
        ...subPathParts
    ]);
    const match = useRouteMatch({
        path: newRoutePath,
        ...routeProps
    });
    const renderChildren = match && children;
    const location = useLocation();
    const history = useHistory();
    const newRouteProps: { [key: string]: any } = {
        ...match,
        history,
        location,
        params: match?.params,
        query: getQueryObjectFromLocation(location),
        setQuery: (query = {}) => {
            const {
                pathname
            } = location;

            if (!!history) {
                history.push({
                    pathname,
                    search: createQueryString(query)
                });
            }
        }
    };
    const newRoutePropsList = [
        newRouteProps,
        ...routePropsList
    ];

    return (
        <RoutePathProvider
            value={newRoutePath}
        >
            <RoutePropListProvider
                value={newRoutePropsList}
            >
                <LifePod
                    name={PATH_NAMES.ROUTE_PROPS_LIST}
                    noCache
                    override
                    factory={() => newRoutePropsList}
                />
                <Incarnate
                    name={PATH_NAMES.ROUTE_PROPS}
                >
                    {Object
                        .keys(newRouteProps)
                        .map((k: string) => (
                            <LifePod
                                key={`${PATH_NAMES.ROUTE_PROPS}:${k}`}
                                name={k}
                                noCache
                                override
                                factory={() => newRouteProps[k]}
                            />
                        ))}
                </Incarnate>
                {renderChildren instanceof Function ? renderChildren(newRouteProps) : renderChildren}
            </RoutePropListProvider>
        </RoutePathProvider>
    );
};
