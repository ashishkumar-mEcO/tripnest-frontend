package com.tripnest.tripnest_backend.config;

import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final TripRepository tripRepository;
    private final ItineraryRepository itineraryRepository;
    private final ActivityRepository activityRepository;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> DEFAULT_ROLES = List.of("TRAVELER", "GROUP_ADMIN", "ADMINISTRATOR");
    private static final String DEFAULT_ADMIN_EMAIL = "admin@tripnest.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";

    @Override
    public void run(String... args) {
        DEFAULT_ROLES.forEach(roleName -> {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
        });

        seedDestinations();

        User admin;
        if (userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
            admin = userRepository.findByEmail(DEFAULT_ADMIN_EMAIL).orElse(null);
        } else {
            Role adminRole = roleRepository.findByName("ADMINISTRATOR")
                    .orElseThrow(() -> new RuntimeException("ADMINISTRATOR role missing after seeding"));

            admin = new User();
            admin.setName("Default Administrator");
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
            admin.setRole(adminRole);
            admin.setOauthGoogle(false);
            admin = userRepository.save(admin);
        }

        if (admin != null) {
            seedSampleTripsAndExpenses(admin);
        }
    }

    private void seedDestinations() {
        if (destinationRepository.count() < 10) {
            saveIfMissing("Paris", "France", "City of Light and iconic Eiffel Tower", "Sunny 22°C", true);
            saveIfMissing("Bali", "Indonesia", "Tropical paradise with beaches and temples", "Tropical 29°C", true);
            saveIfMissing("Tokyo", "Japan", "Vibrant metropolis blending tradition and future", "Clear 19°C", true);
            saveIfMissing("Goa", "India", "Famous beach paradise with nightlife and historic churches", "Sunny 30°C", true);
            saveIfMissing("Rome", "Italy", "Historic capital with Ancient Colosseum", "Warm 26°C", false);
            saveIfMissing("New York", "USA", "The city that never sleeps", "Breezy 21°C", false);
            saveIfMissing("London", "UK", "Historic capital with Big Ben and London Eye", "Mild 18°C", false);
            saveIfMissing("Dubai", "UAE", "Luxury shopping, ultra-modern architecture and nightlife", "Sunny 34°C", true);
            saveIfMissing("Kerala", "India", "Backwaters, palm-lined beaches and spice plantations", "Tropical 28°C", true);
            saveIfMissing("Sydney", "Australia", "Famous Opera House and coastal surf beaches", "Sunny 24°C", false);
        }
    }

    private void saveIfMissing(String name, String country, String desc, String weather, boolean popular) {
        if (destinationRepository.findAll().stream().noneMatch(d -> d.getName().equalsIgnoreCase(name))) {
            destinationRepository.save(new Destination(null, name, country, desc, weather, popular));
        }
    }

    private void seedSampleTripsAndExpenses(User admin) {
        if (tripRepository.count() == 0) {
            Destination goa = destinationRepository.findAll().stream()
                    .filter(d -> d.getName().equalsIgnoreCase("Goa"))
                    .findFirst().orElse(null);

            Trip trip1 = new Trip();
            trip1.setOwner(admin);
            trip1.setDestination(goa);
            trip1.setTitle("Goa Beach Vacation & Scuba Diving");
            trip1.setStartDate(LocalDate.now().plusDays(10));
            trip1.setEndDate(LocalDate.now().plusDays(17));
            trip1.setStatus("PLANNED");
            trip1 = tripRepository.save(trip1);

            // Seed Itinerary Day
            Itinerary day1 = new Itinerary();
            day1.setTrip(trip1);
            day1.setDayNumber(1);
            day1.setItineraryDate(LocalDate.now().plusDays(10));
            day1.setTitle("Day 1: Arrival & Baga Beach Sunset");
            day1.setDescription("Beach walk & seafood dinner");
            day1 = itineraryRepository.save(day1);

            Activity act1 = new Activity();
            act1.setItinerary(day1);
            act1.setActivityName("Baga Beach Sunset Walk");
            act1.setActivityType("Sightseeing");
            act1.setStartTime(LocalTime.of(17, 0));
            act1.setEndTime(LocalTime.of(19, 0));
            act1.setLocation("Baga Beach");
            act1.setDescription("Relaxing sunset walk");
            act1.setReminder(true);
            activityRepository.save(act1);

            // Seed Budget & Expenses
            Budget budget = new Budget();
            budget.setTrip(trip1);
            budget.setTotalBudget(new BigDecimal("50000.00"));
            budget.setSpentAmount(new BigDecimal("23000.00"));
            budget = budgetRepository.save(budget);

            Expense exp1 = new Expense();
            exp1.setBudget(budget);
            exp1.setCategory("Hotel");
            exp1.setAmount(new BigDecimal("15000.00"));
            exp1.setDescription("5-Star Beach Resort 3-Night Stay");
            exp1.setExpenseDate(LocalDate.now().plusDays(10));
            expenseRepository.save(exp1);

            Expense exp2 = new Expense();
            exp2.setBudget(budget);
            exp2.setCategory("Food");
            exp2.setAmount(new BigDecimal("4500.00"));
            exp2.setDescription("Seafood Shack Dinner & Drinks");
            exp2.setExpenseDate(LocalDate.now().plusDays(11));
            expenseRepository.save(exp2);

            Expense exp3 = new Expense();
            exp3.setBudget(budget);
            exp3.setCategory("Transportation");
            exp3.setAmount(new BigDecimal("3500.00"));
            exp3.setDescription("Goa Taxi & Scooter Rental");
            exp3.setExpenseDate(LocalDate.now().plusDays(10));
            expenseRepository.save(exp3);
        }
    }
}
