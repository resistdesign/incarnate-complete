// @ts-ignore
import React, { FC } from 'react';
// @ts-ignore
import ReactDOM from 'react-dom';
import {
  Memoize,
  Traverse,
  IncarnateRouter,
  IncarnateRouteSet,
  IncarnateRoute,
  Incarnate,
  LifePod,
} from '../src';

const MULTIPLICATION_VALUE_FILTER = n => typeof n === 'number';

export const App: FC<any> = () => {
  return (
    <div>
      <IncarnateRouter
        name="Demo"
        inc={{
          onIncarnateInstanceRef: inc => {
            // @ts-ignore
            window.INC = inc;
          },
        }}
      >
        <Incarnate name="Data">
          <LifePod name="RandomRange" factory={() => 10} />
          <LifePod
            name="RandomNumber"
            dependencies={{
              range: 'RandomRange',
            }}
            factory={({ range = 0 } = {}) => Math.random() * range}
          />
        </Incarnate>
        <LifePod
          name="MultiplyNavValues"
          dependencies={{
            x: 'Multiply.X',
            y: 'Multiply.Y',
            memX: 'Multiply.MemX',
            memY: 'Multiply.MemY',
          }}
          factory={({ memX = [], memY = [] }) => ({
            x: [...memX].pop(),
            y: [...memY].pop(),
          })}
        />
        <LifePod
          dependencies={{
            multiplyNavValues: 'MultiplyNavValues',
            history: 'ROUTE_PROPS.history',
          }}
        >
          {({
            multiplyNavValues: { x = 2, y = 2 } = {},
            // @ts-ignore
            history,
          } = {}) => (
            <div>
              <button onClick={() => history.push('/random')}>
                Random Number
              </button>
              &nbsp;
              <button
                title={`${x}, ${y}`}
                onClick={() => history.push(`/multiply/${x}/${y}`)}
              >
                Multiply
              </button>
              &nbsp;
              <button onClick={() => history.push('/query-interactions')}>
                Query Interactions
              </button>
              &nbsp;
              <button onClick={() => history.push('/routing')}>Routing</button>
              <br />
              <br />
            </div>
          )}
        </LifePod>
        <Memoize name="RandomRangeHistory" dependencyPath="Data.RandomRange" />
        <IncarnateRouteSet defaultSubPath="random">
          <IncarnateRoute subPath="random">
            <Traverse
              name="RandomRangeHistoryController"
              dependencyPath="Data.RandomRange"
            />
            <LifePod
              dependencies={{
                randomRange: 'Data.RandomRange',
                randomRangeHistory: 'RandomRangeHistory',
                randomRangeHistoryController: 'RandomRangeHistoryController',
                random: 'Data.RandomNumber',
              }}
              setters={{
                setRandomRange: 'Data.RandomRange',
              }}
              invalidators={{
                invalidateRandom: 'Data.RandomNumber',
              }}
            >
              {({
                randomRange = '',
                randomRangeHistory = [],
                // @ts-ignore
                randomRangeHistoryController,
                random = 0,
                // @ts-ignore
                setRandomRange,
                // @ts-ignore
                invalidateRandom,
              } = {}) => (
                <div>
                  Random Number: {random}
                  <br />
                  <br />
                  Random Range:
                  <br />
                  <input
                    type="number"
                    value={randomRange}
                    onChange={({ target: { value } }) =>
                      setRandomRange(parseFloat(value))
                    }
                  />
                  &nbsp;
                  <button onClick={() => invalidateRandom()}>Regenerate</button>
                  <br />
                  <br />
                  <button
                    onClick={() => randomRangeHistoryController.back()}
                    disabled={!randomRangeHistoryController.canUndo()}
                  >
                    Undo
                  </button>
                  &nbsp;
                  <button
                    onClick={() => randomRangeHistoryController.forward()}
                    disabled={!randomRangeHistoryController.canRedo()}
                  >
                    Redo
                  </button>
                  <br />
                  <br />
                  Random Range History:
                  <br />
                  {randomRangeHistory.map((v, i) => (
                    <div key={`Value:${i}`}>{v}</div>
                  ))}
                </div>
              )}
            </LifePod>
          </IncarnateRoute>
          <IncarnateRoute subPath="multiply/:x/:y">
            <Incarnate
              name="Multiply"
              shared={{
                ROUTE_PROPS: 'ROUTE_PROPS',
              }}
            >
              <LifePod
                name="X"
                dependencies={{
                  routeProps: 'ROUTE_PROPS',
                }}
                factory={({
                  routeProps: {
                    params: {
                      // @ts-ignore
                      x,
                    } = {},
                  } = {},
                } = {}) => {
                  const parsed = parseFloat(x);

                  return isNaN(parsed) ? undefined : parsed;
                }}
              />
              <Memoize
                name="MemX"
                dependencyPath="X"
                filter={MULTIPLICATION_VALUE_FILTER}
              />
              <LifePod
                name="Y"
                dependencies={{
                  routeProps: 'ROUTE_PROPS',
                }}
                factory={({
                  routeProps: {
                    params: {
                      // @ts-ignore
                      y,
                    } = {},
                  } = {},
                } = {}) => {
                  const parsed = parseFloat(y);

                  return isNaN(parsed) ? undefined : parsed;
                }}
              />
              <Memoize
                name="MemY"
                dependencyPath="Y"
                filter={MULTIPLICATION_VALUE_FILTER}
              />
            </Incarnate>
            <LifePod
              name="Product"
              dependencies={{
                x: 'Multiply.X',
                y: 'Multiply.Y',
              }}
              factory={({ x = 2, y = 2 } = {}) => x * y}
            />
            <LifePod
              dependencies={{
                x: 'Multiply.X',
                y: 'Multiply.Y',
                product: 'Product',
                routeProps: 'ROUTE_PROPS',
              }}
            >
              {({
                x = 2,
                y = 2,
                product = 0,
                routeProps: {
                  // @ts-ignore
                  history,
                  query: { units = 'feet' } = {},
                } = {},
              } = {}) => (
                <div>
                  Product: {product} {units}
                  <br />
                  <br />
                  <input
                    type="number"
                    value={x}
                    onChange={({ target: { value = 0 } }) =>
                      history.push(`/multiply/${value}/${y}`)
                    }
                  />
                  &nbsp; * &nbsp;
                  <input
                    type="number"
                    value={y}
                    onChange={({ target: { value = 0 } }) =>
                      history.push(`/multiply/${x}/${value}`)
                    }
                  />
                  <br />
                  <br />
                  Units: &nbsp;
                  <input
                    type="text"
                    value={units}
                    onChange={({ target: { value = 'feet' } }) =>
                      history.push(`/multiply/${x}/${y}?units=${value}`)
                    }
                  />
                </div>
              )}
            </LifePod>
          </IncarnateRoute>
          <IncarnateRoute subPath="query-interactions">
            <LifePod
              dependencies={{
                routeProps: 'ROUTE_PROPS',
              }}
            >
              {({
                routeProps: {
                  query = {},
                  // @ts-ignore
                  setQuery,
                } = {},
              } = {}) => (
                <textarea
                  cols={50}
                  rows={20}
                  defaultValue={JSON.stringify(query, null, '  ')}
                  onChange={({ target: { value = '' } }) => {
                    try {
                      setQuery(JSON.parse(value));
                    } catch (error) {
                      // Ignore.
                    }
                  }}
                />
              )}
            </LifePod>
          </IncarnateRoute>
          <IncarnateRoute subPath="routing">
            Routing
            <br />
            <a href="./another-sub-path">Another Sub-Path</a>
            <br />
            <IncarnateRouteSet defaultSubPath="sub-path">
              <IncarnateRoute subPath="sub-path">
                Default Sub-Path
              </IncarnateRoute>
              <IncarnateRoute subPath="another-sub-path">
                Another Sub-Path
              </IncarnateRoute>
            </IncarnateRouteSet>
          </IncarnateRoute>
        </IncarnateRouteSet>
      </IncarnateRouter>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
