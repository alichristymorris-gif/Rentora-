import { 
  Globe, 
  Bed, 
  Home, 
  Building2, 
  Store, 
  Car, 
  Settings, 
  Smartphone, 
  Palmtree, 
  PartyPopper 
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: Globe },
  { id: 'room', name: 'Rooms', icon: Bed },
  { id: 'apartment', name: 'Apartments', icon: Home },
  { id: 'office', name: 'Offices', icon: Building2 },
  { id: 'shop', name: 'Shops', icon: Store },
  { id: 'car', name: 'Cars', icon: Car },
  { id: 'equipment', name: 'Equipment', icon: Settings },
  { id: 'electronics', name: 'Electronics', icon: Smartphone },
  { id: 'vacation', name: 'Vacation Rentals', icon: Palmtree },
  { id: 'event', name: 'Event Items', icon: PartyPopper },
];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR', 'INR'];

export const ADMIN_EMAILS = ['1286muhammadali@gmail.com'];

export const INITIAL_LISTINGS = [
  {
    id: 'l1',
    title: 'Modern Studio in Downtown',
    category: 'apartment',
    price: 1200,
    currency: 'USD',
    period: 'per Month',
    country: 'USA',
    city: 'New York',
    description: 'Beautiful studio with city views and high-speed internet.',
    ownerId: 'admin',
    ownerName: 'Rentora Admin',
    ownerContact: '+1 234 567 890',
    tags: ['WiFi', 'AC', 'Elevator'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    views: 156,
    clicks: 45,
    savedCount: 12,
    createdAt: 1716100000000,
    isNew: true,
    flag: '🇺🇸',
    status: 'available' as const
  }
];
