import {
  cloneElement,
  FC,
  isValidElement,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DependencyDeclaration,
  Incarnate as INC,
  LifePod as LP,
} from '@incarnate/core';
import { IncarnateContext } from './Context';
import getDefaultMapKeyDelimiter from './Utils/getDefaultMapKeyDelimiter';

export type LifePodResolveErrorHandler = (error: any) => any;
export type LifePodProps = {
  name?: string;
  mapToProps?: DependencyDeclaration['factory'];
  override?: boolean;
  alwaysRender?: boolean;
  onResolveError?: LifePodResolveErrorHandler;
  errorDependencyPath?: string;
} & DependencyDeclaration;

const DEFAULT_FACTORY = (...args: any[]) => args;
const DEFAULT_MAP_KEY = '__LIFEPODS__';

let LIFEPOD_COUNT = 0;

const getFactoryFromProps = (props: LifePodProps) => {
  const { factory, mapToProps } = props;

  return mapToProps instanceof Function &&
    (!(factory instanceof Function) || factory === DEFAULT_FACTORY)
    ? mapToProps
    : factory;
};
const getLifePod = (
  parentIncarnate: INC | undefined,
  props: LifePodProps,
  _lifePodHashMatrixKey: number
) => {
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
    const { override } = props;
    const { name } = props;
    const targetName =
      name ||
      [DEFAULT_MAP_KEY, _lifePodHashMatrixKey].join(
        getDefaultMapKeyDelimiter(parentIncarnate.pathDelimiter)
      );
    const {
      subMap,
      subMap: { [targetName]: existingMapEntry } = {},
    } = parentIncarnate;
    const targetConfig = {
      ...props,
      name: targetName,
      factory: targetFactory,
    };

    if (!existingMapEntry) {
      parentIncarnate.subMap = {
        ...subMap,
        [targetName]: targetConfig,
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
      factory: targetFactory,
    });
  }

  return lifePod;
};

export const LifePod: FC<LifePodProps> = props => {
  const {
    children,
    onResolveError,
    errorDependencyPath,
    ...otherProps
  } = props;
  const { alwaysRender } = otherProps;
  const factory = getFactoryFromProps(otherProps as LifePodProps);
  const parentIncarnate: INC | undefined = useContext(IncarnateContext);
  const memoDeps = [
    parentIncarnate,
    // TRICKY: If there is a change in the order or values of the `props`, other than `children`,
    // a new LifePod instance should be created.
    ...Object.values(otherProps),
  ];
  const lifePod: LP = useMemo(
    () => {
      const newLP = getLifePod(
        parentIncarnate,
        otherProps as LifePodProps,
        LIFEPOD_COUNT
      );

      LIFEPOD_COUNT++;

      return newLP;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoDeps
  );
  const lifePodValue = useMemo(() => lifePod?.getValue(), [lifePod]);
  const [{ childProps }, setChildProps] = useState<any | undefined>({
    childProps: lifePodValue,
  });
  const storage = useRef<{
    renderedOnce: boolean;
    initialChildProps: any;
    initialChildPropsSet: boolean;
  }>({
    renderedOnce: false,
    initialChildProps: childProps,
    initialChildPropsSet: false,
  });
  const resolveErrorHandler = useCallback(
    (error: any) => {
      if (parentIncarnate && typeof errorDependencyPath === 'string') {
        const errorDep = parentIncarnate.getDependency(errorDependencyPath);

        errorDep.setValue(error);
      }

      if (!!onResolveError) {
        onResolveError(error);
      }
    },
    [parentIncarnate, errorDependencyPath, onResolveError]
  );
  const onLifePodChange = useCallback(() => {
    if (!!lifePod) {
      try {
        const value = lifePod.getValue();

        if (!lifePod.resolving) {
          if (storage.current.renderedOnce) {
            setChildProps({ childProps: value });
          } else {
            storage.current.initialChildProps = value;
            storage.current.initialChildPropsSet = true;
          }
        }
      } catch (error) {
        resolveErrorHandler(error);
      }
    }
  }, [lifePod, setChildProps, resolveErrorHandler]);

  if (!!lifePod) {
    lifePod.addChangeHandler('', onLifePodChange);

    lifePod.addErrorHandler('', resolveErrorHandler);
  }

  useEffect(() => {
    if (!storage.current.renderedOnce) {
      storage.current.renderedOnce = true;

      if (storage.current.initialChildPropsSet) {
        setChildProps({ childProps: storage.current.initialChildProps });
      }
    }

    return () => {
      if (!!lifePod) {
        lifePod.removeChangeHandler('', onLifePodChange);

        lifePod.removeErrorHandler('', resolveErrorHandler);
      }
    };
  }, [lifePod, onLifePodChange, resolveErrorHandler]);

  const targetChildProps = storage.current.renderedOnce
    ? childProps
    : storage.current.initialChildPropsSet
    ? storage.current.initialChildProps
    : childProps;

  if (typeof targetChildProps !== 'undefined' || alwaysRender) {
    // If children is a function, pass targetChildProps.
    if (children instanceof Function) {
      if (factory === DEFAULT_FACTORY && targetChildProps instanceof Array) {
        return children(...targetChildProps);
      } else {
        return children(targetChildProps);
      }
    } else if (isValidElement(children)) {
      // If children is a React element, spread targetChildProps.
      const { props: baseChildProps = {} } = children as ReactElement;

      return cloneElement(children, {
        ...targetChildProps,
        ...baseChildProps,
      });
    } else {
      return typeof children === 'undefined' ? null : children;
    }
  } else {
    return null;
  }
};
