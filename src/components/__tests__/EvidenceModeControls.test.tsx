import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EvidenceModeControls } from '../EvidenceModeControls';

describe('EvidenceModeControls', () => {
  it('renders and toggles evidence mode', () => {
    const onToggleMock = jest.fn();
    const { getByA11yRole } = render(
      <EvidenceModeControls value={false} onToggle={onToggleMock} />
    );
    const switchControl = getByA11yRole('switch');
    fireEvent(switchControl, 'valueChange', true);
    expect(onToggleMock).toHaveBeenCalledWith(true);
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <EvidenceModeControls value={false} onToggle={() => {}} accessibilityLabel="Evidence Mode" />
    );
    expect(getByA11yLabel('Evidence Mode')).toBeTruthy();
  });
});
