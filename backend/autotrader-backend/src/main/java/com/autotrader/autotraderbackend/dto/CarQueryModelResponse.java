package com.autotrader.autotraderbackend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Response DTO for CarQuery API models endpoint
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CarQueryModelResponse {

    @JsonProperty("Models")
    private List<CarQueryModel> models;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CarQueryModel {
        @JsonProperty("model_name")
        private String modelName;

        @JsonProperty("model_make_id")
        private String modelMakeId;
    }
}
