import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the scaffold-ready heading', () => {
    render(<App />)
    expect(
      screen.getByText('Graduated Deadlock Avoidance — Scaffold Ready'),
    ).toBeInTheDocument()
  })
})
