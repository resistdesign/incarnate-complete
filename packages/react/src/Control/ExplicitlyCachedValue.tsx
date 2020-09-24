import React, { FC, useEffect } from 'react';
import { LifePod } from '../LifePod';

export type ExplicitlyCachedValueProps = {
  name: string;
  dependencyPath: string;
};

/**
 * Use this controller to safeguard against unnecessary updates due to the
 * nature of the invalidation chain.
 * */
export const ExplicitlyCachedValue: FC<ExplicitlyCachedValueProps> = props => {
  const { name, dependencyPath = '' } = props;

  let value: any, unlisten: () => void;

  useEffect(() => () => {
    if (!!unlisten) {
      unlisten();
    }
  });

  return (
    <LifePod
      name={name}
      getters={{
        getValue: dependencyPath,
      }}
      setters={{
        setCachedValue: name,
      }}
      listeners={{
        onValueChange: dependencyPath,
      }}
      override
      factory={(deps: any) => {
        const {
          getValue,
          onValueChange,
          setCachedValue,
        }: {
          getValue: () => any;
          onValueChange: (handler: () => void) => () => void;
          setCachedValue: (value: any) => void;
        } = deps;

        if (!unlisten) {
          unlisten = onValueChange(() => {
            const depValue = getValue();

            if (typeof depValue !== 'undefined') {
              value = depValue;

              setCachedValue(value);
            }
          });

          value = getValue();
        }

        return value;
      }}
    />
  );
};
