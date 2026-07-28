/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package, PackageCheck, ClipboardList, RefreshCw, Landmark, AlertTriangle, ChevronRight, PlusCircle, ShoppingCart } from 'lucide-react';
import { Product, Order } from '../types';
import { StatsCard } from '../components/admin/StatsCard';
import { AnalyticsCharts } from '../components/admin/AnalyticsCharts';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  onNavigate: (view: any) => void;
  onViewOrder: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  onNavigate,
  onViewOrder,
}) => {
  // Calculators
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
  
  // Total Revenue: sum of totals from orders that are paid or completed
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid' || o.order_status === 'completed')
    .reduce((acc, o) => acc + o.total, 0);

  // Low Stock Items (stock < 5)
  const lowStockItems = products.filter(p => p.stock < 5);

  // Recent 10 Orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6 font-body-mono select-none text-cream animate-fadeIn">
      
      {/* 1. Quick Action Operations Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-retro-surface border-2 border-retro-border p-4 justify-between items-center">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <p className="text-xs text-cream uppercase tracking-wider font-bold">
            QUICK ACCESS CONTROLS
          </p>
          <p className="text-[10px] text-cream-muted uppercase leading-none">
            Dispatch product or order commands instantly
          </p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('products-new')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={14} />
            <span>ADD PRODUCT</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('orders')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={14} />
            <span>VIEW ORDERS</span>
          </Button>
        </div>
      </div>

      {/* 2. Statistical Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="TOTAL PRODUCTS"
          value={totalProducts}
          icon={Package}
          subtext="Catalog items"
          color="purple"
          countUp
        />
        <StatsCard
          title="ACTIVE PRODUCTS"
          value={activeProducts}
          icon={PackageCheck}
          subtext="Available online"
          color="green"
          countUp
        />
        <StatsCard
          title="TOTAL ORDERS"
          value={totalOrders}
          icon={ClipboardList}
          subtext="All time logs"
          color="purple"
          countUp
        />
        <StatsCard
          title="PENDING ORDERS"
          value={pendingOrders}
          icon={RefreshCw}
          subtext="Requires fulfillment"
          color="gold"
          countUp
        />
        <StatsCard
          title="GROSS REVENUE"
          value={totalRevenue}
          icon={Landmark}
          subtext="Paid transactions"
          color="green"
          countUp
          prefix="$"
          decimals={2}
          separator
        />
      </div>

      {/* 2b. Stock + Finance Analytics */}
      <AnalyticsCharts products={products} orders={orders} />

      {/* 3. Multi-Column: Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT / LARGE SIDE: Recent Orders */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-retro-heading uppercase text-accent-purple tracking-widest flex items-center gap-2">
              :: RECENT ACTIVITY
            </h3>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-retro-gold hover:underline flex items-center gap-0.5 font-retro-mono text-base"
            >
              INSPECT ALL ORDERS <ChevronRight size={14} />
            </button>
          </div>

          <div className="border-2 border-retro-border bg-retro-surface overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-space-black border-b-2 border-retro-border text-[10px] text-cream-muted uppercase tracking-widest font-bold">
                  <th className="p-3">ID</th>
                  <th className="p-3">CUSTOMER</th>
                  <th className="p-3">TOTAL</th>
                  <th className="p-3">PAYMENT</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-retro-border text-xs">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-space-black/25 transition-colors">
                      <td className="p-3 font-mono font-bold text-accent-purple">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold truncate max-w-[120px]">{order.customer_name}</div>
                      </td>
                      <td className="p-3 font-mono font-bold">${order.total.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'} className="text-[9px]">
                          {order.payment_status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={order.order_status === 'completed' ? 'success' : order.order_status === 'cancelled' ? 'danger' : 'warning'} className="text-[9px]">
                          {order.order_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="text-[10px] bg-space-black border border-retro-border text-cream-muted hover:text-accent-purple hover:border-accent-purple px-2 py-1 font-retro-mono tracking-wider cursor-pointer"
                        >
                          INSPECT
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-cream-muted uppercase font-retro-mono text-sm">
                      NO RECENT TRANSACTION LOGS FOUND.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SIDE: Alerts and Stock Threshold Warnings */}
        <div className="space-y-3">
          <h3 className="text-sm font-retro-heading uppercase text-retro-gold tracking-widest">
            :: SYSTEM THREAT ALERTS
          </h3>

          <div className="border-2 border-retro-border bg-retro-surface p-4 flex flex-col gap-3 min-h-[300px]">
            <p className="text-[10px] text-cream-muted uppercase tracking-wider font-bold">
              INVENTORY WARNINGS (&lt; 5 units):
            </p>

            {lowStockItems.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-retro-gold/5 border-2 border-retro-gold/30 text-xs hover:border-retro-gold transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold truncate text-cream uppercase">{item.name}</p>
                      <p className="text-[10px] text-retro-gold font-retro-mono uppercase mt-0.5">
                        CRITICAL LEVEL: {item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} LEFT`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="retro-outline"
                      onClick={() => onNavigate('products')}
                      className="text-[9px] px-2 py-0.5 border h-6 border-retro-gold/40 text-retro-gold hover:border-retro-gold shrink-0 hover:bg-retro-gold/10"
                    >
                      RESTOCK
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-retro-green/5 border-2 border-retro-green/20">
                <div className="p-3 bg-retro-green/10 text-retro-green border border-retro-green/30 mb-2">
                  <PackageCheck size={24} />
                </div>
                <p className="text-xs text-retro-green uppercase font-bold tracking-widest font-retro-mono">
                  ALL SYSTEMS NOMINAL
                </p>
                <p className="text-[10px] text-cream-muted uppercase leading-relaxed mt-1.5">
                  All active product stock is safely above low threshold limits.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-retro-border text-[9px] text-cream-muted uppercase font-mono leading-relaxed">
              SECTOR SECURITY METRICS MONITORED BY SHADOW ROOT CRITICAL MONITORING NETWORK.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default DashboardView;
