import expect from 'expect.js';
import React from 'react';
import { render } from '@testing-library/react';
import { Incarnate, LifePod } from '../.';
import {
  ItemProcessorType,
  ItemQueueProcessor,
  ItemType,
} from './ItemQueueProcessor';

const getFakeUUID = () =>
  [...new Array(4)]
    .map(() => Buffer.from(`${Math.random() * 10}`).toString('base64'))
    .join('_');

const suite = {
  'should render': () => {
    const iqp = render(
      <Incarnate>
        <LifePod
          name="ItemProcessor"
          factory={(): ItemProcessorType => (item: ItemType) => ({
            ...item,
            id: getFakeUUID(),
          })}
        />
        <ItemQueueProcessor
          name="IQP"
          shared={{
            ErrorMap: 'ErrorMap',
            InputMap: 'InputMap',
            ItemProcessor: 'ItemProcessor',
            OutputMap: 'OutputMap',
          }}
        />
      </Incarnate>
    );

    expect(iqp).to.be.ok();
  },
  'should process items': async () => {
    type OutputMapType = { om: { [key: string]: any } };
    type IMPopDeps = {
      setInputMap: Function;
      getInputMap: Function;
    };

    const inputItems = [...new Array(4)].map((_x: any, index) => ({
      name: `ITEM_${index}`,
    }));
    const uuidList: string[] = [];

    let outputUUIDList: string[] = [];

    await new Promise(res => {
      const tiId = setTimeout(res, 1000);

      render(
        <Incarnate>
          <LifePod name="InputMap" factory={() => ({})} />
          <LifePod name="ErrorMap" factory={() => ({})} />
          <LifePod name="OutputMap" factory={() => ({})} />
          <LifePod
            name="ItemProcessor"
            factory={(): ItemProcessorType => (item: ItemType) => {
              const uuid = getFakeUUID();

              uuidList.push(uuid);

              return {
                ...item,
                id: uuid,
              };
            }}
          />
          <LifePod
            name="OutputMapWatcher"
            dependencies={{
              om: 'OutputMap',
            }}
            factory={deps => {
              const { om = {} } = deps as OutputMapType;
              const outputItems = Object.keys(om).map(k => om[k]);

              if (outputItems.length >= inputItems.length) {
                clearTimeout(tiId);
                outputUUIDList = outputItems.map(i => i.id);

                res();
              }
            }}
          />
          <LifePod
            name="InputMapPopulator"
            setters={{
              setInputMap: 'InputMap',
            }}
            factory={deps => {
              const { setInputMap } = deps as IMPopDeps;

              inputItems.forEach((it, idx) => setInputMap(it, idx));
            }}
          />
          <ItemQueueProcessor
            name="IQP"
            shared={{
              InputMap: 'InputMap',
              OutputMap: 'OutputMap',
              ErrorMap: 'ErrorMap',
              ItemProcessor: 'ItemProcessor',
            }}
            batchDelayMS={100}
            batchSize={10}
          />
        </Incarnate>
      );
    });

    expect(outputUUIDList).to.eql(uuidList);
  },
  'should process items in batches': async () => {
    type OutputMapType = { om: { [key: string]: any } };
    type IMPopDeps = {
      setInputMap: Function;
      getInputMap: Function;
    };

    const inputItems = [...new Array(8)].map((_x: any, index) => ({
      name: `ITEM_${index}`,
    }));
    const batchSize = 3;
    const batchCount = Math.ceil(inputItems.length / batchSize);
    const uuidList: string[] = [];

    let outputUUIDList: string[] = [],
      batchesProcessed = 0;

    await new Promise(res => {
      const tiId = setTimeout(res, 2000);

      render(
        <Incarnate>
          <LifePod name="InputMap" factory={() => ({})} />
          <LifePod name="ErrorMap" factory={() => ({})} />
          <LifePod name="OutputMap" factory={() => ({})} />
          <LifePod
            name="ItemProcessor"
            factory={(): ItemProcessorType => (item: ItemType) => {
              const uuid = getFakeUUID();

              uuidList.push(uuid);

              return {
                ...item,
                id: uuid,
              };
            }}
          />
          <LifePod
            name="OutputMapWatcher"
            dependencies={{
              om: 'OutputMap',
            }}
            factory={deps => {
              const { om = {} } = deps as OutputMapType;
              const outputItems = Object.keys(om).map(k => om[k]);

              if (outputItems.length >= inputItems.length) {
                clearTimeout(tiId);
                outputUUIDList = outputItems.map(i => i.id);

                res();
              } else {
                batchesProcessed++;
              }
            }}
          />
          <LifePod
            name="InputMapPopulator"
            setters={{
              setInputMap: 'InputMap',
            }}
            factory={deps => {
              const { setInputMap } = deps as IMPopDeps;

              inputItems.forEach((it, idx) => setInputMap(it, idx));
            }}
          />
          <ItemQueueProcessor
            name="IQP"
            shared={{
              InputMap: 'InputMap',
              OutputMap: 'OutputMap',
              ErrorMap: 'ErrorMap',
              ItemProcessor: 'ItemProcessor',
            }}
            batchDelayMS={100}
            batchSize={batchSize}
          />
        </Incarnate>
      );
    });

    expect(outputUUIDList).to.eql(uuidList);
    expect(batchesProcessed).to.equal(batchCount);
  },
};

export { suite as ItemQueueProcessor };
