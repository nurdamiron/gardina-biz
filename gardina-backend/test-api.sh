#!/bin/bash

# Gardina API Test Script
# Tests the REST API endpoints

API_URL="http://localhost:3001/api"

echo "🧪 Testing Gardina API"
echo "=============================="
echo ""

# 1. Create a test client
echo "1️⃣  Creating test client..."
CLIENT_RESPONSE=$(curl -s -X POST $API_URL/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовый Клиент",
    "phone": "+77771234567",
    "whatsapp": "+77771234567",
    "email": "test@client.kz",
    "address": "Алматы, ул. Абая, 1",
    "notes": "Тестовый клиент для проверки API"
  }')

echo "$CLIENT_RESPONSE" | jq '.'
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.id')
echo "✅ Client created with ID: $CLIENT_ID"
echo ""

# 2. Get designer ID (admin user)
echo "2️⃣  Getting designer ID..."
DESIGNER_ID=$(psql "postgresql://prometric:prometric01@prometric.cde42ec8m1u7.eu-north-1.rds.amazonaws.com:5432/shtory?sslmode=require" \
  -t -c "SELECT id FROM users WHERE role='admin' LIMIT 1" | tr -d ' ')
echo "✅ Designer ID: $DESIGNER_ID"
echo ""

# 3. Create a deal
echo "3️⃣  Creating deal..."
DEAL_RESPONSE=$(curl -s -X POST $API_URL/deals \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"designerId\": \"$DESIGNER_ID\"
  }")

echo "$DEAL_RESPONSE" | jq '.'
DEAL_ID=$(echo "$DEAL_RESPONSE" | jq -r '.data.id')
echo "✅ Deal created with ID: $DEAL_ID"
echo ""

# 4. Get all deals
echo "4️⃣  Getting all deals..."
curl -s $API_URL/deals | jq '.'
echo ""

# 5. Get specific deal
echo "5️⃣  Getting deal details..."
curl -s $API_URL/deals/$DEAL_ID | jq '.'
echo ""

echo "✅ All tests completed!"
