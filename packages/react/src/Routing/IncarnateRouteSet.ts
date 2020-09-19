import {FC, PropsWithChildren} from 'react';

export type IncarnateRouteSetProps = PropsWithChildren<any>;

export const IncarnateRouteSet: FC<IncarnateRouteSetProps> = (props) => {
    const {children} = props;

    return children;
};
