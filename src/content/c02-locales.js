/* AutoForm Fill — locale datasets (fictional/realistic data per region) */
(() => {
  'use strict';

  const AFF = globalThis.AFF_CONTENT_UTILS;

  const LOCALE_DATA = {
    'en-US': {
      firstNames: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Daniel',
        'Matthew', 'Andrew', 'Joshua', 'Kevin', 'Brian', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
        'Sarah', 'Jessica', 'Karen', 'Emily', 'Ashley', 'Amanda', 'Melissa', 'Rachel', 'Laura', 'Hannah'],
      lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Clark', 'Lewis'],
      streets: ['Main Street', 'Oak Avenue', 'Maple Drive', 'Cedar Lane', 'Washington Boulevard', 'Park Road',
        'Elm Street', 'Lakeview Drive', 'Hillcrest Avenue', 'Sunset Boulevard', 'River Road', 'Broadway',
        'Second Avenue', 'Willow Lane', 'Pine Street'],
      cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
        'Dallas', 'Austin', 'Seattle', 'Denver', 'Boston', 'Miami', 'Portland'],
      states: ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Washington', 'Colorado', 'Massachusetts', 'Oregon', 'Georgia'],
      zip: () => String(AFF.randInt(10001, 99899)),
      phoneLocal: () => `(212) 555-01${AFF.pad(AFF.randInt(0, 99), 2)}`,
      phoneIntl: () => `+1 212 555 01${AFF.pad(AFF.randInt(0, 99), 2)}`,
      companyBase: ['Vertex', 'BluePeak', 'Summit', 'Northstar', 'Clearwater', 'Ironclad', 'Silverline', 'Redwood', 'Pinnacle', 'Evergreen'],
      companySuffix: ['Inc', 'LLC', 'Corp', 'Group', 'Systems', 'Technologies', 'Solutions', 'Labs'],
      tlds: ['com', 'net', 'org', 'io'],
      country: 'United States',
      emailDomains: ['example.com', 'mail.com', 'demo.net', 'test.org']
    },
    'en-GB': {
      firstNames: ['Oliver', 'George', 'Harry', 'Jack', 'Noah', 'Charlie', 'Thomas', 'Oscar', 'William', 'James',
        'Charlotte', 'Amelia', 'Isla', 'Emily', 'Sophie', 'Olivia', 'Ava', 'Grace', 'Lily', 'Freya'],
      lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright',
        'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Wood', 'Clarke', 'Patel'],
      streets: ['High Street', 'Station Road', 'Church Lane', 'Victoria Road', 'Park Avenue', 'Green Lane',
        'Manor Road', 'George Street', 'Station Approach', 'Queen Street', 'Mill Lane', 'King Street'],
      cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield',
        'Edinburgh', 'Cardiff', 'Newcastle', 'Nottingham'],
      states: ['Greater London', 'Lancashire', 'Yorkshire', 'Kent', 'Essex', 'Surrey', 'Hampshire', 'Oxfordshire'],
      zip: () => `${AFF.rand(['SW', 'NW', 'EC', 'SE', 'N', 'E'])}${AFF.randInt(1, 20)} ${AFF.randInt(1, 9)}${AFF.rand(['AA', 'BB', 'CD', 'FG', 'HL'])}`,
      phoneLocal: () => `07700 900${AFF.pad(AFF.randInt(0, 999), 3)}`,
      phoneIntl: () => `+44 7700 900${AFF.pad(AFF.randInt(0, 999), 3)}`,
      companyBase: ['Harrow', 'Kingsford', 'Ashbourne', 'Fairview', 'Blackwell', 'Kestrel', 'Harbour', 'Meadowbrook'],
      companySuffix: ['Ltd', 'Group', 'Partners', 'Plc', 'Services', 'Consulting'],
      tlds: ['co.uk', 'com', 'org.uk'],
      country: 'United Kingdom',
      emailDomains: ['example.co.uk', 'mail.com', 'demo.net']
    },
    'en-IN': {
      firstNames: ['Aarav', 'Vivaan', 'Aditya', 'Rohan', 'Arjun', 'Rahul', 'Vikram', 'Amit', 'Sanjay', 'Deepak',
        'Priya', 'Ananya', 'Diya', 'Sneha', 'Kavya', 'Neha', 'Pooja', 'Ritu', 'Meera', 'Kavita'],
      lastNames: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Rao', 'Mehta', 'Shah',
        'Joshi', 'Verma', 'Das', 'Iyer', 'Chatterjee', 'Malhotra', 'Kapoor', 'Bhatt'],
      streets: ['MG Road', 'Park Street', 'Station Road', 'Gandhi Nagar', 'Nehru Place', 'Civil Lines',
        'Ring Road', 'Market Road', 'Hill Road', 'Lake View Road'],
      cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Indore'],
      states: ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala', 'Uttar Pradesh'],
      zip: () => String(AFF.randInt(110001, 799999)),
      phoneLocal: () => `0${AFF.rand([9, 8, 7, 6])}${AFF.randInt(100000000, 999999999)}`,
      phoneIntl: () => `+91 ${AFF.rand([9, 8, 7, 6])}${AFF.randInt(100000000, 999999999)}`,
      companyBase: ['Shakti', 'Bharat', 'Sagar', 'Triton', 'Marigold', 'Emerald', 'Zenith', 'Lotus'],
      companySuffix: ['Pvt Ltd', 'Industries', 'Technologies', 'Enterprises', 'Traders'],
      tlds: ['com', 'in', 'co.in'],
      country: 'India',
      emailDomains: ['example.in', 'mail.com', 'demo.net']
    },
    'bn-BD': {
      firstNames: ['Rahim', 'Karim', 'Jamal', 'Kamal', 'Shamim', 'Rafiq', 'Nazmul', 'Faruk', 'Imran', 'Sajid',
        'Ayesha', 'Sharmin', 'Farhana', 'Nusrat', 'Jannat', 'Salma', 'Rumana', 'Tania', 'Sumaiya', 'Mahmuda'],
      lastNames: ['Uddin', 'Ahmed', 'Islam', 'Hossain', 'Rahman', 'Chowdhury', 'Miah', 'Sarkar', 'Talukder', 'Biswas', 'Alam', 'Haque'],
      streets: ['Mirpur Road', 'Dhanmondi 27', 'Banani 11', 'Gulshan 2', 'Uttara Sector 4', 'Chawk Bazar',
        'Agrabad', 'Zindabazar', 'New Market Road', 'Green Road'],
      cities: ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh', 'Cumilla', 'Gazipur'],
      states: ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh'],
      zip: () => String(AFF.randInt(1200, 9999)),
      phoneLocal: () => `01${AFF.rand([3, 4, 5, 6, 7, 8, 9])}${AFF.randInt(10000000, 99999999)}`,
      phoneIntl: () => `+8801${AFF.rand([3, 4, 5, 6, 7, 8, 9])}${AFF.randInt(10000000, 99999999)}`,
      companyBase: ['Dhaka Soft', 'Bangla Tech', 'Padma Group', 'Jamdani IT', 'Sundarban Logistics', 'Meghna Systems'],
      companySuffix: ['Ltd', 'Solutions', 'Group'],
      tlds: ['com', 'com.bd', 'net'],
      country: 'Bangladesh',
      emailDomains: ['mail.com', 'example.com', 'bdmail.com', 'demo.net']
    },
    'de-DE': {
      firstNames: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Leon', 'Paul', 'Niklas', 'Tim', 'David', 'Simon',
        'Anna', 'Lena', 'Julia', 'Sophie', 'Marie', 'Emma', 'Hannah', 'Sarah', 'Laura', 'Lea'],
      lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
        'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Braun'],
      streets: ['Hauptstraße', 'Bahnhofstraße', 'Gartenstraße', 'Lindenstraße', 'Kirchstraße', 'Bergstraße',
        'Schulstraße', 'Waldstraße', 'Mozartstraße', 'Rheinstraße'],
      cities: ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Hannover'],
      states: ['Bayern', 'Berlin', 'Hamburg', 'Hessen', 'Sachsen', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Niedersachsen'],
      zip: () => String(AFF.randInt(10000, 99999)),
      phoneLocal: () => `0151 2${AFF.randInt(1000000, 9999999)}`,
      phoneIntl: () => `+49 151 2${AFF.randInt(1000000, 9999999)}`,
      companyBase: ['Nordwind', 'Bergmann', 'Rheinwerk', 'Stern', 'Falke', 'Lindenhof', 'Alpin'],
      companySuffix: ['GmbH', 'AG', 'Group', 'Systeme', 'Lösungen'],
      tlds: ['de', 'com'],
      country: 'Deutschland',
      emailDomains: ['example.de', 'mail.com', 'demo.net']
    },
    'fr-FR': {
      firstNames: ['Lucas', 'Hugo', 'Léo', 'Louis', 'Nathan', 'Gabriel', 'Thomas', 'Jules', 'Mathis', 'Paul',
        'Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Léa', 'Manon', 'Camille', 'Sarah', 'Juliette'],
      lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
        'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux'],
      streets: ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Rue Victor Hugo', 'Boulevard Saint-Michel',
        'Rue de la République', 'Avenue Jean Jaurès', 'Rue Molière', 'Rue Lafayette'],
      cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims'],
      states: ["Île-de-France", 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Nouvelle-Aquitaine', 'Grand Est', 'Hauts-de-France', 'Bretagne'],
      zip: () => String(AFF.randInt(10000, 99999)),
      phoneLocal: () => `06 ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)}`,
      phoneIntl: () => `+33 6 ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)} ${AFF.pad(AFF.randInt(0, 99), 2)}`,
      companyBase: ['Lumière', 'Verlaine', 'Aurore', 'Cascade', 'Bellecour', 'Horizon', 'Étoile'],
      companySuffix: ['SARL', 'SA', 'Group', 'Services', 'Conseil'],
      tlds: ['fr', 'com'],
      country: 'France',
      emailDomains: ['example.fr', 'mail.com', 'demo.net']
    }
  };

  /* Countries offered when a country select has no matching option */
  const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Bangladesh', 'Germany',
    'France', 'Spain', 'Italy', 'Netherlands', 'Brazil', 'Japan', 'Singapore', 'United Arab Emirates',
    'Saudi Arabia', 'Pakistan', 'Malaysia', 'Philippines', 'Indonesia', 'South Africa', 'Mexico', 'Sweden', 'Switzerland'];

  const SENTENCES = [
    'This is sample test data created for form testing.',
    'Customer profile generated automatically for QA purposes.',
    'Order created for demo purposes only — please ignore.',
    'Sample description used while verifying form behaviour.',
    'Placeholder note entered by the AutoForm Fill extension.',
    'Test entry to confirm long text is accepted correctly.'
  ];

  const LOREM_WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');

  function resolveLocale(setting) {
    if (setting && setting !== 'auto' && LOCALE_DATA[setting]) return setting;
    try {
      const langs = [document.documentElement?.lang, navigator.language, ...(navigator.languages || [])].filter(Boolean);
      for (const l of langs) {
        const key = String(l).slice(0, 5);
        if (LOCALE_DATA[key]) return key;
        const base = String(l).slice(0, 2).toLowerCase();
        const map = { en: 'en-US', bn: 'bn-BD', de: 'de-DE', fr: 'fr-FR' };
        if (map[base]) return map[base];
      }
    } catch (e) { /* ignore */ }
    return 'en-US';
  }

  AFF.LOCALE_DATA = LOCALE_DATA;
  AFF.COUNTRIES = COUNTRIES;
  AFF.SENTENCES = SENTENCES;
  AFF.LOREM_WORDS = LOREM_WORDS;
  AFF.resolveLocale = resolveLocale;
})();
