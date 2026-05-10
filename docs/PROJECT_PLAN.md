# PROJECT_PLAN.md

# Trackmania Warrior Medals Dashboard

> Update 2026-05-07: Sprint 5 player PB sync no longer uses the old Nadeo Core
> `NADEO_ACCOUNT_ID` / `NADEO_CORE_TOKEN` plan. The implemented MVP uses official Trackmania OAuth
> through `api.trackmania.com` and `GET /api/user/map-records` with `mapId[]` batches of 25. See
> `docs/TRACKMANIA_API_CHECK.md` and `docs/DECISIONS.md`.

Локальный fullstack-проект для анализа Warrior Medals в Trackmania.

Цель проекта:
- собрать базу карт с Warrior medals;
- получать актуальные PB игрока;
- считать прогресс по медалям;
- показывать понятный dashboard;
- помогать выбирать, что катать дальше;
- хранить историю прогресса;
- работать локально без публичного сервиса.

Основной стек:
- Backend: FastAPI
- Database: SQLite
- Frontend: React + Vite
- Charts: Recharts или ECharts
- UI: Tailwind CSS + shadcn/ui
- Local config: `.env`
- Формат проекта: self-hosted local tool

Возможные улучшения:
- PostgreSQL вместо SQLite;
- полноценная авторизация Ubisoft/Nadeo;
- фоновые sync-задачи по расписанию;
- Openplanet companion plugin;
- Docker Compose для удобного запуска;
- публичный multi-user режим, если когда-нибудь понадобится.

---

# 1. Общая идея проекта

Проект должен быть не просто таблицей медалей, а помощником для игры.

Главный вопрос приложения:

"Что мне катать сейчас, чтобы получать максимум прогресса
и удовольствия?"

Приложение должно показывать:
- общий прогресс по Warrior medals;
- какие медали уже получены;
- какие медали почти получены;
- какие карты самые лёгкие;
- какие карты самые сложные;
- какую позицию в мире требует Warrior medal;
- насколько PB игрока близок к Warrior;
- историю прогресса;
- рекомендации на сегодня;
- статистику и графики.

---

# 2. Важные источники данных

## 2.1 Warrior medals source

Основной источник:
- `https://e416.dev/api3/tm/warrior/all`

Этот endpoint используется как источник общей базы Warrior medals.

Важно:
- не дергать API слишком часто;
- хранить локальный JSON cache;
- на фронт данные отдавать из локальной БД/JSON;
- синхронизацию с API запускать вручную кнопкой.

Базовый подход:
1. Backend скачивает Warrior JSON.
2. Сохраняет raw JSON в локальный файл.
3. Парсит данные.
4. Обновляет SQLite.
5. Фронт работает только с backend API.

Пример локального пути:
- `data/raw/warrior_all.json`

## 2.2 PB игрока

PB игрока лучше получать не через Warrior Medals plugin,
а напрямую через Nadeo Core API.

Endpoint:
```http
GET https://prod.trackmania.core.nadeo.online/v2/accounts/{accountId}/mapRecords?mapIdList={mapIdList}
```

Важные особенности:
- работает только для текущего authenticated account;
- для чужих аккаунтов вернёт 403;
- нужны `mapId`, а не `mapUid`;
- `mapIdList` передаётся списком через запятую;
- список надо батчить, чтобы не получить `414 URI Too Long`;
- безопасный размер батча: примерно 150-200 карт.

Для MVP:
- Nadeo token и accountId храним в `.env`;
- refresh/login flow не реализуем;
- если токен протух, показываем ошибку в Settings.

`.env` пример:
```env
NADEO_ACCOUNT_ID=...
NADEO_CORE_TOKEN=...
NADEO_LIVE_TOKEN=...
WARRIOR_API_URL=https://e416.dev/api3/tm/warrior/all
DATABASE_URL=sqlite:///./data/app.db
```

Возможное улучшение:
- добавить полноценный login/refresh flow;
- хранить токены локально в encrypted storage;
- добавить экран подключения аккаунта.

## 2.3 Позиция, нужная для Warrior medal

Для получения позиции по времени не нужно скачивать топ-10000.

Используем Nadeo Live API:

```http
POST https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/map?scores[{mapUid}]={score}
```

Body:
```json
{
  "maps": [
    {
      "mapUid": "MAP_UID",
      "groupUid": "Personal_Best"
    }
  ]
}
```

Где:
- `mapUid` — UID карты;
- `score` — время в миллисекундах;
- `groupUid = "Personal_Best"` — глобальный leaderboard.

Endpoint поддерживает до 50 карт за запрос.

Нужно получать позиции для:
- Warrior time;
- Author time;
- возможно PB игрока;
- возможно Gold/Silver/Bronze, если эти данные нужны для графиков.

Основная метрика:
```text
required_position = world position для warrior_time
```

---

