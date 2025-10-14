export const DEFAULT_DATE_FORMAT = 'dd.MM';
export const DEFAULT_DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';

export const DEFAULT_PRICES = [
  3000, 2900, 2800, 2700, 2600, 2500, 2400, 2300, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1300,
  1200, 1100, 1000, 900, 800, 700, 600, 500,
];

export const DEFAULT_POSITIONS = [
  'В', 'З', 'Н'
]

export const POSITIONS_SORT_MAP: Map<string, number> = new Map<string, number>([
  [DEFAULT_POSITIONS[0], 0],
  [DEFAULT_POSITIONS[1], 1],
  [DEFAULT_POSITIONS[2], 2]
]);

export const DEFAULT_SUBSTITUTION_VALUE = 5;

export const DEFAULT_POSITIONS_MAP: Map<string, string> = new Map<string, string>([
  ['З', 'DF'],
  ['В', 'GK'],
  ['Н', 'FW']
]);

export const ONE_DIGIT_NUMBER_FORMAT: string = '1.0-1'

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

export const GREEN_GAMES_WEEK_BOUNDARY = 3;
export const RED_GAMES_WEEK_BOUNDARY = 2;
export const LOW_GAMES_WEEK_BOUNDARY = 1;

export const DAY_CHANGE_HOUR: number = 3;

export const SQUAD_PLAYERS_COUNT: number = 17;
export const PLAYER_COMBINATIONS_COUNT: number = 10;

export const USER_ID_NAME: Map<string, number> = new Map<string, number>([
  ["RaisingTheBar", 572033],
  ["A-N-O N-I-M", 571879],
  // ["o_kai", 536668],
  // ["AntonovAC", 535080],
  // ["Александр_Ронни", 551324],
  // ["Regys", 552388],
  // ["Wolski", 534799],
  // ['Graf_007', 551516]
]);

export const TEAMS = [
  'ANA',
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
  'UTA',
  'VAN',
  'VGK',
  'WPG',
  'WSH',
  ]

export const TEAM_NAME_LOGO_PATH_MAP = {
  'Anaheim Ducks': 'anaheim-ducks-logo.svg',
  'Utah Mammoth': 'utah-mammoth-logo.svg',
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

export const DEFAULT_WEEK_HEADER_PREFIX = 'w';
export const DEFAULT_AWAY_GAME_TEAM_PREFIX = '@';

export const WHITE_COLOR = '#fff';
export const YELLOW_COLOR = '#fef524';
export const YELLOW_COLOR_ACTIVE = '#e2d90b';
export const GREEN_COLOR = '#64ff8f'
export const GREEN_COLOR_ACTIVE = '#2fff68'
export const ORANGE_COLOR = '#EFA42A'
export const ORANGE_COLOR_ACTIVE = '#EFA42A'

// TEXT
export const EXPAND_CALENDAR: string = 'Развернуть';
export const COLLAPSE_CALENDAR: string = 'Свернуть';
export const ENABLE_PAST_GAMES_CALENDAR_MODE_LABEL: string = 'Показать завершенные недели';
export const DISABLE_PAST_GAMES_CALENDAR_MODE_LABEL: string = 'Скрыть завершенные недели';
export const ENABLE_FULL_CALENDAR_MODE_LABEL: string = 'Показать полный календарь';
export const ENABLE_SIMPLIFIED_CALENDAR_MODE_LABEL: string = 'Показать только число игр (режим сапера)';
export const ENABLE_CALENDAR_ADVANCED_DRAWING_MODE_LABEL: string = 'Включить доп. режим сапера';
export const EFP_LABEL: string = 'ОФО'
export const SHOW_BEST_PLAYERS_BY_EFP: string = 'Отобразить лучших по ОФО игроков';
export const DATA_UPDATED_LOG_INFO: string = 'Данные обновлены:';
export const COEFS_UPDATED_LOG_INFO: string = 'Кэфы обновлены:';
export const FROM_DATE_CALENDAR_FILTER: string = 'С: '
export const TO_DATE_CALENDAR_FILTER: string = 'По: '
export const START_DATE_CALENDAR_FILTER: string = 'Start: ';
export const MODEL_CHOICE_LABEL: string = 'Выбор модели:';
export const WEEK_BACK_BUTTON_LABEL: string = 'Перейти на прошлую неделю';
export const WEEK_FORWARD_BUTTON_LABEL: string = 'Перейти на следующую неделю';
export const NEXT_DEADLINE_DATE_LABEL: string = 'След. дедлайн:';
export const RESET_ALL_FILTERS_LABEL: string = 'Сбросить все фильтры';
export const GO_TO_FANTASY_TEAM_LABEL: string = 'Перейти в фентези-команду';
export const SHOW_TEAMS_EASY_SERIES: string = 'Отобразить легкие серии для команд';
export const HIDE_TEAMS_EASY_SERIES: string = 'Скрыть легкие серии для команд';


// EXTERNAL SOURCES
export const GAME_DAY_TWEETS_URL: string = 'https://www.gamedaytweets.com/';
export const KNOWLEDGE_BASE_URL: string = 'https://docs.google.com/document/d/1LzuQizI0w6AEy2eZJBsmhE6Zg-6BbrzkLZ31BU2a9Os/edit';


export const REMOVE_PLAYERS_WITH_NO_GAMES: boolean = true;