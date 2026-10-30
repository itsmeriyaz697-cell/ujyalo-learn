/**
 * Practice questions — deliberately NOT the ranked question bank.
 *
 * This file ships to the browser, so its answers are visible to anyone who
 * opens dev tools. That is acceptable only because these questions are never
 * used for ranked play. They exist so that:
 *
 *   1. a signed-out visitor can try the Arena immediately without an account
 *      (the site's rule: never a login wall before the first action), and
 *   2. the demo mode has real questions to ask when no database is configured.
 *
 * The 315 ranked questions live in api/_lib/arena/bank.ts, server-side only.
 * If you add a question here, do not also add it there — an overlap would hand
 * free answers to anyone reading the bundle.
 */
import type { ArenaCategory, Difficulty } from './types';

export interface PracticeQuestion {
  id: string;
  category: ArenaCategory;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
}

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  // Mathematics
  { id: 'p-math-1', category: 'mathematics', difficulty: 'easy', prompt: 'What is 9 × 6?', options: ['45', '54', '56', '63'], answerIndex: 1, explanation: '9 × 6 = 54.' },
  { id: 'p-math-2', category: 'mathematics', difficulty: 'easy', prompt: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answerIndex: 1, explanation: 'Hexa- means six; a hexagon has six sides.' },
  { id: 'p-math-3', category: 'mathematics', difficulty: 'medium', prompt: 'What is 20% of 150?', options: ['15', '25', '30', '45'], answerIndex: 2, explanation: '10% of 150 is 15, so 20% is 30.' },
  { id: 'p-math-4', category: 'mathematics', difficulty: 'hard', prompt: 'If x² = 49, what is the positive value of x?', options: ['5', '6', '7', '9'], answerIndex: 2, explanation: '7 × 7 = 49, so the positive root is 7.' },

  // Physics
  { id: 'p-phy-1', category: 'physics', difficulty: 'easy', prompt: 'What is the SI unit of mass?', options: ['Gram', 'Kilogram', 'Newton', 'Pound'], answerIndex: 1, explanation: 'The kilogram is the SI base unit of mass.' },
  { id: 'p-phy-2', category: 'physics', difficulty: 'easy', prompt: 'Which of these is a good conductor of electricity?', options: ['Rubber', 'Glass', 'Copper', 'Dry wood'], answerIndex: 2, explanation: 'Metals such as copper have free electrons and conduct well.' },
  { id: 'p-phy-3', category: 'physics', difficulty: 'medium', prompt: 'A car travels 90 km in 1.5 hours. Its average speed is:', options: ['45 km/h', '55 km/h', '60 km/h', '75 km/h'], answerIndex: 2, explanation: '90 ÷ 1.5 = 60 km/h.' },
  { id: 'p-phy-4', category: 'physics', difficulty: 'hard', prompt: 'A 10 N force moves a box 3 m in the direction of the force. The work done is:', options: ['3 J', '10 J', '30 J', '300 J'], answerIndex: 2, explanation: 'Work = force × distance = 10 × 3 = 30 joules.' },

  // Chemistry
  { id: 'p-chem-1', category: 'chemistry', difficulty: 'easy', prompt: 'What is the chemical symbol for iron?', options: ['Ir', 'Fe', 'In', 'Fr'], answerIndex: 1, explanation: 'Fe, from the Latin ferrum.' },
  { id: 'p-chem-2', category: 'chemistry', difficulty: 'easy', prompt: 'Which particle carries a negative charge?', options: ['Proton', 'Neutron', 'Electron', 'Nucleus'], answerIndex: 2, explanation: 'Electrons carry negative charge; protons positive; neutrons none.' },
  { id: 'p-chem-3', category: 'chemistry', difficulty: 'medium', prompt: 'How many atoms are there in one molecule of glucose, C₆H₁₂O₆?', options: ['12', '18', '24', '30'], answerIndex: 2, explanation: '6 + 12 + 6 = 24 atoms.' },
  { id: 'p-chem-4', category: 'chemistry', difficulty: 'hard', prompt: 'What is the mass of 0.5 mol of CO₂? (CO₂ = 44 g/mol)', options: ['11 g', '22 g', '44 g', '88 g'], answerIndex: 1, explanation: '0.5 × 44 = 22 g.' },

  // Biology
  { id: 'p-bio-1', category: 'biology', difficulty: 'easy', prompt: 'Which organ produces bile?', options: ['Kidney', 'Liver', 'Stomach', 'Pancreas'], answerIndex: 1, explanation: 'The liver makes bile, which is stored in the gall bladder.' },
  { id: 'p-bio-2', category: 'biology', difficulty: 'easy', prompt: 'Animals with a backbone are called:', options: ['Invertebrates', 'Vertebrates', 'Arthropods', 'Molluscs'], answerIndex: 1, explanation: 'Vertebrates have a vertebral column.' },
  { id: 'p-bio-3', category: 'biology', difficulty: 'medium', prompt: 'Which vitamin does skin make when exposed to sunlight?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], answerIndex: 3, explanation: 'UV light helps the skin synthesise vitamin D.' },
  { id: 'p-bio-4', category: 'biology', difficulty: 'hard', prompt: 'Water moving across a membrane towards higher solute concentration is called:', options: ['Diffusion', 'Osmosis', 'Active transport', 'Filtration'], answerIndex: 1, explanation: 'Osmosis is the movement of water across a semi-permeable membrane.' },

  // English
  { id: 'p-eng-1', category: 'english', difficulty: 'easy', prompt: 'What is the past tense of "buy"?', options: ['Buyed', 'Bought', 'Boughted', 'Buying'], answerIndex: 1, explanation: 'Buy → bought is irregular.' },
  { id: 'p-eng-2', category: 'english', difficulty: 'easy', prompt: 'Which word is a preposition?', options: ['Under', 'Quickly', 'Happy', 'Jump'], answerIndex: 0, explanation: '"Under" shows the relationship between things in place.' },
  { id: 'p-eng-3', category: 'english', difficulty: 'medium', prompt: 'Choose the correct word: "He is better ___ me at chess."', options: ['then', 'than', 'that', 'as'], answerIndex: 1, explanation: '"Than" is used in comparisons; "then" refers to time.' },
  { id: 'p-eng-4', category: 'english', difficulty: 'hard', prompt: 'A word opposite in meaning to another is called a(n):', options: ['Synonym', 'Antonym', 'Homonym', 'Acronym'], answerIndex: 1, explanation: 'Antonyms are opposites; synonyms have the same meaning.' },

  // Computer Science
  { id: 'p-cs-1', category: 'computer-science', difficulty: 'easy', prompt: 'How many bits are in a byte?', options: ['4', '8', '16', '32'], answerIndex: 1, explanation: 'One byte is eight bits.' },
  { id: 'p-cs-2', category: 'computer-science', difficulty: 'easy', prompt: 'What does "WWW" stand for?', options: ['World Wide Web', 'Wide Web World', 'Web World Wide', 'World Web Wire'], answerIndex: 0, explanation: 'The World Wide Web.' },
  { id: 'p-cs-3', category: 'computer-science', difficulty: 'medium', prompt: 'What is binary 0110 in decimal?', options: ['4', '5', '6', '7'], answerIndex: 2, explanation: '4 + 2 = 6.' },
  { id: 'p-cs-4', category: 'computer-science', difficulty: 'hard', prompt: 'Reading an array element by its index takes:', options: ['O(1) time', 'O(log n) time', 'O(n) time', 'O(n²) time'], answerIndex: 0, explanation: 'The address is computed directly, so it is constant time.' },

  // General Knowledge
  { id: 'p-gk-1', category: 'general-knowledge', difficulty: 'easy', prompt: 'Which is the national animal of Nepal?', options: ['Tiger', 'Cow', 'Elephant', 'Snow leopard'], answerIndex: 1, explanation: 'The cow is Nepal’s national animal.' },
  { id: 'p-gk-2', category: 'general-knowledge', difficulty: 'easy', prompt: 'Traditionally, how many colours are said to be in a rainbow?', options: ['5', '6', '7', '8'], answerIndex: 2, explanation: 'Seven, from red to violet.' },
  { id: 'p-gk-3', category: 'general-knowledge', difficulty: 'medium', prompt: 'Which organisation publishes the Human Development Index?', options: ['World Bank', 'UNDP', 'WHO', 'UNESCO'], answerIndex: 1, explanation: 'The United Nations Development Programme publishes it each year.' },
  { id: 'p-gk-4', category: 'general-knowledge', difficulty: 'hard', prompt: 'In which city is the Nobel Peace Prize awarded?', options: ['Stockholm', 'Oslo', 'Copenhagen', 'Geneva'], answerIndex: 1, explanation: 'The Peace Prize is awarded in Oslo; the others in Stockholm.' },

  // Geography
  { id: 'p-geo-1', category: 'geography', difficulty: 'easy', prompt: 'Which is the largest country in South Asia by area?', options: ['Pakistan', 'India', 'Nepal', 'Bangladesh'], answerIndex: 1, explanation: 'India is the largest in both area and population in South Asia.' },
  { id: 'p-geo-2', category: 'geography', difficulty: 'easy', prompt: 'A compass needle points towards:', options: ['True north exactly', 'Magnetic north', 'The equator', 'The sun'], answerIndex: 1, explanation: 'It follows the Earth’s magnetic field, which is close to but not exactly true north.' },
  { id: 'p-geo-3', category: 'geography', difficulty: 'medium', prompt: 'Which mountain range is traditionally said to separate Europe from Asia?', options: ['The Alps', 'The Urals', 'The Caucasus', 'The Pyrenees'], answerIndex: 1, explanation: 'The Ural mountains run north–south through Russia.' },
  { id: 'p-geo-4', category: 'geography', difficulty: 'hard', prompt: 'Which of these capitals is highest above sea level?', options: ['Kathmandu', 'La Paz', 'Mexico City', 'Addis Ababa'], answerIndex: 1, explanation: 'La Paz sits at about 3,650 m, higher than Kathmandu’s roughly 1,400 m.' },

  // History
  { id: 'p-his-1', category: 'history', difficulty: 'easy', prompt: 'In which year did the Second World War begin?', options: ['1914', '1929', '1939', '1945'], answerIndex: 2, explanation: 'It began in 1939 and ended in 1945.' },
  { id: 'p-his-2', category: 'history', difficulty: 'easy', prompt: 'Who was the first Prime Minister of independent India?', options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Sardar Patel', 'B. R. Ambedkar'], answerIndex: 1, explanation: 'Nehru took office in 1947; Gandhi held no office.' },
  { id: 'p-his-3', category: 'history', difficulty: 'medium', prompt: 'Which Nepali king returned to the throne in 1951, ending Rana rule?', options: ['Prithvi Narayan Shah', 'Tribhuvan', 'Mahendra', 'Birendra'], answerIndex: 1, explanation: 'King Tribhuvan returned in 1951, ending a century of Rana rule.' },
  { id: 'p-his-4', category: 'history', difficulty: 'hard', prompt: 'Which empire was ruled from Constantinople until 1453?', options: ['The Roman Republic', 'The Byzantine Empire', 'The Ottoman Empire', 'The Persian Empire'], answerIndex: 1, explanation: 'The Byzantine Empire fell when the Ottomans took the city in 1453.' },

  // Economics
  { id: 'p-eco-1', category: 'economics', difficulty: 'easy', prompt: 'In economics, "demand" means:', options: ['How much people want something regardless of money', 'Willingness and ability to buy at a price', 'The total supply of a good', 'A government order'], answerIndex: 1, explanation: 'Demand needs both wanting the good and being able to pay for it.' },
  { id: 'p-eco-2', category: 'economics', difficulty: 'easy', prompt: 'A subsidy is:', options: ['A tax on imports', 'A government payment that lowers a cost', 'A bank loan', 'A share of profit'], answerIndex: 1, explanation: 'Subsidies are used to make a good cheaper to produce or buy.' },
  { id: 'p-eco-3', category: 'economics', difficulty: 'medium', prompt: 'Farming is an example of which sector?', options: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'], answerIndex: 0, explanation: 'Primary activities take raw materials from nature.' },
  { id: 'p-eco-4', category: 'economics', difficulty: 'hard', prompt: 'The Gini coefficient measures:', options: ['Inflation', 'Income inequality', 'Unemployment', 'Trade balance'], answerIndex: 1, explanation: '0 means perfect equality and 1 means complete inequality.' },

  // Business
  { id: 'p-bus-1', category: 'business', difficulty: 'easy', prompt: 'A "target market" is:', options: ['A shop’s location', 'The customers a business aims to serve', 'A type of advertisement', 'The price of a product'], answerIndex: 1, explanation: 'The group a business designs its offer for.' },
  { id: 'p-bus-2', category: 'business', difficulty: 'easy', prompt: 'In retail, "stock" means:', options: ['Shares in a company', 'Goods held for sale', 'A supplier’s invoice', 'Money in the bank'], answerIndex: 1, explanation: 'Stock (or inventory) is what a shop has ready to sell.' },
  { id: 'p-bus-3', category: 'business', difficulty: 'medium', prompt: 'Which of these is a variable cost?', options: ['Shop rent', 'Insurance', 'Packaging for each item sold', 'A yearly software licence'], answerIndex: 2, explanation: 'Variable costs rise and fall with the number of items produced.' },
  { id: 'p-bus-4', category: 'business', difficulty: 'hard', prompt: 'On a balance sheet, total assets always equal:', options: ['Profit', 'Liabilities plus equity', 'Revenue', 'Cash'], answerIndex: 1, explanation: 'The accounting equation: assets = liabilities + equity.' },

  // Technology
  { id: 'p-tech-1', category: 'technology', difficulty: 'easy', prompt: 'Which device converts digital signals into sound?', options: ['Microphone', 'Speaker', 'Scanner', 'Keyboard'], answerIndex: 1, explanation: 'A speaker turns electrical signals into sound waves.' },
  { id: 'p-tech-2', category: 'technology', difficulty: 'easy', prompt: 'A QR code is:', options: ['A kind of password', 'A scannable square code holding data', 'A file format for music', 'A type of cable'], answerIndex: 1, explanation: 'A QR code stores text or a link that a camera can read.' },
  { id: 'p-tech-3', category: 'technology', difficulty: 'medium', prompt: '"Open source" software means:', options: ['It is always free of charge', 'Its source code is available to read and modify', 'It cannot be sold', 'It has no licence'], answerIndex: 1, explanation: 'Openness is about the code being available — not about price.' },
  { id: 'p-tech-4', category: 'technology', difficulty: 'hard', prompt: 'Which of these is a symmetric encryption algorithm?', options: ['RSA', 'AES', 'ECDSA', 'Diffie–Hellman'], answerIndex: 1, explanation: 'AES uses one shared key; the others are asymmetric.' },

  // Logical Reasoning
  { id: 'p-log-1', category: 'logical-reasoning', difficulty: 'easy', prompt: 'Which is the odd one out: 2, 4, 6, 9?', options: ['2', '4', '6', '9'], answerIndex: 3, explanation: 'All the others are even numbers.' },
  { id: 'p-log-2', category: 'logical-reasoning', difficulty: 'easy', prompt: 'If today is Monday, what day is tomorrow?', options: ['Sunday', 'Tuesday', 'Wednesday', 'Saturday'], answerIndex: 1, explanation: 'Tuesday follows Monday.' },
  { id: 'p-log-3', category: 'logical-reasoning', difficulty: 'medium', prompt: 'What comes next: 100, 90, 81, 73, ?', options: ['65', '66', '67', '68'], answerIndex: 1, explanation: 'Subtract 10, then 9, then 8, then 7: 73 − 7 = 66.' },
  { id: 'p-log-4', category: 'logical-reasoning', difficulty: 'hard', prompt: '"All birds lay eggs. A penguin is a bird." Therefore:', options: ['A penguin lays eggs', 'A penguin cannot fly', 'All egg-layers are birds', 'Nothing follows'], answerIndex: 0, explanation: 'The conclusion follows directly from the two premises.' },

  // Environmental Science
  { id: 'p-env-1', category: 'environmental-science', difficulty: 'easy', prompt: '"Carbon neutral" means:', options: ['Using no electricity', 'Balancing emissions with removals', 'Burning only coal', 'Having no carbon in your body'], answerIndex: 1, explanation: 'The carbon released is balanced by the carbon taken out.' },
  { id: 'p-env-2', category: 'environmental-science', difficulty: 'easy', prompt: 'Compost is made from:', options: ['Plastic waste', 'Decayed organic matter', 'Crushed stone', 'Used batteries'], answerIndex: 1, explanation: 'Microbes break down food and plant waste into compost.' },
  { id: 'p-env-3', category: 'environmental-science', difficulty: 'medium', prompt: 'Which greenhouse gas is produced mainly by livestock?', options: ['Methane', 'Helium', 'Ozone', 'Carbon monoxide'], answerIndex: 0, explanation: 'Ruminant digestion releases methane, a potent greenhouse gas.' },
  { id: 'p-env-4', category: 'environmental-science', difficulty: 'hard', prompt: '"Biodiversity" refers to:', options: ['The number of trees only', 'The variety of living things in an area', 'The depth of soil', 'Air quality'], answerIndex: 1, explanation: 'It covers the variety of species, genes and ecosystems.' },

  // Astronomy
  { id: 'p-ast-1', category: 'astronomy', difficulty: 'easy', prompt: 'Which planet is closest to Earth in size?', options: ['Mars', 'Venus', 'Neptune', 'Mercury'], answerIndex: 1, explanation: 'Venus is almost the same size as Earth.' },
  { id: 'p-ast-2', category: 'astronomy', difficulty: 'easy', prompt: 'A "shooting star" is really:', options: ['A star falling', 'A meteor burning up in the atmosphere', 'A comet', 'An aeroplane light'], answerIndex: 1, explanation: 'Dust and rock burn up as they hit the atmosphere.' },
  { id: 'p-ast-3', category: 'astronomy', difficulty: 'medium', prompt: 'The Great Red Spot is a storm on which planet?', options: ['Mars', 'Saturn', 'Jupiter', 'Uranus'], answerIndex: 2, explanation: 'It is a giant storm in Jupiter’s atmosphere.' },
  { id: 'p-ast-4', category: 'astronomy', difficulty: 'hard', prompt: 'A main-sequence star like the Sun is powered mainly by:', options: ['Burning oxygen', 'Hydrogen fusion', 'Fission of uranium', 'Gravity alone'], answerIndex: 1, explanation: 'Hydrogen nuclei fuse into helium, releasing energy.' },
  // ── Added so the requested round length can be honoured ────────────────
  // Each category previously held four questions, which is why asking for
  // five delivered four. These are original questions for Grades 6–10.
  { id: 'p-math-5', category: 'mathematics', difficulty: 'easy', prompt: 'What is 3/4 as a percentage?', options: ['34%', '75%', '43%', '70%'], answerIndex: 1, explanation: '3 ÷ 4 = 0.75, and 0.75 × 100 = 75%.' },
  { id: 'p-math-6', category: 'mathematics', difficulty: 'medium', prompt: 'The area of a circle with radius 7 cm is closest to:', options: ['44 cm²', '154 cm²', '49 cm²', '22 cm²'], answerIndex: 1, explanation: 'Area = πr² ≈ 3.14 × 49 ≈ 154 cm². Using 2πr gives the circumference instead.' },
  { id: 'p-math-7', category: 'mathematics', difficulty: 'medium', prompt: 'Solve for x: 3x − 7 = 14.', options: ['5', '7', '21', '3'], answerIndex: 1, explanation: 'Add 7 to both sides: 3x = 21, so x = 7.' },
  { id: 'p-math-8', category: 'mathematics', difficulty: 'medium', prompt: 'What is the mean of 4, 8, 10 and 18?', options: ['8', '9', '10', '12'], answerIndex: 2, explanation: 'Sum = 40, and 40 ÷ 4 = 10. The median is 9 — different from the mean here.' },
  { id: 'p-math-9', category: 'mathematics', difficulty: 'hard', prompt: 'A train covers 180 km in 2.5 hours. Its average speed is:', options: ['60 km/h', '72 km/h', '75 km/h', '90 km/h'], answerIndex: 1, explanation: '180 ÷ 2.5 = 72 km/h. Dividing by 2 then adding a quarter is the usual slip.' },
  { id: 'p-math-10', category: 'mathematics', difficulty: 'hard', prompt: 'If a triangle has sides 6, 8 and 10 cm, it is:', options: ['Acute-angled', 'Right-angled', 'Obtuse-angled', 'Equilateral'], answerIndex: 1, explanation: '6² + 8² = 36 + 64 = 100 = 10², which is the converse of Pythagoras: a right angle.' },

  { id: 'p-sci-5', category: 'biology', difficulty: 'easy', prompt: 'Which gas do plants take in during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answerIndex: 2, explanation: 'Plants take in CO₂ and release O₂. Respiration is the reverse.' },
  { id: 'p-sci-6', category: 'chemistry', difficulty: 'easy', prompt: 'What is the chemical symbol for table salt?', options: ['NaCl', 'KCl', 'CaCO₃', 'H₂O'], answerIndex: 0, explanation: 'Table salt is sodium chloride, NaCl.' },
  { id: 'p-sci-7', category: 'physics', difficulty: 'medium', prompt: 'A body moves 10 m north then 10 m south. Its displacement is:', options: ['20 m', '10 m', '0 m', '5 m'], answerIndex: 2, explanation: 'Distance travelled is 20 m, but displacement is net change in position: zero.' },
  { id: 'p-sci-8', category: 'biology', difficulty: 'medium', prompt: 'Which part of the human eye controls how much light enters?', options: ['Retina', 'Iris', 'Cornea', 'Optic nerve'], answerIndex: 1, explanation: 'The iris widens or narrows the pupil to adjust the light reaching the retina.' },
  { id: 'p-sci-9', category: 'physics', difficulty: 'hard', prompt: 'In a series circuit with two identical bulbs, if one bulb breaks the other:', options: ['Glows brighter', 'Stays the same', 'Goes out', 'Flickers'], answerIndex: 2, explanation: 'A series circuit has one path, so breaking it stops current everywhere.' },
  { id: 'p-sci-10', category: 'chemistry', difficulty: 'hard', prompt: 'The pH of a neutral solution at 25 °C is:', options: ['0', '7', '14', '1'], answerIndex: 1, explanation: 'Pure water is neutral at pH 7. Below 7 is acidic, above 7 is basic.' },

  { id: 'p-eng-5', category: 'english', difficulty: 'easy', prompt: 'Choose the correct plural of "child".', options: ['Childs', 'Childes', 'Children', 'Childrens'], answerIndex: 2, explanation: 'Child → children is an irregular plural. "Childrens" is never correct.' },
  { id: 'p-eng-6', category: 'english', difficulty: 'easy', prompt: 'Which sentence is punctuated correctly?', options: ['Its raining, outside.', 'It\'s raining outside.', 'Its raining outside.', 'It\'s raining, outside.'], answerIndex: 1, explanation: '"It\'s" means "it is". "Its" is possessive, and no comma is needed here.' },
  { id: 'p-eng-7', category: 'english', difficulty: 'medium', prompt: 'The passive form of "The teacher marked the papers" is:', options: ['The papers marked the teacher.', 'The papers were marked by the teacher.', 'The teacher was marked by the papers.', 'The papers are marking the teacher.'], answerIndex: 1, explanation: 'The object becomes the subject: papers + were marked + by the teacher.' },
  { id: 'p-eng-8', category: 'english', difficulty: 'medium', prompt: 'In "she sang beautifully", the word "beautifully" is a(n):', options: ['Adjective', 'Adverb', 'Noun', 'Conjunction'], answerIndex: 1, explanation: 'It modifies the verb "sang", so it is an adverb. It answers "how".' },
  { id: 'p-eng-9', category: 'english', difficulty: 'hard', prompt: '"Benevolent" most nearly means:', options: ['Cruel', 'Kind', 'Careless', 'Wealthy'], answerIndex: 1, explanation: 'Benevolent means well-meaning and generous; its opposite is malevolent.' },
  { id: 'p-eng-10', category: 'english', difficulty: 'hard', prompt: 'Choose the sentence with no error.', options: ['Neither of the boys were ready.', 'Neither of the boys was ready.', 'Neither of the boy was ready.', 'Neither boys were ready.'], answerIndex: 1, explanation: '"Neither" is singular, so it takes "was". The plural noun after "of" does not change that.' },


  { id: 'p-cs-5', category: 'computer-science', difficulty: 'easy', prompt: 'In HTML, which tag creates the largest heading?', options: ['<h6>', '<h1>', '<head>', '<big>'], answerIndex: 1, explanation: 'h1 is the highest-level heading; h6 is the lowest.' },
  { id: 'p-cs-6', category: 'computer-science', difficulty: 'easy', prompt: 'Which of these stores data permanently when the power is off?', options: ['RAM', 'Cache', 'SSD', 'Registers'], answerIndex: 2, explanation: 'RAM, cache and registers lose their contents without power. An SSD keeps data.' },
  { id: 'p-cs-7', category: 'computer-science', difficulty: 'medium', prompt: 'What does a while loop check before each pass?', options: ['The loop body', 'A condition', 'The output', 'The variable name'], answerIndex: 1, explanation: 'A while loop tests its condition first, and stops when the condition is false.' },
  { id: 'p-cs-8', category: 'computer-science', difficulty: 'medium', prompt: 'An algorithm with a runtime of O(n²) on 1,000 items does roughly how much work?', options: ['1,000 steps', '10,000 steps', '1,000,000 steps', '2,000 steps'], answerIndex: 2, explanation: 'n² = 1,000 × 1,000 = 1,000,000. This is why quadratic algorithms slow down sharply.' },
  { id: 'p-cs-9', category: 'computer-science', difficulty: 'hard', prompt: 'Which protocol is used to load a web page over a secure connection?', options: ['FTP', 'HTTPS', 'SMTP', 'TCP'], answerIndex: 1, explanation: 'HTTPS is HTTP sent over TLS, which encrypts the traffic between browser and server.' },
  { id: 'p-cs-10', category: 'computer-science', difficulty: 'hard', prompt: 'A stack follows which order?', options: ['First in, first out', 'Last in, first out', 'Random order', 'Sorted order'], answerIndex: 1, explanation: 'A stack pops the most recently pushed item: last in, first out. A queue is first in, first out.' },

  { id: 'p-soc-1', category: 'geography', difficulty: 'easy', prompt: 'What is the capital city of Nepal?', options: ['Pokhara', 'Kathmandu', 'Lalitpur', 'Biratnagar'], answerIndex: 1, explanation: 'Kathmandu is the capital and largest city of Nepal.' },
  { id: 'p-soc-2', category: 'geography', difficulty: 'easy', prompt: 'How many provinces does Nepal have?', options: ['5', '6', '7', '9'], answerIndex: 2, explanation: 'The 2015 constitution created seven provinces, replacing the earlier five development regions.' },
  { id: 'p-soc-3', category: 'geography', difficulty: 'medium', prompt: 'Mount Everest lies on the border between Nepal and:', options: ['India', 'Bhutan', 'China', 'Bangladesh'], answerIndex: 2, explanation: 'It sits on the Nepal–China (Tibet) border, which is why both countries record expeditions from their side.' },
  { id: 'p-soc-4', category: 'geography', difficulty: 'medium', prompt: 'Which body makes federal laws in Nepal?', options: ['The Supreme Court', 'The Federal Parliament', 'The Election Commission', 'The Council of Ministers'], answerIndex: 1, explanation: 'The Federal Parliament (House of Representatives and National Assembly) passes federal law.' },
  { id: 'p-soc-5', category: 'general-knowledge', difficulty: 'hard', prompt: 'The Terai region is best described as:', options: ['High mountains in the north', 'Fertile plains in the south', 'A dry desert plateau', 'A coastal strip'], answerIndex: 1, explanation: 'The Terai is the low, fertile southern plain bordering India, and Nepal\'s main farming belt.' },
  { id: 'p-soc-6', category: 'general-knowledge', difficulty: 'hard', prompt: 'Federalism in Nepal means that power is:', options: ['Held only in Kathmandu', 'Shared between federal, provincial and local governments', 'Given only to the courts', 'Chosen by the army'], answerIndex: 1, explanation: 'The 2015 constitution divides power across three tiers: federal, seven provinces and 753 local units.' },

  { id: 'p-mathb-1', category: 'mathematics', difficulty: 'easy', prompt: 'If f(x) = 2x + 1, what is f(3)?', options: ['5', '6', '7', '8'], answerIndex: 2, explanation: 'Substitute x = 3: 2(3) + 1 = 7.' },
  { id: 'p-mathb-2', category: 'mathematics', difficulty: 'easy', prompt: 'What is the value of sin 30°?', options: ['1', '1/2', '√3/2', '0'], answerIndex: 1, explanation: 'sin 30° = 0.5. The pair to remember is sin 30° = cos 60° = 1/2.' },
  { id: 'p-mathb-3', category: 'mathematics', difficulty: 'medium', prompt: 'The slope of the line through (1, 2) and (4, 11) is:', options: ['2', '3', '9', '1/3'], answerIndex: 1, explanation: '(11 − 2) ÷ (4 − 1) = 9 ÷ 3 = 3. Slope is change in y over change in x.' },
  { id: 'p-mathb-4', category: 'mathematics', difficulty: 'medium', prompt: 'If x + y = 10 and x − y = 4, then x equals:', options: ['3', '6', '7', '14'], answerIndex: 2, explanation: 'Adding the equations gives 2x = 14, so x = 7 and y = 3.' },
  { id: 'p-mathb-5', category: 'mathematics', difficulty: 'hard', prompt: 'The sum of the first 10 positive integers is:', options: ['45', '50', '55', '100'], answerIndex: 2, explanation: 'n(n+1)/2 = 10 × 11 ÷ 2 = 55.' },
  { id: 'p-mathb-6', category: 'mathematics', difficulty: 'hard', prompt: 'For the quadratic x² − 5x + 6 = 0, the roots are:', options: ['1 and 6', '2 and 3', '−2 and −3', '5 and 6'], answerIndex: 1, explanation: 'It factorises as (x − 2)(x − 3) = 0, so x = 2 or x = 3.' },

  { id: 'p-phy-5', category: 'physics', difficulty: 'easy', prompt: 'What unit measures force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], answerIndex: 1, explanation: 'Force is measured in newtons. A joule is energy, a watt is power and a pascal is pressure.' },
  { id: 'p-phy-6', category: 'physics', difficulty: 'easy', prompt: 'Light travels fastest through:', options: ['Water', 'Glass', 'A vacuum', 'Air'], answerIndex: 2, explanation: 'Nothing is faster than light in a vacuum; any medium slows it down.' },
  { id: 'p-phy-7', category: 'physics', difficulty: 'medium', prompt: 'A 2 kg object is pushed with 10 N. Its acceleration is:', options: ['2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'], answerIndex: 1, explanation: 'F = ma, so a = 10 ÷ 2 = 5 m/s².' },
  { id: 'p-phy-8', category: 'physics', difficulty: 'medium', prompt: 'Which is a vector quantity?', options: ['Mass', 'Speed', 'Velocity', 'Temperature'], answerIndex: 2, explanation: 'Velocity has both size and direction. Speed has only size, so it is a scalar.' },
  { id: 'p-phy-9', category: 'physics', difficulty: 'hard', prompt: 'In a series circuit, the current at every point is:', options: ['Different', 'The same', 'Zero', 'Doubled'], answerIndex: 1, explanation: 'Charge cannot pile up in a single path, so the current is the same everywhere.' },
  { id: 'p-phy-10', category: 'physics', difficulty: 'hard', prompt: 'The energy stored in a raised object is:', options: ['Kinetic', 'Potential', 'Thermal', 'Chemical'], answerIndex: 1, explanation: 'Height against gravity stores gravitational potential energy, which becomes kinetic when it falls.' },

  { id: 'p-chem-5', category: 'chemistry', difficulty: 'easy', prompt: 'Water is made of hydrogen and:', options: ['Carbon', 'Oxygen', 'Nitrogen', 'Chlorine'], answerIndex: 1, explanation: 'H₂O: two hydrogen atoms and one oxygen atom.' },
  { id: 'p-chem-6', category: 'chemistry', difficulty: 'easy', prompt: 'Which state of matter has a fixed volume but no fixed shape?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], answerIndex: 1, explanation: 'A liquid keeps its volume but takes the shape of its container.' },
  { id: 'p-chem-7', category: 'chemistry', difficulty: 'medium', prompt: 'In a chemical equation, a catalyst:', options: ['Is used up', 'Speeds up the reaction', 'Becomes a product', 'Stops the reaction'], answerIndex: 1, explanation: 'A catalyst lowers the activation energy and is recovered unchanged at the end.' },
  { id: 'p-chem-8', category: 'chemistry', difficulty: 'medium', prompt: 'The chemical symbol for iron is:', options: ['Ir', 'Fe', 'In', 'I'], answerIndex: 1, explanation: 'Fe comes from the Latin ferrum. Ir is iridium.' },
  { id: 'p-chem-9', category: 'chemistry', difficulty: 'hard', prompt: 'An acid reacts with a base to form:', options: ['Only a gas', 'A salt and water', 'Only water', 'A metal'], answerIndex: 1, explanation: 'This is neutralisation: acid + base → salt + water.' },
  { id: 'p-chem-10', category: 'chemistry', difficulty: 'hard', prompt: 'How many atoms are in one molecule of CO₂?', options: ['1', '2', '3', '4'], answerIndex: 2, explanation: 'One carbon and two oxygens: three atoms in total.' },

  { id: 'p-bio-5', category: 'biology', difficulty: 'easy', prompt: 'Which organ pumps blood around the body?', options: ['Liver', 'Heart', 'Lungs', 'Kidney'], answerIndex: 1, explanation: 'The heart is a muscular pump; lungs oxygenate blood rather than circulate it.' },
  { id: 'p-bio-6', category: 'biology', difficulty: 'easy', prompt: 'The basic unit of all living things is the:', options: ['Atom', 'Cell', 'Organ', 'Tissue'], answerIndex: 1, explanation: 'Cells are the smallest unit that can carry out life processes.' },
  { id: 'p-bio-7', category: 'biology', difficulty: 'medium', prompt: 'Where does most nutrient absorption happen?', options: ['Stomach', 'Large intestine', 'Small intestine', 'Oesophagus'], answerIndex: 2, explanation: 'Villi in the small intestine give a huge surface area for absorption.' },
  { id: 'p-bio-8', category: 'biology', difficulty: 'medium', prompt: 'Which blood cells carry oxygen?', options: ['White blood cells', 'Red blood cells', 'Platelets', 'Plasma cells'], answerIndex: 1, explanation: 'Haemoglobin inside red blood cells binds oxygen. White cells fight infection.' },
  { id: 'p-bio-9', category: 'biology', difficulty: 'hard', prompt: 'In genetics, a dominant allele is one that:', options: ['Is always harmful', 'Shows even when only one copy is present', 'Only shows with two copies', 'Skips a generation'], answerIndex: 1, explanation: 'One copy of a dominant allele is enough to show the trait; recessive traits need two.' },
  { id: 'p-bio-10', category: 'biology', difficulty: 'hard', prompt: 'Photosynthesis converts light energy into:', options: ['Sound energy', 'Chemical energy', 'Electrical energy', 'Nuclear energy'], answerIndex: 1, explanation: 'Light energy is stored as chemical energy in glucose.' },

  // ── Second top-up: every category now holds at least eight questions ──────
  // A five-question round is the default, and the biggest categories hold
  // sixteen, so eight is the floor that keeps the default round full.
  { id: 'p-ast-5', category: 'astronomy', difficulty: 'easy', prompt: 'Which planet is called the Red Planet?', options: ['Venus', 'Mars', 'Mercury', 'Jupiter'], answerIndex: 1, explanation: 'Iron-rich dust on Mars has oxidised, which is what gives the surface its red-brown colour.' },
  { id: 'p-ast-6', category: 'astronomy', difficulty: 'easy', prompt: 'What keeps the planets in orbit around the Sun?', options: ['Magnetism', 'The Sun’s gravity', 'Friction', 'Air pressure'], answerIndex: 1, explanation: 'The Sun’s gravity pulls the planets inward; their sideways speed keeps them from falling in.' },
  { id: 'p-ast-7', category: 'astronomy', difficulty: 'medium', prompt: 'About how long does sunlight take to reach Earth?', options: ['8 seconds', '8 minutes', '8 hours', '8 days'], answerIndex: 1, explanation: 'Light travels about 150 million km from the Sun to Earth in roughly 8 minutes 20 seconds.' },
  { id: 'p-ast-8', category: 'astronomy', difficulty: 'medium', prompt: 'A light year is a measure of:', options: ['Time', 'Brightness', 'Distance', 'Mass'], answerIndex: 2, explanation: 'It is the distance light travels in one year — about 9.5 trillion km.' },

  { id: 'p-bus-5', category: 'business', difficulty: 'easy', prompt: 'In business, profit is:', options: ['Money taken in from sales', 'Revenue minus costs', 'The money owed to suppliers', 'The value of the shop'], answerIndex: 1, explanation: 'Revenue is the total from sales; profit is what remains once costs are taken away.' },
  { id: 'p-bus-6', category: 'business', difficulty: 'easy', prompt: 'A sole proprietorship is a business:', options: ['Owned by one person', 'Owned by the government', 'Owned by shareholders', 'Owned by a charity'], answerIndex: 0, explanation: 'One owner keeps the profit — and carries the losses and debts personally.' },
  { id: 'p-bus-7', category: 'business', difficulty: 'medium', prompt: 'A shop’s monthly rent is an example of:', options: ['A variable cost', 'A fixed cost', 'A revenue', 'A discount'], answerIndex: 1, explanation: 'Rent stays the same whether the shop sells one item or a hundred, which makes it a fixed cost.' },
  { id: 'p-bus-8', category: 'business', difficulty: 'hard', prompt: 'A stall sells 200 items at Rs 50 each. Total costs are Rs 8,000. The profit is:', options: ['Rs 1,000', 'Rs 2,000', 'Rs 8,000', 'Rs 10,000'], answerIndex: 1, explanation: 'Revenue is 200 × 50 = Rs 10,000. Profit = 10,000 − 8,000 = Rs 2,000.' },

  { id: 'p-eco-5', category: 'economics', difficulty: 'easy', prompt: 'Economics mainly studies:', options: ['Only money and banks', 'How people use limited resources', 'How governments win elections', 'The history of trade routes'], answerIndex: 1, explanation: 'It looks at choices — individuals, firms and governments — when resources are scarce.' },
  { id: 'p-eco-6', category: 'economics', difficulty: 'easy', prompt: 'Opportunity cost is best described as:', options: ['The money a choice costs', 'The value of the next best choice given up', 'The tax on a purchase', 'The price after a discount'], answerIndex: 1, explanation: 'Every choice has a cost in the alternative you could have had instead.' },
  { id: 'p-eco-7', category: 'economics', difficulty: 'medium', prompt: 'When demand for a product is greater than supply, its price usually:', options: ['Falls', 'Rises', 'Stays fixed', 'Disappears'], answerIndex: 1, explanation: 'More buyers than goods lets sellers charge more; price is what brings supply and demand back together.' },
  { id: 'p-eco-8', category: 'economics', difficulty: 'medium', prompt: 'Which one is a need rather than a want?', options: ['Clean drinking water', 'A new video game', 'A branded jacket', 'A holiday trip'], answerIndex: 0, explanation: 'Needs are required to live and work; wants make life better but can be postponed.' },

  { id: 'p-env-5', category: 'environmental-science', difficulty: 'easy', prompt: 'Which gas is the main contributor to human-caused global warming?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], answerIndex: 1, explanation: 'Burning coal, oil and gas releases CO₂, which traps heat in the atmosphere.' },
  { id: 'p-env-6', category: 'environmental-science', difficulty: 'easy', prompt: 'A renewable energy source is one that:', options: ['Never runs out of power', 'Is naturally replaced about as fast as we use it', 'Costs nothing to build', 'Produces no waste at all'], answerIndex: 1, explanation: 'Sunlight, wind and flowing water keep coming; coal and oil do not.' },
  { id: 'p-env-7', category: 'environmental-science', difficulty: 'medium', prompt: 'Biodiversity means:', options: ['The total rainfall of a region', 'The variety of living species in an area', 'The depth of a river system', 'The age of a forest'], answerIndex: 1, explanation: 'It covers the range of species, their genes and the ecosystems they form.' },
  { id: 'p-env-8', category: 'environmental-science', difficulty: 'medium', prompt: 'Which habit reduces household waste most?', options: ['Burning plastic in the yard', 'Reusing containers and recycling what you can', 'Buying more packaged food', 'Pouring chemicals down the drain'], answerIndex: 1, explanation: 'Reuse comes before recycling: the least wasteful item is the one you never needed to buy.' },

  { id: 'p-hist-5', category: 'history', difficulty: 'easy', prompt: 'In which year did the Berlin Wall fall?', options: ['1945', '1961', '1989', '1991'], answerIndex: 2, explanation: 'The wall was opened on 9 November 1989, and Germany was reunified the following year.' },
  { id: 'p-hist-6', category: 'history', difficulty: 'easy', prompt: 'The Industrial Revolution began in the eighteenth century in:', options: ['Britain', 'Japan', 'Brazil', 'Egypt'], answerIndex: 0, explanation: 'Textile mills, coal and steam engines first transformed Britain, then spread across Europe.' },
  { id: 'p-hist-7', category: 'history', difficulty: 'medium', prompt: 'Which 1948 document set out rights held by all people?', options: ['The Magna Carta', 'The Universal Declaration of Human Rights', 'The Treaty of Versailles', 'The Geneva Convention'], answerIndex: 1, explanation: 'The United Nations General Assembly adopted it in Paris on 10 December 1948.' },
  { id: 'p-hist-8', category: 'history', difficulty: 'medium', prompt: 'The Silk Road was:', options: ['A single paved road in China', 'A network of trade routes between Europe and Asia', 'A sea route around Africa', 'A railway built in the 1800s'], answerIndex: 1, explanation: 'Goods, ideas and technologies moved along many linked routes across Central Asia for centuries.' },

  { id: 'p-lr-5', category: 'logical-reasoning', difficulty: 'easy', prompt: 'What comes next: 2, 4, 8, 16, … ?', options: ['18', '24', '32', '64'], answerIndex: 2, explanation: 'Each number doubles, so 16 × 2 = 32.' },
  { id: 'p-lr-6', category: 'logical-reasoning', difficulty: 'easy', prompt: 'All birds have feathers. A sparrow is a bird. Therefore:', options: ['All feathered animals are birds', 'The sparrow has feathers', 'Sparrows can fly', 'Feathers are warm'], answerIndex: 1, explanation: 'That is valid deduction: the rule applies to every member of the group.' },
  { id: 'p-lr-7', category: 'logical-reasoning', difficulty: 'medium', prompt: 'The contrapositive of “If it rains, the ground gets wet” is:', options: ['If the ground is wet, it rained', 'If it does not rain, the ground stays dry', 'If the ground is not wet, it did not rain', 'It rains and the ground gets wet'], answerIndex: 2, explanation: 'Swap the two parts and negate both. That form is always logically equivalent to the original.' },
  { id: 'p-lr-8', category: 'logical-reasoning', difficulty: 'hard', prompt: 'A bat and a ball cost Rs 110 together. The bat costs Rs 100 more than the ball. The ball costs:', options: ['Rs 5', 'Rs 10', 'Rs 11', 'Rs 55'], answerIndex: 0, explanation: 'If the ball is Rs 5, the bat is Rs 105, and 105 + 5 = 110. Rs 10 would make the difference only Rs 90.' },

  { id: 'p-tech-5', category: 'technology', difficulty: 'easy', prompt: 'What does URL stand for?', options: ['Uniform Resource Locator', 'Universal Reading Link', 'United Router Line', 'Uploaded Reference List'], answerIndex: 0, explanation: 'It is the address that tells a browser where a page lives.' },
  { id: 'p-tech-6', category: 'technology', difficulty: 'easy', prompt: 'Which habit makes an online account hardest to break into?', options: ['Reusing one password everywhere', 'A long unique password plus two-factor authentication', 'Changing your password to your birthday', 'Sharing the password with a friend'], answerIndex: 1, explanation: 'Length, uniqueness and a second factor each block a different kind of attack.' },
  { id: 'p-tech-7', category: 'technology', difficulty: 'medium', prompt: 'What does the S in HTTPS add?', options: ['Faster loading', 'Encryption between browser and server', 'A free domain name', 'Unlimited storage'], answerIndex: 1, explanation: 'Traffic is encrypted with TLS, so it cannot be read or changed in transit.' },
  { id: 'p-tech-8', category: 'technology', difficulty: 'medium', prompt: 'In computing, “the cloud” means:', options: ['Weather forecasting software', 'Services and storage on remote servers reached over the internet', 'A type of screen display', 'Software installed only on your own device'], answerIndex: 1, explanation: 'The work happens on someone else’s computers; your device is only the window to it.' },

  { id: 'p-gk-5', category: 'general-knowledge', difficulty: 'easy', prompt: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answerIndex: 2, explanation: 'The Pacific covers about a third of the planet’s surface.' },
  { id: 'p-gk-6', category: 'general-knowledge', difficulty: 'medium', prompt: 'Mount Everest sits on the border of Nepal and:', options: ['India', 'China', 'Bhutan', 'Pakistan'], answerIndex: 1, explanation: 'The summit ridge forms the border with the Tibet Autonomous Region of China.' },
];

export function practiceFor(category: ArenaCategory, limit: number): PracticeQuestion[] {
  const list = PRACTICE_QUESTIONS.filter((q) => q.category === category);
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(limit, shuffled.length));
}
