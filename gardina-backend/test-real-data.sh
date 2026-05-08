#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77777777777", "password": "password123"}' | jq -r '.data.accessToken')

echo -e "${BLUE}Testing Analytics Endpoints with Real Data${NC}"
echo -e "${BLUE}==========================================${NC}\n"

# Test 1: Clients by Source (now uses real source column)
echo -e "${YELLOW}1. Testing getClientsBySource (real source data):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/clients-by-source?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

# Test 2: Team Efficiency (now calculates real metrics)
echo -e "${YELLOW}2. Testing getTeamEfficiency (real metrics):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/team-efficiency?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

# Test 3: Team KPIs (now uses real targets from users table)
echo -e "${YELLOW}3. Testing getTeamKPIs (real targets and efficiency):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/team-kpis?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

# Test 4: Top Products (now uses deal_products table)
echo -e "${YELLOW}4. Testing getTopProducts (real deal_products data):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/top-products?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

# Test 5: Product Sales (now uses deal_products table)
echo -e "${YELLOW}5. Testing getProductSales (real product sales):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/product-sales?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

# Test 6: Sales by Category (now uses deal_products table)
echo -e "${YELLOW}6. Testing getSalesByCategory (real category sales):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/sales-by-category?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

# Test 7: Client Retention (now calculates real trends)
echo -e "${YELLOW}7. Testing getClientRetention (real retention trends):${NC}"
curl -s -X GET "http://localhost:3001/api/analytics/client-retention?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
echo

echo -e "${GREEN}All endpoints tested with real data!${NC}"