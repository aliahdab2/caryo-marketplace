package com.autotrader.autotraderbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Email configuration for non-test profiles.
 * Provides JavaMailSender bean based on application properties.
 */
@Configuration
@Profile("!ci") // Active for all profiles except ci
public class EmailConfig {

    @Value("${spring.mail.host:localhost}")
    private String host;
    
    @Value("${spring.mail.port:587}")
    private int port;
    
    @Value("${spring.mail.username:}")
    private String username;
    
    @Value("${spring.mail.password:}")
    private String password;
    
    @Value("${spring.mail.protocol:smtp}")
    private String protocol;
    
    @Value("${spring.mail.default-encoding:UTF-8}")
    private String defaultEncoding;
    
    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;
    
    @Value("${spring.mail.properties.mail.smtp.starttls.enable:false}")
    private boolean starttlsEnable;
    
    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}")
    private int connectionTimeout;
    
    @Value("${spring.mail.properties.mail.smtp.timeout:5000}")
    private int timeout;
    
    @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}")
    private int writeTimeout;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        // Set basic properties
        mailSender.setHost(host);
        mailSender.setPort(port);
        
        // Only set username/password if they are provided
        if (username != null && !username.trim().isEmpty()) {
            mailSender.setUsername(username);
        }
        if (password != null && !password.trim().isEmpty()) {
            mailSender.setPassword(password);
        }
        
        mailSender.setProtocol(protocol);
        mailSender.setDefaultEncoding(defaultEncoding);
        
        // Set SMTP properties
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", smtpAuth);
        props.put("mail.smtp.starttls.enable", starttlsEnable);
        props.put("mail.smtp.connectiontimeout", connectionTimeout);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.smtp.writetimeout", writeTimeout);
        
        return mailSender;
    }
}