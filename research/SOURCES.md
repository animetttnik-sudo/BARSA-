# Источники и что не проверено

## Источники
- **Атрибуты, позиции, отметки ролей ++/+, PlayStyles (FC 26)** — fifacm.com, база FC 26 (последнее обновление 23.06.2026). Сырые данные: `fifacm_fc26_barca_raw.json`, `fifacm_fc26_new2627_raw.json`; скрипты `scrape_fifacm.py`, `build_players.py`.
- **OVR на старте FC 26** — официальное раскрытие рейтингов EA (сентябрь 2025) через sportskeeda.com / beebom.com. Используется только для справки.
- **Реальный состав 2026/27** — fcbarcelona.com (страница первой команды), новость о номерах на 2026/27 (02.09.2026), en.wikipedia.org/wiki/2026–27_FC_Barcelona_season.
- **Роли и фокусы FC 26** — EA Pitch Notes «FC 26 Gameplay Deep Dive» (ea.com), futall.com/roles, fifauteam.com/fc-26-roles, fccareer.ai/roles (по страницам ролей, `fccareer_roles_raw.json`), futbin.com/26/roles, fifaindex.com/roles/fc26. Скрипты `scrape_fcc.py`, `build_roles.py`.
- **Тактика (стили розыгрыша, подходы в обороне, диапазоны высоты линии)** — EA Pitch Notes FC IQ (FC 25) через fifauteam.com/fc-26-tactics и Pitch Notes FC 26.
- **Competitive vs Authentic** — EA Pitch Notes FC 26 Gameplay Deep Dive: в Competitive игрок под управлением пользователя не испытывает эффектов усталости, ИИ-игроки устают.
- **Схемы** — список схем FC 26 (fifauteam.com, fut.gg); координаты слотов нарисованы вручную.

## Расхождения между источниками
- Stopper: фокус Defend есть только у fifauteam; используем Balanced + Aggressive (futall/futbin).
- Wingback: futall — Balanced + Support, fccareer — Balanced + Versatile; используем Balanced + Support.
- «Support» у Poacher/Advanced Forward есть только у futall — не включён.
- Holding на CM с фокусом Ball-Winning: futall/fifauteam — да, fccareer — нет; включён.
- Ливакович: OVR на старте 80 (Жирона) против 78 в текущей базе fifacm.

## Не найдено / не проверено
- **Не найдены в базе FC 26:** Брайан Фариньяс (#4), Бисиву (#27), Хамза Абделькарим (#29) — в режиме «Реальный 2026/27» их нет.
- **Work rates** в FC 25/26 заменены ролями; fifacm показывает Med/Med у всех — не используются.
- **Возраст** — из базы игры, не текущий реальный.
- **Рабочая нога Адейеми** — в fifacm указана левая, не перепроверено.
- **Новички 2026/27** (Родри, Габриэл Жезус, Гордон, Адейеми, Ливакович) — атрибуты FC 26 из их прежних клубов; в игре у Барсы их нет.
- **Номера** — по базе/новости; у Фермина и Феррана в данных один номер 7 (Ферран в 2026/27 уже не в составе).
- **Скрытая механика игры** (как ИИ реально двигается, расход выносливости, вес ролей) — закрыта. Векторы ролей, коэффициенты подходов, формулы рисков и рейтинга — **эвристика автора**.
