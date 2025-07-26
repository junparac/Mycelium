export function loadSynonyms() {
  try {
    const local = localStorage.getItem('synonyms');
    if (local) return JSON.parse(local);
  } catch (e) {
    console.warn('Invalid localStorage synonyms.');
  }

  // Fallback to file
  const fromFile = window.electronAPI.loadSynonyms();
  localStorage.setItem('synonyms', JSON.stringify(fromFile));
  return fromFile;
}

export function saveSynonyms(data) {
  window.electronAPI.saveSynonyms(data);
  localStorage.setItem('synonyms', JSON.stringify(data));
}
