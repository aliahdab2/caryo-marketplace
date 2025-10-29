package com.autotrader.autotraderbackend.payment;

/**
 * Exception thrown when an invalid or unsupported payment method is used
 */
public class InvalidPaymentMethodException extends PaymentException {

    private final PaymentMethod paymentMethod;
    private final String providerType;

    public InvalidPaymentMethodException(String message) {
        super("INVALID_PAYMENT_METHOD", message);
        this.paymentMethod = null;
        this.providerType = null;
    }

    public InvalidPaymentMethodException(PaymentMethod paymentMethod, String providerType) {
        super(
            "INVALID_PAYMENT_METHOD",
            String.format("Payment method '%s' is not supported by provider '%s'",
                paymentMethod, providerType)
        );
        this.paymentMethod = paymentMethod;
        this.providerType = providerType;
    }

    public InvalidPaymentMethodException(PaymentMethod paymentMethod, String message, String providerType) {
        super("INVALID_PAYMENT_METHOD", message);
        this.paymentMethod = paymentMethod;
        this.providerType = providerType;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public String getProviderType() {
        return providerType;
    }
}

