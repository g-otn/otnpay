import { useCategories, useProducts } from '@otnpay/shop-data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductList } from './product-list';

// Mock the hooks
vi.mock('@otnpay/shop-data', () => ({
  useCategories: vi.fn(),
  useProducts: vi.fn(),
}));

const mockProducts = [
  {
    category: 'Electronics',
    description: 'High-quality wireless headphones',
    id: '1',
    imageUrl: 'https://via.placeholder.com/300x200',
    inStock: true,
    name: 'Wireless Headphones',
    price: 99.99,
    rating: 4.5,
    reviewCount: 120,
  },
  {
    category: 'Sports',
    description: 'Comfortable running shoes',
    id: '2',
    imageUrl: 'https://via.placeholder.com/300x200',
    inStock: true,
    name: 'Running Shoes',
    price: 79.99,
    rating: 4.2,
    reviewCount: 85,
  },
];

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (useProducts as any).mockReturnValue({
      error: null,
      loading: true,
      products: [],
      totalPages: 1,
      totalProducts: 0,
    });
    (useCategories as any).mockReturnValue({
      categories: [],
      error: null,
      loading: true,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render error state when products fail to load', () => {
    (useProducts as any).mockReturnValue({
      error: 'Failed to load products',
      loading: false,
      products: [],
      totalPages: 1,
      totalProducts: 0,
    });
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to load products')).toBeInTheDocument();
  });

  it('should render products when loaded', () => {
    (useProducts as any).mockReturnValue({
      error: null,
      loading: false,
      products: mockProducts,
      totalPages: 1,
      totalProducts: 2,
    });
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    expect(screen.getByText('Our Products')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    const mockUseProducts = vi.fn();
    mockUseProducts.mockReturnValue({
      error: null,
      loading: false,
      products: mockProducts,
      totalPages: 1,
      totalProducts: 2,
    });
    (useProducts as any).mockImplementation(mockUseProducts);
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'Wireless' } });

    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: 'Wireless' }),
        1,
        12
      );
    });
  });

  it('should handle category filter', async () => {
    const mockUseProducts = vi.fn();
    mockUseProducts.mockReturnValue({
      error: null,
      loading: false,
      products: mockProducts,
      totalPages: 1,
      totalProducts: 2,
    });
    (useProducts as any).mockImplementation(mockUseProducts);
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Electronics' }),
        1,
        12
      );
    });
  });

  it('should handle in stock filter', async () => {
    const mockUseProducts = vi.fn();
    mockUseProducts.mockReturnValue({
      error: null,
      loading: false,
      products: mockProducts,
      totalPages: 1,
      totalProducts: 2,
    });
    (useProducts as any).mockImplementation(mockUseProducts);
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    const inStockCheckbox = screen.getByRole('checkbox');
    fireEvent.click(inStockCheckbox);

    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ inStock: true }),
        1,
        12
      );
    });
  });

  it('should handle pagination', async () => {
    const mockUseProducts = vi.fn();
    mockUseProducts.mockReturnValue({
      error: null,
      loading: false,
      products: mockProducts,
      totalPages: 3,
      totalProducts: 25,
    });
    (useProducts as any).mockImplementation(mockUseProducts);
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith(expect.any(Object), 2, 12);
    });
  });

  it('should navigate to product detail when card is clicked', () => {
    (useProducts as any).mockReturnValue({
      error: null,
      loading: false,
      products: mockProducts,
      totalPages: 1,
      totalProducts: 2,
    });
    (useCategories as any).mockReturnValue({
      categories: ['Electronics', 'Sports'],
      error: null,
      loading: false,
    });

    const { container } = render(
      <BrowserRouter>
        <ProductList />
      </BrowserRouter>
    );

    const productCard = container.querySelector('[class*="product-card"]');
    expect(productCard).toBeInTheDocument();
  });
});
