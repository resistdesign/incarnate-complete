import React, {createContext, FC, useContext} from 'react';
import {useRouteMatch} from 'react-router-dom';

export const ROUTE_PATH_DELIMITER = '/';
export const IncarnateRoutePathContext = createContext<string>('');
export type IncarnateRouteProps = {
    subPath?: string;
    strict?: boolean;
    exact?: boolean;
    sensitive?: boolean;
};

const {Provider: RoutePathProvider} = IncarnateRoutePathContext;

const getPathParts = (path: string = ''): string[] => path.split('/').filter(p => !!p);
const getPathFromParts = (parts: string[] = []): string => parts.join(ROUTE_PATH_DELIMITER);

export const IncarnateRoute: FC<IncarnateRouteProps> = (props) => {
    const {
        children,
        subPath = '',
        ...routeProps
    } = props;
    const currentRoutePath = useContext(IncarnateRoutePathContext);
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

    return (
        <RoutePathProvider
            value={newRoutePath}
        >
            {renderChildren}
        </RoutePathProvider>
    );
};
