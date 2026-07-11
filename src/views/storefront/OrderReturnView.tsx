/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle, XCircle, ArrowRight, ShoppingBag } from 'lucide-react';

interface OrderReturnViewProps {
  status: 'success' | 'cancelled';
  orderId: string;
  onContinue: () => void;
  onResumeCheckout: () => void;
}

/**
 * OrderReturnView — shown when the shopper returns from hosted Stripe Checkout.
 * On success the order is being settled by the webhook (we don't read it back —
 * customers can't SELECT orders under RLS); on cancel the cargo bag is intact.
 */
export const OrderReturnView: React.FC<OrderReturnViewProps> = ({
  status,
  orderId,
  onContinue,
  onResumeCheckout,
}) => {
  const success = status === 'success';

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-8 font-sans select-none text-[#F8F3E9]">
      <div className="flex flex-col items-center space-y-3">
        {success ? (
          <CheckCircle size={56} className="text-[#39FF14] animate-bounce" />
        ) : (
          <XCircle size={56} className="text-[#FF4444]" />
        )}
        <h2 className="font-serif text-3xl tracking-wider uppercase font-bold italic">
          {success ? 'Payment Received!' : 'Checkout Cancelled'}
        </h2>
        <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold block uppercase">
          Order Reference: {orderId}
        </span>
      </div>

      <div className="bg-[#120F1E] border border-[#2A1F45] p-6 space-y-3 text-xs font-body-mono leading-relaxed">
        {success ? (
          <>
            <p className="text-[#39FF14] font-bold uppercase">Transaction authorized by clearing house.</p>
            <p className="text-[#F8F3E9]/70">
              Your payment has been received and your order is being finalized. A
              settlement confirmation will be dispatched to your comms frequency,
              and our Lusaka crew will prepare your cargo for high-altitude
              freight.
            </p>
          </>
        ) : (
          <>
            <p className="text-[#B68D40] font-bold uppercase">No charge was made.</p>
            <p className="text-[#F8F3E9]/70">
              Your checkout was cancelled and your cargo bag is still intact. You
              can resume the dispatch whenever you're ready.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onContinue}
          className="px-8 py-4 bg-[#9B6DFF] hover:bg-[#9B6DFF]/85 text-[#0A0812] text-xs font-body-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(155,109,255,0.3)]"
        >
          <span>{success ? 'RETURN TO OUTPOST' : 'CONTINUE BROWSING'}</span>
          <ArrowRight size={13} />
        </button>
        {!success && (
          <button
            onClick={onResumeCheckout}
            className="px-8 py-4 border border-[#2A1F45] hover:border-[#9B6DFF] hover:bg-[#9B6DFF]/10 text-[#F8F3E9] text-xs font-body-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ShoppingBag size={13} className="text-[#B68D40]" />
            <span>RESUME DISPATCH</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderReturnView;
