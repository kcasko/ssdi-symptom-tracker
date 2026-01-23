import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BigButton } from '../BigButton';

describe('BigButton', () => {
  it('renders with label and handles press', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <BigButton label="Test Button" onPress={onPressMock} />
    );
    const button = getByText('Test Button');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <BigButton label="Accessible Button" onPress={() => {}} accessibilityLabel="Accessible Button" />
    );
    expect(getByA11yLabel('Accessible Button')).toBeTruthy();
  });
});
