#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# API base URL
API_URL="http://localhost:3001/api"

# Store tokens for different roles
declare -A TOKENS
declare -A USER_IDS
declare -A USER_NAMES

echo -e "${BLUE}${BOLD}================================================${NC}"
echo -e "${CYAN}${BOLD}   Gardina Analytics - Detailed Testing${NC}"
echo -e "${BLUE}${BOLD}================================================${NC}"
echo

# Function to test endpoint with various parameters
test_endpoint_detailed() {
  local METHOD=$1
  local ENDPOINT=$2
  local TOKEN=$3
  local NAME=$4
  local DATA=$5
  local EXPECTED_FIELDS=$6

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

    # Check if expected fields exist
    if [ ! -z "$EXPECTED_FIELDS" ]; then
      IFS=',' read -ra FIELDS <<< "$EXPECTED_FIELDS"
      for field in "${FIELDS[@]}"; do
        VALUE=$(echo $RESPONSE | jq -r ".data.$field" 2>/dev/null)
        if [ "$VALUE" != "null" ] && [ ! -z "$VALUE" ]; then
          echo -e "   ${GREEN}  ✓ $field: $VALUE${NC}"
        else
          echo -e "   ${RED}  ✗ Missing: $field${NC}"
        fi
      done
    fi

    # Show response structure
    echo -e "   ${CYAN}Response structure:${NC}"
    echo "$RESPONSE" | jq '.data | keys' 2>/dev/null | head -10
  else
    echo -e "   ${RED}❌ Failed${NC}"
    echo -e "   Error: $(echo $RESPONSE | jq -r '.error')"
  fi
  echo
}

# ==========================================
# STEP 1: LOGIN WITH DIFFERENT ROLES
# ==========================================
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo -e "${MAGENTA}${BOLD}STEP 1: Testing Authentication for Different Roles${NC}"
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo

# Test Admin login
echo -e "${CYAN}Logging in as Admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+77777777777",
    "password": "password123"
  }')

TOKENS["admin"]=$(echo $ADMIN_RESPONSE | jq -r '.data.accessToken')
USER_IDS["admin"]=$(echo $ADMIN_RESPONSE | jq -r '.data.user.id')
USER_NAMES["admin"]=$(echo $ADMIN_RESPONSE | jq -r '.data.user.name')

if [ "${TOKENS[admin]}" != "null" ]; then
  echo -e "${GREEN}✅ Admin logged in: ${USER_NAMES[admin]} (${USER_IDS[admin]})${NC}"
else
  echo -e "${RED}❌ Admin login failed${NC}"
fi

# Test Designer login
echo -e "${CYAN}Logging in as Designer...${NC}"
DESIGNER_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+77777777778",
    "password": "password123"
  }')

TOKENS["designer"]=$(echo $DESIGNER_RESPONSE | jq -r '.data.accessToken')
USER_IDS["designer"]=$(echo $DESIGNER_RESPONSE | jq -r '.data.user.id')
USER_NAMES["designer"]=$(echo $DESIGNER_RESPONSE | jq -r '.data.user.name')

if [ "${TOKENS[designer]}" != "null" ]; then
  echo -e "${GREEN}✅ Designer logged in: ${USER_NAMES[designer]} (${USER_IDS[designer]})${NC}"
else
  echo -e "${RED}❌ Designer login failed${NC}"
fi

# Test Manager login
echo -e "${CYAN}Logging in as Manager...${NC}"
MANAGER_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+77777777779",
    "password": "password123"
  }')

TOKENS["manager"]=$(echo $MANAGER_RESPONSE | jq -r '.data.accessToken')
USER_IDS["manager"]=$(echo $MANAGER_RESPONSE | jq -r '.data.user.id')
USER_NAMES["manager"]=$(echo $MANAGER_RESPONSE | jq -r '.data.user.name')

if [ "${TOKENS[manager]}" != "null" ]; then
  echo -e "${GREEN}✅ Manager logged in: ${USER_NAMES[manager]} (${USER_IDS[manager]})${NC}"
else
  echo -e "${RED}❌ Manager login failed${NC}"
fi

echo

# ==========================================
# STEP 2: DASHBOARD STATS FOR EACH ROLE
# ==========================================
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo -e "${MAGENTA}${BOLD}STEP 2: Testing Dashboard Stats for Each Role${NC}"
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo

