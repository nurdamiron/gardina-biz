#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# API base URL
API_URL="http://localhost:3001/api"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Testing Gardina Analytics API${NC}"
echo -e "${BLUE}================================================${NC}"
echo

# Step 1: Login and get token
echo -e "${YELLOW}Step 1: Getting authentication token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77777777777", "password": "password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get token. Trying with different credentials...${NC}"

  # Try admin credentials
  LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone": "+77012345678", "password": "admin123"}')

  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

  if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}Login response: $LOGIN_RESPONSE${NC}"
    echo -e "${RED}❌ Failed to authenticate. Please check credentials.${NC}"
    exit 1
  fi
fi

USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')
USER_ROLE=$(echo $LOGIN_RESPONSE | jq -r '.data.user.role')

echo -e "${GREEN}✅ Authenticated successfully!${NC}"
echo -e "   User ID: $USER_ID"
echo -e "   Role: $USER_ROLE"
echo

# Function to test endpoint
test_endpoint() {
  local METHOD=$1
  local ENDPOINT=$2
  local NAME=$3
  local DATA=$4

  echo -e "${YELLOW}Testing: $NAME${NC}"
  echo -e "   ${BLUE}$METHOD $ENDPOINT${NC}"

  if [ "$METHOD" = "GET" ]; then
    RESPONSE=$(curl -s -X GET ${API_URL}${ENDPOINT} \
      -H "Authorization: Bearer $TOKEN")
  else
    RESPONSE=$(curl -s -X $METHOD ${API_URL}${ENDPOINT} \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$DATA")
  fi

  SUCCESS=$(echo $RESPONSE | jq -r '.success')

  if [ "$SUCCESS" = "true" ]; then
    echo -e "   ${GREEN}✅ Success${NC}"
    echo -e "   Response preview:"
    echo "$RESPONSE" | jq '.' | head -20
  else
    echo -e "   ${RED}❌ Failed${NC}"
    echo -e "   Error: $(echo $RESPONSE | jq -r '.error')"
  fi
  echo
}

# Test Analytics Endpoints
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Testing Analytics Endpoints${NC}"
echo -e "${BLUE}================================================${NC}"
echo

# Dashboard Stats
test_endpoint "GET" "/analytics/dashboard-stats?role=${USER_ROLE}&userId=${USER_ID}" "Dashboard Stats"

# Designer Performance
test_endpoint "GET" "/analytics/designer-performance?designerId=${USER_ID}" "Designer Performance"

# Designers Ranking
test_endpoint "GET" "/analytics/designers-ranking" "Designers Ranking"

# Designer Earnings
test_endpoint "GET" "/analytics/designer-earnings?designerId=${USER_ID}" "Designer Earnings"

# Product Sales
test_endpoint "GET" "/analytics/product-sales" "Product Sales"

# Top Products
test_endpoint "GET" "/analytics/top-products?limit=5" "Top Products"

# Sales by Category
test_endpoint "GET" "/analytics/sales-by-category" "Sales by Category"

# Weekly Activity
test_endpoint "GET" "/analytics/weekly-activity?userId=${USER_ID}&role=${USER_ROLE}" "Weekly Activity"

# Monthly Trends
test_endpoint "GET" "/analytics/monthly-trends?type=revenue&period=6" "Monthly Trends"

# Client Funnel
test_endpoint "GET" "/analytics/client-funnel" "Client Funnel"

# Client Retention
test_endpoint "GET" "/analytics/client-retention" "Client Retention"

# Clients by Source
test_endpoint "GET" "/analytics/clients-by-source" "Clients by Source"

# Team KPIs
test_endpoint "GET" "/analytics/team-kpis" "Team KPIs"

# Team Efficiency
test_endpoint "GET" "/analytics/team-efficiency" "Team Efficiency"

# Revenue Breakdown
test_endpoint "GET" "/analytics/revenue-breakdown" "Revenue Breakdown"

# Payment Risks
test_endpoint "GET" "/analytics/payment-risks" "Payment Risks"

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}   Testing Complete!${NC}"
echo -e "${BLUE}================================================${NC}"