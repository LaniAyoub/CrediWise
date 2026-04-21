Check the CrediWise dev environment status.

1. docker-compose ps (are all 4 DBs running?)
2. Check each service health:
   curl -s http://localhost:8080/q/health | python3 -m json.tool
   curl -s http://localhost:8082/q/health | python3 -m json.tool
   curl -s http://localhost:8083/q/health | python3 -m json.tool
   curl -s http://localhost:8084/q/health | python3 -m json.tool
3. Check frontend: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
4. Report: what is running, what is not, what ports are in use
5. If a service is down: show last 20 lines of its logs
   docker-compose logs --tail=20 [service]
6. Check for port conflicts: lsof -i :8080 -i :8082 -i :8083 -i :8084 -i :3000
