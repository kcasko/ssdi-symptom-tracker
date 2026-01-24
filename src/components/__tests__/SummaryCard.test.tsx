import React from 'react';
import { render } from '@testing-library/react-native';
import { SummaryCard } from '../SummaryCard';

describe('SummaryCard', () => {
  it('renders with summary text', () => {
    const { getByText } = render(
      <SummaryCard title="Test summary" value="42" />
    );
    expect(getByText('Test summary')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
  });
});