# Admin Dashboard
test_endpoint_detailed "GET" \
  "/analytics/dashboard-stats?role=admin&userId=${USER_IDS[admin]}" \
  "${TOKENS[admin]}" \
  "Admin Dashboard Stats" \
  "" \
  "newClients,totalRevenue,totalDeals,activeEmployees"

# Manager Dashboard
test_endpoint_detailed "GET" \
  "/analytics/dashboard-stats?role=manager&userId=${USER_IDS[manager]}" \
  "${TOKENS[manager]}" \
  "Manager Dashboard Stats" \
  "" \
  "newClients,myDeals,myRevenue,teamPerformance"

# Designer Dashboard
test_endpoint_detailed "GET" \
  "/analytics/dashboard-stats?role=designer&userId=${USER_IDS[designer]}" \
  "${TOKENS[designer]}" \
  "Designer Dashboard Stats" \
  "" \
  "personalRevenue,completedMeasurements,pendingMeasurements,monthlyTarget"

# ==========================================
# STEP 3: TEST DIFFERENT TIME PERIODS
# ==========================================
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo -e "${MAGENTA}${BOLD}STEP 3: Testing Different Time Periods${NC}"
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo

PERIODS=("week" "month" "quarter" "year")

for period in "${PERIODS[@]}"; do
  echo -e "${CYAN}Testing period: $period${NC}"

  # Designer Performance with different periods
  test_endpoint_detailed "GET" \
    "/analytics/designer-performance?designerId=${USER_IDS[designer]}&period=$period" \
    "${TOKENS[designer]}" \
    "Designer Performance ($period)" \
    "" \
    "currentMonthMeasurements,averageCheck,conversionRate"

  # Monthly Trends with different periods
  MONTHS=3
  if [ "$period" = "year" ]; then
    MONTHS=12
  elif [ "$period" = "quarter" ]; then
    MONTHS=6
  fi

  test_endpoint_detailed "GET" \
    "/analytics/monthly-trends?type=revenue&period=$MONTHS" \
    "${TOKENS[admin]}" \
    "Monthly Trends - Revenue ($MONTHS months)" \
    "" \
    ""
done

# ==========================================
# STEP 4: TEST FILTERS AND PARAMETERS
# ==========================================
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo -e "${MAGENTA}${BOLD}STEP 4: Testing Filters and Parameters${NC}"
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo

# Test trend types
TREND_TYPES=("revenue" "deals" "clients")
for trend_type in "${TREND_TYPES[@]}"; do
  echo -e "${CYAN}Testing trend type: $trend_type${NC}"
  RESPONSE=$(curl -s -X GET ${API_URL}/analytics/monthly-trends?type=$trend_type\&period=3 \
    -H "Authorization: Bearer ${TOKENS[admin]}")

  SUCCESS=$(echo $RESPONSE | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $RESPONSE | jq '.data | length')
    echo -e "   ${GREEN}✅ Got $COUNT data points for $trend_type${NC}"
  else
    echo -e "   ${RED}❌ Failed to get $trend_type trends${NC}"
  fi
done

echo

# Test top products with different limits
LIMITS=(5 10 20)
for limit in "${LIMITS[@]}"; do
  echo -e "${CYAN}Testing top products with limit: $limit${NC}"
  RESPONSE=$(curl -s -X GET ${API_URL}/analytics/top-products?limit=$limit \
    -H "Authorization: Bearer ${TOKENS[admin]}")

  SUCCESS=$(echo $RESPONSE | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $RESPONSE | jq '.data | length')
    echo -e "   ${GREEN}✅ Got $COUNT products (limit: $limit)${NC}"
  else
    echo -e "   ${RED}❌ Failed to get top products${NC}"
  fi
done

echo

# ==========================================
# STEP 5: TEST ERROR HANDLING
# ==========================================
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo -e "${MAGENTA}${BOLD}STEP 5: Testing Error Handling${NC}"
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo

# Test without authentication
echo -e "${CYAN}Testing without authentication...${NC}"
RESPONSE=$(curl -s -X GET ${API_URL}/analytics/dashboard-stats)
ERROR=$(echo $RESPONSE | jq -r '.error' 2>/dev/null)
if [ ! -z "$ERROR" ] && [ "$ERROR" != "null" ]; then
  echo -e "   ${GREEN}✅ Correctly rejected: $ERROR${NC}"
