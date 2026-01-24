import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotesField } from '../NotesField';

describe('NotesField', () => {
  it('renders and allows text input', () => {
    const onChangeMock = jest.fn();
    const { getByPlaceholderText } = render(
      <NotesField value="" onChange={onChangeMock} placeholder="Enter notes" />
    );
    const input = getByPlaceholderText('Enter notes');
    fireEvent.changeText(input, 'Test note');
    expect(onChangeMock).toHaveBeenCalledWith('Test note');
  });

});
