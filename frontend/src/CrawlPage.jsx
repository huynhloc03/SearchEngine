import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CrawlPage() {
  const [seedUrl, setSeedUrl] = useState('');
  const [pageLimit, setPageLimit] = useState(1);
  const [isCrawling, setIsCrawling] = useState(false);
  const [existingSession, setExistingSession] = useState(null);  // To track if an existing session is present
  const navigate = useNavigate();  // Use the navigate hook

  useEffect(() => {
    // Check if there's an existing session in localStorage
    const storedSessionId = localStorage.getItem('session_id');
    if (storedSessionId) {
      setExistingSession(storedSessionId);
    }
  }, []);  // Only run on mount

  const handleCrawl = async (e) => {
    e.preventDefault();

    if (!seedUrl) {
      alert('Please enter a seed URL');
      return;
    }

    setIsCrawling(true);

    const sessionId = Date.now().toString(); // Generate a unique session ID based on the current timestamp

    try {
      // Start the crawling process and pass the session_id
      await axios.post('http://localhost:5000/api/crawl', {
        url: seedUrl,
        pageLimit: pageLimit,
        session_id: sessionId  // Pass the session_id correctly
      });

      // Store session_id in localStorage for later use
      localStorage.setItem('session_id', sessionId);

      // Redirect to the visualization page and pass session_id as a query parameter
      navigate(`/visualizer?session_id=${sessionId}`);
    } catch (error) {
      console.error('Error during crawling process:', error);
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 relative">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-10 relative">
        {/* Forward Arrow to go to Search if session exists */}
        {existingSession && (
          <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => navigate('/search')}
            className="text-blue-600  hover:text-blue-800 text-3xl "
          >
            →
          </button>
          </div>
        )}
        <h5 className="text-4xl font-semibold text-center mb-8">Web Crawler</h5>
        
        <form onSubmit={handleCrawl}>
          <div className="form-group mb-4">
            <label htmlFor="seed_url" className="block text-sm font-medium text-gray-700 mb-2">Seed URL</label>
            <input
              type="text"
              className="form-control w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="seed_url"
              placeholder="https://www.example.com/"
              value={seedUrl}
              onChange={(e) => setSeedUrl(e.target.value)}
            />
          </div>

          <div className="form-group mb-6">
            <label htmlFor="customRange" className="block text-sm font-medium text-gray-700 mb-2">Page Limit</label>
            <input
              type="range"
              className="custom-range w-full"
              id="customRange"
              min="1"
              max="25"
              value={pageLimit}
              onChange={(e) => setPageLimit(parseInt(e.target.value))}
            />
            <div className="mt-2 text-sm text-gray-600">Current Value: <b>{pageLimit}</b></div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-xl"
            disabled={isCrawling}
          >
            {isCrawling ? 'Crawling...' : 'Start Crawling'}
          </button>
        </form>

        
      </div>
    </div>
  );
}

export default CrawlPage;
