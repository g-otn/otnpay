import { createMockProductList } from '@otnpay/shared-test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProductGrid } from './product-grid';

describe('ProductGrid', () => {
  const mockProducts = createMockProductList(3);
  const mockOnSelect = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render all products', () => {
    render(
      <ProductGrid onProductSelect={mockOnSelect} products={mockProducts} />
    );

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Test Product 3')).toBeInTheDocument();
  });

  it('should display empty state when no products', () => {
    render(<ProductGrid onProductSelect={mockOnSelect} products={[]} />);

    expect(
      screen.getByText('No products found matching your criteria.')
    ).toBeInTheDocument();
  });

  it('should call onProductSelect when a product card is clicked', () => {
    render(
      <ProductGrid onProductSelect={mockOnSelect} products={mockProducts} />
    );

    const firstCard = screen.getByRole('button', {
      name: /View details for Test Product 1/i,
    });
    fireEvent.click(firstCard);

    expect(mockOnSelect).toHaveBeenCalledWith(mockProducts[0]);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should have responsive grid layout', () => {
    const { container } = render(
      <ProductGrid onProductSelect={mockOnSelect} products={mockProducts} />
    );

    // CSS modules generate unique class names, check for element with class containing 'product-grid'
    const grid = container.querySelector('[class*="product-grid"]');
    expect(grid).toBeInTheDocument();
    // Check that the grid contains product cards
    const productCards = container.querySelectorAll('[class*="product-card"]');
    expect(productCards.length).toBe(mockProducts.length);
  });
});
