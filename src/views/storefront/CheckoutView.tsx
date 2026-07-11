/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Truck, ShoppingBag, CheckCircle, ArrowRight, HelpCircle, ArrowLeft } from 'lucide-react';
import { Order, OrderItem, CategoryType } from '../../types';
import { dbService, isSupabaseConfigured } from '../../lib/supabase';
import { isStripeRail, isStripeConfigured, createPaymentIntent, startStripeCheckout } from '../../lib/payments';
import { StripePaymentPanel } from '../../components/storefront/StripePaymentPanel';

interface CheckoutViewProps {
  cartItems: OrderItem[];
  onClearCart: () => void;
  onNavigate: (page: 'home' | 'shop' | 'checkout') => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  onClearCart,
  onNavigate,
}) => {
  // Customer details form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [country, setCountry] = useState('Zambia');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Stripe Credit Card');
  const [notes, setNotes] = useState('');

  // Form error and submission success state tracker
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  // On-site Stripe Payment Element step (order created + intent ready).
  const [stripePayment, setStripePayment] = useState<
    { clientSecret: string; order: Order } | null
  >(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Complimentary shipping is 0

  const countries = ['Zambia', 'South Africa', 'United States', 'United Kingdom', 'Japan', 'Germany', 'Australia', 'Canada'];
  const paymentOptions = ['Stripe Credit Card', 'Airtel Mobile Money', 'MTN Mobile Money', 'Apple Pay', 'Cryptocurrency Wallet'];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim()) newErrors.customerName = 'OPERATIVE NAME IS MANDATORY.';
    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'OPERATIVE EMAIL ADDRESS IS MANDATORY.';
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      newErrors.customerEmail = 'SPECIFY A RECOGNIZED EMAIL STRUCTURE.';
    }
    if (!customerPhone.trim()) newErrors.customerPhone = 'CONTACT COMMS NO. IS REQUIRED.';
    if (!address.trim()) newErrors.address = 'GEOGRAPHIC SHIPPING COORDINATE IS REQUIRED.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    try {
      // 1. Prepare minimal order payload containing only product identifier and quantity inputs
      const orderPayload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        country,
        address,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })),
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      // 2. Dispatch secure order creation to the database service.
      //    Orders are always created server-side with payment_status='pending'.
      const orderResult = await dbService.createOrder(orderPayload);

      // 3. Payment.
      //    SECURITY: a browser must never certify its own payment. Card rails in
      //    live mode redirect to hosted Stripe Checkout; only the Stripe webhook
      //    may flip the order to 'paid'. The offline sandbox simulates a
      //    settlement (no real money, no server). Non-card rails stay pending.
      const cardRail = isStripeRail(paymentMethod);

      if (cardRail && isStripeConfigured()) {
        // Preferred: on-site Payment Element. Create the intent, then render the
        // card form. Cart stays intact until payment succeeds.
        const clientSecret = await createPaymentIntent(orderResult.id);
        setStripePayment({ clientSecret, order: orderResult });
        setIsSubmitting(false);
        return; // hand off to the payment step
      }

      if (cardRail && isSupabaseConfigured()) {
        // Fallback (Supabase live but no publishable key): hosted Stripe Checkout.
        const checkoutUrl = await startStripeCheckout(orderResult.id);
        window.location.href = checkoutUrl;
        return; // navigating away
      }

      if (cardRail && !isSupabaseConfigured()) {
        // Sandbox-only simulated settlement (clearly marked, not a real session).
        const confirmedOrder = await dbService.confirmPayment(
          orderResult.id,
          `sandbox_sim_${Math.random().toString(36).substring(2, 10)}`
        );
        setCreatedOrder(confirmedOrder);
      } else {
        // Non-card rails (mobile money, crypto): pending awaiting confirmation.
        setCreatedOrder(orderResult);
      }

      onClearCart();
    } catch (err: any) {
      console.error("Critical: Order creation crashed", err);
      setErrors({ form: err.message || 'CRITICAL DISPATCH ERROR. SERVER HANDSHAKE SUSPENDED. RE-ATTEMPT TRANSACTION.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ON-SITE STRIPE PAYMENT STEP
  if (stripePayment) {
    const amountLabel = `$${stripePayment.order.total.toFixed(2)}`;
    return (
      <div className="max-w-lg mx-auto py-10 px-4 font-sans text-[#F8F3E9] selection:bg-[#9B6DFF] selection:text-[#0A0812]">
        <div className="border-b border-[#2A1F45] pb-5 mb-6 text-center select-none">
          <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.3em] font-bold uppercase block mb-1">
            CLEARING HOUSE // DESK 05
          </span>
          <h2 className="font-serif text-2xl tracking-wider uppercase font-semibold">
            SETTLE TRANSACTION
          </h2>
          <span className="text-[10px] font-body-mono text-[#F8F3E9]/50 uppercase tracking-wider block mt-2">
            Order Reference: {stripePayment.order.id}
          </span>
        </div>

        <div className="bg-[#120F1E] border border-[#2A1F45] p-5">
          <StripePaymentPanel
            clientSecret={stripePayment.clientSecret}
            amountLabel={amountLabel}
            orderId={stripePayment.order.id}
            onPaid={() => {
              setCreatedOrder({
                ...stripePayment.order,
                payment_status: 'paid',
                order_status: 'processing',
              });
              setStripePayment(null);
              onClearCart();
            }}
            onBack={() => setStripePayment(null)}
          />
        </div>
      </div>
    );
  }

  // SUCCESS STATE SCREEN RENDERING
  if (createdOrder) {
    const isSettled = createdOrder.payment_status === 'paid';
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-8 font-sans select-none text-[#F8F3E9] selection:bg-[#9B6DFF] selection:text-[#0A0812]">
        
        {/* Animated Checkmark and Title */}
        <div className="flex flex-col items-center space-y-3">
          <CheckCircle
            size={56}
            className={`${isSettled ? 'text-[#39FF14]' : 'text-[#B68D40]'} animate-bounce`}
          />
          <h2 className="font-serif text-3xl tracking-wider text-[#F8F3E9] uppercase font-bold italic">
            {isSettled ? 'Cargo Dispatched!' : 'Order Received!'}
          </h2>
          <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold block uppercase">
            Order Reference: {createdOrder.id}
          </span>
        </div>

        {/* Success summary card */}
        <div className="bg-[#120F1E] border border-[#2A1F45] p-6 space-y-5 text-left text-xs font-body-mono">
          <div className="border-b border-[#2A1F45] pb-3 text-center">
            {isSettled ? (
              <span className="text-[#39FF14] font-bold">TRANSACTION CERTIFIED &amp; VERIFIED</span>
            ) : (
              <span className="text-[#B68D40] font-bold">ORDER LOGGED // AWAITING PAYMENT CONFIRMATION</span>
            )}
          </div>

          <div className="space-y-2 leading-relaxed">
            <div>
              <span className="text-[#F8F3E9]/50 uppercase">Recipient:</span>{' '}
              <span className="text-[#F8F3E9] font-bold uppercase">{createdOrder.customer_name}</span>
            </div>
            <div>
              <span className="text-[#F8F3E9]/50 uppercase">Contact Frequency:</span>{' '}
              <span className="text-[#F8F3E9]">{createdOrder.customer_email}</span>
            </div>
            <div>
              <span className="text-[#F8F3E9]/50 uppercase">Coordinate:</span>{' '}
              <span className="text-[#F8F3E9] uppercase">{createdOrder.address}, {createdOrder.country}</span>
            </div>
            <div>
              <span className="text-[#F8F3E9]/50 uppercase">Clearing Status:</span>{' '}
              <span className={`${isSettled ? 'text-[#39FF14]' : 'text-[#B68D40]'} font-bold uppercase`}>{createdOrder.payment_status}</span>
            </div>
            <div>
              <span className="text-[#F8F3E9]/50 uppercase">Cargo List:</span>
              <ul className="pl-4 pt-1 list-disc text-[11px] text-[#F8F3E9]/85 space-y-1">
                {createdOrder.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''} — ${(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-2 border-t border-[#2A1F45]/60 flex justify-between text-sm font-bold text-[#F8F3E9]">
              <span className="text-[#B68D40]">TOTAL CLEARED:</span>
              <span className="text-[#9B6DFF]">${createdOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Security / Delivery parameters */}
        <p className="text-xs text-[#F8F3E9]/65 leading-relaxed font-light">
          {isSettled
            ? 'Your dispatch authorization forms have been compiled and sent to our logistical crew at Great East Road, Lusaka. Standard interplanetary cargo freight is estimated to deliver within 3-5 operational solar days.'
            : 'Your order has been logged securely. Once payment is confirmed by our clearing house, dispatch will be authorized and you will receive a settlement confirmation at your comms frequency.'}
        </p>

        {/* Home redirect */}
        <div className="pt-4">
          <button
            onClick={() => onNavigate('home')}
            className="px-8 py-4 bg-[#9B6DFF] hover:bg-[#9B6DFF]/80 text-[#0A0812] text-xs font-body-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>RETURN TO OUTPOST</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>
    );
  }

  // STANDARD FORM SCREEN RENDERING
  return (
    <div className="text-[#F8F3E9] font-sans selection:bg-[#9B6DFF] selection:text-[#0A0812]">
      
      {/* Page Title Header */}
      <div className="border-b border-[#2A1F45] pb-6 mb-10 select-none">
        <button
          onClick={() => onNavigate('shop')}
          className="text-[10px] sm:text-xs font-body-mono uppercase text-[#9B6DFF] hover:text-[#9B6DFF]/80 transition-colors flex items-center gap-2 group cursor-pointer mb-4"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>&lt;= RETURN TO CATALOGUE SECTOR</span>
        </button>
        <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.3em] font-bold uppercase block mb-1">
          CARGO DISPATCH FORM // DESK 04
        </span>
        <h2 className="font-serif text-3xl tracking-wider uppercase font-semibold">
          ORDER DESPATCH DESK
        </h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-[#120F1E] border border-[#2A1F45] text-[#F8F3E9]/50 font-body-mono text-xs uppercase space-y-4 select-none">
          <span>NO AUTHORIZED ITEMS IN TRANSIENT MEMORY.</span>
          <div>
            <button
              onClick={() => onNavigate('shop')}
              className="px-6 py-3 bg-[#9B6DFF] text-[#0A0812] font-bold tracking-widest text-[10px] uppercase hover:bg-[#9B6DFF]/85 cursor-pointer"
            >
              EXPLORE CATALOGUE
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT PANEL: DISPATCH AUTHORIZATION FORM FIELDS */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6 select-none">
            
            <h3 className="text-xs font-body-mono font-bold tracking-widest text-[#B68D40] uppercase border-b border-[#2A1F45] pb-2">
              [SECTOR A] RECIPIENT COMPILATION
            </h3>

            {errors.form && (
              <div className="bg-[#FF4444]/10 border border-[#FF4444]/25 p-3 text-xs font-body-mono text-[#FF4444] uppercase">
                {errors.form}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Operative Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. MUTALE CHANDA"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] placeholder-[#F8F3E9]/20 uppercase
                    ${errors.customerName ? 'border-[#FF4444]' : ''}`}
                />
                {errors.customerName && (
                  <span className="text-[9px] font-body-mono text-[#FF4444] block">{errors.customerName}</span>
                )}
              </div>

              {/* Recipient Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Comms frequency (Email)
                </label>
                <input
                  type="email"
                  placeholder="e.g. OPERATIVE@OUTPOST.COM"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] placeholder-[#F8F3E9]/20 uppercase
                    ${errors.customerEmail ? 'border-[#FF4444]' : ''}`}
                />
                {errors.customerEmail && (
                  <span className="text-[9px] font-body-mono text-[#FF4444] block">{errors.customerEmail}</span>
                )}
              </div>

              {/* Recipient Phone */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Comms contact number (Phone)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +260 977 123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] placeholder-[#F8F3E9]/20
                    ${errors.customerPhone ? 'border-[#FF4444]' : ''}`}
                />
                {errors.customerPhone && (
                  <span className="text-[9px] font-body-mono text-[#FF4444] block">{errors.customerPhone}</span>
                )}
              </div>
            </div>

            <h3 className="text-xs font-body-mono font-bold tracking-widest text-[#B68D40] uppercase border-b border-[#2A1F45] pb-2 pt-4">
              [SECTOR B] GEOGRAPHIC DISPATCH COORDINATES
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Zone / Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] cursor-pointer uppercase"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address Coordinates */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Street Coordinates / Suite / Apt
                </label>
                <input
                  type="text"
                  placeholder="e.g. PLOT 45, GREAT EAST ROAD, LUSAKA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] placeholder-[#F8F3E9]/20 uppercase
                    ${errors.address ? 'border-[#FF4444]' : ''}`}
                />
                {errors.address && (
                  <span className="text-[9px] font-body-mono text-[#FF4444] block">{errors.address}</span>
                )}
              </div>
            </div>

            <h3 className="text-xs font-body-mono font-bold tracking-widest text-[#B68D40] uppercase border-b border-[#2A1F45] pb-2 pt-4">
              [SECTOR C] CLEARING METHODOLOGY & NOTES
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Payment Method Selector */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Clearing House
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] cursor-pointer uppercase"
                >
                  {paymentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Notes */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-body-mono text-[#F8F3E9]/55 uppercase font-bold">
                  Special Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. SECURE AT THE GATE IF COLD DOCK IS OCCUPIED."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-3 text-[#F8F3E9] placeholder-[#F8F3E9]/20 uppercase resize-none"
                />
              </div>
            </div>

            {/* Form Security Notice and Submit button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4.5 bg-[#9B6DFF] hover:bg-[#9B6DFF]/85 text-[#0A0812] text-xs font-body-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(155,109,255,0.4)] disabled:opacity-40 disabled:cursor-wait"
              >
                <span>
                  {isSubmitting
                    ? 'AUTHORIZING DISPATCH...'
                    : isStripeRail(paymentMethod) && isStripeConfigured()
                    ? 'PROCEED TO SECURE PAYMENT'
                    : 'CONFIRM CARGO DISPATCH AUTHORIZATION'}
                </span>
                <ArrowRight size={13} />
              </button>
            </div>

          </form>

          {/* RIGHT PANEL: SUMMARY & SPECIFICATION BREAKDOWN */}
          <section className="lg:col-span-5 bg-[#120F1E] border border-[#2A1F45] p-5 space-y-6 sticky top-24 select-none">
            
            <h3 className="text-xs font-body-mono font-bold tracking-widest text-[#B68D40] uppercase border-b border-[#2A1F45] pb-2">
              DISPATCH COMPILATION SUMMARY
            </h3>

            {/* List of items */}
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-3 border-b border-[#2A1F45]/40 pb-3 last:border-0 last:pb-0">
                  <div className="w-12 h-16 bg-[#0A0812] border border-[#2A1F45] shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover filter brightness-90" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-body-mono text-[#F8F3E9]/10">NO IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="text-xs font-serif text-[#F8F3E9] truncate">{item.name}</h4>
                      <span className="text-[9px] font-body-mono text-[#B68D40] uppercase">
                        QTY: {item.quantity} // {item.size ? `SIZE: ${item.size}` : 'OS'}
                      </span>
                    </div>
                    <span className="text-sm font-retro-mono font-bold text-[#9B6DFF] block pt-1 data-heavy">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations summaries */}
            <div className="border-t border-[#2A1F45] pt-4 space-y-2 font-retro-mono order-summary text-base">
              <div className="flex justify-between text-[#F8F3E9]/60">
                <span>CARGO SUB-TOTAL:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#F8F3E9]/60">
                <span>LOGISTICAL FREIGHT:</span>
                <span className="text-[#39FF14] font-bold">COMPLIMENTARY</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#F8F3E9] pt-1.5 border-t border-[#2A1F45]/60">
                <span className="text-[#B68D40]">TOTAL DISPATCH VALUE:</span>
                <span className="text-[#9B6DFF]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Secure Badging logos */}
            <div className="space-y-3.5 bg-[#0A0812] border border-[#2A1F45] p-3.5 rounded-none">
              <div className="flex gap-2.5 text-[10px] font-body-mono text-[#39FF14]">
                <ShieldCheck size={14} className="shrink-0" />
                <div>
                  <span className="font-bold block uppercase">SECURE TRANSFER PORTAL</span>
                  <p className="text-[9px] text-[#F8F3E9]/50 leading-relaxed font-light mt-0.5">
                    End-to-end telemetry verification validates all order transfers through strict merchant validation guidelines.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 text-[10px] font-body-mono text-[#B68D40]">
                <Truck size={14} className="shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold block uppercase">HIGH-ALTITUDE CARRIER DIRECT</span>
                  <p className="text-[9px] text-[#F8F3E9]/50 leading-relaxed font-light mt-0.5">
                    Dispatch logistics managed directly out of Great East Road, Lusaka sector warehouse.
                  </p>
                </div>
              </div>
            </div>

          </section>

        </div>
      )}

    </div>
  );
};
