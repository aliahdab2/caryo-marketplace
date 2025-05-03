package com.autotrader.autotraderbackend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class HomeController {
    
    /**
     * Redirect root path to Swagger UI
     * @return RedirectView to Swagger UI
     */
    @GetMapping("/")
    public RedirectView redirectToSwagger() {
        return new RedirectView("/swagger-ui/index.html");
    }
    
    // Removed duplicate /status endpoint to avoid ambiguous mapping
}
