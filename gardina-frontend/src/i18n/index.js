import kz from './locales/kz';
import ru from './locales/ru';

export const messages = { kz, ru };

export function getByPath(obj, path) {
  return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), obj);
}
