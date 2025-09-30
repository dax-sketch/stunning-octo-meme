import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders client management platform title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Client Management Platform/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(
    /Welcome to the Client Management Platform/i
  );
  expect(welcomeElement).toBeInTheDocument();
});
