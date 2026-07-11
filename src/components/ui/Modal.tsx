/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  // Prevent scrolling behind modal when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-space-black/85 backdrop-blur-sm"
          />

          {/* Modal content container */}
          <motion.div
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.45 }}
            className="relative w-full max-w-lg bg-retro-surface border-4 border-retro-border neon-glow-purple p-6 text-cream font-body-mono flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-retro-border pb-3 mb-4">
              <h2 className="text-sm font-retro-heading uppercase text-accent-purple tracking-wider leading-relaxed">
                :: {title}
              </h2>
              <button
                onClick={onClose}
                className="text-cream-muted hover:text-retro-red transition-colors text-lg font-retro-mono focus:outline-none p-1 leading-none"
              >
                [X]
              </button>
            </div>

            {/* Scrollable body content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {children}
            </div>

            {/* Footer actions */}
            {footer && (
              <div className="mt-6 pt-4 border-t-2 border-retro-border flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
