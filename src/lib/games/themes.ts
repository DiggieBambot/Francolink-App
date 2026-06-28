// src/lib/games/themes.ts
//
// Vocabulary themes used by the games section. Each vocab item is bucketed
// into a single theme by matching its English translation against a keyword
// list. The classifier is intentionally fuzzy — keyword hits map to themes,
// the first match wins. Words that don't fit any theme are dropped from the
// game pool so every round has a coherent feel.

export interface Theme {
  slug: string;
  label: string;
  emoji: string;
  gradient: string;
  /** Lowercased English keywords whose match in translation/term tags this theme. */
  keywords: string[];
}

export const THEMES: Theme[] = [
  {
    slug: "animals",
    label: "Animals",
    emoji: "🐶",
    gradient: "from-amber-400 to-orange-500",
    keywords: [
      "animal","cat","dog","kitten","puppy","cow","horse","bird","fish","sheep","pig","piglet","rabbit","mouse","rat",
      "lion","tiger","bear","elephant","monkey","gorilla","ape","duck","duckling","chicken","hen","rooster","wolf","fox",
      "spider","ant","bee","wasp","butterfly","snake","lizard","frog","toad","turtle","tortoise","kangaroo","goat",
      "camel","whale","dolphin","shark","squirrel","deer","donkey","crocodile","alligator","penguin","panda","owl",
      "eagle","seagull","parrot","pigeon","hedgehog","ladybug","caterpillar","worm","crab","octopus","lobster",
      "hamster","ferret","giraffe","zebra","hippo","rhino","cheetah","leopard","jaguar","peacock","swan","goose",
      "buffalo","bison","kitty","rooster","insect","reptile","mammal","creature","beast",
    ],
  },
  {
    slug: "food",
    label: "Food & Drink",
    emoji: "🍕",
    gradient: "from-rose-400 to-pink-500",
    keywords: [
      "food","meal","breakfast","lunch","dinner","supper","snack","dessert","starter",
      "bread","baguette","croissant","cheese","milk","yogurt","yogourt","cream","butter","egg","eggs",
      "water","wine","coffee","tea","juice","beer","cocktail","lemonade","soda","drink",
      "meat","beef","pork","chicken","ham","sausage","bacon","steak","fish","salmon","tuna","shrimp",
      "rice","pasta","noodle","noodles","spaghetti","soup","salad","stew","sauce","gravy","pizza","sandwich","burger",
      "fruit","apple","banana","orange","grape","grapes","strawberry","raspberry","blueberry","cherry","pear","peach","plum","kiwi","mango","pineapple","lemon","lime","watermelon","melon","fig","coconut",
      "vegetable","tomato","potato","carrot","onion","garlic","mushroom","pepper","cucumber","lettuce","cabbage","spinach","broccoli","corn","pea","peas","bean","beans","eggplant","aubergine","zucchini","courgette","pumpkin",
      "sugar","salt","oil","vinegar","honey","jam","chocolate","candy","sweet","cookie","cake","muffin","pie","tart","ice cream","yoghurt","biscuit","pastry",
    ],
  },
  {
    slug: "clothes",
    label: "Clothes",
    emoji: "👕",
    gradient: "from-pink-400 to-rose-500",
    keywords: [
      "clothes","clothing","outfit","shirt","t-shirt","tshirt","blouse","pants","trousers","jeans","shorts","dress","skirt","skort","jacket","coat","raincoat","sweater","jumper","hoodie","cardigan","vest","waistcoat","suit","tie","bow tie",
      "sock","socks","shoe","shoes","sneaker","sneakers","sandal","sandals","boot","boots","slipper","heel","heels",
      "hat","cap","beanie","scarf","glove","gloves","mitten","mittens","belt","scarf","apron","uniform",
      "underwear","pyjama","pajama","pajamas","nightgown","swimsuit","bikini","swim trunks","robe","bathrobe","watch","jewelry","necklace","bracelet","ring","earring","glasses","sunglasses","backpack","handbag","purse","wallet","umbrella",
    ],
  },
  {
    slug: "body",
    label: "Body",
    emoji: "💪",
    gradient: "from-red-400 to-rose-500",
    keywords: [
      "body","head","hair","face","forehead","eyebrow","eye","eyes","ear","ears","nose","mouth","lip","lips","tongue","tooth","teeth","cheek","chin","jaw","beard","moustache","mustache",
      "neck","shoulder","shoulders","arm","arms","elbow","wrist","hand","hands","finger","fingers","thumb","palm",
      "chest","stomach","belly","back","hip","hips","waist","leg","legs","thigh","knee","knees","ankle","foot","feet","toe","toes","heel",
      "skin","bone","muscle","blood","heart","brain","lung","lungs","liver","kidney","stomach","throat","spine","nail","nails",
    ],
  },
  {
    slug: "family",
    label: "Family",
    emoji: "👨‍👩‍👧",
    gradient: "from-purple-400 to-pink-500",
    keywords: [
      "family","mother","father","mom","mum","dad","daddy","mommy","mummy","parent","parents",
      "brother","sister","sibling","son","daughter","child","children","kid","baby","infant","toddler","twin","twins",
      "grandmother","grandfather","grandma","grandpa","granny","granddad","grandparent","grandparents","grandchild","grandson","granddaughter",
      "aunt","uncle","cousin","nephew","niece","husband","wife","spouse","partner","fiancé","fiancée","boyfriend","girlfriend","relative","ancestor",
    ],
  },
  {
    slug: "home",
    label: "Home",
    emoji: "🏠",
    gradient: "from-emerald-400 to-teal-500",
    keywords: [
      "house","home","apartment","flat","studio","cabin","cottage","villa","mansion","tent","castle",
      "room","bedroom","bathroom","kitchen","living room","dining room","hallway","hall","attic","basement","garage","study","office",
      "door","window","wall","floor","ceiling","roof","stairs","balcony","garden","yard","fence","gate","chimney","fireplace",
      "table","chair","bed","sofa","couch","armchair","desk","stool","bench","lamp","light","mirror","shelf","cupboard","cabinet","wardrobe","drawer","carpet","rug","curtain","blinds","pillow","cushion","blanket","sheet","bedding",
      "key","clock","plate","cup","mug","glass","bottle","bowl","spoon","fork","knife","pot","pan","oven","stove","fridge","refrigerator","microwave","dishwasher","sink","toilet","shower","bathtub","tap","faucet","towel","soap","toothbrush","toothpaste",
    ],
  },
  {
    slug: "colors",
    label: "Colors",
    emoji: "🎨",
    gradient: "from-fuchsia-400 to-purple-500",
    keywords: ["color","colour","red","blue","green","yellow","black","white","orange","purple","violet","pink","brown","grey","gray","silver","gold","beige","turquoise","cyan","magenta","maroon","navy"],
  },
  {
    slug: "numbers",
    label: "Numbers",
    emoji: "🔢",
    gradient: "from-cyan-400 to-blue-500",
    keywords: [
      "number","zero","one","two","three","four","five","six","seven","eight","nine","ten",
      "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen",
      "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety","hundred","thousand","million","billion",
      "first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth",
      "half","quarter","double","triple","count","odd","even","pair","dozen",
    ],
  },
  {
    slug: "actions",
    label: "Actions",
    emoji: "🏃",
    gradient: "from-orange-400 to-red-500",
    keywords: [
      "to go","to come","to run","to walk","to jump","to swim","to sit","to stand","to sleep","to wake","to eat","to drink","to read","to write","to speak","to talk","to listen","to watch","to look","to see","to hear","to play","to work","to study","to learn","to teach","to cook","to clean","to wash","to buy","to sell","to give","to take","to make","to do","to know","to think","to feel","to love","to like","to want","to need","to have","to be","to get","to find","to open","to close","to push","to pull","to fly","to drive","to ride","to dance","to sing","to draw","to paint","to build","to help","to try","to start","to finish","to stop","to wait","to ask","to answer","to tell","to say","to call","to meet","to grow","to fall","to catch","to throw","to fight","to laugh","to cry","to smile","to kiss","to hug","to sit down","to stand up",
    ],
  },
  {
    slug: "places",
    label: "Places",
    emoji: "🏞️",
    gradient: "from-lime-400 to-green-500",
    keywords: [
      "place","city","town","village","country","capital","street","road","avenue","alley","square","park","beach","seaside","coast","mountain","hill","valley","river","lake","pond","sea","ocean","bay","forest","wood","desert","island","field","meadow","farm","prairie",
      "school","university","college","library","museum","cafe","restaurant","bar","pub","shop","store","market","supermarket","mall","bank","post office","station","airport","port","harbor","harbour","factory","office","church","temple","mosque","synagogue","cinema","theatre","theater","stadium","gym","pool","hotel","hostel","motel","bridge","tower","palace","embassy","prison","police station","fire station","hospital","clinic","pharmacy","dentist",
    ],
  },
  {
    slug: "travel",
    label: "Travel",
    emoji: "🚗",
    gradient: "from-sky-400 to-blue-500",
    keywords: [
      "car","bus","train","plane","airplane","aircraft","bicycle","bike","motorcycle","motorbike","scooter","taxi","cab","truck","lorry","van","boat","ship","ferry","sailboat","subway","metro","tram","trolley","tube","helicopter","rocket","ambulance","fire truck","police car",
      "ticket","passport","visa","luggage","suitcase","backpack","trip","journey","voyage","travel","vacation","holiday","tour","map","gps","driver","passenger","conductor","pilot","captain","road","highway","motorway","traffic","intersection","crossing","fuel","gas","petrol","wheel","tire","tyre","engine","steering wheel",
    ],
  },
  {
    slug: "weather",
    label: "Weather",
    emoji: "☀️",
    gradient: "from-yellow-400 to-amber-500",
    keywords: ["weather","rain","rainy","snow","snowy","sun","sunny","sunshine","cloud","cloudy","wind","windy","storm","stormy","fog","foggy","mist","misty","ice","cold","hot","warm","cool","chilly","freezing","temperature","umbrella","hail","thunder","lightning","rainbow"],
  },
  {
    slug: "time",
    label: "Time",
    emoji: "🕐",
    gradient: "from-violet-400 to-purple-500",
    keywords: [
      "time","hour","minute","second","day","week","month","year","season","decade","century",
      "spring","summer","autumn","fall","winter",
      "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
      "january","february","march","april","may","june","july","august","september","october","november","december",
      "morning","afternoon","evening","night","midnight","noon","midday","today","tomorrow","yesterday","weekend","now","later","soon","early","late","clock","watch","calendar","date","schedule","appointment",
    ],
  },
  {
    slug: "nature",
    label: "Nature",
    emoji: "🌳",
    gradient: "from-green-400 to-emerald-500",
    keywords: ["tree","flower","plant","grass","leaf","leaves","forest","wood","stone","rock","mountain","hill","valley","sky","star","moon","sun","cloud","earth","ground","soil","sand","seed","branch","root","bush","shrub","pebble","wave","beach","cave","river","lake","jungle","oak","rose","tulip","daisy","sunflower","lily","cactus","palm","pine","oak","maple","mushroom"],
  },
  {
    slug: "sports",
    label: "Sports",
    emoji: "🏀",
    gradient: "from-teal-400 to-cyan-500",
    keywords: ["sport","football","soccer","basketball","tennis","baseball","volleyball","hockey","golf","running","swimming","skating","skiing","gym","exercise","ball","game","match","team","player","coach","race","jump","yoga","boxing","karate","judo","cycling","rugby","cricket","surfing","skateboard","surfing","wrestling","fitness","workout","championship","goal","score","referee","stadium","court","field","pitch"],
  },
];

const THEME_BY_SLUG = new Map(THEMES.map((t) => [t.slug, t]));
export function themeBySlug(slug: string): Theme | undefined {
  return THEME_BY_SLUG.get(slug);
}

/** Classify a vocab item into exactly one theme by matching its English
 *  translation against the keyword lists. Returns the theme slug or `null`. */
export function classifyVocab(translation: string | undefined): string | null {
  if (!translation) return null;
  // Normalize: lowercase, strip articles/parentheticals, collapse whitespace.
  const norm = translation
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/^(the|a|an|to)\s+/i, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return null;

  // Direct exact match against a keyword set wins.
  const tokens = new Set(norm.split(" "));
  for (const theme of THEMES) {
    for (const kw of theme.keywords) {
      if (kw.includes(" ")) {
        if (norm.includes(kw)) return theme.slug;
      } else if (tokens.has(kw)) {
        return theme.slug;
      }
    }
  }
  return null;
}
