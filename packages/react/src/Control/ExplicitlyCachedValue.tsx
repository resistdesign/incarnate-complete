import React, {FC, PropsWithChildren, useEffect, useMemo} from 'react';
import {LifePod} from '../.';

export type ExplicitlyCachedValueProps = {
    name?: string;
    dependencyPath: string;
} & PropsWithChildren<any>;

/**
 * Use this controller to safeguard against unnecessary updates due to the
 * nature of the invalidation chain.
 * */
export const ExplicitlyCachedValue: FC<ExplicitlyCachedValueProps> = (props) => {
    const {
        name,
        dependencyPath = ''
    } = props;
    const storage = useMemo<{
        value?: any,
        unlisten?: Function
    }>(() => ({
        value: undefined,
        unlisten: undefined
    }), [name, dependencyPath]);

    useEffect(() => () => {
        const {
            unlisten
        } = storage;

        if (unlisten instanceof Function) {
            unlisten();
        }
    }, [storage]);

    return (
        <LifePod
            name={name}
            getters={{
                getValue: dependencyPath
            }}
            setters={{
                setCachedValue: name
            }}
            listeners={{
                onValueChange: dependencyPath
            }}
            override
            factory={({
                          getValue,
                          onValueChange,
                          setCachedValue
                      } = {}) => {
                if (!(storage.unlisten instanceof Function)) {
                    storage.unlisten = onValueChange(() => {
                        const depValue = getValue();

                        if (typeof depValue !== 'undefined') {
                            storage.value = depValue;

                            setCachedValue(storage.value);
                        }
                    });

                    storage.value = getValue();
                }

                return storage.value;
            }}
        />
    );
};
