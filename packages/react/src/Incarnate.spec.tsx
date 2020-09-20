import expect from 'expect.js';
import React from 'react';
import {render} from '@testing-library/react';
import {Incarnate} from './Incarnate';

const suite = {
    'should render': () => {
        const inc = render(<Incarnate/>);

        expect(inc).to.be.ok();
    },
    'should call the instance ref handler': () => {
        const incName = 'INC_REF_TEST';

        let incRef;

        render(<Incarnate
            name={incName}
            onIncarnateInstanceRef={ic => incRef = ic}
        />);

        expect(incRef).to.be.ok();
        expect(incRef).to.have.property('subMap');
        expect(incRef).to.have.property('name');
        expect((incRef as any).name).to.eql(incName);
    }
};

export {
    suite as Incarnate
};
