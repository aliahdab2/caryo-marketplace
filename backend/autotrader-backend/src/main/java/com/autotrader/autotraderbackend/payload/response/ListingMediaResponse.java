package com.autotrader.autotraderbackend.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ListingMediaResponse {
    
    private Long id;
    private String url;
    private String fileKey;
    private String fileName;
    private String contentType;
    private Long size;
    private Integer sortOrder;
    private Boolean isPrimary;
    private String mediaType;
    
    // Explicit getters and setters for clarity and consistent style
    public Long getId() { return id; }
    public String getUrl() { return url; }
    public String getFileKey() { return fileKey; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public Long getSize() { return size; }
    public Integer getSortOrder() { return sortOrder; }
    public Boolean getIsPrimary() { return isPrimary; }
    public String getMediaType() { return mediaType; }
    
    public void setId(Long id) { this.id = id; }
    public void setUrl(String url) { this.url = url; }
    public void setFileKey(String fileKey) { this.fileKey = fileKey; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public void setSize(Long size) { this.size = size; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
}
