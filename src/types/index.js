// src/types/index.js
/**
 * @typedef {Object} Vendor
 * @property {string} id - UUID of the vendor
 * @property {string} name - Name of the vendor
 * @property {string} website_url - URL of the vendor's website
 * @property {string} status - Current status of the vendor
 * @property {string} user_email - Email of the user who created the vendor
 * @property {string} created_at - Timestamp of creation
 * @property {string} updated_at - Timestamp of last update
 */

/**
 * @typedef {Object} CrawlJob
 * @property {string} id - UUID of the crawl job
 * @property {string} vendor_id - UUID of the associated vendor
 * @property {string} status - Current status of the crawl job
 * @property {string} start_time - Timestamp when the job started
 * @property {string} end_time - Timestamp when the job ended
 * @property {number} total_pages - Total number of pages to crawl
 * @property {number} crawled_pages - Number of pages crawled so far
 * @property {string} error_message - Error message if job failed
 * @property {string} user_email - Email of the user who started the job
 * @property {string} created_at - Timestamp of creation
 * @property {string} updated_at - Timestamp of last update
 */

/**
 * @typedef {Object} CrawledPage
 * @property {string} id - UUID of the crawled page
 * @property {string} crawl_job_id - UUID of the associated crawl job
 * @property {string} url - URL of the crawled page
 * @property {string} title - Title of the page
 * @property {Object} content - Structured content of the page
 * @property {Object} meta_data - Metadata of the page
 * @property {string} status - Status of the crawl for this page
 * @property {string} user_email - Email of the user who owns this page
 * @property {string} created_at - Timestamp of creation
 * @property {string} updated_at - Timestamp of last update
 */

/**
 * @typedef {Object} CrawlError
 * @property {string} id - UUID of the error
 * @property {string} crawl_job_id - UUID of the associated crawl job
 * @property {string} page_url - URL where the error occurred
 * @property {string} error_type - Type of error
 * @property {string} error_message - Detailed error message
 * @property {string} user_email - Email of the user who owns this error
 * @property {string} created_at - Timestamp of creation
 */

export {};