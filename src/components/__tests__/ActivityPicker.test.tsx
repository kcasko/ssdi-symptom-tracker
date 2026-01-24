import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityPicker } from '../ActivityPicker';

describe('ActivityPicker', () => {
  it('renders with required props', () => {
    const { toJSON } = render(
      <ActivityPicker selectedActivityId={null} onSelectActivity={() => {}} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
