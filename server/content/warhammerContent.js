const apiInfo = {
  title: 'Warhammer 40K Learning API',
  version: '1.0.0',
  description: 'Учебный read API с узнаваемыми сущностями Warhammer 40,000 и едиными query-правилами.',
  audience: 'Frontend и fullstack-разработчики.',
  basePath: '/api/v1',
};

const gettingStartedSteps = [
  {
    title: 'Начни с overview',
    description: 'Увидь ресурсы, примеры запросов и форму ответов.',
    endpoint: '/api/v1/overview',
  },
  {
    title: 'Построй первый каталог',
    description: 'Список characters или factions с пагинацией и search.',
    endpoint: '/api/v1/characters?limit=6&sort=-powerLevel,name',
  },
  {
    title: 'Подключи include',
    description: 'Получи faction, race, homeworld и events за один запрос.',
    endpoint: '/api/v1/characters?filter[faction]=ultramarines&include=faction,race,homeworld,events',
  },
  {
    title: 'Попробуй конкурентные запросы',
    description: 'Собери dashboard через Promise.all.',
    endpoint: '/api/v1/examples/concurrency',
  },
];

const featuredQueries = [
  {
    title: 'Сортировка персонажей по влиянию',
    description: 'Простой старт для карточек и страниц деталей.',
    path: '/api/v1/characters?limit=6&sort=-powerLevel,name',
  },
  {
    title: 'События современной эпохи',
    description: 'Подходит для timeline и filter UI.',
    path: '/api/v1/events?filter[era]=indomitus-era&include=planets,factions,characters',
  },
  {
    title: 'Фракции с лидерами и расами',
    description: 'Готовый сценарий для compare page.',
    path: '/api/v1/factions?include=leaders,races,homeworld&sort=name',
  },
  {
    title: 'Глобальный search',
    description: 'Один input, несколько списков результатов.',
    path: '/api/v1/search?search=cadia&resources=planets,events,factions',
  },
];

const queryGuide = {
  params: [
    { name: 'page', example: 'page=1', description: 'Номер страницы.' },
    { name: 'limit', example: 'limit=12', description: 'Размер страницы.' },
    { name: 'search', example: 'search=guilliman', description: 'Поиск по текстовым полям.' },
    { name: 'sort', example: 'sort=-powerLevel,name', description: 'Сортировка по одному или нескольким полям.' },
    { name: 'filter[...]', example: 'filter[faction]=ultramarines', description: 'Структурированные фильтры.' },
    { name: 'include', example: 'include=faction,race,events', description: 'Связанные сущности в блоке included.' },
    { name: 'fields[...]', example: 'fields[characters]=id,name,slug', description: 'Выборка только нужных полей.' },
  ],
  responseShapes: {
    list: {
      data: [],
      meta: { page: 1, limit: 12, total: 42, totalPages: 4, resource: 'characters' },
      links: { self: '/api/v1/characters?page=1&limit=12', next: '/api/v1/characters?page=2&limit=12' },
      included: { factions: [], races: [] },
    },
    detail: {
      data: {},
      meta: { resource: 'characters' },
      included: {},
    },
    error: {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: [] },
    },
  },
  scenarios: [
    {
      title: 'Быстрый каталог',
      description: 'Список персонажей, сортировка и пагинация.',
      path: '/api/v1/characters?limit=8&sort=name',
    },
    {
      title: 'Связанные карточки',
      description: 'Детальная страница персонажа со связанными сущностями.',
      path: '/api/v1/characters/roboute-guilliman?include=faction,race,homeworld,events',
    },
    {
      title: 'Сложный фильтр',
      description: 'Отбор событий по эре и участникам.',
      path: '/api/v1/events?filter[era]=indomitus-era&filter[factions]=imperium-of-man,ultramarines',
    },
  ],
};

const concurrencyExample = {
  title: 'Конкурентная загрузка для dashboard',
  description: 'Несколько endpoint-ов грузятся параллельно, а клиент объединяет результат в один экран.',
  endpoints: [
    '/api/v1/factions?limit=4&sort=name',
    '/api/v1/characters?limit=4&sort=-powerLevel,name',
    '/api/v1/events?limit=4&sort=-yearOrder,name',
  ],
  code: `const [factions, characters, events] = await Promise.all([
  fetch('/api/v1/factions?limit=4&sort=name').then((response) => response.json()),
  fetch('/api/v1/characters?limit=4&sort=-powerLevel,name').then((response) => response.json()),
  fetch('/api/v1/events?limit=4&sort=-yearOrder,name').then((response) => response.json()),
]);`,
};

