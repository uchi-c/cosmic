/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, CheckSquare, Square, Layers, List } from 'lucide-react';
import { Product, CategoryType } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onBulkStatusChange: (ids: string[], isActive: boolean) => void;
  onBulkDelete: (ids: string[]) => void;
}

type SortField = 'name' | 'price' | 'stock' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Grouping (sort products under their section/category headers)
  const [groupBySection, setGroupBySection] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset page on query change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle single item select
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((product) => {
      // Name Search
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (product.short_desc && product.short_desc.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      // Category Filter
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && product.is_active) || 
        (statusFilter === 'inactive' && !product.is_active);

      // Stock Filter
      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'out' && product.stock === 0) ||
        (stockFilter === 'low' && product.stock > 0 && product.stock < 5) ||
        (stockFilter === 'instock' && product.stock >= 5);

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'price') {
        comparison = (a.sale_price ?? a.price) - (b.sale_price ?? b.price);
      } else if (sortField === 'stock') {
        comparison = a.stock - b.stock;
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Bulk actions handlers — operate over the currently visible rows: every
  // filtered record when grouped (no paging), or just the current page.
  const handleSelectAll = () => {
    const visibleIds = (groupBySection ? filteredProducts : paginatedProducts).map(p => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all currently visible items
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all currently visible items
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return;
    onBulkStatusChange(selectedIds, true);
    setSelectedIds([]);
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) return;
    onBulkStatusChange(selectedIds, false);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`SECURITY POLICY CONFIRMATION: Are you strictly authorized to delete these ${selectedIds.length} inventory records? This operation is irreversible.`)) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  // Pagination bounds calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Trigger sorting column helper
  const triggerSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Human-friendly section labels for the grouped view headers.
  const CATEGORY_LABELS: Record<string, string> = {
    mens: 'MENSWEAR',
    womens: 'WOMENSWEAR',
    gym: 'GYM & TACTICAL',
    jewelry: 'JEWELRY',
    accessories: 'ACCESSORIES',
  };
  const CATEGORY_ORDER: CategoryType[] = ['mens', 'womens', 'gym', 'jewelry', 'accessories'];

  // When grouping, section over the full filtered set (pagination is bypassed so
  // every section is visible at once); otherwise paginate the flat list.
  const groupedSections = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat.toUpperCase(),
      items: filteredProducts.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  // Single source of truth for a product row, shared by flat + grouped views.
  const renderRow = (product: Product) => {
    const isSelected = selectedIds.includes(product.id);
    const hasSale = product.sale_price !== null;
    const isLowStock = product.stock > 0 && product.stock < 5;
    const isOutOfStock = product.stock === 0;

    return (
      <tr
        key={product.id}
        className={`hover:bg-space-black/30 transition-colors ${isSelected ? 'bg-accent-purple/5' : ''}`}
      >
        {/* Select box */}
        <td className="p-4 text-center">
          <button
            type="button"
            onClick={() => toggleSelect(product.id)}
            className="text-cream-muted hover:text-accent-purple transition-colors focus:outline-none inline-block align-middle"
          >
            {isSelected ? (
              <CheckSquare size={16} className="text-accent-purple" />
            ) : (
              <Square size={16} />
            )}
          </button>
        </td>

        {/* Image Preview */}
        <td className="p-4">
          <div className="w-10 h-10 border border-retro-border bg-space-black overflow-hidden shrink-0">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cream-muted bg-space-black font-retro-mono">
                N/A
              </div>
            )}
          </div>
        </td>

        {/* Name & Badge */}
        <td className="p-4 font-bold tracking-wide">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[250px]" title={product.name}>
                {product.name}
              </span>
              {product.badge && (
                <Badge variant={product.badge as any} className="text-[10px] leading-none">
                  {product.badge}
                </Badge>
              )}
            </div>
            {product.short_desc && (
              <span className="text-[10px] text-cream-muted line-clamp-1 font-normal uppercase">
                {product.short_desc}
              </span>
            )}
          </div>
        </td>

        {/* Category Label */}
        <td className="p-4 uppercase font-semibold text-cream-muted">
          {product.category}
        </td>

        {/* Prices */}
        <td className="p-4 font-mono font-bold">
          {hasSale ? (
            <div className="flex flex-col">
              <span className="text-retro-red">${product.sale_price?.toFixed(2)}</span>
              <span className="text-[10px] line-through text-cream-muted font-normal">
                ${product.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span>${product.price.toFixed(2)}</span>
          )}
        </td>

        {/* Stock indicator */}
        <td className="p-4">
          <div className="flex flex-col gap-0.5">
            <span className={`font-mono font-bold ${isOutOfStock ? 'text-retro-red' : isLowStock ? 'text-retro-gold' : 'text-cream'}`}>
              {product.stock}
            </span>
            {isOutOfStock ? (
              <span className="text-[9px] text-retro-red uppercase font-retro-mono font-bold">OUT</span>
            ) : isLowStock ? (
              <span className="text-[9px] text-retro-gold uppercase font-retro-mono font-bold">LOW</span>
            ) : (
              <span className="text-[9px] text-retro-green uppercase font-retro-mono font-bold">OK</span>
            )}
          </div>
        </td>

        {/* Status Toggle */}
        <td className="p-4">
          {product.is_active ? (
            <span className="inline-flex items-center gap-1 text-retro-green font-retro-mono font-bold uppercase text-xs">
              ● ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-cream-muted font-retro-mono font-bold uppercase text-xs">
              ○ INACTIVE
            </span>
          )}
        </td>

        {/* Action buttons */}
        <td className="p-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(product)}
              className="p-1.5 border border-retro-border bg-space-black hover:border-accent-purple hover:text-accent-purple hover:shadow-[0_0_6px_rgba(155,109,255,0.4)] transition-all cursor-pointer"
              title="Edit Product"
            >
              <Edit size={13} />
            </button>
            <button
              onClick={() => {
                if (confirm(`SECURITY POLICY CONFIRMATION: Are you strictly authorized to delete the inventory record for "${product.name}"?`)) {
                  onDelete(product.id);
                }
              }}
              className="p-1.5 border border-retro-border bg-space-black hover:border-retro-red hover:text-retro-red hover:shadow-[0_0_6px_rgba(255,68,68,0.4)] transition-all cursor-pointer"
              title="Delete Product"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4 font-body-mono text-cream select-none">
      
      {/* Filtering & Searching Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-retro-surface border-2 border-retro-border p-4">
        {/* Live Search */}
        <div className="relative col-span-1 md:col-span-1">
          <input
            type="text"
            placeholder="SEARCH PRODUCTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-space-black border-2 border-retro-border text-cream px-3 py-2 text-xs focus:outline-none focus:border-accent-purple"
          />
          <Search size={14} className="absolute right-3 top-2.5 text-cream-muted" />
        </div>

        {/* Category Select */}
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          className="bg-space-black border-2 border-retro-border text-cream text-xs px-2 py-2 cursor-pointer focus:outline-none focus:border-accent-purple"
        >
          <option value="all">CATEGORY: ALL</option>
          <option value="mens">MENSWEAR</option>
          <option value="womens">WOMENSWEAR</option>
          <option value="gym">GYM & TACTICAL</option>
          <option value="jewelry">JEWELRY</option>
          <option value="accessories">ACCESSORIES</option>
        </select>

        {/* Status Select */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="bg-space-black border-2 border-retro-border text-cream text-xs px-2 py-2 cursor-pointer focus:outline-none focus:border-accent-purple"
        >
          <option value="all">STATUS: ALL</option>
          <option value="active">ACTIVE ONLY</option>
          <option value="inactive">INACTIVE ONLY</option>
        </select>

        {/* Stock Level Filter */}
        <select
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}
          className="bg-space-black border-2 border-retro-border text-cream text-xs px-2 py-2 cursor-pointer focus:outline-none focus:border-accent-purple"
        >
          <option value="all">STOCK LEVEL: ALL</option>
          <option value="instock">IN STOCK (5+)</option>
          <option value="low">LOW STOCK (&lt;5)</option>
          <option value="out">OUT OF STOCK (0)</option>
        </select>
      </div>

      {/* View mode toggle: flat paginated list vs. grouped by section */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] text-cream-muted uppercase tracking-widest">
          {filteredProducts.length} RECORD{filteredProducts.length === 1 ? '' : 'S'} MATCHED
        </span>
        <div className="flex items-center border-2 border-retro-border bg-retro-surface">
          <button
            type="button"
            onClick={() => setGroupBySection(false)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              !groupBySection ? 'bg-accent-purple/15 text-accent-purple' : 'text-cream-muted hover:text-cream'
            }`}
          >
            <List size={13} /> FLAT LIST
          </button>
          <button
            type="button"
            onClick={() => setGroupBySection(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-l-2 border-retro-border ${
              groupBySection ? 'bg-accent-purple/15 text-accent-purple' : 'text-cream-muted hover:text-cream'
            }`}
          >
            <Layers size={13} /> GROUP BY SECTION
          </button>
        </div>
      </div>

      {/* Bulk Operations Bar if any ID is selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-accent-purple/10 border-2 border-accent-purple animate-fadeIn">
          <div className="text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-accent-purple animate-ping" />
            <span>{selectedIds.length} inventory items selected</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="retro-outline" onClick={handleBulkActivate} className="border-retro-green/40 text-retro-green hover:border-retro-green">
              ACTIVATE
            </Button>
            <Button size="sm" variant="retro-outline" onClick={handleBulkDeactivate} className="border-retro-gold/40 text-retro-gold hover:border-retro-gold">
              DEACTIVATE
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>
              DELETE SELECTED
            </Button>
          </div>
        </div>
      )}

      {/* Primary Product Records Grid */}
      <div className="border-2 border-retro-border bg-retro-surface overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-space-black border-b-2 border-retro-border text-xs text-cream-muted uppercase tracking-widest select-none">
              <th className="p-4 w-12 text-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-cream-muted hover:text-accent-purple transition-colors focus:outline-none"
                >
                  {(() => {
                    const visible = groupBySection ? filteredProducts : paginatedProducts;
                    return visible.length > 0 && visible.every(p => selectedIds.includes(p.id));
                  })() ? (
                    <CheckSquare size={16} className="text-accent-purple" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="p-4 w-16">IMAGE</th>
              <th className="p-4 cursor-pointer hover:text-cream transition-colors" onClick={() => triggerSort('name')}>
                <div className="flex items-center gap-1">
                  NAME {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="p-4">CATEGORY</th>
              <th className="p-4 cursor-pointer hover:text-cream transition-colors w-28" onClick={() => triggerSort('price')}>
                <div className="flex items-center gap-1">
                  PRICE {sortField === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-cream transition-colors w-24" onClick={() => triggerSort('stock')}>
                <div className="flex items-center gap-1">
                  STOCK {sortField === 'stock' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="p-4 w-28">STATUS</th>
              <th className="p-4 w-28 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-retro-border text-xs">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-cream-muted uppercase text-xs">
                  NO CORRESPONDING PRODUCT RECORD FOUND.
                </td>
              </tr>
            ) : groupBySection ? (
              groupedSections.map((section) => (
                <React.Fragment key={section.category}>
                  <tr className="bg-space-black/60 border-y-2 border-accent-purple/30">
                    <td colSpan={8} className="px-4 py-2.5">
                      <span className="text-[11px] font-retro-mono font-bold uppercase tracking-widest text-accent-purple">
                        {section.label}
                      </span>
                      <span className="ml-2 text-[10px] text-cream-muted uppercase">
                        · {section.items.length} ITEM{section.items.length === 1 ? '' : 'S'}
                      </span>
                    </td>
                  </tr>
                  {section.items.map((product) => renderRow(product))}
                </React.Fragment>
              ))
            ) : (
              paginatedProducts.map((product) => renderRow(product))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control row (grouped view shows every section, no paging) */}
      {!groupBySection && totalPages > 1 && (
        <div className="flex justify-between items-center bg-retro-surface border-2 border-retro-border p-3 text-xs">
          <div className="text-cream-muted">
            SHOWING <span className="font-bold text-cream">{startIndex + 1}</span> TO{' '}
            <span className="font-bold text-cream">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> OF{' '}
            <span className="font-bold text-cream">{filteredProducts.length}</span> RECORDS
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="retro-outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              PREV
            </Button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={currentPage === idx + 1 ? 'primary' : 'retro-outline'}
                onClick={() => setCurrentPage(idx + 1)}
                className="w-8"
              >
                {idx + 1}
              </Button>
            ))}
            <Button
              size="sm"
              variant="retro-outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              NEXT
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductTable;
