import React, {FC, PropsWithChildren, useMemo} from 'react';
import {LifePod} from '../.';

const DEFAULT_FILTER = () => true;

export type MemoizeProps = {
    name?: string;
    dependencyPath: string;
    filter?: (value: any, index: number, array: any[]) => boolean
} & PropsWithChildren<any>;

export const Memoize: FC<MemoizeProps> = (props) => {
    const {
        name,
        dependencyPath,
        filter = DEFAULT_FILTER
    } = props;
    const storage = useMemo<{ value: any[] }>(() => ({value: []}), [name, dependencyPath, filter]);

    return (
        <LifePod
            name={name}
            dependencies={{
                depValue: dependencyPath
            }}
            override
            factory={({depValue} = {}) => {
                storage.value = [
                    ...storage.value,
                    depValue
                ].filter(filter);

                return [
                    ...storage.value
                ];
            }}
        />
    );
};
