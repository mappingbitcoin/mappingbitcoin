import home from './home.json';
import contact from './contact.json';
import map from './map.json';
import places from './places.json';
import countries from './countries.json';
import categories from './categories.json';
import stats from './stats.json';
import common from './common.json';
import login from './login.json';
import unsubscribe from './unsubscribe.json';
import verifyYourBusiness from './verify-your-business.json';
import admin from './admin.json';

const messages = {
    ...common,
    home,
    contact,
    map,
    login,
    unsubscribe,
    places,
    venues: {
        ...places,
        form: places.form
    },
    countries,
    merchants: countries,
    categories,
    stats,
    "verify-your-business": verifyYourBusiness,
    admin
};

export default messages;
