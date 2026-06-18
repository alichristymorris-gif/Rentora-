import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Listing, AppUser } from '../../types';
import { countries } from '../../data/locations';
import { CATEGORIES, CURRENCIES } from '../../constants';

interface ListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (listing: any) => void;
  user: AppUser | null;
  editingListing: Listing | null;
}

export function ListingModal({ isOpen, onClose, onSubmit, user, editingListing }: ListingModalProps) {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'apartment',
    price: '',
    currency: 'USD',
    period: 'per Month',
    country: '',
    city: '',
    description: '',
    ownerContact: '',
    tags: '',
    status: 'available',
    images: [] as string[]
  });

  useEffect(() => {
    if (editingListing) {
      setFormData({
        title: editingListing.title,
        category: editingListing.category,
        price: editingListing.price.toString(),
        currency: editingListing.currency,
        period: editingListing.period,
        country: editingListing.country,
        city: editingListing.city,
        description: editingListing.description,
        ownerContact: editingListing.ownerContact,
        tags: editingListing.tags.join(', '),
        status: editingListing.status || 'available',
        images: editingListing.images || []
      });
      setStep(1);
    } else {
      setFormData({
        title: '',
        category: 'apartment',
        price: '',
        currency: 'USD',
        period: 'per Month',
        country: '',
        city: '',
        description: '',
        ownerContact: user?.email || '',
        tags: '',
        status: 'available',
        images: []
      });
      setStep(1);
    }
  }, [editingListing, isOpen, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    
    setIsUploading(true);
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await imageCompression(file, options);
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const fileRef = ref(storage, `listings/${user.uid}/${fileName}`);
        const snapshot = await uploadBytes(fileRef, compressedFile);
        return getDownloadURL(snapshot.ref);
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const selectedCountry = countries.find(c => c.name === formData.country);
  const cities = selectedCountry ? selectedCountry.cities : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-10">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white border border-bento-border w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {editingListing ? 'Edit Listing' : 'Post New Listing'}
            </h2>
            <p className="text-xs text-bento-muted font-bold uppercase tracking-widest mt-1">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Listing Title</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Cozy Studio in Downtown"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Category</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Rental Period</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.period}
                    onChange={e => setFormData({...formData, period: e.target.value})}
                  >
                    <option>per Month</option>
                    <option>per Day</option>
                    <option>per Week</option>
                    <option>per Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Price</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Currency</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {editingListing && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}

              <button 
                disabled={!formData.title || !formData.price}
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-5 rounded-[22px] font-black tracking-tight mt-4 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10 active:scale-95"
              >
                Continue <span className="ml-1 opacity-50">→</span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Country</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value, city: ''})}
                  >
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">City</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold disabled:opacity-50"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    disabled={!formData.country}
                  >
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

               <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Description</label>
                <textarea 
                  rows={4}
                  placeholder="Tell people about your rental..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none text-slate-900 font-medium"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Contact Phone</label>
                  <input 
                    type="text" 
                    placeholder="+1 234 567 890"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.ownerContact}
                    onChange={e => setFormData({...formData, ownerContact: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="WiFi, Pool, AC..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-bold"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Listing Images</label>
                
                <div className="grid grid-cols-3 gap-3">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                      <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {formData.images.length < 6 && (
                    <label className={cn(
                      "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
                      isUploading ? "bg-slate-50 border-slate-200 cursor-not-allowed" : "border-slate-200 hover:border-blue-500 hover:bg-blue-50/30"
                    )}>
                      {isUploading ? (
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                      ) : (
                        <>
                          <Plus size={24} className="text-slate-300 mb-1" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Upload up to 6 high-quality photos. First image is the cover.</p>
              </div>

              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-100 py-5 rounded-[22px] font-black text-slate-400 hover:bg-slate-50 transition-all">Back</button>
                <button 
                  disabled={isUploading}
                  onClick={() => onSubmit({
                    ...(editingListing ? { id: editingListing.id } : {}),
                    ...formData, 
                    price: Number(formData.price),
                    flag: selectedCountry?.flag || '🌍',
                    tags: formData.tags.split(',').map(s=>s.trim()).filter(Boolean),
                    images: formData.images
                  })} 
                  className="flex-[2] bg-blue-600 text-white py-5 rounded-[22px] font-black shadow-xl shadow-blue-600/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  {editingListing ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
