import expect from 'expect.js';
import React from 'react';
import {render, findByText} from '@testing-library/react';
import {LifePod} from './LifePod';
import {Incarnate} from './Incarnate';

const suite = {
    'should render': () => {
        const lp = render(<LifePod/>);

        expect(lp).to.be.ok();
    },
    'should render its children': async () => {
        const textContent = 'TEXT_CONTENT';
        const lp = render(<LifePod factory={() => true}>{textContent}</LifePod>);
        const found = await findByText(lp.container, textContent);

        expect(found).to.be.ok();
    },
    'should attach itself to a parent Incarnate': () => {
        const testValue = 'TEST_VALUE';

        let depValue;

        render(<Incarnate>
            <LifePod
                name='TestValue'
                factory={() => testValue}
            />
            <LifePod
                dependencies={{
                    tv: 'TestValue'
                }}
                factory={({tv}) => depValue = tv}
            />
        </Incarnate>);

        expect(depValue).to.equal(testValue);
    },
    'should resolve values asynchronously': async () => {
        const testValue = 'TEST_VALUE';

        let depValue: string | undefined;

        await new Promise((res, rej) => {
            render(<Incarnate>
                <LifePod
                    name='TestValue'
                    factory={() => testValue}
                />
                <LifePod
                    dependencies={{
                        tv: 'TestValue'
                    }}
                    factory={async ({tv}) => {
                        depValue = tv;

                        res();
                    }}
                />
            </Incarnate>);

            try {
                expect(depValue).to.be(undefined);
            } catch (error) {
                rej(error);
            }
        });

        expect(depValue).to.equal(testValue);
    },
    'should resolve dependencies asynchronously': async () => {
        const testValue = 'TEST_VALUE';

        let depValue: string | undefined;

        await new Promise((res, rej) => {
            render(<Incarnate>
                <LifePod
                    name='TestValue'
                    factory={async () => testValue}
                />
                <LifePod
                    dependencies={{
                        tv: 'TestValue'
                    }}
                    factory={({tv}) => {
                        depValue = tv;

                        if (typeof depValue !== 'undefined') {
                            res();
                        }
                    }}
                />
            </Incarnate>);

            try {
                expect(depValue).to.be(undefined);
            } catch (error) {
                rej(error);
            }
        });

        expect(depValue).to.equal(testValue);
    },
    'should resolve dependencies from a nested Incarnate': () => {
        const nestedTextValue = 'NESTED_TEXT_VALUE';

        let depValue;

        render(<Incarnate>
            <Incarnate
                name='Nested'
            >
                <LifePod
                    name='Value'
                    factory={() => nestedTextValue}
                />
            </Incarnate>
            <LifePod
                dependencies={{
                    nv: 'Nested.Value'
                }}
                factory={({nv}) => depValue = nv}
            />
        </Incarnate>);

        expect(depValue).to.equal(nestedTextValue);
    }
};

export {
    suite as LifePod
};
