import React from 'react';
import { render } from '@testing-library/react-native';
import { SymptomPicker } from '../SymptomPicker';

describe('SymptomPicker', () => {
  it('renders with required props', () => {
    const { toJSON } = render(
      <SymptomPicker selectedSymptomIds={[]} onToggleSymptom={() => {}} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
