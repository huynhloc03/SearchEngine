import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const stopWords = new Set([
  'the', 'is', 'in', 'and', 'to', 'of', 'a', 'on', 'for', 'with', 'at', 'by', 'an', 'it', 'from', 'as', 'this', 'that', 'these', 'those'
]);

const getMostUsedWords = (content, limit = 10) => {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .split(/\s+/)  // Split into words by whitespace
    .filter(word => !stopWords.has(word) && word.length > 2);  // Exclude stop words and short words

  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const sortedWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);

  return sortedWords.join(', ');
};

const highlightKeyword = (text, keyword) => {
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
};

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(5);  
  const [showClearNotification, setShowClearNotification] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoredResults();
  }, []);

  const fetchStoredResults = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/get-stored-results');
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching stored results:', error);
    }
  };

  const handleClearDatabase = async () => {
    try {
      await axios.post('http://localhost:5000/api/clear-database');
      setShowClearNotification(true);
      setSearchResults([]);
      setTimeout(() => {
        setShowClearNotification(false);
      }, 1000);
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('Failed to clear the database');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery) {
      alert('Please enter a search query');
      return;
    }

    setHasSearched(true);
    setCurrentPage(1);  // Reset to the first page on a new search

    try {
      const response = await axios.get('http://localhost:5000/api/search', {
        params: { query: searchQuery }
      });

      // Filter out duplicate URLs based on 'url'
      const uniqueResults = response.data.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.url === value.url
        ))
      );

      setSearchResults(uniqueResults);  // Set the unique results
    } catch (error) {
      console.error('Error during search:', error);
    }
};


  const loadMoreResults = useCallback(() => {
    if (itemsToShow < searchResults.length) {
      setItemsToShow(prevItemsToShow => prevItemsToShow + 5);
    }
  }, [itemsToShow, searchResults.length]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop === clientHeight) {
      loadMoreResults();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-10">
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="text-blue-600 text-left hover:text-blue-800">
            <span className="text-3xl">←</span>
          </button>
        </div>

        <h5 className="text-4xl font-semibold text-center mb-8">Search Crawled Data</h5>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="form-group mb-6">
            <input
              type="text"
              className="form-control w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter search term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-xl mb-0"
          >
            Search
          </button>
        </form>

        <button
          onClick={handleClearDatabase}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg text-xl"
        >
          Clear Database
        </button>

        {showClearNotification && (
          <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white rounded-lg p-5 shadow-lg">
              <p className="text-green-600 font-semibold text-lg">Search has been cleared!</p>
            </div>
          </div>
        )}

        {hasSearched && (
          <div
            className="search-results"
            style={{ maxHeight: '300px', overflowY: 'auto' }}
            onScroll={handleScroll}
          >
            {searchResults.length > 0 ? (
              searchResults.slice(0, itemsToShow).map((result, index) => (
                <div key={index} className="result-item mb-4">
                  <div className="flex justify-between items-center">
                    <a href={result.url} className="text-blue-600 underline break-words" target="_blank" rel="noopener noreferrer">
                      {result.title || result.url}
                    </a>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded">Rank: {result.rank}</span>
                  </div>
                  <p
                    className="text-gray-600 break-words"
                    dangerouslySetInnerHTML={{ __html: highlightKeyword(getMostUsedWords(result.content), searchQuery) }}
                  ></p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">No results found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
