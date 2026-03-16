package com.caryo.marketplace.controller;

import com.caryo.marketplace.payload.request.NewsletterSubscriptionRequest;
import com.caryo.marketplace.payload.NewsletterSubscriptionResponse;
import com.caryo.marketplace.service.NewsletterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for newsletter subscription management.
 */
@RestController
@RequestMapping("/api/v1/public/newsletter")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Newsletter", description = "Newsletter subscription management")
public class NewsletterController {

    private final NewsletterService newsletterService;

    /**
     * Subscribe to newsletter.
     */
    @PostMapping("/subscribe")
    @Operation(summary = "Subscribe to newsletter", description = "Subscribe to newsletter with email confirmation")
    public ResponseEntity<NewsletterSubscriptionResponse> subscribe(
            @Valid @RequestBody NewsletterSubscriptionRequest request) {

        log.info("Newsletter subscription request for email: {}", request.getEmail());

        NewsletterSubscriptionResponse response = newsletterService.subscribe(request);

        return ResponseEntity.ok(response);
    }

    /**
     * Confirm newsletter subscription.
     */
    @GetMapping("/confirm")
    @Operation(summary = "Confirm newsletter subscription", description = "Confirm newsletter subscription using token")
    public ResponseEntity<String> confirmSubscription(@RequestParam String token) {

        log.info("Newsletter confirmation request with token: {}", token);

        boolean confirmed = newsletterService.confirmSubscription(token);

        if (confirmed) {
            return ResponseEntity.ok("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Subscription Confirmed - Caryo</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .success { color: #22c55e; }
                        .container { max-width: 600px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="success">✅ Subscription Confirmed!</h1>
                        <p>Thank you for subscribing to Caryo newsletter. You'll receive the latest car deals and news.</p>
                        <a href="https://caryo-marketplace.com" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Caryo</a>
                    </div>
                </body>
                </html>
                """);
        } else {
            return ResponseEntity.badRequest().body("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Token - Caryo</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #ef4444; }
                        .container { max-width: 600px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="error">❌ Invalid or Expired Token</h1>
                        <p>The confirmation link is invalid or has expired.</p>
                        <a href="https://caryo-marketplace.com" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Caryo</a>
                    </div>
                </body>
                </html>
                """);
        }
    }

    /**
     * Unsubscribe from newsletter.
     */
    @GetMapping("/unsubscribe")
    @Operation(summary = "Unsubscribe from newsletter", description = "Unsubscribe from newsletter using token")
    public ResponseEntity<String> unsubscribe(@RequestParam String token) {

        log.info("Newsletter unsubscribe request with token: {}", token);

        boolean unsubscribed = newsletterService.unsubscribe(token);

        if (unsubscribed) {
            return ResponseEntity.ok("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Unsubscribed - Caryo</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .info { color: #6b7280; }
                        .container { max-width: 600px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="info">📧 Successfully Unsubscribed</h1>
                        <p>You have been unsubscribed from Caryo newsletter. We're sorry to see you go!</p>
                        <p>You can always subscribe again from our website.</p>
                        <a href="https://caryo-marketplace.com" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Caryo</a>
                    </div>
                </body>
                </html>
                """);
        } else {
            return ResponseEntity.badRequest().body("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Token - Caryo</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #ef4444; }
                        .container { max-width: 600px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="error">❌ Invalid or Expired Token</h1>
                        <p>The unsubscribe link is invalid or has expired.</p>
                        <a href="https://caryo-marketplace.com" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Caryo</a>
                    </div>
                </body>
                </html>
                """);
        }
    }


}
