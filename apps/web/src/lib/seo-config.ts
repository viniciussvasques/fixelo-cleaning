// SEO Configuration for Fixelo
// Cities and services data for SEO pages

export const SEO_CONFIG = {
    siteName: 'Fixelo',
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app',
    defaultDescription: 'Professional home cleaning services in Orlando, FL. Book vetted, insured cleaners in minutes.',
    phone: '(407) 555-0123',
    email: 'hello@fixelo.app',
};

export interface CityData {
    slug: string;
    name: string;
    state: string;
    stateCode: string;
    description: string;
    neighborhoods: string[];
    zipCodes: string[];
    metaTitle: string;
    metaDescription: string;
}

export const CITIES: CityData[] = [
    {
        slug: 'orlando',
        name: 'Orlando',
        state: 'Florida',
        stateCode: 'FL',
        description: 'Orlando is the heart of Central Florida, known for its world-famous theme parks and vibrant communities. Our professional cleaning services help Orlando residents maintain spotless homes while enjoying everything the city has to offer.',
        neighborhoods: [
            'Downtown Orlando',
            'Lake Nona',
            'Winter Park',
            'Dr. Phillips',
            'Baldwin Park',
            'College Park',
            'Thornton Park',
            'Milk District',
            'SoDo',
            'Colonialtown',
        ],
        zipCodes: ['32801', '32803', '32804', '32806', '32807', '32808', '32809', '32810', '32811', '32812'],
        metaTitle: 'House Cleaning in Orlando, FL | Professional Cleaning Services | Fixelo',
        metaDescription: 'Professional house cleaning services in Orlando, FL. Vetted & insured cleaners, transparent pricing, easy online booking. Standard, Deep & Move cleaning from $109.',
    },
    {
        slug: 'kissimmee',
        name: 'Kissimmee',
        state: 'Florida',
        stateCode: 'FL',
        description: 'Kissimmee is a growing city in Osceola County, popular for vacation rentals and family-friendly communities. Our cleaning services are perfect for both residents and Airbnb hosts in the area.',
        neighborhoods: [
            'Downtown Kissimmee',
            'Celebration',
            'Poinciana',
            'St. Cloud',
            'Harmony',
            'Champions Gate',
            'Reunion',
        ],
        zipCodes: ['34741', '34742', '34743', '34744', '34745', '34746', '34747', '34758'],
        metaTitle: 'House Cleaning in Kissimmee, FL | Professional Cleaning Services | Fixelo',
        metaDescription: 'Professional house cleaning in Kissimmee, FL. Perfect for homes & vacation rentals. Vetted cleaners, easy booking, transparent pricing. Book online today!',
    },
    {
        slug: 'winter-park',
        name: 'Winter Park',
        state: 'Florida',
        stateCode: 'FL',
        description: 'Winter Park is an upscale suburb of Orlando known for its beautiful parks, historic architecture, and charming downtown area. Our premium cleaning services match the sophisticated lifestyle of Winter Park residents.',
        neighborhoods: [
            'Park Avenue',
            'Hannibal Square',
            'College Quarter',
            'Via Tuscany',
            'Baldwin Park',
            'Maitland',
        ],
        zipCodes: ['32789', '32790', '32792', '32793'],
        metaTitle: 'House Cleaning in Winter Park, FL | Premium Cleaning Services | Fixelo',
        metaDescription: 'Premium house cleaning services in Winter Park, FL. Professional, vetted cleaners for your beautiful home. Easy online booking. Standard & Deep cleaning available.',
    },
    {
        slug: 'lake-nona',
        name: 'Lake Nona',
        state: 'Florida',
        stateCode: 'FL',
        description: 'Lake Nona is one of Orlando\'s fastest-growing and most innovative communities. Our modern cleaning services are designed for busy professionals and families in this thriving neighborhood.',
        neighborhoods: [
            'Lake Nona Town Center',
            'Laureate Park',
            'Randal Park',
            'Village Walk',
            'Eagle Creek',
            'Storey Park',
        ],
        zipCodes: ['32827', '32832'],
        metaTitle: 'House Cleaning in Lake Nona, FL | Professional Cleaning Services | Fixelo',
        metaDescription: 'Professional house cleaning in Lake Nona, Orlando FL. Fast online booking, vetted cleaners, transparent pricing. Standard, Deep & Move cleaning services.',
    },
];

export interface ServicePageData {
    slug: string;
    name: string;
    shortName: string;
    description: string;
    benefits: string[];
    includes: string[];
    idealFor: string[];
    priceNote: string;
}

