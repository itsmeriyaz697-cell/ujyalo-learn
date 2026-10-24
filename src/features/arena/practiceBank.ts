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
];

export function practiceFor(category: ArenaCategory, limit: number): PracticeQuestion[] {
  const list = PRACTICE_QUESTIONS.filter((q) => q.category === category);
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(limit, shuffled.length));
}
