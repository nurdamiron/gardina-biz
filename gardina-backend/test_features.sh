#!/bin/bash

# Configuration
API_URL="http://localhost:3001/api"
ADMIN_PHONE="+77777777777"
ADMIN_PASS="password" # Assuming default password or I need to login

echo "==================================================="
echo "   GARDINA BACKEND FEATURE VERIFICATION"
echo "==================================================="

# 1. Login to get Token
echo ""
echo "🔹 Using Hardcoded Admin Token..."
TOKEN="${TOKEN:?export TOKEN=<admin JWT>}"

if [ -z "$TOKEN" ]; then
  echo "❌ Token is empty"
  exit 1
fi
echo "✅ Token Set"

# Deal ID for linking
DEAL_ID="613f420e-389a-4c63-b7c5-5feae39d8c93"


# Get a User ID (myself)
USER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/auth/me" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "   User ID: $USER_ID"

# ---------------------------------------------------------
# 2. CATALOG TEST
# ---------------------------------------------------------
echo ""
echo "🔹 Testing Catalog (Get by Code)..."
# Using a known code from previous steps or just checking 404 handling nicely
# PROD-2ff46169 was found earlier
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/catalog/products/code/PROD-2ff46169")
if [[ $RESPONSE == *"success\":true"* ]]; then
  echo "✅ Get Product By Code: Success"
else
  echo "❌ Get Product By Code: Failed"
  echo "   Response: $RESPONSE"
fi

# ---------------------------------------------------------
# 3. PAYMENT SYSTEM TEST
# ---------------------------------------------------------
echo ""
echo "🔹 Testing Payment System..."

# Create Payment
echo "   Creating Payment..."
CREATE_PAYMENT_RES=$(curl -s -X POST "$API_URL/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"$DEAL_ID\",
    \"type\": \"prepayment\",
    \"amount\": 5000,
    \"paymentMethod\": \"cash\",
    \"note\": \"Test Payment from Script\"
  }")

PAYMENT_ID=$(echo $CREATE_PAYMENT_RES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$PAYMENT_ID" ] && [ "$PAYMENT_ID" != "null" ]; then
  echo "✅ Payment Created: ID $PAYMENT_ID"
else
  echo "❌ Payment Creation Failed"
  echo "   Response: $CREATE_PAYMENT_RES"
fi

# List Payments
echo "   Listing Payments..."
LIST_PAYMENT_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/payments?limit=5")
if [[ $LIST_PAYMENT_RES == *"success\":true"* ]]; then
   COUNT=$(echo $LIST_PAYMENT_RES | grep -o '"total":[^,]*' | cut -d':' -f2)
   echo "✅ List Payments: Success (Total: $COUNT)"
else
   echo "❌ List Payments: Failed"
fi

# Delete Payment
if [ ! -z "$PAYMENT_ID" ]; then
  echo "   Deleting Payment..."
  DEL_PAYMENT_RES=$(curl -s -X DELETE "$API_URL/payments/$PAYMENT_ID" -H "Authorization: Bearer $TOKEN")
  if [[ $DEL_PAYMENT_RES == *"success\":true"* ]]; then
    echo "✅ Payment Deleted"
  else
    echo "❌ Payment Delete Failed"
  fi
fi

# ---------------------------------------------------------
# 4. NOTIFICATION SYSTEM TEST
# ---------------------------------------------------------
echo ""
echo "🔹 Testing Notification System..."

# Create Notification
echo "   Creating Notification..."
CREATE_NOTIF_RES=$(curl -s -X POST "$API_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"type\": \"info\",
    \"title\": \"Test Notification\",
    \"message\": \"This is a test notification\"
  }")

NOTIF_ID=$(echo $CREATE_NOTIF_RES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$NOTIF_ID" ] && [ "$NOTIF_ID" != "null" ]; then
  echo "✅ Notification Created: ID $NOTIF_ID"
else
  echo "❌ Notification Creation Failed"
  echo "   Response: $CREATE_NOTIF_RES"
fi

# List Notifications
LIST_NOTIF_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/notifications")
if [[ $LIST_NOTIF_RES == *"success\":true"* ]]; then
  echo "✅ List Notifications: Success"
else
  echo "❌ List Notifications: Failed"
fi

# Mark as Read
if [ ! -z "$NOTIF_ID" ]; then
  echo "   Marking as Read..."
  READ_RES=$(curl -s -X PATCH "$API_URL/notifications/$NOTIF_ID/read" -H "Authorization: Bearer $TOKEN")
  if [[ $READ_RES == *"success\":true"* ]]; then
    echo "✅ Mark as Read: Success"
  else
    echo "❌ Mark as Read: Failed"
  fi
fi

# ---------------------------------------------------------
# 5. INSTALLATION SYSTEM TEST
# ---------------------------------------------------------
echo ""
echo "🔹 Testing Installation System..."

# Create Installation
# We need a dummy address
echo "   Creating Installation..."
CREATE_INSTALL_RES=$(curl -s -X POST "$API_URL/installations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"$DEAL_ID\",
    \"address\": \"123 Test Street\",
    \"scheduledAt\": \"2026-02-01T10:00:00Z\",
    \"status\": \"scheduled\",
    \"notes\": \"Test Installation\"
  }")
  
INSTALL_ID=$(echo $CREATE_INSTALL_RES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$INSTALL_ID" ] && [ "$INSTALL_ID" != "null" ]; then
  echo "✅ Installation Created: ID $INSTALL_ID"
else
  echo "❌ Installation Creation Failed"
  echo "   Response: $CREATE_INSTALL_RES"
fi

# List Installations
LIST_INSTALL_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/installations")
if [[ $LIST_INSTALL_RES == *"success\":true"* ]]; then
  echo "✅ List Installations: Success"
else
  echo "❌ List Installations: Failed"
fi

# Update Installation
if [ ! -z "$INSTALL_ID" ]; then
  echo "   Updating Installation (Address)..."
  UPDATE_INSTALL_RES=$(curl -s -X PUT "$API_URL/installations/$INSTALL_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"address\": \"456 Updated St\"}")
    
  if [[ $UPDATE_INSTALL_RES == *"Updated St"* ]]; then
    echo "✅ Update Installation: Success"
  else
    echo "❌ Update Installation: Failed"
    echo "   Response: $UPDATE_INSTALL_RES"
  fi
  
  # Delete Installation
  echo "   Deleting Installation..."
  DEL_INSTALL_RES=$(curl -s -X DELETE "$API_URL/installations/$INSTALL_ID" -H "Authorization: Bearer $TOKEN")
  if [[ $DEL_INSTALL_RES == *"success\":true"* ]]; then
    echo "✅ Installation Deleted"
  else
    echo "❌ Installation Delete Failed"
  fi
fi

echo ""
echo "==================================================="
echo "   VERIFICATION COMPLETE"
echo "==================================================="
