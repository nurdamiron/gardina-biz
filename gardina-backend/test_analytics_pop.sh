#!/bin/bash

# Configuration
API_URL="http://localhost:3001/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRmOGNkZTJiLWJkNzUtNDk4YS1hNWJjLTMyZTNiZmNkOGE4YyIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJwaG9uZSI6Iis3Nzc3Nzc3Nzc3NyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2ODE5ODg5MCwiZXhwIjoxNzY4ODAzNjkwfQ.yRi71uO5bRAZRmx-l2__tF4rRCBy4SDFLlb1rJ101Bw"

# IDs
MEASUREMENT_ID="99999999-9999-4999-a999-999999999999"
ROOM_ID="88888888-8888-4888-a888-888888888888"
ITEM_ID="77777777-7777-4777-a777-777777777777"
FABRIC_ID="2ff46169-ae04-47a6-bb41-9b5ef9839c43"
CLIENT_ID="5c0c27e5-4a6c-4861-a083-2077e6827054" # Using existing client
DESIGNER_ID="4f8cde2b-bd75-498a-a5bc-32e3bfcd8a8c" # Admin as designer

echo "==================================================="
echo "   ANALYTICS POPULATION TEST"
echo "==================================================="

# 1. Clean up previous test data
echo "🔹 Cleaning up..."
# Delete deal first if exists (we don't know deal id yet)
# We'll just rely on unique IDs for measurement/room/item to avoid clashes
PGPASSWORD=prometric01 psql -h prometric.cde42ec8m1u7.eu-north-1.rds.amazonaws.com -U prometric -d shtory -p 5432 -c "DELETE FROM measurement_windows WHERE measurement_id = '$MEASUREMENT_ID'; DELETE FROM room_items WHERE room_id = '$ROOM_ID'; DELETE FROM rooms WHERE id = '$ROOM_ID'; DELETE FROM measurements WHERE id = '$MEASUREMENT_ID';" > /dev/null 2>&1

# 2. SQL Insert Measurement Chain
echo "🔹 Inserting Client, Measurement, Room, Item (SQL)..."
PGPASSWORD=prometric01 psql -h prometric.cde42ec8m1u7.eu-north-1.rds.amazonaws.com -U prometric -d shtory -p 5432 <<EOF
INSERT INTO clients (id, name, phone)
VALUES ('$CLIENT_ID', 'Test Client', '+77000000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO measurements (id, client_id, designer_id, status, address, scheduled_at)
VALUES ('$MEASUREMENT_ID', '$CLIENT_ID', '$DESIGNER_ID', 'completed', 'Test Address', NOW());

INSERT INTO rooms (id, measurement_id, name)
VALUES ('$ROOM_ID', '$MEASUREMENT_ID', 'Test Room');

INSERT INTO room_items (id, room_id, fabric_id, quantity)
VALUES ('$ITEM_ID', '$ROOM_ID', '$FABRIC_ID', 1);
EOF

# 3. Create Deal via API (Triggers Repo logic)
echo "🔹 Creating Deal (API)..."
DEAL_RES=$(curl -s -X POST "$API_URL/deals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"designerId\": \"$DESIGNER_ID\",
    \"measurementId\": \"$MEASUREMENT_ID\",
    \"status\": \"scheduled\",
    \"totalAmount\": 100000,
    \"prepayment\": 50000,
    \"prepaymentPercent\": 50,
    \"finalPayment\": 50000,
    \"deadline\": \"2026-02-01T00:00:00Z\",
    \"paymentStatus\": \"partial\"
  }")

DEAL_ID=$(echo $DEAL_RES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$DEAL_ID" ]; then
  echo "❌ Deal Creation Failed"
  echo $DEAL_RES
  exit 1
fi
echo "✅ Deal Created: $DEAL_ID"

# 4. Check deal_products
echo "🔹 Checking deal_products..."
COUNT=$(PGPASSWORD=prometric01 psql -h prometric.cde42ec8m1u7.eu-north-1.rds.amazonaws.com -U prometric -d shtory -p 5432 -t -c "SELECT COUNT(*) FROM deal_products WHERE deal_id = '$DEAL_ID';")
COUNT=$(echo $COUNT | xargs) # trim

if [ "$COUNT" -eq "1" ]; then
  echo "✅ deal_products populated! Count: $COUNT"
else
  echo "❌ deal_products failed. Count: $COUNT"
fi

# 5. Check Analytics
echo "🔹 Checking Analytics Endpoints..."
ANALYTICS_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/analytics/product-sales?period=month")
echo "Response excerpt: ${ANALYTICS_RES:0:200}"

if [[ $ANALYTICS_RES == *"success\":true"* ]]; then
  echo "✅ Analytics Endpoint responding"
else
  echo "❌ Analytics Endpoint failed"
fi

echo "==================================================="
