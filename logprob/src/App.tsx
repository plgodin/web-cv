import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [userMessage, setUserMessage] = useState('');
  const [llmResponse, setLlmResponse] = useState<Array<{ token: string; logprob: number }>>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    const newApiKey = prompt('Enter your OpenAI API key:');
    if (newApiKey) {
      setApiKey(newApiKey);
      localStorage.setItem('openai_api_key', newApiKey);
    }
  };

  const sendMessage = async () => {
    if (input.trim() !== '' && apiKey) {
      setUserMessage(input);
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          }),
        });

        const data = await response.json();
        console.log(data);
        const contentLogprobs = data.choices[0].logprobs.content;

        const formattedResponse = contentLogprobs.map((item: {
          token: string;
          logprob: number;
        }) => ({
          token: item.token,
          logprob: item.logprob,
        }));

        setLlmResponse(formattedResponse);
      } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        setLlmResponse([{ token: 'Error fetching response.', logprob: -Infinity }]);
      }
      setInput('');
    }
  };

  const getColor = (logprob: number) => {
    // Clamp logprob between -1 and 0
    const clampedLogprob = Math.max(-1, Math.min(0, logprob));
    
    // Normalize the value to a 0-1 range
    const normalizedValue = 1 + clampedLogprob;
    
    // Calculate RGB values for a yellow to blue gradient (deuteranopia-friendly)
    const blue = Math.round(255 * normalizedValue);
    const red = Math.round(255 * (1 - normalizedValue));
    const green = Math.round(255 * (1 - normalizedValue));
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4 bg-white shadow-md rounded-md">
        <div className="flex justify-end mb-2">
          <button
            onClick={saveApiKey}
            className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            title="Enter API Key"
          >
            🔑
          </button>
        </div>
        <div className="messages mb-4">
          <div className="bg-blue-100 p-2 mb-2 rounded">
            <span>{userMessage}</span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            {llmResponse.map((item, index) => (
              <span key={index} style={{ color: getColor(item.logprob), fontWeight: 'bold' }}>
                {item.token}
              </span>
            ))}
          </div>
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
