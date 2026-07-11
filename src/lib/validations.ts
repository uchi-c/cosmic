/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// OWASP standard: strict type coercion and sanitization schemas
export const ProductSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Product title is required' })
    .max(100, { message: 'Product title must be 100 characters or fewer' })
    .trim(),
  
  slug: z
    .string()
    .min(1, { message: 'URL Slug is required' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug must contain only lowercase alphanumeric characters and hyphens (e.g., retro-glow-tee)',
    })
    .trim(),
  
  category: z.enum(['mens', 'womens', 'gym', 'jewelry', 'accessories'], {
    message: 'Please select an authorized Category',
  }),
  
  price: z
    .number({ message: 'Retail Price must be a valid number' })
    .positive({ message: 'Retail Price must be greater than $0.00' })
    .refine((val) => !isNaN(val) && Number(val.toFixed(2)) === val, {
      message: 'Price cannot exceed 2 decimal places',
    }),
  
  sale_price: z
    .number({ message: 'Sale Price must be a valid number' })
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || (val > 0 && Number(val.toFixed(2)) === val), {
      message: 'Sale Price must be a positive number with max 2 decimal places',
    }),
  
  description: z
    .string()
    .max(2000, { message: 'Full description cannot exceed 2000 characters' })
    .trim()
    .nullable()
    .optional(),
  
  short_desc: z
    .string()
    .max(160, { message: 'Short description cannot exceed 160 characters for SEO grid' })
    .trim()
    .nullable()
    .optional(),
  
  sizes: z
    .array(z.string())
    .min(1, { message: 'Select at least one size variant' }),
  
  colors: z
    .array(z.string())
    .min(1, { message: 'Add at least one color swatch' }),
  
  badge: z.enum(['NEW', 'LIMITED', 'SALE', 'HOT', ''], {
    message: 'Invalid vintage badge type selected',
  }).nullable().optional(),
  
  stock: z
    .number({ message: 'Stock count must be an integer' })
    .int({ message: 'Stock must be a whole number' })
    .nonnegative({ message: 'Stock quantity cannot be less than zero' }),
  
  images: z
    .array(z.string().url({ message: 'Invalid secure image URL detected' }))
    .min(1, { message: 'At least one product image is strictly required for store listings' })
    .max(6, { message: 'A maximum of 6 images is allowed per product' }),
  
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
}).refine(
  (data) => {
    // If sale price is set, it must be strictly less than standard retail price
    if (data.sale_price !== null && data.sale_price !== undefined) {
      return data.sale_price < data.price;
    }
    return true;
  },
  {
    message: 'Sale Price must be strictly lower than the standard Retail Price',
    path: ['sale_price'],
  }
);

export type ProductFormValues = z.infer<typeof ProductSchema>;