# 3. Архитектура проекта

Предлагаемая структура:

```text
tm-warrior-dashboard/
  backend/
    app/
      main.py
      api/
        routes_health.py
        routes_maps.py
        routes_stats.py
        routes_sync.py
        routes_settings.py
      core/
        config.py
        database.py
        logging.py
      models/
        warrior_map.py
        player_record.py
        sync_job.py
        progress_snapshot.py
        user_note.py
      schemas/
        maps.py
        stats.py
        sync.py
        settings.py
      services/
        warrior_sync_service.py
        nadeo_core_service.py
        nadeo_live_service.py
        map_info_service.py
        stats_service.py
        recommendation_service.py
        snapshot_service.py
      repositories/
        maps_repository.py
        records_repository.py
        sync_repository.py
        stats_repository.py
      data/
        raw/
          warrior_all.json
        app.db
    requirements.txt
    .env.example

  frontend/
    src/
      app/
        App.tsx
        router.tsx
      api/
        client.ts
        mapsApi.ts
        statsApi.ts
        syncApi.ts
        settingsApi.ts
      components/
        layout/
        common/
        charts/
        maps/
        stats/
        settings/
      pages/
        DashboardPage.tsx
        MapsPage.tsx
        SettingsPage.tsx
        DesignPlaygroundPage.tsx
        ProgressEntryPage.tsx
      types/
        map.ts
        stats.ts
        sync.ts
      utils/
        timeFormat.ts
        difficulty.ts
    package.json
    vite.config.ts

  PROJECT_PLAN.md
  README.md
```

Current frontend route reality in the repository:

```text
/                   -> ProgressEntryPage
/dashboard          -> DashboardPage
/maps               -> MapsPage
/settings           -> SettingsPage
/design-playground  -> DesignPlaygroundPage
/playground         -> DesignPlaygroundPage
```

Current workspace split:

- Dashboard is overview-first.
- Maps owns the full maps database table.
- Settings owns sync controls and sync/account visibility.

---

# 4. База данных SQLite

SQLite подходит, потому что:
- проект локальный;
- один пользователь;
- нет высокой нагрузки;
- проще запуск;
- проще backup;
- не нужен отдельный контейнер с БД.

## 4.1 Таблица warrior_maps

Хранит базовую информацию по картам.

Поля:

```text
id
map_uid
map_id
name
author_name
category
campaign_name
campaign_type
club_name
thumbnail_url
trackmania_io_url
author_time_ms
gold_time_ms
silver_time_ms
bronze_time_ms
warrior_time_ms
world_record_time_ms
source
source_updated_at
created_at
updated_at
```

Индексы:
```text
unique(map_uid)
index(map_id)
index(category)
index(campaign_name)
```

Если в Warrior JSON не будет всех полей:
- сохраняем то, что есть;
- недостающие поля подтягиваем отдельным этапом;
- на MVP не блокируемся из-за thumbnail/category.

## 4.2 Таблица map_positions

Хранит позиции по времени.

```text
id
map_uid
position_type
score_ms
world_position
fetched_at
created_at
updated_at
```

`position_type`:
```text
warrior
author
gold
pb
```

Главная запись:
```text
position_type = warrior
score_ms = warrior_time_ms
world_position = позиция, нужная для Warrior
```

Индексы:
```text
unique(map_uid, position_type, score_ms)
index(world_position)
```

## 4.3 Таблица player_records

Хранит актуальные PB игрока.

```text
id
account_id
map_uid
map_id
pb_time_ms
pb_position_world
has_warrior
diff_to_warrior_ms
fetched_at
created_at
updated_at
```

`has_warrior`:
```text
pb_time_ms <= warrior_time_ms
```

`diff_to_warrior_ms`:
```text
pb_time_ms - warrior_time_ms
```

Если diff <= 0:
- медаль получена.

Если diff > 0:
- столько миллисекунд не хватает до Warrior.

## 4.4 Таблица player_record_history

Хранит историю PB.

```text
id
account_id
map_uid
map_id
pb_time_ms
diff_to_warrior_ms
has_warrior
source
recorded_at
```

Правило:
- при каждом sync PB сохраняем snapshot;
- если PB не изменился, можно не писать дубль;
- но daily snapshot прогресса всё равно сохраняем отдельно.

## 4.5 Таблица progress_snapshots

Хранит историю общего прогресса.

```text
id
account_id
total_maps
earned_warrior_count
missing_warrior_count
completion_percent
close_025_count
close_050_count
close_100_count
close_200_count
not_played_count
avg_diff_missing_ms
avg_margin_earned_ms
snapshot_at
```

Используется для:
- графика прогресса;
- статистики по дням;
- streak;
- "лучший день";
- "лучшая неделя".

## 4.6 Таблица sync_jobs

Хранит историю синхронизаций.

