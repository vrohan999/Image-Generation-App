import { useState, useEffect } from 'react';

const SUGGESTIONS = [
  "A neon-lit cyberpunk city in heavy rain, hyperrealistic",
  "A tiny astronaut floating inside a cup of hot coffee",
  "A majestic lion made entirely of glowing blue water",
  "Retro wave sports car driving into a synthetic sunset"
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (generatedImage) {
        URL.revokeObjectURL(generatedImage);
      }
    };
  }, [generatedImage]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);

    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token) {
      setError('Configuration Error: API Token is missing. Please check your environment variables.');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API token. Please verify your Hugging Face API key.');
        }
        if (response.status === 503) {
          throw new Error('The model is currently loading... Please wait a few moments and try again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate image (Status ${response.status})`);
      }

      const blob = await response.blob();
      
      if (!blob.type.startsWith('image/')) {
        throw new Error('The API did not return a valid image format.');
      }

      const imageUrl = URL.createObjectURL(blob);
      
      setGeneratedImage(imageUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating the image.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>ImagineStudio</h1>
        <p>Transform your imagination into stunning visual reality</p>
      </header>

      <div className="generator-box">
        <form className="input-wrapper" onSubmit={handleGenerate}>
          <input
            type="text"
            className="prompt-input"
            placeholder="A futuristic cyberpunk city at sunset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
          <button 
            type="submit" 
            className="generate-btn"
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                Generate Art
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="suggestions-bar">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="suggestion-pill"
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {isGenerating ? (
          <div className="image-display empty-state-container">
            <div className="loader-container">
              <div className="loader-pulse"></div>
              <span className="loading-text" style={{fontWeight: 500}}>Crafting your masterpiece...</span>
            </div>
          </div>
        ) : generatedImage ? (
          <div className="image-display loaded">
             <img src={generatedImage} alt="Generated artwork" className="generated-image" />
          </div>
        ) : (
          <div className="image-display empty-state-container">
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>Your creation will appear here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
