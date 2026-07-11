/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Download, Eye, Calendar, DollarSign, User } from 'lucide-react';
import { Order, OrderStatusType, PaymentStatusType } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface OrderTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, onViewDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, yesterday, week

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    // Search match
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower);

    // Status match
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;

    // Payment match
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;

    // Date range match
    let matchesDate = true;
    const orderTime = new Date(order.created_at).getTime();
    const nowTime = Date.now();

    if (dateFilter === 'today') {
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      matchesDate = orderTime >= startOfToday;
    } else if (dateFilter === 'yesterday') {
      const startOfYesterday = new Date(nowTime - 24 * 3600 * 1000).setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(nowTime - 24 * 3600 * 1000).setHours(23, 59, 59, 999);
      matchesDate = orderTime >= startOfYesterday && orderTime <= endOfYesterday;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = nowTime - 7 * 24 * 3600 * 1000;
      matchesDate = orderTime >= sevenDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Security Note: Sanitize cell values for CSV output to prevent CSV Injection (Formula Injection) attacks.
  // Flagged cybersecurity risk: Prefix check on fields before export.
  const sanitizeCSVCell = (val: string): string => {
    if (!val) return '';
    // If cell value starts with potential formula characters, prepend single quote to escape it
    if (['=', '+', '-', '@', '\t', '\r'].includes(val.charAt(0))) {
      return `'${val}`;
    }
    return val.replace(/"/g, '""'); // Escape standard double quotes
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Items Purchased', 'Subtotal', 'Total', 'Payment Method', 'Payment Status', 'Order Status'];
      
      const csvRows = [
        headers.join(','), // Header row
        ...filteredOrders.map((o) => {
          const itemSummary = o.items.map((i) => `${i.name} (x${i.quantity})`).join(' | ');
          return [
            `"${sanitizeCSVCell(o.id)}"`,
            `"${sanitizeCSVCell(format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'))}"`,
            `"${sanitizeCSVCell(o.customer_name)}"`,
            `"${sanitizeCSVCell(o.customer_email)}"`,
            `"${sanitizeCSVCell(itemSummary)}"`,
            `"${o.subtotal.toFixed(2)}"`,
            `"${o.total.toFixed(2)}"`,
            `"${sanitizeCSVCell(o.payment_method || 'N/A')}"`,
            `"${sanitizeCSVCell(o.payment_status)}"`,
            `"${sanitizeCSVCell(o.order_status)}"`
          ].join(',');
        })
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `cosmic-dept-orders-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV Export Error:', err);
    }
  };

  const getOrderStatusBadge = (status: OrderStatusType) => {
    switch (status) {
      case 'completed': return <Badge variant="success">COMPLETED</Badge>;
      case 'processing': return <Badge variant="warning">PROCESSING</Badge>;
      case 'pending': return <Badge variant="info">PENDING</Badge>;
      case 'cancelled': return <Badge variant="danger">CANCELLED</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatusType) => {
    switch (status) {
      case 'paid': return <Badge variant="NEW">PAID</Badge>;
      case 'pending': return <Badge variant="warning">PENDING</Badge>;
      case 'failed': return <Badge variant="danger">FAILED</Badge>;
      case 'refunded': return <Badge variant="default">REFUNDED</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 font-body-mono text-cream select-none">
      
      {/* Search, Filter, Export controls block */}
      <div className="flex flex-col lg:flex-row gap-3 bg-retro-surface border-2 border-retro-border p-4 justify-between items-stretch">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
          {/* Query search */}
          <div className="relative">
            <input
              type="text"
              placeholder="SEARCH CUSTOMER/ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-space-black border-2 border-retro-border text-cream px-3 py-2 text-xs focus:outline-none focus:border-accent-purple"
            />
            <Search size={14} className="absolute right-3 top-2.5 text-cream-muted" />
          </div>

          {/* Order Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-space-black border-2 border-retro-border text-cream text-xs px-2 py-2 cursor-pointer focus:outline-none focus:border-accent-purple"
          >
            <option value="all">ORDER STATUS: ALL</option>
            <option value="pending">PENDING</option>
            <option value="processing">PROCESSING</option>
            <option value="completed">COMPLETED</option>
            <option value="cancelled">CANCELLED</option>
          </select>

          {/* Payment Status selector */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-space-black border-2 border-retro-border text-cream text-xs px-2 py-2 cursor-pointer focus:outline-none focus:border-accent-purple"
          >
            <option value="all">PAYMENT: ALL</option>
            <option value="pending">PENDING</option>
            <option value="paid">PAID ONLY</option>
            <option value="failed">FAILED ONLY</option>
            <option value="refunded">REFUNDED ONLY</option>
          </select>

          {/* Date range filter selector */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-space-black border-2 border-retro-border text-cream text-xs px-2 py-2 cursor-pointer focus:outline-none focus:border-accent-purple"
          >
            <option value="all">DATE RANGE: ALL TIME</option>
            <option value="today">TODAY ONLY</option>
            <option value="yesterday">YESTERDAY ONLY</option>
            <option value="week">PAST 7 DAYS</option>
          </select>
        </div>

        {/* CSV export action button */}
        <Button
          variant="retro-outline"
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="lg:self-center flex items-center justify-center gap-2 border-retro-gold/40 text-retro-gold hover:border-retro-gold hover:shadow-[0_0_10px_rgba(182,141,64,0.3)] shrink-0"
        >
          <Download size={14} />
          <span className="font-retro-mono text-base tracking-wider leading-none">EXPORT TO CSV</span>
        </Button>
      </div>

      {/* Primary orders table */}
      <div className="border-2 border-retro-border bg-retro-surface overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-space-black border-b-2 border-retro-border text-xs text-cream-muted uppercase tracking-widest select-none">
              <th className="p-4 w-28">ORDER ID</th>
              <th className="p-4">CUSTOMER</th>
              <th className="p-4">ITEMS PURCHASED</th>
              <th className="p-4 w-28">TOTAL PRICE</th>
              <th className="p-4 w-28">PAYMENT</th>
              <th className="p-4 w-28">STATUS</th>
              <th className="p-4 w-36">DATE</th>
              <th className="p-4 w-24 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-retro-border text-xs">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const totalItemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                const itemSummary = order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');

                return (
                  <tr key={order.id} className="hover:bg-space-black/30 transition-colors">
                    {/* Order ID */}
                    <td className="p-4 font-mono font-bold text-accent-purple">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>

                    {/* Customer Info */}
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <User size={11} className="text-cream-muted" /> {order.customer_name}
                        </span>
                        <span className="text-[10px] text-cream-muted">{order.customer_email}</span>
                      </div>
                    </td>

                    {/* Items detail */}
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate max-w-[220px]" title={itemSummary}>
                          {itemSummary}
                        </span>
                        <span className="text-[10px] text-accent-purple font-retro-mono uppercase">
                          {totalItemCount} ITEM{totalItemCount > 1 ? 'S' : ''}
                        </span>
                      </div>
                    </td>

                    {/* Order Total */}
                    <td className="p-4 font-mono font-bold text-cream">
                      ${order.total.toFixed(2)}
                    </td>

                    {/* Payment Status */}
                    <td className="p-4">
                      {getPaymentStatusBadge(order.payment_status)}
                    </td>

                    {/* Order Status */}
                    <td className="p-4">
                      {getOrderStatusBadge(order.order_status)}
                    </td>

                    {/* Order Date */}
                    <td className="p-4 text-cream-muted font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-accent-purple" />
                        <span>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</span>
                      </div>
                    </td>

                    {/* Actions view */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="p-1.5 border border-retro-border bg-space-black hover:border-accent-purple hover:text-accent-purple hover:shadow-[0_0_6px_rgba(155,109,255,0.4)] transition-all cursor-pointer inline-flex items-center gap-1.5 font-retro-mono text-sm uppercase px-2.5"
                        title="Inspect Order File"
                      >
                        <Eye size={12} />
                        <span>VIEW</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-cream-muted uppercase text-xs">
                  NO CORRESPONDING ORDER FILE FOUND.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default OrderTable;