```text
id
job_type
status
started_at
finished_at
duration_ms
items_total
items_success
items_failed
error_message
details_json
```

`job_type`:
```text
warrior_data
map_info
warrior_positions
player_pbs
pb_positions
all
```

`status`:
```text
pending
running
success
failed
partial
```

## 4.7 Таблица user_notes

Локальные заметки пользователя.

```text
id
map_uid
note
tags_json
status
is_favorite
created_at
updated_at
```

`status`:
```text
none
grind_queue
in_progress
tilted
skip_for_now
done
```

---

# 5. Derived metrics

Derived metrics лучше считать на backend.

## 5.1 Получена ли Warrior medal

```text
has_warrior = pb_time_ms <= warrior_time_ms
```

## 5.2 Разница до Warrior

```text
diff_to_warrior_ms = pb_time_ms - warrior_time_ms
```

Интерпретация:
```text
diff <= 0       получено
0..250 ms       почти получено
250..500 ms     очень близко
500..1000 ms    близко
1000..2000 ms   достижимо
> 2000 ms       далеко
no PB           не играл / нет данных
```

## 5.3 Насколько PB лучше Warrior

```text
margin_vs_warrior_ms = warrior_time_ms - pb_time_ms
```

Используется для:
- "лучшие результаты";
- "зал славы";
- ranking своих сильных карт.

## 5.4 Разница AT -> Warrior

```text
author_to_warrior_ms = author_time_ms - warrior_time_ms
author_to_warrior_percent = author_to_warrior_ms / author_time_ms * 100
```

## 5.5 Разница WR -> Warrior

```text
wr_to_warrior_ms = warrior_time_ms - world_record_time_ms
wr_to_warrior_percent = wr_to_warrior_ms / world_record_time_ms * 100
```

## 5.6 Difficulty tier

Первичная версия:

```text
Free:
  required_position >= 50000

Easy:
  20000 <= required_position < 50000

Normal:
  5000 <= required_position < 20000

Hard:
  1000 <= required_position < 5000

Insane:
  250 <= required_position < 1000

Demon:
  required_position < 250
```

Важно:
- границы потом можно настроить;
- difficulty нужно хранить как computed value;
- лучше не записывать навсегда, а считать на выдаче.

## 5.7 Personal priority score

Нужен для рекомендаций.

Пример формулы:
```text
priority_score =
  closeness_score
  + easiness_score
  + freshness_score
  + category_bonus
  - skip_penalty
```

Компоненты:
```text
closeness_score:
  чем меньше diff_to_warrior_ms, тем выше

easiness_score:
  чем больше required_position, тем выше

freshness_score:
  если давно не обновлялся PB, тем выше

category_bonus:
  если пользователь хочет закрыть категорию, выше

skip_penalty:
  если карта в skip_for_now, ниже
```

---

# 6. Backend API

## 6.1 Health

```http
GET /api/health
```

Ответ:
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## 6.2 Maps table

```http
GET /api/maps
```

Query params:
```text
status=all|earned|missing|close|not_played
category=...
difficulty=...
search=...
sort=diff_to_warrior_ms
order=asc|desc
limit=100
offset=0
```

Ответ:
```json
{
  "items": [],
  "total": 4213,
  "limit": 100,
  "offset": 0
}
```

Каждый item должен включать:
```text
map_uid
map_id
name
category
campaign_name
thumbnail_url
author_time_ms
warrior_time_ms
world_record_time_ms
required_position
difficulty_tier
pb_time_ms
has_warrior
diff_to_warrior_ms
user_note
user_tags
grind_status
```

## 6.3 Map details

```http
GET /api/maps/{map_uid}
```

Нужно для будущей страницы конкретной карты.

Отдавать:
- базовые данные;
- PB;
- историю PB;
- позиции;
- заметки;
- похожие карты;
- рекомендации.

## 6.4 Stats summary

```http
GET /api/stats/summary
```

Отдаёт:
```text
total_maps
earned_count
missing_count
completion_percent
not_played_count
close_025_count
close_050_count
close_100_count
close_200_count
avg_diff_missing_ms
avg_margin_earned_ms
best_margin_maps
closest_missing_maps
hardest_earned_maps
easiest_missing_maps
```

## 6.5 Charts data

```http
GET /api/stats/charts
```

Отдаёт данные для:
- progress over time;
- distribution AT -> Warrior;
- distribution WR -> Warrior;
- distribution required positions;
- difficulty tier counts;
- earned by category;
- missing by category;
- heatmap by date/category.

Лучше не отдавать "готовые картинки".
Frontend сам строит графики.

## 6.6 Recommendations

```http
GET /api/recommendations/today
```

Ответ:
```text
quick_wins
hard_challenges
close_medals
stale_pbs
category_targets
random_missing
```

Пример:
```json
{
  "quick_wins": [],
  "close_medals": [],
  "hard_challenges": [],
  "category_targets": []
}
```

