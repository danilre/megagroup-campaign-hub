export type TourStep = {
  id: string;
  route?: string;
  /** CSS selector of the element to spotlight + ring */
  target?: string;
  /**
   * Optional broader region selector to keep visible (un-dimmed) while the
   * narrow `target` gets the focus ring. Use to keep nav/sidebar context.
   */
  context?: string;
  eyebrow: string;
  title: string;
  body: string;
  /** Optional deep-link shown as "Open this →" inside the tooltip */
  openTo?: string;
  /** Preferred tooltip placement relative to target */
  placement?: "bottom" | "top" | "right" | "left" | "center";
  /** Force the sidebar's "Marketing tools" subtree open before resolving target */
  expandTools?: boolean;
};

const SIDEBAR = '[data-tour="sidebar"]';

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    route: "/dashboard",
    eyebrow: "Тур на 2 минуты",
    title: "Пройдёмся по всему приложению.",
    body: "Я покажу на каждый пункт меню — сверху вниз — и объясню одной строкой, что он делает и когда его открывать. Используйте ← → для перемещения, Esc — чтобы пропустить.",
    placement: "center",
  },

  // ── Primary nav ───────────────────────────────────────────────
  {
    id: "nav-dashboard",
    route: "/dashboard",
    target: '[data-tour="nav-/dashboard"]',
    context: SIDEBAR,
    openTo: "/dashboard",
    eyebrow: "На этой неделе",
    title: "Ваш экран утра понедельника.",
    body: "Активные кампании, темп достижения целей MQL/SQO и следующее действие, которое требует вашего внимания. Начинайте каждый день отсюда.",
    placement: "right",
  },
  {
    id: "nav-campaigns",
    route: "/dashboard",
    target: '[data-tour="nav-/campaigns"]',
    context: SIDEBAR,
    openTo: "/campaigns",
    eyebrow: "Кампании",
    title: "Здесь живёт каждая кампания.",
    body: "По одной строке на рабочее пространство — бриф, материалы, чек-лист, результаты. Нажмите «Новая кампания», чтобы создать её вручную или сгенерировать из брифа с помощью ИИ.",
    placement: "right",
  },
  {
    id: "nav-tools",
    route: "/dashboard",
    target: '[data-tour="nav-/tools"]',
    context: SIDEBAR,
    openTo: "/tools",
    eyebrow: "Маркетинговые инструменты",
    title: "Ваш набор инструментов — 3 раздела.",
    body: "Campaign-in-a-box, Funnel и UTM Builder. Я открою меню, чтобы вы увидели каждый из них.",
    placement: "right",
    expandTools: true,
  },

  // ── Tools submenu ─────────────────────────────────────────────
  {
    id: "tool-campaign",
    route: "/dashboard",
    target: '[data-tour="tool-campaign"]',
    context: SIDEBAR,
    openTo: "/tools?focus=campaign",
    eyebrow: "Инструменты › Campaign-in-a-box",
    title: "Запустите кампанию от начала до конца.",
    body: "Создавайте креатив, импортируйте список и планируйте события — всё в одном месте. Используйте, когда запускаете новую кампанию.",
    placement: "right",
    expandTools: true,
  },
  {
    id: "tool-funnel",
    route: "/dashboard",
    target: '[data-tour="tool-funnel"]',
    context: SIDEBAR,
    openTo: "/funnel",
    eyebrow: "Инструменты › Funnel",
    title: "Задавайте цели, следите за показателями.",
    body: "MQL / SQO задаёт ваши месячные цели (для всей организации или отдельного рабочего пространства). Performance показывает, идёте ли вы по плану. Открывайте еженедельно.",
    placement: "right",
    expandTools: true,
  },
  {
    id: "tool-utm",
    route: "/dashboard",
    target: '[data-tour="tool-utm"]',
    context: SIDEBAR,
    openTo: "/tools/utm",
    eyebrow: "Инструменты › UTM Builder",
    title: "Единообразные ссылки каждый раз.",
    body: "Campaign Name генерирует канонические названия, Naming conventions поддерживает вашу таксономию, а All UTMs показывает все ссылки, созданные командой.",
    placement: "right",
    expandTools: true,
  },

  // ── Rest of primary nav ───────────────────────────────────────
  {
    id: "nav-calendar",
    route: "/dashboard",
    target: '[data-tour="nav-/calendar"]',
    context: SIDEBAR,
    openTo: "/calendar",
    eyebrow: "Календарь",
    title: "Каждая отправка, событие и запуск.",
    body: "Вид на месяц со всеми вехами кампаний, с цветовой кодировкой по типу. Перетащите, чтобы перенести. Единый источник правды о том, «что и когда выходит».",
    placement: "right",
  },
  {
    id: "nav-requests",
    route: "/dashboard",
    target: '[data-tour="nav-/requests"]',
    context: SIDEBAR,
    openTo: "/requests",
    eyebrow: "Запросы",
    title: "Заявки от остальной компании.",
    body: "Продажи, продукт, партнёры — кто угодно — может запросить кампанию через вашу публичную ссылку приёма заявок. Здесь можно рассортировать, преобразовать в рабочее пространство или отклонить.",
    placement: "right",
  },
  {
    id: "nav-templates",
    route: "/dashboard",
    target: '[data-tour="nav-/templates"]',
    context: SIDEBAR,
    openTo: "/templates",
    eyebrow: "Шаблоны",
    title: "Многоразовые отправные точки.",
    body: "Шаблоны брифов, макеты писем, готовые чек-листы. Сохраняйте всё, что сработало один раз, чтобы следующая кампания начиналась с 50%.",
    placement: "right",
  },

  // ── Footer nav ────────────────────────────────────────────────
  {
    id: "nav-settings",
    route: "/dashboard",
    target: '[data-tour="nav-settings"]',
    context: SIDEBAR,
    openTo: "/settings",
    eyebrow: "Настройки",
    title: "Организация, команда, таксономия, бренд.",
    body: "Приглашайте коллег, назначайте роли, редактируйте словарь типов кампаний и настраивайте бренд. Посетите один раз при настройке, затем редко.",
    placement: "right",
  },
  {
    id: "nav-integrations",
    route: "/dashboard",
    target: '[data-tour="nav-integrations"]',
    context: SIDEBAR,
    openTo: "/integrations",
    eyebrow: "Интеграции",
    title: "Подключите CRM, вебхуки и многое другое.",
    body: "Без них используются демоданные. Подключите здесь CRM и почту, чтобы каждая панель стала живой. Сделайте это в первый же день.",
    placement: "right",
  },

  // ── Top-right pill ────────────────────────────────────────────
  {
    id: "setup-pill",
    route: "/dashboard",
    target: '[data-tour="setup-pill"], [data-tour="onboarding-checklist"]',
    eyebrow: "Чек-лист настройки",
    title: "Пять побед по 30 секунд.",
    body: "Следуйте за плашкой в правом верхнем углу, чтобы быстро ощутить ценность приложения. Вы можете повторить этот тур в любой момент из неё.",
    placement: "bottom",
  },

  // ── Outro ─────────────────────────────────────────────────────
  {
    id: "done",
    route: "/dashboard",
    eyebrow: "Вы готовы",
    title: "Пора что-то выпустить.",
    body: "Нажмите ⌘K в любом месте, чтобы переключаться между инструментами. Повторите этот тур из плашки настройки, если понадобится напоминание.",
    placement: "center",
  },
];

export const TOUR_PREF_KEY = "tour_v1";
