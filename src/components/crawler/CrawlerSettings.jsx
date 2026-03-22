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
    <div className="card">
      <div className="card-header">
        <h2 className="h3">Crawler Settings</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <div className="flex items-center gap-xs mb-xs">
              <label className="form-label" style={{ marginBottom: 0 }}>Max Pages</label>
              <Tooltip content="Maximum number of pages to crawl per session" />
            </div>
            <input
              type="number"
              {...register('maxPages')}
              className={`input${errors.maxPages ? ' error' : ''}`}
              min={1}
            />
            {errors.maxPages && (
              <p className="form-error">{errors.maxPages.message}</p>
            )}
          </div>

          <div className="form-group">
            <div className="flex items-center gap-xs mb-xs">
              <label className="form-label" style={{ marginBottom: 0 }}>Crawl Delay (ms)</label>
              <Tooltip content="Time to wait between requests in milliseconds" />
            </div>
            <input
              type="number"
              {...register('crawlDelay')}
              className={`input${errors.crawlDelay ? ' error' : ''}`}
              min={500}
            />
            {errors.crawlDelay && (
              <p className="form-error">{errors.crawlDelay.message}</p>
            )}
          </div>

          <div className="form-group">
            <div className="flex items-center gap-xs mb-xs">
              <label className="form-label" style={{ marginBottom: 0 }}>Start URLs</label>
              <Tooltip content="Enter URLs to start crawling from (one per line)" />
            </div>
            <textarea
              {...register('startUrls')}
              className={`textarea${errors.startUrls ? ' error' : ''}`}
              rows={5}
              placeholder={"https://example.com\nhttps://example.com/page"}
            />
            {errors.startUrls && (
              <p className="form-error">{errors.startUrls.message}</p>
            )}
          </div>

          <div className="form-group">
            <div className="flex items-center gap-xs mb-xs">
              <label className="form-label" style={{ marginBottom: 0 }}>Allowed Domains</label>
              <Tooltip content="Domains to restrict crawling to (one per line)" />
            </div>
            <textarea
              {...register('allowedDomains')}
              className={`textarea${errors.allowedDomains ? ' error' : ''}`}
              rows={5}
              placeholder={"example.com\nsub.example.com"}
            />
            {errors.allowedDomains && (
              <p className="form-error">{errors.allowedDomains.message}</p>
            )}
          </div>

          <div className="form-group">
            <div className="flex items-center gap-xs mb-xs">
              <label className="form-label" style={{ marginBottom: 0 }}>Exclude Patterns</label>
              <Tooltip content="URL patterns to exclude from crawling (one per line)" />
            </div>
            <textarea
              {...register('excludePatterns')}
              className={`textarea${errors.excludePatterns ? ' error' : ''}`}
              rows={5}
              placeholder={"/login\n/admin\n*.pdf"}
            />
            {errors.excludePatterns && (
              <p className="form-error">{errors.excludePatterns.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="btn btn-primary btn-full mt-md"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CrawlerSettings;
