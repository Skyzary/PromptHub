import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AddNewBtn from './AddNewBtn'

describe('AddNewBtn component', () => {
  it('renders the button with text', () => {
    // Arrange
    render(<AddNewBtn />)
    
    // Act
    const button = screen.getByRole('button', { name: /Create new prompt/i })
    
    // Assert
    expect(button).toBeInTheDocument()
  })
})