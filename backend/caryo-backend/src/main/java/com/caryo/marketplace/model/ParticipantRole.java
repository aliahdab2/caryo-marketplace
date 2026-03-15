package com.caryo.marketplace.model;

/**
 * Enum representing the role of a participant in a conversation.
 * Follows the existing enum patterns in the project.
 */
public enum ParticipantRole {

    /**
     * Buyer - the person interested in purchasing the car
     */
    BUYER("buyer"),

    /**
     * Seller - the person selling the car
     */
    SELLER("seller"),

    /**
     * Participant - additional participants (for future group chat support)
     */
    PARTICIPANT("participant");

    private final String value;

    ParticipantRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ParticipantRole fromValue(String value) {
        for (ParticipantRole role : values()) {
            if (role.value.equals(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown participant role: " + value);
    }
}
