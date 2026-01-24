import React from 'react';
import { render } from '@testing-library/react-native';
import { PainScale } from '../PainScale';

describe('PainScale', () => {
  it('renders with required props', () => {
    const { toJSON } = render(<PainScale value={3} onChange={() => {}} />);
    expect(toJSON()).toBeTruthy();
  });
});
