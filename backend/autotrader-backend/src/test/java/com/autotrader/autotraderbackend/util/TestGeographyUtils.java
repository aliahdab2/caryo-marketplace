package com.autotrader.autotraderbackend.util;

import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.model.Location;

/**
 * Helper class for creating test entities for the geographic hierarchy
 * (Country > Governorate > Location)
 */
public class TestGeographyUtils {

    /**
     * Creates a test country with the given code
     *
     * @param countryCode ISO country code (e.g., "SY" for Syria)
     * @return A test Country entity
     */
    public static Country createTestCountry(String countryCode) {
        Country country = new Country();
        country.setCountryCode(countryCode);
        country.setDisplayNameEn(getCountryNameEn(countryCode));
        country.setDisplayNameAr(getCountryNameAr(countryCode));
        country.setIsActive(true);
        return country;
    }
    
    /**
     * Creates a test governorate associated with a country
     *
     * @param nameEn English name of the governorate
     * @param nameAr Arabic name of the governorate
     * @param country The country the governorate belongs to
     * @return A test Governorate entity
     */
    public static Governorate createTestGovernorate(String nameEn, String nameAr, Country country) {
        Governorate governorate = new Governorate();
        governorate.setDisplayNameEn(nameEn);
        governorate.setDisplayNameAr(nameAr);
        governorate.setSlug(SlugUtils.slugify(nameEn));
        governorate.setCountry(country);
        governorate.setRegion("Test Region");
        governorate.setLatitude(29.3759);
        governorate.setLongitude(47.9774);
        governorate.setIsActive(true);
        return governorate;
    }
    
    /**
     * Creates a test location associated with a governorate
     *
     * @param nameEn English name of the location
     * @param nameAr Arabic name of the location
     * @param governorate The governorate the location belongs to
     * @return A test Location entity
     */
    public static Location createTestLocation(String nameEn, String nameAr, Governorate governorate) {
        Location location = new Location();
        location.setDisplayNameEn(nameEn);
        location.setDisplayNameAr(nameAr);
        location.setSlug(SlugUtils.slugify(nameEn));
        location.setGovernorate(governorate);
        location.setRegion("Test Region");
        location.setLatitude(29.3759);
        location.setLongitude(47.9774);
        location.setIsActive(true);
        return location;
    }
    
    /**
     * Gets the English name for a country code
     */
    private static String getCountryNameEn(String countryCode) {
        switch (countryCode) {
            case "SY": return "Syria";
            case "KW": return "Kuwait";
            case "SA": return "Saudi Arabia";
            case "AE": return "United Arab Emirates";
            case "QA": return "Qatar";
            case "TC": return "Test Country";
            case "AC": return "Another Country";
            case "SC": return "Some Country";
            case "LI": return "Location Country";
            case "AL": return "Another Location";
            case "XX": return "Unknown Country";
            default: return "Test Country " + countryCode;
        }
    }
    
    /**
     * Gets the Arabic name for a country code
     */
    private static String getCountryNameAr(String countryCode) {
        switch (countryCode) {
            case "SY": return "سوريا";
            case "KW": return "الكويت";
            case "SA": return "المملكة العربية السعودية";
            case "AE": return "الإمارات العربية المتحدة";
            case "QA": return "قطر";
            default: return "بلد الاختبار " + countryCode;
        }
    }
}
