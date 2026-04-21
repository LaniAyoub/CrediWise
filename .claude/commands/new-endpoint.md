Add a new REST endpoint to a CrediWise Quarkus service.

Usage: /new-endpoint [service] [HTTP method] [path] [description]

Steps:
1. Read the existing Resource class in backend/$SERVICE/src/main/java/org/acme/
2. Identify the pattern used (Panache, service layer, direct repository)
3. Follow the SAME pattern — do not introduce new architectural patterns
4. Add to existing Resource class (do not create new Resource classes unless justified)
5. Add: proper @Path, @GET/@POST/@PUT/@DELETE, @Produces, @Consumes annotations
6. Add: @RolesAllowed("FRONT_OFFICE") or @RolesAllowed("SUPER_ADMIN") — NEVER leave unauthenticated
7. Add: @Valid on request body parameters
8. Return: consistent JSON response structure
9. Update: SmallRye OpenAPI annotations (@Operation, @APIResponse)
10. Check: CORS is configured in gestionnaire only — other services don't need it for frontend calls
