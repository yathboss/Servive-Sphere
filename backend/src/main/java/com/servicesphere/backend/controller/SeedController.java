package com.servicesphere.backend.controller;

import com.servicesphere.backend.service.SeedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/seed")
@CrossOrigin(origins = "*")
public class SeedController {

    @Autowired
    private SeedService seedService;

    @PostMapping
    public Map<String, String> seed() {
        return Map.of("message", seedService.seedData());
    }
}
