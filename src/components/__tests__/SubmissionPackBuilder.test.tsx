import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SubmissionPackBuilder } from '../SubmissionPackBuilder';

describe('SubmissionPackBuilder', () => {
  it('renders and handles submit', () => {
    const onSubmitMock = jest.fn();
    const { getByText } = render(
      <SubmissionPackBuilder onSubmit={onSubmitMock} />
    );
    const button = getByText('Submit');
    fireEvent.press(button);
    expect(onSubmitMock).toHaveBeenCalled();
  });

  it('applies accessibility props', () => {
    const { getByA11yLabel } = render(
      <SubmissionPackBuilder onSubmit={() => {}} accessibilityLabel="Submission Pack" />
    );
    expect(getByA11yLabel('Submission Pack')).toBeTruthy();
  });
});
