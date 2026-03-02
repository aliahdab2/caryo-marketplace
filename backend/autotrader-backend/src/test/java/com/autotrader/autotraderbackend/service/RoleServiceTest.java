package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleService roleService;

    @Test
    void getOrCreateRole_WhenRoleExists_ShouldReturnExistingRole() {
        Role existingRole = new Role("ROLE_USER");
        existingRole.setId(1);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(existingRole));

        Role result = roleService.getOrCreateRole("ROLE_USER");

        assertNotNull(result);
        assertEquals("ROLE_USER", result.getName());
        assertEquals(1, result.getId());
        verify(roleRepository).findByName("ROLE_USER");
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void getOrCreateRole_WhenRoleDoesNotExist_ShouldCreateAndReturnNewRole() {
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.empty());
        Role savedRole = new Role("ROLE_ADMIN");
        savedRole.setId(2);
        when(roleRepository.save(any(Role.class))).thenReturn(savedRole);

        Role result = roleService.getOrCreateRole("ROLE_ADMIN");

        assertNotNull(result);
        assertEquals("ROLE_ADMIN", result.getName());
        assertEquals(2, result.getId());
        verify(roleRepository).findByName("ROLE_ADMIN");
        verify(roleRepository).save(any(Role.class));
    }
}
