package com.autotrader.autotraderbackend.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;

/**
 * Service for managing internationalized messages.
 * Centralizes all email subject lines and messages.
 */
@Service
public class MessageService {
    
    private static final Map<String, Map<String, String>> MESSAGES = new HashMap<>();
    
    static {
        // English messages
        Map<String, String> enMessages = new HashMap<>();
        enMessages.put("listing.approved.subject", "Your listing has been approved!");
        enMessages.put("listing.expired.subject", "Your listing has expired");
        enMessages.put("listing.renewal.subject", "Your listing has been renewed");
        enMessages.put("welcome.subject", "Welcome to {websiteName}!");
        enMessages.put("contact.form.subject", "New contact form submission from {name}");
        enMessages.put("contact.confirmation.subject", "Thank you for contacting us");
        enMessages.put("success.contact.form", "Thank you for your message. We'll get back to you soon!");
        enMessages.put("error.invalid.data", "Invalid data: {error}");
        enMessages.put("error.server", "Sorry, there was an error processing your message. Please try again later.");
        enMessages.put("password.reset.subject", "Password Reset Request - {websiteName}");
        enMessages.put("password.reset.confirmation.subject", "Password Successfully Changed - {websiteName}");
        enMessages.put("password.reset.success", "If the email exists, a password reset link has been sent.");
        enMessages.put("password.reset.completed", "Password has been reset successfully!");
        enMessages.put("password.reset.invalid.token", "Invalid or expired reset token.");
        enMessages.put("password.reset.token.expired", "Reset token has expired. Please request a new one.");
        enMessages.put("password.reset.rate.limited", "Too many password reset attempts. Please try again later.");
        
        // Arabic messages
        Map<String, String> arMessages = new HashMap<>();
        arMessages.put("listing.approved.subject", "تمت الموافقة على إعلانك!");
        arMessages.put("listing.expired.subject", "انتهت صلاحية إعلانك");
        arMessages.put("listing.renewal.subject", "تم تجديد إعلانك");
        arMessages.put("welcome.subject", "مرحباً بك في {websiteName}!");
        arMessages.put("contact.form.subject", "رسالة جديدة من {name}");
        arMessages.put("contact.confirmation.subject", "شكراً لك على التواصل معنا");
        arMessages.put("success.contact.form", "شكراً لك على رسالتك. سنرد عليك قريباً!");
        arMessages.put("error.invalid.data", "بيانات غير صحيحة: {error}");
        arMessages.put("error.server", "عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى لاحقاً.");
        arMessages.put("password.reset.subject", "طلب إعادة تعيين كلمة المرور - {websiteName}");
        arMessages.put("password.reset.confirmation.subject", "تم تغيير كلمة المرور بنجاح - {websiteName}");
        arMessages.put("password.reset.success", "إذا كان البريد الإلكتروني موجود، فقد تم إرسال رابط إعادة تعيين كلمة المرور.");
        arMessages.put("password.reset.completed", "تم إعادة تعيين كلمة المرور بنجاح!");
        arMessages.put("password.reset.invalid.token", "رمز إعادة التعيين غير صحيح أو منتهي الصلاحية.");
        arMessages.put("password.reset.token.expired", "انتهت صلاحية رمز إعادة التعيين. يرجى طلب رمز جديد.");
        arMessages.put("password.reset.rate.limited", "محاولات كثيرة لإعادة تعيين كلمة المرور. يرجى المحاولة لاحقاً.");
        
        MESSAGES.put("en", enMessages);
        MESSAGES.put("ar", arMessages);
    }
    
    /**
     * Get localized message with parameter substitution.
     */
    public String getMessage(String key, String language, Map<String, String> params) {
        String template = MESSAGES.getOrDefault(language, MESSAGES.get("en")).get(key);
        if (template == null) {
            return key; // Fallback to key if message not found
        }
        
        if (params != null) {
            for (Map.Entry<String, String> entry : params.entrySet()) {
                template = template.replace("{" + entry.getKey() + "}", entry.getValue());
            }
        }
        
        return template;
    }
    
    /**
     * Get localized message without parameters.
     */
    public String getMessage(String key, String language) {
        return getMessage(key, language, null);
    }
}