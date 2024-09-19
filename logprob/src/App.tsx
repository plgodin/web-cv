import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [userMessage, setUserMessage] = useState('');
  const [llmResponse, setLlmResponse] = useState<Array<{
    token: string;
    logprob: number;
    top_logprobs: Array<{ token: string; logprob: number }>;
  }>>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.openai.com');
  const [perplexity, setPerplexity] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    const savedApiBaseUrl = localStorage.getItem('openai_api_base_url');
    if (savedApiBaseUrl) {
      setApiBaseUrl(savedApiBaseUrl);
    }
  }, []);

  const saveApiKey = () => {
    const newApiKey = prompt('Enter your OpenAI API key:');
    if (newApiKey) {
      setApiKey(newApiKey);
      localStorage.setItem('openai_api_key', newApiKey);
    }
  };

  const saveApiBaseUrl = () => {
    const newApiBaseUrl = prompt('Enter your OpenAI API base URL (e.g. https://api.openai.com):', apiBaseUrl);
    if (newApiBaseUrl) {
      const sanitizedUrl = newApiBaseUrl.endsWith('/') ? newApiBaseUrl.slice(0, -1) : newApiBaseUrl;
      setApiBaseUrl(sanitizedUrl);
      localStorage.setItem('openai_api_base_url', sanitizedUrl);
    }
  };

  const calculatePerplexity = (logprobs: number[]): number => {
    const avgNegativeLogProb = logprobs.reduce((sum, logprob) => sum - logprob, 0) / logprobs.length;
    return Math.exp(avgNegativeLogProb);
  };

  const sendMessage = async () => {
    if (input.trim() !== '' && apiKey) {
      setUserMessage(input);
      setIsLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: input }],
            max_tokens: 500,
            temperature: 0,
            logprobs: true,
            top_logprobs: 5,
          }),
        });

        const data = await response.json();
        const contentLogprobs = data.choices[0].logprobs.content;

        const formattedResponse = contentLogprobs.map((item: {
          token: string;
          logprob: number;
          top_logprobs: Array<{ token: string; logprob: number }>;
        }) => ({
          token: item.token,
          logprob: item.logprob,
          top_logprobs: item.top_logprobs,
        }));

        setLlmResponse(formattedResponse);
        const logprobs = formattedResponse.map((item: { logprob: number }) => item.logprob);
        const calculatedPerplexity = calculatePerplexity(logprobs);
        setPerplexity(calculatedPerplexity);
      } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        setLlmResponse([{ token: 'Error fetching response.', logprob: -0, top_logprobs: [] }]);
        setPerplexity(null);
      } finally {
        setIsLoading(false);
      }
      setInput('');
    }
  };

  const getColor = (logprob: number, scaleFactor: number = 1) => {
    // Clamp logprob between -scaleFactor and 0
    const clampedLogprob = Math.max(-scaleFactor, Math.min(0, logprob));
    
    // Normalize the value to a 0-1 range
    const normalizedValue = (clampedLogprob + scaleFactor) / scaleFactor;
    
    // Calculate RGB values for a yellow to blue gradient (deuteranopia-friendly)
    const blue = Math.round(255 * normalizedValue);
    const red = Math.round(255 * (1 - normalizedValue));
    const green = Math.round(255 * (1 - normalizedValue));
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  const TokenWithTooltip = ({ item }: { item: { token: string; logprob: number; top_logprobs: Array<{ token: string; logprob: number }> } }) => (
    <span
      className="relative group"
      style={{ color: getColor(item.logprob), fontWeight: 'bold' }}
    >
      {item.token}
      <div className="absolute z-10 invisible group-hover:visible bg-white text-black p-2 rounded shadow-lg whitespace-nowrap border border-gray-300">
        Top 5 alternatives:
        <ul>
          {item.top_logprobs.map((alt, index) => (
            <li key={index} style={{ color: getColor(alt.logprob, 10) }}>
              {alt.token}: {alt.logprob.toFixed(4)}
            </li>
          ))}
        </ul>
      </div>
    </span>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-3xl p-4 bg-white shadow-md rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">Logprob Viewer</h1>
          <div className="flex space-x-2">
            <button
              onClick={saveApiBaseUrl}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              title="Set API Base URL"
            >
              🖥️
            </button>
            <button
              onClick={saveApiKey}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              title="Enter API Key"
            >
              🔑
            </button>
          </div>
        </div>
        <div className="messages mb-4">
          <div className="bg-blue-100 p-2 mb-2 rounded">
            <span>{userMessage}</span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              llmResponse.map((item, index) => (
                <TokenWithTooltip key={index} item={item} />
              ))
            )}
          </div>
          {perplexity !== null && (
            <div className="mt-2 text-sm text-gray-600">
              Perplexity: {perplexity.toFixed(2)}
            </div>
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          className="w-full p-3 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={sendMessage} 
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
