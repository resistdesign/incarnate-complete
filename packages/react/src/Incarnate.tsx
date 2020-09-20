import React, { FC, useContext, useMemo } from 'react';
import { Incarnate as INC, SubMapDeclaration } from '@incarnate/core';
import { Provider as IncarnateProvider, IncarnateContext } from './Context';
import getDefaultMapKeyDelimiter from './Utils/getDefaultMapKeyDelimiter';

export type IncarnateInstanceRefHandler = (incRef: INC) => any;
export type IncarnateProps = {
  name?: string;
  onIncarnateInstanceRef?: IncarnateInstanceRefHandler;
} & SubMapDeclaration;

let INCARNATE_COUNT = 0;

export const DEFAULT_MAP_KEY = '__INCARNATES__';
const getIncarnate = (
  parentIncarnate: INC | undefined,
  props: IncarnateProps,
  incarnateHashMatrixKey: number
) => {
  let incarnate: INC;

  const { onIncarnateInstanceRef, ...subMapDeclaration } = props;
  const baseSubMapDeclaration = {
    subMap: {},
    ...subMapDeclaration,
  };

  if (parentIncarnate instanceof INC) {
    // Get the Incarnate instance from a parent Incarnate.
    const { name }: SubMapDeclaration = subMapDeclaration;
    const targetName =
      name ||
      [DEFAULT_MAP_KEY, incarnateHashMatrixKey].join(
        getDefaultMapKeyDelimiter(parentIncarnate.pathDelimiter)
      );
    const targetSubMapDeclaration = {
      ...baseSubMapDeclaration,
      name: targetName,
    };
    const {
      subMap,
      subMap: { [targetName]: existingMapEntry } = {},
    } = parentIncarnate;

    if (!existingMapEntry) {
      parentIncarnate.subMap = {
        ...subMap,
        [targetName]: {
          ...targetSubMapDeclaration,
        },
      };
    }

    incarnate = parentIncarnate.getDependency(targetName) as INC;
  } else {
    // Create a standalone Incarnate instance.
    incarnate = new INC(baseSubMapDeclaration);
  }

  if (onIncarnateInstanceRef instanceof Function) {
    onIncarnateInstanceRef(incarnate);
  }

  return incarnate;
};

export const Incarnate: FC<IncarnateProps> = props => {
  const { children, ...otherProps } = props;
  const parentIncarnate: INC | undefined = useContext(IncarnateContext);
  const memoDeps = [
    parentIncarnate,
    // TRICKY: If there is a change in the order or values of the `props`, other than `children`,
    // a new Incarnate instance should be created.
    ...Object.values(otherProps),
  ];
  const incarnate: INC = useMemo(
    () => {
      const newInc = getIncarnate(parentIncarnate, otherProps, INCARNATE_COUNT);

      INCARNATE_COUNT++;

      return newInc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoDeps
  );

  return <IncarnateProvider value={incarnate}>{children}</IncarnateProvider>;
};