const dataset = {
  eras: [
    { id: 1, slug: 'great-crusade', name: 'Great Crusade', summary: 'Экспансия Imperium.', description: 'Объединение миров человечества.', status: 'historical', yearLabel: 'M30', yearOrder: 30000, keywords: ['imperium', 'expansion'] },
    { id: 2, slug: 'horus-heresy', name: 'Horus Heresy', summary: 'Гражданская война примархов.', description: 'Крупнейший раскол в истории Imperium.', status: 'historical', yearLabel: 'M31', yearOrder: 31000, keywords: ['civil-war', 'chaos'] },
    { id: 3, slug: 'age-of-imperium', name: 'Age of Imperium', summary: 'Долгий период войны и стагнации.', description: 'Эпоха выживания после Ереси.', status: 'historical', yearLabel: 'M32-M41', yearOrder: 41000, keywords: ['imperium', 'decline'] },
    { id: 4, slug: 'indomitus-era', name: 'Indomitus Era', summary: 'Современный этап после падения Cadia.', description: 'Эра реформ и контрнаступления.', status: 'active', yearLabel: 'M42', yearOrder: 42000, keywords: ['indomitus', 'modern'] },
  ],
  races: [
    { id: 1, slug: 'human', name: 'Human', summary: 'Основной вид Imperium.', description: 'Люди составляют основу множества армий и институтов.', status: 'active', alignment: 'mixed', keywords: ['imperium', 'chaos', 'mankind'] },
    { id: 2, slug: 'aeldari', name: 'Aeldari', summary: 'Древний вид с сильной связью с варпом.', description: 'Немногочисленный, но очень влиятельный вид.', status: 'active', alignment: 'xenos', keywords: ['psychic', 'craftworlds'] },
    { id: 3, slug: 'ork', name: 'Ork', summary: 'Воинственная зелёная биомасса.', description: 'Культура Orks строится вокруг войны.', status: 'active', alignment: 'xenos', keywords: ['waaagh', 'clans'] },
    { id: 4, slug: 'necron', name: 'Necron', summary: 'Бессмертные машинные династии.', description: 'Древние правители возвращаются к войне.', status: 'active', alignment: 'xenos', keywords: ['dynasties', 'ancient'] },
    { id: 5, slug: 'tyranid', name: 'Tyranid', summary: 'Хищный коллективный вид.', description: 'Hive Fleets поглощают целые миры.', status: 'active', alignment: 'xenos', keywords: ['hive-fleets', 'biomass'] },
    { id: 6, slug: 'tau', name: "T'au", summary: 'Молодая технологичная цивилизация.', description: "T'au Empire сочетает экспансию и технологическое превосходство.", status: 'active', alignment: 'xenos', keywords: ['greater-good', 'technology'] },
  ],
  planets: [
    { id: 1, slug: 'terra', name: 'Terra', summary: 'Тронный мир человечества.', description: 'Политическое сердце Imperium.', status: 'active', type: 'throneworld', sector: 'Sol', eraId: 4, keywords: ['imperium', 'throneworld'] },
    { id: 2, slug: 'mars', name: 'Mars', summary: 'Кузница Mechanicus.', description: 'Источник технологий и верфей.', status: 'active', type: 'forge-world', sector: 'Sol', eraId: 4, keywords: ['mechanicus', 'forge'] },
    { id: 3, slug: 'cadia', name: 'Cadia', summary: 'Легендарный мир-крепость.', description: 'Символ стойкости Imperium.', status: 'fallen', type: 'fortress-world', sector: 'Cadian Gate', eraId: 4, keywords: ['imperium', 'fortress'] },
    { id: 4, slug: 'macragge', name: 'Macragge', summary: 'Домашний мир Ultramarines.', description: 'Центр Ultramar и пример дисциплины.', status: 'active', type: 'civilized-world', sector: 'Ultramar', eraId: 4, keywords: ['ultramarines', 'ultramar'] },
    { id: 5, slug: 'armageddon', name: 'Armageddon', summary: 'Индустриальный мир бесконечных войн.', description: 'Хороший пример многостороннего конфликта.', status: 'active', type: 'hive-world', sector: 'Armageddon Sector', eraId: 4, keywords: ['industrial', 'warzone'] },
    { id: 6, slug: 'fenris', name: 'Fenris', summary: 'Суровый ледяной мир.', description: 'Показывает роль homeworld в идентичности фракции.', status: 'active', type: 'death-world', sector: 'Fenris System', eraId: 4, keywords: ['space-wolves', 'death-world'] },
    { id: 7, slug: 'baal', name: 'Baal', summary: 'Родной мир Blood Angels.', description: 'Мир выживания и наследия.', status: 'active', type: 'radiated-world', sector: 'Baal System', eraId: 4, keywords: ['blood-angels', 'imperium'] },
  ],
  factions: [
    { id: 1, slug: 'imperium-of-man', name: 'Imperium of Man', summary: 'Гигантская человеческая империя.', description: 'Объединяет бесчисленные миры и армии.', status: 'active', alignment: 'imperium', raceIds: [1], homeworldId: 1, eraId: 4, leaderIds: [1, 2], keywords: ['imperium', 'empire'], powerLevel: 99 },
    { id: 2, slug: 'ultramarines', name: 'Ultramarines', summary: 'Образцовый chapter Space Marines.', description: 'Удобная фракция для базовых frontend-упражнений.', status: 'active', alignment: 'imperium', parentFactionId: 1, raceIds: [1], homeworldId: 4, eraId: 4, leaderIds: [2], keywords: ['space-marines', 'ultramar'], powerLevel: 93 },
    { id: 3, slug: 'black-legion', name: 'Black Legion', summary: 'Крупная ударная сила Chaos.', description: 'Хорошо подходит для compare и событий Fall of Cadia.', status: 'active', alignment: 'chaos', raceIds: [1], eraId: 4, leaderIds: [4], keywords: ['chaos', 'traitor-legion'], powerLevel: 94 },
    { id: 4, slug: 'aeldari', name: 'Aeldari', summary: 'Древняя цивилизация.', description: 'Полезна для тем древности и дальновидности.', status: 'active', alignment: 'xenos', raceIds: [2], eraId: 4, leaderIds: [6], keywords: ['craftworlds', 'psychic'], powerLevel: 88 },
    { id: 5, slug: 'orks', name: 'Orks', summary: 'Масса кланов и постоянная война.', description: 'Яркий xenos-полюс учебного набора.', status: 'active', alignment: 'xenos', raceIds: [3], eraId: 4, leaderIds: [5], homeworldId: 5, keywords: ['waaagh', 'clans'], powerLevel: 90 },
    { id: 6, slug: 'necrons', name: 'Necrons', summary: 'Древние машинные династии.', description: 'Усиливают слой данных про эпохи и мощь.', status: 'active', alignment: 'xenos', raceIds: [4], eraId: 4, leaderIds: [7], keywords: ['dynasties', 'ancient'], powerLevel: 91 },
    { id: 7, slug: 'tau-empire', name: "T'au Empire", summary: 'Технологичная ксенос-держава.', description: 'Пример молодого и рационального игрока.', status: 'active', alignment: 'xenos', raceIds: [6], eraId: 4, leaderIds: [8], keywords: ['greater-good', 'technology'], powerLevel: 82 },
    { id: 8, slug: 'adepta-sororitas', name: 'Adepta Sororitas', summary: 'Воинствующий религиозный орден.', description: 'Фракция с яркой верой и символикой.', status: 'active', alignment: 'imperium', parentFactionId: 1, raceIds: [1], eraId: 4, leaderIds: [9], homeworldId: 1, keywords: ['faith', 'imperium'], powerLevel: 80 },
    { id: 9, slug: 'astra-militarum', name: 'Astra Militarum', summary: 'Массовая армия Imperium.', description: 'Удобна для сценариев про кампании и оборону.', status: 'active', alignment: 'imperium', parentFactionId: 1, raceIds: [1], eraId: 4, leaderIds: [10], homeworldId: 3, keywords: ['guard', 'imperium'], powerLevel: 84 },
    { id: 10, slug: 'blood-angels', name: 'Blood Angels', summary: 'Знаменитый chapter Space Marines.', description: 'Расширяет набор homeworld-ов и событий.', status: 'active', alignment: 'imperium', parentFactionId: 1, raceIds: [1], eraId: 4, leaderIds: [11], homeworldId: 7, keywords: ['space-marines', 'baal'], powerLevel: 89 },
  ],
  events: [
    { id: 1, slug: 'horus-heresy', name: 'Horus Heresy', summary: 'Гражданская война, сломавшая Imperium.', description: 'Ключевой исторический узел для множества связей.', status: 'historical', eraId: 2, yearLabel: 'M31', yearOrder: 31000, planetIds: [1, 2], factionIds: [1, 2, 3], characterIds: [1, 3, 4], keywords: ['civil-war', 'primarchs'] },
    { id: 2, slug: 'battle-of-macragge', name: 'Battle of Macragge', summary: 'Оборона Macragge от Tyranids.', description: 'Эталонный пример оборонительной кампании.', status: 'historical', eraId: 3, yearLabel: '745.M41', yearOrder: 41745, planetIds: [4], factionIds: [2, 10], characterIds: [2, 11], keywords: ['defense', 'tyranids'] },
    { id: 3, slug: 'third-war-for-armageddon', name: 'Third War for Armageddon', summary: 'Большая война за Armageddon.', description: 'Удобная точка для compare Imperium и Orks.', status: 'historical', eraId: 3, yearLabel: '998.M41', yearOrder: 41998, planetIds: [5], factionIds: [5, 9], characterIds: [5, 10], keywords: ['siege', 'waaagh'] },
    { id: 4, slug: 'fall-of-cadia', name: 'Fall of Cadia', summary: 'Разрушение Cadia и слом старого баланса.', description: 'Событие с высокой ценностью для search и filters.', status: 'historical', eraId: 4, yearLabel: '999.M41', yearOrder: 41999, planetIds: [3], factionIds: [1, 3, 9], characterIds: [4, 10], keywords: ['cadia', 'chaos'] },
    { id: 5, slug: 'indomitus-crusade', name: 'Indomitus Crusade', summary: 'Контрнаступление Imperium после возвращения Guilliman.', description: 'Один из лучших modern-era examples.', status: 'active', eraId: 4, yearLabel: 'M42', yearOrder: 42000, planetIds: [1, 3, 4], factionIds: [1, 2, 8, 9, 10], characterIds: [2, 9, 10, 11, 12], keywords: ['indomitus', 'crusade'] },
  ],
  characters: [
    { id: 1, slug: 'emperor-of-mankind', name: 'The Emperor of Mankind', summary: 'Создатель Imperium.', description: 'Фундаментальная точка отсчета для множества ресурсов.', status: 'enthroned', factionId: 1, raceId: 1, homeworldId: 1, eraId: 3, eventIds: [1], titles: ['Master of Mankind', 'Lord of the Imperium'], keywords: ['imperium', 'psychic'], alignment: 'imperium', powerLevel: 100 },
    { id: 2, slug: 'roboute-guilliman', name: 'Roboute Guilliman', summary: 'Primarch Ultramarines и лицо современного Imperium.', description: 'Подходит для details page с include и timeline.', status: 'active', factionId: 2, raceId: 1, homeworldId: 4, eraId: 4, eventIds: [2, 5], titles: ['Primarch of the Ultramarines', 'Lord Commander of the Imperium'], keywords: ['primarch', 'ultramar'], alignment: 'imperium', powerLevel: 98 },
    { id: 3, slug: 'horus-lupercal', name: 'Horus Lupercal', summary: 'Военачальник крестового похода, ставший мятежником.', description: 'Ключевая фигура Horus Heresy.', status: 'dead', factionId: 3, raceId: 1, homeworldId: 1, eraId: 2, eventIds: [1], titles: ['Warmaster'], keywords: ['chaos', 'primarch'], alignment: 'chaos', powerLevel: 97 },
    { id: 4, slug: 'abaddon-the-despoiler', name: 'Abaddon the Despoiler', summary: 'Верховный лидер Black Legion.', description: 'Связывает Chaos, Cadia и compare page.', status: 'active', factionId: 3, raceId: 1, eraId: 4, eventIds: [1, 4], titles: ['Warmaster of Chaos'], keywords: ['chaos', 'black-legion'], alignment: 'chaos', powerLevel: 96 },
    { id: 5, slug: 'ghazghkull-thraka', name: 'Ghazghkull Thraka', summary: 'Главный warboss современного WAAAGH!.', description: 'Яркий xenos-лидер для фронтенд-упражнений.', status: 'active', factionId: 5, raceId: 3, homeworldId: 5, eraId: 4, eventIds: [3], titles: ['Prophet of the Waaagh!'], keywords: ['orks', 'waaagh'], alignment: 'xenos', powerLevel: 92 },
    { id: 6, slug: 'eldrad-ulthran', name: 'Eldrad Ulthran', summary: 'Один из самых известных farseer Aeldari.', description: 'Хороший пример древнего и дальновидного персонажа.', status: 'active', factionId: 4, raceId: 2, eraId: 4, eventIds: [], titles: ['Farseer'], keywords: ['aeldari', 'psychic'], alignment: 'xenos', powerLevel: 90 },
    { id: 7, slug: 'imotekh-the-stormlord', name: 'Imotekh the Stormlord', summary: 'Влиятельный лидер Necrons.', description: 'Усиливает слой данных про династии и древнюю власть.', status: 'active', factionId: 6, raceId: 4, eraId: 4, eventIds: [], titles: ['Phaeron of the Sautekh Dynasty'], keywords: ['necrons', 'dynasty'], alignment: 'xenos', powerLevel: 91 },
    { id: 8, slug: 'commander-shadowsun', name: 'Commander Shadowsun', summary: "Легендарный командир T'au Empire.", description: "Соединяет modern command structure и T'au politics.", status: 'active', factionId: 7, raceId: 6, eraId: 4, eventIds: [], titles: ['Supreme Commander'], keywords: ['tau', 'greater-good'], alignment: 'xenos', powerLevel: 85 },
    { id: 9, slug: 'saint-celestine', name: 'Saint Celestine', summary: 'Живая святая Imperium.', description: 'Полезна для сценариев про веру и высокие stakes.', status: 'active', factionId: 8, raceId: 1, homeworldId: 1, eraId: 4, eventIds: [5], titles: ['Living Saint'], keywords: ['faith', 'imperium'], alignment: 'imperium', powerLevel: 87 },
    { id: 10, slug: 'commissar-yarrick', name: 'Commissar Yarrick', summary: 'Герой Astra Militarum и Armageddon.', description: 'Удобен для конкурентных запросов к events и planets.', status: 'legendary', factionId: 9, raceId: 1, homeworldId: 3, eraId: 4, eventIds: [3, 4, 5], titles: ['Hero of Hades Hive'], keywords: ['guard', 'cadia'], alignment: 'imperium', powerLevel: 83 },
    { id: 11, slug: 'dante', name: 'Dante', summary: 'Глава Blood Angels.', description: 'Соединяет chapter, homeworld и крупные события.', status: 'active', factionId: 10, raceId: 1, homeworldId: 7, eraId: 4, eventIds: [2, 5], titles: ['Chapter Master of the Blood Angels'], keywords: ['blood-angels', 'space-marines'], alignment: 'imperium', powerLevel: 88 },
    { id: 12, slug: 'lion-eljonson', name: "Lion El'Jonson", summary: 'Primarch Dark Angels.', description: 'Добавляет второй primarch-полюс современной эпохе.', status: 'active', factionId: 1, raceId: 1, homeworldId: 1, eraId: 4, eventIds: [5], titles: ['Primarch of the Dark Angels'], keywords: ['primarch', 'imperium'], alignment: 'imperium', powerLevel: 95 },
  ],
};

