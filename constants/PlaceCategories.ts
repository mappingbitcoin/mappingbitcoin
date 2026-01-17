import {Locale} from "@/i18n/types";

export const PLACE_SUBTYPE_MAP = {
    automotive: [
        "car_dealer", "car_rental", "car_repair", "car_wash", "bicycle_rental",
        "electric_vehicle_charging_station", "gas_station", "parking", "rest_stop"
    ],
    business: ["corporate_office", "farm", "ranch", "coworking_space"],
    culture: [
        "art_gallery", "art_studio", "auditorium", "cultural_landmark", "historical_place",
        "monument", "museum", "performing_arts_theater", "sculpture"
    ],
    education: [
        "library", "preschool", "primary_school", "school", "secondary_school", "university",
        "music_school", "cooking_school", "driving_school"
    ],
    "entertainment-and-recreation": [
        "adventure_sports_center", "amphitheatre", "amusement_center", "amusement_park", "aquarium",
        "banquet_hall", "barbecue_area", "botanical_garden", "bowling_alley", "casino",
        "childrens_camp", "comedy_club", "community_center", "concert_hall", "convention_center",
        "cultural_center", "cycling_park", "dance_hall", "dog_park", "event_venue",
        "ferris_wheel", "garden", "hiking_area", "historical_landmark", "internet_cafe",
        "karaoke", "marina", "movie_rental", "movie_theater", "national_park",
        "night_club", "observation_deck", "off_roading_area", "opera_house", "park",
        "philharmonic_hall", "picnic_ground", "planetarium", "plaza", "roller_coaster",
        "skateboard_park", "state_park", "tourist_attraction", "video_arcade", "visitor_center",
        "water_park", "wedding_venue", "wildlife_park", "wildlife_refuge", "zoo"
    ],
    facilities: ["public_bath", "public_bathroom", "stable"],
    finance: ["accounting", "atm", "bank", "currency_exchange"],
    "food-and-drink": [
        "acai_shop", "afghani_restaurant", "african_restaurant", "american_restaurant", "asian_restaurant",
        "bagel_shop", "bakery", "bar", "bar_and_grill", "barbecue_restaurant",
        "brazilian_restaurant", "breakfast_restaurant", "brunch_restaurant", "buffet_restaurant", "cafe",
        "cafeteria", "candy_store", "cat_cafe", "chinese_restaurant", "chocolate_factory",
        "chocolate_shop", "coffee_shop", "confectionery", "deli", "dessert_restaurant",
        "dessert_shop", "diner", "dog_cafe", "donut_shop", "fast_food_restaurant",
        "fine_dining_restaurant", "food_court", "french_restaurant", "greek_restaurant", "hamburger_restaurant",
        "ice_cream_shop", "indian_restaurant", "indonesian_restaurant", "italian_restaurant", "japanese_restaurant",
        "juice_shop", "korean_restaurant", "lebanese_restaurant", "meal_delivery", "meal_takeaway",
        "mediterranean_restaurant", "mexican_restaurant", "middle_eastern_restaurant", "pizza_restaurant", "pub",
        "ramen_restaurant", "restaurant", "sandwich_shop", "seafood_restaurant", "spanish_restaurant",
        "steak_house", "sushi_restaurant", "tea_house", "thai_restaurant", "turkish_restaurant",
        "vegan_restaurant", "vegetarian_restaurant", "vietnamese_restaurant", "wine_bar"
    ],
    "geographical-areas": [
        "administrative_area_level_1", "administrative_area_level_2", "country",
        "locality", "postal_code", "school_district"
    ],
    government: [
        "city_hall", "courthouse", "embassy", "fire_station", "government_office",
        "local_government_office", "neighborhood_police_station", "police", "post_office"
    ],
    "health-and-wellness": [
        "alternative_medicine", "chiropractor", "clinic", "dental_clinic", "dentist", "doctor", "drugstore", "hospital",
        "massage", "medical_lab", "pharmacy", "physiotherapist", "sauna", "psychotherapist",
        "skin_care_clinic", "spa", "tanning_studio", "wellness_center", "yoga_studio"
    ],
    housing: ["apartment_building", "apartment_complex", "condominium_complex", "housing_complex"],
    lodging: [
        "bed_and_breakfast", "budget_japanese_inn", "campground", "camping_cabin", "cottage",
        "extended_stay_hotel", "farmstay", "guest_house", "hostel", "hotel", "chalet",
        "inn", "japanese_inn", "lodging", "mobile_home_park", "motel",
        "private_guest_room", "resort_hotel", "rv_park"
    ],
    "natural-features": ["beach"],
    "places-of-worship": ["church", "hindu_temple", "mosque", "synagogue"],
    services: [
        "3d-printing", "advertising", "astrologer", "architect", "barber_shop",
        "beautician", "beauty_salon", "body_art_service", "cleaning", "contractor",
        "catering_service", "cemetery", "child_care_agency", "consultant", "courier_service",
        "electrician", "florist", "food_delivery", "foot_care", "funeral_home", "graphic_design",
        "gardener", "hair_care", "hair_salon", "insurance_agency", "laundry", "lawyer",
        "locksmith", "makeup_artist", "moving_company", "nail_salon", "painter", "photographer",
        "plumber", "psychic", "real_estate_agency", "roofing_contractor", "storage",
        "summer_camp_organizer", "tailor", "telecommunications_service_provider", "tour_agency",
        "tourist_information_center", "travel_agency", "veterinary_care", "beekeeper", "carpenter"
    ],
    shopping: [
        "asian_grocery_store", "auto_parts_store", "bicycle_store", "book_store", "butcher_shop", "cannabis",
        "cell_phone_store", "clothing_store", "craft_store", "convenience_store", "copyshop", "department_store", "discount_store",
        "gardening_store", "second_hand",
        "electronics_store", "food_store", "furniture_store", "gift_shop", "grocery_store",
        "hardware_store", "home_goods_store", "home_improvement_store", "jewelry_store", "liquor_store",
        "market", "music_store", "pet_store", "optician", "tobacco", "seafood_shop", "shoe_store", "shopping_mall",
        "sporting_goods_store", "stationery_store", "store", "supermarket", "warehouse_store", "wholesaler"
    ],
    sports: [
        "arena", "athletic_field", "dojo", "fishing_charter", "fishing_pond", "fitness_center",
        "golf_course", "gym", "ice_skating_rink", "playground", "ski_resort",
        "sports_activity_location", "sports_club", "sports_coaching", "sports_complex",
        "stadium", "swimming_pool", "water_sports", "surf_school"
    ],
    transportation: [
        "airport", "airstrip", "bus_station", "bus_stop", "ferry_terminal", "heliport",
        "international_airport", "light_rail_station", "park_and_ride", "subway_station",
        "taxi_stand", "train_station", "transit_depot", "transit_station", "truck_stop"
    ]
} as const;

