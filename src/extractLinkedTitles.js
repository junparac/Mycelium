export default async function extractLinkedTitles(content, noteTitles = [], synonyms = {}) {
  const lowerContent = content.toLowerCase();
  const foundLinks = new Set();

  const validTitles = noteTitles.filter(t => typeof t === 'string');

  // 🧠 Levenshtein helper
  function levenshteinDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }

    return dp[a.length][b.length];
  }

  for (const title of validTitles) {
    const lowerTitle = title.toLowerCase();
    const knownSynonyms = synonyms[lowerTitle] || [];
    const wordsToMatch = [title, ...knownSynonyms.map(obj => obj.word || obj)];

    // 🔍 Exact and synonym match
    for (const word of wordsToMatch) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'i');
      if (regex.test(lowerContent)) {
        foundLinks.add(title);

        // 📈 Update match frequency
        const existing = synonyms[lowerTitle] || [];
        const matchObj = existing.find(s => s.word === word || s === word);
        if (typeof matchObj === 'object') {
          matchObj.count = (matchObj.count || 1) + 1;
        } else if (matchObj) {
          const index = existing.indexOf(matchObj);
          existing[index] = { word: matchObj, count: 2 };
        }
        synonyms[lowerTitle] = existing;
        break;
      }
    }

    // 🤖 Auto-learn obvious word matches
    const titleRegex = new RegExp(`\\b(\\w{3,})\\b`, 'g');
    let match;
    while ((match = titleRegex.exec(lowerContent)) !== null) {
      const word = match[1];
      if (
        word !== lowerTitle &&
        word.length >= 3 &&
        word.includes(lowerTitle.slice(0, 3)) &&
        !knownSynonyms.some(s => (s.word || s) === word)
      ) {
        console.log(`💡 Learned new candidate for "${title}": ${word}`);
        synonyms[lowerTitle] = [
          ...(synonyms[lowerTitle] || []),
          { word, count: 1 }
        ];
        break;
      }
    }

    // 🧩 Fuzzy match fallback (Levenshtein)
    const fuzzyMatches = lowerContent.match(/\b\w{3,}\b/g) || [];
    for (const word of fuzzyMatches) {
      const dist = levenshteinDistance(word, lowerTitle);
      if (dist <= 2 && !knownSynonyms.some(s => (s.word || s) === word)) {
        console.log(`🤖 Fuzzy learned: "${word}" ~ "${title}" (distance ${dist})`);
        synonyms[lowerTitle] = [
          ...(synonyms[lowerTitle] || []),
          { word, count: 1, fuzzy: true }
        ];
        break;
      }
    }
  }

  // 💾 Save learned synonyms via Electron bridge
  if (window?.electronAPI?.saveSynonyms) {
    window.electronAPI.saveSynonyms(synonyms);
  }

  const normalizedLinks = validTitles.filter(title =>
    foundLinks.has(title) || foundLinks.has(title.toLowerCase())
  );

  return Array.from(new Set(normalizedLinks));
}
