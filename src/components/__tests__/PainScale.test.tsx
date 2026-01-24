// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PainScale } from '../PainScale';

describe('PainScale', () => {
  it('renders and allows pain selection', () => {
    const onChangeMock = jest.fn();
    const { getByA11yLabel } = render(
      <PainScale value={3} onChange={onChangeMock} />
    );
    // Simulate selecting a pain value (assuming buttons/pressables for each value)
    const painButton = getByA11yLabel('Pain level 5');
    fireEvent.press(painButton);
    expect(onChangeMock).toHaveBeenCalledWith(5);
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <PainScale value={0} onChange={() => {}} accessibilityLabel="Pain Scale" />
    );
    expect(getByA11yLabel('Pain Scale')).toBeTruthy();
  });
});
