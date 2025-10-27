package com.autotrader.autotraderbackend.security.services;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        log.debug("Attempting to load user by username or email: {}", usernameOrEmail);
        
        // Try to find by username first
        User user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> {
                    // If not found by username, try email
                    log.debug("User not found by username, trying email: {}", usernameOrEmail);
                    return userRepository.findByEmail(usernameOrEmail)
                            .orElseThrow(() -> {
                                log.warn("User not found with username or email: {}", usernameOrEmail);
                                return new UsernameNotFoundException("User Not Found with username or email: " + usernameOrEmail);
                            });
                });

        log.info("User found: {} with roles: {}", user.getUsername(), user.getRoles());
        return UserDetailsImpl.build(user);
    }
}
