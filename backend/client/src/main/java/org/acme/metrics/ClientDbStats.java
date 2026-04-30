package org.acme.metrics;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.acme.entity.enums.ClientStatus;
import org.acme.repository.ClientRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Transactional DB queries for Gauge suppliers in ClientMetrics.
 * Must be a separate CDI bean so @Transactional interceptors apply on every call.
 */
@ApplicationScoped
public class ClientDbStats {

    @Inject
    ClientRepository clientRepository;

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public double totalCount() {
        return clientRepository.count();
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public double prospectCount() {
        return clientRepository.count("status", ClientStatus.PROSPECT);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public double activeCount() {
        return clientRepository.count("status", ClientStatus.ACTIVE);
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Map<String, Long> countByAgence() {
        List<Object[]> rows = clientRepository.getEntityManager()
                .createQuery("SELECT c.agenceId, COUNT(c) FROM Client c WHERE c.agenceId IS NOT NULL GROUP BY c.agenceId", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            result.put(row[0].toString(), (Long) row[1]);
        }
        return result;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Map<String, Long> countByManagerId() {
        List<Object[]> rows = clientRepository.getEntityManager()
                .createQuery("SELECT c.assignedManagerId, COUNT(c) FROM Client c WHERE c.assignedManagerId IS NOT NULL GROUP BY c.assignedManagerId", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            result.put(row[0].toString(), (Long) row[1]);
        }
        return result;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Map<String, Long> countByType() {
        List<Object[]> rows = clientRepository.getEntityManager()
                .createQuery("SELECT c.clientType, COUNT(c) FROM Client c GROUP BY c.clientType", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            result.put(row[0].toString(), (Long) row[1]);
        }
        return result;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Map<String, Long> countBySegment() {
        List<Object[]> rows = clientRepository.getEntityManager()
                .createQuery("SELECT c.segment.libelle, COUNT(c) FROM Client c WHERE c.segment IS NOT NULL GROUP BY c.segment.libelle", Object[].class)
                .getResultList();
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            result.put(row[0].toString(), (Long) row[1]);
        }
        return result;
    }
}
