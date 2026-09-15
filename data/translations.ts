export type Lang = 'ru' | 'ky';

export type TranslationKeys = {
  // Tab labels
  tabHome: string;
  tabDuas: string;
  tabQuran: string;
  tabTasbih: string;
  tabQibla: string;
  tabProfile: string;

  // Quran
  quranEyebrow: string;
  quranTitle: string;
  quranSearchPlaceholder: string;
  quranAyahsShort: string;
  quranMeccan: string;
  quranMedinan: string;
  quranContinueReading: string;
  quranContinueButton: string;
  quranLoading: string;
  quranError: string;
  quranRetry: string;
  quranEmpty: string;
  quranTranslationLabel: string;
  quranTransliterationLabel: string;
  quranTransliterationNote: string;
  quranPlaySurah: string;
  quranStopSurah: string;
  quranReciterName: string;
  quranSajdaObligatory: string;
  quranSajdaRecommended: string;
  quranAyahLoading: string;
  quranAyahError: string;
  quranOpenSurah: string;
  quranHijriToday: string;

  asmaEyebrow: string;
  asmaTitle: string;
  asmaSearchPlaceholder: string;
  asmaNameOfDay: string;
  asmaLoading: string;
  asmaError: string;
  asmaNote: string;
  profileAsmaRow: string;
  homeAsmaCardTitle: string;

  // Home
  homeEyebrow: string;
  homeGreeting: string;
  homeSearchPlaceholder: string;
  homeHeroTitle: string;
  homeHeroText: string;
  homeHeroButton: string;
  homeQuickAccess: string;
  homePrayerToday: string;
  homePrayerAll: string;
  homeCountdown: string;
  homeHoursShort: string;
  homeMinutesShort: string;
  homeDuaOfDay: string;
  homePrayerLoading: string;
  homeNotifications: string;
  homeModalTitle: string;
  homeModalCity: string;
  homeModalToggle: string;
  homeModalHint: string;
  homeModalDone: string;
  notifyPrayerSoonTitle: string;
  notifyPrayerSoonBody: string;

  // Duas
  duasEyebrow: string;
  duasTitle: string;
  duasIntro: string;
  duasSearchPlaceholder: string;
  duasAll: string;
  duasTexts: string;
  duasEmpty: string;
  duasReset: string;
  duasTranscription: string;
  duasTranslation: string;
  duasSource: string;
  duasCopy: string;
  duesCopied: string;
  duasShare: string;
  duasCategoryCount: string;

  // Categories
  catAll: string;
  catNamazy: string;
  catRepentance: string;
  catRemembrance: string;
  catDaily: string;
  catDifficulties: string;
  catGrief: string;
  catProtection: string;
  catRamadan: string;
  catNature: string;
  catHolidays: string;
  catHealth: string;
  catAnxiety: string;
  catMotivation: string;
  catFinance: string;
  catDecisions: string;
  catRoutine: string;
  catStudy: string;
  catSelfEsteem: string;
  catRelationships: string;
  catHealthSleep: string;
  catFears: string;
  catCareer: string;

  // Tasbih
  tasbihEyebrow: string;
  tasbihTitle: string;
  tasbihCurrentPhrase: string;
  tasbihTap: string;
  tasbihGoal: string;
  tasbihRounds: string;
  tasbihReset: string;
  tasbihTotal: string;
  tasbihResetConfirm: string;
  tasbihSettingsTitle: string;
  tasbihGoalPerRound: string;
  tasbihPhrases: string;
  tasbihAddPhrase: string;
  tasbihDone: string;

  // Qibla
  qiblaEyebrow: string;
  qiblaTitle: string;
  qiblaFindingLocation: string;
  qiblaLocationDenied: string;
  qiblaEnableLocation: string;
  qiblaYourLocation: string;
  qiblaQiblaDirection: string;
  qiblaDegrees: string;
  qiblaCompassUnavailable: string;
  qiblaAlignPhone: string;
  qiblaDistance: string;
  qiblaKaaba: string;

  // Profile
  profileEyebrow: string;
  profileTitle: string;
  profileName: string;
  profileSub: string;
  profileFavDuas: string;
  profileFavSurahs: string;
  profileTasbihGoal: string;
  profileSettings: string;
  profileFavDuasRow: string;
  profileNotificationsRow: string;
  profileCityRow: string;
  profileSettingsRow: string;
  profileNote: string;
  profileModalFavorites: string;
  profileModalNotifications: string;
  profileModalCity: string;
  profileModalSettings: string;
  profileEmptyFavorites: string;
  profileEmptyFavSurahs: string;
  profileGoToDuas: string;
  profileGoToQuran: string;
  profileNotifyToggle: string;
  profileNotifyHint: string;
  profileMethod: string;
  cityGpsOption: string;
  cityGpsMethod: string;
  profileDarkTheme: string;
  profileAlwaysOn: string;
  profileLanguage: string;
  profileVersion: string;
  profileMadhab: string;
  profileMadhabNote: string;
  madhabHanafi: string;
  madhabShafi: string;

  // Prayer names
  prayerFajr: string;
  prayerZuhr: string;
  prayerAsr: string;
  prayerMaghrib: string;
  prayerIsha: string;
};

