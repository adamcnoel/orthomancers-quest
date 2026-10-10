const SPELLING_WORDS = [
  {
    word: "accommodate",
    misspellings: ["accomodate", "acommodate"],
    sentences: [
      "The hotel can accommodate a large group of students.",
      "We changed the schedule to accommodate everyone."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["double-consonant"]
  },
  {
    word: "acquaintance",
    misspellings: ["aquaintance", "acquaintence"],
    sentences: [
      "She recognized an old acquaintance at the concert.",
      "A casual acquaintance introduced them after the meeting."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["vowel-pattern"]
  },
  {
    word: "aggressive",
    misspellings: ["agressive", "aggresssive"],
    sentences: [
      "The team adopted an aggressive strategy in the second half.",
      "His aggressive tone made the discussion more difficult."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["double-consonant"]
  },
  {
    word: "apparent",
    misspellings: ["aparent", "apparant"],
    sentences: [
      "It became apparent that the storm would delay the flight.",
      "The solution was not immediately apparent to the class."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["double-consonant"]
  },
  {
    word: "argument",
    misspellings: ["arguement"],
    sentences: [
      "Her argument was supported by several strong examples.",
      "The debate ended without a serious argument."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["silent-e-drop"]
  },
  {
    word: "beginning",
    misspellings: ["begining", "beggining"],
    sentences: [
      "The beginning of the novel introduces the main conflict.",
      "From the beginning, the experiment produced unusual results."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["double-consonant"]
  },
  {
    word: "calendar",
    misspellings: ["calender"],
    sentences: [
      "She marked the exam date on her calendar.",
      "The school calendar lists several days without classes."
    ],
    sources: ["prototype"],
    difficulty: 1,
    tags: ["vowel-pattern"]
  },
  {
    word: "category",
    misspellings: ["catagory"],
    sentences: [
      "Place each animal in the correct category.",
      "The book won an award in the history category."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["vowel-pattern"]
  },
  {
    word: "cemetery",
    misspellings: ["cemetary", "cemetary"],
    sentences: [
      "The old cemetery stands beside a small stone church.",
      "Volunteers cleaned the historic cemetery before the ceremony."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["vowel-pattern"]
  },
  {
    word: "definitely",
    misspellings: ["definately", "definitly"],
    sentences: [
      "I will definitely finish the assignment before Friday.",
      "The evidence definitely changed her opinion of the case."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["vowel-pattern"]
  },
  {
    word: "discipline",
    misspellings: ["disipline", "discpline"],
    sentences: [
      "Daily practice requires patience and discipline.",
      "The coach emphasized discipline throughout the season."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["silent-letter"]
  },
  {
    word: "embarrass",
    misspellings: ["embarass", "embarras"],
    sentences: [
      "He did not mean to embarrass his friend in front of the class.",
      "The unexpected question seemed to embarrass the speaker."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["double-consonant"]
  },
  {
    word: "existence",
    misspellings: ["existance"],
    sentences: [
      "Scientists debated the possible existence of water beneath the surface.",
      "The document confirms the existence of an earlier agreement."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["ance-ence"]
  },
  {
    word: "foreign",
    misspellings: ["foriegn"],
    sentences: [
      "She hopes to study a foreign language next year.",
      "The museum displayed coins from several foreign countries."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["ie-ei"]
  },
  {
    word: "government",
    misspellings: ["goverment", "governement"],
    sentences: [
      "The local government approved the new park.",
      "Citizens asked the government to explain the proposed law."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["unstressed-syllable"]
  },
  {
    word: "grammar",
    misspellings: ["grammer"],
    sentences: [
      "The teacher reviewed grammar before the writing assignment.",
      "Strong grammar helps make an argument easier to follow."
    ],
    sources: ["prototype"],
    difficulty: 1,
    tags: ["vowel-pattern"]
  },
  {
    word: "guarantee",
    misspellings: ["garantee", "guarentee"],
    sentences: [
      "A high score does not guarantee admission to the program.",
      "The store will guarantee the repair for one year."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["vowel-pattern"]
  },
  {
    word: "independent",
    misspellings: ["independant", "indepedent"],
    sentences: [
      "The student completed an independent research project.",
      "Each committee reached an independent conclusion."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["ant-ent"]
  },
  {
    word: "intelligence",
    misspellings: ["inteligence", "intelligance"],
    sentences: [
      "The puzzle tests reasoning rather than raw intelligence.",
      "Artificial intelligence has changed many kinds of research."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["double-consonant", "ance-ence"]
  },
  {
    word: "maintenance",
    misspellings: ["maintainance", "maintenence"],
    sentences: [
      "Regular maintenance can extend the life of the machine.",
      "The pool closed for routine maintenance."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["ance-ence"]
  },
  {
    word: "necessary",
    misspellings: ["neccessary", "necessery"],
    sentences: [
      "It is necessary to show your work on the final problem.",
      "The repairs were necessary after the heavy storm."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["double-consonant"]
  },
  {
    word: "occasion",
    misspellings: ["ocassion", "occassion"],
    sentences: [
      "The family saves that recipe for a special occasion.",
      "On one occasion, the entire class stayed after school to help."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["double-consonant"]
  },
  {
    word: "occurrence",
    misspellings: ["occurence", "occurrance"],
    sentences: [
      "Snow is a rare occurrence in the desert.",
      "The unusual occurrence was reported to the principal."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["double-consonant", "ance-ence"]
  },
  {
    word: "privilege",
    misspellings: ["privelege", "priviledge"],
    sentences: [
      "Voting is both a right and a privilege.",
      "It was a privilege to hear the scientist speak in person."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["vowel-pattern"]
  },
  {
    word: "pronunciation",
    misspellings: ["pronounciation"],
    sentences: [
      "The dictionary includes the pronunciation of each word.",
      "Her pronunciation improved after several weeks of practice."
    ],
    sources: ["prototype"],
    difficulty: 3,
    tags: ["vowel-change"]
  },
  {
    word: "receive",
    misspellings: ["recieve"],
    sentences: [
      "You should receive the results by the end of the week.",
      "Every participant will receive a certificate."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["ie-ei"]
  },
  {
    word: "recommend",
    misspellings: ["reccomend", "recomend"],
    sentences: [
      "I recommend reading the instructions before you begin.",
      "The counselor may recommend a different course next semester."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["double-consonant"]
  },
  {
    word: "separate",
    misspellings: ["seperate"],
    sentences: [
      "Keep the two sets of notes in separate folders.",
      "A narrow hallway will separate the classrooms."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["vowel-pattern"]
  },
  {
    word: "tomorrow",
    misspellings: ["tommorow", "tomarrow"],
    sentences: [
      "The class will continue the experiment tomorrow.",
      "We will discuss the final chapter tomorrow morning."
    ],
    sources: ["prototype"],
    difficulty: 1,
    tags: ["double-consonant"]
  },
  {
    word: "weird",
    misspellings: ["wierd"],
    sentences: [
      "A weird noise came from the empty hallway.",
      "The ending of the story was strange but not entirely weird."
    ],
    sources: ["prototype"],
    difficulty: 2,
    tags: ["ie-ei"]
  }
];
