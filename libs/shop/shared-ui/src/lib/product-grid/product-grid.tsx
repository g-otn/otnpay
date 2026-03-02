import { Product } from '@otnpay/models';

import { ProductCard } from '../product-card/product-card';
import styles from './product-grid.module.css';

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
  products: Product[];
}

export function ProductGrid({ onProductSelect, products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles['empty-state']}>
        <p>No products found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className={styles['product-grid']}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          onProductClick={onProductSelect}
          product={product}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
