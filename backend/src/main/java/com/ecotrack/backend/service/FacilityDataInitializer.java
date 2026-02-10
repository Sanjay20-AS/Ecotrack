package com.ecotrack.backend.service;

import com.ecotrack.backend.model.Facility;
import com.ecotrack.backend.repository.FacilityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class FacilityDataInitializer implements CommandLineRunner {

    private final FacilityRepository facilityRepository;

    public FacilityDataInitializer(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (facilityRepository.count() == 0) {
            // Create sample facilities
            Facility facility1 = new Facility("Green Electronics Recycler", "EWASTE", 12.9716, 77.5946);
            facility1.setAddress("123 Tech Street, Bangalore");
            facility1.setPhoneNumber("+91-80-12345678");
            facility1.setOperatingHours("9 AM - 6 PM");
            facility1.setDescription("Specializes in electronic waste recycling");

            Facility facility2 = new Facility("City Compost Center", "COMPOST", 12.9352, 77.6245);
            facility2.setAddress("456 Garden Avenue, Bangalore");
            facility2.setPhoneNumber("+91-80-87654321");
            facility2.setOperatingHours("8 AM - 5 PM");  
            facility2.setDescription("Organic waste composting facility");

            Facility facility3 = new Facility("Food Recovery Network", "FOOD", 12.9600, 77.5900);
            facility3.setAddress("789 Community Road, Bangalore");
            facility3.setPhoneNumber("+91-80-11223344");
            facility3.setOperatingHours("7 AM - 7 PM");
            facility3.setDescription("Food waste collection and distribution");

            Facility facility4 = new Facility("Metro Recycling Hub", "EWASTE", 12.9500, 77.6100);
            facility4.setAddress("321 Digital Drive, Bangalore");
            facility4.setPhoneNumber("+91-80-99887766");
            facility4.setOperatingHours("10 AM - 6 PM");
            facility4.setDescription("Multi-purpose e-waste recycling center");

            Facility facility5 = new Facility("Organic Waste Solutions", "COMPOST", 12.9800, 77.5800);
            facility5.setAddress("654 Nature Lane, Bangalore");
            facility5.setPhoneNumber("+91-80-55443322");
            facility5.setOperatingHours("6 AM - 4 PM");
            facility5.setDescription("Composting and organic waste management");

            facilityRepository.save(facility1);
            facilityRepository.save(facility2);
            facilityRepository.save(facility3);
            facilityRepository.save(facility4);
            facilityRepository.save(facility5);

            System.out.println("Sample facilities added to database");
        }
    }
}