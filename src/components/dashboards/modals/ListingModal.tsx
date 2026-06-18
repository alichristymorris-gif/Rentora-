import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import imageCompression from 'browser-image-compression';
import { cn } from '../../../lib/utils';
import { Listing, AppUser } from '../../../types';
import { countries } from '../../../data/locations';
import { CATEGORIES, CURRENCIES } from '../../../constants';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate coordinate matcher for Pakistani, US, European and global cities
const getCityCoordinates = (city: string, country: string): [number, number] => {
  const normCity = city.toLowerCase().trim();
  const normCountry = country.toLowerCase().trim();

  // pakistan
  if (normCity === 'karachi') return [24.8607, 67.0011];
  if (normCity === 'lahore') return [31.5204, 74.3587];
  if (normCity === 'islamabad') return [33.6844, 73.0479];
  if (normCity === 'faisalabad') return [31.4504, 73.1350];
  if (normCity === 'rawalpindi') return [33.5651, 73.0169];
  if (normCity === 'peshawar') return [34.0151, 71.5249];
  
  // uae
  if (normCity === 'dubai') return [25.2048, 55.2708];
  if (normCity === 'abu dhabi') return [24.4539, 54.3773];
  if (normCity === 'sharjah') return [25.3463, 55.4209];

  // usa
  if (normCity === 'new york') return [40.7128, -74.0060];
  if (normCity === 'los angeles') return [34.0522, -118.2437];
  if (normCity === 'chicago') return [41.8781, -87.6298];
  if (normCity === 'san francisco') return [37.7749, -122.4194];
  if (normCity === 'houston') return [29.7604, -95.3698];
  
  // uk
  if (normCity === 'london') return [51.5074, -0.1278];
  if (normCity === 'manchester') return [53.4808, -2.2426];
  if (normCity === 'birmingham') return [52.4862, -1.8904];
  
  // saudi arabia
  if (normCity === 'riyadh') return [24.7136, 46.6753];
  if (normCity === 'jeddah') return [21.5433, 39.1728];
  if (normCity === 'mecca') return [21.3891, 39.8579];
  
  // india
  if (normCity === 'mumbai') return [19.0760, 72.8777];
  if (normCity === 'delhi') return [28.7041, 77.1025];
  if (normCity === 'bangalore') return [12.9716, 77.5946];
  
  // germany
  if (normCity === 'berlin') return [52.5200, 13.4050];
  if (normCity === 'munich') return [48.1351, 11.5820];
  
  // france
  if (normCity === 'paris') return [48.8566, 2.3522];
  
  // turkey
  if (normCity === 'istanbul') return [41.0082, 28.9784];
  
  // malaysia
  if (normCity === 'kuala lumpur') return [3.1390, 101.6869];
  
  // australia
  if (normCity === 'sydney') return [-33.8688, 151.2093];
  if (normCity === 'melbourne') return [-37.8136, 144.9631];
  
  // canada
  if (normCity === 'toronto') return [43.6532, -79.3832];
  if (normCity === 'vancouver') return [49.2827, -123.1207];
  
  // japan
  if (normCity === 'tokyo') return [35.6762, 139.6503];

  // country fallbacks
  if (normCountry === 'pakistan') return [30.3753, 69.3451];
  if (normCountry === 'uae') return [23.4241, 53.8478];
  if (normCountry === 'usa') return [37.0902, -95.7129];
  if (normCountry === 'uk') return [55.3781, -3.4360];
  if (normCountry === 'saudi arabia') return [23.8859, 45.0792];
  if (normCountry === 'india') return [20.5937, 78.9629];
  if (normCountry === 'germany') return [51.1657, 10.4515];
  if (normCountry === 'france') return [46.2276, 2.2137];
  if (normCountry === 'turkey') return [38.9637, 35.2433];
  if (normCountry === 'indonesia') return [-0.7893, 113.9213];
  if (normCountry === 'malaysia') return [4.2105, 101.9758];
  if (normCountry === 'australia') return [-25.2744, 133.7751];
  if (normCountry === 'canada') return [56.1304, -106.3468];
  if (normCountry === 'japan') return [36.2048, 138.2529];
  if (normCountry === 'brazil') return [-14.2350, -51.9253];
  if (normCountry === 'greece') return [39.0742, 21.8243];
  if (normCountry === 'morocco') return [31.7917, -7.0926];
  if (normCountry === 'south africa') return [-30.5595, 22.9375];

  return [20.0, 0.0];
};

const customPickerIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white animate-bounce">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1.8 1.8 0 0 1-2.4 0C8.337 20.193 3 14.993 3 10a9 9 0 0 1 18 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  className: 'custom-map-picker-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

function ModalMapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function SetMapFocus({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

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
    images: [] as string[],
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
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
        images: editingListing.images || [],
        latitude: editingListing.latitude,
        longitude: editingListing.longitude
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
        images: [],
        latitude: undefined,
        longitude: undefined
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
        const filePath = `listings/${user.uid}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('listings')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath);
          
        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    } catch (err) {
      console.warn("Storage upload failed or bucket unconfigured. Falling back to local Base64 URL for seamless offline/staging trial...");
      try {
        const fallbackPromises = Array.from(files).map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
          });
        });
        const urls = await Promise.all(fallbackPromises);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...urls]
        }));
      } catch (fallbackErr) {
        console.error("Staging local preview fallback failed:", fallbackErr);
        alert("Failed to process images. Please try again.");
      }
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

              {/* Map Location Picker */}
              {formData.country && formData.city && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Pin Location on Map (Optional)</label>
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 relative z-10">
                    <MapContainer
                      center={getCityCoordinates(formData.city, formData.country)}
                      zoom={12}
                      scrollWheelZoom={true}
                      className="w-full h-full"
                    >
                      <SetMapFocus center={getCityCoordinates(formData.city, formData.country)} />
                      <ModalMapClickHandler onMapClick={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {formData.latitude && formData.longitude && (
                        <Marker position={[formData.latitude, formData.longitude]} icon={customPickerIcon} />
                      )}
                    </MapContainer>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                    <span>Click on map to set pinpoint lat/lng</span>
                    {formData.latitude && formData.longitude && (
                      <span className="text-blue-600 font-mono">
                        {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              )}

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
