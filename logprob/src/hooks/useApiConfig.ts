import { useState, useEffect } from 'react';

const useApiConfig = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.openai.com');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) setApiKey(savedApiKey);
    
    const savedApiBaseUrl = localStorage.getItem('openai_api_base_url');
    if (savedApiBaseUrl) setApiBaseUrl(savedApiBaseUrl);
  }, []);

  const saveApiKey = () => {
    const newApiKey = prompt('Enter your OpenAI API key:');
    if (newApiKey) {
      setApiKey(newApiKey);
      localStorage.setItem('openai_api_key', newApiKey);
    }
  };

  const saveApiBaseUrl = () => {
    const newApiBaseUrl = prompt('Enter your OpenAI API base URL:', apiBaseUrl);
    if (newApiBaseUrl) {
      const sanitizedUrl = newApiBaseUrl.endsWith('/') ? newApiBaseUrl.slice(0, -1) : newApiBaseUrl;
      setApiBaseUrl(sanitizedUrl);
      localStorage.setItem('openai_api_base_url', sanitizedUrl);
    }
  };

  return { apiKey, apiBaseUrl, saveApiKey, saveApiBaseUrl };
};

export default useApiConfig;