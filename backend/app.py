import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import subprocess

app = Flask(__name__)

# Enable CORS for all routes and allow localhost:5173 (your frontend)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# MongoDB connection
client = MongoClient('mongodb+srv://21lhuynh2:5rM6ioCuUVb9uGkm@cluster0.ftb12.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['search_engine']
collection = db['web_pages']
sessions_collection = db['sessions']  # New collection to track session details

@app.route('/api/crawl', methods=['POST'])
def start_crawl():
    data = request.get_json()
    url = data.get('url')
    page_limit = data.get('pageLimit')
    session_id = data.get('session_id') 

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Generate a unique session_id for this crawl if not provided
    session_id = session_id or str(uuid.uuid4())

    try:
        # Store the session with the page_limit
        sessions_collection.insert_one({
            "session_id": session_id,
            "page_limit": page_limit,
            "url": url
        })

        # Run crawler.py with the user-provided URL, page limit, and session_id
        subprocess.Popen(['python', 'crawler.py', url, str(page_limit), session_id])

        return jsonify({"message": f"Crawl started for {url} with a limit of {page_limit} pages and session ID {session_id}."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-crawl-data', methods=['GET'])
def get_crawl_data():
    session_id = request.args.get('session_id')
    
    if not session_id:
        return jsonify({"error": "Session ID is missing"}), 400
    
    print(f"Fetching crawl data for session_id: {session_id}")  # Log the session_id received
    
    # Fetch the session details to get the page limit for the session
    session_data = db.sessions.find_one({"session_id": session_id})
    
    if not session_data:
        return jsonify({"error": "Session not found"}), 400
    
    page_limit = session_data.get('page_limit')  # Retrieve the page limit for this session
    
    try:
        # Fetch all crawled web pages from MongoDB for this session
        pages = list(collection.find({"session_id": session_id}))

        # Create the list of nodes from URLs
        nodes = [{"id": page["url"]} for page in pages]

        # Use a set for quick lookup of node IDs
        node_ids = set(page["url"] for page in pages)

        links = []
        for page in pages:
            # Only add links if both the source and target are in the nodes
            for link in page.get("links", []):
                if link in node_ids:
                    links.append({"source": page["url"], "target": link})

        # Check if crawling is completed using session_id and page_limit
        is_completed = check_if_crawling_is_done(session_id, page_limit)

        return jsonify({"nodes": nodes, "links": links, "isCompleted": is_completed}), 200

    except Exception as e:
        print(f"Error fetching crawl data: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Update the check_if_crawling_is_done function to use session_id
def check_if_crawling_is_done(session_id, page_limit):
    # Count the number of pages crawled for this session
    return collection.count_documents({"session_id": session_id}) >= page_limit

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "No search query provided"}), 400

    try:
        # Split the user's query into individual words (tags) for dynamic searching
        query_words = query.split()

        # Searching for documents that match all keywords
        search_conditions = [{"content": {"$regex": word, "$options": "i"}} for word in query_words]
        
        # Use MongoDB's $and operator to ensure all keywords are matched
        results = collection.find({"$and": search_conditions})

        search_results = []
        for result in results:
            content = result["content"]

            # Clean the content by removing extra spaces or invisible characters
            cleaned_content = ' '.join(content.split())

            # Find tags that actually appear in the cleaned content
            found_tags = [word for word in query_words if word.lower() in cleaned_content.lower()]

            if found_tags:
                search_results.append({
                    "url": result["url"] if result["url"].startswith("http") else "http://" + result["url"],
                    "title": result.get("title", result["url"]),
                    "content": cleaned_content[:300],  # Shortened content preview
                    "rank": result.get("rank", 0),  # Rank if applicable
                    "tags": found_tags  # Add tags based on the query words found in the content
                })

        # Sort results by rank
        sorted_results = sorted(search_results, key=lambda x: x["rank"], reverse=True)

        return jsonify(sorted_results), 200

    except Exception as e:
        print(f"Error during search: {str(e)}")
        return jsonify({"error": str(e)}), 500



@app.route('/api/clear-database', methods=['POST'])
def clear_database():
    try:
        # Remove all documents from the 'web_pages' collection
        collection.delete_many({})
        sessions_collection.delete_many({})  # Also clear sessions data
        return jsonify({"message": "Database cleared successfully"}), 200
    except Exception as e:
        print(f"Error clearing database: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-stored-results', methods=['GET'])
def get_stored_results():
    try:
        # Fetch all documents from the 'web_pages' collection and sort by rank in descending order
        results = collection.find().sort("rank", -1)  # -1 means descending order
        stored_results = [
            {
                "url": result["url"],
                "title": result.get("title", result["url"]),
                "content": result["content"][:300],  # Limit the content preview to 300 characters
                "rank": result.get("rank", 0)  # Retrieve rank from MongoDB, or default to 0
            }
            for result in results
        ]
        return jsonify(stored_results), 200
    except Exception as e:
        print(f"Error fetching stored results: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
