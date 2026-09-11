#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "КОТОМАТИКА — локальный сервер"
echo "На этом компьютере: http://localhost:8000/"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$IP" ]; then echo "Для iPhone в той же Wi-Fi: http://$IP:8000/"; fi
echo "Не закрывайте терминал, пока смотрите сайт."
python3 -m http.server 8000 --bind 0.0.0.0
