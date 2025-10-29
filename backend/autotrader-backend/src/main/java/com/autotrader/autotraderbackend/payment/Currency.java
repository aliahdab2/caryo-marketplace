package com.autotrader.autotraderbackend.payment;

/**
 * Supported currencies
 */
public enum Currency {
    /**
     * Syrian Pound
     */
    SYP("Syrian Pound", "S£", "ل.س"),

    /**
     * US Dollar
     */
    USD("US Dollar", "$", "$"),

    /**
     * Euro
     */
    EUR("Euro", "€", "€"),

    /**
     * Bitcoin
     */
    BTC("Bitcoin", "₿", "₿"),

    /**
     * Tether USD (stablecoin)
     */
    USDT("Tether USD", "USDT", "USDT");

    private final String displayName;
    private final String symbol;
    private final String symbolArabic;

    Currency(String displayName, String symbol, String symbolArabic) {
        this.displayName = displayName;
        this.symbol = symbol;
        this.symbolArabic = symbolArabic;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getSymbolArabic() {
        return symbolArabic;
    }

    /**
     * Get symbol for the given language
     */
    public String getSymbol(String language) {
        return "ar".equalsIgnoreCase(language) ? symbolArabic : symbol;
    }
}

