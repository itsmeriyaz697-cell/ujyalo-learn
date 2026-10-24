/**
 * Global Quiz Arena — the question bank.
 *
 * SERVER ONLY. This file must never be imported by anything under `src/`.
 * It holds the answer key, and the whole point of the API boundary is that a
 * student with dev tools open cannot read it.
 *
 * Why curated questions instead of AI-generated ones: points from this bank
 * feed a public leaderboard. The AI tutor elsewhere in the app is clearly
 * labelled as AI content because it can be wrong; a leaderboard cannot be built
 * on answers that might be wrong. These 315 questions are written and checked by
 * hand, one answer key each, and every one carries an explanation so a wrong
 * answer still teaches something.
 *
 * Coverage: 15 categories × 3 difficulties × 7 questions. Seven per cell means
 * a 20-question quiz can be filled from one category without repeating a
 * question, and a repeat visitor on another day sees a different subset.
 */
import {
  ARENA_CATEGORIES,
  type ArenaCategory,
  type Difficulty,
} from '../../../shared/arena/scoring.js';

/** [difficulty, prompt, four options, index of the correct one, explanation] */
type Row = [Difficulty, string, [string, string, string, string], number, string];

const RAW: Record<ArenaCategory, Row[]> = {
  mathematics: [
    ['easy', 'What is 7 × 8?', ['54', '56', '58', '64'], 1, '7 × 8 = 56.'],
    ['easy', 'What is 15% of 200?', ['15', '20', '30', '35'], 2, '10% of 200 is 20, and 5% is 10, so 15% is 30.'],
    ['easy', 'A triangle with all three sides equal is called:', ['Isosceles', 'Scalene', 'Equilateral', 'Right-angled'], 2, 'Equal sides means equilateral; equal angles follow automatically at 60° each.'],
    ['easy', 'What is 3² + 4²?', ['7', '12', '25', '49'], 2, '9 + 16 = 25.'],
    ['easy', 'Simplify 2x + 3x.', ['5x', '6x', '5x²', 'x⁵'], 0, 'Like terms add their coefficients: 2 + 3 = 5, so 5x.'],
    ['easy', 'How many minutes are there in 2 hours?', ['90', '100', '120', '140'], 2, '2 × 60 = 120 minutes.'],
    ['easy', 'What is the next prime number after 7?', ['8', '9', '10', '11'], 3, '8, 9 and 10 are all divisible by something other than 1 and themselves; 11 is prime.'],
    ['medium', 'Solve 2x + 6 = 20.', ['x = 5', 'x = 7', 'x = 10', 'x = 13'], 1, 'Subtract 6 from both sides: 2x = 14, so x = 7.'],
    ['medium', 'The area of a circle with radius 5 cm is about:', ['31.4 cm²', '50 cm²', '78.5 cm²', '157 cm²'], 2, 'Area = πr² = 3.14 × 25 ≈ 78.5 cm².'],
    ['medium', 'The interior angles of a quadrilateral add up to:', ['180°', '270°', '360°', '540°'], 2, 'A quadrilateral splits into two triangles, and 2 × 180° = 360°.'],
    ['medium', 'What is √144?', ['11', '12', '14', '16'], 1, '12 × 12 = 144.'],
    ['medium', 'A train covers 120 km in 2 hours. Its average speed is:', ['40 km/h', '60 km/h', '80 km/h', '240 km/h'], 1, 'Speed = distance ÷ time = 120 ÷ 2 = 60 km/h.'],
    ['medium', 'Write 0.25 as a fraction in its simplest form.', ['1/2', '1/3', '1/4', '2/5'], 2, '0.25 is 25/100, which simplifies to 1/4.'],
    ['medium', 'Factorise x² − 9.', ['(x − 3)(x + 3)', '(x − 9)(x + 1)', '(x − 3)²', '(x + 9)(x − 1)'], 0, 'This is a difference of two squares: a² − b² = (a − b)(a + b).'],
    ['hard', 'Solve 3(x − 2) = 2x + 5.', ['x = 3', 'x = 5', 'x = 7', 'x = 11'], 3, 'Expand: 3x − 6 = 2x + 5. Subtract 2x: x − 6 = 5, so x = 11.'],
    ['hard', 'What is the value of sin 30°?', ['0', '0.5', '0.707', '1'], 1, 'sin 30° = 1/2 exactly — one of the standard angles worth memorising.'],
    ['hard', 'What is the sum of the first 20 positive whole numbers?', ['190', '200', '210', '420'], 2, 'n(n + 1)/2 = 20 × 21 ÷ 2 = 210.'],
    ['hard', 'If f(x) = 2x² − 3, what is f(3)?', ['9', '12', '15', '18'], 2, 'f(3) = 2(9) − 3 = 18 − 3 = 15.'],
    ['hard', 'A right triangle has legs of 6 cm and 8 cm. Its hypotenuse is:', ['9 cm', '10 cm', '12 cm', '14 cm'], 1, 'By Pythagoras: √(36 + 64) = √100 = 10 cm.'],
    ['hard', 'What is log₂ 32?', ['4', '5', '6', '16'], 1, '2⁵ = 32, so log₂ 32 = 5.'],
    ['hard', 'In a class of 40, 25 study Maths, 20 study Science and 10 study both. How many study neither?', ['5', '10', '15', '20'], 0, '25 + 20 − 10 = 35 study at least one, so 40 − 35 = 5 study neither.'],
  ],

  physics: [
    ['easy', 'What is the SI unit of force?', ['Joule', 'Newton', 'Watt', 'Pascal'], 1, 'Force is measured in newtons, named after Isaac Newton.'],
    ['easy', 'Light travels at roughly:', ['3 × 10⁵ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '300 m/s'], 1, 'About 300,000 km per second, or 3 × 10⁸ m/s in a vacuum.'],
    ['easy', 'Which force pulls objects towards the Earth?', ['Magnetism', 'Friction', 'Gravity', 'Tension'], 2, 'Gravity is the attraction between masses — the Earth is much more massive than you are.'],
    ['easy', 'Which instrument measures temperature?', ['Barometer', 'Thermometer', 'Hygrometer', 'Ammeter'], 1, 'A barometer measures pressure, a hygrometer humidity, an ammeter current.'],
    ['easy', 'Which travels faster through air?', ['Sound', 'Light', 'They are equal', 'Neither travels through air'], 1, 'Light is roughly a million times faster than sound in air — which is why lightning is seen before thunder is heard.'],
    ['easy', 'The SI unit of electric current is the:', ['Volt', 'Ohm', 'Ampere', 'Coulomb'], 2, 'Current is measured in amperes; volts measure potential difference and ohms resistance.'],
    ['easy', 'A push or a pull on an object is called a:', ['Force', 'Mass', 'Momentum', 'Pressure'], 0, 'Force changes or tends to change an object\'s motion.'],
    ['medium', "Newton's third law says that every action has:", ['No effect', 'An equal and opposite reaction', 'A larger reaction', 'A reaction only in space'], 1, 'Forces come in pairs of equal size acting on opposite bodies.'],
    ['medium', 'Energy stored in a stretched spring is:', ['Kinetic energy', 'Elastic potential energy', 'Thermal energy', 'Chemical energy'], 1, 'Work done stretching it is stored as elastic potential energy and released when it springs back.'],
    ['medium', 'The SI unit of power is the:', ['Joule', 'Newton', 'Watt', 'Second'], 2, 'One watt is one joule of energy transferred per second.'],
    ['medium', 'Acceleration due to gravity near the Earth\'s surface is about:', ['1.6 m/s²', '9.8 m/s²', '19.6 m/s²', '98 m/s²'], 1, 'About 9.8 m/s² — an object speeds up by roughly 9.8 m/s every second it falls.'],
    ['medium', 'A body moving in a circle at constant speed has a changing:', ['Mass', 'Velocity', 'Weight', 'Temperature'], 1, 'Velocity includes direction; going round a circle changes direction continuously, so velocity changes.'],
    ['medium', 'Which of these is a vector quantity?', ['Speed', 'Mass', 'Velocity', 'Temperature'], 2, 'Velocity has both size and direction; speed, mass and temperature have size only.'],
    ['medium', "Ohm's law is written as:", ['V = IR', 'V = I/R', 'I = VR', 'R = VI'], 0, 'Voltage equals current multiplied by resistance.'],
    ['hard', 'The kinetic energy of a moving object is given by:', ['mv', '½mv²', 'mgh', 'Fd'], 1, 'Kinetic energy = ½ × mass × velocity squared.'],
    ['hard', 'A force is applied at right angles to an object\'s motion. The work done is:', ['Maximum', 'Zero', 'Negative', 'Equal to the force'], 1, 'Work = force × displacement in the direction of the force. Perpendicular means no movement along the force, so work is zero.'],
    ['hard', 'Two 6 Ω resistors are connected in parallel. The total resistance is:', ['12 Ω', '6 Ω', '3 Ω', '1.5 Ω'], 2, '1/R = 1/6 + 1/6 = 2/6, so R = 3 Ω.'],
    ['hard', 'The SI unit of momentum is:', ['kg·m/s', 'N/m', 'kg/m²', 'J·s'], 0, 'Momentum = mass × velocity, so kilograms times metres per second.'],
    ['hard', 'A 2 kg object accelerates at 3 m/s². The net force on it is:', ['1.5 N', '5 N', '6 N', '12 N'], 2, 'F = ma = 2 × 3 = 6 N.'],
    ['hard', 'A wave has a period of 0.02 s. Its frequency is:', ['20 Hz', '50 Hz', '200 Hz', '0.02 Hz'], 1, 'Frequency = 1 ÷ period = 1 ÷ 0.02 = 50 Hz.'],
    ['hard', 'The law of conservation of energy states that energy:', ['Always decreases', 'Can be created by machines', 'Cannot be created or destroyed, only transformed', 'Only exists as heat'], 2, 'Energy changes form — potential to kinetic, electrical to light — but the total is conserved.'],
  ],

  chemistry: [
    ['easy', 'What is the chemical symbol for oxygen?', ['O', 'Ox', 'O₂', 'Og'], 0, 'The symbol is O. O₂ is the formula for a molecule of oxygen gas.'],
    ['easy', 'H₂O is the chemical formula for:', ['Salt', 'Water', 'Hydrogen peroxide', 'Sugar'], 1, 'Two hydrogen atoms bonded to one oxygen atom make water.'],
    ['easy', 'An atom\'s nucleus contains:', ['Electrons only', 'Protons and neutrons', 'Protons and electrons', 'Neutrons only'], 1, 'Protons and neutrons sit in the nucleus; electrons orbit around it.'],
    ['easy', 'A neutral substance has a pH of:', ['0', '7', '10', '14'], 1, 'pH 7 is neutral; below 7 is acidic and above 7 is alkaline.'],
    ['easy', 'Which gas do plants release during photosynthesis?', ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'], 2, 'Plants take in carbon dioxide and release oxygen.'],
    ['easy', 'The chemical symbol for gold is:', ['Go', 'Gd', 'Au', 'Ag'], 2, 'Au comes from the Latin aurum. Ag is silver.'],
    ['easy', 'The number of protons in an atom is called its:', ['Atomic mass', 'Atomic number', 'Valency', 'Isotope number'], 1, 'The atomic number — it also decides which element the atom is.'],
    ['medium', 'The chemical formula for carbon dioxide is:', ['CO', 'CO₂', 'C₂O', 'CaO'], 1, 'One carbon atom and two oxygen atoms.'],
    ['medium', 'In sodium chloride (NaCl), the bond is:', ['Covalent', 'Ionic', 'Metallic', 'Hydrogen'], 1, 'Sodium donates an electron to chlorine; the resulting oppositely charged ions attract each other.'],
    ['medium', 'Which gas turns limewater milky?', ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'], 2, 'Carbon dioxide forms insoluble calcium carbonate, which clouds the limewater — the standard test for CO₂.'],
    ['medium', "Avogadro's number is about:", ['6.02 × 10²³', '3.14 × 10⁸', '9.8 × 10²', '1.6 × 10⁻¹⁹'], 0, 'One mole of any substance contains about 6.02 × 10²³ particles.'],
    ['medium', 'Rusting of iron needs oxygen and:', ['Oil', 'Water', 'Salt only', 'Sunlight'], 1, 'Both oxygen and water are needed; that is why painted or greased iron does not rust.'],
    ['medium', 'A solution with a pH of 3 is:', ['Strongly alkaline', 'Neutral', 'Acidic', 'Slightly alkaline'], 2, 'Below 7 is acidic; 3 is quite acidic, roughly like vinegar.'],
    ['medium', 'The smallest particle of an element that keeps its chemical properties is a(n):', ['Molecule', 'Atom', 'Compound', 'Ion'], 1, 'An atom is the smallest unit of an element that still behaves like that element.'],
    ['hard', 'Balance this equation: __H₂ + O₂ → __H₂O.', ['2, 1, 2', '1, 1, 1', '2, 2, 2', '1, 2, 1'], 0, '2H₂ + O₂ → 2H₂O gives 4 hydrogen and 2 oxygen atoms on each side.'],
    ['hard', 'The molar mass of H₂SO₄ is about:', ['49 g/mol', '82 g/mol', '98 g/mol', '128 g/mol'], 2, '2(1) + 32 + 4(16) = 98 g/mol.'],
    ['hard', 'How many moles are there in 36 g of water?', ['1', '2', '18', '36'], 1, 'Water is 18 g/mol, so 36 ÷ 18 = 2 moles.'],
    ['hard', 'Isotopes of an element differ in the number of:', ['Protons', 'Electrons', 'Neutrons', 'Bonds'], 2, 'Same protons (same element), different neutrons — which changes mass but not chemistry.'],
    ['hard', 'Oxidation is best described as the loss of:', ['Neutrons', 'Electrons', 'Protons', 'Heat'], 1, 'A useful mnemonic: OIL RIG — Oxidation Is Loss, Reduction Is Gain, of electrons.'],
    ['hard', 'Which of these is a noble gas?', ['Nitrogen', 'Argon', 'Chlorine', 'Neon only'], 1, 'Argon is in Group 18, the noble gases, which have full outer shells and rarely react.'],
    ['hard', 'In the periodic table, Group 17 elements are called:', ['Alkali metals', 'Halogens', 'Noble gases', 'Transition metals'], 1, 'The halogens — fluorine, chlorine, bromine, iodine — are one electron short of a full shell.'],
  ],

  biology: [
    ['easy', 'Which organelle is called the powerhouse of the cell?', ['Nucleus', 'Ribosome', 'Mitochondria', 'Vacuole'], 2, 'Mitochondria release energy from food through respiration.'],
    ['easy', 'The green pigment in plants that captures light is:', ['Carotene', 'Chlorophyll', 'Haemoglobin', 'Melanin'], 1, 'Chlorophyll absorbs red and blue light, reflecting the green we see.'],
    ['easy', 'How many pairs of chromosomes do humans normally have?', ['21', '23', '46', '48'], 1, '46 chromosomes in 23 pairs; one pair determines sex.'],
    ['easy', 'Which organ pumps blood around the body?', ['Kidney', 'Heart', 'Lungs', 'Liver'], 1, 'The heart is a muscular pump of four chambers.'],
    ['easy', 'Which gas do humans take in for respiration?', ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'], 1, 'Oxygen is used to release energy from glucose; carbon dioxide is breathed out.'],
    ['easy', 'The process by which plants make food using sunlight is:', ['Digestion', 'Photosynthesis', 'Respiration', 'Transpiration'], 1, 'Photosynthesis turns carbon dioxide and water into glucose using light energy.'],
    ['easy', 'The largest organ of the human body is:', ['The liver', 'The brain', 'The skin', 'The lungs'], 2, 'The skin covers the whole body and is the largest organ by both weight and area.'],
    ['medium', 'The basic structural unit of all living things is the:', ['Cell', 'Tissue', 'Organ', 'Atom'], 0, 'Cells are the smallest units that can carry out all life processes.'],
    ['medium', 'Which blood cells carry oxygen?', ['White blood cells', 'Red blood cells', 'Platelets', 'Plasma cells'], 1, 'Red blood cells contain haemoglobin, which binds oxygen.'],
    ['medium', 'Proteins are made in the:', ['Ribosome', 'Lysosome', 'Golgi body', 'Nucleolus'], 0, 'Ribosomes translate messenger RNA into protein chains.'],
    ['medium', 'Which blood type is known as the universal red-cell donor?', ['A positive', 'AB positive', 'O negative', 'B negative'], 2, 'O negative cells lack A, B and Rh antigens, so they do not trigger a reaction in other groups.'],
    ['medium', 'DNA stands for:', ['Deoxyribonucleic acid', 'Dinucleic acid', 'Deoxyribose nitrate', 'Double nuclear acid'], 0, 'DNA carries the genetic instructions for building and running living things.'],
    ['medium', 'Which part of the eye controls how much light enters?', ['Retina', 'Cornea', 'Iris', 'Lens'], 2, 'The iris is the coloured ring whose muscles widen or narrow the pupil.'],
    ['medium', 'Plants absorb most of their water through their:', ['Leaves', 'Stems', 'Roots', 'Flowers'], 2, 'Root hairs give a huge surface area for absorbing water and minerals.'],
    ['hard', 'Which enzyme in saliva begins the digestion of starch?', ['Pepsin', 'Amylase', 'Lipase', 'Trypsin'], 1, 'Salivary amylase breaks starch down into simpler sugars while you chew.'],
    ['hard', 'Gas exchange in the human lungs takes place in the:', ['Bronchi', 'Trachea', 'Alveoli', 'Pleura'], 2, 'Alveoli are millions of tiny air sacs with thin walls and a rich blood supply.'],
    ['hard', 'Which cell division produces gametes?', ['Mitosis', 'Meiosis', 'Binary fission', 'Budding'], 1, 'Meiosis halves the chromosome number so that fertilisation restores it.'],
    ['hard', 'Which organ secretes insulin?', ['Liver', 'Pancreas', 'Kidney', 'Thyroid'], 1, 'The pancreas releases insulin to lower blood glucose.'],
    ['hard', 'The functional unit of the kidney is the:', ['Neuron', 'Nephron', 'Alveolus', 'Villus'], 1, 'Each kidney has about a million nephrons that filter blood.'],
    ['hard', 'Which part of the brain controls balance and coordination?', ['Cerebrum', 'Cerebellum', 'Medulla', 'Hypothalamus'], 1, 'The cerebellum fine-tunes movement and balance.'],
    ['hard', 'Photosynthesis releases which gas as a by-product?', ['Nitrogen', 'Oxygen', 'Methane', 'Hydrogen'], 1, 'Oxygen is released when water is split during the light reactions.'],
  ],

  english: [
    ['easy', 'What is the plural of "child"?', ['Childs', 'Childes', 'Children', 'Childrens'], 2, 'An irregular plural — like man/men and foot/feet.'],
    ['easy', 'Which spelling is correct?', ['Neccessary', 'Necesary', 'Necessary', 'Nesesary'], 2, 'One "c" and two "s" — necessary.'],
    ['easy', 'What is the past tense of "go"?', ['Goed', 'Gone', 'Went', 'Going'], 2, '"Went" is the simple past; "gone" is the past participle.'],
    ['easy', 'What is the opposite of "ancient"?', ['Old', 'Modern', 'Historic', 'Aged'], 1, 'Ancient means very old; modern means of the present time.'],
    ['easy', 'Which of these words is a noun?', ['Quickly', 'Happiness', 'Bright', 'Run'], 1, 'Happiness is a thing you can have; quickly is an adverb, bright an adjective and run a verb.'],
    ['easy', 'Complete the sentence: "She ___ to school every day."', ['go', 'goes', 'going', 'gone'], 1, 'With he, she or it in the present simple, the verb takes -s.'],
    ['easy', 'Which word is a synonym of "big"?', ['Small', 'Tiny', 'Large', 'Narrow'], 2, 'A synonym has a similar meaning — large.'],
    ['medium', 'Choose the correct verb: "Neither of the boys ___ ready."', ['are', 'is', 'were', 'be'], 1, '"Neither" is singular, so it takes "is".'],
    ['medium', 'Identify the adverb: "He ran quickly to the gate."', ['He', 'ran', 'quickly', 'gate'], 2, 'Quickly describes how he ran, so it is an adverb.'],
    ['medium', 'Choose the right form: "___ going to win."', ['Their', 'There', 'They\'re', 'Theyre'], 2, '"They\'re" is short for "they are". "Their" shows possession and "there" shows place.'],
    ['medium', 'Rewrite in the passive voice: "Rita wrote the letter."', ['The letter was written by Rita.', 'The letter wrote by Rita.', 'Rita was written the letter.', 'The letter is write by Rita.'], 0, 'In the passive, the object becomes the subject and takes "was/were + past participle".'],
    ['medium', 'Complete: "I have lived here ___ 2018."', ['for', 'from', 'since', 'at'], 2, '"Since" is used with a point in time; "for" goes with a length of time.'],
    ['medium', 'Which word means "reluctant"?', ['Eager', 'Unwilling', 'Excited', 'Certain'], 1, 'Reluctant means hesitant or unwilling.'],
    ['medium', 'In "He ran quickly", what does the word "quickly" describe?', ['The noun', 'The verb', 'The subject', 'Another adverb'], 1, 'An adverb describes how the action happened.'],
    ['hard', 'In "Although it rained, we played", the clause "although it rained" is:', ['Independent', 'Subordinate', 'Main', 'Noun phrase'], 1, 'It cannot stand alone as a sentence, so it is a subordinate (dependent) clause.'],
    ['hard', 'Choose the correct form: "If I ___ taller, I would play basketball."', ['was', 'am', 'were', 'be'], 2, 'In an unreal condition, "were" is standard for every subject.'],
    ['hard', 'What is the opposite of "ambiguous"?', ['Unclear', 'Vague', 'Clear', 'Doubtful'], 2, 'Ambiguous means open to more than one meaning; clear is its opposite.'],
    ['hard', 'Which sentence uses a semicolon correctly?', ['I was tired; I kept studying.', 'I was tired; and kept studying.', 'I was; tired I kept studying.', 'I was tired, ; I kept studying.'], 0, 'A semicolon joins two independent clauses without a conjunction.'],
    ['hard', 'Change to reported speech: He said, "I am busy."', ['He said that he is busy.', 'He said that he was busy.', 'He said that I am busy.', 'He says he was busy.'], 1, 'When the reporting verb is past, the reported tense usually shifts back one step.'],
    ['hard', 'In "Under the table slept the cat", what is the subject?', ['Under', 'The table', 'Slept', 'The cat'], 3, 'Ask "who slept?" — the cat. English allows the subject after the verb in this inverted style.'],
    ['hard', 'In "Time is a thief", the phrase is a:', ['Simile', 'Metaphor', 'Hyperbole', 'Pun'], 1, 'A metaphor states that one thing is another without using "like" or "as".'],
  ],

  'computer-science': [
    ['easy', 'CPU stands for:', ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Control Processing Unit'], 0, 'The CPU executes instructions — it is the part that does the computing.'],
    ['easy', 'Binary numbers use which digits?', ['0 and 1', '0 to 9', '1 to 10', 'A to F'], 0, 'Two digits only, because the underlying hardware has two states: on and off.'],
    ['easy', 'Which of these is an input device?', ['Monitor', 'Speaker', 'Keyboard', 'Printer'], 2, 'A keyboard sends data in; monitors, speakers and printers send data out.'],
    ['easy', '1 kilobyte is usually:', ['1000 bytes', '1024 bytes', '100 bytes', '1024 bits'], 1, 'In computing, kilo usually means 2¹⁰ = 1024.'],
    ['easy', 'Which language styles web pages?', ['HTML', 'CSS', 'SQL', 'JSON'], 1, 'HTML gives structure, CSS gives appearance.'],
    ['easy', 'RAM is memory that is:', ['Permanent', 'Volatile', 'Read-only', 'Optical'], 1, 'RAM loses its contents when power is cut; that is what makes it volatile.'],
    ['easy', 'Which of these is a programming language?', ['Python', 'HTTP', 'JPEG', 'HTML only'], 0, 'Python is a general-purpose programming language; HTTP and JPEG are protocols and formats.'],
    ['medium', 'What is binary 1010 in decimal?', ['8', '10', '12', '20'], 1, '8 + 0 + 2 + 0 = 10.'],
    ['medium', 'Which data structure works first-in, first-out?', ['Stack', 'Queue', 'Tree', 'Heap'], 1, 'A queue removes items in the order they arrived, like a line at a counter.'],
    ['medium', 'HTML stands for:', ['HyperText Markup Language', 'High Tech Modern Language', 'Hyperlink and Text Markup Language', 'Home Tool Markup Language'], 0, 'HyperText Markup Language describes the structure of a page.'],
    ['medium', 'What is the time complexity of binary search on a sorted list?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 1, 'Each comparison halves the remaining range.'],
    ['medium', 'A variable that holds only true or false is called a:', ['String', 'Boolean', 'Float', 'Array'], 1, 'Named after George Boole, whose algebra has two values.'],
    ['medium', 'Which SQL command reads data from a table?', ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], 2, 'SELECT retrieves rows; the others change them.'],
    ['medium', 'Which of these stores several values under one name?', ['A constant', 'An array', 'A comment', 'A loop'], 1, 'An array (or list) holds items in order and is reached by index.'],
    ['hard', 'What is the worst-case time complexity of quicksort?', ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 2, 'With badly chosen pivots, each partition removes only one element.'],
    ['hard', 'Which sorting algorithm is O(n log n) in the worst case and stable?', ['Quicksort', 'Merge sort', 'Selection sort', 'Bubble sort'], 1, 'Merge sort always splits and merges in O(n log n) and keeps equal items in order.'],
    ['hard', 'A hash function maps data to:', ['A fixed-size value', 'An image', 'A database schema', 'A network address'], 0, 'Hashing turns input of any size into a fixed-size value used for lookup.'],
    ['hard', 'In object-oriented programming, inheritance lets a class:', ['Delete its objects', 'Reuse and extend another class', 'Run faster', 'Avoid variables'], 1, 'A subclass takes on the members of its parent and can add or override behaviour.'],
    ['hard', 'What is decimal 255 in binary?', ['11111111', '10000000', '11110000', '10101010'], 0, 'Eight 1s = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255.'],
    ['hard', 'Depth-first search uses which data structure to track its path?', ['Queue', 'Stack', 'Heap', 'Hash table'], 1, 'DFS goes as deep as possible, which is last-in-first-out behaviour — a stack.'],
    ['hard', 'Which protocol encrypts traffic between browser and server?', ['FTP', 'HTTPS', 'SMTP', 'DNS'], 1, 'HTTPS is HTTP carried inside TLS, which encrypts and authenticates the connection.'],
  ],

  'general-knowledge': [
    ['easy', 'What is the capital of Nepal?', ['Pokhara', 'Kathmandu', 'Lalitpur', 'Biratnagar'], 1, 'Kathmandu is the capital and largest city.'],
    ['easy', 'How many continents are there?', ['5', '6', '7', '8'], 2, 'Africa, Antarctica, Asia, Europe, North America, Oceania and South America.'],
    ['easy', 'What is the national bird of Nepal?', ['Peacock', 'Danphe', 'Sparrow', 'Eagle'], 1, 'The Danphe, or Himalayan monal, is Nepal\'s national bird.'],
    ['easy', 'Which is the highest mountain in the world?', ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'], 2, 'Everest, on the Nepal–China border, is 8,849 m.'],
    ['easy', 'Which is the largest ocean?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3, 'The Pacific covers roughly a third of the Earth\'s surface.'],
    ['easy', 'How many days are there in a leap year?', ['364', '365', '366', '367'], 2, 'An extra day is added because a solar year is about 365¼ days.'],
    ['easy', 'What is the currency of Nepal?', ['Taka', 'Rupee', 'Ngultrum', 'Yen'], 1, 'The Nepalese rupee (NPR).'],
    ['medium', 'Mount Everest lies on the border between Nepal and:', ['India', 'Bhutan', 'China', 'Pakistan'], 2, 'The border runs along the summit ridge with the Tibet Autonomous Region of China.'],
    ['medium', 'Where is the headquarters of the United Nations?', ['Geneva', 'New York', 'Paris', 'Vienna'], 1, 'The UN headquarters is in New York City.'],
    ['medium', 'Which is the largest hot desert in the world?', ['Gobi', 'Kalahari', 'Sahara', 'Thar'], 2, 'The Sahara — Antarctica is larger but is a cold desert.'],
    ['medium', 'The Olympic Games are normally held every:', ['Two years', 'Three years', 'Four years', 'Five years'], 2, 'Every four years; summer and winter games are staggered two years apart.'],
    ['medium', 'What is the national flower of Nepal?', ['Lotus', 'Rhododendron', 'Marigold', 'Sunflower'], 1, 'The rhododendron, or Lali Gurans.'],
    ['medium', 'Which country is the largest by land area?', ['Canada', 'China', 'Russia', 'United States'], 2, 'Russia covers about 17 million square kilometres.'],
    ['medium', 'Where is the headquarters of UNESCO?', ['London', 'Paris', 'Rome', 'Tokyo'], 1, 'UNESCO is based in Paris.'],
    ['hard', 'Nepal became a federal democratic republic in:', ['1990', '2001', '2008', '2015'], 2, 'The monarchy was abolished in 2008; the federal constitution followed in 2015.'],
    ['hard', 'How many provinces does Nepal have?', ['Five', 'Six', 'Seven', 'Eight'], 2, 'Seven provinces, created by the 2015 constitution.'],
    ['hard', 'Where is the SAARC secretariat located?', ['New Delhi', 'Kathmandu', 'Dhaka', 'Colombo'], 1, 'The South Asian Association for Regional Cooperation is headquartered in Kathmandu.'],
    ['hard', 'Which is the deepest oceanic trench on Earth?', ['Tonga Trench', 'Java Trench', 'Mariana Trench', 'Puerto Rico Trench'], 2, 'The Mariana Trench in the Pacific reaches roughly 11,000 m down.'],
    ['hard', 'The League of Nations was created after which war?', ['The Crimean War', 'World War I', 'World War II', 'The Napoleonic Wars'], 1, 'It was formed in 1920, after the First World War, and replaced by the UN in 1946.'],
    ['hard', 'Which river is traditionally regarded as the longest in the world?', ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], 1, 'The Nile is traditionally listed as longest, though measuring the Amazon is contested.'],
    ['hard', 'In which year was the United Nations founded?', ['1919', '1939', '1945', '1950'], 2, 'The UN charter was signed in 1945 as the Second World War ended.'],
  ],

  geography: [
    ['easy', 'Which is the largest continent?', ['Africa', 'Asia', 'Europe', 'South America'], 1, 'Asia is both the largest and the most populous continent.'],
    ['easy', 'Which of these is a Himalayan country?', ['Sri Lanka', 'Maldives', 'Nepal', 'Bangladesh'], 2, 'Nepal lies along the Himalayan range, with eight of the ten highest peaks.'],
    ['easy', 'Lines of latitude run:', ['North to south', 'East to west', 'Diagonally', 'Only at the poles'], 1, 'Latitude lines circle the globe parallel to the equator.'],
    ['easy', 'The equator divides the Earth into:', ['East and west', 'North and south', 'Land and sea', 'Day and night'], 1, 'Above the equator is the northern hemisphere, below it the southern.'],
    ['easy', 'The Eiffel Tower is in which country?', ['Italy', 'France', 'Spain', 'Belgium'], 1, 'Paris, France — built for the 1889 World Fair.'],
    ['easy', 'Which is the smallest continent?', ['Europe', 'Antarctica', 'Australia', 'South America'], 2, 'Australia is the smallest continent by area.'],
    ['easy', 'Which country lies to the south of Nepal?', ['China', 'India', 'Bhutan', 'Myanmar'], 1, 'Nepal is bordered by India to the south, east and west, and China to the north.'],
    ['medium', 'Which river flows through the Kathmandu Valley?', ['Koshi', 'Bagmati', 'Gandaki', 'Karnali'], 1, 'The Bagmati, a sacred river for many Nepalis.'],
    ['medium', 'Which is the longest river wholly within Nepal?', ['Bagmati', 'Karnali', 'Trishuli', 'Bheri'], 1, 'The Karnali is the longest river running entirely inside Nepal.'],
    ['medium', 'The Tropic of Cancer lies at approximately:', ['0°', '23.5° north', '23.5° south', '66.5° north'], 1, 'About 23.5° north of the equator — the northern limit of overhead sun.'],
    ['medium', 'The Sahara Desert lies on which continent?', ['Asia', 'Africa', 'Australia', 'South America'], 1, 'Northern Africa.'],
    ['medium', 'The Dead Sea is famous for its very high:', ['Altitude', 'Salinity', 'Depth', 'Wind speed'], 1, 'Its salt content is so high that swimmers float easily.'],
    ['medium', 'Which is the largest continent by population?', ['Africa', 'Asia', 'Europe', 'North America'], 1, 'Asia holds roughly 60% of the world\'s people.'],
    ['medium', 'Which line divides the Earth into eastern and western hemispheres?', ['Equator', 'Prime Meridian', 'Tropic of Capricorn', 'International Date Line'], 1, 'The Prime Meridian at 0° longitude runs through Greenwich.'],
    ['hard', 'Which is the largest district of Nepal by area?', ['Humla', 'Dolpa', 'Taplejung', 'Mustang'], 1, 'Dolpa, in Karnali Province, is the largest district by area.'],
    ['hard', 'The Kali Gandaki gorge runs between Dhaulagiri and:', ['Everest', 'Annapurna', 'Manaslu', 'Kangchenjunga'], 1, 'Between Dhaulagiri and Annapurna — often described as the deepest gorge in the world.'],
    ['hard', 'Lake Rara lies in which province of Nepal?', ['Bagmati', 'Karnali', 'Gandaki', 'Sudurpashchim'], 1, 'Rara is in Mugu district, Karnali Province, and is Nepal\'s largest lake.'],
    ['hard', 'Which is the highest plateau in the world?', ['Deccan Plateau', 'Tibetan Plateau', 'Colorado Plateau', 'Bolivian Plateau'], 1, 'The Tibetan Plateau averages over 4,500 m above sea level.'],
    ['hard', 'Which is the largest freshwater lake in the world by surface area?', ['Lake Victoria', 'Lake Superior', 'Lake Baikal', 'Caspian Sea'], 1, 'Lake Superior — Baikal holds more water but is smaller in area.'],
    ['hard', 'Which country lies on both Europe and Asia?', ['Greece', 'Turkey', 'Egypt', 'Italy'], 1, 'Turkey straddles the Bosphorus, with territory on both continents.'],
    ['hard', 'Which mountain range separates Nepal from the Tibetan plateau?', ['Aravalli', 'Himalaya', 'Western Ghats', 'Karakoram'], 1, 'The Himalaya forms the northern wall of Nepal.'],
  ],

  history: [
    ['easy', 'Who was the first person to walk on the Moon?', ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Michael Collins'], 1, 'Neil Armstrong, on Apollo 11 in July 1969.'],
    ['easy', 'In which year did the Second World War end?', ['1918', '1939', '1945', '1950'], 2, 'Fighting ended in 1945.'],
    ['easy', 'Who is credited with unifying Nepal in the 18th century?', ['Jung Bahadur Rana', 'Prithvi Narayan Shah', 'Bhimsen Thapa', 'Tribhuvan'], 1, 'Prithvi Narayan Shah of Gorkha began the unification campaign in the mid-1700s.'],
    ['easy', 'The Taj Mahal was built by which Mughal emperor?', ['Akbar', 'Shah Jahan', 'Aurangzeb', 'Babur'], 1, 'Shah Jahan built it as a tomb for his wife Mumtaz Mahal.'],
    ['easy', 'Which ancient civilisation built the pyramids at Giza?', ['Roman', 'Greek', 'Egyptian', 'Persian'], 2, 'Ancient Egypt, roughly 4,500 years ago.'],
    ['easy', 'Who was the first President of the United States?', ['Abraham Lincoln', 'George Washington', 'Thomas Jefferson', 'John Adams'], 1, 'Washington served from 1789 to 1797.'],
    ['easy', 'Which country gave the Statue of Liberty to the United States?', ['Britain', 'France', 'Spain', 'Italy'], 1, 'France gave it in 1886 to mark friendship and the centenary of independence.'],
    ['medium', 'The Sugauli Treaty of 1816 was signed between Nepal and:', ['China', 'The British East India Company', 'France', 'Tibet'], 1, 'It ended the Anglo-Nepalese War and redrew Nepal\'s borders.'],
    ['medium', 'Who issued the Emancipation Proclamation in the United States?', ['George Washington', 'Abraham Lincoln', 'Ulysses Grant', 'Thomas Jefferson'], 1, 'Lincoln issued it in 1863, declaring slaves in Confederate states free.'],
    ['medium', 'The Industrial Revolution began in:', ['France', 'Britain', 'Germany', 'The United States'], 1, 'Britain, in the late 18th century, with textiles and steam power.'],
    ['medium', 'Who founded the Maurya Empire?', ['Ashoka', 'Chandragupta Maurya', 'Bindusara', 'Harsha'], 1, 'Chandragupta Maurya, around 322 BCE.'],
    ['medium', 'The Berlin Wall fell in which year?', ['1961', '1979', '1989', '1991'], 2, 'November 1989, two years before the Soviet Union dissolved.'],
    ['medium', 'Who was the first woman to win a Nobel Prize?', ['Marie Curie', 'Rosalind Franklin', 'Ada Lovelace', 'Dorothy Hodgkin'], 0, 'Marie Curie won the Physics prize in 1903 and the Chemistry prize in 1911.'],
    ['medium', 'Which treaty formally ended the First World War?', ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Vienna', 'Treaty of Sugauli'], 1, 'Signed in 1919 — its terms are often blamed for helping cause the next war.'],
    ['hard', 'The Rana regime in Nepal began in which year?', ['1769', '1846', '1900', '1951'], 1, 'Jung Bahadur Rana took power in 1846 after the Kot massacre.'],
    ['hard', 'The Magna Carta was sealed in:', ['1066', '1215', '1348', '1415'], 1, 'In 1215 at Runnymede, limiting the power of the English king.'],
    ['hard', 'The French Revolution began in:', ['1688', '1776', '1789', '1815'], 2, '1789, with the storming of the Bastille.'],
    ['hard', 'Which Nepali king introduced the partyless panchayat system in 1960?', ['Tribhuvan', 'Mahendra', 'Birendra', 'Gyanendra'], 1, 'King Mahendra dissolved parliament and introduced panchayat rule in 1960.'],
    ['hard', 'The Renaissance began in which country?', ['France', 'Italy', 'England', 'Germany'], 1, 'Italy — Florence in particular — from the 14th century.'],
    ['hard', 'Who was the last active pharaoh of ancient Egypt?', ['Nefertiti', 'Cleopatra VII', 'Hatshepsut', 'Ramses II'], 1, 'Cleopatra VII, who died in 30 BCE.'],
    ['hard', 'Who led India\'s non-violent movement for independence?', ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Subhas Chandra Bose', 'B. R. Ambedkar'], 1, 'Gandhi built mass campaigns around non-violent resistance.'],
  ],

  economics: [
    ['easy', 'What is inflation?', ['A rise in the general level of prices', 'A fall in prices', 'An increase in exports', 'A type of tax'], 0, 'Inflation means money buys less over time.'],
    ['easy', 'What does GDP stand for?', ['General Domestic Price', 'Gross Domestic Product', 'Gross Development Plan', 'Global Data Product'], 1, 'Gross Domestic Product — the total value of goods and services a country produces.'],
    ['easy', 'A person who has no job and is actively looking for work is:', ['Retired', 'Unemployed', 'Underpaid', 'A volunteer'], 1, 'Being unemployed requires both having no job and wanting one.'],
    ['easy', 'What is a budget?', ['A loan from a bank', 'A plan for income and spending', 'A type of tax', 'A stock exchange'], 1, 'A budget matches what comes in against what goes out.'],
    ['easy', 'Prices in a market are mainly set by:', ['The government alone', 'Supply and demand', 'The weather', 'Advertisements'], 1, 'Where buyers and sellers meet, scarcity and desire set the price.'],
    ['easy', 'Saving means:', ['Spending now', 'Setting money aside for later', 'Borrowing money', 'Paying tax'], 1, 'Saving keeps money for future use instead of spending it now.'],
    ['easy', 'Which currency is used by most European Union countries?', ['Pound', 'Euro', 'Franc', 'Dollar'], 1, 'The euro — though not every EU member uses it.'],
    ['medium', 'Opportunity cost is:', ['The money spent on an item', 'The value of the next best option given up', 'A hidden charge', 'The cost of transport'], 1, 'Choosing one thing always means giving up the next best alternative — that is the real cost.'],
    ['medium', 'If demand increases while supply stays the same, the price tends to:', ['Fall', 'Rise', 'Stay exactly the same', 'Become zero'], 1, 'More buyers competing for the same goods pushes prices up.'],
    ['medium', 'What is the central bank of Nepal called?', ['Nepal Bank Limited', 'Nepal Rastra Bank', 'Rastriya Banijya Bank', 'Nepal Investment Bank'], 1, 'Nepal Rastra Bank, established in 1956, manages monetary policy.'],
    ['medium', 'A market with only one seller is called a:', ['Monopoly', 'Oligopoly', 'Duopoly', 'Perfect market'], 0, 'Mono = one; a single seller can influence price strongly.'],
    ['medium', 'Remittance means:', ['Money sent home by workers abroad', 'A government subsidy', 'A foreign loan', 'Tax on exports'], 0, 'Remittances are a major part of Nepal\'s economy.'],
    ['medium', 'A tariff is a tax on:', ['Income', 'Imports', 'Property', 'Savings'], 1, 'Tariffs raise the price of imported goods, usually to protect local producers.'],
    ['medium', 'Fiscal policy is managed mainly by:', ['The central bank', 'The government', 'Private banks', 'Traders'], 1, 'Fiscal policy is government spending and taxation; monetary policy belongs to the central bank.'],
    ['hard', 'When a country\'s currency depreciates, its exports usually become:', ['More expensive abroad', 'Cheaper abroad', 'Unchanged', 'Illegal'], 1, 'Foreign buyers need less of their own currency to buy the same goods.'],
    ['hard', 'If the marginal propensity to consume is 0.8, the multiplier is:', ['1.25', '4', '5', '8'], 2, 'Multiplier = 1 ÷ (1 − 0.8) = 1 ÷ 0.2 = 5.'],
    ['hard', 'Which measure is most commonly used for inflation?', ['Stock market index', 'Consumer price index', 'Exchange rate', 'Interest rate'], 1, 'The CPI tracks the price of a typical basket of goods over time.'],
    ['hard', 'A budget deficit occurs when:', ['Revenue exceeds spending', 'Spending exceeds revenue', 'Taxes are reduced', 'Exports exceed imports'], 1, 'A deficit must be covered by borrowing.'],
    ['hard', 'GDP per capita measures:', ['Total national income', 'Output per person', 'Average wages only', 'Government revenue'], 1, 'GDP divided by population — a rough measure of average economic output per person.'],
    ['hard', 'Deflation is:', ['A sustained fall in the general price level', 'A rise in wages', 'An increase in imports', 'A fall in the exchange rate'], 0, 'Falling prices sound good but often come with falling demand and output.'],
    ['hard', 'Comparative advantage suggests a country should specialise in goods where its:', ['Wages are highest', 'Opportunity cost is lowest', 'Exports are largest', 'Taxes are lowest'], 1, 'Specialising where the opportunity cost is lowest increases total output through trade.'],
  ],

  business: [
    ['easy', 'Profit is revenue minus:', ['Customers', 'Costs', 'Employees', 'Tax only'], 1, 'Profit is what remains after all costs are paid.'],
    ['easy', 'A person who starts and runs a new business is called a(n):', ['Employee', 'Entrepreneur', 'Auditor', 'Customer'], 1, 'Entrepreneurs take the risk of starting something new.'],
    ['easy', 'A logo is part of a company\'s:', ['Accounting', 'Branding', 'Logistics', 'Payroll'], 1, 'Branding is how a business is recognised and remembered.'],
    ['easy', 'Money coming into a business from sales is called:', ['Revenue', 'Debt', 'Equity', 'Overhead'], 0, 'Revenue is the total from sales before costs are deducted.'],
    ['easy', 'What is marketing?', ['Filing tax returns', 'Promoting and selling products', 'Hiring staff', 'Building factories'], 1, 'Marketing finds out what customers want and communicates the offer.'],
    ['easy', 'A shop that sells directly to the public is doing:', ['Wholesale', 'Retail', 'Manufacturing', 'Logistics'], 1, 'Retail sells to end customers; wholesale sells to retailers.'],
    ['easy', 'A customer complaint is best treated as:', ['A nuisance', 'Useful feedback', 'A legal problem', 'A reason to raise prices'], 1, 'Complaints show exactly where a product or service is failing.'],
    ['medium', 'The break-even point is where revenue equals:', ['Profit', 'Total costs', 'Variable costs only', 'Zero'], 1, 'At break-even the business neither makes a profit nor a loss.'],
    ['medium', 'A USP is a:', ['Universal Sales Price', 'Unique Selling Proposition', 'Unpaid Service Period', 'Unit Stock Purchase'], 1, 'What makes your offer different from everyone else\'s.'],
    ['medium', 'Fixed costs are costs that:', ['Change with output', 'Do not change with output', 'Are always zero', 'Only apply to services'], 1, 'Rent is fixed; material costs are variable.'],
    ['medium', 'Owners of a limited company have:', ['Unlimited liability', 'Limited liability', 'No liability', 'Personal liability for all debts'], 1, 'Their personal assets are protected beyond what they invested.'],
    ['medium', 'Cash flow means:', ['Profit over a year', 'Money moving in and out over time', 'The value of stock', 'Total sales'], 1, 'A profitable business can still fail if cash arrives too late to pay bills.'],
    ['medium', 'Market segmentation means:', ['Selling to everyone identically', 'Dividing customers into groups', 'Cutting prices', 'Reducing staff'], 1, 'Different groups have different needs, so the offer is aimed accordingly.'],
    ['medium', 'A supplier provides:', ['Tax advice', 'Goods or services to a business', 'Loans', 'Legal protection'], 1, 'Suppliers sit upstream in the supply chain.'],
    ['hard', 'Gross margin is calculated as (revenue − cost of goods sold) divided by:', ['Profit', 'Revenue', 'Costs', 'Assets'], 1, 'It shows how much of each rupee of sales is left after direct costs.'],
    ['hard', 'A business with high fixed costs and low variable costs has:', ['Low operating leverage', 'High operating leverage', 'No leverage', 'Negative leverage'], 1, 'Profits swing sharply with sales volume when costs are locked in.'],
    ['hard', 'A SWOT analysis examines:', ['Sales, wages, output, tax', 'Strengths, weaknesses, opportunities, threats', 'Stock, warehouse, orders, teams', 'Supply, work, overheads, transport'], 1, 'Two internal factors (strengths, weaknesses) and two external ones (opportunities, threats).'],
    ['hard', 'Return on investment is net profit divided by:', ['Revenue', 'The cost of the investment', 'Total assets', 'Number of staff'], 1, 'ROI expresses profit as a proportion of what was put in.'],
    ['hard', 'Working capital equals current assets minus:', ['Fixed assets', 'Current liabilities', 'Profit', 'Depreciation'], 1, 'It measures the short-term money available to run day-to-day operations.'],
    ['hard', 'A loss leader is a product priced:', ['Above competitors', 'Below cost to attract customers', 'At exactly cost', 'By the government'], 1, 'The shop expects to make the money back on other purchases.'],
    ['hard', 'Economies of scale mean that as output rises:', ['Average cost falls', 'Average cost rises', 'Profit always falls', 'Fixed costs disappear'], 0, 'Spreading fixed costs over more units lowers the cost of each unit.'],
  ],

  technology: [
    ['easy', 'What does Wi-Fi let a device do?', ['Print documents', 'Connect to a network without cables', 'Charge its battery', 'Take photographs'], 1, 'Wi-Fi is a wireless way to join a local network and reach the internet.'],
    ['easy', 'What does "app" short for?', ['Appliance', 'Application', 'Appendix', 'Approach'], 1, 'Application — a program written to do a particular job.'],
    ['easy', '"4G" and "5G" refer to generations of:', ['Batteries', 'Mobile networks', 'Screens', 'Cameras'], 1, 'Each generation brought faster mobile data.'],
    ['easy', 'What is a hyperlink?', ['A type of cable', 'A clickable link to another page', 'A password', 'An image format'], 1, 'Hyperlinks are what make the web a web rather than a set of separate pages.'],
    ['easy', 'Which device stores files permanently?', ['RAM', 'Hard drive', 'CPU cache', 'Monitor'], 1, 'Storage keeps data when the power is off; RAM does not.'],
    ['easy', 'Which of these is a search engine?', ['Chrome', 'Firefox', 'Google', 'Windows'], 2, 'Google is a search engine; Chrome and Firefox are browsers, Windows an operating system.'],
    ['easy', 'A smartphone\'s main input method is usually:', ['A keyboard', 'A touchscreen', 'A mouse', 'A microphone'], 1, 'Most phones are driven by touch.'],
    ['medium', 'Bluetooth typically works over a range of about:', ['1 metre', '10 metres', '100 metres', '1 kilometre'], 1, 'Around 10 metres for ordinary devices — it is short-range by design.'],
    ['medium', 'Cloud storage means your files are:', ['Only on your device', 'Stored on remote servers', 'Deleted after a day', 'Always public'], 1, 'The data lives in a data centre and is reached over the internet.'],
    ['medium', 'A URL identifies:', ['A password', 'The address of a resource on the web', 'A type of cable', 'A file format'], 1, 'Uniform Resource Locator — the address you type or click.'],
    ['medium', 'Which of these is an operating system?', ['Android', 'Google', 'Wi-Fi', 'JSON'], 0, 'Android manages the hardware and runs apps; the others are a company, a standard and a data format.'],
    ['medium', 'Two-factor authentication adds:', ['A longer password', 'A second proof of identity', 'A faster login', 'An email address change'], 1, 'Something you know plus something you have, so a stolen password is not enough.'],
    ['medium', 'An HTTP status of 404 means:', ['Success', 'Not found', 'Server error', 'Redirect'], 1, 'The server could not find the requested resource.'],
    ['medium', 'A DNS server converts domain names into:', ['Passwords', 'IP addresses', 'Images', 'Phone numbers'], 1, 'It is the internet\'s address book.'],
    ['hard', 'A VPN provides:', ['A faster connection', 'An encrypted tunnel between device and network', 'Unlimited storage', 'A free domain'], 1, 'Traffic is encrypted and routed through a server, hiding it from the local network.'],
    ['hard', 'Symmetric encryption uses:', ['Two different keys', 'One shared key', 'No keys', 'Only a password hash'], 1, 'The same key encrypts and decrypts, which is why key exchange is the hard part.'],
    ['hard', 'An API lets software:', ['Run faster', 'Talk to other software', 'Skip testing', 'Avoid encryption'], 1, 'An Application Programming Interface is a defined way for programs to request things from each other.'],
    ['hard', 'Moore\'s law observed that transistor counts:', ['Double roughly every two years', 'Halve each year', 'Never change', 'Grow with price'], 0, 'It was an observation about a trend, not a law of physics.'],
    ['hard', 'A firewall does what?', ['Filters network traffic', 'Backs up files', 'Encrypts passwords', 'Speeds up downloads'], 0, 'It allows or blocks connections against a set of rules.'],
    ['hard', 'Ransomware typically:', ['Slows the internet', 'Encrypts files and demands payment', 'Deletes the operating system', 'Steals advertising revenue'], 1, 'That is why offline backups matter more than paying.'],
    ['hard', 'Which protocol is used to send email?', ['SMTP', 'FTP', 'SSH', 'DHCP'], 0, 'Simple Mail Transfer Protocol moves mail between servers.'],
  ],

  'logical-reasoning': [
    ['easy', 'What comes next: 2, 4, 6, 8, ?', ['9', '10', '12', '16'], 1, 'Add 2 each time.'],
    ['easy', 'If all cats are animals and Tom is a cat, then Tom is:', ['A dog', 'An animal', 'Not an animal', 'A plant'], 1, 'This is a simple syllogism: the conclusion follows from the two statements.'],
    ['easy', 'Which is the odd one out: apple, banana, carrot, mango?', ['Apple', 'Banana', 'Carrot', 'Mango'], 2, 'The others are fruits; a carrot is a root vegetable.'],
    ['easy', 'What comes next: 1, 4, 9, 16, ?', ['20', '24', '25', '32'], 2, 'These are square numbers: 1², 2², 3², 4², 5² = 25.'],
    ['easy', 'Which is the odd one out: circle, square, triangle, cube?', ['Circle', 'Square', 'Triangle', 'Cube'], 3, 'The others are flat shapes; a cube is three-dimensional.'],
    ['easy', 'If A = 1 and B = 2, what is C?', ['2', '3', '4', '5'], 1, 'The letters follow the numbers in order.'],
    ['easy', 'What comes next: 5, 10, 20, 40, ?', ['45', '60', '80', '100'], 2, 'Each number doubles.'],
    ['medium', 'What comes next: 3, 7, 15, 31, ?', ['47', '55', '63', '127'], 2, 'Each term is double the previous plus one: 31 × 2 + 1 = 63.'],
    ['medium', 'If some pens are red and all red things are bright, then some pens are:', ['Bright', 'Blue', 'Not pens', 'Uncertain'], 0, 'The overlapping set — red pens — must be bright.'],
    ['medium', 'What comes next: Z, X, V, T, ?', ['S', 'R', 'Q', 'P'], 1, 'Each letter skips one place backwards: T, then R.'],
    ['medium', 'A is taller than B, and B is taller than C. Who is shortest?', ['A', 'B', 'C', 'Cannot tell'], 2, 'Transitivity gives A > B > C.'],
    ['medium', 'What comes next: 1, 1, 2, 3, 5, 8, ?', ['10', '11', '13', '16'], 2, 'Each term is the sum of the previous two (Fibonacci): 5 + 8 = 13.'],
    ['medium', 'Which is the odd one out: 4, 9, 16, 20, 25?', ['4', '9', '20', '25'], 2, 'All the others are perfect squares.'],
    ['medium', '"If it rains, the ground gets wet. The ground is wet." What follows?', ['It definitely rained', 'It definitely did not rain', 'It may have rained, but we cannot be sure', 'The ground is dry'], 2, 'A wet ground could have another cause, such as a sprinkler — this is affirming the consequent.'],
    ['hard', 'What comes next: 2, 6, 12, 20, 30, ?', ['36', '40', '42', '44'], 2, 'Differences are 4, 6, 8, 10, so add 12: 42. Equivalently n(n+1).'],
    ['hard', 'What comes next: 7, 14, 28, 56, ?', ['84', '96', '112', '120'], 2, 'Each term doubles.'],
    ['hard', 'In a certain code, AZ, BY, CX, ? continues with:', ['DW', 'DV', 'EW', 'DX'], 0, 'The first letter moves forward, the second backward: Z, Y, X, W.'],
    ['hard', '"All heroes are brave. Some soldiers are heroes." Therefore:', ['All soldiers are brave', 'Some soldiers are brave', 'No soldiers are brave', 'Nothing can be concluded'], 1, 'Any soldier who is a hero must be brave, so at least some soldiers are.'],
    ['hard', 'A cube has how many edges?', ['6', '8', '12', '16'], 2, 'Twelve edges, six faces and eight vertices.'],
    ['hard', 'At 3 o\'clock, the angle between the two hands of a clock is:', ['30°', '60°', '90°', '120°'], 2, 'Each hour marking is 30°, and the hands are three markings apart.'],
    ['hard', '"No heroes are cowards. Some soldiers are heroes." Therefore:', ['All soldiers are cowards', 'Some soldiers are not cowards', 'No soldier is brave', 'All cowards are soldiers'], 1, 'A soldier who is a hero cannot be a coward, so at least one soldier is not a coward.'],
  ],

  'environmental-science': [
    ['easy', 'Which gas is released mainly by burning fossil fuels?', ['Oxygen', 'Carbon dioxide', 'Helium', 'Argon'], 1, 'Burning coal, oil and gas releases carbon dioxide, the main greenhouse gas from human activity.'],
    ['easy', 'What does "recycle" mean?', ['Throw away', 'Process waste into new products', 'Burn waste', 'Bury waste'], 1, 'Recycling turns used materials back into usable raw material.'],
    ['easy', 'The three Rs are reduce, reuse and:', ['recycle', 'rebuild', 'remove', 'reheat'], 0, 'In order of preference: use less, use again, then recycle.'],
    ['easy', 'Which energy source is renewable?', ['Coal', 'Petrol', 'Solar', 'Natural gas'], 2, 'Sunlight renews itself, unlike fuels that took millions of years to form.'],
    ['easy', 'Deforestation means:', ['Planting trees', 'Clearing forests', 'Protecting forests', 'Studying forests'], 1, 'Cutting forest without replacement causes soil loss and loses habitat.'],
    ['easy', 'Which gas do plants take in from the air?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], 1, 'Plants use carbon dioxide for photosynthesis.'],
    ['easy', 'Which of these is a renewable resource?', ['Coal', 'Wind', 'Diesel', 'Plastic made from oil'], 1, 'Wind is replenished by the atmosphere continuously.'],
    ['medium', 'The ozone layer protects life from:', ['Infrared radiation', 'Ultraviolet radiation', 'Radio waves', 'Gravity'], 1, 'Ozone absorbs most of the Sun\'s harmful UV-B and UV-C.'],
    ['medium', 'Acid rain is caused mainly by:', ['Carbon monoxide', 'Sulphur and nitrogen oxides', 'Methane', 'Ozone'], 1, 'These gases dissolve in rainwater to form weak acids.'],
    ['medium', 'Which is a non-renewable energy source?', ['Solar', 'Wind', 'Coal', 'Hydro'], 2, 'Coal took millions of years to form and is consumed far faster than it is created.'],
    ['medium', 'Eutrophication of a lake is caused by excess:', ['Salt', 'Nutrients', 'Oxygen', 'Sunlight'], 1, 'Fertiliser runoff feeds algae, which then remove oxygen from the water.'],
    ['medium', 'The greenhouse effect traps:', ['Heat', 'Light only', 'Water', 'Salt'], 0, 'Certain gases let sunlight in but slow the escape of heat.'],
    ['medium', 'Which biome has the greatest biodiversity?', ['Tundra', 'Desert', 'Tropical rainforest', 'Taiga'], 2, 'Tropical rainforests hold a very large share of the world\'s species.'],
    ['medium', 'Chitwan National Park is best known for protecting which animal?', ['Snow leopard', 'One-horned rhinoceros', 'Red panda', 'Bengal tiger only'], 1, 'Chitwan\'s greater one-horned rhino population is one of the conservation successes in South Asia.'],
    ['hard', 'Which agreement set a global framework to limit climate change?', ['Montreal Protocol', 'Paris Agreement', 'Kyoto Protocol only', 'Ramsar Convention'], 1, 'The 2015 Paris Agreement has countries submit their own emissions targets.'],
    ['hard', 'A carbon footprint measures:', ['The amount of carbon in soil', 'Greenhouse gases emitted by an activity', 'The size of a forest', 'Air pressure'], 1, 'It totals the greenhouse gases released directly and indirectly.'],
    ['hard', 'The main cause of coral bleaching is:', ['Lower sea levels', 'Rising sea temperature', 'Excess oxygen', 'Strong moonlight'], 1, 'Heat stress makes corals expel the algae that feed them and give them colour.'],
    ['hard', 'Nepal\'s community forestry is internationally known for:', ['Logging all forests', 'Handing forest management to local user groups', 'Banning all forest use', 'Using forests for mining'], 1, 'Community forest user groups manage large areas, which has increased forest cover.'],
    ['hard', 'BOD (biochemical oxygen demand) measures:', ['Air pollution', 'Organic pollution in water', 'Soil acidity', 'Noise levels'], 1, 'High BOD means microbes are consuming a lot of oxygen to break down waste.'],
    ['hard', 'Which pollutant is mainly responsible for depleting the ozone layer?', ['Carbon dioxide', 'Chlorofluorocarbons', 'Methane', 'Sulphur dioxide'], 1, 'CFCs release chlorine in the stratosphere, which destroys ozone — the Montreal Protocol phased them out.'],
    ['hard', 'The Paris Agreement aims to keep warming well below:', ['0.5°C', '1°C', '2°C', '5°C'], 2, 'The target is well below 2°C above pre-industrial levels, pursuing 1.5°C.'],
  ],

  astronomy: [
    ['easy', 'Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Earth', 'Mars'], 1, 'Mercury orbits closest, completing a year in 88 Earth days.'],
    ['easy', 'How many planets are in our solar system?', ['7', '8', '9', '10'], 1, 'Eight since Pluto was reclassified as a dwarf planet in 2006.'],
    ['easy', 'What is the Sun?', ['A planet', 'A star', 'A comet', 'A moon'], 1, 'The Sun is a star — the nearest one to Earth.'],
    ['easy', 'What is Earth\'s natural satellite called?', ['Titan', 'The Moon', 'Europa', 'Phobos'], 1, 'The Moon orbits the Earth roughly every 27 days.'],
    ['easy', 'Which planet is known as the Red Planet?', ['Jupiter', 'Mars', 'Venus', 'Saturn'], 1, 'Iron oxide dust gives Mars its red colour.'],
    ['easy', 'A group of stars forming a recognised pattern is called a:', ['Galaxy', 'Constellation', 'Nebula', 'Cluster'], 1, 'Constellations are patterns as seen from Earth, not necessarily groups in space.'],
    ['easy', 'Which planet has the most prominent ring system?', ['Jupiter', 'Saturn', 'Neptune', 'Mars'], 1, 'Saturn\'s rings are made of ice and rock.'],
    ['medium', 'Sunlight takes about how long to reach Earth?', ['8 seconds', '8 minutes', '8 hours', '8 days'], 1, 'About 8 minutes 20 seconds.'],
    ['medium', 'Which is the largest planet in the solar system?', ['Saturn', 'Jupiter', 'Neptune', 'Earth'], 1, 'Jupiter is more massive than all the other planets combined.'],
    ['medium', 'A light year measures:', ['Time', 'Distance', 'Brightness', 'Mass'], 1, 'It is the distance light travels in one year — about 9.5 trillion km.'],
    ['medium', 'The Milky Way is:', ['A star', 'Our galaxy', 'A planet', 'A comet'], 1, 'Our solar system is one small part of the Milky Way galaxy.'],
    ['medium', 'A solar eclipse happens when:', ['The Earth blocks the Sun', 'The Moon passes between Earth and the Sun', 'The Sun goes out', 'The Moon turns red'], 1, 'The Moon\'s shadow falls on part of the Earth.'],
    ['medium', 'Which planet rotates on its side, almost in its orbital plane?', ['Uranus', 'Mars', 'Mercury', 'Venus'], 0, 'Uranus is tilted about 98°, probably after a huge collision.'],
    ['medium', 'The asteroid belt lies between the orbits of:', ['Earth and Mars', 'Mars and Jupiter', 'Jupiter and Saturn', 'Venus and Earth'], 1, 'Most asteroids orbit between Mars and Jupiter.'],
    ['hard', 'The colour of a star tells you its:', ['Age only', 'Surface temperature', 'Distance only', 'Mass only'], 1, 'Blue stars are hotter, red stars cooler — colour is a temperature scale.'],
    ['hard', 'What is the nearest star to the Sun?', ['Sirius', 'Proxima Centauri', 'Alpha Centauri A', 'Betelgeuse'], 1, 'Proxima Centauri, about 4.2 light years away.'],
    ['hard', 'The boundary around a black hole beyond which nothing escapes is the:', ['Corona', 'Event horizon', 'Photon ring', 'Accretion disc'], 1, 'Inside the event horizon, escape velocity exceeds the speed of light.'],
    ['hard', 'The Chandrasekhar limit is the maximum mass of a:', ['Neutron star', 'White dwarf', 'Black hole', 'Main sequence star'], 1, 'About 1.4 solar masses — beyond it, a white dwarf collapses.'],
    ['hard', 'The Hubble constant describes:', ['The size of the Sun', 'The rate of expansion of the universe', 'The mass of a galaxy', 'The speed of light'], 1, 'It relates a galaxy\'s distance to how fast it is receding.'],
    ['hard', 'A pulsar is a rapidly rotating:', ['Planet', 'Neutron star', 'Comet', 'Nebula'], 1, 'Its beams sweep past the Earth like a lighthouse, producing regular pulses.'],
    ['hard', 'One astronomical unit (AU) is the average distance from:', ['Earth to the Moon', 'Earth to the Sun', 'The Sun to Jupiter', 'Earth to Mars'], 1, 'About 150 million kilometres.'],
  ],
};

export interface BankQuestion {
  id: string;
  category: ArenaCategory;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
}

function build(): BankQuestion[] {
  const questions: BankQuestion[] = [];
  for (const category of ARENA_CATEGORIES) {
    const rows = RAW[category];
    if (!rows) throw new Error(`No questions for category ${category}`);
    rows.forEach((row, index) => {
      const [difficulty, prompt, options, answerIndex, explanation] = row;
      if (options.length !== 4) throw new Error(`${category}[${index}] must have 4 options`);
      if (answerIndex < 0 || answerIndex > 3) throw new Error(`${category}[${index}] has an invalid answer index`);
      if (new Set(options.map((o) => o.trim().toLowerCase())).size !== 4) {
        throw new Error(`${category}[${index}] has duplicate options`);
      }
      questions.push({
        // Stable, readable id: category/difficulty/position. Position never
        // moves because rows are only ever appended.
        id: `${category}/${difficulty}/${index + 1}`,
        category,
        difficulty,
        prompt,
        options,
        answerIndex,
        explanation,
      });
    });
  }
  return questions;
}

export const QUESTION_BANK: BankQuestion[] = build();

const BY_CATEGORY = new Map<ArenaCategory, BankQuestion[]>();
for (const question of QUESTION_BANK) {
  const list = BY_CATEGORY.get(question.category) ?? [];
  list.push(question);
  BY_CATEGORY.set(question.category, list);
}

export function questionsFor(category: ArenaCategory): BankQuestion[] {
  return BY_CATEGORY.get(category) ?? [];
}

export function questionById(id: string): BankQuestion | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

/** Question counts, used by the API to tell the client what each category offers. */
export function bankSummary(): Record<ArenaCategory, { total: number; easy: number; medium: number; hard: number }> {
  const summary = {} as Record<ArenaCategory, { total: number; easy: number; medium: number; hard: number }>;
  for (const category of ARENA_CATEGORIES) {
    const list = questionsFor(category);
    summary[category] = {
      total: list.length,
      easy: list.filter((q) => q.difficulty === 'easy').length,
      medium: list.filter((q) => q.difficulty === 'medium').length,
      hard: list.filter((q) => q.difficulty === 'hard').length,
    };
  }
  return summary;
}

/**
 * Choose the questions for one attempt.
 *
 * The chosen difficulty is a preference, not a hard filter: a 20-question quiz
 * cannot be filled from a seven-question cell, so the rest are drawn from the
 * other difficulties in the same category. Each question keeps its own
 * difficulty and is scored accordingly, which is why the points table has three
 * rows rather than being a flat number per quiz.
 *
 * `shuffle` is injectable so tests are deterministic.
 */
export function pickQuestions(
  category: ArenaCategory,
  difficulty: Difficulty,
  length: number,
  random: () => number = Math.random,
): BankQuestion[] {
  const all = questionsFor(category);
  if (all.length < length) {
    throw new Error(`Not enough questions in ${category} for a ${length}-question quiz`);
  }

  const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const preferred = shuffle(all.filter((q) => q.difficulty === difficulty));
  const others = shuffle(all.filter((q) => q.difficulty !== difficulty));
  return [...preferred, ...others].slice(0, length);
}
