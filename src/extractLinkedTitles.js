export default async function extractLinkedTitles(content, noteTitles, synonyms) {
  const lowerContent = content.toLowerCase();
  const foundLinks = new Set();

  for (const title of noteTitles) {
    const lowerTitle = title.toLowerCase();
    const knownSynonyms = synonyms[lowerTitle] || [];
    const wordsToMatch = [title, ...knownSynonyms.map(obj => obj.word || obj)];

    for (const word of wordsToMatch) {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'i');
      if (regex.test(lowerContent)) {
        foundLinks.add(title);

        // Track frequency
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

    // Auto-learn potential new synonym
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
  }

  // Save learned synonyms through Electron bridge
  if (window?.electronAPI?.saveSynonyms) {
    window.electronAPI.saveSynonyms(synonyms);
  }

  const normalizedLinks = noteTitles.filter(title =>
    foundLinks.has(title) || foundLinks.has(title.toLowerCase())
  );

  return Array.from(new Set(normalizedLinks));
}
