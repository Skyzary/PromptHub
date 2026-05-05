import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from './Header'

describe('Header component', () => {
  it('renders the logo text correctly', () => {
    // Arrange
    render(<Header />)
    
    // Act
    const logoText = screen.getByText('PromptHub')
    
    // Assert
    expect(logoText).toBeInTheDocument()
  })

  it('renders the settings button', () => {
    // Arrange
    render(<Header />)
    
    // Act & Assert
    // Find the button (since we don't have aria-label, we can try to find button tag)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})