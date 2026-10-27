# Данные — как редактировать

Все данные лежат в JSON и подхватываются приложением при сборке (`src/model/data.ts`). После правки: `npm test && npm run typecheck`, затем `npm run publish`.

## players.json
`players[]` — по одному объекту на игрока.

| поле | что это |
|---|---|
| `id` | латинский slug, уникальный (на него ссылаются составы в `src/model/setup.ts`) |
| `name`, `nameRu`, `fullName` | имя (в UI показывается `nameRu`) |
| `number` | номер (null — нет номера) |
| `positions` | позиции из игры: `GK, LB, RB, CB, CDM, CM, CAM, LM, RM, LW, RW, ST` (первая — основная) |
| `attr` | 34 детальных атрибута FC 26 (`Sprint Speed`, `Acceleration`, `Stamina`, `Short Pass`, `Vision`, `Def. Awareness`, …, `GK Reflexes`) — **модель считает только по ним** |
| `roles` | отметки ролей по позициям: `{ "CDM": [{ "role": "Deep-Lying Playmaker", "level": 2 }] }`; level 2 = Роль++, 1 = Роль+ |
| `playstyles`, `playstylesPlus` | английские названия PlayStyles (как в игре: `Rapid`, `Quick Step`, `Relentless`, `Tiki Taka`, `Incisive Pass`, `Aerial Fortress`, …). PlayStyle+ весит вдвое |
| `inFc26Barca` / `inReal2627` | в какой базе состава игрок доступен |
| `ovr`, `ovrLaunch`, `face` | только для справки, **рейтинг опасности их не использует** |
| `heightCm`, `foot`, `age`, `skillMoves`, `weakFoot` | справочно; рост учитывается в игре в воздухе |
| `source` | откуда данные |

Как обновить игрока по своей игре: открой карточку игрока в FC 26 → «Атрибуты», перепиши числа в `attr`, PlayStyles и отметки ролей (++/+) и пересобери.

Добавить игрока: скопируй объект, поменяй `id` (уникальный), заполни все 34 атрибута (тест проверит).

## roles.json
`roles[]` — 30 ролей FC 26. У роли: `nameRu`, `descRu`, `positions`, `keyAttrs` (атрибуты, по которым считается «соответствие роли»), `focuses[]` и `focusByPosition` (какие фокусы доступны на какой позиции).

У каждого фокуса есть вектор `v` (0…1) — **это эвристика**, её можно крутить:
`adv` — насколько выдвигается вперёд с мячом, `inward`/`wide` — в центр/к бровке, `att`/`def` — участие в атаке/обороне, `press` — прессинг, `runs` — забегания в спину, `create` — созидание, `box` — присутствие в штрафной, `roam` — свободное перемещение, `stam` — расход сил, `stepOut` — ЦЗ выходит из линии, `screen` — прикрывает зону перед защитой, `sweep` — выходы вратаря, `hold` — игра спиной, `dropBack` — опускается в линию защиты.

## formations.json
`formations[]` — схемы: `id`, `name`, `note`, ровно 11 `slots` (`id` уникален внутри схемы, `pos` — позиция из игры, `x` 0 = левая бровка … 1 = правая, `y` 0 = свои ворота … 1 = чужие). Это оборонительная форма при средней линии.

## tactics.json
- `buildUp` — стили розыгрыша (`forwardRuns` — доля игроков, бегущих вперёд, `shortOptions` — открывания под короткий пас).
- `defensiveApproach` — подходы: диапазон высоты линии (`lineMin…lineMax`, `lineDefault`), `trackRuns` (насколько сопровождают забегания), `pressBonus`, `staminaMult` (множитель расхода сил), `offsideTrap`.
- `quickTactics`, `tacticalFocus`, `suggestions` — тексты.

Коэффициенты в `tactics.json` и векторы ролей — мои оценки, не данные EA.