const resourceOrder = ['eras', 'races', 'planets', 'factions', 'events', 'characters'];

const resourceDefinitions = {
  eras: {
    label: 'Эры',
    description: 'Хронологические периоды для timeline и исторических фильтров.',
    defaultSort: 'yearOrder,name',
    previewParams: { limit: 4, sort: 'yearOrder,name' },
    searchFields: ['name', 'summary', 'description', 'keywords'],
    sortFields: ['name', 'status', 'yearOrder'],
    filters: {
      status: { type: 'attribute', field: 'status', label: 'Статус' },
      keywords: { type: 'array', field: 'keywords', label: 'Keywords' },
    },
    includes: {},
    fields: [
      { name: 'id', type: 'number', description: 'Числовой идентификатор.' },
      { name: 'slug', type: 'string', description: 'Публичный slug.' },
      { name: 'name', type: 'string', description: 'Название эры.' },
      { name: 'status', type: 'string', description: 'Активная или историческая.' },
      { name: 'yearOrder', type: 'number', description: 'Поле для сортировки.' },
    ],
    sampleQueries: ['/api/v1/eras?sort=yearOrder', '/api/v1/eras?filter[status]=active'],
  },
  races: {
    label: 'Расы',
    description: 'Базовый слой домена для фильтров и связей.',
    defaultSort: 'name',
    previewParams: { limit: 6, sort: 'name' },
    searchFields: ['name', 'summary', 'description', 'keywords'],
    sortFields: ['name', 'status', 'alignment'],
    filters: {
      status: { type: 'attribute', field: 'status', label: 'Статус' },
      alignment: { type: 'attribute', field: 'alignment', label: 'Alignment' },
      keywords: { type: 'array', field: 'keywords', label: 'Keywords' },
    },
    includes: {},
    fields: [
      { name: 'id', type: 'number', description: 'Числовой идентификатор.' },
      { name: 'slug', type: 'string', description: 'Публичный slug.' },
      { name: 'name', type: 'string', description: 'Название вида.' },
      { name: 'alignment', type: 'string', description: 'Общий полюс роли.' },
    ],
    sampleQueries: ['/api/v1/races?sort=name', '/api/v1/races?filter[alignment]=xenos'],
  },
  planets: {
    label: 'Миры',
    description: 'Миры для homeworld, осад и кампаний.',
    defaultSort: 'name',
    previewParams: { limit: 6, sort: 'name' },
    searchFields: ['name', 'summary', 'description', 'sector', 'keywords'],
    sortFields: ['name', 'status', 'type', 'sector'],
    filters: {
      status: { type: 'attribute', field: 'status', label: 'Статус' },
      type: { type: 'attribute', field: 'type', label: 'Тип мира' },
      era: { type: 'relation', resource: 'eras', localField: 'eraId', label: 'Эра' },
      keywords: { type: 'array', field: 'keywords', label: 'Keywords' },
    },
    includes: {
      era: { resource: 'eras', localField: 'eraId', label: 'Эра' },
    },
    fields: [
      { name: 'id', type: 'number', description: 'Числовой идентификатор.' },
      { name: 'slug', type: 'string', description: 'Публичный slug.' },
      { name: 'name', type: 'string', description: 'Название мира.' },
      { name: 'type', type: 'string', description: 'Категория мира.' },
      { name: 'sector', type: 'string', description: 'Сектор или регион.' },
    ],
    sampleQueries: ['/api/v1/planets?include=era&sort=name', '/api/v1/planets?filter[type]=hive-world,fortress-world'],
  },
  factions: {
    label: 'Фракции',
    description: 'Ключевой ресурс для быстрых frontend-экспериментов.',
    defaultSort: 'name',
    previewParams: { limit: 6, sort: '-powerLevel,name', include: 'leaders,races,homeworld' },
    searchFields: ['name', 'summary', 'description', 'keywords', 'alignment'],
    sortFields: ['name', 'status', 'alignment', 'powerLevel'],
    filters: {
      alignment: { type: 'attribute', field: 'alignment', label: 'Alignment' },
      status: { type: 'attribute', field: 'status', label: 'Статус' },
      race: { type: 'relation', resource: 'races', localField: 'raceIds', many: true, label: 'Раса' },
      era: { type: 'relation', resource: 'eras', localField: 'eraId', label: 'Эра' },
      keywords: { type: 'array', field: 'keywords', label: 'Keywords' },
    },
    includes: {
      races: { resource: 'races', localField: 'raceIds', many: true, label: 'Расы' },
      leaders: { resource: 'characters', localField: 'leaderIds', many: true, label: 'Лидеры' },
      homeworld: { resource: 'planets', localField: 'homeworldId', label: 'Родной мир' },
      era: { resource: 'eras', localField: 'eraId', label: 'Эра' },
      parentFaction: { resource: 'factions', localField: 'parentFactionId', label: 'Родительская фракция' },
    },
    fields: [
      { name: 'id', type: 'number', description: 'Числовой идентификатор.' },
      { name: 'slug', type: 'string', description: 'Публичный slug.' },
      { name: 'name', type: 'string', description: 'Название фракции.' },
      { name: 'alignment', type: 'string', description: 'Политический полюс.' },
      { name: 'powerLevel', type: 'number', description: 'Условная учебная метрика.' },
    ],
    sampleQueries: ['/api/v1/factions?include=leaders,races,homeworld&sort=-powerLevel,name', '/api/v1/factions?filter[alignment]=imperium'],
  },
  events: {
    label: 'События',
    description: 'Исторические и современные конфликты для timeline и dashboard.',
    defaultSort: '-yearOrder,name',
    previewParams: { limit: 5, sort: '-yearOrder,name', include: 'era,planets,factions,characters' },
    searchFields: ['name', 'summary', 'description', 'keywords', 'yearLabel'],
    sortFields: ['name', 'status', 'yearOrder'],
    filters: {
      status: { type: 'attribute', field: 'status', label: 'Статус' },
      era: { type: 'relation', resource: 'eras', localField: 'eraId', label: 'Эра' },
      factions: { type: 'relation', resource: 'factions', localField: 'factionIds', many: true, label: 'Фракции' },
      planets: { type: 'relation', resource: 'planets', localField: 'planetIds', many: true, label: 'Миры' },
      keywords: { type: 'array', field: 'keywords', label: 'Keywords' },
    },
    includes: {
      era: { resource: 'eras', localField: 'eraId', label: 'Эра' },
      planets: { resource: 'planets', localField: 'planetIds', many: true, label: 'Миры' },
      factions: { resource: 'factions', localField: 'factionIds', many: true, label: 'Фракции' },
      characters: { resource: 'characters', localField: 'characterIds', many: true, label: 'Персонажи' },
    },
    fields: [
      { name: 'id', type: 'number', description: 'Числовой идентификатор.' },
      { name: 'slug', type: 'string', description: 'Публичный slug.' },
      { name: 'name', type: 'string', description: 'Название события.' },
      { name: 'yearOrder', type: 'number', description: 'Поле сортировки.' },
    ],
    sampleQueries: ['/api/v1/events?include=era,planets,factions,characters&sort=-yearOrder,name', '/api/v1/events?filter[era]=indomitus-era'],
  },
  characters: {
    label: 'Персонажи',
    description: 'Самый удобный ресурс для карточек, search, filters и detail page.',
    defaultSort: '-powerLevel,name',
    previewParams: { limit: 6, sort: '-powerLevel,name', include: 'faction,race,homeworld,events' },
    searchFields: ['name', 'summary', 'description', 'titles', 'keywords', 'alignment'],
    sortFields: ['name', 'status', 'alignment', 'powerLevel'],
    filters: {
      faction: { type: 'relation', resource: 'factions', localField: 'factionId', label: 'Фракция' },
      race: { type: 'relation', resource: 'races', localField: 'raceId', label: 'Раса' },
      era: { type: 'relation', resource: 'eras', localField: 'eraId', label: 'Эра' },
      homeworld: { type: 'relation', resource: 'planets', localField: 'homeworldId', label: 'Родной мир' },
      keywords: { type: 'array', field: 'keywords', label: 'Keywords' },
      alignment: { type: 'attribute', field: 'alignment', label: 'Alignment' },
      status: { type: 'attribute', field: 'status', label: 'Статус' },
    },
    includes: {
      faction: { resource: 'factions', localField: 'factionId', label: 'Фракция' },
      race: { resource: 'races', localField: 'raceId', label: 'Раса' },
      homeworld: { resource: 'planets', localField: 'homeworldId', label: 'Родной мир' },
      era: { resource: 'eras', localField: 'eraId', label: 'Эра' },
      events: { resource: 'events', localField: 'eventIds', many: true, label: 'События' },
    },
    fields: [
      { name: 'id', type: 'number', description: 'Числовой идентификатор.' },
      { name: 'slug', type: 'string', description: 'Публичный slug.' },
      { name: 'name', type: 'string', description: 'Имя персонажа.' },
      { name: 'status', type: 'string', description: 'Состояние персонажа.' },
      { name: 'powerLevel', type: 'number', description: 'Условная учебная метрика.' },
    ],
    sampleQueries: ['/api/v1/characters?filter[faction]=ultramarines&include=faction,race,homeworld,events', '/api/v1/characters?search=primarch&sort=-powerLevel,name'],
  },
};

module.exports = {
  apiInfo,
  concurrencyExample,
  dataset,
  featuredQueries,
  gettingStartedSteps,
  queryGuide,
  resourceDefinitions,
  resourceOrder,
};
