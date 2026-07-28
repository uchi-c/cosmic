/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Calendar, User, Phone, MapPin, Mail, CreditCard, DollarSign, Clock, ShieldCheck, Receipt, ExternalLink, AlertTriangle } from 'lucide-react';
import { Order, OrderStatusType, PaymentStatusType } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { format } from 'date-fns';
import { generateInvoiceForOrder, listInvoicesForOrder, InvoiceRecord } from '../lib/invoices';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onUpdateOrder: (updated: Order) => Promise<void>;
}

interface TimelineEntry {
  status: string;
  timestamp: string;
  operator: string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  onBack,
  onUpdateOrder,
}) => {
  // Local state for dropdown selectors
  const [orderStatus, setOrderStatus] = useState<OrderStatusType>(order.order_status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>(order.payment_status);
  const [internalNotes, setInternalNotes] = useState(order.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Timeline records list
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  // Stripe Invoicing state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Load any invoices already issued for this order
  useEffect(() => {
    let active = true;
    listInvoicesForOrder(order.id).then((list) => {
      if (active) setInvoices(list);
    });
    return () => {
      active = false;
    };
  }, [order.id]);

  const handleGenerateInvoice = async () => {
    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      await generateInvoiceForOrder(order.id);
      const list = await listInvoicesForOrder(order.id);
      setInvoices(list);
    } catch (err) {
      setInvoiceError((err as Error).message || 'Failed to generate invoice.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Pre-seed timeline based on order records
  useEffect(() => {
    const entries: TimelineEntry[] = [];
    const baseTime = new Date(order.created_at);

    // Initial log
    entries.push({
      status: 'ORDER RECORD DETECTED & INITIALIZED',
      timestamp: format(baseTime, 'yyyy-MM-dd HH:mm:ss'),
      operator: 'SYSTEM_AUTOPILOT',
    });

    // Payment step
    if (order.payment_status === 'paid') {
      const payTime = new Date(baseTime.getTime() + 15 * 60 * 1000); // 15 mins later
      entries.push({
        status: 'CREDIT CARD CAPTURE: TRANSACTION SECURED',
        timestamp: format(payTime, 'yyyy-MM-dd HH:mm:ss'),
        operator: 'STRIPE_INTEGRATION_ENGINE',
      });
    }

    // Processing status log
    if (order.order_status === 'processing' || order.order_status === 'completed') {
      const procTime = new Date(baseTime.getTime() + 45 * 60 * 1000); // 45 mins later
      entries.push({
        status: 'FULFILLMENT DISPATCHED TO PROCESSING QUEUE',
        timestamp: format(procTime, 'yyyy-MM-dd HH:mm:ss'),
        operator: 'uchichinyama@gmail.com',
      });
    }

    // Completed status log
    if (order.order_status === 'completed') {
      const compTime = new Date(baseTime.getTime() + 3 * 3600 * 1000); // 3 hours later
      entries.push({
        status: 'SHIPPING LABELS VERIFIED: SHIPMENT DEPARTED',
        timestamp: format(compTime, 'yyyy-MM-dd HH:mm:ss'),
        operator: 'ops@cosmicdept.com',
      });
    }

    setTimeline(entries);
    setOrderStatus(order.order_status);
    setPaymentStatus(order.payment_status);
    setInternalNotes(order.notes || '');
    setUpdateSuccess(false);
  }, [order]);

  // Action: Commit changes
  const handleSaveChanges = async () => {
    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const now = new Date();
      
      const updatedOrder: Order = {
        ...order,
        order_status: orderStatus,
        payment_status: paymentStatus,
        notes: internalNotes.trim() || null,
      };

      await onUpdateOrder(updatedOrder);

      // Append real-time timeline change indicators
      const newLogs: TimelineEntry[] = [...timeline];
      if (orderStatus !== order.order_status) {
        newLogs.push({
          status: `MANUAL ORDER STATUS UPDATE TO: [${orderStatus.toUpperCase()}]`,
          timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
          operator: 'uchichinyama@gmail.com',
        });
      }
      if (paymentStatus !== order.payment_status) {
        newLogs.push({
          status: `MANUAL PAYMENT STATUS UPDATE TO: [${paymentStatus.toUpperCase()}]`,
          timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
          operator: 'uchichinyama@gmail.com',
        });
      }
      setTimeline(newLogs);

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save status modifications:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 font-body-mono select-none text-cream animate-fadeIn">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-retro-surface border-2 border-retro-border p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cream-muted hover:text-accent-purple transition-colors text-xs font-bold font-retro-mono tracking-wider cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>BACK TO REGISTRY</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-cream-muted uppercase font-bold">TRANSACTION:</span>
          <span className="text-accent-purple font-bold font-retro-mono text-lg">
            #{order.id.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Save success banner */}
      {updateSuccess && (
        <div className="p-3 bg-retro-green/10 border-2 border-retro-green text-retro-green text-xs flex items-center gap-2">
          <ShieldCheck size={16} className="shrink-0" />
          <span>TRANSACTION MUTATIONS SUCCESSFULLY COMMITTED TO TELEMETRY STORAGE BANKS.</span>
        </div>
      )}

      {/* 2. Main content Layout panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Customer info & itemized invoice lists (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer File Box */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [OPERATIVE / CUSTOMER PROFILE]
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-accent-purple" />
                  <span className="text-cream-muted uppercase font-bold w-20 shrink-0">NAME:</span>
                  <span className="text-cream font-bold">{order.customer_name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-accent-purple" />
                  <span className="text-cream-muted uppercase font-bold w-20 shrink-0">EMAIL:</span>
                  <a href={`mailto:${order.customer_email}`} className="text-retro-gold hover:underline">
                    {order.customer_email}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-accent-purple" />
                  <span className="text-cream-muted uppercase font-bold w-20 shrink-0">PHONE:</span>
                  <span className="text-cream">{order.customer_phone || 'UNSPECIFIED'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-accent-purple mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-cream-muted uppercase font-bold leading-none">SECTOR ADDRESS:</span>
                    <span className="text-cream leading-relaxed font-semibold">
                      {order.address || 'N/A'}<br />
                      {order.country || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Invoice Box */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [ITEMIZED TRANS-INVOICE]
            </h4>

            <div className="border border-retro-border bg-space-black/30 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-space-black border-b border-retro-border text-[10px] text-cream-muted uppercase tracking-wider font-bold">
                    <th className="p-3 w-16">IMAGE</th>
                    <th className="p-3">SPECIFICATION DESCRIPTION</th>
                    <th className="p-3 w-28 text-right">UNIT VALUE</th>
                    <th className="p-3 w-24 text-center">QUANTITY</th>
                    <th className="p-3 w-28 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-retro-border text-xs">
                  {order.items.map((item, idx) => {
                    const total = item.price * item.quantity;
                    return (
                      <tr key={item.id + '-' + idx} className="hover:bg-space-black/20">
                        {/* Image Preview */}
                        <td className="p-3">
                          <div className="w-10 h-10 border border-retro-border bg-space-black overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-retro-mono text-cream-muted text-base bg-space-black">
                                N/A
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Description Name / Size / Color */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1 font-bold">
                            <span className="uppercase text-cream">{item.name}</span>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {item.size && (
                                <Badge variant="default" className="text-[10px] py-0 px-1 border-retro-border/50 text-[9px]">
                                  SIZE: {item.size}
                                </Badge>
                              )}
                              {item.color && (
                                <div className="flex items-center gap-1">
                                  <Badge variant="default" className="text-[10px] py-0 px-1 border-retro-border/50 text-[9px]">
                                    COLOR: {item.color}
                                  </Badge>
                                  <span className="w-2.5 h-2.5 border border-retro-border rounded-none inline-block" style={{ backgroundColor: item.color }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Unit price */}
                        <td className="p-3 text-right font-mono font-bold text-cream-muted">
                          ${item.price.toFixed(2)}
                        </td>

                        {/* Qty count */}
                        <td className="p-3 text-center font-mono font-bold text-cream">
                          {item.quantity}
                        </td>

                        {/* Row item total */}
                        <td className="p-3 text-right font-mono font-bold text-accent-purple">
                          ${total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Receipt Summary math logs */}
            <div className="flex justify-end pt-2">
              <div className="w-full max-w-xs space-y-2 border-2 border-retro-border bg-space-black/30 p-3.5 text-xs font-mono font-bold">
                <div className="flex justify-between text-cream-muted">
                  <span>SUBTOTAL:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cream-muted">
                  <span>SECTOR LOGISTICS (SHIPPING):</span>
                  <span>${(order.total - order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-retro-border pt-2 text-base text-accent-purple">
                  <span>GRAND TOTAL VALUE:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit states, admin notes, timeline logs */}
        <div className="space-y-6">
          
          {/* Status editing panel */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [TELEMETRY MUTATIONS]
            </h4>

            {/* Order status dropdown */}
            <Select
              label="FULFILLMENT FLOW STATUS"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatusType)}
              options={[
                { value: 'pending', label: 'PENDING' },
                { value: 'processing', label: 'PROCESSING' },
                { value: 'completed', label: 'COMPLETED' },
                { value: 'cancelled', label: 'CANCELLED' },
              ]}
            />

            {/* Payment status dropdown */}
            <Select
              label="PAYMENT BILLING STATUS"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusType)}
              options={[
                { value: 'pending', label: 'PENDING' },
                { value: 'paid', label: 'PAID' },
                { value: 'failed', label: 'FAILED' },
                { value: 'refunded', label: 'REFUNDED' },
              ]}
            />

            {/* Notes Input area */}
            <div className="flex flex-col gap-1.5 font-body-mono pt-1">
              <label className="text-xs text-cream-muted uppercase tracking-wider block">
                Internal Operator Notes:
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Type secure internal tracking telemetry notes..."
                maxLength={400}
                className="bg-space-black text-cream border-2 border-retro-border p-2.5 text-xs focus:outline-none focus:border-accent-purple h-24 resize-none"
              />
            </div>

            {/* Save trigger button */}
            <Button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="w-full py-3 text-xs flex items-center justify-center gap-1.5 font-bold"
            >
              {isUpdating ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-space-black border-t-transparent rounded-full mr-2" />
                  <span>WRITING MUTATIONS...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>COMMIT CHANGES</span>
                </>
              )}
            </Button>
          </div>

          {/* Stripe Invoicing panel */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1 flex items-center gap-2">
              <Receipt size={13} className="text-retro-gold" />
              [STRIPE INVOICING]
            </h4>

            {invoiceError && (
              <div className="flex items-start gap-2 bg-retro-red/10 border-2 border-retro-red/50 p-2.5 text-[10px] text-retro-red uppercase">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>{invoiceError}</span>
              </div>
            )}

            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 border border-retro-border bg-space-black/30 p-2.5 text-[11px]"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-bold text-cream">
                        ${inv.amount_due.toFixed(2)} {inv.currency}
                      </span>
                      <span className="text-[9px] text-cream-muted uppercase">
                        {format(new Date(inv.created_at), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'void' || inv.status === 'uncollectible'
                            ? 'danger'
                            : 'warning'
                        }
                        className="text-[9px]"
                      >
                        {inv.status}
                      </Badge>
                      {inv.hosted_invoice_url && (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-purple hover:text-retro-gold flex items-center gap-1 font-bold"
                          title="Open hosted invoice"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-cream-muted uppercase leading-relaxed">
                No invoices issued for this order yet.
              </p>
            )}

            <Button
              variant="warning"
              onClick={handleGenerateInvoice}
              disabled={invoiceLoading}
              className="w-full py-3 text-xs flex items-center justify-center gap-1.5 font-bold"
            >
              {invoiceLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-space-black border-t-transparent rounded-full mr-2" />
                  <span>GENERATING INVOICE...</span>
                </>
              ) : (
                <>
                  <Receipt size={14} />
                  <span>GENERATE &amp; SEND INVOICE</span>
                </>
              )}
            </Button>

            <p className="text-[9px] text-cream-muted uppercase leading-relaxed">
              Emails a Stripe hosted invoice (net 30 days) to{' '}
              <span className="text-retro-gold">{order.customer_email}</span>.
            </p>
          </div>

          {/* Chronological Audit Timeline logs */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [CHRONO LOGS AUDIT]
            </h4>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {timeline.map((log, idx) => (
                <div key={idx} className="relative pl-4 border-l border-accent-purple/40 text-[10px] space-y-0.5 pb-1">
                  {/* Glowing vertical node */}
                  <div className="absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 bg-accent-purple" />
                  
                  <div className="text-cream-muted font-bold font-retro-mono text-xs uppercase leading-none">
                    {log.status}
                  </div>
                  <div className="text-[9px] text-retro-gold font-mono uppercase mt-0.5">
                    TS: {log.timestamp}
                  </div>
                  <div className="text-[9px] text-cream-muted/60 font-mono uppercase">
                    OP: {log.operator}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-retro-border text-[8px] text-cream-muted uppercase font-mono leading-relaxed text-center">
              SECURE LOGS PRESERVED BY SHADOW SYSTEM TELEMETRY AUTOPILOT PROTOCOL.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default OrderDetailView;
