// Human-reviewed HSPT corpus corrections layered over the source transcription in words.js.
// Keep data/hspt-source.txt unchanged. This file is intentionally limited to playable
// metadata: realistic distractors and sentence-quality fixes.

const CORPUS_CURATIONS = {
  accuracy: {
    misspellings: ["acuracy"]
  },
  adjective: {
    misspellings: ["adjetive", "adjectve"]
  },
  aerobic: {
    misspellings: ["areobic"]
  },
  aggressive: {
    misspellings: ["agressive", "aggresive"]
  },
  ambiguous: {
    misspellings: ["ambigous", "ambigious"]
  },
  acquit: {
    misspellings: ["aquit"],
    sentences: [
      "The jury voted to acquit the defendant.",
      "The jury may acquit him if the evidence creates reasonable doubt."
    ]
  },
  compliment: {
    // Do not use “complement”: it is a correctly spelled English word with a different meaning.
    misspellings: ["complament", "compliement"]
  },
  concerned: {
    misspellings: ["concered", "conserned"]
  },
  critique: {
    misspellings: ["critque"]
  },
  deficit: {
    misspellings: ["defecit"]
  },
  hatched: {
    misspellings: ["hached", "hatchd"]
  },
  insatiable: {
    misspellings: ["insataible", "insatiabel"]
  },
  minimizing: {
    misspellings: ["minimizeing", "minimzing"],
    sentences: [
      "The new design focuses on minimizing wasted space.",
      "Minimizing distractions made it easier to finish the assignment."
    ]
  },
  novelist: {
    misspellings: ["novellist", "novelist"]
  },
  partial: {
    sentences: [
      "The judge ordered a partial refund.",
      "Clouds allowed only a partial view of the eclipse."
    ]
  },
  performed: {
    // Do not use “preformed”: it is a correctly spelled English word.
    misspellings: ["performmed", "perfomed"]
  },
  perturbed: {
    misspellings: ["perterbed", "peturbed"]
  },
  possessive: {
    misspellings: ["posessive", "possesive"]
  },
  radioactive: {
    misspellings: ["radiactive", "radioacive"]
  },
  recite: {
    misspellings: ["reciete", "resite"]
  },
  testimony: {
    misspellings: ["testomony", "testamony"]
  }
};

for (const entry of SPELLING_WORDS) {
  const patch = CORPUS_CURATIONS[entry.word];
  if (!patch) continue;
  if (patch.misspellings) entry.misspellings = [...patch.misspellings];
  if (patch.sentences) entry.sentences = [...patch.sentences];
}
