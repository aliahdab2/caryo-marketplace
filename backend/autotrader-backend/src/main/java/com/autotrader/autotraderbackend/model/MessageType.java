package com.autotrader.autotraderbackend.model;

/**
 * Enum representing the type of a message.
 * Follows the existing enum patterns in the project.
 */
public enum MessageType {

    /**
     * Text message - plain text content
     */
    TEXT("text"),

    /**
     * Image message - contains image attachment
     */
    IMAGE("image"),

    /**
     * System message - automated notifications
     */
    SYSTEM("system");

    private final String value;

    MessageType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MessageType fromValue(String value) {
        for (MessageType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown message type: " + value);
    }
}
