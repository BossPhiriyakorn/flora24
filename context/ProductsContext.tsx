'use client';

import * as React from 'react';

/* ─── TYPES ─── */
export interface ProductCategory {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  status: 'แสดง' | 'ไม่แสดง';
  createdAt: string;
}

/* ─── CONTEXT TYPE ─── */
type ProductsContextType = {
  products: Product[];
  categories: ProductCategory[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: number, p: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  getProductById: (id: number) => Product | undefined;
  addCategory: (name: string) => void;
  updateCategory: (id: number, name: string) => void;
  deleteCategory: (id: number) => void;
};

const ProductsContext = React.createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);

  const addProduct = React.useCallback((p: Omit<Product, 'id' | 'createdAt'>) => {
    setProducts(prev => {
      const newId = Math.max(0, ...prev.map(x => x.id)) + 1;
      return [{ ...p, id: newId, createdAt: new Date().toISOString().slice(0, 10) }, ...prev];
    });
  }, []);

  const updateProduct = React.useCallback((id: number, p: Partial<Product>) => {
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  }, []);

  const deleteProduct = React.useCallback((id: number) => {
    setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  const getProductById = React.useCallback((id: number) => {
    return products.find(x => x.id === id);
  }, [products]);

  const addCategory = React.useCallback((name: string) => {
    setCategories(prev => {
      const newId = Math.max(0, ...prev.map(c => c.id)) + 1;
      return [...prev, { id: newId, name }];
    });
  }, []);

  const updateCategory = React.useCallback((id: number, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, []);

  const deleteCategory = React.useCallback((id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <ProductsContext.Provider value={{
      products, categories,
      addProduct, updateProduct, deleteProduct, getProductById,
      addCategory, updateCategory, deleteCategory,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = React.useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
