import { ProductFilter } from '@otnpay/models';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useProducts } from './use-products';

// Mock fetch
global.fetch = vi.fn();

const mockProductsResponse = {
  data: {
    items: [
      {
        category: 'Electronics',
        description: 'Description 1',
        id: '1',
        imageUrl: 'https://via.placeholder.com/300',
        inStock: true,
        name: 'Product 1',
        price: 99.99,
        rating: 4.5,
        reviewCount: 10,
      },
      {
        category: 'Electronics',
        description: 'Description 2',
        id: '2',
        imageUrl: 'https://via.placeholder.com/300',
        inStock: false,
        name: 'Product 2',
        price: 149.99,
        rating: 4.0,
        reviewCount: 5,
      },
    ],
    page: 1,
    pageSize: 10,
    total: 2,
    totalPages: 1,
  },
  success: true,
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch products without filters', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => mockProductsResponse,
      ok: true,
    });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProductsResponse.data.items);
    expect(result.current.totalProducts).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/products?page=1&pageSize=12'
    );
  });

  it('should fetch products with filters', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => mockProductsResponse,
      ok: true,
    });

    const filter = {
      category: 'Electronics',
      inStock: true,
      maxPrice: 200,
      minPrice: 50,
      searchTerm: 'wireless',
    };

    const { result } = renderHook(() => useProducts(filter, 2, 20));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const callUrl = (fetch as any).mock.calls[0][0] as string;
    expect(callUrl).toContain('http://localhost:3333/api/products?');
    expect(callUrl).toContain('page=2');
    expect(callUrl).toContain('pageSize=20');
    expect(callUrl).toContain('category=Electronics');
    expect(callUrl).toContain('minPrice=50');
    expect(callUrl).toContain('maxPrice=200');
    expect(callUrl).toContain('inStock=true');
    expect(callUrl).toContain('searchTerm=wireless');
  });

  it('should handle empty filter values correctly', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => mockProductsResponse,
      ok: true,
    });

    const filter = {
      category: '',
      inStock: undefined,
      searchTerm: '',
    };

    const { result } = renderHook(() => useProducts(filter));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/products?page=1&pageSize=12'
    );
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Network error';
    (fetch as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe('Network error');
    expect(result.current.totalProducts).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('should handle non-ok response', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ error: 'Failed to load products', success: false }),
      ok: true,
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load products');
    expect(result.current.products).toEqual([]);
  });

  it('should refetch when filter changes', async () => {
    (fetch as any).mockResolvedValue({
      json: async () => mockProductsResponse,
      ok: true,
    });

    const { rerender, result } = renderHook(
      ({ filter }) => useProducts(filter),
      {
        initialProps: { filter: undefined } as { filter?: ProductFilter },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    // Change filter
    rerender({ filter: { category: 'Electronics' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const lastCallUrl = (fetch as any).mock.calls[1][0] as string;
    expect(lastCallUrl).toContain('http://localhost:3333/api/products?');
    expect(lastCallUrl).toContain('page=1');
    expect(lastCallUrl).toContain('pageSize=12');
    expect(lastCallUrl).toContain('category=Electronics');
  });

  it('should refetch when pagination changes', async () => {
    (fetch as any).mockResolvedValue({
      json: async () => mockProductsResponse,
      ok: true,
    });

    const { rerender, result } = renderHook(
      ({ page, pageSize }) => useProducts(undefined, page, pageSize),
      {
        initialProps: { page: 1, pageSize: 12 },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    // Change page
    rerender({ page: 2, pageSize: 12 });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetch).toHaveBeenLastCalledWith(
      'http://localhost:3333/api/products?page=2&pageSize=12'
    );
  });
});
