import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders with required props', () => {
    const { getByText } = render(<ThemeToggle isDarkMode={false} onToggle={() => {}} />);
    expect(getByText('Dark Mode')).toBeTruthy();
  });
});
