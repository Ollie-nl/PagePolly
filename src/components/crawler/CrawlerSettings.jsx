// src/components/crawler/CrawlerSettings.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { setCrawlerSettings } from '../../store/slices/crawlerSlice';
import Tooltip from '../common/Tooltip';
import { crawlerSettingsSchema } from '../../utils/validationSchemas';

const CrawlerSettings = ({ vendorId, onSettingsSaved }) => {
  const dispatch = useDispatch();
  const { settings, isLoading } = useSelector((state) => state.crawler);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(crawlerSettingsSchema),
    defaultValues: {
      maxPages: 100,
      crawlDelay: 2000,
      startUrls: '',
      allowedDomains: '',
      excludePatterns: ''
    }
  });

  useEffect(() => {
    if (settings) {
      reset({
        maxPages: settings.max_pages,
        crawlDelay: settings.crawl_delay,
        startUrls: settings.start_urls.join('\n'),
        allowedDomains: settings.allowed_domains.join('\n'),
        excludePatterns: settings.exclude_patterns.join('\n')
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      const formattedData = {
        vendor_id: vendorId,
        max_pages: parseInt(data.maxPages),
        crawl_delay: parseInt(data.crawlDelay),
        start_urls: data.startUrls.split('\n').filter(url => url.trim()),
        allowed_domains: data.allowedDomains.split('\n').filter(domain => domain.trim()),
        exclude_patterns: data.excludePatterns.split('\n').filter(pattern => pattern.trim())
      };

      await dispatch(setCrawlerSettings(formattedData)).unwrap();
      toast.success('Crawler settings saved successfully');
      if (onSettingsSaved) onSettingsSaved(formattedData);
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Crawler Settings</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Max Pages</label>
            <Tooltip content="Maximum number of pages to crawl per session" />
          </div>
          <input
            type="number"
            {...register('maxPages')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.maxPages ? 'border-red-300' : 'border-gray-300'
            }`}
            min={1}
          />
          {errors.maxPages && (
            <p className="mt-1 text-sm text-red-600">{errors.maxPages.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Crawl Delay (ms)</label>
            <Tooltip content="Time to wait between requests in milliseconds" />
          </div>
          <input
            type="number"
            {...register('crawlDelay')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.crawlDelay ? 'border-red-300' : 'border-gray-300'
            }`}
            min={500}
          />
          {errors.crawlDelay && (
            <p className="mt-1 text-sm text-red-600">{errors.crawlDelay.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Start URLs</label>
            <Tooltip content="Enter URLs to start crawling from (one per line)" />
          </div>
          <textarea
            {...register('startUrls')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.startUrls ? 'border-red-300' : 'border-gray-300'
            } min-h-[120px] p-3`}
            rows={5}
            placeholder="https://example.com&#10;https://example.com/page"
          />
          {errors.startUrls && (
            <p className="mt-1 text-sm text-red-600">{errors.startUrls.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Allowed Domains</label>
            <Tooltip content="Domains to restrict crawling to (one per line)" />
          </div>
          <textarea
            {...register('allowedDomains')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.allowedDomains ? 'border-red-300' : 'border-gray-300'
            } min-h-[120px] p-3`}
            rows={5}
            placeholder="example.com&#10;sub.example.com"
          />
          {errors.allowedDomains && (
            <p className="mt-1 text-sm text-red-600">{errors.allowedDomains.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Exclude Patterns</label>
            <Tooltip content="URL patterns to exclude from crawling (one per line)" />
          </div>
          <textarea
            {...register('excludePatterns')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.excludePatterns ? 'border-red-300' : 'border-gray-300'
            } min-h-[120px] p-3`}
            rows={5}
            placeholder="/login&#10;/admin&#10;*.pdf"
          />
          {errors.excludePatterns && (
            <p className="mt-1 text-sm text-red-600">{errors.excludePatterns.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default CrawlerSettings;