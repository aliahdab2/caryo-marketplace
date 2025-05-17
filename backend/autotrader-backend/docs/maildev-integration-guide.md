## MailDev Integration Guide for Development

This guide explains how to use the MailDev service that's configured in your `docker-compose.dev.yml` file for email testing during development.

### 1. Add Email Dependencies

Add the following dependencies to your `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

### 2. Configure Email Settings in application-dev.yml

Add or modify the following properties in your `application-dev.yml`:

```yaml
spring:
  mail:
    host: maildev
    port: 1025
    username: admin  # From your docker-compose settings
    password: password  # From your docker-compose settings
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: false  # MailDev doesn't require TLS
        debug: true  # Enable for debugging

# Custom application properties for email
application:
  email:
    from-address: noreply@caryo-marketplace.com
    admin-address: admin@caryo-marketplace.com
    enable-email: true
```

### 3. Create an Email Service

Create an email service class in your project:

```java
package com.autotrader.autotraderbackend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;
    
    @Autowired
    private TemplateEngine templateEngine;
    
    @Value("${application.email.from-address}")
    private String fromAddress;
    
    @Value("${application.email.enable-email:false}")
    private boolean enableEmail;

    /**
     * Send a simple email with plain text content
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        if (!enableEmail) {
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        emailSender.send(message);
    }
    
    /**
     * Send an HTML email using Thymeleaf templates
     */
    public void sendHtmlEmail(String to, String subject, String templateName, 
                             Context context) throws MessagingException {
        if (!enableEmail) {
            return;
        }
        
        MimeMessage message = emailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromAddress);
        helper.setTo(to);
        helper.setSubject(subject);
        
        String htmlContent = templateEngine.process(templateName, context);
        helper.setText(htmlContent, true);
        
        // Add a logo to the email
        helper.addInline("logo", new ClassPathResource("static/images/logo.png"));
        
        emailSender.send(message);
    }
}
```

### 4. Create Email Templates

Create Thymeleaf templates for your emails in `src/main/resources/templates/email/`:

#### Welcome Email Template (`welcome.html`):

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to Caryo Marketplace!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a6dff;
            padding: 15px;
            text-align: center;
            color: white;
        }
        .content {
            padding: 20px;
            background-color: #f8f9fa;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:logo" alt="Caryo Marketplace Logo" height="60" />
            <h1>Welcome to Caryo Marketplace!</h1>
        </div>
        
        <div class="content">
            <p>Hello <strong th:text="${name}">User</strong>,</p>
            
            <p>Thank you for registering with Caryo Marketplace. We're excited to have you join our community!</p>
            
            <p>Your account has been successfully created and you can now:</p>
            <ul>
                <li>Browse available car listings</li>
                <li>Create your own listings to sell vehicles</li>
                <li>Contact sellers about their listings</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br/>
            The Caryo Marketplace Team</p>
        </div>
        
        <div class="footer">
            <p>© 2025 Caryo Marketplace. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
```

### 5. Use the Email Service in Your Application

Here's an example of using the email service in a user registration workflow:

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private EmailService emailService;
    
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // Register the user
        User newUser = userService.registerUser(signUpRequest);
        
        // Send welcome email
        try {
            Context context = new Context();
            context.setVariable("name", newUser.getUsername());
            
            emailService.sendHtmlEmail(
                newUser.getEmail(),
                "Welcome to Caryo Marketplace!",
                "email/welcome",
                context
            );
        } catch (Exception e) {
            // Log error but don't fail registration
            log.error("Failed to send welcome email", e);
        }
        
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
```

### 6. Testing with MailDev

Once your application is running with Docker Compose:

1. Access the MailDev web interface at http://localhost:1080
2. Trigger an action that sends an email (like user registration)
3. Check the MailDev inbox to see the captured email
4. Verify that the email content appears correctly
5. Test all email templates and scenarios

MailDev captures all outgoing emails from your application without actually sending them to real email addresses, making it perfect for development and testing.

### 7. Switching to Real Email for Production

In your production configuration (`application-prod.yml`), you'll configure real SMTP settings:

```yaml
spring:
  mail:
    host: smtp.gmail.com  # Or your actual SMTP provider
    port: 587
    username: ${SMTP_USERNAME}  # Store as environment variable
    password: ${SMTP_PASSWORD}  # Store as environment variable
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

application:
  email:
    from-address: noreply@your-actual-domain.com
    admin-address: admin@your-actual-domain.com
    enable-email: true
```
