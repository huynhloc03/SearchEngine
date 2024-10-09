import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Graph from './Graph';
import { useNavigate, useLocation } from 'react-router-dom'; // Use useLocation to get the session_id from URL

function VisualizerPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isCrawling, setIsCrawling] = useState(true); // Track if crawling is still happening
  const [crawlingFinished, setCrawlingFinished] = useState(false); // Track when crawling is finished
  const [errorMessage, setErrorMessage] = useState(null); // Track errors
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  // Extract session_id from the URL query string
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      console.error('Session ID is missing.');
      setErrorMessage('Session ID is missing. Redirecting to the crawl page...');
      setTimeout(() => navigate('/'), 3000); // Redirect after 3 seconds if no session ID
      return;
    }
    console.log(`Fetching data for session_id: ${sessionId}`); // Log session ID here

    const fetchCrawlData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/get-crawl-data?session_id=${sessionId}`);
        const newData = response.data;

        if (newData.error) {
          setErrorMessage('Error fetching data. Redirecting to the crawl page...');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Update the graph with new nodes and links, avoiding duplicates
        setGraphData(prevData => ({
          nodes: mergeUnique(prevData.nodes, newData.nodes, 'id'),
          links: mergeUnique(prevData.links, newData.links, 'source', 'target')
        }));

        if (newData.isCompleted) {
          setIsCrawling(false); // Stop fetching
          setCrawlingFinished(true);
        }
      } catch (error) {
        console.error('Error fetching crawl data:', error); // Log error here
        setErrorMessage('Failed to fetch crawl data. Please try again later.');
      }
    };

    const intervalId = setInterval(() => {
      if (isCrawling) {
        fetchCrawlData();
      } else {
        clearInterval(intervalId);
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [isCrawling, sessionId]);

  // Merge new nodes/links into the existing data without duplication
  const mergeUnique = (prev, next, ...keys) => {
    const seen = new Set(prev.map(d => keys.map(k => d[k]).join('-')));
    return [...prev, ...next.filter(d => !seen.has(keys.map(k => d[k]).join('-')))];
  };

  return (
    <div className="visualizer min-h-screen flex items-center justify-center bg-gray-800">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-10">
        <h5 className="text-4xl font-semibold text-center mb-8">
          {isCrawling ? 'Crawling...' : 'Crawling Finished!'}
        </h5>

        {errorMessage && (
          <div className="text-center text-red-600 mb-4">{errorMessage}</div>
        )}

        <Graph data={graphData} />

        {!isCrawling && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/search')}
              className="text-blue-600 hover:text-blue-800 text-3xl"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualizerPage;
