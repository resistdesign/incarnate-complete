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
    'should add itself to a parent Incarnate': () => {
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

        expect(depValue).to.eql(testValue);
    }
};

export {
    suite as LifePod
};