else
  echo -e "   ${RED}❌ Should have been rejected${NC}"
fi

# Test with invalid token
echo -e "${CYAN}Testing with invalid token...${NC}"
RESPONSE=$(curl -s -X GET ${API_URL}/analytics/dashboard-stats \
  -H "Authorization: Bearer invalid_token_123")
ERROR=$(echo $RESPONSE | jq -r '.error' 2>/dev/null)
if [ ! -z "$ERROR" ] && [ "$ERROR" != "null" ]; then
  echo -e "   ${GREEN}✅ Correctly rejected: $ERROR${NC}"
else
  echo -e "   ${RED}❌ Should have been rejected${NC}"
fi

# Test with invalid parameters
echo -e "${CYAN}Testing with invalid period parameter...${NC}"
RESPONSE=$(curl -s -X GET ${API_URL}/analytics/designer-performance?period=invalid \
  -H "Authorization: Bearer ${TOKENS[admin]}")
SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo -e "   ${YELLOW}⚠️ Accepted invalid parameter (defaulted)${NC}"
else
  echo -e "   ${GREEN}✅ Correctly handled invalid parameter${NC}"
fi

# Test with non-existent designer ID
echo -e "${CYAN}Testing with non-existent designer ID...${NC}"
RESPONSE=$(curl -s -X GET ${API_URL}/analytics/designer-performance?designerId=00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer ${TOKENS[admin]}")
SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  DATA=$(echo $RESPONSE | jq -r '.data')
  echo -e "   ${GREEN}✅ Handled non-existent ID gracefully${NC}"
else
  echo -e "   ${RED}❌ Failed with non-existent ID${NC}"
fi

echo

# ==========================================
# STEP 6: PERFORMANCE TESTING
# ==========================================
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo -e "${MAGENTA}${BOLD}STEP 6: Performance Testing${NC}"
echo -e "${MAGENTA}${BOLD}================================================${NC}"
echo

# Test response times for key endpoints
ENDPOINTS=(
  "/analytics/dashboard-stats"
  "/analytics/designer-performance"
  "/analytics/monthly-trends"
  "/analytics/client-funnel"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo -e "${CYAN}Testing response time for: $endpoint${NC}"

  START_TIME=$(date +%s%N)
  curl -s -X GET ${API_URL}${endpoint} \
    -H "Authorization: Bearer ${TOKENS[admin]}" > /dev/null
  END_TIME=$(date +%s%N)

  ELAPSED=$((($END_TIME - $START_TIME) / 1000000))

  if [ $ELAPSED -lt 500 ]; then
    echo -e "   ${GREEN}✅ Fast response: ${ELAPSED}ms${NC}"
  elif [ $ELAPSED -lt 1000 ]; then
    echo -e "   ${YELLOW}⚠️ Moderate response: ${ELAPSED}ms${NC}"
  else
    echo -e "   ${RED}❌ Slow response: ${ELAPSED}ms${NC}"
  fi
done

echo

# ==========================================
# SUMMARY
# ==========================================
echo -e "${BLUE}${BOLD}================================================${NC}"
echo -e "${CYAN}${BOLD}   Testing Complete - Summary${NC}"
echo -e "${BLUE}${BOLD}================================================${NC}"
echo

echo -e "${GREEN}Tested Features:${NC}"
echo -e "  ✅ Authentication for 3 different roles"
echo -e "  ✅ Role-specific dashboard stats"
echo -e "  ✅ Different time periods (week, month, quarter, year)"
echo -e "  ✅ Various filters and parameters"
echo -e "  ✅ Error handling and edge cases"
echo -e "  ✅ Response time performance"
echo

echo -e "${CYAN}Test Users:${NC}"
echo -e "  Admin: ${USER_NAMES[admin]} (${USER_IDS[admin]})"
echo -e "  Designer: ${USER_NAMES[designer]} (${USER_IDS[designer]})"
echo -e "  Manager: ${USER_NAMES[manager]} (${USER_IDS[manager]})"
echo

echo -e "${BLUE}${BOLD}All detailed tests completed!${NC}"