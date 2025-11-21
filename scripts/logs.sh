#!/bin/bash

# Script pour voir les logs de tous les services ou d'un service spécifique

if [ -z "$1" ]; then
    echo "📋 Logs de tous les services (Ctrl+C pour quitter):"
    docker-compose logs -f
else
    echo "📋 Logs du service $1 (Ctrl+C pour quitter):"
    docker-compose logs -f "$1"
fi
