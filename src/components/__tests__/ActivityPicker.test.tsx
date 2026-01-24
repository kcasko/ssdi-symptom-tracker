// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityPicker } from '../ActivityPicker';

describe('ActivityPicker', () => {
  it('renders and allows activity selection', () => {
    const onChangeMock = jest.fn();
    const activities = [
      { id: 'a1', name: 'Walking' },
      { id: 'a2', name: 'Sitting' }
    ];
    const { getByText } = render(
      <ActivityPicker value={[]} onChange={onChangeMock} activities={activities} />
    );
    const activity = getByText('Walking');
    fireEvent.press(activity);
    expect(onChangeMock).toHaveBeenCalled();
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <ActivityPicker value={[]} onChange={() => {}} activities={[]} accessibilityLabel="Activity Picker" />
    );
    expect(getByA11yLabel('Activity Picker')).toBeTruthy();
  });
});
