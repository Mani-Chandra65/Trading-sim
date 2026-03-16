package com.crypto.sim.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.crypto.sim.api.entity.AuthTokenEntity;

public interface AuthTokenRepository extends JpaRepository<AuthTokenEntity, String> {
    Optional<AuthTokenEntity> findByToken(String token);

    Optional<AuthTokenEntity> findByUserKey(String userKey);

    void deleteByToken(String token);

    @Modifying
    @Transactional
    @Query("delete from AuthTokenEntity authToken where authToken.userKey = :userKey")
    int deleteByUserKey(@Param("userKey") String userKey);
}