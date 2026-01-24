// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react-native';
import { SummaryCard } from '../SummaryCard';

describe('SummaryCard', () => {
  it('renders with summary text', () => {
    const { getByText } = render(
      <SummaryCard summary="Test summary" />
    );
    expect(getByText('Test summary')).toBeTruthy();
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <SummaryCard summary="Accessible summary" accessibilityLabel="Summary Card" />
    );
    expect(getByA11yLabel('Summary Card')).toBeTruthy();
  });
});