## 6.7 Sync

```http
POST /api/sync/warrior-data
POST /api/sync/map-info
POST /api/sync/warrior-positions
POST /api/sync/player-pbs
POST /api/sync/all
GET  /api/sync/jobs
GET  /api/sync/status
```

На первом этапе sync может быть синхронным:
- нажал кнопку;
- запрос выполняется;
- backend возвращает результат.

Если выполнение долгое:
- можно добавить простой background task;
- frontend показывает running status;
- результат читать через `/api/sync/jobs`.

## 6.8 Settings

```http
GET /api/settings
POST /api/settings/check-token
```

На MVP:
- настройки читаются из `.env`;
- через frontend их не меняем;
- frontend только показывает статус.

Позже:
```http
PATCH /api/settings
```

## 6.9 User notes

```http
PATCH /api/maps/{map_uid}/note
PATCH /api/maps/{map_uid}/tags
PATCH /api/maps/{map_uid}/status
```

Нужно для:
- заметок;
- тегов;
- grind queue;
- skip_for_now.

---

# 7. Sync-процессы

## 7.1 Sync Warrior Data

Цель:
- обновить локальную базу Warrior medals.

Шаги:
1. Скачать `https://e416.dev/api3/tm/warrior/all`.
2. Сохранить raw JSON в `data/raw/warrior_all.json`.
3. Распарсить карты.
4. Upsert в `warrior_maps`.
5. Создать sync_job.
6. Вернуть статистику:
   - сколько карт найдено;
   - сколько добавлено;
   - сколько обновлено;
   - сколько с ошибками.

Важно:
- frontend не должен напрямую ходить в `e416.dev`;
- только backend синхронизирует данные.

## 7.2 Sync Map Info

Цель:
- подтянуть недостающие данные по картам.

Нужные данные:
- `mapId`, если есть только `mapUid`;
- thumbnail;
- authorName;
- Trackmania.io link;
- возможно category/campaign metadata.

Если Warrior JSON уже содержит всё нужное:
- этот этап можно отложить.

Если не содержит:
- сделать отдельный сервис `map_info_service.py`;
- батчить запросы;
- не блокировать MVP.

## 7.3 Sync Warrior Positions

Цель:
- получить required position для Warrior medal.

Шаги:
1. Взять карты, где есть `map_uid` и `warrior_time_ms`.
2. Разбить на батчи до 50 карт.
3. Для каждой карты передать:
   - query param `scores[mapUid]=warrior_time_ms`;
   - body item `{ mapUid, groupUid: "Personal_Best" }`.
4. Сохранить world position в `map_positions`.
5. Повторить для всех карт.
6. Обновить sync_job.

Важно:
- endpoint может быть задержан;
- позиция может быть не идеально свежей;
- это нормально для аналитики.

## 7.4 Sync Player PBs

Цель:
- получить актуальные PB игрока.

Шаги:
1. Взять все карты с `map_id`.
2. Разбить на батчи по 150-200 map IDs.
3. Запросить Nadeo Core endpoint:
   ```http
   GET /v2/accounts/{accountId}/mapRecords?mapIdList=...
   ```
4. Сопоставить ответы с картами.
5. Обновить `player_records`.
6. Если PB изменился — записать в `player_record_history`.
7. Пересчитать:
   - `has_warrior`;
   - `diff_to_warrior_ms`.
8. Создать progress snapshot.

Важно:
- если карта не вернулась в ответе, значит PB нет или нет данных;
- не удалять старый PB без проверки;
- лучше отмечать `fetched_at`.

## 7.5 Sync PB Positions

Необязательный этап.

Цель:
- получить world position для PB игрока.

Можно делать:
- только для карт, где есть PB;
- только по кнопке;
- только для полученных Warrior;
- или как отдельный lightweight sync.

Использовать тот же Live endpoint позиции по времени.

## 7.6 Sync All

Порядок:
```text
1. warrior_data
2. map_info
3. warrior_positions
4. player_pbs
5. pb_positions
6. progress_snapshot
```

Для MVP:
```text
1. warrior_data
2. warrior_positions
3. player_pbs
4. progress_snapshot
```

---

# 8. Frontend pages

## 8.1 Main Dashboard Page

Главная страница.

Блоки:
- общий progress bar;
- sticky progress bar при скролле;
- карточки summary;
- рекомендации на сегодня;
- ближайшие медали;
- последние достижения;
- кнопки sync в правом нижнем Settings menu.

Карточки:
```text
Warrior medals:
  378 / 4213

Completion:
  8.97%

Close medals:
  42 within 1 sec

Not played:
  1510

Best result:
  Map X, -2.341 sec vs Warrior
```

Sticky behavior:
- большой progress bar на верхнем экране;
- при скролле вниз превращается в тонкую полоску сверху.

