import React, {FC, useContext, useMemo} from 'react';
import {Incarnate as INC, SubMapDeclaration} from '@incarnate/core';
import {Provider as IncarnateProvider, IncarnateContext} from './Context';
import getDefaultMapKeyDelimiter from './Utils/getDefaultMapKeyDelimiter';

export type IncarnateInstanceRefHandler = (incRef: INC) => any;
export type IncarnateProps = {
    name?: string;
    onIncarnateInstanceRef?: IncarnateInstanceRefHandler;
} & SubMapDeclaration;

let INCARNATE_COUNT = 0;

export const DEFAULT_MAP_KEY = '__INCARNATES__';
const getIncarnate = (parentIncarnate: INC | undefined, props: IncarnateProps, incarnateHashMatrixKey: number) => {
    let incarnate: INC;

    const {
        onIncarnateInstanceRef,
        ...subMapDeclaration
    } = props;

    if (parentIncarnate instanceof INC) {
        // Get the Incarnate instance from a parent Incarnate.
        const {name}: SubMapDeclaration = subMapDeclaration;
        const targetName = name || [
            DEFAULT_MAP_KEY,
            incarnateHashMatrixKey
        ].join(getDefaultMapKeyDelimiter(parentIncarnate.pathDelimiter));
        const targetSubMapDeclaration = {
            ...subMapDeclaration,
            name: targetName
        };
        const {subMap, subMap: {[targetName]: existingMapEntry} = {}} = parentIncarnate;

        if (!existingMapEntry) {
            parentIncarnate.subMap = {
                ...subMap,
                [targetName]: {
                    ...targetSubMapDeclaration
                }
            };
        }

        incarnate = parentIncarnate.getDependency(targetName) as INC;
    } else {
        // Create a standalone Incarnate instance.
        incarnate = new INC(subMapDeclaration);
    }

    if (onIncarnateInstanceRef instanceof Function) {
        onIncarnateInstanceRef(incarnate);
    }

    return incarnate;
};

export const Incarnate: FC<IncarnateProps> = (props) => {
    const {
        children,
        ...otherProps
    } = props;
    const {
        name
    } = otherProps;
    const parentIncarnate: INC | undefined = useContext(IncarnateContext);
    const incarnate: INC = useMemo(() => {
        const newInc = getIncarnate(parentIncarnate, otherProps, INCARNATE_COUNT);

        INCARNATE_COUNT++;

        return newInc;
    }, [name, parentIncarnate]);

    return (
        <IncarnateProvider
            value={incarnate}
        >
            {children}
        </IncarnateProvider>
    );
};
