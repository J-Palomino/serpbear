#!/bin/sh

# Ensure data directory exists with proper permissions
mkdir -p /app/data
chmod 755 /app/data

# Initialize settings.json if it doesn't exist and SCRAPING_API is set
if [ ! -f /app/data/settings.json ] && [ -n "$SCRAPING_API" ]; then
    echo "Initializing settings with ScrapingAnt API key..."
    cat > /app/data/settings.json << EOF
{
    "scraper_type": "${SCRAPER_TYPE:-scrapingant}",
    "scaping_api": "",
    "notification_interval": "never",
    "notification_email": "",
    "smtp_server": "",
    "smtp_port": "",
    "smtp_username": "",
    "smtp_password": "",
    "scrape_retry": true,
    "search_console": true
}
EOF
fi

# Initialize key_rotation.json with the API key for rotation
if [ ! -f /app/data/key_rotation.json ] && [ -n "$SCRAPING_API" ]; then
    echo "Initializing key rotation with ScrapingAnt API key..."
    RESET_DATE=$(date -d "+1 month" -I 2>/dev/null || date -v+1m +%Y-%m-%d)
    cat > /app/data/key_rotation.json << EOF
{
    "keys": [
        {
            "key": "$SCRAPING_API",
            "provider": "${SCRAPER_TYPE:-scrapingant}",
            "usageCount": 0,
            "lastUsed": "",
            "monthlyLimit": 10000,
            "resetDate": "${RESET_DATE}T00:00:00.000Z"
        }
    ],
    "currentIndex": 0
}
EOF
fi

# Initialize failed_queue.json if it doesn't exist
if [ ! -f /app/data/failed_queue.json ]; then
    echo "[]" > /app/data/failed_queue.json
fi

# Run database migrations
npx sequelize-cli db:migrate --env production

exec "$@"
