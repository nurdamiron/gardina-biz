# Gardina — AWS EC2 Deployment Guide

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS EC2                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    NGINX                              │    │
│  │            (Reverse Proxy + SSL)                      │    │
│  │                                                       │    │
│  │  gardina.kz      app.gardina.kz     api.gardina.kz     │    │
│  │      │               │                 │             │    │
│  │      ▼               ▼                 ▼             │    │
│  │  Landing         Frontend          Backend           │    │
│  │  (Static)        (React)          (Node.js)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                    AWS RDS                          │     │
│  │                  (PostgreSQL)                       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Домены

| Домен | Назначение |
|-------|-----------|
| `gardina.kz` | Лендинг для клиентов |
| `app.gardina.kz` | CRM приложение |
| `api.gardina.kz` | Backend API |

---

## Шаг 1: Настройка AWS EC2

### 1.1 Создание EC2 Instance

1. Войдите в AWS Console → EC2
2. Нажмите "Launch Instance"
3. Настройки:
   - **Name**: `gardina-production`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.small` (2 vCPU, 2GB RAM) или выше
   - **Key pair**: Создайте новый или выберите существующий
   - **Network settings**:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
   - **Storage**: 30 GB gp3

4. Нажмите "Launch instance"

### 1.2 Elastic IP (Статический IP)

1. EC2 → Elastic IPs → Allocate Elastic IP
2. Выберите IP → Actions → Associate
3. Выберите ваш instance

**Запомните IP адрес!** Например: `52.123.45.67`

---

## Шаг 2: Настройка DNS

В настройках вашего домена (gardina.kz) добавьте записи:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 52.123.45.67 | 300 |
| A | www | 52.123.45.67 | 300 |
| A | app | 52.123.45.67 | 300 |
| A | api | 52.123.45.67 | 300 |

> Замените `52.123.45.67` на ваш Elastic IP

---

## Шаг 3: Подключение к серверу

```bash
# Подключение через SSH
ssh -i your-key.pem ubuntu@52.123.45.67

# Или если у вас настроен SSH config
ssh gardina-ec2
```

---

## CI/CD (рекомендуется)

Теперь есть единый workflow для всего стека:

- `.github/workflows/deploy-aws-stack.yml`
- скрипт на сервере: `scripts/deploy-aws-stack.sh`

Что делает workflow:

1. Пакует `docker-compose.yml`, `nginx/`, `gardina-frontend/`, `gardina-backend/`, `gardina-bot/`.
2. Загружает архив на EC2.
3. Запускает `docker compose up -d --build` через `scripts/deploy-aws-stack.sh`.
4. Проверяет `https://gardina.kz`, `https://app.gardina.kz`, `https://api.gardina.kz/health`.

Нужные GitHub Secrets:

- `EC2_HOST` — IP/DNS вашего `projects` инстанса
- `EC2_SSH_KEY` — приватный SSH ключ (PEM)

---

## Шаг 4: Установка на сервере (ручной старт)

### 4.1 Клонирование репозитория

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/gardina.git
cd gardina
```

### 4.2 Запуск деплоя

```bash
sudo ./deploy.sh
```

Скрипт автоматически:
- Установит Docker и Docker Compose
- Получит SSL сертификаты от Let's Encrypt
- Соберет и запустит все контейнеры

---

## Шаг 5: Проверка

После деплоя проверьте:

```bash
# Статус контейнеров
docker-compose ps

# Логи
docker-compose logs -f

# Тест API
curl https://api.gardina.kz/health
```

Откройте в браузере:
- https://gardina.kz - Лендинг
- https://app.gardina.kz - Приложение
- https://api.gardina.kz/health - API Health

---

## Полезные команды

```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск конкретного сервиса
docker-compose restart backend

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Пересборка после изменений
docker-compose up -d --build

# Остановка
docker-compose down

# Обновление SSL сертификатов
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## Обновление кода

```bash
# На сервере
cd ~/gardina

# Получить изменения
git pull origin main

# Пересобрать и перезапустить
docker-compose up -d --build
```

---

## Мониторинг

### Логи в реальном времени
```bash
docker-compose logs -f --tail=100
```

### Использование ресурсов
```bash
docker stats
```

### Место на диске
```bash
df -h
docker system df
```

### Очистка
```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить все неиспользуемое
docker system prune -a
```

---

## SSL Сертификаты

Сертификаты Let's Encrypt автоматически обновляются через certbot контейнер.

Для ручного обновления:
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## Troubleshooting

### Nginx не запускается
```bash
# Проверить конфиг
docker-compose exec nginx nginx -t

# Посмотреть логи
docker-compose logs nginx
```

### Backend не работает
```bash
# Логи backend
docker-compose logs backend

# Зайти в контейнер
docker-compose exec backend sh
```

### Проблемы с SSL
```bash
# Проверить сертификаты
ls -la certbot/conf/live/gardina.kz/

# Переполучить сертификаты
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d gardina.kz -d www.gardina.kz -d app.gardina.kz -d api.gardina.kz
```

---

## Безопасность

1. **Firewall**: Убедитесь что открыты только порты 22, 80, 443
2. **SSH**: Используйте только ключи, отключите парольную авторизацию
3. **Обновления**: Регулярно обновляйте систему
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Контакты

- WhatsApp: +7 707 942 9827
- Email: support@gardina.kz
