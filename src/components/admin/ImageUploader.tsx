/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ShieldAlert, Image as ImageIcon, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { uploadProductImageSecurely, deleteProductImageSecurely } from '../../lib/storage';
import { Badge } from '../ui/Badge';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  userId?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange, userId = 'admin-user' }) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // File drag-and-drop handler via react-dropzone
  const onDrop = async (acceptedFiles: File[]) => {
    setGlobalError(null);
    
    const remainingSlots = 6 - images.length;
    if (acceptedFiles.length > remainingSlots) {
      setGlobalError(`SECURITY POLICY EXCEEDED: You can only upload a maximum of 6 images per product. You have ${images.length} existing, and tried to upload ${acceptedFiles.length}.`);
      return;
    }

    const uploadPromises = acceptedFiles.map(async (file) => {
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newUploadState: UploadingFile = { id: fileId, name: file.name, progress: 0 };
      
      // Add to uploading list state
      setUploadingFiles((prev) => [...prev, newUploadState]);

      try {
        const publicUrl = await uploadProductImageSecurely(file, userId, (pct) => {
          setUploadingFiles((prev) =>
            prev.map((item) => (item.id === fileId ? { ...item, progress: pct } : item))
          );
        });

        // Append to products images list
        onChange([...images, publicUrl]);

        // Remove from uploading list upon success
        setUploadingFiles((prev) => prev.filter((item) => item.id !== fileId));
      } catch (err: any) {
        console.error('Image upload failed:', err);
        setUploadingFiles((prev) =>
          prev.map((item) => (item.id === fileId ? { ...item, error: err.message || 'Secure Upload Failed.' } : item))
        );
      }
    });

    await Promise.all(uploadPromises);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 6 - images.length,
    disabled: images.length >= 6,
  } as any);

  // Action: Delete image
  const handleDelete = async (indexToDelete: number, imageUrl: string) => {
    try {
      // Remove from backend storage bucket if active
      await deleteProductImageSecurely(imageUrl);
      
      const updated = images.filter((_, idx) => idx !== indexToDelete);
      onChange(updated);
    } catch (err) {
      console.error('Deletion error:', err);
    }
  };

  // Action: Shift image left
  const moveLeft = (index: number) => {
    if (index === 0) return;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    onChange(reordered);
  };

  // Action: Shift image right
  const moveRight = (index: number) => {
    if (index === images.length - 1) return;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    onChange(reordered);
  };

  // Action: Set image as main cover
  const setAsMain = (index: number) => {
    if (index === 0) return;
    const reordered = [...images];
    const item = reordered.splice(index, 1)[0];
    reordered.unshift(item);
    onChange(reordered);
  };

  return (
    <div className="space-y-4 font-body-mono">
      <div className="flex justify-between items-center">
        <span className="text-xs text-cream-muted uppercase tracking-wider">
          Product Images ({images.length} / 6 max)
        </span>
        <span className="text-[10px] text-retro-gold flex items-center gap-1">
          <Star size={11} className="fill-retro-gold" /> First image serves as the Main Store Cover
        </span>
      </div>

      {/* Errors Alert banner */}
      {globalError && (
        <div className="p-3 bg-retro-red/10 border-2 border-retro-red text-retro-red text-xs flex items-start gap-2">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <div>{globalError}</div>
        </div>
      )}

      {/* Image Previews 3x2 Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url, idx) => (
            <div
              key={url + '-' + idx}
              className={`relative border-2 ${idx === 0 ? 'border-accent-purple' : 'border-retro-border'} bg-space-black aspect-video group overflow-hidden`}
            >
              <img
                src={url}
                alt={`Product Preview ${idx + 1}`}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />

              {/* Status and Action overlays */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                {idx === 0 ? (
                  <Badge variant="HOT" className="text-[10px] bg-space-black px-1.5 font-retro-mono">
                    MAIN
                  </Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAsMain(idx)}
                    className="text-[10px] bg-space-black/90 border border-retro-border text-cream-muted hover:text-accent-purple hover:border-accent-purple px-1.5 py-0.5 font-retro-mono"
                  >
                    SET MAIN
                  </button>
                )}
              </div>

              {/* Delete button (Always visible on mobile, hover on desktop) */}
              <button
                type="button"
                onClick={() => handleDelete(idx, url)}
                className="absolute top-2 right-2 p-1 bg-space-black/90 border border-retro-border text-cream-muted hover:text-retro-red hover:border-retro-red hover:shadow-[0_0_6px_rgba(255,68,68,0.5)] transition-all z-10"
                title="Delete Photo"
              >
                <X size={12} />
              </button>

              {/* Interactive Shifting Controls bar */}
              <div className="absolute bottom-0 inset-x-0 bg-space-black/90 border-t border-retro-border py-1 px-2 flex justify-between items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveLeft(idx)}
                  className="text-cream-muted hover:text-accent-purple disabled:opacity-30 disabled:pointer-events-none"
                  title="Move Left"
                >
                  <ArrowLeft size={13} />
                </button>
                <span className="text-[10px] text-cream-muted font-retro-mono">SLOT {idx + 1}</span>
                <button
                  type="button"
                  disabled={idx === images.length - 1}
                  onClick={() => moveRight(idx)}
                  className="text-cream-muted hover:text-accent-purple disabled:opacity-30 disabled:pointer-events-none"
                  title="Move Right"
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag Zone Drop Box */}
      {images.length < 6 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-150 select-none bg-retro-surface/50
            ${isDragActive ? 'border-accent-purple bg-accent-purple/5 shadow-[0_0_15px_rgba(155,109,255,0.2)]' : 'border-retro-border hover:border-accent-purple hover:bg-retro-surface'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-space-black border border-retro-border text-accent-purple group-hover:scale-105 transition-transform">
              <Upload size={20} />
            </div>
            <p className="text-xs text-cream uppercase tracking-wider font-body-mono font-bold">
              {isDragActive ? 'DROP FILES HERE' : 'DRAG & DROP IMAGE FILE'}
            </p>
            <p className="text-[10px] text-cream-muted leading-relaxed max-w-sm">
              JPEG, PNG, WEBP allowed (Max 5MB per file). EXIF metadata is automatically stripped and processed to secure WebP on upload.
            </p>
          </div>
        </div>
      )}

      {/* Uploading progress feedback lists */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2.5 border-2 border-retro-border bg-space-black p-3.5">
          <p className="text-[10px] text-accent-purple uppercase tracking-wider font-retro-mono">
            SECURE DIGITAL IMAGE ENCRYPTION IN PROGRESS:
          </p>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="text-xs space-y-1">
              <div className="flex justify-between text-[11px] font-retro-mono text-cream-muted">
                <span className="truncate max-w-[70%]">{file.name}</span>
                {file.error ? (
                  <span className="text-retro-red">FAILED: {file.error}</span>
                ) : (
                  <span>{file.progress}%</span>
                )}
              </div>
              {!file.error && (
                <div className="w-full bg-retro-surface h-1.5 border border-retro-border">
                  <div
                    className="bg-accent-purple h-full transition-all duration-300 shadow-[0_0_6px_#9B6DFF]"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
              {file.error && (
                <button
                  type="button"
                  onClick={() => setUploadingFiles((prev) => prev.filter((item) => item.id !== file.id))}
                  className="text-[9px] text-retro-red underline uppercase font-retro-mono cursor-pointer"
                >
                  DISMISS ERROR REPORT
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ImageUploader;