export type PlaceCategory = keyof typeof PLACE_SUBTYPE_MAP;

export type PlaceSubcategoryMap = {
    [K in PlaceCategory]: (typeof PLACE_SUBTYPE_MAP)[K][number];
};

export type PlaceSubcategory = typeof PLACE_SUBTYPE_MAP[keyof typeof PLACE_SUBTYPE_MAP][number];

type PlaceCategoryInfo = {
    [K in PlaceCategory]: {
        label: string;
        types: Record<PlaceSubcategoryMap[K], string>;
    }
};

export function getCategoriesByLocale(locale: Locale) {
    return Object.keys(PLACE_CATEGORIES[locale]) as PlaceCategory[];
}

export function getSubcategories<K extends PlaceCategory>(
    category: K
): readonly (typeof PLACE_SUBTYPE_MAP[K])[number][] {
    return [...PLACE_SUBTYPE_MAP[category]];
}

export function matchPlaceSubcategory(input: string): { category: PlaceCategory, subcategory: PlaceSubcategoryMap[PlaceCategory]} | null {
    for (const category of Object.keys(PLACE_SUBTYPE_MAP) as PlaceCategory[]) {
        const subtypes = PLACE_SUBTYPE_MAP[category];
        for (const subcategory of subtypes) {
            if (subcategory === input) {
                return { category: category, subcategory: subcategory as PlaceSubcategoryMap[typeof category] };
            }
        }
    }
    return null;
}

// This function assumes you've already matched the subcategory to a category
export function getSubcategoryLabel(locale: Locale, category: PlaceCategory, subcategory: string): string | null {
    const placeCategoryInfo = PLACE_CATEGORIES[locale];
    for (const [categoryKey, info] of Object.entries(placeCategoryInfo)) {
        if (categoryKey === category) {
            const label = info.types?.[subcategory as keyof typeof info.types];
            if (label) return label;
        }
    }
    return null;
}

