# Web Crawler Search Engine

A simple web crawler built with Python and React.js. It allows users to crawl websites, visualize the crawled pages, and search through the crawled data using a custom search engine.

## Features

- Crawl web pages starting from a seed URL.
- Set a page limit for how many pages to crawl.
- Avoid duplicates during crawling.
- Visualize the crawled data using a graph structure.
- Search crawled data and display results with keywords.

## Technologies Used

- **Frontend:** React.js, TailwindCSS
- **Backend:** Flask, MongoDB, Python, BeautifulSoup, Requests
- **Database:** MongoDB for storing crawled web pages.
  
## Setup

### Prerequisites
- Install [Node.js](https://nodejs.org/) (for the backend).
- Install [Python 3](https://www.python.org/) (for the frontend).
- Install [MongoDB](https://www.mongodb.com/) (or use MongoDB Atlas for a cloud-based database).

### Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```
### Backend Setup
1. Navigate to the backend folder
```
cd backend
```
2. Install required Python packages:
```
pip install -r requirement.txt
```
3. Set up your MongoDB connection string inside app.py:
```
client = MongoClient('your-mongo-connection-string')
```
4. Run the Flask backend server:
```
python app.py
```

### Frontend Setup
1. Navigate to the frontend folder:
```
cd frontend
```
2. Install required Node.js dependencies:
```
npm install
```
3. Start the development server:
```
npm run dev
```
4. Visit http://localhost:xxxx in your browser to access the application.

## How to Use
1. Enter a seed URL in the input field.
2. Set the page limit for how many pages you want to crawl.
3. Click Start Crawling to begin the process.
4. Once crawling is complete, you can visit the search page to find data from the crawled web pages.


