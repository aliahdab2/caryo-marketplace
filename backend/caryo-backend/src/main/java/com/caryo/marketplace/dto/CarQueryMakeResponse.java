package com.caryo.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Response DTO for CarQuery API makes endpoint
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CarQueryMakeResponse {

    @JsonProperty("Makes")
    private List<CarQueryMake> makes;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CarQueryMake {
        @JsonProperty("make_id")
        private String makeId;

        @JsonProperty("make_display")
        private String makeDisplay;

        @JsonProperty("make_country")
        private String makeCountry;

        @JsonProperty("make_is_common")
        private Integer makeIsCommon;
    }
}
