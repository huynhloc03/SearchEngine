import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CrawlPage from './CrawlPage';
import SearchPage from './SearchPage';
import VisualizerPage from './VisualizerPage';  // Import the visualizer page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CrawlPage />} />
        <Route path="/visualizer" element={<VisualizerPage />} />  {/* Add the new route */}
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
