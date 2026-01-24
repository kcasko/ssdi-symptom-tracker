// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SymptomPicker } from '../SymptomPicker';

describe('SymptomPicker', () => {
  it('renders and allows symptom selection', () => {
    const onChangeMock = jest.fn();
    const symptoms = [
      { id: 's1', name: 'Headache' },
      { id: 's2', name: 'Fatigue' }
    ];
    const { getByText } = render(
      <SymptomPicker value={[]} onChange={onChangeMock} symptoms={symptoms} />
    );
    const symptom = getByText('Headache');
    fireEvent.press(symptom);
    expect(onChangeMock).toHaveBeenCalled();
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <SymptomPicker value={[]} onChange={() => {}} symptoms={[]} accessibilityLabel="Symptom Picker" />
    );
    expect(getByA11yLabel('Symptom Picker')).toBeTruthy();
  });
});
