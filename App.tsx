import React, { useState, useCallback } from 'react';
import { ScreenshotState, DeviceType } from './types';
import { generatePortfolioContent, isValidUrl } from './services/geminiService';
import { PortfolioResult } from './components/PortfolioResult';

const App: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [state, setState] = useState<ScreenshotState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize URL
    let formattedUrl = urlInput.trim();
    if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
    }

    if (!isValidUrl(formattedUrl)) {
      setState(prev => ({ ...prev, error: "Please enter a valid URL." }));
      return;
    }

    setState({ isLoading: true, error: null, data: null });

    try {
      const encodedUrl = encodeURIComponent(formattedUrl);
      
      // Define API endpoints for Microlink
      // We fetch the JSON first to get the actual CDN URL of the generated image
      const desktopApi = `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&meta=false&viewport.width=1600&viewport.height=1000`;
      const mobileApi = `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&meta=false&viewport.width=375&viewport.height=812&viewport.isMobile=true`;

      // Parallel execution: Fetch AI content AND Screenshots simultaneously
      const [aiContent, desktopRes, mobileRes] = await Promise.all([
        generatePortfolioContent(formattedUrl),
        fetch(desktopApi).then(res => res.json()),
        fetch(mobileApi).then(res => res.json())
      ]);

      // Extract image URLs safely
      const desktopImage = desktopRes.data?.screenshot?.url;
      const mobileImage = mobileRes.data?.screenshot?.url;

      if (!desktopImage && !mobileImage) {
        throw new Error("Could not generate screenshots. The website might be blocking bots.");
      }

      setState({
        isLoading: false,
        error: null,
        data: {
          url: formattedUrl,
          // Fallback to a placeholder if one device fails but the other works
          desktopImage: desktopImage || "https://placehold.co/1600x1000/1f2937/ffffff?text=No+Desktop+Preview",
          mobileImage: mobileImage || "https://placehold.co/375x812/1f2937/ffffff?text=No+Mobile+Preview",
          ...aiContent
        }
      });

    } catch (err) {
      console.error(err);
      setState({
        isLoading: false,
        error: "Failed to generate portfolio. Please check the URL and try again.",
        data: null
      });
    }
  }, [urlInput]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] animate-blob"></div>
         <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
        
        {/* Hero Section */}
        <header className="flex flex-col items-center justify-center text-center space-y-8 mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 backdrop-blur-sm">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span>Powered by Gemini 2.5 Flash</span>
          </div>
          
          <h1 className="text-5xl lg:text-8xl font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Portfolio</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Snap</span>
          </h1>
          
          <p className="max-w-xl text-lg text-gray-400 leading-relaxed">
            Instant professional mockups. Enter a URL to generate high-fidelity device screenshots and AI-crafted descriptions for your portfolio.
          </p>

          {/* Input Form */}
          <form onSubmit={handleGenerate} className="w-full max-w-lg relative group pt-4">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-gray-900 rounded-xl p-2 ring-1 ring-white/10 shadow-2xl">
              <input
                type="text"
                placeholder="example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-gray-600 font-medium text-lg"
              />
              <button 
                type="submit"
                disabled={state.isLoading}
                className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              >
                {state.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>...</span>
                  </>
                ) : (
                  <span>Create</span>
                )}
              </button>
            </div>
          </form>

          {state.error && (
            <div className="text-red-300 bg-red-950/40 px-6 py-3 rounded-lg text-sm border border-red-500/20 backdrop-blur-md animate-fade-in">
              {state.error}
            </div>
          )}
        </header>

        {/* Results Section */}
        {state.data && (
           <PortfolioResult data={state.data} />
        )}

      </div>
    </div>
  );
};

export default App;