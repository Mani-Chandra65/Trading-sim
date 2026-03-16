package com.crypto.sim.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crypto.sim.api.entity.UserAccountEntity;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccountEntity, Long> {
    Optional<UserAccountEntity> findByUserKey(String userKey);

    Optional<UserAccountEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
