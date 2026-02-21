import home from './home.json';
import contact from './contact.json';
import map from './map.json';
import places from './places.json';
import countries from './countries.json';
import categories from './categories.json';
import common from './common.json';
import login from './login.json';
import unsubscribe from './unsubscribe.json';
import verifyYourBusiness from './verify-your-business.json';
import admin from './admin.json';

const messages = {
    // Spread common keys at root level (menu, footer, subscribe, etc.)
    ...common,
    // Standard modules under their key
    home,
    contact,
    map,
    login,
    unsubscribe,
    // Places module - also keep 'venues' key for backward compatibility
    places,
    venues: {
        ...places,
        form: places.form
    },
    // Countries module - also keep 'merchants' key for backward compatibility
    countries,
    merchants: countries,
    // Categories page
    categories,
    "verify-your-business": verifyYourBusiness,
    // Admin panel translations
    admin
};

export default messages;
