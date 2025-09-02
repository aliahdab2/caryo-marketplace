package com.autotrader.autotraderbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.context.MessageSource;
import org.springframework.beans.factory.annotation.Autowired;
import com.autotrader.autotraderbackend.util.ArabicTextUtils;
import java.util.Map;
import java.util.HashMap;
import java.util.Locale;

/**
 * Service for managing internationalized messages.
 * Centralizes all email subject lines and messages with proper i18n support.
 */
@Service
public class MessageService {
    
    @Autowired(required = false)
    private MessageSource messageSource;
    
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
        
        // Email subject lines (new format with email. prefix)
        enMessages.put("email.listing_approved.subject", "Your listing has been approved!");
        enMessages.put("email.listing_expired.subject", "Your listing has expired");
        enMessages.put("email.listing_renewal.subject", "Your listing has been renewed");
        enMessages.put("email.welcome.subject", "Welcome to {websiteName}!");
        enMessages.put("email.contact_form.subject", "New contact form submission from {name}");
        enMessages.put("email.contact_confirmation.subject", "Thank you for contacting us");
        enMessages.put("email.listing_sold.subject", "Your listing has been sold!");
        enMessages.put("email.listing_archived.subject", "Your listing has been archived");
        enMessages.put("email.listing_feedback.subject", "How was your selling experience?");
        enMessages.put("email.newsletter_confirmation.subject", "Confirm your subscription to {websiteName}");
        enMessages.put("email.newsletter_welcome.subject", "Welcome to {websiteName} Newsletter!");
        enMessages.put("email.password_reset.subject", "Password Reset Request");
        enMessages.put("email.password_reset_confirmation.subject", "Password Successfully Changed");
        enMessages.put("email.registration_confirmation.subject", "Welcome to {websiteName}!");
        enMessages.put("email.account_verification.subject", "Verify your {websiteName} account");
        enMessages.put("email.security_alert.subject", "Security Alert - {websiteName}");
        enMessages.put("email.email_change.subject", "Email Change Confirmation - {websiteName}");
        enMessages.put("email.password_reset.security_alert", "Didn't make this change?");
        enMessages.put("email.password_reset.security_message", "If you did not change your password, please contact our support team immediately at {supportEmail} or phone {supportPhone}.");
        
        // Email footer and common elements
        enMessages.put("email.footer.copyright", "© {year} {websiteName}. All rights reserved.");
        enMessages.put("email.greeting.hello", "Hello");
        enMessages.put("email.website.tagline", "Your Trusted Car Marketplace");
        enMessages.put("email.welcome.title", "Welcome to {websiteName}!");
        enMessages.put("email.welcome.message", "Thank you for joining our community of car enthusiasts!");
        enMessages.put("email.welcome.browse_cars", "Browse thousands of cars from trusted dealers and private sellers");
        
        // Messaging system messages
        enMessages.put("message.marked.read.success", "Message marked as read successfully");
        enMessages.put("messages.marked.read.all.success", "All messages marked as read successfully");
        enMessages.put("conversation.archived.success", "Conversation archived successfully");
        enMessages.put("conversation.status.updated.success", "Conversation status updated successfully");
        enMessages.put("conversation.created.success", "Conversation created successfully");
        enMessages.put("message.sent.success", "Message sent successfully");
        
        // Error messages
        enMessages.put("error.resource.not.found", "{resource} not found");
        enMessages.put("error.access.denied", "Access denied");
        enMessages.put("error.validation.failed", "Validation failed: {details}");
        enMessages.put("error.server.internal", "An internal server error occurred");
        
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
        
        // Email subject lines (Arabic - new format with email. prefix)
        arMessages.put("email.listing_approved.subject", "تمت الموافقة على إعلانك!");
        arMessages.put("email.listing_expired.subject", "انتهت صلاحية إعلانك");
        arMessages.put("email.listing_renewal.subject", "تم تجديد إعلانك");
        arMessages.put("email.welcome.subject", "مرحباً بك في {websiteName}!");
        arMessages.put("email.contact_form.subject", "رسالة جديدة من {name}");
        arMessages.put("email.contact_confirmation.subject", "شكراً لتواصلك معنا");
        arMessages.put("email.listing_sold.subject", "تم بيع إعلانك!");
        arMessages.put("email.listing_archived.subject", "تم أرشفة إعلانك");
        arMessages.put("email.listing_feedback.subject", "كيف كانت تجربة البيع؟");
        arMessages.put("email.newsletter_confirmation.subject", "تأكيد اشتراكك في {websiteName}");
        arMessages.put("email.newsletter_welcome.subject", "مرحباً بك في نشرة {websiteName}!");
        arMessages.put("email.password_reset.subject", "طلب إعادة تعيين كلمة المرور");
        arMessages.put("email.password_reset_confirmation.subject", "تم تغيير كلمة المرور بنجاح");
        arMessages.put("email.registration_confirmation.subject", "مرحباً بك في {websiteName}!");
        arMessages.put("email.account_verification.subject", "تحقق من حسابك في {websiteName}");
        arMessages.put("email.security_alert.subject", "تنبيه أمني - {websiteName}");
        arMessages.put("email.email_change.subject", "تأكيد تغيير البريد الإلكتروني - {websiteName}");
        arMessages.put("email.password_reset.security_alert", "لم تقم بهذا التغيير؟");
        arMessages.put("email.password_reset.security_message", "إذا لم تقم بتغيير كلمة المرور، يرجى الاتصال بفريق الدعم الفني فوراً على {supportEmail} أو الهاتف {supportPhone}.");
        
