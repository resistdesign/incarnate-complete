import React, { FC } from 'react';
import { LifePod } from '../.';

const DEFAULT_FILTER = () => true;

export type MemoizeProps = {
  name: string;
  dependencyPath: string;
  filter?: (value: any, index: number, array: any[]) => boolean;
};

export const Memoize: FC<MemoizeProps> = props => {
  const { name, dependencyPath, filter = DEFAULT_FILTER } = props;

  let value: any[] = [];

  return (
    <LifePod
      name={name}
      dependencies={{
        depValue: dependencyPath,
      }}
      override
      factory={({ depValue } = {}) => {
        const lastValue = value[value.length - 1];

        if (depValue !== lastValue) {
          value = [...value, depValue].filter(filter);
        }

        return value;
      }}
    />
  );
};
