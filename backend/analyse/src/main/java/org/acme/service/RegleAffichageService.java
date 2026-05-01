package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import org.acme.dto.RegleAffichageRequest;
import org.acme.dto.RegleAffichageResponse;
import org.acme.entity.RegleAffichage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class RegleAffichageService {

    @Transactional
    public RegleAffichageResponse create(RegleAffichageRequest req) {
        RegleAffichage entity = new RegleAffichage();
        mapRequest(entity, req);
        entity.version  = 1;
        entity.isActive = true;
        entity.persist();
        return toResponse(entity);
    }

    /**
     * Edit a rule: soft-deletes the current version and creates a new one.
     * Dossiers that stored the old rule ID can detect staleness by checking isActive = false.
     */
    @Transactional
    public RegleAffichageResponse update(Long id, RegleAffichageRequest req) {
        RegleAffichage old = RegleAffichage.findById(id);
        if (old == null) throw new NotFoundException("Règle introuvable: " + id);
        if (!Boolean.TRUE.equals(old.isActive)) {
            throw new IllegalStateException("Cette règle a déjà été remplacée par une version plus récente.");
        }

        // Soft-delete the old version
        old.isActive  = false;
        old.updatedAt = LocalDateTime.now();

        // Create new version (increments version counter)
        RegleAffichage next = new RegleAffichage();
        mapRequest(next, req);
        next.version  = old.version + 1;
        next.isActive = true;
        next.persist();

        return toResponse(next);
    }

    /** Returns only currently active rules — used everywhere except staleness checks. */
    public List<RegleAffichageResponse> listAll() {
        return RegleAffichage.<RegleAffichage>list("isActive", true)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Returns all rules including retired ones — used for staleness badge on dossiers. */
    public RegleAffichageResponse getById(Long id) {
        RegleAffichage entity = RegleAffichage.findById(id);
        if (entity == null) throw new NotFoundException("Règle introuvable: " + id);
        return toResponse(entity);
    }

    @Transactional
    public void delete(Long id) {
        RegleAffichage entity = RegleAffichage.findById(id);
        if (entity == null) throw new NotFoundException("Règle introuvable: " + id);
        entity.delete();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void mapRequest(RegleAffichage e, RegleAffichageRequest req) {
        e.conditionLabel = req.conditionLabel;
        e.pays           = req.pays;
        e.productId      = req.productId;
        e.productName    = req.productName;
        e.opInf          = req.opInf;
        e.borneInf       = req.borneInf;
        e.opSup          = req.opSup;
        e.borneSup       = req.borneSup;
        e.navigation     = req.navigation;
    }

    private RegleAffichageResponse toResponse(RegleAffichage e) {
        return RegleAffichageResponse.builder()
                .id(e.id)
                .conditionLabel(e.conditionLabel)
                .pays(e.pays)
                .productId(e.productId)
                .productName(e.productName)
                .opInf(e.opInf)
                .borneInf(e.borneInf)
                .opSup(e.opSup)
                .borneSup(e.borneSup)
                .navigation(e.navigation)
                .version(e.version)
                .isActive(e.isActive)
                .createdAt(e.createdAt)
                .updatedAt(e.updatedAt)
                .build();
    }
}
