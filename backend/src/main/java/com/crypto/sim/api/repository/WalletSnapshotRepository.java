package com.crypto.sim.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crypto.sim.api.entity.WalletSnapshotEntity;

import java.util.Optional;

public interface WalletSnapshotRepository extends JpaRepository<WalletSnapshotEntity, Long> {
    Optional<WalletSnapshotEntity> findByUserKey(String userKey);
}
