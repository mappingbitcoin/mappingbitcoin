import {PlaceSubcategory} from "@/constants/PlaceCategories";

export const PLACE_SUBTYPE_ICON: Record<PlaceSubcategory, string> = {
    car_dealer: "car",
    car_rental: "car_rental",
    car_repair: "car_repair",
    car_wash: "car", // no direct match, fallback to general car
    bicycle_rental: "bicycle_rental",
    electric_vehicle_charging_station: "charging_station",
    gas_station: "fuel",
    parking: "parking",
    rest_stop: "highway_rest_area",
    corporate_office: "commercial",
    farm: "farm",
    ranch: "farm", // no "ranch" icon, using "farm" as closest
    coworking_space: "commercial" /* ← no direct match, suggest custom if needed */,

    // Culture
    art_gallery: "art_gallery",
    art_studio: "paint", // best creative/visual match
    auditorium: "theatre",
    cultural_landmark: "landmark",
    historical_place: "historic",
    monument: "monument",
    museum: "museum",
    performing_arts_theater: "theatre",
    sculpture: "sculpture",
    // Education
    library: "library",
    preschool: "school", // closest match, generic
    primary_school: "school",
    school: "school",
    secondary_school: "school",
    university: "college",
    music_school: "music",
    cooking_school: "restaurant", // fallback, no better visual match
    driving_school: "car", // fallback

    // Entertainment & Recreation
    adventure_sports_center: "soccer" /* ← no direct match, custom? */,
    amphitheatre: "theatre",
    amusement_center: "theme_park",
    amusement_park: "theme_park",
    aquarium: "aquarium",
    banquet_hall: "restaurant", // fallback
    barbecue_area: "bbq",
    botanical_garden: "garden",
    bowling_alley: "bowling",
    casino: "casino",
    childrens_camp: "campfire", // fallback symbol of camp life
    comedy_club: "theatre", // best available match
    community_center: "town_hall", // fallback civic building
    concert_hall: "music",
    convention_center: "theatre", // fallback for large venues
    cultural_center: "landmark", // fallback to signify cultural place
    cycling_park: "bicycle", // generic cycling icon
    dance_hall: "music", // fallback for music/dance venues
    dog_park: "dog_park",
    event_venue: "marker", // generic event marker
    ferris_wheel: "theme_park", // best thematic match
    garden: "garden",
    hiking_area: "natural", // fallback for nature/hiking
    historical_landmark: "historic",
    internet_cafe: "mobile_phone" /* ← not available, consider custom */,
    karaoke: "karaoke",
    marina: "harbor",
    movie_rental: "cinema", // closest available
    movie_theater: "cinema",
    national_park: "park",
    night_club: "bar",
    observation_deck: "observation_tower",
    off_roading_area: "truck", // fallback
    opera_house: "theatre",
    park: "park",
    philharmonic_hall: "music",
    picnic_ground: "picnic_site",
    planetarium: "star", // fallback
    plaza: "city",
    // Entertainment & Recreation
    roller_coaster: "theme_park", // fallback, no direct icon
    skateboard_park: "skateboard",
    state_park: "park",
    tourist_attraction: "attraction",
    video_arcade: "gaming",
    visitor_center: "information",
    water_park: "water_park",
    wedding_venue: "heart",
    wildlife_park: "zoo",
    wildlife_refuge: "zoo", // fallback
    zoo: "zoo",

    // Facilities
    public_bath: "hot_spring", // closest available
    public_bathroom: "toilets",
    stable: "horse_riding", // closest thematic match

    // Finance
    accounting: "bank", // fallback
    atm: "atm",
    bank: "bank",
    currency_exchange: "bank", // fallback

    // Food & Drink (start)
    acai_shop: "ice_cream", // closest available visual
    afghani_restaurant: "restaurant", // general fallback
    african_restaurant: "restaurant",
    american_restaurant: "restaurant",
    asian_restaurant: "noodle", // symbolic match
    bagel_shop: "bakery", // fallback
    bakery: "bakery",
    bar: "bar",
    bar_and_grill: "bar", // fallback
    barbecue_restaurant: "bbq",
    brazilian_restaurant: "restaurant", // fallback
    breakfast_restaurant: "cafe", // best symbolic match
    brunch_restaurant: "cafe", // same
    buffet_restaurant: "restaurant", // fallback
    cafe: "cafe",
    cafeteria: "cafe", // fallback
    candy_store: "confectionery",
    cat_cafe: "cafe", // fallback
    chinese_restaurant: "noodle", // closest match
    chocolate_factory: "confectionery", // fallback
    chocolate_shop: "confectionery",
    coffee_shop: "cafe",
    confectionery: "confectionery",
    deli: "convenience", // or use "deli" if added manually
    dessert_restaurant: "ice_cream", // closest symbol
    dessert_shop: "ice_cream",
    diner: "restaurant",
    dog_cafe: "cafe", // fallback
    donut_shop: "bakery", // fallback
    fast_food_restaurant: "fast_food",
    fine_dining_restaurant: "restaurant",
    food_court: "restaurant", // fallback
    french_restaurant: "restaurant",
    greek_restaurant: "restaurant",
    hamburger_restaurant: "fast_food",
    ice_cream_shop: "ice_cream",
    indian_restaurant: "restaurant",
    indonesian_restaurant: "restaurant",
    italian_restaurant: "restaurant",
    japanese_restaurant: "sushi",
    juice_shop: "teahouse", // closest symbolic match
    korean_restaurant: "restaurant",
    // Food & Drink
    lebanese_restaurant: "restaurant",
    meal_delivery: "restaurant", // fallback
    meal_takeaway: "fast_food", // best fit
    mediterranean_restaurant: "restaurant",
    mexican_restaurant: "restaurant",
    middle_eastern_restaurant: "restaurant",
    pizza_restaurant: "pizza",
    pub: "bar",
    ramen_restaurant: "noodle",
    restaurant: "restaurant",
    sandwich_shop: "fast_food", // closest visual
    seafood_restaurant: "seafood",
    spanish_restaurant: "restaurant",
    steak_house: "restaurant",
    sushi_restaurant: "sushi",
    tea_house: "teahouse",
    thai_restaurant: "restaurant",
    turkish_restaurant: "restaurant",
    vegan_restaurant: "restaurant",
    vegetarian_restaurant: "restaurant",
    vietnamese_restaurant: "restaurant",
    wine_bar: "wine",

    // Geographical Areas (no clear visual icons in map set, using best guess or fallback)
    administrative_area_level_1: "town",
    administrative_area_level_2: "town",
    country: "globe",
    locality: "village",
    postal_code: "post",
    school_district: "school",

    // Government
    city_hall: "town_hall",
    courthouse: "town_hall", // fallback
    embassy: "diplomatic",
    fire_station: "fire_station",
    government_office: "town_hall", // general fallback
    local_government_office: "town_hall",
    neighborhood_police_station: "police",
    police: "police",
    post_office: "post",
    // Health & Wellness
    alternative_medicine: "doctors", // fallback
    chiropractor: "doctors", // fallback
    clinic: "doctors",
    dental_clinic: "dentist",
    dentist: "dentist",
    doctor: "doctors",
    drugstore: "pharmacy", // closest visual match
    hospital: "hospital",
    massage: "hairdresser", // fallback
    medical_lab: "doctors", // fallback
    pharmacy: "pharmacy",
    physiotherapist: "doctors", // fallback
    sauna: "hot_spring", // closest symbolic match
    psychotherapist: "doctors", // fallback
    skin_care_clinic: "hairdresser", // fallback
    spa: "hairdresser",
    tanning_studio: "fitness_centre", // fallback
    wellness_center: "hairdresser",
    yoga_studio: "park", // closest peaceful/neutral symbol

    // Housing
    apartment_building: "building",
    apartment_complex: "building",
    condominium_complex: "building",
    housing_complex: "building",

    // Lodging
    bed_and_breakfast: "lodging",
    // Lodging
    budget_japanese_inn: "lodging",
    campground: "campsite",
    camping_cabin: "hut", // closest symbolic structure
    cottage: "hut", // fallback
    extended_stay_hotel: "lodging",
    farmstay: "farm",
    guest_house: "lodging",
    hostel: "lodging",
    hotel: "lodging",
    chalet: "lodging",
    inn: "lodging",
    japanese_inn: "lodging",
    lodging: "lodging",
    mobile_home_park: "camper_trailer",
    motel: "lodging",
    private_guest_room: "lodging",
    resort_hotel: "lodging",
    rv_park: "camper_trailer",

    // Natural Features
    beach: "beach",

    // Places of Worship
    church: "christian",
    hindu_temple: "hinduist",
    mosque: "muslim",
    synagogue: "jewish",
    "3d-printing": "hardware" /* ← no direct match, suggest custom */,
    advertising: "board", // symbolic for signage
    astrologer: "star", // symbolic
    architect: "building", // fallback
    barber_shop: "hairdresser",
    beautician: "hairdresser", // fallback
    beauty_salon: "hairdresser",
    body_art_service: "paint", // fallback
    cleaning: "laundry" ,
    contractor: "construction",
    catering_service: "restaurant", // fallback
    cemetery: "cemetery",
    child_care_agency: "school", // fallback
    consultant: "commercial" /* ← not available, suggest custom */,
    courier_service: "scooter" /* ← no icon, suggest "car" as fallback */,
    electrician: "danger", // symbolic
    florist: "florist",
    food_delivery: "fast_food", // symbolic
    foot_care: "doctors", // fallback
    funeral_home: "cemetery", // closest match
    graphic_design: "paint", // symbolic
    gardener: "garden",
    hair_care: "hairdresser",
    hair_salon: "hairdresser",
    insurance_agency: "bank", // symbolic for service
    laundry: "laundry",
    lawyer: "town_hall", // symbolic fallback
    locksmith: "gate" /* ← not in list, consider custom */,
    makeup_artist: "hairdresser", // fallback
    moving_company: "truck",
    nail_salon: "hairdresser", // fallback
    painter: "paint",
    photographer: "art_gallery",
    plumber: "pipe",
    psychic: "star", // symbolic
    real_estate_agency: "home", // symbolic
    roofing_contractor: "construction", // fallback
    storage: "warehouse",
    summer_camp_organizer: "campfire",
    tailor: "clothing_store", // fallback
    telecommunications_service_provider: "mobile_phone",
    tour_agency: "suitcase",
    tourist_information_center: "information",
    travel_agency: "suitcase",
    veterinary_care: "veterinary",
    beekeeper: "farm" /* ← no icon, suggest custom */,
    carpenter: "hardware" /* ← no icon, suggest custom */,

    // Shopping
    asian_grocery_store: "grocery",
    auto_parts_store: "car_repair", // fallback
    bicycle_store: "bicycle",
    book_store: "library", // closest match
    butcher_shop: "butcher",
    cannabis: "pharmacy",
    cell_phone_store: "mobile_phone",
    clothing_store: "clothing_store",
    craft_store: "paint",
    convenience_store: "convenience",
    copyshop: "hardware",
    department_store: "shop", // fallback
    discount_store: "shop",
    gardening_store: "garden_centre",
    electronics_store: "mobile_phone", // fallback
    food_store: "grocery",
    furniture_store: "furniture",
    gift_shop: "gift",
    second_hand: 'shop',
    // Shopping
    grocery_store: "grocery",
    hardware_store: "hardware",
    home_goods_store: "furniture", // closest match
    home_improvement_store: "hardware",
    jewelry_store: "jewelry",
    liquor_store: "alcohol_shop",
    market: "grocery", // general fallback
    music_store: "music",
    pet_store: "dog_park", // closest available, suggest custom
    optician: "optician",
    tobacco: "pharmacy",
    seafood_shop: "seafood",
    shoe_store: "shoes",
    shopping_mall: "shop",
    sporting_goods_store: "soccer", // fallback, suggest custom
    stationery_store: "shop" /* ← not in icon set, suggest "convenience" or custom */,
    store: "shop",
    supermarket: "grocery",
    warehouse_store: "warehouse",
    wholesaler: "warehouse",

    // Sports
    arena: "stadium",
    athletic_field: "pitch",
    dojo: "stadium",
    fishing_charter: "outdoor" /* ← not in icon set, suggest custom */,
    fishing_pond: "outdoor" /* same */,
    fitness_center: "fitness_centre",
    golf_course: "golf",
    gym: "fitness_centre",
    ice_skating_rink: "snow", // symbolic
    playground: "playground",
    ski_resort: "snow", // fallback
    sports_activity_location: "stadium", // fallback
    sports_club: "stadium", // fallback
    sports_coaching: "stadium", // fallback
    sports_complex: "stadium",
    stadium: "stadium",
    swimming_pool: "swimming_pool",
    water_sports: "swimming", // symbolic
    surf_school: "water", // best match from existing icons

    // Transportation
    airport: "airport",
    airstrip: "airfield",
    bus_station: "bus_stop",
    bus_stop: "bus_stop",
    ferry_terminal: "ferry_terminal",
    heliport: "heliport",
    international_airport: "airport",
    light_rail_station: "light_rail",
    park_and_ride: "parking",
    subway_station: "subway",
    taxi_stand: "taxi",
    train_station: "railway",
    transit_depot: "transit",
    transit_station: "transit",
    truck_stop: "truck"
};
