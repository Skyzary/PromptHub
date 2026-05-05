import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Popup from './popup'

describe('Popup component', () => {
  it('renders correctly with Auth page by default', () => {
    // Arrange
    render(<Popup />)
    
    // Act & Assert
    // Check if Header is rendered
    expect(screen.getByText('PromptHub')).toBeInTheDocument()
    
    // Check if Auth title is rendered
    expect(screen.getByRole('heading', { name: /Auth/i })).toBeInTheDocument()
    
    // Check if Email input is rendered
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    
    // Check if Password input is rendered
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    
    // Check if Login button is rendered
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })
})