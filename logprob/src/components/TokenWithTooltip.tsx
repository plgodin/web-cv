import React from 'react';

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

export default TokenWithTooltip;