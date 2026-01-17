#!/bin/bash
# Script para limpar usuários exceto ADMIN
DB_NAME="fixelo_prod"

echo "=== Verificando usuários antes da limpeza ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'SELECT role, count(*) FROM "User" GROUP BY role;'

echo ""
echo "=== Deletando SupportTickets ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "SupportTicket" WHERE "userId" IN (SELECT id FROM "User" WHERE role != '"'"'ADMIN'"'"');'

echo ""
echo "=== Deletando Reviews ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "Review";'

echo ""
echo "=== Deletando Payments ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "Payment";'

echo ""
echo "=== Deletando JobAssignments ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "JobAssignment";'

echo ""
echo "=== Deletando JobExecutions ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "JobExecution";'

echo ""
echo "=== Deletando BookingAddOns ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "BookingAddOn";'

echo ""
echo "=== Deletando Bookings ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "Booking";'

echo ""
echo "=== Deletando CleanerProfile ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "CleanerProfile";'

echo ""
echo "=== Deletando Address de usuários não-admin ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "Address" WHERE "userId" IN (SELECT id FROM "User" WHERE role != '"'"'ADMIN'"'"');'

echo ""
echo "=== Deletando NotificationPreferences ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "NotificationPreference" WHERE "userId" IN (SELECT id FROM "User" WHERE role != '"'"'ADMIN'"'"');'

echo ""
echo "=== Deletando PushSubscriptions ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "PushSubscription" WHERE "userId" IN (SELECT id FROM "User" WHERE role != '"'"'ADMIN'"'"');'

echo ""
echo "=== Deletando Sessions ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "User" WHERE role != '"'"'ADMIN'"'"');'

echo ""
echo "=== Deletando Accounts ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "Account" WHERE "userId" IN (SELECT id FROM "User" WHERE role != '"'"'ADMIN'"'"');'

echo ""
echo "=== Deletando usuários (CUSTOMER e CLEANER) ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'DELETE FROM "User" WHERE role != '"'"'ADMIN'"'"';'

echo ""
echo "=== Verificando usuários após limpeza ==="
docker exec fixelo-db psql -U fixelo -d $DB_NAME -c 'SELECT role, count(*) FROM "User" GROUP BY role;'

echo ""
echo "=== Limpeza concluída! ==="
