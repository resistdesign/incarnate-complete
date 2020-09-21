import React, { FC } from 'react';
import Incarnate, { IncarnateProps, LifePod } from '../.';
import Queue from './ItemQueueProcessor/Queue';
import ItemQueueProcessorController, {
  ItemQueueProcessorControllerConfig,
} from './ItemQueueProcessor/ItemQueueProcessorController';

export const DEFAULT_PRIMARY_KEY = 'id';

export type ItemQueueProcessorProps = {
  shared: {
    InputMap: string;
    OutputMap: string;
    ErrorMap: string;
    ItemProcessor: string;
  };
  batchSize?: number;
  batchDelayMS?: number;
  primaryKey?: string;
} & IncarnateProps;

export const ItemQueueProcessor: FC<ItemQueueProcessorProps> = props => {
  const {
    batchSize = 5,
    batchDelayMS = 0,
    primaryKey = DEFAULT_PRIMARY_KEY,
    ...incProps
  } = props;

  return (
    <Incarnate {...incProps}>
      <LifePod name="Queue" factory={() => new Queue()} />
      <LifePod name="ErrorQueue" factory={() => new Queue()} />
      <LifePod name="QueueIsValid" factory={() => true} />
      <LifePod
        name="QueueUpdater"
        dependencies={{
          queue: 'Queue',
          errorQueue: 'ErrorQueue',
          inputMap: 'InputMap',
        }}
        invalidators={{
          invalidateQueueIsValid: 'QueueIsValid',
        }}
        factory={({
          queue,
          errorQueue,
          inputMap = {},
          invalidateQueueIsValid,
        }) => {
          const keysToQueue = errorQueue.getUnregisteredKeys(
            Object.keys(inputMap)
          );

          if (keysToQueue.length > 0) {
            queue.addKeys(keysToQueue);

            invalidateQueueIsValid();
          }

          return true;
        }}
      />
      <LifePod name="Processing" factory={() => false} />
      <LifePod
        name="QueueProcessor"
        dependencies={{
          itemProcessor: 'ItemProcessor',
          queue: 'Queue',
          errorQueue: 'ErrorQueue',
          // TRICKY: Watched but unused.
          inputMap: 'InputMap',
          // TRICKY: A trigger used to restart processing.
          queueIsValid: 'QueueIsValid',
        }}
        getters={{
          getInputMap: 'InputMap',
          getOutputMap: 'OutputMap',
          getErrorMap: 'ErrorMap',
        }}
        setters={{
          setProcessing: 'Processing',
          setInputMap: 'InputMap',
          setOutputMap: 'OutputMap',
          setErrorMap: 'ErrorMap',
        }}
        strict
        factory={async ({
          itemProcessor,
          queue,
          errorQueue,
          getInputMap,
          getOutputMap,
          getErrorMap,
          setProcessing,
          setInputMap,
          setOutputMap,
          setErrorMap,
        }) => {
          await new Promise(res => setTimeout(res, batchDelayMS));

          const itemKeyList: string[] = queue.getNKeys(batchSize);
          const itemResolverMap: {
            [key: string]: () => any;
          } = itemKeyList.reduce(
            (acc, k) => ({ ...acc, [k]: () => getInputMap(k) }),
            {}
          );

          if (itemKeyList.length > 0) {
            const process = async () => {
              const successfullyProcessedKeys: string[] = [];
              const newOutputMap: { [key: string]: any } = {};
              const promises = [];
              const staleItemKeys: string[] = [];

              setProcessing(true);
              for (let i = 0; i < itemKeyList.length; i++) {
                const currentKey = itemKeyList[i];
                const itemRes = itemResolverMap[currentKey];

                promises.push(
                  new Promise(async res => {
                    try {
                      const item = await itemRes();
                      const returnItem = await itemProcessor(item);
                      const itemIsStale = item !== (await itemRes());
                      const { [primaryKey]: newKey } = returnItem;

                      if (itemIsStale) {
                        // TRICKY: IMPORTANT: The item may have changed since processing began,
                        // that means the processed item is now stale and should be queued again,
                        // NOT removed from the `InputMap`.
                        staleItemKeys.push(currentKey);
                      }

                      newOutputMap[newKey] = returnItem;
                      successfullyProcessedKeys.push(currentKey);
                    } catch (error) {
                      // Set errors.
                      const errorMap = getErrorMap() || {};

                      setErrorMap({
                        ...errorMap,
                        [currentKey]: error,
                      });

                      errorQueue.addKeys([currentKey]);
                    }

                    res();
                  })
                );
              }

              await Promise.all(promises);
              setProcessing(false);

              const newInputMap = {
                ...getInputMap(),
              };

              successfullyProcessedKeys.forEach(spk => {
                // IMPORTANT: Do not remove items that have changed from the `InputMap`;
                if (staleItemKeys.indexOf(spk) === -1) {
                  delete newInputMap[spk];
                }
              });
              queue.removeKeys(itemKeyList);
              setOutputMap({
                ...getOutputMap(),
                ...newOutputMap,
              });
              setInputMap(newInputMap);
            };

            process().then(() => undefined);
          }

          return true;
        }}
      />
      <LifePod
        name="Controller"
        dependencies={{
          errorQueue: 'ErrorQueue',
        }}
        getters={{
          getInputMap: 'InputMap',
          getErrorMap: 'ErrorMap',
        }}
        setters={{
          setInputMap: 'InputMap',
          setErrorMap: 'ErrorMap',
        }}
        invalidators={{
          invalidateQueueUpdater: 'QueueUpdater',
        }}
        factory={config =>
          new ItemQueueProcessorController(
            config as ItemQueueProcessorControllerConfig
          )
        }
      />
    </Incarnate>
  );
};
