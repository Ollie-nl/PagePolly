// src/utils/validationSchemas.js
import * as yup from 'yup';

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const domainRegex = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

export const crawlerSettingsSchema = yup.object().shape({
  maxPages: yup
    .number()
    .required('Maximum pages is required')
    .min(1, 'Must crawl at least 1 page')
    .max(1000, 'Cannot exceed 1000 pages per crawl')
    .integer('Must be a whole number'),
    
  crawlDelay: yup
    .number()
    .required('Crawl delay is required')
    .min(500, 'Minimum delay is 500ms')
    .max(10000, 'Maximum delay is 10000ms')
    .integer('Must be a whole number'),
    
  startUrls: yup
    .string()
    .required('At least one start URL is required')
    .test('urls', 'Invalid URL format', function(value) {
      if (!value) return false;
      const urls = value.split('\n').filter(url => url.trim());
      return urls.length > 0 && urls.every(url => urlRegex.test(url.trim()));
    }),
    
  allowedDomains: yup
    .string()
    .test('domains', 'Invalid domain format', function(value) {
      if (!value) return true;
      const domains = value.split('\n').filter(domain => domain.trim());
      return domains.length === 0 || domains.every(domain => domainRegex.test(domain.trim()));
    }),
    
  excludePatterns: yup
    .string()
    .test('patterns', 'Invalid pattern format', function(value) {
      if (!value) return true;
      const patterns = value.split('\n').filter(pattern => pattern.trim());
      return patterns.length === 0 || patterns.every(pattern => pattern.length > 0);
    })
});