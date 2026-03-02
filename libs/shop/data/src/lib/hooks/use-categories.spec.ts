import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCategories } from './use-products';

// Mock fetch
global.fetch = vi.fn();

const mockCategories = ['Electronics', 'Sports', 'Clothing', 'Home & Kitchen'];

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch categories successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockCategories, success: true }),
      ok: true,
    });

    const { result } = renderHook(() => useCategories());

    expect(result.current.loading).toBe(true);
    expect(result.current.categories).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/products/categories'
    );
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Network error';
    (fetch as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle non-ok response', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({
        error: 'Failed to load categories',
        success: false,
      }),
      ok: true,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe('Failed to load categories');
  });

  it('should only fetch once on mount', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockCategories, success: true }),
      ok: true,
    });

    const { rerender, result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    // Rerender should not trigger another fetch
    rerender();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle empty categories array', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: [], success: true }),
      ok: true,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle malformed response', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => {
        throw new Error('Invalid JSON');
      },
      ok: true,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe('Invalid JSON');
  });

  it('should maintain categories order from API', async () => {
    const orderedCategories = [
      'Accessories',
      'Clothing',
      'Electronics',
      'Home & Kitchen',
      'Sports',
    ];
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: orderedCategories, success: true }),
      ok: true,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual(orderedCategories);
    // Verify order is maintained
    result.current.categories.forEach((category, index) => {
      expect(category).toBe(orderedCategories[index]);
    });
  });
});
