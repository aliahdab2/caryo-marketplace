package com.autotrader.autotraderbackend.testutil;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Utility class to create test data for integration tests.
 * This class provides methods to create common entities needed for testing authentication.
 */
@Component
public class TestDataFactory {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Creates a regular user with the USER role
     * 
     * @return the created user
     */
    @Transactional
    public User createRegularUser() {
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String username = "test_user_" + uniqueId;
        String email = username + "@example.com";
        String password = "Password123!";
        
        return createUser(username, email, password, Collections.singleton("ROLE_USER"));
    }
    
    /**
     * Creates an admin user with the ADMIN role
     * 
     * @return the created admin user
     */
    @Transactional
    public User createAdminUser() {
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String username = "test_admin_" + uniqueId;
        String email = username + "@example.com";
        String password = "AdminPass123!";
        
        return createUser(username, email, password, Collections.singleton("ROLE_ADMIN"));
    }
    
    /**
     * Creates a user with specified roles
     */
    @Transactional
    public User createUser(String username, String email, String password, Set<String> roleNames) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        
        Set<Role> roles = new HashSet<>();
        roleNames.forEach(roleName -> {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            roles.add(role);
        });
        
        user.setRoles(roles);
        return userRepository.save(user);
    }
}
