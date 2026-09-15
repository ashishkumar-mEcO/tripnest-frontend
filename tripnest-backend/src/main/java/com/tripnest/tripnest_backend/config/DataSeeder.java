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
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final AttractionRepository attractionRepository;
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

        seedDestinationsAndAttractions();

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

    private void seedDestinationsAndAttractions() {
        saveIfMissing("Paris", "France", "City of Light and iconic Eiffel Tower", true, List.of(
            Map.of("name", "Eiffel Tower", "desc", "World-famous iron lattice tower on the Champ de Mars in Paris."),
            Map.of("name", "Louvre Museum", "desc", "World's largest art museum housing Mona Lisa and historic masterpieces."),
            Map.of("name", "Notre-Dame Cathedral", "desc", "Iconic French Gothic cathedral on the Île de la Cité."),
            Map.of("name", "Arc de Triomphe", "desc", "Historic triumphal arch standing at the western end of the Champs-Élysées.")
        ));

        saveIfMissing("Bali", "Indonesia", "Tropical paradise with beaches and temples", true, List.of(
            Map.of("name", "Tanah Lot Temple", "desc", "Ancient Hindu shrine perched on an offshore rock formation."),
            Map.of("name", "Ubud Sacred Monkey Forest", "desc", "Natural sanctuary and temple complex home to crab-eating macaques."),
            Map.of("name", "Uluwatu Temple", "desc", "Cliffside Balinese sea temple famed for Kecak dance performances."),
            Map.of("name", "Tegallalang Rice Terraces", "desc", "Stunning emerald-green terraced rice paddies in Ubud.")
        ));

        saveIfMissing("Tokyo", "Japan", "Vibrant metropolis blending tradition and future", true, List.of(
            Map.of("name", "Senso-ji Temple", "desc", "Tokyo's oldest and most significant Buddhist temple in Asakusa."),
            Map.of("name", "Tokyo Skytree", "desc", "Tallest broadcasting tower in the world with observation decks."),
            Map.of("name", "Shibuya Crossing", "desc", "World's busiest pedestrian intersection illuminated by neon signs."),
            Map.of("name", "Meiji Shrine", "desc", "Serene Shinto shrine dedicated to Emperor Meiji surrounded by forest.")
        ));

        saveIfMissing("Goa", "India", "Famous beach paradise with nightlife and historic churches", true, List.of(
            Map.of("name", "Baga Beach", "desc", "Popular beach known for water sports, beach shacks, and vibrant nightlife."),
            Map.of("name", "Fort Aguada", "desc", "17th-century Portuguese fort and lighthouse overlooking Arabian Sea."),
            Map.of("name", "Basilica of Bom Jesus", "desc", "UNESCO World Heritage site holding mortal remains of St. Francis Xavier."),
            Map.of("name", "Dudhsagar Waterfalls", "desc", "Four-tiered milky waterfall located on the Mandovi River.")
        ));

        saveIfMissing("Rome", "Italy", "Historic capital with Ancient Colosseum", false, List.of(
            Map.of("name", "Colosseum", "desc", "Largest ancient amphitheatre ever built, icon of Imperial Rome."),
            Map.of("name", "Trevi Fountain", "desc", "Breathtaking Baroque fountain where visitors toss coins for good luck."),
            Map.of("name", "Pantheon", "desc", "Former Roman temple featuring the world's largest unreinforced concrete dome."),
            Map.of("name", "Vatican Museums", "desc", "Christian art collections featuring Michelangelo's Sistine Chapel ceiling.")
        ));

        saveIfMissing("New York", "USA", "The city that never sleeps", false, List.of(
            Map.of("name", "Statue of Liberty", "desc", "Symbol of freedom and democracy on Liberty Island in NY Harbor."),
            Map.of("name", "Central Park", "desc", "Sprawling urban park offering walking paths, lakes, and meadows."),
            Map.of("name", "Empire State Building", "desc", "102-story landmark skyscraper with panoramic observation decks."),
            Map.of("name", "Times Square", "desc", "Brightly lit commercial intersection known for Broadway theater district.")
        ));

        saveIfMissing("London", "UK", "Historic capital with Big Ben and London Eye", false, List.of(
            Map.of("name", "Big Ben & Houses of Parliament", "desc", "Iconic clock tower and seat of UK Government along Thames."),
            Map.of("name", "Tower Bridge", "desc", "Victorian suspension bridge featuring high-level glass walkways."),
            Map.of("name", "British Museum", "desc", "World-renowned museum dedicated to human history, art, and culture."),
            Map.of("name", "London Eye", "desc", "Giant Ferris wheel offering 360-degree city views across London.")
        ));

        saveIfMissing("Dubai", "UAE", "Luxury shopping, ultra-modern architecture and nightlife", true, List.of(
            Map.of("name", "Burj Khalifa", "desc", "Tallest skyscraper in the world standing at 828 meters high."),
            Map.of("name", "The Dubai Mall", "desc", "World's largest shopping center featuring giant aquarium and ice rink."),
            Map.of("name", "Palm Jumeirah", "desc", "Artificial archipelago shaped like a palm tree with luxury resorts."),
            Map.of("name", "Dubai Frame", "desc", "Architectural landmark framing views of Old and New Dubai.")
        ));

        saveIfMissing("Kerala", "India", "Backwaters, palm-lined beaches and spice plantations", true, List.of(
            Map.of("name", "Alleppey Backwaters", "desc", "Serene network of brackish lagoons, canals, and traditional houseboats."),
            Map.of("name", "Fort Kochi", "desc", "Historic seaside area with iconic Chinese fishing nets and heritage art."),
            Map.of("name", "Munnar Tea Gardens", "desc", "Rolling green hill station filled with aromatic tea plantations."),
            Map.of("name", "Athirappilly Waterfalls", "desc", "Largest waterfall in Kerala, often called the Niagara of India.")
        ));

        saveIfMissing("Sydney", "Australia", "Famous Opera House and coastal surf beaches", false, List.of(
            Map.of("name", "Sydney Opera House", "desc", "Multi-venue performing arts centre with iconic sail-like roof."),
            Map.of("name", "Sydney Harbour Bridge", "desc", "Steel arch bridge spanning Sydney Harbour for scenic climbs."),
            Map.of("name", "Bondi Beach", "desc", "Famous golden sand surf beach surrounded by coastal cliff walks.")
        ));

        saveIfMissing("Bangkok", "Thailand", "Vibrant street life, ornate shrines and temples", true, List.of(
            Map.of("name", "The Grand Palace", "desc", "Complex of royal buildings and Wat Phra Kaew (Emerald Buddha)."),
            Map.of("name", "Wat Arun (Temple of Dawn)", "desc", "Riverside Buddhist temple featuring colorfully decorated spires."),
            Map.of("name", "Chatuchak Weekend Market", "desc", "One of the world's largest weekend markets with thousands of stalls.")
        ));

        saveIfMissing("Singapore", "Singapore", "Garden city with iconic Marina Bay Sands & culture", true, List.of(
            Map.of("name", "Marina Bay Sands", "desc", "Iconic hotel complex with world's largest rooftop infinity pool."),
            Map.of("name", "Gardens by the Bay", "desc", "Futuristic nature park featuring Supertree Grove and Cloud Forest."),
            Map.of("name", "Sentosa Island", "desc", "Island resort with beaches, Universal Studios, and attractions.")
        ));

        saveIfMissing("Manali", "India", "High-altitude Himalayan resort town with snow sports", true, List.of(
            Map.of("name", "Solang Valley", "desc", "Adventure hub for paragliding, zorbing, skiing, and snow sports."),
            Map.of("name", "Hadimba Temple", "desc", "Ancient wooden pagoda temple surrounded by cedar forests."),
            Map.of("name", "Rohtang Pass", "desc", "High mountain pass offering breathtaking Himalayan glacier views.")
        ));

        saveIfMissing("Shimla", "India", "Capital of Himachal Pradesh with colonial heritage", false, List.of(
            Map.of("name", "The Ridge & Mall Road", "desc", "Heart of Shimla featuring pedestrian shopping and colonial views."),
            Map.of("name", "Jakhu Temple", "desc", "Ancient Hanuman temple atop Jakhu Hill with giant 108ft statue.")
        ));

        saveIfMissing("Santorini", "Greece", "Whitewashed houses and breathtaking Aegean sea views", true, List.of(
            Map.of("name", "Oia Sunset Viewpoint", "desc", "Picturesque village famous for blue-domed churches and sunsets."),
            Map.of("name", "Red Beach", "desc", "Unique volcanic beach featuring steep red cliff backdrops.")
        ));

        saveIfMissing("Kyoto", "Japan", "Famous for classical Buddhist temples, gardens and shrines", true, List.of(
            Map.of("name", "Fushimi Inari Shrine", "desc", "Shinto shrine famous for thousands of vermilion torii gates."),
            Map.of("name", "Kinkaku-ji (Golden Pavilion)", "desc", "Zen Buddhist temple covered in gold leaf overlooking a pond.")
        ));

        saveIfMissing("Amsterdam", "Netherlands", "Historic canals, tulip fields and world-class museums", false, List.of(
            Map.of("name", "Rijksmuseum", "desc", "National museum dedicated to Dutch arts and history."),
            Map.of("name", "Anne Frank House", "desc", "Biographical museum converted from the WWII secret annex.")
        ));

        saveIfMissing("Barcelona", "Spain", "Famous for Sagrada Família, beaches and Catalan culture", true, List.of(
            Map.of("name", "Sagrada Família", "desc", "Antoni Gaudí's unfinished masterwork basilica and UNESCO site."),
            Map.of("name", "Park Güell", "desc", "Whimsical public park system composed of colorful Gaudí mosaics.")
        ));

        saveIfMissing("Maldives", "Maldives", "Overwater bungalows, crystal clear lagoons & reefs", true, List.of(
            Map.of("name", "Maafushi Island", "desc", "Tropical island with crystal clear coral reefs and water sports."),
            Map.of("name", "Banana Reef", "desc", "World-class diving site filled with exotic marine life and caves.")
        ));

        saveIfMissing("Hawaii", "USA", "Volcanoes, beaches, surf culture and tropical nature", true, List.of(
            Map.of("name", "Waikiki Beach", "desc", "World-famous Oahu beach lined with palms and surf breaks."),
            Map.of("name", "Pearl Harbor Memorial", "desc", "National historic landmark honoring WWII history.")
        ));

        saveIfMissing("Cairo", "Egypt", "Giza Pyramids, Great Sphinx and ancient Nile river", false, List.of(
            Map.of("name", "Pyramids of Giza", "desc", "Ancient wonder of the world built for Pharaohs of Egypt."),
            Map.of("name", "Great Sphinx of Giza", "desc", "Monolithic limestone statue of a mythical creature with a lion body.")
        ));

        saveIfMissing("Switzerland", "Switzerland", "Alpine scenery, snowy peaks, lakes and luxury watchmaking", true, List.of(
            Map.of("name", "Matterhorn Peak", "desc", "Iconic pyramid-shaped mountain peak in the Swiss Alps."),
            Map.of("name", "Jungfraujoch", "desc", "Top of Europe alpine station featuring Ice Palace and glaciers.")
        ));

        saveIfMissing("Toronto", "Canada", "Dynamic metropolis with iconic CN Tower & lakefront", false, List.of(
            Map.of("name", "CN Tower", "desc", "553m communications tower featuring glass floor and EdgeWalk."),
            Map.of("name", "Royal Ontario Museum", "desc", "Museum of art, world culture, and natural history.")
        ));

        saveIfMissing("Venice", "Italy", "Romantic canal city with gondolas and St Mark's Basilica", false, List.of(
            Map.of("name", "St. Mark's Basilica", "desc", "Cathedral church of the Roman Catholic Archdiocese of Venice."),
            Map.of("name", "Grand Canal & Rialto Bridge", "desc", "Primary waterway of Venice lined with historic palaces.")
        ));

        saveIfMissing("Istanbul", "Turkey", "Historic city straddling Europe and Asia across the Bosphorus", true, List.of(
            Map.of("name", "Hagia Sophia", "desc", "Architectural marvel built as a cathedral in 537 AD."),
            Map.of("name", "Grand Bazaar", "desc", "One of the largest and oldest covered markets in the world.")
        ));
    }

    private void saveIfMissing(String name, String country, String desc, boolean popular, List<Map<String, String>> attractions) {
        Destination destination = destinationRepository.findAll().stream()
                .filter(d -> d.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);

        if (destination == null) {
            destination = destinationRepository.save(new Destination(null, name, country, desc, null, popular));
        } else {
            destination.setWeatherInfo(null);
            destination = destinationRepository.save(destination);
        }

        if (attractions != null && !attractions.isEmpty()) {
            final Destination destRef = destination;
            for (Map<String, String> attr : attractions) {
                String attrName = attr.get("name");
                String attrDesc = attr.get("desc");
                if (attractionRepository.findByDestinationId(destRef.getId()).stream().noneMatch(a -> a.getName().equalsIgnoreCase(attrName))) {
                    Attraction a = new Attraction();
                    a.setDestination(destRef);
                    a.setName(attrName);
                    a.setDescription(attrDesc);
                    attractionRepository.save(a);
                }
            }
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
