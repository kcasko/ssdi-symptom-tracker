import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders and toggles theme', () => {
    const onToggleMock = jest.fn();
    const { getByA11yRole } = render(
      <ThemeToggle value={false} onToggle={onToggleMock} />
    );
    const switchControl = getByA11yRole('switch');
    fireEvent(switchControl, 'valueChange', true);
    expect(onToggleMock).toHaveBeenCalledWith(true);
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <ThemeToggle value={false} onToggle={() => {}} accessibilityLabel="Theme Toggle" />
    );
    expect(getByA11yLabel('Theme Toggle')).toBeTruthy();
  });
});
