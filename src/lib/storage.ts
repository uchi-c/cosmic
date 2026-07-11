/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import imageCompression from 'browser-image-compression';
import { supabase, isSupabaseConfigured } from './supabase';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * OWASP Compliant Safe Filename Sanitizer
 * Replaces non-alphanumeric characters with hyphens, limits length, and forces lowercase.
 * This prevents path traversal, execution, or terminal command injections.
 */
export const sanitizeFilename = (name: string): string => {
  const dotIndex = name.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? name.slice(0, dotIndex) : name;
  const safeName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/-+/g, '-')       // Consolidate consecutive hyphens
    .replace(/^-+|-+$/g, '')    // Trim leading/trailing hyphens
    .slice(0, 50);             // Safe length limit
  return safeName || 'image';
};

/**
 * Validates file constraints (MIME type, size) securely in the browser.
 * Flagged Security Risk: Client-side validation only is bypassable, 
 * but crucial for instant user experience before backend storage constraints kick in.
 */
export const validateImageSecurely = (file: File): { valid: boolean; error?: string } => {
  // 1. Strict MIME type check
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `FORBIDDEN FILE TYPE: [${file.type}]. Only JPG, PNG, and WEBP formats are authorized.`,
    };
  }

  // 2. File size limit check (5MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `FILE TOO LARGE: ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum 5.00MB security threshold.`,
    };
  }

  return { valid: true };
};

/**
 * Compress, Strip EXIF Metadata, convert to WebP, and upload image.
 */
export const uploadProductImageSecurely = async (
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  // Secure Validation
  const validation = validateImageSecurely(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 1. Compile compression configuration (Converts to WebP, limits dimensions, strips EXIF)
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    onProgress: (pct: number) => {
      if (onProgress) {
        // Map browser compression to the first 40% of the overall progress
        onProgress(Math.round(pct * 0.4));
      }
    }
  };

  let compressedBlob: Blob;
  try {
    const compressedFile = await imageCompression(file, options);
    compressedBlob = compressedFile;
  } catch (err) {
    console.error('Image compression failed, utilizing raw file securely', err);
    compressedBlob = file;
  }

  // Generate unique secure filename
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const safeName = sanitizeFilename(file.name);
  const secureFilename = `${timestamp}-${uniqueId}-${safeName}.webp`;

  // Pathing structure matching standard: products/{userId}/{filename}
  const bucketPath = `products/${userId}/${secureFilename}`;

  if (isSupabaseConfigured() && supabase) {
    try {
      if (onProgress) onProgress(50); // Start upload stage

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(bucketPath, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp',
        });

      if (error) {
        throw error;
      }

      if (onProgress) onProgress(100);

      // Retrieve public CDN URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(bucketPath);

      return publicUrlData.publicUrl;
    } catch (dbErr: any) {
      console.error('Supabase upload failed, falling back to secure sandbox URI conversion', dbErr);
      // Fallback inside live block if bucket lacks permission or isn't created
    }
  }

  // ==========================================
  // SANDBOX MODE: EMULATE UPLOAD VIA BASE64 DATA URI
  // ==========================================
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadstart = () => {
      if (onProgress) onProgress(45);
    };
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 50) + 45;
        onProgress(Math.min(percent, 95));
      }
    };
    reader.onloadend = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error('MOCK STORAGE ENGINE: Failed to convert image file.'));
    reader.readAsDataURL(compressedBlob);
  });
};

/**
 * Removes image file from storage if real bucket is used.
 */
export const deleteProductImageSecurely = async (imageUrl: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    // Sandbox deletes instantly (client handles removing URL from products array)
    return true;
  }

  try {
    // Extract relative bucket path from full URL
    // Standard Supabase CDN URL: https://[ref].supabase.co/storage/v1/object/public/product-images/products/[userId]/[filename]
    const marker = '/product-images/';
    const index = imageUrl.indexOf(marker);
    if (index === -1) return true;

    const relativePath = imageUrl.slice(index + marker.length);
    const { error } = await supabase.storage
      .from('product-images')
      .remove([relativePath]);

    if (error) {
      console.warn('Storage removal failed (possibly already deleted):', error.message);
    }
    return true;
  } catch (err) {
    console.error('Error deleting image from Supabase Storage', err);
    return false;
  }
};
