export interface City {
  name: string;
  lat?: number;
  lng?: number;
}

export interface Country {
  name: string;
  code: string;
  flag: string;
  cities: string[];
}

export const countries: Country[] = [
  {
    name: "Pakistan",
    code: "PK",
    flag: "🇵🇰",
    cities: [
      "Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan", "Hyderabad", "Gujranwala", 
      "Peshawar", "Quetta", "Sargodha", "Sialkot", "Bahawalpur", "Sukkur", "Sheikhupura", "Rahim Yar Khan", 
      "Larkana", "Gujrat", "Mardan", "Kasur", "Sahiwal", "Okara", "Wah Cantt", "Mirpur Khas", 
      "Dera Ghazi Khan", "Chiniot", "Kamoke", "Mandi Bahauddin", "Mingora", "Jacobabad", "Jhelum", 
      "Khanewal", "Khairpur", "Khuzdar", "Dera Ismail Khan", "Muzaffargarh", "Burewala", "Abbottabad", 
      "Muridke", "Jaranwala", "Chishtian", "Attock", "Shikarpur", "Kohat", "Hafizabad", "Kot Abdul Malik", 
      "Lodhran", "Malakand", "Swabi", "Nowshera", "Taxila", "Chaman", "Gojra", "Bahawalnagar", "Murree"
    ]
  },
  {
    name: "UAE",
    code: "AE",
    flag: "🇦🇪",
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain", "Khor Fakkan"]
  },
  {
    name: "USA",
    code: "US",
    flag: "🇺🇸",
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "San Francisco"]
  },
  {
    name: "UK",
    code: "GB",
    flag: "🇬🇧",
    cities: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Leicester"]
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    flag: "🇸🇦",
    cities: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Abha", "Tabuk", "Taif", "Buraidah"]
  },
  {
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur"]
  },
  {
    name: "Germany",
    code: "DE",
    flag: "🇩🇪",
    cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"]
  },
  {
    name: "France",
    code: "FR",
    flag: "🇫🇷",
    cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"]
  },
  {
    name: "Turkey",
    code: "TR",
    flag: "🇹🇷",
    cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Mersin", "Eskisehir"]
  },
  {
    name: "Indonesia",
    code: "ID",
    flag: "🇮🇩",
    cities: ["Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", "Tangerang", "Semarang", "Palembang", "South Tangerang", "Makassar", "Bali (Denpasar)", "Yogyakarta"]
  },
  {
    name: "Malaysia",
    code: "MY",
    flag: "🇲🇾",
    cities: ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Petaling Jaya", "Johor Bahru", "Melaka", "Kota Kinabalu", "Kuching"]
  },
  {
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Wollongong"]
  },
  {
    name: "Canada",
    code: "CA",
    flag: "🇨🇦",
    cities: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener"]
  },
  {
    name: "Japan",
    code: "JP",
    flag: "🇯🇵",
    cities: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama"]
  },
  {
    name: "Brazil",
    code: "BR",
    flag: "🇧🇷",
    cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife"]
  },
  {
    name: "Greece",
    code: "GR",
    flag: "🇬🇷",
    cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Rhodes", "Chania", "Santorini (Fira)"]
  },
  {
    name: "Morocco",
    code: "MA",
    flag: "🇲🇦",
    cities: ["Casablanca", "Fez", "Tangier", "Marrakech", "Salé", "Meknes", "Rabat", "Oujda", "Kenitra", "Agadir"]
  },
  {
    name: "South Africa",
    code: "ZA",
    flag: "🇿🇦",
    cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Sandton"]
  }
];