## 8.2 Maps Table Page

Главная рабочая таблица.

Колонки:
```text
Map
Category
Campaign
AT
Warrior
WR
Required position
Difficulty
My PB
Diff
Status
Tags
Actions
```

Фильтры:
```text
All
Earned
Missing
Close
Not played
Easy missing
Hard earned
Stale PB
Favorites
Grind queue
```

Сортировки:
```text
diff_to_warrior_ms asc
required_position desc
required_position asc
author_to_warrior_percent desc
wr_to_warrior_percent asc
pb_time_ms
updated_at
```

Actions:
```text
Open details
Add to grind queue
Mark skip for now
Edit note
Copy map UID
Open Trackmania.io
```

## 8.3 Stats Page

Вкладка с цифрами.

Блоки:
```text
Overall progress
Difficulty breakdown
Category breakdown
Close medals
Best results
Worst misses
Almost there
Not played
Earned by category
Average diff
```

Идеи:
- сколько Free/Easy/Normal/Hard/Insane/Demon получено;
- средний diff до Warrior по неполученным;
- средний margin по полученным;
- топ карт, где PB сильно лучше Warrior;
- топ самых обидных карт;
- топ лёгких неполученных;
- топ сложных полученных.

## 8.4 Charts Page

Две подвкладки:
```text
My charts
Global charts
```

My charts:
- progress over time;
- medals per day/week;
- PB improvement over time;
- heatmap активности;
- распределение diff до Warrior;
- earned by category;
- earned by difficulty.

Global charts:
- distribution of required positions;
- AT -> Warrior gap distribution;
- WR -> Warrior gap distribution;
- people count / position distribution;
- difficulty tier distribution;
- category difficulty comparison.

## 8.5 Grind Queue Page

Очередь карт для гринда.

Фичи:
- добавить карту в очередь;
- удалить из очереди;
- поменять порядок;
- отметить:
  - in progress;
  - tilted;
  - skip for now;
  - done.
- показать diff и required position;
- быстрые ссылки.

## 8.6 Settings Page / Floating Settings Button

Правый нижний значок настроек.

Функции:
```text
Sync Warrior Data
Sync Warrior Positions
Sync My PBs
Sync All
Check Nadeo token
Show last sync status
Show data freshness
Export backup
Import backup
```

Статус:
```text
Warrior data: updated 2 hours ago
Positions: updated 4 days ago
My PBs: updated 10 minutes ago
Nadeo token: valid
Maps without position: 37
Maps without PB: 1510
```

---

# 9. Рекомендации "Что катать сейчас?"

Это одна из центральных фич.

## 9.1 Quick Wins

Карты:
```text
not earned
diff_to_warrior_ms <= 1000
required_position >= 5000
not skip_for_now
```

Сортировка:
```text
diff_to_warrior_ms asc
```

## 9.2 Close Medals

Карты:
```text
not earned
diff_to_warrior_ms <= 500
```

## 9.3 Easy Missing

Карты:
```text
not earned
required_position >= 20000
```

## 9.4 Hard Challenge

Карты:
```text
not earned
required_position < 1000
diff_to_warrior_ms <= 3000
```

## 9.5 Stale PB

Карты:
```text
PB есть
PB давно не обновлялся
медаль не получена
```

## 9.6 Category Completion

Карты из категории, где:
```text
осталось мало медалей до 100%
```

Например:
```text
Weekly Shorts: 49 / 52
Осталось 3 карты
```

## 9.7 Random Missing

Случайная неполученная карта.

Параметры:
```text
exclude skip_for_now
optional difficulty
optional category
```

---

# 10. Этапы реализации

Проект делим на 3 крупные части.

---

# PART 1. Core Data & MVP

Цель:
- получить рабочее приложение;
- собрать данные;
- показать прогресс;
- сделать таблицу;
- синхронизировать PB.

Финальный результат Part 1:
- backend запускается;
- frontend запускается;
- SQLite содержит карты;
- можно нажать sync;
- виден прогресс по Warrior medals;
- есть таблица с фильтрами;
- видно, какие медали получены.

## 1.1 Инициализация проекта

Задачи:
- создать monorepo;
- настроить backend FastAPI;
- настроить frontend React + Vite;
- добавить `.env.example`;
- добавить README;
- добавить базовый запуск.

Команды примерно:
```bash
mkdir tm-warrior-dashboard
cd tm-warrior-dashboard

mkdir backend frontend
```

Backend:
```bash
cd backend
python -m venv .venv
pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings httpx python-dotenv
pip freeze > requirements.txt
```

Frontend:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

Критерий готовности:
- `GET /api/health` возвращает ok;
- React page открывается;
- frontend умеет вызвать `/api/health`.

## 1.2 SQLite + модели

