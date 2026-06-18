import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '../types';

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

  return [20.0, 0.0]; // default world center
};

// SVG-based beautiful Marker Icon function
const createMarkerIcon = (category: string) => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1.8 1.8 0 0 1-2.4 0C8.337 20.193 3 14.993 3 10a9 9 0 0 1 18 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map view synchronization component helper
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapViewProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

export function MapView({ listings, onSelectListing }: MapViewProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState<number>(2);

  // If there are listings, pan to the first valid one as current focal point
  useEffect(() => {
    if (listings.length > 0) {
      const firstValidListing = listings.find(l => l.latitude && l.longitude) || listings[0];
      if (firstValidListing) {
        const lat = firstValidListing.latitude || getCityCoordinates(firstValidListing.city, firstValidListing.country)[0];
        const lng = firstValidListing.longitude || getCityCoordinates(firstValidListing.city, firstValidListing.country)[1];
        if (lat !== 20 || lng !== 0) {
          setMapCenter([lat, lng]);
          setMapZoom(5);
        }
      }
    }
  }, [listings]);

  return (
    <div className="w-full h-[550px] relative rounded-[32px] overflow-hidden border border-slate-200 dark:border-dark-border shadow-md bg-slate-100 z-10 transition-all duration-300">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeMapView center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((l) => {
          const lat = l.latitude || getCityCoordinates(l.city, l.country)[0];
          const lng = l.longitude || getCityCoordinates(l.city, l.country)[1];

          return (
            <Marker 
              key={l.id} 
              position={[lat, lng]} 
              icon={createMarkerIcon(l.category)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-3 text-slate-900 bg-white dark:bg-slate-900 dark:text-white rounded-xl min-w-[200px] font-sans">
                  {l.images && l.images[0] && (
                    <img 
                      src={l.images[0]} 
                      alt={l.title} 
                      className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-100 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex items-center gap-1.5 mb-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full w-fit">
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                      {l.category}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm leading-tight text-slate-900 dark:text-white mb-1">
                    {l.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mb-3 flex items-center gap-1">
                    <span>{l.flag}</span> {l.city}, {l.country}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block leading-none mb-1">
                        Price
                      </span>
                      <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                        {l.currency} {l.price.toLocaleString()} / {l.period}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectListing(l)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
