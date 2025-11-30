# Docker конфигурация для BuildPlanner

Этот проект настроен для запуска в Docker контейнерах с использованием Docker Compose.

## Требования

- Docker Engine 20.10+
- Docker Compose 2.0+

## Быстрый старт

### 1. Подготовка переменных окружения

Скопируйте пример файла с переменными окружения:

```bash
cp .env.docker.example .env.docker
```

Отредактируйте `.env.docker` и заполните необходимые значения, особенно:

- `NEXTAUTH_SECRET` - сгенерируйте новый секретный ключ: `openssl rand -base64 32`
- `YANDEX_CLOUD_API_KEY` - ваш API ключ от Yandex Cloud

### 2. Запуск в production режиме

```bash
# Загрузка переменных окружения из .env.docker
export $(cat .env.docker | xargs)

# Сборка и запуск
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down
```

Приложение будет доступно по адресу: http://localhost:3000

### 3. Запуск только базы данных для разработки

Если вы хотите запускать приложение локально, но использовать Docker для базы данных:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

База данных будет доступна по адресу: `postgresql://postgres:postgres@localhost:5432/buildplanner`

## Основные команды

### Сборка образа

```bash
docker-compose build
```

### Запуск контейнеров

```bash
docker-compose up -d
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только приложение
docker-compose logs -f app

# Только база данных
docker-compose logs -f postgres
```

### Остановка контейнеров

```bash
docker-compose down
```

### Остановка с удалением volumes (удалит данные БД!)

```bash
docker-compose down -v
```

### Выполнение команд в контейнере

```bash
# Выполнить миграции вручную
docker-compose exec app npx prisma migrate deploy

# Открыть Prisma Studio
docker-compose exec app npx prisma studio

# Открыть shell в контейнере
docker-compose exec app sh
```

### Перезапуск сервиса

```bash
docker-compose restart app
```

## Структура Docker конфигурации

- `Dockerfile` - multi-stage build для Next.js приложения
- `docker-compose.yml` - конфигурация для production (приложение + PostgreSQL)
- `docker-compose.dev.yml` - конфигурация для разработки (только PostgreSQL)
- `.dockerignore` - файлы, исключаемые из Docker context
- `docker-entrypoint.sh` - скрипт запуска, выполняющий миграции перед стартом

## Особенности

1. **Multi-stage build** - оптимизированный образ с минимальным размером
2. **Standalone output** - Next.js собирается в standalone режиме для лучшей производительности
3. **Автоматические миграции** - Prisma миграции выполняются автоматически при старте контейнера
4. **Health checks** - проверка готовности PostgreSQL перед запуском приложения
5. **Volumes** - данные базы данных и статические файлы сохраняются в volumes

## Переменные окружения

Основные переменные окружения настраиваются через `.env.docker`:

- `DATABASE_URL` - автоматически настраивается в docker-compose.yml
- `NEXTAUTH_SECRET` - секретный ключ для NextAuth
- `NEXTAUTH_URL` - URL приложения
- `YANDEX_CLOUD_API_KEY` - API ключ Yandex Cloud
- `YANDEX_CLOUD_PROJECT_ID` - ID проекта Yandex Cloud
- `YANDEX_CLOUD_AGENT_ID` - ID агента Yandex Cloud

## Troubleshooting

### Проблемы с подключением к базе данных

Проверьте, что контейнер PostgreSQL запущен:

```bash
docker-compose ps
```

Проверьте логи PostgreSQL:

```bash
docker-compose logs postgres
```

### Проблемы с миграциями

Выполните миграции вручную:

```bash
docker-compose exec app npx prisma migrate deploy
```

### Очистка и пересборка

Если возникли проблемы, попробуйте полную очистку:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Проверка размера образа

```bash
docker images | grep buildplanner
```

## Production рекомендации

1. **Безопасность**:

   - Измените пароли PostgreSQL в production
   - Используйте секреты Docker или внешний менеджер секретов
   - Генерируйте сильные `NEXTAUTH_SECRET`

2. **Производительность**:

   - Настройте ограничения ресурсов в docker-compose.yml
   - Используйте внешнюю БД для production
   - Настройте reverse proxy (nginx)

3. **Мониторинг**:

   - Добавьте логирование
   - Настройте health checks
   - Используйте мониторинг контейнеров

4. **Резервное копирование**:
   - Регулярно делайте бэкапы PostgreSQL volumes
   - Настройте автоматическое резервное копирование

