import home from './home.json';
import contact from './contact.json';
import map from './map.json';
import places from './places.json';
import countries from './countries.json';
import common from './common.json';
import lessons from './lessons.json';

const messages = {
    // Spread common keys at root level (menu, footer, subscribe, etc.)
    ...common,
    // Standard modules under their key
    home,
    contact,
    map,
    // Places module - also keep 'venues' key for backward compatibility
    places,
    venues: {
        ...places,
        form: places.form
    },
    // Countries module - also keep 'merchants' key for backward compatibility
    countries,
    merchants: countries,
    // Lessons under their own key
    lessons
};

export default messages;
