import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Popup from './popup'

describe('Popup component', () => {
  it('renders correctly with all inner components', () => {
    // Arrange
    render(<Popup />)
    
    // Act & Assert
    // Check if Header is rendered
    expect(screen.getByText('PromptHub')).toBeInTheDocument()
    
    // Check if SearchField is rendered
    expect(screen.getByPlaceholderText('Search prompts')).toBeInTheDocument()
    
    // Check if ListSection is rendered
    expect(screen.getByText('Recent & Favorites')).toBeInTheDocument()
    
    // Check if AddNewBtn is rendered
    expect(screen.getByRole('button', { name: /Create new prompt/i })).toBeInTheDocument()
  })
})