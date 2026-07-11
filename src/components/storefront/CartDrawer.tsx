/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Trash2, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';
import { OrderItem } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  onRemoveItem: (id: string, size?: string, color?: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Assume no taxes or shipping for standard display

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none text-[#F8F3E9] selection:bg-[#9B6DFF] selection:text-[#0A0812]">
      {/* Black backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#120F1E] border-l border-[#2A1F45] flex flex-col h-full shadow-2xl relative animate-slideLeft">
          
          {/* Drawer Header */}
          <div className="px-4 py-6 border-b border-[#2A1F45] flex items-center justify-between bg-[#0A0812]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#9B6DFF]" />
              <h2 className="text-sm font-body-mono font-bold tracking-[0.2em] uppercase">
                YOUR CARGO BAG ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#F8F3E9] hover:text-[#9B6DFF] p-1 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => {
                const uniqueKey = `${item.id}-${item.size || 'OS'}-${item.color || ''}`;
                
                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex gap-4 bg-[#0A0812] border border-[#2A1F45] p-3 hover:border-[#9B6DFF] transition-colors"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-16 h-20 bg-[#120F1E] border border-[#2A1F45] shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover filter brightness-90"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-body-mono text-[#F8F3E9]/20 uppercase">
                          NO IMG
                        </div>
                      )}
                    </div>

                    {/* Specifications Column */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="text-xs font-serif tracking-wide text-[#F8F3E9] truncate">
                          {item.name}
                        </h4>
                        
                        {/* Variant Chips */}
                        <div className="flex flex-wrap gap-2 pt-1 text-[9px] font-body-mono uppercase text-[#B68D40]">
                          {item.size && (
                            <span>SIZE: {item.size}</span>
                          )}
                          {item.color && (
                            <div className="flex items-center gap-1">
                              <span>COLOR:</span>
                              <span
                                className="w-2.5 h-2.5 border border-[#F8F3E9]/30"
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Deletion Controls */}
                      <div className="flex items-center justify-between pt-2">
                        {/* Quantizer */}
                        <div className="flex items-center border border-[#2A1F45] font-body-mono text-[10px]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1), item.size, item.color)}
                            className="px-2 py-0.5 hover:bg-[#2A1F45] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3.5 font-bold text-[#F8F3E9]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                            className="px-2 py-0.5 hover:bg-[#2A1F45] cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Cost & Trash */}
                        <div className="flex items-center gap-3 pricing-data select-none">
                          <span className="text-sm font-bold text-[#F8F3E9]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => onRemoveItem(item.id, item.size, item.color)}
                            className="text-[#F8F3E9]/35 hover:text-[#FF4444] p-1 cursor-pointer transition-colors"
                            title="Purge item from bag"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-24 text-[#F8F3E9]/40 font-body-mono text-xs uppercase flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border border-dashed border-[#2A1F45] flex items-center justify-center text-[#F8F3E9]/20">
                  <ShoppingBag size={18} />
                </div>
                <span>Your cargo bag is currently empty.</span>
              </div>
            )}
          </div>

          {/* Drawer Footer calculations and action button */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-[#2A1F45] bg-[#0A0812] space-y-4">
              
              {/* Calculations Block */}
              <div className="space-y-1.5 font-retro-mono order-summary text-base border-b border-[#2A1F45]/60 pb-3">
                <div className="flex justify-between text-[#F8F3E9]/60">
                  <span>CARGO SUB-TOTAL:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#F8F3E9]/60">
                  <span>ESTIMATED FREIGHT:</span>
                  <span className="text-[#39FF14] font-bold">COMPLIMENTARY</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#F8F3E9] pt-1">
                  <span>TOTAL VALUATION:</span>
                  <span className="text-[#9B6DFF]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Seal */}
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-body-mono text-[#39FF14] bg-[#39FF14]/5 py-1.5 border border-[#39FF14]/15">
                <ShieldCheck size={12} />
                <span>TRANSFERS SECURED BY ADVANCED ENCRYPTION</span>
              </div>

              {/* Checkout Trigger */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-4 bg-[#9B6DFF] hover:bg-[#9B6DFF]/85 text-[#0A0812] text-xs font-body-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(155,109,255,0.3)]"
              >
                <span>PROCEED TO ORDER DESPATCH</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
