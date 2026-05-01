package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.acme.entity.Product;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.stream.Collectors;

@Path("/api/products")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Products", description = "List available credit products")
@SecurityRequirement(name = "bearerAuth")
public class ProductResource {

    public record ProductResponse(String productId, String type, String name) {}

    @GET
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER", "FRONT_OFFICE", "CRO", "BRANCH_DM",
                   "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY"})
    public List<ProductResponse> list() {
        return Product.<Product>listAll()
                .stream()
                .map(p -> new ProductResponse(p.productId, p.type, p.name))
                .collect(Collectors.toList());
    }
}