Задачи:
- настроить SQLAlchemy;
- создать модели:
  - `WarriorMap`;
  - `MapPosition`;
  - `PlayerRecord`;
  - `PlayerRecordHistory`;
  - `ProgressSnapshot`;
  - `SyncJob`;
  - `UserNote`;
- сделать init DB.

Критерий готовности:
- при запуске создаётся `data/app.db`;
- таблицы созданы;
- можно сделать простой insert/select.

## 1.3 Sync Warrior Data

Задачи:
- реализовать `warrior_sync_service.py`;
- скачать `WARRIOR_API_URL`;
- сохранить raw JSON;
- распарсить карты;
- сделать upsert в `warrior_maps`;
- сделать endpoint `POST /api/sync/warrior-data`.

Критерий готовности:
- после sync в БД есть карты;
- raw JSON сохранён;
- sync job записан.

Важно для Codex:
- сначала вывести структуру JSON в лог;
- не делать жёстких предположений о полях;
- добавить defensive parsing;
- неизвестные поля временно сохранять в `raw_json`.

## 1.4 Maps API

Задачи:
- реализовать `GET /api/maps`;
- добавить пагинацию;
- добавить сортировку;
- добавить фильтр earned/missing/not_played;
- отдавать derived fields.

Критерий готовности:
- frontend получает список карт;
- можно сортировать хотя бы по Warrior time;
- можно искать по названию.

## 1.5 Frontend layout

Задачи:
- настроить базовый layout;
- сделать sidebar/tabs;
- сделать страницы:
  - Dashboard;
  - Maps Table;
  - Stats;
  - Charts;
  - Settings;
- добавить базовую навигацию.

Критерий готовности:
- можно переключаться между страницами;
- страницы выглядят аккуратно;
- нет "временной админки".

## 1.6 Maps Table UI

Задачи:
- таблица карт;
- сортировка;
- фильтры;
- форматирование времени;
- бейджи difficulty/status;
- loading/error states.

Критерий готовности:
- таблица удобна для просмотра;
- можно искать карты;
- можно фильтровать.

## 1.7 Sync Warrior Positions

Задачи:
- реализовать `nadeo_live_service.py`;
- брать `NADEO_LIVE_TOKEN` из `.env`;
- батчить карты по 50;
- получать required position;
- сохранять в `map_positions`;
- endpoint `POST /api/sync/warrior-positions`.

Критерий готовности:
- у карт появляется `required_position`;
- таблица умеет сортировать по сложности;
- ошибки пишутся в sync_jobs.

Важно:
- если токен не задан, endpoint должен вернуть понятную ошибку;
- если часть карт не вернулась, job = partial;
- не падать полностью из-за одной карты.

## 1.8 Sync Player PBs

Задачи:
- реализовать `nadeo_core_service.py`;
- брать `NADEO_ACCOUNT_ID` и `NADEO_CORE_TOKEN`;
- батчить `mapIdList` по 150-200 карт;
- обновлять `player_records`;
- писать историю в `player_record_history`;
- создавать progress snapshot;
- endpoint `POST /api/sync/player-pbs`.

Критерий готовности:
- приложение видит PB игрока;
- считает `has_warrior`;
- считает `diff_to_warrior_ms`;
- Dashboard показывает реальный прогресс.

Важно:
- если у карты нет `map_id`, пропустить и записать warning;
- если PB не найден, не считать карту полученной;
- если PB изменился, записать историю.

## 1.9 Main Dashboard MVP

Задачи:
- progress bar;
- sticky progress bar при скролле;
- summary cards;
- close medals block;
- quick wins block;
- sync status block.

Критерий готовности:
- на главной видно:
  - сколько всего медалей;
  - сколько получено;
  - сколько не хватает;
  - какие карты ближе всего;
  - когда был последний sync.

---

# PART 2. Analytics & UX

Цель:
- сделать проект полезным как игровой помощник;
- добавить статистику, графики, рекомендации;
- хранить и показывать историю прогресса.

Финальный результат Part 2:
- вкладка статистики заполнена;
- есть графики;
- есть рекомендации;
- есть история прогресса;
- есть heatmap;
- есть категории сложности.

## 2.1 Stats Service

Задачи:
- реализовать `stats_service.py`;
- считать summary stats;
- endpoint `GET /api/stats/summary`.

Метрики:
```text
total maps
earned count
missing count
completion percent
not played count
close 0.25s
close 0.5s
close 1s
close 2s
average missing diff
average earned margin
earned by category
earned by difficulty
```

## 2.2 Stats Page

Задачи:
- карточки по сложности;
- карточки по категориям;
- top closest missing;
- top best earned;
- top hardest earned;
- top easiest missing;
- almost there board.

Критерий готовности:
- вкладка статистики даёт больше пользы, чем таблица.

## 2.3 Charts Data API

Задачи:
- `GET /api/stats/charts`;
- подготовить данные для графиков;
- не смешивать логику графиков с frontend.

