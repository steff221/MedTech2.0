package com.medtech.domain.repository;

import com.medtech.domain.entity.User;
import com.medtech.domain.vo.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA репозиториум: пристап до записите за корисници.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(UserRole role);

    Page<User> findAllByRoleIn(List<UserRole> roles, Pageable pageable);

    @Query("""
           SELECT u FROM User u
           JOIN Doctor d ON d.user = u
           WHERE d.hospital.id = :hospitalId
             AND u.role IN :roles
           """)
    Page<User> findAllByRoleInAndHospitalId(@Param("roles") List<UserRole> roles,
                                            @Param("hospitalId") Long hospitalId,
                                            Pageable pageable);

    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :ts, u.failedLoginCount = 0 WHERE u.id = :id")
    int recordSuccessfulLogin(@Param("id") Long id, @Param("ts") Instant timestamp);

    @Modifying
    @Query("UPDATE User u SET u.failedLoginCount = u.failedLoginCount + 1 WHERE u.id = :id")
    int incrementFailedLogins(@Param("id") Long id);

    @Modifying
    @Query("UPDATE User u SET u.lockedUntil = :until WHERE u.id = :id")
    int lockUntil(@Param("id") Long id, @Param("until") Instant until);
}
