Add a new gRPC method or service to CrediWise.

Usage: /new-grpc [service: gestionnaire|client] [method description]

Steps:
1. Read existing .proto file: backend/$SERVICE/src/main/proto/
2. Add new rpc method following existing naming conventions
3. Define request/response message types
4. Run: cd backend/$SERVICE && mvn generate-sources (to generate Java stubs)
5. Implement the gRPC service in src/main/java/org/acme/grpc/
6. If modifying gestionnaire.proto:
   - ALSO update backend/client/src/main/proto/gestionnaire.proto (it is a duplicate)
   - This is a known gap — shared/ proto dir is empty, duplication is manual
7. Update the gRPC client in the consuming service
8. Test: verify gRPC port is accessible at expected port (9000/9001/9002/9003)
