import { countries } from './locations';

interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  period: string;
  city: string;
  country: string;
  flag: string;
  ownerName: string;
  ownerContact: string;
  description: string;
  tags: string[];
  isNew?: boolean;
  isHot?: boolean;
  ownerId: string;
  createdAt: number;
  status: 'available' | 'rented' | 'pending';
  images: string[];
}

const CATEGORIES = ['home', 'room', 'car', 'villa', 'office', 'shop', 'equipment'];

const CATEGORY_INFO: Record<string, any> = {
  home: {
    titles: ['Modern Apartment', 'Penthouse Suite', 'Family House', 'Studio Flat', 'Suburban Residency'],
    prices: {
      USD: [1200, 3500],
      PKR: [35000, 150000],
      AED: [5000, 15000],
      SAR: [4000, 12000],
      INR: [15000, 55000],
      GBP: [800, 2500],
      EUR: [700, 2200]
    },
    period: 'per Month',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1554995207-c18c20360a59?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['WiFi', 'Kitchen', 'Modern', 'AC', 'Security']
  },
  room: {
    titles: ['Cozy Master Room', 'Shared Dormitory', 'Bachelor Suite', 'Guest Bedroom', 'Luxury Suite'],
    prices: {
      USD: [400, 1200],
      PKR: [12000, 45000],
      AED: [1500, 5000],
      SAR: [1200, 4500],
      INR: [5000, 18000],
      GBP: [350, 900],
      EUR: [300, 850]
    },
    period: 'per Month',
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555854817-5b2537a88fb0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Furnished', 'Attached Bath', 'Quiet', 'Clean', 'WiFi']
  },
  car: {
    titles: ['Compact Economy', 'Luxury Sedan', 'Family SUV', 'Sports Convertible', 'Electric Vehicle'],
    prices: {
      USD: [45, 150],
      PKR: [3500, 15000],
      AED: [100, 600],
      SAR: [90, 500],
      INR: [2000, 8000],
      GBP: [35, 120],
      EUR: [30, 110]
    },
    period: 'per Day',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Automatic', 'Self Drive', 'Insured', 'Hybrid', 'Clean']
  },
  villa: {
    titles: ['Seaside Villa', 'Mountain Mansion', 'Desert Oasis', 'Garden Estate', 'Pool House'],
    prices: {
      USD: [3000, 15000],
      PKR: [250000, 1500000],
      AED: [15000, 100000],
      SAR: [12000, 90000],
      INR: [80000, 500000],
      GBP: [2500, 12000],
      EUR: [2000, 10000]
    },
    period: 'per Month',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600585154340-be6191da310c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Pool', 'Garden', 'Sea View', 'Exclusive', 'Balcony']
  },
  office: {
    titles: ['Tech Studio', 'Coworking Space', 'Corporate Office', 'Meeting Room', 'Startup Floor'],
    prices: {
      USD: [500, 5000],
      PKR: [15000, 250000],
      AED: [2000, 25000],
      SAR: [1800, 22000],
      INR: [8000, 120000],
      GBP: [400, 4000],
      EUR: [350, 3500]
    },
    period: 'per Month',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Fiber Internet', 'Generator', 'Parking', 'Coffee', 'Printing']
  },
  shop: {
    titles: ['Retail Outlet', 'Corner Shop', 'Mall Unit', 'Boutique Front', 'Showroom'],
    prices: {
      USD: [800, 6000],
      PKR: [25000, 300000],
      AED: [3000, 35000],
      SAR: [2500, 30000],
      INR: [10000, 150000],
      GBP: [600, 5000],
      EUR: [500, 4500]
    },
    period: 'per Month',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1556742517-57842ba8f192?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Prime Location', 'Glass Front', 'Storage', 'Busy Area', 'High Footfall']
  },
  equipment: {
    titles: ['Pro Camera Kit', 'Cinema Drone', 'Heavy Machinery', 'Gaming Setup', 'Sound System'],
    prices: {
      USD: [50, 500],
      PKR: [2000, 45000],
      AED: [150, 2000],
      SAR: [130, 1800],
      INR: [1200, 15000],
      GBP: [40, 400],
      EUR: [35, 350]
    },
    period: 'per Day',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Professional', 'New', 'Portable', 'High Power', 'Reliable']
  }
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  "Pakistan": "PKR",
  "UAE": "AED",
  "USA": "USD",
  "UK": "GBP",
  "Saudi Arabia": "SAR",
  "India": "INR",
  "Germany": "EUR",
  "France": "EUR",
  "Turkey": "TRY",
  "Indonesia": "IDR",
  "Malaysia": "MYR",
  "Australia": "AUD",
  "Canada": "CAD",
  "Japan": "JPY",
  "Brazil": "BRL",
  "Greece": "EUR",
  "Morocco": "MAD",
  "South Africa": "ZAR"
};

const generateMockListings = () => {
  const listings: Listing[] = [];
  let idCounter = 1;

  countries.forEach(country => {
    CATEGORIES.forEach(category => {
      const info = CATEGORY_INFO[category];
      const currency = COUNTRY_CURRENCIES[country.name] || 'USD';
      
      // Get price range based on currency or fallback to USD
      const priceRange = info.prices[currency] || info.prices['USD'];
      
      for (let i = 0; i < 5; i++) {
        const cityIndex = i % country.cities.length;
        const city = country.cities[cityIndex];
        const title = `${info.titles[i]} in ${city}`;
        
        // Random price within range
        const price = Math.floor(Math.random() * (priceRange[1] - priceRange[0]) + priceRange[0]);
        
        listings.push({
          id: `mock-${idCounter++}`,
          title: title,
          category: category,
          price: price,
          currency: currency,
          period: info.period,
          city: city,
          country: country.name,
          flag: country.flag,
          ownerName: `Owner ${i + 1}`,
          ownerContact: '+000 000 0000',
          description: `This is a premium ${category} listing located in the beautiful city of ${city}, ${country.name}. Comes with all basic amenities and high quality maintenance.`,
          tags: info.tags,
          isNew: i === 0,
          isHot: i === 1,
          ownerId: 'demo',
          createdAt: Date.now() - (idCounter * 1000000),
          status: 'available',
          images: [info.images[i]]
        });
      }
    });
  });

  return listings;
};

export const INITIAL_LISTINGS: Listing[] = generateMockListings();
