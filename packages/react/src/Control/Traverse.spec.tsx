import expect from 'expect.js';
import React from 'react';
import { render } from '@testing-library/react';
import { Traverse, TraverseNavigationController } from './Traverse';
import { Incarnate, LifePod } from '../.';

type TraverseTestingControls = {
  getTargetValue: Function;
  setTargetValue: Function;
  tnc: TraverseNavigationController;
};

const getTraverseTestingControls = (): TraverseTestingControls => {
  const targetDepPath = 'Target.Dep.Path';
  const traverseName = 'TRAVERSE_NAME';
  const controls = {};

  render(
    <Incarnate>
      <Traverse name={traverseName} dependencyPath={targetDepPath} />
      <LifePod
        dependencies={{
          tnc: traverseName,
        }}
        getters={{
          getTargetValue: targetDepPath,
        }}
        setters={{
          setTargetValue: targetDepPath,
        }}
        factory={deps => Object.assign(controls, deps)}
      />
    </Incarnate>
  );

  return controls as TraverseTestingControls;
};

const suite = {
  'should render': () => {
    const trv = render(
      <Incarnate>
        <Traverse name="HistoryOfValues" dependencyPath="Something" />
      </Incarnate>
    );

    expect(trv).to.be.ok();
  },
  'should supply a TraverseNavigationController': () => {
    const traverseName = 'TRAVERSE_NAME';

    let tnc: TraverseNavigationController | undefined;

    const trv = render(
      <Incarnate>
        <Traverse name={traverseName} dependencyPath="Something" />
        <LifePod
          name="TraverseConsumer"
          dependencies={{
            trv: traverseName,
          }}
          factory={deps => {
            const { trv }: { trv?: TraverseNavigationController } = deps;

            tnc = trv;
          }}
        />
      </Incarnate>
    );

    expect(trv).to.be.ok();
    expect(tnc).to.be.an(Object);
    expect(tnc?.back).to.be.a(Function);
    expect(tnc?.canRedo).to.be.a(Function);
    expect(tnc?.canUndo).to.be.a(Function);
    expect(tnc?.clear).to.be.a(Function);
    expect(tnc?.forward).to.be.a(Function);
  },
  TraverseNavigationController: {
    canUndo: {
      'should determine if there is a "previous" value': () => {
        const targetValueList = [...new Array(10)].map(
          (_x, i) => `TEST_VALUE_${i}`
        );
        const { setTargetValue, tnc } = getTraverseTestingControls();
        const initialCheckForUndo = tnc.canUndo();

        targetValueList.forEach(it => setTargetValue(it));

        const finalCheckForUndo = tnc.canUndo();

        expect(initialCheckForUndo).to.equal(false);
        expect(finalCheckForUndo).to.equal(true);
      },
    },
    back: {
      'should set the target dependency to the "previous" value': () => {
        const targetValueList = [...new Array(10)].map(
          (_x, i) => `TEST_VALUE_${i}`
        );
        const lastTargetValue = targetValueList[targetValueList.length - 1];
        const secondToLastTargetValue =
          targetValueList[targetValueList.length - 2];
        const {
          getTargetValue,
          setTargetValue,
          tnc,
        } = getTraverseTestingControls();

        targetValueList.forEach(it => setTargetValue(it));

        const initialCheckForTargetValue = getTargetValue();

        tnc.back();

        const finalCheckForTargetValue = getTargetValue();

        expect(initialCheckForTargetValue).to.equal(lastTargetValue);
        expect(finalCheckForTargetValue).to.equal(secondToLastTargetValue);
      },
    },
    canRedo: {
      'should determine if there is a "next" value': () => {
        const targetValueList = [...new Array(10)].map(
          (_x, i) => `TEST_VALUE_${i}`
        );
        const { setTargetValue, tnc } = getTraverseTestingControls();

        targetValueList.forEach(it => setTargetValue(it));

        const initialCheckForRedo = tnc.canRedo();

        tnc.back();

        const finalCheckForRedo = tnc.canRedo();

        expect(initialCheckForRedo).to.equal(false);
        expect(finalCheckForRedo).to.equal(true);
      },
    },
    forward: {
      'should set the target dependency to the "next" value': () => {
        const targetValueList = [...new Array(10)].map(
          (_x, i) => `TEST_VALUE_${i}`
        );
        const lastTargetValue = targetValueList[targetValueList.length - 1];
        const secondToLastTargetValue =
          targetValueList[targetValueList.length - 2];
        const thirdToLastTargetValue =
          targetValueList[targetValueList.length - 3];
        const {
          getTargetValue,
          setTargetValue,
          tnc,
        } = getTraverseTestingControls();

        targetValueList.forEach(it => setTargetValue(it));

        const initialCheckForTargetValue = getTargetValue();

        tnc.back();
        tnc.back();

        const interMediateCheckForTargetValue = getTargetValue();

        tnc.forward();

        const finalCheckForTargetValue = getTargetValue();

        expect(initialCheckForTargetValue).to.equal(lastTargetValue);
        expect(interMediateCheckForTargetValue).to.equal(
          thirdToLastTargetValue
        );
        expect(finalCheckForTargetValue).to.equal(secondToLastTargetValue);
      },
    },
    clear: {
      'should remove all values from the "history of values"': () => {
        const targetValueList = [...new Array(10)].map(
          (_x, i) => `TEST_VALUE_${i}`
        );
        const { setTargetValue, tnc } = getTraverseTestingControls();

        targetValueList.forEach(it => setTargetValue(it));

        tnc.back();
        tnc.back();
        tnc.back();

        const initialCheckForUndo = tnc.canUndo();
        const initialCheckForRedo = tnc.canRedo();

        tnc.clear();

        const finalCheckForUndo = tnc.canUndo();
        const finalCheckForRedo = tnc.canRedo();

        expect(initialCheckForUndo).to.be(true);
        expect(initialCheckForRedo).to.be(true);
        expect(finalCheckForUndo).to.be(false);
        expect(finalCheckForRedo).to.be(false);
      },
    },
  },
};

export { suite as Traverse };
