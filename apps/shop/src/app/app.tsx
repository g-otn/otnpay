import { LoadingSpinner } from '@otnpay/shop-shared-ui';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import './app.css';

// Lazy load feature components
const ProductList = lazy(() =>
  import('@otnpay/shop-feature-products').then((m) => ({
    default: m.ProductList,
  }))
);
const ProductDetail = lazy(() =>
  import('@otnpay/shop-feature-product-detail').then((m) => ({
    default: m.ProductDetail,
  }))
);

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Nx Shop Demo</h1>
        </div>
      </header>

      <main className="app-main">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route element={<Navigate replace to="/products" />} path="/" />
            <Route element={<ProductList />} path="/products" />
            <Route element={<ProductDetail />} path="/products/:id" />
            <Route element={<Navigate replace to="/products" />} path="*" />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
