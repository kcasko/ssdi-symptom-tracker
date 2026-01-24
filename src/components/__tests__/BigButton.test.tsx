import React from 'react';
import { render } from '@testing-library/react-native';
import { BigButton } from '../BigButton';

describe('BigButton', () => {
  it('renders with label', () => {
    const { getByText } = render(<BigButton label="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });
});
