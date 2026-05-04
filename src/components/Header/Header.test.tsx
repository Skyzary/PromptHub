import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { describe, it, expect } from 'vitest';

describe('Header component', () => {
  // Тестируем, что компонент рендерится корректно
  it('должен рендерить логотип и текст', () => {
    // Arrange (Подготовка)
    render(<Header />);
    
    // Act & Assert (Действие и Проверка)
    // Проверяем, что текст логотипа присутствует на экране
    expect(screen.getByText('PromptHub')).toBeInTheDocument();
  });

  // Тестируем кнопку настроек
  it('должен рендерить кнопку настроек и она должна быть кликабельной', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Header />);
    
    // Act
    // Ищем кнопку. В нашем случае можно использовать role="button" (браузеры понимают это из тега <button>)
    const settingsBtn = screen.getByRole('button');
    
    // Кликаем по кнопке (даже если у нее пока нет обработчика, проверяем, что клик не падает)
    await user.click(settingsBtn);
    
    // Assert
    expect(settingsBtn).toBeInTheDocument();
  });
});
