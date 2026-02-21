'use client';

import { useState } from 'react';
import { Save, DollarSign, Tag, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Setting {
  key: string;
  value: string;
}

export function PricingSettingsForm({ settings }: { settings: Setting[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Helper to safely get values
  const getVal = (key: string) => settings.find(s => s.key === key)?.value || '';

  // Local state for form fields
  const [formData, setFormData] = useState({
    // Tutor Pricing
    tutor_premium_price: getVal('tutor_premium_price'),
    tutor_premium_sale: getVal('tutor_premium_sale_price'),
    tutor_price_id: getVal('tutor_premium_price_id'),
    
    // Student Pricing
    student_premium_price: getVal('student_premium_price'),
    student_premium_sale: getVal('student_premium_sale_price'),
    student_price_id: getVal('student_premium_price_id'),

    // Marketing
    is_sale_active: getVal('is_global_sale_active') === 'true',
    promo_text: getVal('promo_banner_text'),
    coupon_code: getVal('active_coupon_code'),
  });

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Prepare updates array
      const updates = [
        { key: 'tutor_premium_price', value: formData.tutor_premium_price },
        { key: 'tutor_premium_sale_price', value: formData.tutor_premium_sale },
        { key: 'tutor_premium_price_id', value: formData.tutor_price_id },
        
        { key: 'student_premium_price', value: formData.student_premium_price },
        { key: 'student_premium_sale_price', value: formData.student_premium_sale },
        { key: 'student_premium_price_id', value: formData.student_price_id },

        { key: 'is_global_sale_active', value: String(formData.is_sale_active) },
        { key: 'promo_banner_text', value: formData.promo_text },
        { key: 'active_coupon_code', value: formData.coupon_code },
      ];

      // Update each setting in Supabase
      // Note: In a real app, you might want to use a stored procedure or a specialized API route for bulk updates
      // to be more efficient, but this works fine for small setting sets.
      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .update({ 
            value: update.value,
            updated_at: new Date().toISOString() 
          })
          .eq('key', update.key);
          
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Pricing settings updated successfully!' });
      router.refresh(); // Refresh server data
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* 1. Marketing & Sales Control */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-4">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Global Marketing Controls</h3>
            <p className="text-sm text-gray-500">Manage sales, banners, and coupons across the platform.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex items-center p-4 bg-white rounded-lg border border-indigo-100">
            <input 
              type="checkbox" 
              id="sale_mode"
              checked={formData.is_sale_active}
              onChange={e => setFormData({...formData, is_sale_active: e.target.checked})}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mr-3"
            />
            <div>
              <label htmlFor="sale_mode" className="font-semibold text-gray-900 cursor-pointer">Activate "Sale Mode"</label>
              <p className="text-xs text-gray-500">When enabled, "Sale Prices" will be shown instead of Original prices.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Banner Text</label>
            <input 
              type="text" 
              value={formData.promo_text}
              onChange={e => setFormData({...formData, promo_text: e.target.value})}
              placeholder="e.g. Summer Sale! 50% Off"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active Coupon Code</label>
            <input 
              type="text" 
              value={formData.coupon_code}
              onChange={e => setFormData({...formData, coupon_code: e.target.value})}
              placeholder="e.g. SUMMER2024"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Tutor Pricing */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-gray-900">
            <DollarSign className="w-5 h-5 text-green-600" /> Tutor Subscription (B2B)
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Original Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.tutor_premium_price}
                  onChange={e => setFormData({...formData, tutor_premium_price: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-green-600 uppercase mb-1">Sale Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.tutor_premium_sale}
                  onChange={e => setFormData({...formData, tutor_premium_sale: e.target.value})}
                  className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Stripe Price ID</label>
              <input 
                type="text" 
                value={formData.tutor_price_id}
                onChange={e => setFormData({...formData, tutor_price_id: e.target.value})}
                placeholder="price_H5..."
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-gray-500 outline-none" 
              />
            </div>
          </div>
        </div>

        {/* 3. Student Pricing */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-gray-900">
            <DollarSign className="w-5 h-5 text-primary" /> Student Subscription (B2C)
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Original Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.student_premium_price}
                  onChange={e => setFormData({...formData, student_premium_price: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary uppercase mb-1">Sale Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.student_premium_sale}
                  onChange={e => setFormData({...formData, student_premium_sale: e.target.value})}
                  className="w-full px-3 py-2 border border-primary-200 bg-primary-50 rounded-lg focus:ring-2 focus:ring-secondary outline-none" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Stripe Price ID</label>
              <input 
                type="text" 
                value={formData.student_price_id}
                onChange={e => setFormData({...formData, student_price_id: e.target.value})}
                placeholder="price_123..."
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-gray-500 outline-none" 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all font-medium shadow-lg shadow-gray-200"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {loading ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}