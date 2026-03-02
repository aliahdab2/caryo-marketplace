package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing user roles.
 * Centralizes role lookup-or-create logic previously duplicated in AuthController.
 */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    /**
     * Get an existing role by name, or create it if it doesn't exist.
     *
     * @param roleName the role name (e.g. "ROLE_USER", "ROLE_ADMIN")
     * @return the existing or newly created Role
     */
    @Transactional
    public Role getOrCreateRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
    }
}
