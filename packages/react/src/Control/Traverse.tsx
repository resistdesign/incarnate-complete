import React, { FC } from 'react';
import { LifePod } from '../LifePod';

export type TraverseProps = {
  name: string;
  dependencyPath: string;
};
export type TraverseNavigationController = {
  back: () => void;
  forward: () => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

export class TraverseController {
  controller?: TraverseNavigationController;

  getController(): TraverseNavigationController {
    if (!this.controller) {
      this.controller = {
        back: this.back,
        forward: this.forward,
        clear: this.clear,
        canUndo: this.canUndo,
        canRedo: this.canRedo,
      };
    }

    return this.controller;
  }

  setDepValue?: (value: any) => void;

  past: any[] = [];
  present?: any;
  future: any[] = [];

  moveCursor = (offset = 0) => {
    const parsedOffset = parseInt(`${offset}`, 10);
    const cleanOffset = `${parsedOffset}` !== 'NaN' ? parsedOffset : 0;

    if (cleanOffset !== 0) {
      const currentIndex = this.past.length;
      const fullHistory = [...this.past, this.present, ...this.future];

      let newIndex = currentIndex + cleanOffset;

      if (newIndex > fullHistory.length - 1) {
        newIndex = fullHistory.length - 1;
      }

      if (newIndex < 0) {
        newIndex = 0;
      }

      this.past = fullHistory.slice(0, newIndex);
      this.present = fullHistory[newIndex];
      this.future = fullHistory.slice(newIndex + 1, fullHistory.length);

      if (this.setDepValue instanceof Function) {
        // Update the target dependency.
        this.setDepValue(this.present);
      }
    }
  };

  back = (offset: number | string = 1) => {
    this.moveCursor(parseInt(`${offset}`, 10) * -1);
  };

  firstUpdate = true;

  updatePresent = (depValue: any) => {
    if (depValue !== this.present) {
      if (this.firstUpdate) {
        this.firstUpdate = false;
      } else {
        this.past = [...this.past, this.present];
      }
      this.present = depValue;
      this.future = [];
    }
  };

  forward = (offset: number | string = 1) => {
    this.moveCursor(parseInt(`${offset}`, 10));
  };

  clear = () => {
    this.past = [];
    this.future = [];
  };

  canUndo = () => {
    return this.past.length > 0;
  };

  canRedo = () => {
    return this.future.length > 0;
  };
}

export const Traverse: FC<TraverseProps> = props => {
  const { name, dependencyPath } = props;
  const traverseController = new TraverseController();

  return (
    <LifePod
      name={name}
      dependencies={{
        depValue: dependencyPath,
      }}
      setters={{
        setDepValue: dependencyPath,
      }}
      override
      factory={(deps: any): TraverseNavigationController => {
        const {
          depValue,
          setDepValue,
        }: {
          depValue: any;
          setDepValue: (value: any) => void;
        } = deps;

        traverseController.setDepValue = setDepValue;
        traverseController.updatePresent(depValue);

        return traverseController.getController();
      }}
    />
  );
};