Графики:
```text
progress over time
medals per day/week
diff distribution
required position distribution
AT -> Warrior distribution
WR -> Warrior distribution
category progress
difficulty progress
```

## 2.4 Charts Page

Задачи:
- сделать вкладки:
  - My charts;
  - Global charts.
- подключить chart library;
- добавить tooltips;
- добавить empty states.

## 2.5 Heatmap

Задачи:
- heatmap получения медалей;
- heatmap активности PB updates;
- календарный вид.

Возможные источники:
- `progress_snapshots`;
- `player_record_history`.

## 2.6 Recommendations Service

Задачи:
- реализовать `recommendation_service.py`;
- endpoint `GET /api/recommendations/today`.

Блоки:
```text
Quick wins
Close medals
Easy missing
Hard challenge
Stale PB
Category completion
Random missing
```

## 2.7 Better Dashboard

Задачи:
- добавить рекомендации на главную;
- добавить activity feed;
- добавить "медаль дня";
- добавить "за последнюю неделю".

## 2.8 Notes, Tags, Grind Queue

Задачи:
- реализовать `user_notes`;
- API для note/tags/status;
- кнопки в таблице;
- отдельная Grind Queue page.

Критерий готовности:
- можно добавлять карты в очередь;
- можно писать заметки;
- можно скрывать/скипать неприятные карты.

## 2.9 Map Details Page

Задачи:
- страница конкретной карты;
- показывать:
  - времена;
  - PB;
  - diff;
  - required position;
  - историю PB;
  - заметки;
  - похожие карты;
  - быстрые ссылки.

---

# PART 3. Polish & Self-hosted Tooling

Цель:
- сделать проект удобным, стабильным и переносимым;
- добавить backup/import/export;
- улучшить локальный запуск;
- подготовить базу под возможный companion plugin.

Финальный результат Part 3:
- проект удобно запускать локально;
- есть backup;
- есть import/export;
- понятные ошибки;
- хорошее состояние sync;
- можно передать проект другому человеку.

## 3.1 Settings UX

Задачи:
- нормальная Settings page;
- token status;
- data freshness;
- sync buttons;
- last sync logs;
- missing data report.

## 3.2 Import/Export

Задачи:
- export SQLite backup;
- export JSON backup;
- import backup;
- export close maps to Markdown/CSV;
- export grind queue.

Примеры:
```text
export close maps <= 1 sec
export easy missing
export grind queue
```

## 3.3 Error Handling

Задачи:
- единый формат ошибок backend;
- красивые error states на frontend;
- partial sync report;
- retry failed maps;
- не падать из-за одного плохого ответа.

## 3.4 Docker / Local Run

Задачи:
- Dockerfile backend;
- Dockerfile frontend;
- docker-compose.yml;
- volume для SQLite;
- `.env.example`;
- README с запуском.

Возможный compose:
```text
backend
frontend
volume ./data:/app/data
```

## 3.5 Performance

Задачи:
- индексы SQLite;
- пагинация таблицы;
- debounce поиска;
- кеширование summary;
- не пересчитывать тяжёлые stats на каждый запрос.

## 3.6 PostgreSQL Upgrade Path

Не делать в MVP, но заложить возможность.

Что потребуется:
- не использовать SQLite-specific SQL;
- держать SQLAlchemy migrations;
- вынести `DATABASE_URL`;
- добавить PostgreSQL service в compose.

## 3.7 Nadeo Auth Upgrade

Не делать в MVP.

Возможное улучшение:
- экран подключения аккаунта;
- refresh token;
- хранение токенов;
- автоматическое обновление;
- проверка audience:
  - `NadeoServices`;
  - `NadeoLiveServices`.

## 3.8 Scheduled Sync

Не делать в MVP.

Возможное улучшение:
- APScheduler;
- sync раз в день;
- разные intervals:
  - Warrior data раз в день/неделю;
  - positions раз в неделю;
  - PB по кнопке или при запуске.

## 3.9 Openplanet Companion Plugin

Самый последний пункт.

Идеи:
- отправлять текущий `mapUid` в backend;
- открывать карту в dashboard;
- отправлять локальный PB после финиша;
- показывать overlay:
  - Warrior time;
  - diff до Warrior;
  - required position;
  - заметка по карте.

Важно:
- публиковать плагин стоит только когда основной проект стабилен;
- до этого не тратить время на Openplanet.

---

# 11. Приоритетная последовательность задач для Codex

Использовать этот порядок.

## Sprint 1

```text
1. Создать структуру backend/frontend.
2. Настроить FastAPI health endpoint.
3. Настроить React/Vite.
4. Настроить SQLite и модели.
5. Добавить .env.example.
```

## Sprint 2

