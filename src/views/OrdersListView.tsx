/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Order } from '../types';
import { OrderTable } from '../components/admin/OrderTable';

interface OrdersListViewProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({ orders, onViewOrder }) => {
  return (
    <div className="space-y-6 font-body-mono select-none text-cream animate-fadeIn">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-retro-surface border-2 border-retro-border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-purple/10 border border-accent-purple/30 text-accent-purple">
            <ShoppingCart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-retro-heading uppercase tracking-widest text-cream">
              ORDERS REGISTRY LOGS
            </h3>
            <p className="text-[10px] text-cream-muted uppercase leading-none mt-1">
              {orders.length} transaction logs recorded in central telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Main Order table render */}
      <OrderTable
        orders={orders}
        onViewDetails={onViewOrder}
      />

    </div>
  );
};
export default OrdersListView;
