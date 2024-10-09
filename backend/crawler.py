import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from urllib.parse import urljoin
import sys

# MongoDB connection
client = MongoClient('mongodb+srv://21lhuynh2:5rM6ioCuUVb9uGkm@cluster0.ftb12.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['search_engine']
collection = db['web_pages']

def get_visible_text(soup):
    """
    Extract visible text from a BeautifulSoup object, ignoring scripts, styles, etc.
    """
    for element in soup(['style', 'script', 'head', 'title', 'meta', '[document]']):
        element.extract()  # Remove non-visible elements
    visible_text = soup.get_text(separator=' ', strip=True)
    return visible_text

def crawl(url, page_limit, session_id):
    crawled_pages = 0
    to_crawl = [url]  # Queue of pages to crawl
    crawled = set()  # Set to track crawled URLs

    while to_crawl and crawled_pages < page_limit:
        current_url = to_crawl.pop(0)
        
        # Check if the URL has already been crawled in any session
        if collection.find_one({"url": current_url}):
            print(f"Already crawled: {current_url}, skipping.")
            continue
        
        try:
            response = requests.get(current_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            # Log each URL crawled
            print(f"Crawling: {current_url}")

            # Extract visible text only
            visible_text = get_visible_text(soup)

            # Ensure all collected links are absolute URLs
            links = [urljoin(current_url, a['href']) for a in soup.find_all('a', href=True)]

            # Count backlinks (number of links on the page)
            backlinks = len(links)

            # Compute rank (based on backlinks for now)
            rank = backlinks

            # Insert or update the page in MongoDB with backlinks, rank, and absolute links
            collection.update_one(
                {"url": current_url},  # We removed session_id from the uniqueness check
                {
                    "$set": {
                        "url": current_url,
                        "session_id": session_id,
                        "title": soup.title.string if soup.title else current_url,
                        "content": visible_text,  # Store only the visible text
                        "links": links,  # Store absolute URLs
                        "backlinks": backlinks,  # Store backlinks count
                        "rank": rank  # Store rank directly in MongoDB
                    }
                },
                upsert=True  # Insert a new document if no match is found, otherwise update
            )

            crawled.add(current_url)  # Add URL to the crawled set
            crawled_pages += 1

            # Add newly found links to the crawl queue, ensuring no duplicates
            for link in links:
                if link not in crawled and link not in to_crawl:
                    to_crawl.append(link)

        except Exception as e:
            print(f"Error crawling {current_url}: {e}")



if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python crawler.py <url> <page_limit> <session_id>")
    else:
        crawl(sys.argv[1], int(sys.argv[2]), sys.argv[3])
