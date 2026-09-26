#!/bin/bash
# Test Inventory System

API_URL="http://localhost:3001/api"
EMAIL="admin@gardina.kz"
PASSWORD="${ADMIN_PASSWORD:?export ADMIN_PASSWORD=...}"

# 1. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "Raw Login Response: $LOGIN_RES"

TOKEN=$(echo $LOGIN_RES | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "Login failed. Token is empty."
    exit 1
fi

echo "Login successful. Token acquired."

# 2. Create Fabric with Variant
echo "Creating test fabric..."
PROD_RES=$(curl -s -X POST "$API_URL/catalog/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Inventory Test Fabric",
    "type": "curtain",
    "pricePerMeter": 5000,
    "stockQuantity": 100,
    "code": "TEST-INV-'$(date +%s)'"
  }')

echo "Raw Product Response: $PROD_RES"

PRODUCT_ID=$(echo $PROD_RES | jq -r '.data.id')

echo "Product ID: $PRODUCT_ID"

# 3. Create Variant
echo "Creating variant..."
VARIANT_RESPONSE=$(curl -s -X POST "$API_URL/catalog/products/$PRODUCT_ID/variants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variantCode": "INV-001",
    "stockQuantity": 50,
     "isDefault": true
  }')
VARIANT_ID=$(echo $VARIANT_RESPONSE | jq -r '.data.id')
echo "Variant ID: $VARIANT_ID"

# 4. Create Deal Process (Deal -> Measurement -> Update Measurement -> Contract Signed)
# Extract User ID from login (use as Designer)
DESIGNER_ID=$(echo $LOGIN_RES | jq -r '.data.user.id')
echo "Designer ID (Admin): $DESIGNER_ID"

# 4. Create proper Client
echo "Creating Client..."
CLIENT_RES=$(curl -s -X POST "$API_URL/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Inventory Test Client",
    "phone": "+77000000000",
    "address": "Test Inventory St",
    "source": "instagram"
  }')
CLIENT_ID=$(echo $CLIENT_RES | jq -r '.data.id')

# If creation fails (e.g. duplicate phone), try to fetch first client
if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" == "null" ]; then
    echo "Client creation failed, fetching first client..."
    CLIENT_ID=$(curl -s -X GET "$API_URL/clients?limit=1" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')
fi

echo "Client ID: $CLIENT_ID"

# 4.1 Measurement
MEAS_ID=$(curl -s -X POST "$API_URL/measurements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"designerId\": \"$DESIGNER_ID\",
    \"address\": \"Test Inventory St 1\",
    \"scheduledAt\": \"$(date -v+1d +%Y-%m-%dT10:00:00.000Z)\"
  }" | jq -r '.data.id')
echo "Measurement ID: $MEAS_ID"

# 4.2 Deal linked to Measurement
DEAL_ID=$(curl -s -X POST "$API_URL/deals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"designerId\": \"$DESIGNER_ID\",
    \"measurementId\": \"$MEAS_ID\",
    \"status\": \"scheduled\"
  }" | jq -r '.data.id')
echo "Deal ID: $DEAL_ID"

# 4.3 Update Measurement with Items (Including Variant!)
echo "Adding items with variant to measurement..."
curl -s -X PUT "$API_URL/measurements/$MEAS_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"windows\": [{
        \"id\": \"win1\",
        \"roomName\": \"Living Room\",
        \"fabricItems\": [{
            \"fabricId\": \"$PRODUCT_ID\",
            \"variantId\": \"$VARIANT_ID\", 
            \"quantity\": 10,
            \"price\": 5000
        }]
    }]
  }" > /dev/null

# 4.4 Move Deal to Contract Signed (Triggers Deduction)
echo "Signing contract (Triggering deduction)..."
SIGN_RES=$(curl -s -X PATCH "$API_URL/deals/$DEAL_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contract_signed"
  }')

echo "Raw Sign Response: $SIGN_RES"

SUCCESS=$(echo $SIGN_RES | jq -r '.success')

# 5. Verify Stock
echo "Verifying stock..."
UPDATED_VARIANT=$(curl -s -X GET "$API_URL/catalog/products/$PRODUCT_ID/variants" \
  -H "Authorization: Bearer $TOKEN" | jq -r ".data[] | select(.id == \"$VARIANT_ID\")")

NEW_STOCK=$(echo $UPDATED_VARIANT | jq -r '.stock_quantity')
echo "New Stock: $NEW_STOCK (Expected: 40, was 50 - 10)"

if [ "$NEW_STOCK" == "40" ]; then
    echo "✅ TEST PASSED: Stock correctly deducted."
else
    echo "❌ TEST FAILED: Stock mismatch."
fi
