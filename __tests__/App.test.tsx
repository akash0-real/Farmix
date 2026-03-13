/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/screens/PreLoginScreen', () => 'PreLoginScreen');
jest.mock('../src/screens/LoginScreen', () => 'LoginScreen');
jest.mock('../src/navigation/AppNavigator', () => 'AppNavigator');

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
