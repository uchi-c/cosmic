/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlusCircle, ShoppingBag, UploadCloud } from 'lucide-react';
import { Product } from '../types';
import { ProductTable } from '../components/admin/ProductTable';
import { Button } from '../components/ui/Button';

interface ProductsListViewProps {
  products: Product[];
  onAddProduct: () => void;
  onImportProducts: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkStatusChange: (ids: string[], isActive: boolean) => void;
  onBulkDelete: (ids: string[]) => void;
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  products,
  onAddProduct,
  onImportProducts,
  onEditProduct,
  onDeleteProduct,
  onBulkStatusChange,
  onBulkDelete,
}) => {
  return (
    <div className="space-y-6 font-body-mono select-none text-cream animate-fadeIn">
      
      {/* View Header with adding controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-retro-surface border-2 border-retro-border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-purple/10 border border-accent-purple/30 text-accent-purple">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h3 className="text-sm font-retro-heading uppercase tracking-widest text-cream">
              INVENTORY MANAGEMENT
            </h3>
            <p className="text-[10px] text-cream-muted uppercase leading-none mt-1">
              {products.length} catalog items cataloged in memory banks
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={onImportProducts}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <UploadCloud size={15} />
            <span>BULK IMPORT</span>
          </Button>
          <Button
            variant="primary"
            onClick={onAddProduct}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <PlusCircle size={15} />
            <span>DISPATCH NEW PRODUCT</span>
          </Button>
        </div>
      </div>

      {/* Main product listings dynamic layout */}
      <ProductTable
        products={products}
        onEdit={onEditProduct}
        onDelete={onDeleteProduct}
        onBulkStatusChange={onBulkStatusChange}
        onBulkDelete={onBulkDelete}
      />

    </div>
  );
};
export default ProductsListView;