export const SERVICES: ServicePageData[] = [
    {
        slug: 'house-cleaning',
        name: 'House Cleaning',
        shortName: 'Standard',
        description: 'Our standard house cleaning service covers all the essentials to keep your home fresh and tidy. Perfect for regular maintenance cleaning.',
        benefits: [
            'All rooms vacuumed and mopped',
            'Bathrooms sanitized and scrubbed',
            'Kitchen cleaned and disinfected',
            'Dusting of all surfaces',
            'Trash removal',
        ],
        includes: [
            'Living areas cleaning',
            'Bedroom cleaning',
            'Bathroom sanitization',
            'Kitchen cleaning',
            'Floor care',
        ],
        idealFor: ['Weekly or bi-weekly maintenance', 'Busy professionals', 'Families with kids'],
        priceNote: 'Starting at $109',
    },
    {
        slug: 'deep-cleaning',
        name: 'Deep Cleaning',
        shortName: 'Deep',
        description: 'Our deep cleaning service goes beyond the surface to tackle built-up dirt, grime, and those often-neglected areas. Perfect for seasonal cleaning or first-time customers.',
        benefits: [
            'Everything in Standard cleaning',
            'Inside appliances (oven, microwave, fridge)',
            'Inside cabinets and drawers',
            'Baseboards and door frames',
            'Light fixtures and ceiling fans',
            'Window sills and blinds',
        ],
        includes: [
            'Complete Standard cleaning',
            'Appliance interior cleaning',
            'Cabinet cleaning',
            'Baseboard cleaning',
            'Detailed scrubbing',
        ],
        idealFor: ['Spring cleaning', 'Before hosting guests', 'First-time service', 'Post-renovation'],
        priceNote: 'Starting at $169',
    },
    {
        slug: 'move-out-cleaning',
        name: 'Move-Out Cleaning',
        shortName: 'Move',
        description: 'Our move-in/move-out cleaning ensures every corner is spotless. Get your deposit back or start fresh in your new home with our comprehensive cleaning service.',
        benefits: [
            'Deep clean of entire property',
            'Inside all closets and cabinets',
            'Appliance deep cleaning',
            'Full bathroom sanitization',
            'Window cleaning',
            'Garage sweep (if applicable)',
        ],
        includes: [
            'Complete property cleaning',
            'Closet and cabinet interiors',
            'Appliance cleaning',
            'Window cleaning',
            'Final walkthrough ready',
        ],
        idealFor: ['Moving out', 'Moving in', 'End of lease', 'New home preparation'],
        priceNote: 'Starting at $129',
    },
    {
        slug: 'apartment-cleaning',
        name: 'Apartment Cleaning',
        shortName: 'Apartment',
        description: 'Professional apartment cleaning tailored for smaller spaces. We understand the unique needs of apartment living and deliver exceptional results.',
        benefits: [
            'Efficient cleaning for smaller spaces',
            'Same quality as house cleaning',
            'Flexible scheduling',
            'Building-friendly service',
        ],
        includes: [
            'All rooms cleaned',
            'Kitchen and bath sanitized',
            'Floors vacuumed and mopped',
            'Surfaces dusted',
        ],
        idealFor: ['Apartment residents', 'Condo owners', 'Studio apartments', 'Loft spaces'],
        priceNote: 'Starting at $89',
    },
    {
        slug: 'airbnb-cleaning',
        name: 'Airbnb & Vacation Rental Cleaning',
        shortName: 'Airbnb',
        description: 'Quick turnovers and 5-star cleanliness for your vacation rental. We help hosts maintain high ratings with professional, hotel-quality cleaning.',
        benefits: [
            'Quick turnover between guests',
            'Hotel-quality cleaning standards',
            'Fresh linens setup (optional)',
            'Restocking essentials',
            'Photo-ready presentation',
        ],
        includes: [
            'Complete property cleaning',
            'Linen change',
            'Amenity restocking',
            'Quality checklist',
            'Same-day availability',
        ],
        idealFor: ['Airbnb hosts', 'VRBO hosts', 'Vacation rental owners', 'Property managers'],
        priceNote: 'Starting at $99',
    },
];

export const FAQ_GENERAL = [
    {
        question: 'How much does house cleaning cost?',
        answer: 'Our house cleaning services start at $109 for Standard cleaning. The final price depends on the size of your home, number of bedrooms and bathrooms, and any add-on services you choose. You can get an instant quote on our website.',
    },
    {
        question: 'Are your cleaners insured and background-checked?',
        answer: 'Yes! All Fixelo cleaners are fully vetted with background checks, identity verification, and proof of insurance. Your safety and peace of mind are our top priorities.',
    },
    {
        question: 'What cleaning supplies do I need to provide?',
        answer: 'Nothing! Our professional cleaners bring all necessary supplies and equipment. If you prefer we use specific products (eco-friendly, etc.), just let us know when booking.',
    },
    {
        question: 'How do I book a cleaning?',
        answer: 'Booking is easy! Just visit fixelo.app, select your service type, enter your home details, pick a date and time, and complete your booking. The whole process takes about 2 minutes.',
    },
    {
        question: 'Can I reschedule or cancel my booking?',
        answer: 'Yes, you can reschedule or cancel your booking up to 24 hours before your scheduled cleaning with no penalty. Changes can be made through your dashboard or by contacting support.',
    },
    {
        question: 'What is your satisfaction guarantee?',
        answer: 'We stand behind our work! If you\'re not completely satisfied with your cleaning, contact us within 24 hours and we\'ll send someone back to re-clean the areas of concern at no extra charge.',
    },
];

export function getCityBySlug(slug: string): CityData | undefined {
    return CITIES.find(city => city.slug === slug);
}

export function getServiceBySlug(slug: string): ServicePageData | undefined {
    return SERVICES.find(service => service.slug === slug);
}

// Generate all city page paths for static generation
export function getAllCityPaths() {
    return CITIES.map(city => ({
        city: city.slug,
    }));
}

// Generate all service+city paths
export function getAllServiceCityPaths() {
    const paths: { service: string; city: string }[] = [];

    SERVICES.forEach(service => {
        CITIES.forEach(city => {
            paths.push({
                service: service.slug,
                city: city.slug,
            });
        });
    });

    return paths;
}
