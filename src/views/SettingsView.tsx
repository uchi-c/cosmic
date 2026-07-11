/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Settings, Mail, Globe, AlertTriangle, Link2 } from 'lucide-react';
import { StoreSettings } from '../types';
import { dbService } from '../lib/supabase';
import { RetroInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export const SettingsView: React.FC = () => {
  // Config parameters state
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [currencyDisplay, setCurrencyDisplay] = useState('USD ($)');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialWechat, setSocialWechat] = useState('');

  // Status variables
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load configuration parameters on mount
  useEffect(() => {
    const settings = dbService.getSettings();
    setStoreName(settings.store_name);
    setTagline(settings.tagline);
    setContactEmail(settings.contact_email);
    setCurrencyDisplay(settings.currency_display);
    setLowStockThreshold(settings.low_stock_threshold.toString());
    setSocialInstagram(settings.social_instagram);
    setSocialTiktok(settings.social_tiktok);
    setSocialWechat(settings.social_wechat);
  }, []);

  // Save modified settings parameters
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    // Form inputs validation checking
    if (!storeName.trim() || !contactEmail.trim()) {
      setError('VALIDATION EXCEPTION: Store Name and Support Email parameters are strictly required.');
      setIsSaving(false);
      return;
    }

    try {
      const parsedThreshold = parseInt(lowStockThreshold, 10);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        setError('INPUT EXCEPTION: Low stock alert threshold must be a positive integer.');
        setIsSaving(false);
        return;
      }

      const settings: StoreSettings = {
        store_name: storeName.trim(),
        tagline: tagline.trim(),
        contact_email: contactEmail.trim(),
        currency_display: currencyDisplay,
        low_stock_threshold: parsedThreshold,
        social_instagram: socialInstagram.trim(),
        social_tiktok: socialTiktok.trim(),
        social_wechat: socialWechat.trim(),
      };

      dbService.saveSettings(settings);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(`TRANSACTION FAULT: Failed to update global settings. [${err.message}]`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-body-mono select-none text-cream animate-fadeIn">
      
      {/* View Header */}
      <div className="flex items-center gap-3 bg-retro-surface border-2 border-retro-border p-4">
        <div className="p-2.5 bg-accent-purple/10 border border-accent-purple/30 text-accent-purple">
          <Settings size={18} />
        </div>
        <div>
          <h3 className="text-sm font-retro-heading uppercase tracking-widest text-cream">
            STORE CONFIGURATION TERMINAL
          </h3>
          <p className="text-[10px] text-cream-muted uppercase leading-none mt-1">
            Reconfigure operational, shipping, and notification metrics
          </p>
        </div>
      </div>

      {/* Success banner notifications */}
      {saveSuccess && (
        <div className="p-3 bg-retro-green/10 border-2 border-retro-green text-retro-green text-xs flex items-center gap-2">
          <ShieldCheck size={16} className="shrink-0" />
          <span>GLOBAL CONFIGURATION PARAMETERS SUCCESSFULLY WRITTEN AND PERSISTED TO PERSISTENT STATE.</span>
        </div>
      )}

      {/* Error alert banner */}
      {error && (
        <div className="p-3 bg-retro-red/10 border-2 border-retro-red text-retro-red text-xs flex items-center gap-2">
          <span className="font-bold">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Primary configuration forms */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COMPONENT: operational specs (Col span 2) */}
        <div className="lg:col-span-2 bg-retro-surface border-2 border-retro-border p-5 space-y-5">
          <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
            [STORE BRAND IDENTITY]
          </h4>

          {/* Store Name */}
          <RetroInput
            label="STORE TRADING NAME"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="COSMIC DEPT"
            required
          />

          {/* Tagline text */}
          <RetroInput
            label="BRAND PROMOTIONAL TAGLINE"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="RETROFUTURE WEAR FOR SPACE OPERATIVES"
          />

          {/* Support / operations email */}
          <div className="relative">
            <RetroInput
              label="CUSTOMER SUPPORT & OPERATIONS EMAIL"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="ops@cosmicdept.com"
              required
            />
            <Mail size={14} className="absolute right-3.5 bottom-3.5 text-cream-muted/30" />
          </div>

          <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pt-4 pb-3 mb-1">
            [OPERATIONAL LOGISTICS]
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Currency settings */}
            <Select
              label="PRIMARY TRANSACTIONAL CURRENCY"
              value={currencyDisplay}
              onChange={(e) => setCurrencyDisplay(e.target.value)}
              options={[
                { value: 'USD ($)', label: 'UNITED STATES DOLLAR ($)' },
                { value: 'EUR (€)', label: 'EURO SYSTEM (€)' },
                { value: 'GBP (£)', label: 'GREAT BRITAIN POUND (£)' },
                { value: 'ZMW (K)', label: 'ZAMBIAN KWACHA (ZMW K)' },
              ]}
            />

            {/* Low stock trigger */}
            <div className="relative">
              <RetroInput
                label="LOW STOCK ALERT THRESHOLD"
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
                required
              />
              <AlertTriangle size={14} className="absolute right-3.5 bottom-3.5 text-retro-gold/40" />
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Social media configurations & submit buttons */}
        <div className="space-y-6">
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4.5">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [COMMERCIAL RAILS]
            </h4>

            {/* Instagram */}
            <div className="relative">
              <RetroInput
                label="INSTAGRAM HANDLE / LINK"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/cosmicdept"
              />
              <Link2 size={14} className="absolute right-3.5 bottom-3.5 text-cream-muted/30" />
            </div>

            {/* TikTok */}
            <div className="relative">
              <RetroInput
                label="TIKTOK HANDLE / LINK"
                value={socialTiktok}
                onChange={(e) => setSocialTiktok(e.target.value)}
                placeholder="https://tiktok.com/@cosmicdept"
              />
              <Link2 size={14} className="absolute right-3.5 bottom-3.5 text-cream-muted/30" />
            </div>

            {/* WeChat */}
            <div className="relative">
              <RetroInput
                label="WECHAT OP-CODE ID"
                value={socialWechat}
                onChange={(e) => setSocialWechat(e.target.value)}
                placeholder="cosmic_dept_ops"
              />
              <Globe size={14} className="absolute right-3.5 bottom-3.5 text-cream-muted/30" />
            </div>
          </div>

          {/* Trigger button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="w-full py-4 text-xs flex items-center justify-center gap-1.5 font-bold"
          >
            {isSaving ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-space-black border-t-transparent rounded-full mr-2" />
                <span>SAVING PARAMETERS...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>WRITE CONFIGURATION</span>
              </>
            )}
          </Button>

          <div className="text-[10px] text-cream-muted/70 uppercase leading-relaxed text-center font-mono p-1">
            CHANGES COMPILE IMMEDIATELY AND MODIFY ALL CORRESPONDING METRIC INDICATORS ON THE SECTOR DASHBOARD.
          </div>
        </div>

      </form>
    </div>
  );
};
export default SettingsView;
