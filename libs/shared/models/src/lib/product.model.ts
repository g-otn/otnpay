export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Product {
  category: string;
  description: string;
  id: string;
  imageUrl: string;
  inStock: boolean;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
}

export interface ProductFilter {
  category?: string;
  inStock?: boolean;
  maxPrice?: number;
  minPrice?: number;
  searchTerm?: string;
}
