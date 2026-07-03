// src/semanticSearch.js
export async function querySemanticSearch(queryText) {
  try {
    const response = await fetch('http://localhost:5050/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: queryText })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.results; // List of { filename, score }
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
}
