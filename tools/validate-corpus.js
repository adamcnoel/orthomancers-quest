const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'words.js');
const hsptPath = path.join(root, 'data', 'hspt-source.txt');

const source = fs.readFileSync(sourcePath, 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${source}\nthis.__WORDS__ = SPELLING_WORDS;`, context, { filename: sourcePath });
const words = context.__WORDS__;
const hsptWords = fs.readFileSync(hsptPath, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

const errors = [];
const warnings = [];
const seenWords = new Set();
const seenSentences = new Map();
const misspellingOwners = new Map();

function error(message) { errors.push(message); }
function warning(message) { warnings.push(message); }
function exactWordRegex(word) {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
}

if (!Array.isArray(words)) error('SPELLING_WORDS is not an array.');

for (const [index, entry] of words.entries()) {
  const label = entry && entry.word ? entry.word : `record #${index + 1}`;
  if (!entry || typeof entry !== 'object') {
    error(`Record #${index + 1} is not an object.`);
    continue;
  }
  if (!entry.word || typeof entry.word !== 'string') {
    error(`Record #${index + 1} has no valid word.`);
    continue;
  }
  if (seenWords.has(entry.word)) error(`${label}: duplicate target word.`);
  seenWords.add(entry.word);

  if (!Array.isArray(entry.misspellings) || entry.misspellings.length < 1) {
    error(`${label}: needs at least one misspelling.`);
  } else {
    const local = new Set();
    for (const miss of entry.misspellings) {
      if (typeof miss !== 'string' || !miss.trim()) {
        error(`${label}: has an invalid misspelling.`);
        continue;
      }
      if (miss.toLowerCase() === entry.word.toLowerCase()) {
        error(`${label}: misspelling is identical to the correct spelling.`);
      }
      if (local.has(miss.toLowerCase())) error(`${label}: duplicate misspelling '${miss}'.`);
      local.add(miss.toLowerCase());
      const owner = misspellingOwners.get(miss.toLowerCase());
      if (owner && owner !== entry.word) warning(`${label}: misspelling '${miss}' is also assigned to '${owner}'.`);
      else misspellingOwners.set(miss.toLowerCase(), entry.word);
    }
  }

  if (!Array.isArray(entry.sentences) || entry.sentences.length < 2) {
    error(`${label}: needs at least two sentences.`);
  } else {
    const pattern = exactWordRegex(entry.word);
    for (const sentence of entry.sentences) {
      if (typeof sentence !== 'string' || !sentence.trim()) {
        error(`${label}: has an invalid sentence.`);
        continue;
      }
      if (!pattern.test(sentence)) error(`${label}: sentence does not contain the exact target word: ${sentence}`);
      const normalized = sentence.trim().toLowerCase();
      const owner = seenSentences.get(normalized);
      if (owner) error(`${label}: duplicates a sentence already used by '${owner}'.`);
      else seenSentences.set(normalized, entry.word);
      for (const miss of entry.misspellings || []) {
        if (exactWordRegex(miss).test(sentence)) error(`${label}: correct sentence accidentally contains misspelling '${miss}'.`);
      }
    }
  }

  if (!Array.isArray(entry.sources) || entry.sources.length < 1) error(`${label}: needs at least one source tag.`);
}

const hsptSet = new Set(hsptWords);
for (const word of hsptWords) {
  const entry = words.find(item => item.word === word);
  if (!entry) error(`HSPT source word '${word}' is missing from SPELLING_WORDS.`);
  else if (!entry.sources.includes('hspt-core')) error(`HSPT source word '${word}' is not tagged hspt-core.`);
}
for (const entry of words) {
  if (entry.sources.includes('hspt-core') && !hsptSet.has(entry.word)) warning(`${entry.word}: tagged hspt-core but absent from data/hspt-source.txt.`);
}

console.log(`Corpus records: ${words.length}`);
console.log(`HSPT source words: ${hsptWords.length}`);
console.log(`Sentences: ${words.reduce((n, w) => n + (w.sentences?.length || 0), 0)}`);
console.log(`Misspellings: ${words.reduce((n, w) => n + (w.misspellings?.length || 0), 0)}`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`- ${w}`));
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}

console.log('\nCorpus validation passed.');
