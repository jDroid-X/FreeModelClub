/**
 * SemanticRAGAgent.js
 * Purpose: A lightweight, pure JS semantic indexing engine using TF-IDF / BM25 logic 
 *          to find conceptually related code chunks across the workspace without external DBs.
 */

const fs = require('fs');
const path = require('path');

class SemanticRAGAgent {
  constructor() {
    this.documents = []; // { id, content, path, tokens }
    this.invertedIndex = Object.create(null);
    this.docCount = 0;
    this.isIndexed = false;
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9_]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  }

  buildIndex(workspaceRoot) {
    if (this.isIndexed) return;
    console.log('[SemanticRAGAgent] Building vector/BM25 index for workspace...');
    this.indexDirectory(workspaceRoot);
    this.isIndexed = true;
    console.log(`[SemanticRAGAgent] Indexing complete. ${this.docCount} chunks indexed.`);
  }

  indexDirectory(dirPath, extensions = ['.js', '.html', '.css', '.md', '.json']) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'logs' || item.name === 'data' || item.name === 'scratch' || item.name === 'requirement') continue;
      
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        this.indexDirectory(fullPath, extensions);
      } else {
        const ext = path.extname(item.name);
        if (extensions.includes(ext)) {
          this.indexFile(fullPath);
        }
      }
    }
  }

  indexFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Basic chunking: split by empty lines or large blocks
      const chunks = content.split('\n\n').filter(c => c.trim().length > 50);
      
      chunks.forEach((chunk, i) => {
        const docId = `${filePath}#chunk${i}`;
        const tokens = this.tokenize(chunk);
        
        this.documents.push({
          id: docId,
          path: filePath,
          content: chunk,
          length: tokens.length
        });
        
        const tokenFreq = Object.create(null);
        tokens.forEach(t => { tokenFreq[t] = (tokenFreq[t] || 0) + 1; });
        
        for (const [token, freq] of Object.entries(tokenFreq)) {
          if (!Array.isArray(this.invertedIndex[token])) {
            this.invertedIndex[token] = [];
          }
          this.invertedIndex[token].push({ docId, freq });
        }
        
        this.docCount++;
      });
    } catch (e) {
      console.error(`[SemanticRAGAgent] Index Error on ${filePath}:`, e.message);
    }
  }

  search(query, topK = 5) {
    if (!this.isIndexed) {
      this.buildIndex(path.join(__dirname, '../../')); // Index from root
    }
    
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];
    
    const scores = {};
    const avgDocLength = this.documents.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, this.docCount);
    
    // BM25 parameters
    const k1 = 1.2;
    const b = 0.75;

    tokens.forEach(token => {
      const postings = Array.isArray(this.invertedIndex[token]) ? this.invertedIndex[token] : [];
      const idf = Math.log((this.docCount - postings.length + 0.5) / (postings.length + 0.5) + 1);
      
      postings.forEach(post => {
        const doc = this.documents.find(d => d.id === post.docId);
        if (!doc) return;
        
        const termFreq = post.freq;
        const numerator = termFreq * (k1 + 1);
        const denominator = termFreq + k1 * (1 - b + b * (doc.length / avgDocLength));
        const score = idf * (numerator / denominator);
        
        scores[post.docId] = (scores[post.docId] || 0) + score;
      });
    });

    const results = Object.keys(scores)
      .map(id => ({ id, score: scores[id], doc: this.documents.find(d => d.id === id) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results.map(r => ({
      path: r.doc.path,
      score: r.score,
      content: r.doc.content
    }));
  }
}

module.exports = new SemanticRAGAgent();
