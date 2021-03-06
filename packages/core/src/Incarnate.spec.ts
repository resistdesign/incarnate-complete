import expect from 'expect.js';
import Incarnate, { HashMatrix, LifePod } from './index';
// @ts-ignore
import DemoApp from '../demo/app';

const suite = {
  'should be a class': () => {
    expect(Incarnate).to.be.a(Function);
  },
  'should automatically update dependants when their dependencies change': async () => {
    let ok = false;

    try {
      await DemoApp();

      ok = true;
    } catch (error) {
      console.log(error);
    }

    expect(ok).to.equal(true);
  },
  'should allow custom path delimiters': async () => {
    const mockDepValue = 'MOCK_DEP_VALUE';
    // IMPORTANT: Should not be '.', which is just the default.
    const customPathDelimiter = '/';
    const inc = new Incarnate({
      pathDelimiter: customPathDelimiter,
      subMap: {
        level2: {
          subMap: {
            testDep: {
              factory: () => mockDepValue,
            },
          },
        },
      },
    });
    const depValue = await inc.getResolvedPathAsync(
      ['level2', 'testDep'].join(customPathDelimiter),
      500
    );

    expect(depValue).to.equal(mockDepValue);
  },
  getDependency: {
    'should get a declared dependency': () => {
      const inc = new Incarnate({
        subMap: {
          testDep: {
            factory: () => 'Tomato',
          },
        },
      });
      const dep = inc.getDependency('testDep');

      expect(dep).to.be.a(LifePod);
    },
    'should get an undeclared dependency': () => {
      const inc = new Incarnate({
        subMap: {},
      });
      const dep = inc.getDependency('testDep');

      expect(dep).to.be.a(HashMatrix);
    },
  },
  getResolvedPath: {
    'should resolve a synchronous dependency': () => {
      const inc = new Incarnate({
        subMap: {
          testDep: {
            factory: () => {
              return 'Tomato';
            },
          },
        },
      });
      const testDep = inc.getResolvedPath('testDep');

      expect(testDep).to.equal('Tomato');
    },
  },
  getResolvedPathAsync: {
    'should resolve an asynchronous dependency': async () => {
      const inc = new Incarnate({
        subMap: {
          testDep: {
            factory: async () => {
              return 'Tomato';
            },
          },
        },
      });
      const testDep = await inc.getResolvedPathAsync('testDep');

      expect(testDep).to.equal('Tomato');
    },
    'should not hang the process when timing out': async () => {
      const inc = new Incarnate({
        subMap: {
          dep1: {
            factory: () => undefined,
          },
          testDep: {
            dependencies: {
              dep1: 'dep1',
            },
            strict: true,
            factory: async () => {
              return 'Tomato';
            },
          },
        },
      });
      const testDepPod = inc.getDependency('testDep');

      let resError = undefined;

      try {
        await inc.getResolvedPathAsync('testDep', 1000);
      } catch (error) {
        resError = error;
      }

      expect(resError).to.be.an(Object);
      expect(testDepPod).to.be.a(LifePod);
      expect((testDepPod as LifePod).resolving).to.equal(false);
    },
    'should supply dependencies from a shared subMap': async () => {
      const sharedSubMapDepValue = 'SHARED_SUBMAP_DEP_VALUE';
      const inc = new Incarnate({
        subMap: {
          other: {
            subMap: {
              dep1: {
                factory: () => sharedSubMapDepValue,
              },
            },
          },
          main: {
            shared: {
              other: 'other',
            },
            subMap: {
              testDep: {
                dependencies: {
                  dep1: 'other.dep1',
                },
                strict: true,
                factory: async ({ dep1 }: { dep1: string }) => dep1,
              },
            },
          },
        },
      });
      const resolvedValue = await inc.getResolvedPathAsync('main.testDep');

      expect(resolvedValue).to.equal(sharedSubMapDepValue);
    },
    'should supply asynchronous dependencies from a shared subMap': async () => {
      const sharedSubMapDepValue = 'SHARED_SUBMAP_DEP_VALUE';
      const inc = new Incarnate({
        subMap: {
          other: {
            subMap: {
              dep1: {
                // IMPORTANT: Must be async.
                factory: async () => sharedSubMapDepValue,
              },
            },
          },
          main: {
            shared: {
              other: 'other',
            },
            subMap: {
              testDep: {
                dependencies: {
                  dep1: 'other.dep1',
                },
                strict: true,
                factory: async ({ dep1 }: { dep1: string }) => dep1,
              },
            },
          },
        },
      });
      const resolvedValue = await inc.getResolvedPathAsync(
        'main.testDep',
        1000
      );

      expect(resolvedValue).to.equal(sharedSubMapDepValue);
    },
  },
  createIncarnate: {
    'should throw when a required, shared dependency is not satisfied': () => {
      let missingSharedDependencyError;

      try {
        const inc = new Incarnate({
          subMap: {
            needsShared: {
              subMap: {
                missing: true,
              },
            },
          },
        });

        inc.getDependency('needsShared');
      } catch (error) {
        missingSharedDependencyError = error;
      }

      expect(missingSharedDependencyError).to.be.an(Object);
      expect(missingSharedDependencyError.message).to.equal(
        Incarnate.ERRORS.UNSATISFIED_SHARED_DEPENDENCY
      );
      expect(missingSharedDependencyError.data).to.equal('missing');
    },
  },
  addErrorHandler: {
    'should call the handler when an asynchronous error occurs at the given path': async () => {
      const asyncNestedDepError = new Error('Error from `a.b`.');
      const inc = new Incarnate({
        subMap: {
          a: {
            subMap: {
              b: {
                factory: async () => {
                  throw asyncNestedDepError;
                },
              },
            },
          },
          c: {
            dependencies: {
              dep: 'a.b',
            },
            strict: true,
            factory: () => true,
          },
        },
      });

      try {
        await inc.getResolvedPathAsync('c');

        expect(true).to.equal(false);
      } catch (error) {
        const {
          source: { error: sourceError },
        } = error;

        expect(sourceError).to.equal(asyncNestedDepError);
      }
    },
  },
  createSetter: {
    'should create a getter function that updates the underlying hashMatrix': () => {
      const depOneValue = 'DEP_ONE_VALUE';
      const inc = new Incarnate({
        subMap: {
          depOne: {
            factory: () => '',
          },
          depTwo: {
            setters: {
              setDepOne: 'depOne',
            },
            factory: ({ setDepOne }) => {
              setDepOne(depOneValue);

              return true;
            },
          },
        },
      });
      const d2 = inc.getDependency('depTwo');
      const d2Value = d2.getValue();
      const d1 = inc.getDependency('depOne');
      const d1Value = d1.getValue();

      expect(d2Value).to.equal(true);
      expect(d1Value).to.equal(depOneValue);
    },
    'should create a getter function that continues to update the underlying hashMatrix': () => {
      const trackedValues: any[] = [];
      const inc = new Incarnate({
        subMap: {
          depOne: {
            factory: () => ({}),
          },
          depTwo: {
            setters: {
              setDepOne: 'depOne',
            },
            factory: ({ setDepOne }) => {
              [...new Array(8)].forEach((_x, i) =>
                setDepOne(`VALUE_${i}`, `KEY_${i}`)
              );

              return true;
            },
          },
          depOneWatcher: {
            dependencies: {
              depOne: 'depOne',
            },
            factory: ({ depOne }) => {
              trackedValues.push(depOne);

              return true;
            },
          },
        },
      });
      const d2 = inc.getDependency('depTwo');
      const d1W = inc.getDependency('depOneWatcher');
      const d1WChangeHandler = () => d1W.getValue();

      d1W.addChangeHandler('', d1WChangeHandler);

      d2.getValue();

      d1W.removeChangeHandler('', d1WChangeHandler);

      const [latestDepOneMap] = [...trackedValues].reverse();
      const latestDepOneMapKeys = Object.keys(latestDepOneMap);
      const { KEY_0: k0, KEY_7: k7 } = latestDepOneMap;

      expect(trackedValues).to.have.length(8);
      expect(latestDepOneMapKeys).to.have.length(8);
      expect(k0).to.equal('VALUE_0');
      expect(k7).to.equal('VALUE_7');
    },
  },
};

export { suite as Incarnate };