export const PLACE_CATEGORIES: Record<Locale, PlaceCategoryInfo> = {
    "en": {
        "automotive": {
            "label": "Automotive",
            "types": {
                "bicycle_rental": "Bicycle rental",
                "car_dealer": "Car dealer",
                "car_rental": "Car rental",
                "car_repair": "Car repair",
                "car_wash": "Car wash",
                "electric_vehicle_charging_station": "Electric vehicle charging station",
                "gas_station": "Gas station",
                "parking": "Parking",
                "rest_stop": "Rest stop"
            }
        },
        "business": {
            "label": "Business",
            "types": {
                "coworking_space": "Coworking space",
                "corporate_office": "Corporate office",
                "farm": "Farm",
                "ranch": "Ranch"
            }
        },
        "culture": {
            "label": "Culture",
            "types": {
                "art_gallery": "Art gallery",
                "art_studio": "Art studio",
                "auditorium": "Auditorium",
                "cultural_landmark": "Cultural landmark",
                "historical_place": "Historical place",
                "monument": "Monument",
                "museum": "Museum",
                "performing_arts_theater": "Performing arts theater",
                "sculpture": "Sculpture"
            }
        },
        "education": {
            "label": "Education",
            "types": {
                "library": "Library",
                "preschool": "Preschool",
                "primary_school": "Primary school",
                "school": "School",
                "secondary_school": "Secondary school",
                "university": "University",
                music_school: "Music school", cooking_school: "Cooking school", driving_school: "Driving school"
            }
        },
        "entertainment-and-recreation": {
            "label": "Entertainment and recreation",
            "types": {
                "adventure_sports_center": "Adventure sports center",
                "amphitheatre": "Amphitheatre",
                "amusement_center": "Amusement center",
                "amusement_park": "Amusement park",
                "aquarium": "Aquarium",
                "banquet_hall": "Banquet hall",
                "barbecue_area": "Barbecue area",
                "botanical_garden": "Botanical garden",
                "bowling_alley": "Bowling alley",
                "casino": "Casino",
                "childrens_camp": "Childrens camp",
                "comedy_club": "Comedy club",
                "community_center": "Community center",
                "concert_hall": "Concert hall",
                "convention_center": "Convention center",
                "cultural_center": "Cultural center",
                "cycling_park": "Cycling park",
                "dance_hall": "Dance hall",
                "dog_park": "Dog park",
                "event_venue": "Event venue",
                "ferris_wheel": "Ferris wheel",
                "garden": "Garden",
                "hiking_area": "Hiking area",
                "historical_landmark": "Historical landmark",
                "internet_cafe": "Internet cafe",
                "karaoke": "Karaoke",
                "marina": "Marina",
                "movie_rental": "Movie rental",
                "movie_theater": "Movie theater",
                "national_park": "National park",
                "night_club": "Night club",
                "observation_deck": "Observation deck",
                "off_roading_area": "Off roading area",
                "opera_house": "Opera house",
                "park": "Park",
                "philharmonic_hall": "Philharmonic hall",
                "picnic_ground": "Picnic ground",
                "planetarium": "Planetarium",
                "plaza": "Plaza",
                "roller_coaster": "Roller coaster",
                "skateboard_park": "Skateboard park",
                "state_park": "State park",
                "tourist_attraction": "Tourist attraction",
                "video_arcade": "Video arcade",
                "visitor_center": "Visitor center",
                "water_park": "Water park",
                "wedding_venue": "Wedding venue",
                "wildlife_park": "Wildlife park",
                "wildlife_refuge": "Wildlife refuge",
                "zoo": "Zoo"
            }
        },
        "facilities": {
            "label": "Facilities",
            "types": {
                "public_bath": "Public bath",
                "public_bathroom": "Public bathroom",
                "stable": "Stable"
            }
        },
        "finance": {
            "label": "Finance",
            "types": {
                "accounting": "Accounting",
                "atm": "Atm",
                "bank": "Bank",
                "currency_exchange": "Currency exchange"
            }
        },
        "food-and-drink": {
            "label": "Food and drink",
            "types": {
                "acai_shop": "Acai shop",
                "afghani_restaurant": "Afghani restaurant",
                "african_restaurant": "African restaurant",
                "american_restaurant": "American restaurant",
                "asian_restaurant": "Asian restaurant",
                "bagel_shop": "Bagel shop",
                "bakery": "Bakery",
                "bar": "Bar",
                "bar_and_grill": "Bar and grill",
                "barbecue_restaurant": "Barbecue restaurant",
                "brazilian_restaurant": "Brazilian restaurant",
                "breakfast_restaurant": "Breakfast restaurant",
                "brunch_restaurant": "Brunch restaurant",
                "buffet_restaurant": "Buffet restaurant",
                "cafe": "Cafe",
                "cafeteria": "Cafeteria",
                "candy_store": "Candy store",
                "cat_cafe": "Cat cafe",
                "chinese_restaurant": "Chinese restaurant",
                "chocolate_factory": "Chocolate factory",
                "chocolate_shop": "Chocolate shop",
                "coffee_shop": "Coffee shop",
                "confectionery": "Confectionery",
                "deli": "Deli",
                "dessert_restaurant": "Dessert restaurant",
                "dessert_shop": "Dessert shop",
                "diner": "Diner",
                "dog_cafe": "Dog cafe",
                "donut_shop": "Donut shop",
                "fast_food_restaurant": "Fast food restaurant",
                "fine_dining_restaurant": "Fine dining restaurant",
                "food_court": "Food court",
                "french_restaurant": "French restaurant",
                "greek_restaurant": "Greek restaurant",
                "hamburger_restaurant": "Hamburger restaurant",
                "ice_cream_shop": "Ice cream shop",
                "indian_restaurant": "Indian restaurant",
                "indonesian_restaurant": "Indonesian restaurant",
                "italian_restaurant": "Italian restaurant",
                "japanese_restaurant": "Japanese restaurant",
                "juice_shop": "Juice shop",
                "korean_restaurant": "Korean restaurant",
                "lebanese_restaurant": "Lebanese restaurant",
                "meal_delivery": "Meal delivery",
                "meal_takeaway": "Meal takeaway",
                "mediterranean_restaurant": "Mediterranean restaurant",
                "mexican_restaurant": "Mexican restaurant",
                "middle_eastern_restaurant": "Middle eastern restaurant",
                "pizza_restaurant": "Pizza restaurant",
                "pub": "Pub",
                "ramen_restaurant": "Ramen restaurant",
                "restaurant": "Restaurant",
                "sandwich_shop": "Sandwich shop",
                "seafood_restaurant": "Seafood restaurant",
                "spanish_restaurant": "Spanish restaurant",
                "steak_house": "Steak house",
                "sushi_restaurant": "Sushi restaurant",
                "tea_house": "Tea house",
                "thai_restaurant": "Thai restaurant",
                "turkish_restaurant": "Turkish restaurant",
                "vegan_restaurant": "Vegan restaurant",
                "vegetarian_restaurant": "Vegetarian restaurant",
                "vietnamese_restaurant": "Vietnamese restaurant",
                "wine_bar": "Wine bar"
            }
        },
        "geographical-areas": {
            "label": "Geographical areas",
            "types": {
                "administrative_area_level_1": "Administrative area level 1",
                "administrative_area_level_2": "Administrative area level 2",
                "country": "Country",
                "locality": "Locality",
                "postal_code": "Postal code",
                "school_district": "School district"
            }
        },
        "government": {
            "label": "Government",
            "types": {
                "city_hall": "City hall",
                "courthouse": "Courthouse",
                "embassy": "Embassy",
                "fire_station": "Fire station",
                "government_office": "Government office",
                "local_government_office": "Local government office",
                "neighborhood_police_station": "Neighborhood police station",
                "police": "Police",
                "post_office": "Post office"
            }
        },
        "health-and-wellness": {
            "label": "Health and wellness",
            "types": {
                alternative_medicine: "Alternative medicine",
                "psychotherapist": "Psychotherapist",
                "chiropractor": "Chiropractor",
                "clinic": "Clinic",
                "dental_clinic": "Dental clinic",
                "dentist": "Dentist",
                "doctor": "Doctor",
                "drugstore": "Drugstore",
                "hospital": "Hospital",
                "massage": "Massage",
                "medical_lab": "Medical lab",
                "pharmacy": "Pharmacy",
                "physiotherapist": "Physiotherapist",
                "sauna": "Sauna",
                "skin_care_clinic": "Skin care clinic",
                "spa": "Spa",
                "tanning_studio": "Tanning studio",
                "wellness_center": "Wellness center",
                "yoga_studio": "Yoga studio"
            }
        },
        "housing": {
            "label": "Housing",
            "types": {
                "apartment_building": "Apartment building",
                "apartment_complex": "Apartment complex",
                "condominium_complex": "Condominium complex",
                "housing_complex": "Housing complex"
            }
        },
        "lodging": {
            "label": "Lodging",
            "types": {
                "chalet": "Chalet",
                "bed_and_breakfast": "Bed and breakfast",
                "budget_japanese_inn": "Budget japanese inn",
                "campground": "Campground",
                "camping_cabin": "Camping cabin",
                "cottage": "Cottage",
                "extended_stay_hotel": "Extended stay hotel",
                "farmstay": "Farmstay",
                "guest_house": "Guest house",
                "hostel": "Hostel",
                "hotel": "Hotel",
                "inn": "Inn",
                "japanese_inn": "Japanese inn",
                "lodging": "Lodging",
                "mobile_home_park": "Mobile home park",
                "motel": "Motel",
                "private_guest_room": "Private guest room",
                "resort_hotel": "Resort hotel",
                "rv_park": "Rv park"
            }
        },
        "natural-features": {
            "label": "Natural features",
            "types": {
                "beach": "Beach"
            }
        },
        "places-of-worship": {
            "label": "Places of worship",
            "types": {
                "church": "Church",
                "hindu_temple": "Hindu temple",
                "mosque": "Mosque",
                "synagogue": "Synagogue"
            }
        },
        "services": {
            "label": "Services",
            "types": {
                advertising: "Advertising",
                architect: "Architect",
                cleaning: "Cleaning",
                contractor: "Contractor",
                graphic_design: "Graphic design",
                gardener: "Gardener",
                photographer: "Photographer",
                beekeeper: "Beekeeper",
                carpenter: "Carpenter",
                "3d-printing": "3d printing",
                "astrologer": "Astrologer",
                "barber_shop": "Barber shop",
                "beautician": "Beautician",
                "beauty_salon": "Beauty salon",
                "body_art_service": "Body art service",
                "catering_service": "Catering service",
                "cemetery": "Cemetery",
                "child_care_agency": "Child care agency",
                "consultant": "Consultant",
                "courier_service": "Courier service",
                "electrician": "Electrician",
                "florist": "Florist",
                "food_delivery": "Food delivery",
                "foot_care": "Foot care",
                "funeral_home": "Funeral home",
                "hair_care": "Hair care",
                "hair_salon": "Hair salon",
                "insurance_agency": "Insurance agency",
                "laundry": "Laundry",
                "lawyer": "Lawyer",
                "locksmith": "Locksmith",
                "makeup_artist": "Makeup artist",
                "moving_company": "Moving company",
                "nail_salon": "Nail salon",
                "painter": "Painter",
                "plumber": "Plumber",
                "psychic": "Psychic",
                "real_estate_agency": "Real estate agency",
                "roofing_contractor": "Roofing contractor",
                "storage": "Storage",
                "summer_camp_organizer": "Summer camp organizer",
                "tailor": "Tailor",
                "telecommunications_service_provider": "Telecommunications service provider",
                "tour_agency": "Tour agency",
                "tourist_information_center": "Tourist information center",
                "travel_agency": "Travel agency",
                "veterinary_care": "Veterinary care"
            }
        },
        "shopping": {
            "label": "Shopping",
            "types": {
                cannabis: "Cannabis shop",
                craft_store: "Craft store",
                copyshop: "Copy-shop",
                "second_hand": "Second hand shop",
                gardening_store: "Gardening store",
                "tobacco": "Tobacco",
                seafood_shop: "Seafood shop",
                stationery_store: "Stationery store",
                "asian_grocery_store": "Asian grocery store",
                "auto_parts_store": "Auto parts store",
                "bicycle_store": "Bicycle store",
                "book_store": "Book store",
                "butcher_shop": "Butcher shop",
                "cell_phone_store": "Cell phone store",
                "clothing_store": "Clothing store",
                "convenience_store": "Convenience store",
                "department_store": "Department store",
                "discount_store": "Discount store",
                "electronics_store": "Electronics store",
                "food_store": "Food store",
                "furniture_store": "Furniture store",
                "gift_shop": "Gift shop",
                "grocery_store": "Grocery store",
                "hardware_store": "Hardware store",
                "home_goods_store": "Home goods store",
                "home_improvement_store": "Home improvement store",
                "jewelry_store": "Jewelry store",
                "liquor_store": "Liquor store",
                "market": "Market",
                "music_store": "Music store",
                "pet_store": "Pet store",
                "optician": "Optician",
                "shoe_store": "Shoe store",
                "shopping_mall": "Shopping mall",
                "sporting_goods_store": "Sporting goods store",
                "store": "Store",
                "supermarket": "Supermarket",
                "warehouse_store": "Warehouse store",
                "wholesaler": "Wholesaler"
            }
        },
        "sports": {
            "label": "Sports",
            "types": {
                dojo: "Dojo",
                water_sports: "Water sports",
                surf_school: "Surf school",
                "arena": "Arena",
                "athletic_field": "Athletic field",
                "fishing_charter": "Fishing charter",
                "fishing_pond": "Fishing pond",
                "fitness_center": "Fitness center",
                "golf_course": "Golf course",
                "gym": "Gym",
                "ice_skating_rink": "Ice skating rink",
                "playground": "Playground",
                "ski_resort": "Ski resort",
                "sports_activity_location": "Sports activity location",
                "sports_club": "Sports club",
                "sports_coaching": "Sports coaching",
                "sports_complex": "Sports complex",
                "stadium": "Stadium",
                "swimming_pool": "Swimming pool"
            }
        },
        "transportation": {
            "label": "Transportation",
            "types": {
                "airport": "Airport",
                "airstrip": "Airstrip",
                "bus_station": "Bus station",
                "bus_stop": "Bus stop",
                "ferry_terminal": "Ferry terminal",
                "heliport": "Heliport",
                "international_airport": "International airport",
                "light_rail_station": "Light rail station",
                "park_and_ride": "Park and ride",
                "subway_station": "Subway station",
                "taxi_stand": "Taxi stand",
                "train_station": "Train station",
                "transit_depot": "Transit depot",
                "transit_station": "Transit station",
                "truck_stop": "Truck stop"
            }
        }
    },
    es: {
        automotive: {
            "label": "Automotriz",
            "types": {
                "bicycle_rental": 'Renta de bicicletas',
                "car_dealer": "Concesionario de autos",
                "car_rental": "Alquiler de autos",
                "car_repair": "Taller mecánico",
                "car_wash": "Lavado de autos",
                "electric_vehicle_charging_station": "Estación de carga para vehículos eléctricos",
                "gas_station": "Estación de servicio",
                "parking": "Estacionamiento",
                "rest_stop": "Área de descanso"
            }
        },
        business: {
            "label": "Negocios",
            "types": {
                "corporate_office": "Oficina corporativa",
                "farm": "Granja",
                "ranch": "Rancho",
                coworking_space: "Espacio coworking"
            }
        },
        culture: {
            "label": "Cultura",
            "types": {
                "art_gallery": "Galería de arte",
                "art_studio": "Estudio de arte",
                "auditorium": "Auditorio",
                "cultural_landmark": "Lugar emblemático cultural",
                "historical_place": "Lugar histórico",
                "monument": "Monumento",
                "museum": "Museo",
                "performing_arts_theater": "Teatro de artes escénicas",
                "sculpture": "Escultura"
            }
        },
        education: {
            "label": "Educación",
            "types": {
                "library": "Biblioteca",
                "preschool": "Jardín de infantes",
                "primary_school": "Escuela primaria",
                "school": "Escuela",
                "secondary_school": "Escuela secundaria",
                "university": "Universidad",
                music_school: "Escuela de música",
                driving_school: "Escuela de manejo",
                "cooking_school": "Escuela de cocina"
            }
        },
        "entertainment-and-recreation": {
            "label": "Entretenimiento y Recreación",
            "types": {
                "adventure_sports_center": "Centro de deportes de aventura",
                "amphitheatre": "Anfiteatro",
                "amusement_center": "Centro de entretenimiento",
                "amusement_park": "Parque de diversiones",
                "aquarium": "Acuario",
                "banquet_hall": "Salón de banquetes",
                "barbecue_area": "Área de barbacoa",
                "botanical_garden": "Jardín botánico",
                "bowling_alley": "Bolera",
                "casino": "Casino",
                "childrens_camp": "Campamento infantil",
                "comedy_club": "Club de comedia",
                "community_center": "Centro comunitario",
                "concert_hall": "Sala de conciertos",
                "convention_center": "Centro de convenciones",
                "cultural_center": "Centro cultural",
                "cycling_park": "Parque para ciclismo",
                "dance_hall": "Sala de baile",
                "dog_park": "Parque para perros",
                "event_venue": "Salón de eventos",
                "ferris_wheel": "Noria",
                "garden": "Jardín",
                "hiking_area": "Zona de senderismo",
                "historical_landmark": "Sitio histórico emblemático",
                "internet_cafe": "Cibercafé",
                "karaoke": "Karaoke",
                "marina": "Marina",
                "movie_rental": "Alquiler de películas",
                "movie_theater": "Cine",
                "national_park": "Parque nacional",
                "night_club": "Club nocturno",
                "observation_deck": "Plataforma de observación",
                "off_roading_area": "Zona de todoterreno",
                "opera_house": "Casa de la ópera",
                "park": "Parque",
                "philharmonic_hall": "Sala filarmónica",
                "picnic_ground": "Área de picnic",
                "planetarium": "Planetario",
                "plaza": "Plaza",
                "roller_coaster": "Montaña rusa",
                "skateboard_park": "Parque de skate",
                "state_park": "Parque estatal",
                "tourist_attraction": "Atracción turística",
                "video_arcade": "Sala de videojuegos",
                "visitor_center": "Centro de visitantes",
                "water_park": "Parque acuático",
                "wedding_venue": "Salón de bodas",
                "wildlife_park": "Parque de vida silvestre",
                "wildlife_refuge": "Refugio de vida silvestre",
                "zoo": "Zoológico"
            }
        },
        facilities: {
            "label": "Instalaciones",
            "types": {
                "public_bath": "Baño público",
                "public_bathroom": "Sanitario público",
                "stable": "Establo"
            }
        },
        "finance": {
            "label": "Finanzas",
            "types": {
                "accounting": "Contaduría",
                "atm": "Cajero automático",
                "bank": "Banco",
                "currency_exchange": "Casa de cambio"
            }
        },
        "food-and-drink": {
            "label": "Comida y Bebida",
            "types": {
                "acai_shop": "Tienda de açaí",
                "afghani_restaurant": "Restaurante afgano",
                "african_restaurant": "Restaurante africano",
                "american_restaurant": "Restaurante americano",
                "asian_restaurant": "Restaurante asiático",
                "bagel_shop": "Tienda de bagels",
                "bakery": "Panadería",
                "bar": "Bar",
                "bar_and_grill": "Bar y parrilla",
                "barbecue_restaurant": "Restaurante de barbacoa",
                "brazilian_restaurant": "Restaurante brasileño",
                "breakfast_restaurant": "Restaurante de desayunos",
                "brunch_restaurant": "Restaurante de brunch",
                "buffet_restaurant": "Restaurante buffet",
                "cafe": "Café",
                "cafeteria": "Cafetería",
                "candy_store": "Tienda de dulces",
                "cat_cafe": "Café con gatos",
                "chinese_restaurant": "Restaurante chino",
                "chocolate_factory": "Fábrica de chocolate",
                "chocolate_shop": "Tienda de chocolate",
                "coffee_shop": "Cafetería",
                "confectionery": "Confitería",
                "deli": "Delicatessen",
                "dessert_restaurant": "Restaurante de postres",
                "dessert_shop": "Tienda de postres",
                "diner": "Cafetería americana",
                "dog_cafe": "Café con perros",
                "donut_shop": "Tienda de donas",
                "fast_food_restaurant": "Restaurante de comida rápida",
                "fine_dining_restaurant": "Restaurante de alta cocina",
                "food_court": "Patio de comidas",
                "french_restaurant": "Restaurante francés",
                "greek_restaurant": "Restaurante griego",
                "hamburger_restaurant": "Hamburguesería",
                "ice_cream_shop": "Heladería",
                "indian_restaurant": "Restaurante indio",
                "indonesian_restaurant": "Restaurante indonesio",
                "italian_restaurant": "Restaurante italiano",
                "japanese_restaurant": "Restaurante japonés",
                "juice_shop": "Tienda de jugos",
                "korean_restaurant": "Restaurante coreano",
                "lebanese_restaurant": "Restaurante libanés",
                "meal_delivery": "Entrega de comida",
                "meal_takeaway": "Comida para llevar",
                "mediterranean_restaurant": "Restaurante mediterráneo",
                "mexican_restaurant": "Restaurante mexicano",
                "middle_eastern_restaurant": "Restaurante de Medio Oriente",
                "pizza_restaurant": "Pizzería",
                "pub": "Pub",
                "ramen_restaurant": "Restaurante de ramen",
                "restaurant": "Restaurante",
                "sandwich_shop": "Tienda de sándwiches",
                "seafood_restaurant": "Restaurante de mariscos",
                "spanish_restaurant": "Restaurante español",
                "steak_house": "Parrilla",
                "sushi_restaurant": "Restaurante de sushi",
                "tea_house": "Casa de té",
                "thai_restaurant": "Restaurante tailandés",
                "turkish_restaurant": "Restaurante turco",
                "vegan_restaurant": "Restaurante vegano",
                "vegetarian_restaurant": "Restaurante vegetariano",
                "vietnamese_restaurant": "Restaurante vietnamita",
                "wine_bar": "Bar de vinos"
            }
        },
        "geographical-areas": {
            "label": "Áreas geográficas",
            "types": {
                "administrative_area_level_1": "Área administrativa nivel 1",
                "administrative_area_level_2": "Área administrativa nivel 2",
                "country": "País",
                "locality": "Localidad",
                "postal_code": "Código postal",
                "school_district": "Distrito escolar"
            }
        },
        "government": {
            "label": "Gobierno",
            "types": {
                "city_hall": "Ayuntamiento",
                "courthouse": "Palacio de justicia",
                "embassy": "Embajada",
                "fire_station": "Estación de bomberos",
                "government_office": "Oficina gubernamental",
                "local_government_office": "Oficina del gobierno local",
                "neighborhood_police_station": "Comisaría de barrio",
                "police": "Policía",
                "post_office": "Oficina de correos"
            }
        },
        "health-and-wellness": {
            "label": "Salud y Bienestar",
            "types": {
                alternative_medicine: "Medicina alternativa",
                "psychotherapist": "Psicoterapeuta",
                "chiropractor": "Quiropráctico",
                "clinic": "Clínica",
                "dental_clinic": "Clínica dental",
                "dentist": "Dentista",
                "doctor": "Médico",
                "drugstore": "Farmacia",
                "hospital": "Hospital",
                "massage": "Masajes",
                "medical_lab": "Laboratorio médico",
                "pharmacy": "Farmacia",
                "physiotherapist": "Fisioterapeuta",
                "sauna": "Sauna",
                "skin_care_clinic": "Clínica de cuidado de la piel",
                "spa": "Spa",
                "tanning_studio": "Centro de bronceado",
                "wellness_center": "Centro de bienestar",
                "yoga_studio": "Estudio de yoga"
            }
        },
        "housing": {
            "label": "Vivienda",
            "types": {
                "apartment_building": "Edificio de apartamentos",
                "apartment_complex": "Complejo de apartamentos",
                "condominium_complex": "Complejo de condominios",
                "housing_complex": "Conjunto habitacional"
            }
        },
        "lodging": {
            "label": "Alojamiento",
            "types": {
                "bed_and_breakfast": "Cama y desayuno",
                "budget_japanese_inn": "Posada japonesa económica",
                'chalet': "Chalet",
                "campground": "Campamento",
                "camping_cabin": "Cabaña de camping",
                "cottage": "Cabaña",
                "extended_stay_hotel": "Hotel de estadía prolongada",
                "farmstay": "Alojamiento en granja",
                "guest_house": "Casa de huéspedes",
                "hostel": "Hostal",
                "hotel": "Hotel",
                "inn": "Posada",
                "japanese_inn": "Posada japonesa",
                "lodging": "Alojamiento",
                "mobile_home_park": "Parque de casas rodantes",
                "motel": "Motel",
                "private_guest_room": "Habitación privada para huéspedes",
                "resort_hotel": "Hotel resort",
                "rv_park": "Parque para casas rodantes"
            }
        },
        "natural-features": {
            "label": "Elementos naturales",
            "types": {
                "beach": "Playa"
            }
        },
        "places-of-worship": {
            "label": "Lugares de culto",
            "types": {
                "church": "Iglesia",
                "hindu_temple": "Templo hindú",
                "mosque": "Mezquita",
                "synagogue": "Sinagoga"
            }
        },
        "services": {
            "label": "Servicios",
            "types": {
                "3d-printing": "Impresión 3D",
                "advertising": "Publicidad",
                "architect": "Arquitecto",
                "cleaning": "Limpiador",
                "graphic_design": "Diseño gráfico",
                "gardener": "Jardinero",
                "photographer": "Fotógrafo",
                "beekeeper": "Cuidador de abejas",
                "carpenter": "Carpintero",
                "astrologer": "Astrólogo",
                "barber_shop": "Barbería",
                "beautician": "Esteticista",
                "beauty_salon": "Salón de belleza",
                "body_art_service": "Servicio de arte corporal",
                "catering_service": "Servicio de catering",
                "cemetery": "Cementerio",
                "child_care_agency": "Agencia de cuidado infantil",
                "consultant": "Consultor",
                "contractor": "Contratista",
                "courier_service": "Servicio de mensajería",
                "electrician": "Electricista",
                "florist": "Floristería",
                "food_delivery": "Entrega de comida",
                "foot_care": "Cuidado de los pies",
                "funeral_home": "Funeraria",
                "hair_care": "Cuidado del cabello",
                "hair_salon": "Peluquería",
                "insurance_agency": "Agencia de seguros",
                "laundry": "Lavandería",
                "lawyer": "Abogado",
                "locksmith": "Cerrajero",
                "makeup_artist": "Maquillador(a)",
                "moving_company": "Empresa de mudanzas",
                "nail_salon": "Salón de uñas",
                "painter": "Pintor",
                "plumber": "Plomero",
                "psychic": "Psíquico",
                "real_estate_agency": "Agencia inmobiliaria",
                "roofing_contractor": "Contratista de techos",
                "storage": "Depósito",
                "summer_camp_organizer": "Organizador de campamentos de verano",
                "tailor": "Sastre",
                "telecommunications_service_provider": "Proveedor de servicios de telecomunicaciones",
                "tour_agency": "Agencia de turismo",
                "tourist_information_center": "Centro de información turística",
                "travel_agency": "Agencia de viajes",
                "veterinary_care": "Atención veterinaria"
            }
        },
        "shopping": {
            "label": "Compras",
            "types": {
                second_hand: "Tienda de artículos usados",
                tobacco: "Tienda de tabaco",
                seafood_shop: "Tienda de mariscos",
                stationery_store: "Librería",
                cannabis: "Cannabis",
                craft_store: "Tienda de manualidades",
                copyshop: "Fotocopiadora",
                gardening_store: "Tienda de jardinería",
                "asian_grocery_store": "Tienda de comestibles asiáticos",
                "auto_parts_store": "Tienda de repuestos de autos",
                "bicycle_store": "Tienda de bicicletas",
                "book_store": "Librería",
                "butcher_shop": "Carnicería",
                "cell_phone_store": "Tienda de teléfonos móviles",
                "clothing_store": "Tienda de ropa",
                "convenience_store": "Tienda de conveniencia",
                "department_store": "Tienda por departamentos",
                "discount_store": "Tienda de descuentos",
                "electronics_store": "Tienda de electrónica",
                "food_store": "Tienda de alimentos",
                "furniture_store": "Tienda de muebles",
                "gift_shop": "Tienda de regalos",
                "grocery_store": "Supermercado",
                "hardware_store": "Ferretería",
                "home_goods_store": "Tienda de artículos para el hogar",
                "home_improvement_store": "Tienda de mejoras para el hogar",
                "jewelry_store": "Joyería",
                "liquor_store": "Licorería",
                "market": "Mercado",
                "music_store": "Tienda de música",
                "pet_store": "Tienda de mascotas",
                "optician": "óptica",
                "shoe_store": "Zapatería",
                "shopping_mall": "Centro comercial",
                "sporting_goods_store": "Tienda de artículos deportivos",
                "store": "Tienda",
                "supermarket": "Supermercado",
                "warehouse_store": "Tienda mayorista",
                "wholesaler": "Mayorista"
            }
        },
        "sports": {
            "label": "Deportes",
            "types": {
                dojo:"Dojo",
                water_sports:"Deportes de agua",
                surf_school:"Escuela de surf",
                "arena": "Estadio cubierto",
                "athletic_field": "Campo deportivo",
                "fishing_charter": "Excursión de pesca",
                "fishing_pond": "Estanque de pesca",
                "fitness_center": "Centro de acondicionamiento físico",
                "golf_course": "Campo de golf",
                "gym": "Gimnasio",
                "ice_skating_rink": "Pista de patinaje sobre hielo",
                "playground": "Área de juegos",
                "ski_resort": "Estación de esquí",
                "sports_activity_location": "Lugar de actividad deportiva",
                "sports_club": "Club deportivo",
                "sports_coaching": "Entrenamiento deportivo",
                "sports_complex": "Complejo deportivo",
                "stadium": "Estadio",
                "swimming_pool": "Piscina"
            }
        },
        "transportation": {
            "label": "Transporte",
            "types": {
                "airport": "Aeropuerto",
                "airstrip": "Pista de aterrizaje",
                "bus_station": "Estación de autobuses",
                "bus_stop": "Parada de autobús",
                "ferry_terminal": "Terminal de ferry",
                "heliport": "Helipuerto",
                "international_airport": "Aeropuerto internacional",
                "light_rail_station": "Estación de tren ligero",
                "park_and_ride": "Estacionamiento con transporte",
                "subway_station": "Estación de metro",
                "taxi_stand": "Parada de taxis",
                "train_station": "Estación de tren",
                "transit_depot": "Depósito de transporte",
                "transit_station": "Estación de transporte",
                "truck_stop": "Parada de camiones"
            }
        }
    }
}
