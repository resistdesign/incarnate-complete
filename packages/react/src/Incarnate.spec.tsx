import expect from 'expect.js';
import React from 'react';
import {render} from '@testing-library/react';
import {Incarnate} from './Incarnate';

const suite = {
    'should render': () => {
        const inc = render(<Incarnate/>);

        expect(inc).to.be.ok();
    }
};

export {
    suite as Incarnate
};
