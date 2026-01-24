// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LogFinalizationControls } from '../LogFinalizationControls';

describe('LogFinalizationControls', () => {
  it('renders and handles finalize', () => {
    const onFinalizeMock = jest.fn();
    const { getByText } = render(
      <LogFinalizationControls onFinalize={onFinalizeMock} />
    );
    const button = getByText('Finalize');
    fireEvent.press(button);
    expect(onFinalizeMock).toHaveBeenCalled();
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <LogFinalizationControls onFinalize={() => {}} accessibilityLabel="Finalize Log" />
    );
    expect(getByA11yLabel('Finalize Log')).toBeTruthy();
  });
});
