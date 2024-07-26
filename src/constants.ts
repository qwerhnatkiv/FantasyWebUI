export const DEFAULT_DATE_FORMAT = 'dd.MM';

export const DEFAULT_PRICES = [
  3000, 2900, 2800, 2700, 2600, 2500, 2400, 2300, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1300,
  1200, 1100, 1000, 900, 800, 700, 600, 500,
];

export const DEFAULT_POSITIONS = [
  'В', 'З', 'Н'
]

export const DEFAULT_SUBSTITUTION_VALUE = 5;

export const DEFAULT_POSITIONS_MAP: Map<string, string> = new Map<string, string>([
  ['З', 'DF'],
  ['В', 'GK'],
  ['Н', 'FW']
]);

export const DEFAULT_FORM_LENGTH = 5;
export const DEFAULT_FORM_LENGTH_COUNT = 12;

export const RED_PIM_LOWER_BOUNDARY = 40;
export const RED_GP_UPPER_BOUNDARY = 60;

export const GREEN_TEAM_GF_BOUNDARY = 3.5;
export const RED_TEAM_GA_BOUNDARY = 3;

export const VERY_GREEN_WIN_LOWER_BOUNDARY = 59;
export const GREEN_WIN_LOWER_BOUNDARY = 49;
export const WHITE_WIN_LOWER_BOUNDARY = 33.49;

export const POWER_PLAY_UNITS = ['нет', 'ПП1', 'ПП2']

export const USER_ID_NAME: Map<string, number> = new Map<string, number>([
  ["RaisingTheBar", 534753],
  ["A-N-O N-I-M", 534946],
  ["o_kai", 536668],
  ["AntonovAC", 535080],
  ["Александр_Ронни", 534791],
  ["Regys", 536129],
  ["Wolski", 534799],
  ['graf_007', 535451]
]);

export const TEAMS = [
  'ANA',
  'ARI',
  'BOS',
  'BUF',
  'CAR',
  'CBJ',
  'CGY',
  'CHI',
  'COL',
  'DAL',
  'DET',
  'EDM',
  'FLA',
  'LA',
  'MIN',
  'MTL',
  'NJ',
  'NSH',
  'NYI',
  'NYR',
  'OTT',
  'PHI',
  'PIT',
  'SJ',
  'SEA',
  'STL',
  'TBL',
  'TOR',
  'VAN',
  'VGK',
  'WPG',
  'WSH',
  ]

export const TEAM_NAME_LOGO_PATH_MAP = {
  'Anaheim Ducks': 'anaheim-ducks-logo.svg',
  'Utah Hockey Club': 'utah-hockey-club-logo.svg',
  'Boston Bruins': 'boston-bruins-logo.svg',
  'Buffalo Sabres': 'buffalo-sabres-logo.svg',
  'Calgary Flames': 'calgary-flames-logo.svg',
  'Carolina Hurricanes': 'carolina-hurricanes-logo.svg',
  'Chicago Blackhawks': 'chicago-blackhawks-logo.svg',
  'Colorado Avalanche': 'colorado-avalanche-logo.svg',
  'Columbus Blue Jackets': 'columbus-blue-jackets-logo.svg',
  'Dallas Stars': 'dallas-stars-logo.svg',
  'Detroit Red Wings': 'detroit-red-wings-logo.svg',
  'Edmonton Oilers': 'edmonton-oilers-logo.svg',
  'Florida Panthers': 'florida-panthers-logo.svg',
  'Los Angeles Kings': 'los-angeles-kings-logo.svg',
  'Minnesota Wild': 'minnesota-wild-logo.svg',
  'Montreal Canadiens': 'montreal-canadiens-logo.svg',
  'Nashville Predators': 'nashville-predators-logo.svg',
  'New Jersey Devils': 'new-jersey-devils-logo.svg',
  'New York Islanders': 'new-york-islanders-logo.svg',
  'New York Rangers': 'new-york-rangers-logo.svg',
  'Ottawa Senators': 'ottawa-senators-logo.svg',
  'Philadelphia Flyers': 'philadelphia-flyers-logo.svg',
  'Pittsburgh Penguins': 'pittsburgh-penguins-logo.svg',
  'San Jose Sharks': 'san-jose-sharks-logo.svg',
  'Seattle Kraken': 'seattle-kraken-logo.svg',
  'St Louis Blues': 'st-louis-blues-logo.svg',
  'Tampa Bay Lightning': 'tampa-bay-lightning-logo.svg',
  'Toronto Maple Leafs': 'toronto-maple-leafs-logo.svg',
  'Vancouver Canucks': 'vancouver-canucks-logo.svg',
  'Vegas Golden Knights': 'vegas-golden-knights-logo.svg',
  'Washington Capitals': 'washington-capitals-logo.svg',
  'Winnipeg Jets': 'winnipeg-jets-logo.svg',
}