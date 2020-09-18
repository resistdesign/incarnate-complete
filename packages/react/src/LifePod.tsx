import {cloneElement, FC, isValidElement, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {DependencyDeclaration, Incarnate as INC, LifePod as LP} from '@incarnate/core';
import {IncarnateContext} from './Context';
import getDefaultMapKeyDelimiter from './Utils/getDefaultMapKeyDelimiter';

export type LifePodResolveErrorHandler = (error: any) => any;
export type LifePodProps = {
    name?: string;
    mapToProps?: DependencyDeclaration['factory'];
    override?: boolean;
    alwaysRender?: boolean;
    onResolveError: LifePodResolveErrorHandler;
} & DependencyDeclaration;

const DEFAULT_FACTORY = (...args: any[]) => args;
const DEFAULT_MAP_KEY = '__LIFEPODS__';

let LIFEPOD_COUNT = 0;

const getFactoryFromProps = (props: LifePodProps) => {
    const {
        factory,
        mapToProps
    } = props;

    return mapToProps instanceof Function &&
    (!(factory instanceof Function) || factory === DEFAULT_FACTORY) ?
        mapToProps :
        factory;
};
const getLifePod = (parentIncarnate: INC | undefined, props: LifePodProps, _lifePodHashMatrixKey: number) => {
    let lifePod: LP;

    const targetFactory = (...args: any[]) => {
        // TRICKY: Always use the current factory.
        const factory = getFactoryFromProps(props);

        if (!!factory) {
            const [rawDependencies] = args || [];

            return factory(rawDependencies);
        }
    };

    if (parentIncarnate instanceof INC) {
        // Get the LifePod instance from a parent Incarnate.
        const {override} = props;
        const {name} = props;
        const targetName = name || [
            DEFAULT_MAP_KEY,
            _lifePodHashMatrixKey
        ].join(getDefaultMapKeyDelimiter(parentIncarnate.pathDelimiter));
        const {subMap, subMap: {[targetName]: existingMapEntry} = {}} = parentIncarnate;
        const targetConfig = {
            ...props,
            name: targetName,
            factory: targetFactory
        };

        if (!existingMapEntry) {
            parentIncarnate.subMap = {
                ...subMap,
                [targetName]: targetConfig
            };
        }

        const lifePodInstance = parentIncarnate.getDependency(targetName) as LP;

        // TRICKY: If `override` is `true`, override only the relevant properties on the existing LifePod with the
        // values from a temporary LifePod created by the `parentIncarnate`.
        if (!!existingMapEntry && override && !!lifePodInstance) {
            const tempDepDec: DependencyDeclaration = targetConfig;
            const tempLifePod = parentIncarnate.createLifePod(targetName, tempDepDec);

            // Apply tempLifePod properties to the existing LifePod instance.
            lifePodInstance.name = tempLifePod.name;
            lifePodInstance.dependencies = tempLifePod.dependencies;
            lifePodInstance.getters = tempLifePod.getters;
            lifePodInstance.setters = tempLifePod.setters;
            lifePodInstance.invalidators = tempLifePod.invalidators;
            lifePodInstance.listeners = tempLifePod.listeners;
            lifePodInstance.strict = tempLifePod.strict;
            lifePodInstance.noCache = tempLifePod.noCache;
            lifePodInstance.factory = tempLifePod.factory;
        }

        lifePod = lifePodInstance;
    } else {
        // Create a standalone LifePod instance.
        lifePod = new LP({
            ...props,
            factory: targetFactory
        });
    }

    return lifePod;
};

export const LifePod: FC<LifePodProps> = (props) => {
    const {
        children,
        onResolveError,
        ...otherProps
    } = props;
    const {
        name,
        alwaysRender
    } = otherProps;
    const factory = getFactoryFromProps(otherProps as LifePodProps);
    const parentIncarnate: INC | undefined = useContext(IncarnateContext);
    const lifePod: LP = useMemo(() => {
        const newLP = getLifePod(parentIncarnate, otherProps as LifePodProps, LIFEPOD_COUNT);

        LIFEPOD_COUNT++;

        return newLP;
    }, [parentIncarnate, name]);
    const lifePodValue = useMemo(() => lifePod?.getValue(), [lifePod]);
    const [childProps, setChildProps] = useState<any | undefined>(lifePodValue);
    const onLifePodChange = useCallback(() => {
        if (!!lifePod) {
            try {
                const value = lifePod.getValue();

                if (!lifePod.resolving) {
                    setChildProps(value);
                }
            } catch (error) {
                if (!!onResolveError) {
                    onResolveError(error);
                }
            }
        }
    }, [lifePod, setChildProps]);

    useEffect(() => {
        if (!!lifePod) {
            lifePod.addChangeHandler('', onLifePodChange);
            lifePod.addErrorHandler('', onResolveError);
        }

        return () => {
            if (!!lifePod) {
                lifePod.removeChangeHandler('', onLifePodChange);
                lifePod.removeErrorHandler('', onResolveError);
            }
        };
    }, [lifePod, onLifePodChange]);

    if (typeof childProps !== 'undefined' || alwaysRender) {
        // If children is a function, pass childProps.
        if (children instanceof Function) {
            if (factory === DEFAULT_FACTORY && childProps instanceof Array) {
                return children(...childProps);
            } else {
                return children(childProps);
            }
        } else if (isValidElement(children)) {
            // If children is a React element, spread childProps.
            const {props: baseChildProps = {}} = children;

            return cloneElement(children, {
                ...childProps,
                ...baseChildProps
            });
        } else {
            return children;
        }
    } else {
        return undefined;
    }
};