        // Email footer and common elements (Arabic)
        arMessages.put("email.footer.copyright", "© {year} {websiteName}. جميع الحقوق محفوظة.");
        arMessages.put("email.greeting.hello", "مرحباً");
        arMessages.put("email.website.tagline", "منصة السيارات الموثوقة");
        arMessages.put("email.welcome.title", "مرحباً بك في {websiteName}!");
        arMessages.put("email.welcome.message", "شكراً لانضمامك إلى مجتمع عشاق السيارات!");
        arMessages.put("email.welcome.browse_cars", "تصفح آلاف السيارات من وكلاء موثوقين وبائعين خاصين");
        
        // Messaging system messages (Arabic)
        arMessages.put("message.marked.read.success", "تم وضع علامة على الرسالة كمقروءة بنجاح");
        arMessages.put("messages.marked.read.all.success", "تم وضع علامة على جميع الرسائل كمقروءة بنجاح");
        arMessages.put("conversation.archived.success", "تم أرشفة المحادثة بنجاح");
        arMessages.put("conversation.status.updated.success", "تم تحديث حالة المحادثة بنجاح");
        arMessages.put("conversation.created.success", "تم إنشاء المحادثة بنجاح");
        arMessages.put("message.sent.success", "تم إرسال الرسالة بنجاح");
        
        // Error messages (Arabic)
        arMessages.put("error.resource.not.found", "{resource} غير موجود");
        arMessages.put("error.access.denied", "تم رفض الوصول");
        arMessages.put("error.validation.failed", "فشل في التحقق: {details}");
        arMessages.put("error.server.internal", "حدث خطأ داخلي في الخادم");
        
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
                // Normalize Arabic text in parameters
                String value = ArabicTextUtils.normalizeArabicText(entry.getValue());
                template = template.replace("{" + entry.getKey() + "}", value);
            }
        }
        
        // Normalize the final template for Arabic text
        return ArabicTextUtils.normalizeArabicText(template);
    }
    
    /**
     * Get localized message without parameters.
     */
    public String getMessage(String key, String language) {
        return getMessage(key, language, null);
    }
    
    /**
     * Note: MessageSource is now configured in Utf8Config.java for centralized UTF-8 handling.
     * This ensures proper encoding for Arabic text and international characters.
     */
    
    /**
     * Get localized message using Spring's MessageSource (preferred method).
     * This method supports proper i18n with .properties files.
     */
    public String getLocalizedMessage(String key, String language, Object... args) {
        if (messageSource != null) {
            try {
                Locale locale = getLocaleFromLanguage(language);
                String message = messageSource.getMessage(key, args, locale);
                return ArabicTextUtils.normalizeArabicText(message);
            } catch (Exception e) {
                // Fall through to legacy method
            }
        }
        
        // Fallback to the old method if message not found in properties or MessageSource not available
        Map<String, String> params = new HashMap<>();
        if (args != null && args.length > 0) {
            // Convert args to params map for backward compatibility
            for (int i = 0; i < args.length; i++) {
                params.put("arg" + i, String.valueOf(args[i]));
            }
        }
        return getMessage(key, language, params);
    }
    
    /**
     * Get localized message with named parameters using Spring's MessageSource.
     */
    public String getLocalizedMessage(String key, String language, Map<String, Object> params) {
        if (messageSource != null) {
            try {
                Locale locale = getLocaleFromLanguage(language);
                
                // For named parameters, we need to replace them in the template
                String template = messageSource.getMessage(key, null, locale);
                
                if (params != null) {
                    for (Map.Entry<String, Object> entry : params.entrySet()) {
                        String value = ArabicTextUtils.normalizeArabicText(String.valueOf(entry.getValue()));
                        template = template.replace("{" + entry.getKey() + "}", value);
                    }
                }
                
                return ArabicTextUtils.normalizeArabicText(template);
            } catch (Exception e) {
                // Fall through to legacy method
            }
        }
        
        // Fallback to the old method
        Map<String, String> stringParams = new HashMap<>();
        if (params != null) {
            params.forEach((k, v) -> stringParams.put(k, String.valueOf(v)));
        }
        return getMessage(key, language, stringParams);
    }
    
    /**
     * Convert language code to Locale.
     */
    private Locale getLocaleFromLanguage(String language) {
        if ("ar".equals(language)) {
            return Locale.forLanguageTag("ar");
        }
        return Locale.ENGLISH; // Default to English
    }
}