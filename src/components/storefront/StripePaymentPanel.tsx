/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getStripe } from '../../lib/payments';

interface StripePaymentPanelProps {
  clientSecret: string;
  amountLabel: string;
  orderId: string;
  onPaid: () => void;
  onBack: () => void;
}

// Retro-themed Stripe Elements appearance.
const appearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#9B6DFF',
    colorBackground: '#0A0812',
    colorText: '#F8F3E9',
    colorDanger: '#FF4444',
    fontFamily: 'Space Mono, monospace',
    borderRadius: '0px',
    spacingUnit: '4px',
  },
};

const InnerForm: React.FC<{
  amountLabel: string;
  orderId: string;
  onPaid: () => void;
  onBack: () => void;
}> = ({ amountLabel, orderId, onPaid, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    // Cards settle inline; redirect-based methods bounce to return_url, which
    // App.tsx handles as ?order_success.
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}?order_success=${encodeURIComponent(orderId)}`,
      },
      redirect: 'if_required',
    });

    if (payError) {
      setError(payError.message || 'Payment could not be completed.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaid();
      return;
    }

    if (paymentIntent && paymentIntent.status === 'processing') {
      // Async method accepted; the webhook will settle it.
      onPaid();
      return;
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-[#2A1F45] pb-3">
        <span className="text-xs font-body-mono font-bold tracking-widest text-[#B68D40] uppercase flex items-center gap-2">
          <Lock size={13} className="text-[#9B6DFF]" /> SECURE CARD SETTLEMENT
        </span>
        <span className="font-retro-mono text-[#9B6DFF] text-lg leading-none">{amountLabel}</span>
      </div>

      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="flex items-start gap-2 bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 text-[11px] font-body-mono text-[#FF4444] uppercase">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!stripe || submitting}
        className="w-full py-4 bg-[#9B6DFF] hover:bg-[#9B6DFF]/85 text-[#0A0812] text-xs font-body-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(155,109,255,0.4)] disabled:opacity-40 disabled:cursor-wait"
      >
        <ShieldCheck size={14} />
        <span>{submitting ? 'AUTHORIZING PAYMENT...' : `PAY ${amountLabel}`}</span>
      </button>

      <button
        onClick={onBack}
        disabled={submitting}
        className="w-full py-2.5 border border-[#2A1F45] hover:border-[#9B6DFF] text-[#F8F3E9]/70 hover:text-[#F8F3E9] text-[10px] font-body-mono tracking-[0.2em] uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <ArrowLeft size={12} />
        <span>EDIT DISPATCH DETAILS</span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[9px] font-body-mono text-[#39FF14] uppercase">
        <ShieldCheck size={11} />
        <span>PAYMENTS SECURED &amp; ENCRYPTED BY STRIPE</span>
      </div>
    </div>
  );
};

/**
 * StripePaymentPanel — mounts Stripe's on-site Payment Element so shoppers pay
 * without leaving the store. The order is created (pending) before this renders;
 * the Stripe webhook is the source of truth that marks it paid.
 */
export const StripePaymentPanel: React.FC<StripePaymentPanelProps> = ({
  clientSecret,
  amountLabel,
  orderId,
  onPaid,
  onBack,
}) => {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret, appearance }}>
      <InnerForm amountLabel={amountLabel} orderId={orderId} onPaid={onPaid} onBack={onBack} />
    </Elements>
  );
};

export default StripePaymentPanel;
