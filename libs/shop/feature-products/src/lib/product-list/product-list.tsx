import { Product, ProductFilter } from '@otnpay/models';
import { useCategories, useProducts } from '@otnpay/shop-data';
import {
  ErrorMessage,
  LoadingSpinner,
  ProductGrid,
} from '@otnpay/shop-shared-ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import styles from './product-list.module.css';

export function ProductList() {
  const navigate = useNavigate();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<ProductFilter>({});

  // Fetch data
  const { error, loading, products, totalPages, totalProducts } = useProducts(
    filter,
    currentPage,
    12
  );
  const { categories } = useCategories();

  // Update filter when filter inputs change
  useEffect(() => {
    const newFilter: ProductFilter = {};

    if (searchTerm) {
      newFilter.searchTerm = searchTerm;
    }
    if (selectedCategory) {
      newFilter.category = selectedCategory;
    }
    if (inStockOnly) {
      newFilter.inStock = true;
    }

    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [searchTerm, selectedCategory, inStockOnly]);

  const handleProductSelect = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(e.target.checked);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRetry = () => {
    // Force re-fetch by updating a dummy state
    setFilter({ ...filter });
  };

  return (
    <div className={styles['product-list-container']}>
      <header className={styles['page-header']}>
        <h1>Our Products</h1>
        <p>Explore our wide selection of high-quality products</p>
      </header>

      <div className={styles['filters-section']}>
        <div className={styles['search-box']}>
          <input
            className={styles['search-input']}
            onChange={handleSearchChange}
            placeholder="Search products..."
            type="text"
            value={searchTerm}
          />
        </div>

        <div className={styles['filter-controls']}>
          <select
            className={styles['filter-select']}
            onChange={handleCategoryChange}
            value={selectedCategory}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <label className={styles['checkbox-label']}>
            <input
              checked={inStockOnly}
              onChange={handleInStockChange}
              type="checkbox"
            />
            In Stock Only
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={handleRetry} />
      ) : (
        <>
          <div className={styles['results-info']}>
            Showing {products.length} of {totalProducts} products
          </div>

          <ProductGrid
            onProductSelect={handleProductSelect}
            products={products}
          />

          {totalPages > 1 && (
            <div className={styles['pagination']}>
              <button
                className={styles['btn-secondary']}
                disabled={currentPage === 1}
                onClick={handlePreviousPage}
              >
                Previous
              </button>
              <span className={styles['page-info']}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles['btn-secondary']}
                disabled={currentPage === totalPages}
                onClick={handleNextPage}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductList;