export const translations: Record<Lang, TranslationKeys> = {
  ru: {
    tabHome: 'Главная',
    tabDuas: 'Дуа',
    tabQuran: 'Коран',
    tabTasbih: 'Тасбих',
    tabQibla: 'Кыбла',
    tabProfile: 'Профиль',

    quranEyebrow: 'СВЯЩЕННЫЙ КОРАН',
    quranTitle: 'Коран',
    quranSearchPlaceholder: 'Поиск суры по названию или номеру',
    quranAyahsShort: 'аятов',
    quranMeccan: 'Мекканская',
    quranMedinan: 'Мединская',
    quranContinueReading: 'Продолжить чтение',
    quranContinueButton: 'Продолжить',
    quranLoading: 'Загрузка сур...',
    quranError: 'Не удалось загрузить список сур',
    quranRetry: 'Повторить',
    quranEmpty: 'Суры не найдены',
    quranTranslationLabel: 'Перевод (Кулиев)',
    quranTransliterationLabel: 'Транслитерация (лат.)',
    quranTransliterationNote: 'Транслитерация приблизительно передаёт звучание латиницей (издание Corpus Quran) и не заменяет точное произношение с таджвидом — сверяйтесь с чтецом или устазом.',
    quranPlaySurah: 'Слушать суру',
    quranStopSurah: 'Остановить',
    quranReciterName: 'Мишари Рашид аль-Афаси',
    quranSajdaObligatory: '۩ Обязательное простирание (саджда ваджиб)',
    quranSajdaRecommended: '۩ Рекомендованное простирание (саджда мустахабб)',
    quranAyahLoading: 'Загрузка аятов...',
    quranAyahError: 'Не удалось загрузить текст суры',
    quranOpenSurah: 'Открыть',
    quranHijriToday: 'по хиджре',
    asmaEyebrow: '99 ИМЁН АЛЛАХА',
    asmaTitle: 'Асма-уль-Хусна',
    asmaSearchPlaceholder: 'Поиск по имени или номеру',
    asmaNameOfDay: 'ИМЯ ДНЯ',
    asmaLoading: 'Загрузка имён...',
    asmaError: 'Не удалось загрузить список',
    asmaNote: 'Список из 99 имён приводится по хадису в Сунан ат-Тирмизи. У Аллаха есть и другие имена, известные и неизвестные творениям.',
    profileAsmaRow: '99 имён Аллаха',
    homeAsmaCardTitle: 'Имя дня',

    homeEyebrow: 'МИР В СЕРДЦЕ',
    homeGreeting: 'Ассаляму алейкум',
    homeSearchPlaceholder: 'Найти дуа, суру или поминание',
    homeHeroTitle: 'Помни своего Господа',
    homeHeroText: 'Найди минуту для тишины, дуа и благодарности.',
    homeHeroButton: 'Открыть дуа',
    homeQuickAccess: 'Быстрый доступ',
    homePrayerToday: 'Намаз сегодня',
    homePrayerAll: 'Все',
    homeCountdown: 'До',
    homeHoursShort: 'ч',
    homeMinutesShort: 'мин',
    homeDuaOfDay: 'Дуа дня',
    homePrayerLoading: 'Загрузка времени намаза...',
    homeNotifications: 'Уведомления о намазе',
    homeModalTitle: 'Уведомления о намазе',
    homeModalCity: 'Город',
    homeModalToggle: 'Напоминать о намазе',
    homeModalHint: 'Время намаза показано для выбранного города. Уведомления будут приходить за 15 минут до каждой молитвы.',
    homeModalDone: 'Готово',
    notifyPrayerSoonTitle: 'через 15 минут',
    notifyPrayerSoonBody: 'Время намаза приближается',

    duasEyebrow: 'ДУХОВНЫЙ ПУТЬ',
    duasTitle: 'Дуа и поминания',
    duasIntro: 'Мольба — это прямое обращение к Всевышнему Аллаху. Выбирай дуа для своего состояния и читай осознанно.',
    duasSearchPlaceholder: 'Поиск по дуа',
    duasAll: 'Все дуа',
    duasTexts: 'текстов',
    duasEmpty: 'Ничего не найдено',
    duasReset: 'Сбросить поиск',
    duasTranscription: 'Транскрипция',
    duasTranslation: 'Перевод',
    duasSource: 'Источник',
    duasCopy: 'Копировать',
    duesCopied: 'Скопировано',
    duasShare: 'Поделиться',
    duasCategoryCount: 'дуа в категории',

    catAll: 'Все',
    catNamazy: 'Намазы',
    catRepentance: 'Покаяние',
    catRemembrance: 'Поминания',
    catDaily: 'Повседневные',
    catDifficulties: 'Трудности',
    catGrief: 'Скорбь',
    catProtection: 'Защита',
    catRamadan: 'Рамадан',
    catNature: 'Природа',
    catHolidays: 'Праздники',
    catHealth: 'Здоровье',
    catAnxiety: 'Тревога и стресс',
    catMotivation: 'Мотивация и воля',
    catFinance: 'Финансы и долги',
    catDecisions: 'Решения и призвание',
    catRoutine: 'Быт и время',
    catStudy: 'Учёба и память',
    catSelfEsteem: 'Самооценка',
    catRelationships: 'Отношения',
    catHealthSleep: 'Здоровье и сон',
    catFears: 'Страхи и одиночество',
    catCareer: 'Работа и карьера',

    tasbihEyebrow: 'ТИХОЕ ПОМИНАНИЕ',
    tasbihTitle: 'Тасбих',
    tasbihCurrentPhrase: 'Текущая фраза',
    tasbihTap: 'Нажми, чтобы помянуть',
    tasbihGoal: 'Цель',
    tasbihRounds: 'Кругов пройдено',
    tasbihReset: 'Сбросить',
    tasbihTotal: 'Всего',
    tasbihResetConfirm: 'Сбросить счётчик?',
    tasbihSettingsTitle: 'Настройки тасбиха',
    tasbihGoalPerRound: 'Цель на круг',
    tasbihPhrases: 'Фразы для поминания',
    tasbihAddPhrase: 'Добавить фразу...',
    tasbihDone: 'Готово',

    qiblaEyebrow: 'НАПРАВЛЕНИЕ НА КААБУ',
    qiblaTitle: 'Кыбла',
    qiblaFindingLocation: 'Определение местоположения...',
    qiblaLocationDenied: 'Доступ к геолокации запрещён',
    qiblaEnableLocation: 'Включить геолокацию',
    qiblaYourLocation: 'Ваше местоположение',
    qiblaQiblaDirection: 'Направление Кыблы',
    qiblaDegrees: '°',
    qiblaCompassUnavailable: 'Компас недоступен на этом устройстве',
    qiblaAlignPhone: 'Поверните телефон, чтобы стрелка совпала с севером',
    qiblaDistance: 'До Каабы',
    qiblaKaaba: 'Кааба',

    profileEyebrow: 'ТВОЁ ПРОСТРАНСТВО',
    profileTitle: 'Профиль',
    profileName: 'Муслим',
    profileSub: 'Пусть каждый день будет наполнен баракатом',
    profileFavDuas: 'Дуа в избранном',
    profileFavSurahs: 'Сур в избранном',
    profileTasbihGoal: 'Цель тасбиха',
    profileSettings: 'Настройки',
    profileFavDuasRow: 'Избранные дуа',
    profileNotificationsRow: 'Уведомления о намазе',
    profileCityRow: 'Город и метод расчёта',
    profileSettingsRow: 'Настройки приложения',
    profileNote: 'Тексты дуа собраны по материалам исламской литературы. Проверяй произношение у знающего наставника.',
    profileModalFavorites: 'Избранные дуа',
    profileModalNotifications: 'Уведомления',
    profileModalCity: 'Город',
    profileModalSettings: 'Настройки',
    profileEmptyFavorites: 'Пока нет избранных дуа. Нажми на сердечко рядом с дуа, чтобы добавить.',
    profileEmptyFavSurahs: 'Пока нет избранных сур. Нажми на звёздочку рядом с сурой, чтобы добавить.',
    profileGoToDuas: 'Перейти к дуа',
    profileGoToQuran: 'Перейти к Корану',
    profileNotifyToggle: 'Напоминать о намазе',
    profileNotifyHint: 'Уведомления будут приходить за 15 минут до каждой молитвы.',
    profileMethod: 'Метод',
    cityGpsOption: 'Моё местоположение',
    cityGpsMethod: 'Определено по GPS',
    profileDarkTheme: 'Тёмная тема',
    profileAlwaysOn: 'Всегда включена',
    profileLanguage: 'Язык интерфейса',
    profileVersion: 'Версия',
    profileMadhab: 'Мазхаб (расчёт времени Аср)',
    profileMadhabNote: 'Влияет на время начала Аср: в ханафитском мазхабе тень предмета должна стать вдвое длиннее, в шафиитском — просто длиннее самого предмета, поэтому Аср наступает раньше.',
    madhabHanafi: 'Ханафи',
    madhabShafi: 'Шафии / Малики / Ханбали',
    prayerFajr: 'Фаджр',
    prayerZuhr: 'Зухр',
    prayerAsr: 'Аср',
    prayerMaghrib: 'Магриб',
    prayerIsha: 'Иша',
  },

  ky: {
    tabHome: 'Башкы',
    tabDuas: 'Дуа',
    tabQuran: 'Кураан',
    tabTasbih: 'Тасбих',
    tabQibla: 'Кыбла',
    tabProfile: 'Профиль',

    quranEyebrow: 'ЫЙЫК КУРААН',
    quranTitle: 'Кураан',
    quranSearchPlaceholder: 'Сураны аты же номери менен издөө',
    quranAyahsShort: 'аят',
    quranMeccan: 'Меккелик',
    quranMedinan: 'Мединалык',
    quranContinueReading: 'Окууну улантуу',
    quranContinueButton: 'Улантуу',
    quranLoading: 'Сүрөлөр жүктөлүүдө...',
    quranError: 'Сүрөлөр тизмеси жүктөлгөн жок',
    quranRetry: 'Кайра аракет кылуу',
    quranEmpty: 'Сүрөлөр табылган жок',
    quranTranslationLabel: 'Котормо (Кулиев)',
    quranTransliterationLabel: 'Транслитерация (латын)',
    quranTransliterationNote: 'Транслитерация үндөрдү болжол менен латын арибинде берет (Corpus Quran басылышы) жана таджвид менен так айтылышын алмаштырбайт — чтец же устаздан текшертип алыңыз.',
    quranPlaySurah: 'Сураны угуу',
    quranStopSurah: 'Токтотуу',
    quranReciterName: 'Мишари Рашид аль-Афаси',
    quranSajdaObligatory: '۩ Милдеттүү сажда (саждаи важиб)',
    quranSajdaRecommended: '۩ Сунатталган сажда (саждаи мустахаб)',
    quranAyahLoading: 'Аяттар жүктөлүүдө...',
    quranAyahError: 'Сүрөнүн тексти жүктөлгөн жок',
    quranOpenSurah: 'Ачуу',
    quranHijriToday: 'хижри боюнча',
    asmaEyebrow: 'АЛЛАНЫН 99 ЫСЫМЫ',
    asmaTitle: 'Асма-уль-Хусна',
    asmaSearchPlaceholder: 'Ысым же номер боюнча издөө',
    asmaNameOfDay: 'КҮНДҮН ЫСЫМЫ',
    asmaLoading: 'Ысымдар жүктөлүүдө...',
    asmaError: 'Тизме жүктөлгөн жок',
    asmaNote: '99 ысымдын тизмеси Сунан ат-Тирмизидеги хадис боюнча берилген. Аллахтын дагы башка, жаратылгандарга белгилүү жана белгисиз ысымдары бар.',
    profileAsmaRow: 'Алланын 99 ысымы',
    homeAsmaCardTitle: 'Күндүн ысымы',

    homeEyebrow: 'ЖҮРӨКТӨ ТЫНЧТЫК',
    homeGreeting: 'Ассаляму алейкум',
    homeSearchPlaceholder: 'Дуа, сура же зикир издөө',
    homeHeroTitle: 'Раббыңды эске ал',
    homeHeroText: 'Тынчтык, дуа жана шүгүр үчүн бир мүнөт тап.',
    homeHeroButton: 'Дуа ачуу',
    homeQuickAccess: 'Тез өтүү',
    homePrayerToday: 'Бүгүнкү намаз',
    homePrayerAll: 'Баары',
    homeCountdown: 'Чейин',
    homeHoursShort: 'ст',
    homeMinutesShort: 'мүн',
    homeDuaOfDay: 'Күндүн дуасы',
    homePrayerLoading: 'Намаз убактысы жүктөлүүдө...',
    homeNotifications: 'Намаз жөнүндө эскертме',
    homeModalTitle: 'Намаз жөнүндө эскертме',
    homeModalCity: 'Шаар',
    homeModalToggle: 'Намаз жөнүндө эскерт',
    homeModalHint: 'Тандалган шаар үчүн намаз убактысы көрсөтүлгөн. Эскертме ар бир намазга 15 мүнөт калганда келет.',
    homeModalDone: 'Даяр',
    notifyPrayerSoonTitle: '15 мүнөттөн кийин',
    notifyPrayerSoonBody: 'Намаз убактысы жакындап калды',

    duasEyebrow: 'РУХАНИ ЖОЛ',
    duasTitle: 'Дуа жана зикирлер',
    duasIntro: 'Дуа — Аллах Таалаға түз кайрылуу. Өзүңдүн абалыңа жараша дуа тандап, акыл менен окуп чык.',
    duasSearchPlaceholder: 'Дуа боюнча издөө',
    duasAll: 'Бардык дуа',
    duasTexts: 'текст',
    duasEmpty: 'Табылган жок',
    duasReset: 'Издөөнү тазалоо',
    duasTranscription: 'Транскрипция',
    duasTranslation: 'Котормо',
    duasSource: 'Булак',
    duasCopy: 'Көчүрүү',
    duesCopied: 'Көчүрүлдү',
    duasShare: 'Бөлүшүү',
    duasCategoryCount: 'дуа категорияда',

    catAll: 'Баары',
    catNamazy: 'Намаздар',
    catRepentance: 'Төбө келүү',
    catRemembrance: 'Зикирлер',
    catDaily: 'Күнүмдүк',
    catDifficulties: 'Кыйынчылыктар',
    catGrief: 'Кайгы',
    catProtection: 'Коргоо',
    catRamadan: 'Рамадан',
    catNature: 'Жаратылыш',
    catHolidays: 'Майрамдар',
    catHealth: 'Ден-соолук',
    catAnxiety: 'Коркунуч жана стресс',
    catMotivation: 'Мотивация жана эркиндик',
    catFinance: 'Каржы жана карыздар',
    catDecisions: 'Чечим жана чакырык',
    catRoutine: 'Турмуш жана убакыт',
    catStudy: 'Окуу жана эс',
    catSelfEsteem: 'Өзүн баалоо',
    catRelationships: 'Мамилелер',
    catHealthSleep: 'Ден-соолук жана уйку',
    catFears: 'Коркунучтар жана жалгыздык',
    catCareer: 'Жумуш жана карьера',

    tasbihEyebrow: 'ТЫНЧ ЗИКИР',
    tasbihTitle: 'Тасбих',
    tasbihCurrentPhrase: 'Учурдагы сөз',
    tasbihTap: 'Зикир кылуу үчүн бас',
    tasbihGoal: 'Максат',
    tasbihRounds: 'Өткөн айланыма',
    tasbihReset: 'Тазалоо',
    tasbihTotal: 'Жалпы',
    tasbihResetConfirm: 'Санаачы тазалансынбы?',
    tasbihSettingsTitle: 'Тасбих жөндөөлөрү',
    tasbihGoalPerRound: 'Айланага максат',
    tasbihPhrases: 'Зикир сөздөрү',
    tasbihAddPhrase: 'Сөз кошуу...',
    tasbihDone: 'Даяр',

    qiblaEyebrow: 'Каабага багыт',
    qiblaTitle: 'Кыбла',
    qiblaFindingLocation: 'Жайгашкан жерди аныктоо...',
    qiblaLocationDenied: 'Геолокацияга уруксат жок',
    qiblaEnableLocation: 'Геолокацияны күйгүзүү',
    qiblaYourLocation: 'Сенин жайгашкан жерң',
    qiblaQiblaDirection: 'Кыбла багыты',
    qiblaDegrees: '°',
    qiblaCompassUnavailable: 'Бул түзмөктө компас жок',
    qiblaAlignPhone: 'Телефондун бурчу түндүк менен дал келгенче бурулт',
    qiblaDistance: 'Каабага чейин',
    qiblaKaaba: 'Кааба',

    profileEyebrow: 'СЕНИН МЕЙКИНДИГИҢ',
    profileTitle: 'Профиль',
    profileName: 'Муслим',
    profileSub: 'Ар бир күн баракатка толсун',
    profileFavDuas: 'Тандалган дуа',
    profileFavSurahs: 'Тандалган сура',
    profileTasbihGoal: 'Тасбих максаты',
    profileSettings: 'Жөндөөлөр',
    profileFavDuasRow: 'Тандалган дуалар',
    profileNotificationsRow: 'Намаз жөнүндө эскертме',
    profileCityRow: 'Шаар жана эсептөө ыкмасы',
    profileSettingsRow: 'Тиркеме жөндөөлөрү',
    profileNote: 'Дуа тексттери ислам адабиятынын материалдары боюнча жыйналган. Айтканын билген устаздан текшертип ал.',
    profileModalFavorites: 'Тандалган дуалар',
    profileModalNotifications: 'Эскертмелер',
    profileModalCity: 'Шаар',
    profileModalSettings: 'Жөндөөлөр',
    profileEmptyFavorites: 'Азырынча тандалган дуа жок. Дуанын жанындагы жүрөкчөнү басып кош.',
    profileEmptyFavSurahs: 'Азырынча тандалган сура жок. Сүрөнүн жанындагы жылдызчаны басып кош.',
    profileGoToDuas: 'Дуаларга өтүү',
    profileGoToQuran: 'Кураанга өтүү',
    profileNotifyToggle: 'Намаз жөнүндө эскерт',
    profileNotifyHint: 'Эскертме ар бир намазга 15 мүнөт калганда келет.',
    profileMethod: 'Ыкма',
    cityGpsOption: 'Менин жайгашкан жерим',
    cityGpsMethod: 'GPS аркылуу аныкталды',
    profileDarkTheme: 'Кара тема',
    profileAlwaysOn: 'Дайыма күйүк',
    profileLanguage: 'Интерфейс тили',
    profileVersion: 'Версия',
    profileMadhab: 'Мазхаб (Аср убактысын эсептөө)',
    profileMadhabNote: 'Аср убактысынын башталышына таасир этет: ханафи мазхабында нерсенин көлөкөсү өз узундугунан эки эсе узун болушу керек, ал эми шафии мазхабында жөн эле нерседен узун болсо жетиштүү, ошондуктан Аср эртерээк келет.',
    madhabHanafi: 'Ханафи',
    madhabShafi: 'Шафии / Малики / Ханбали',
    prayerFajr: 'Фажр',
    prayerZuhr: 'Зухр',
    prayerAsr: 'Аср',
    prayerMaghrib: 'Магриб',
    prayerIsha: 'Иша',
  },
};