```text
1. Реализовать sync Warrior data.
2. Сохранять raw JSON.
3. Парсить карты.
4. Upsert в SQLite.
5. Сделать GET /api/maps.
6. Показать таблицу на frontend.
```

## Sprint 3

```text
1. Сделать нормальный frontend layout.
2. Сделать Maps Table page.
3. Добавить фильтры и сортировку.
4. Добавить форматирование времени.
5. Добавить loading/error states.
```

## Sprint 4

```text
1. Реализовать Nadeo Live service.
2. Получать required position для Warrior.
3. Сохранять позиции.
4. Отображать required position в таблице.
5. Добавить difficulty tier.
```

## Sprint 5

```text
1. Реализовать Nadeo Core service.
2. Получать PB игрока.
3. Считать has_warrior и diff.
4. Писать PB history.
5. Создавать progress snapshots.
```

## Sprint 6

```text
1. Сделать Dashboard page.
2. Добавить progress bar.
3. Добавить sticky progress bar.
4. Добавить summary cards.
5. Добавить close medals и quick wins.
```

## Sprint 7

```text
1. Сделать Stats service.
2. Сделать Stats page.
3. Добавить difficulty/category breakdown.
4. Добавить топы:
   - closest missing;
   - best earned;
   - easiest missing;
   - hardest earned.
```

## Sprint 8

```text
1. Сделать Charts API.
2. Сделать Charts page.
3. Добавить графики.
4. Добавить heatmap.
```

## Sprint 9

```text
1. Сделать Recommendations service.
2. Добавить "Что катать сейчас?".
3. Добавить "медаль дня".
4. Добавить category completion recommendations.
```

## Sprint 10

```text
1. Добавить notes/tags/status.
2. Сделать Grind Queue.
3. Сделать import/export.
4. Улучшить Settings.
5. Добавить backup.
```

---

# 12. Подсказки для Codex

## 12.1 Не делать всё сразу

Каждая задача должна быть маленькой.

Плохая задача:
```text
Сделай весь проект.
```

Хорошая задача:
```text
Сделай FastAPI backend с SQLite,
моделями WarriorMap и SyncJob,
health endpoint и init DB.
Не трогай frontend.
```

## 12.2 Всегда просить Codex сохранять результат в файлы

Пример:
```text
Внеси изменения в проект.
Создай/измени только нужные файлы.
В конце напиши список изменённых файлов
и как проверить результат.
```

## 12.3 Для sync-задач просить defensive parsing

Пример:
```text
Реализуй sync Warrior data.
Не делай жёстких предположений о JSON.
Если поле отсутствует, сохраняй None.
Raw объект карты сохрани в raw_json.
Добавь логирование количества добавленных,
обновлённых и пропущенных карт.
```

## 12.4 Для Nadeo API просить батчинг

Пример:
```text
Реализуй получение PB через Nadeo Core API.
Бери map_id из БД.
Дели mapIdList на батчи по 150 карт.
Если батч падает, логируй ошибку
и продолжай следующие батчи.
```

## 12.5 Для frontend просить красивые finished-фичи

Пример:
```text
Сделай Maps Table page сразу в нормальном виде:
карточный layout страницы, таблица,
поиск, фильтры, сортировка,
loading skeleton, error state,
empty state.
Не делай временную страшную админку.
```

---

# 13. MVP Definition of Done

MVP считается готовым, если:

```text
1. Проект запускается локально.
2. Backend создаёт SQLite DB.
3. Warrior data синхронизируется в локальную БД.
4. Required position синхронизируется через Nadeo Live API.
5. PB игрока синхронизируются через Nadeo Core API.
6. Dashboard показывает общий прогресс.
7. Maps Table показывает все карты.
8. Можно фильтровать:
   - полученные;
   - неполученные;
   - близкие;
   - неигранные.
9. Есть Settings button с ручными sync-действиями.
10. Есть история progress snapshots.
```

---

# 14. Что НЕ делать в MVP

Чтобы проект не расползся, в MVP не делать:

```text
- полноценную авторизацию Ubisoft/Nadeo;
- PostgreSQL;
- публичный multi-user режим;
- Openplanet plugin;
- автоматический scheduled sync;
- сложную страницу деталей карты;
- импорт/экспорт;
- Docker, если локально и так удобно;
- идеальную систему тегов;
- сложную формулу difficulty score.
```

Это всё можно добавить позже.

---

# 15. Главный ориентир

Главное — не превратить проект в "ещё одну таблицу".

Dashboard должен отвечать на вопросы:

```text
Сколько я уже получил?
Что я могу быстро добить?
Где я почти взял медаль?
Какие медали реально лёгкие?
Какие медали я взял круче всего?
Какие категории стоит закрывать?
Что катать сегодня?
Как я прогрессирую со временем?
```

Если каждая новая фича помогает ответить на один из этих вопросов,
её стоит добавлять.

Если фича просто "потому что можно",
лучше отложить.
