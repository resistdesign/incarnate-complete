import Incarnate, { HashMatrix, LifePod } from '@incarnate/core';

export class ProxyIncarnate extends Incarnate {
  constructor(parentIncarnate?: Incarnate, localIncarnate?: Incarnate) {
    super({ hashMatrix: parentIncarnate || {} });

    const superGetDependency = this.getDependency;

    this.getDependency = (path: string | string[] = ''): HashMatrix => {
      const [name] = this.getPathArray(path);
      const dep = localIncarnate?.getDependency(name);

      if (
        localIncarnate &&
        (dep instanceof LifePod || dep instanceof Incarnate)
      ) {
        return localIncarnate.getDependency(path);
      } else {
        return superGetDependency(path);
      }
    };
  }
}
