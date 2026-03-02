import { createMockProduct } from '@otnpay/shared-test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProductCard } from './product-card';

describe('ProductCard', () => {
  const mockProduct = createMockProduct();
  const mockOnClick = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render product information', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('should display product image', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should show rating stars', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
    // 4.5 rating means 4 filled stars
    const filledStars = stars.filter((star) =>
      star.className.includes('filled')
    );
    expect(filledStars).toHaveLength(4);
  });

  it('should call onProductClick when card is clicked', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    const card = screen.getByRole('button', {
      name: /View details for Test Product/i,
    });
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockProduct);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should call onProductClick when Enter key is pressed', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    const card = screen.getByRole('button', {
      name: /View details for Test Product/i,
    });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledWith(mockProduct);
  });

  it('should call onProductClick when Space key is pressed', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    const card = screen.getByRole('button', {
      name: /View details for Test Product/i,
    });
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnClick).toHaveBeenCalledWith(mockProduct);
  });

  it('should show out of stock overlay when product is not in stock', () => {
    const outOfStockProduct = createMockProduct({ inStock: false });
    render(
      <ProductCard onProductClick={mockOnClick} product={outOfStockProduct} />
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    const card = screen.getByRole('button');
    // CSS modules generate unique class names, check if class attribute contains 'out-of-stock'
    expect(card.className).toMatch(/out-of-stock/);
  });

  it('should have proper accessibility attributes', () => {
    render(<ProductCard onProductClick={mockOnClick} product={mockProduct} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('aria-label', 'View details for Test Product');
  });
});
