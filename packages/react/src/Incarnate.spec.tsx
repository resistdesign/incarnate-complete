import expect from 'expect.js';
import React, { FC } from 'react';
import { render, cleanup } from '@testing-library/react';
import { Incarnate } from './Incarnate';
import { LifePod } from './LifePod';

const suite = {
  beforeEach: () => cleanup(),
  'should render': () => {
    const inc = render(<Incarnate />);

    expect(inc).to.be.ok();
  },
  'should call the instance ref handler': () => {
    const incName = 'INC_REF_TEST';

    let incRef;

    render(
      <Incarnate name={incName} onIncarnateInstanceRef={ic => (incRef = ic)} />
    );

    expect(incRef).to.be.ok();
    expect(incRef).to.have.property('subMap');
    expect(incRef).to.have.property('name');
    expect((incRef as any).name).to.equal(incName);
  },
  'should render its children': async () => {
    const textContent = 'TEXT_CONTENT';
    const inc = render(<Incarnate>{textContent}</Incarnate>);
    const found = await inc.findByText(textContent);

    expect(found).to.be.ok();
  },
  'should attach itself to a parent Incarnate': () => {
    const nestedName = 'Nested';

    let incRef: any;

    render(
      <Incarnate onIncarnateInstanceRef={inc => (incRef = inc)}>
        <Incarnate name={nestedName} />
      </Incarnate>
    );

    expect(incRef.subMap[nestedName]).to.be.ok();
    expect(incRef.subMap[nestedName].name).to.equal(nestedName);
  },
  'should share dependencies': async () => {
    const firstValue = 'FIRST_VALUE';
    const otherValue = 'OTHER_VALUE';
    const delimiter = '_';
    const Comp: FC<{ value?: string }> = props => (
      <div>
        {firstValue}
        {delimiter}
        {props.value}
      </div>
    );
    const inc = render(
      <Incarnate>
        <Incarnate name="Other">
          <LifePod name="Value" factory={() => otherValue} />
        </Incarnate>
        <Incarnate
          shared={{
            SomethingElse: 'Other',
          }}
        >
          <LifePod
            dependencies={{
              value: 'SomethingElse.Value',
            }}
            mapToProps={p => p}
          >
            <Comp />
          </LifePod>
        </Incarnate>
      </Incarnate>
    );
    const findResult = await inc.findByText(
      [firstValue, otherValue].join(delimiter)
    );

    expect(findResult).to.be.ok();
  },
};

export { suite as Incarnate };
