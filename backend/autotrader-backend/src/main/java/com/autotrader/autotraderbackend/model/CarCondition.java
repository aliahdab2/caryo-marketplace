package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "car_conditions")
@Getter
@Setter
@NoArgsConstructor
public class CarCondition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(name = "display_name_en", nullable = false, length = 50)
    private String displayNameEn;

    @Column(name = "display_name_ar", nullable = false, length = 50)
    private String displayNameAr;

    @Column(nullable = false, length = 50, unique = true)
    private String slug;
}
