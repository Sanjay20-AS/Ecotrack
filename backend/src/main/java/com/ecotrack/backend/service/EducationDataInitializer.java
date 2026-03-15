package com.ecotrack.backend.service;

import com.ecotrack.backend.model.EducationContent;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.repository.EducationContentRepository;
import com.ecotrack.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Order(10)
public class EducationDataInitializer implements CommandLineRunner {

    private final EducationContentRepository educationContentRepository;
    private final UserRepository userRepository;

    public EducationDataInitializer(EducationContentRepository educationContentRepository,
                                    UserRepository userRepository) {
        this.educationContentRepository = educationContentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (educationContentRepository.count() > 0) return;

        Optional<User> adminOpt = userRepository.findByEmail("admin@ecotrack.com");
        if (adminOpt.isEmpty()) return; // Cannot seed without a user reference

        User admin = adminOpt.get();

        EducationContent a1 = new EducationContent(
            "The 3 Rs: Reduce, Reuse, Recycle",
            "The \"3 Rs\" framework is the foundation of sustainable waste management.\n\n" +
            "**Reduce** means minimizing the amount of waste you generate in the first place — buying only what you need, choosing products with less packaging, and opting for durable goods over disposable ones.\n\n" +
            "**Reuse** means finding new purposes for items rather than discarding them. This could be as simple as using a shopping bag multiple times, repurposing glass jars, or donating clothes instead of throwing them away.\n\n" +
            "**Recycle** means converting waste materials into new products. Paper, glass, metals, and many plastics can be recycled. Always check your local guidelines, as recyclable materials vary by region.\n\n" +
            "Practising the 3 Rs saves energy, reduces greenhouse gases, conserves natural resources, and reduces pollution.",
            "WASTE_MANAGEMENT", admin
        );
        a1.setDifficulty("BEGINNER");
        a1.setThumbnailUrl("https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800");
        educationContentRepository.save(a1);

        EducationContent a2 = new EducationContent(
            "E-Waste: How to Dispose of Electronics Responsibly",
            "Electronic waste (e-waste) is the fastest-growing waste stream in the world. Old televisions, mobile phones, computers, and batteries contain toxic materials like lead, mercury, and cadmium that can contaminate soil and water if improperly discarded.\n\n" +
            "**Why e-waste matters:**\n" +
            "- A single CRT monitor contains up to 8 lbs of lead\n" +
            "- Lithium-ion batteries can cause fires in landfills\n" +
            "- Precious metals like gold and silver can be recovered and reused\n\n" +
            "**What you can do:**\n" +
            "1. Donate working electronics to schools, NGOs, or second-hand shops\n" +
            "2. Take broken devices to certified e-waste recycling centres\n" +
            "3. Participate in manufacturer take-back programmes\n" +
            "4. Never burn or bury electronics\n\n" +
            "In India, the E-Waste (Management) Rules 2016 mandate that producers and consumers follow proper disposal channels.",
            "E-WASTE", admin
        );
        a2.setDifficulty("BEGINNER");
        a2.setThumbnailUrl("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800");
        educationContentRepository.save(a2);

        EducationContent a3 = new EducationContent(
            "Composting at Home: A Beginner's Guide",
            "Composting turns food scraps and garden waste into nutrient-rich fertilizer. It's one of the best ways to reduce household waste and improve your garden or balcony plants.\n\n" +
            "**What you can compost:**\n" +
            "✅ Fruit and vegetable peels, coffee grounds, tea bags, eggshells, garden clippings, dried leaves\n\n" +
            "**What to avoid:**\n" +
            "❌ Meat, dairy, oily foods, diseased plants, pet waste\n\n" +
            "**Setting up your bin:**\n" +
            "1. Choose a well-draining spot with partial shade\n" +
            "2. Start with a layer of brown material (dry leaves, cardboard)\n" +
            "3. Add green material (food scraps)\n" +
            "4. Alternate layers and keep moist but not wet\n" +
            "5. Turn every 2–3 weeks to introduce oxygen\n\n" +
            "Compost is ready in 6–12 weeks — it should smell earthy, not rotten.",
            "COMPOSTING", admin
        );
        a3.setDifficulty("BEGINNER");
        a3.setThumbnailUrl("https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800");
        educationContentRepository.save(a3);

        EducationContent a4 = new EducationContent(
            "Understanding Plastic Types and Recyclability",
            "Not all plastics are recyclable, and mixing them contaminate batches at recycling plants. Plastics are classified with a resin identification code (1–7) usually shown inside the recycling symbol.\n\n" +
            "**Common types:**\n" +
            "- **#1 PET** (water bottles, food containers) — Widely recyclable ✅\n" +
            "- **#2 HDPE** (milk jugs, cleaning bottles) — Widely recyclable ✅\n" +
            "- **#4 LDPE** (cling wrap, bread bags) — Sometimes recyclable ⚠️\n" +
            "- **#5 PP** (yogurt containers, straws) — Sometimes recyclable ⚠️\n" +
            "- **#3 PVC, #6 PS, #7 Other** — Rarely recyclable ❌\n\n" +
            "**Tips:**\n" +
            "- Rinse containers before recycling\n" +
            "- Remove caps and labels if required by your local facility\n" +
            "- Never put plastic bags in your recycling bin — they jam machinery\n" +
            "- Drop soft plastics at dedicated collection points in supermarkets",
            "RECYCLING", admin
        );
        a4.setDifficulty("INTERMEDIATE");
        a4.setThumbnailUrl("https://images.unsplash.com/photo-1567954970774-58d6aa6c50dc?w=800");
        educationContentRepository.save(a4);

        EducationContent a5 = new EducationContent(
            "Food Waste: The Hidden Environmental Crisis",
            "One-third of all food produced globally is wasted, accounting for 8–10% of global greenhouse gas emissions. In India alone, an estimated 40% of produce is lost before it reaches the consumer.\n\n" +
            "**Environmental impact:**\n" +
            "- Wasted food in landfills produces methane, a potent greenhouse gas\n" +
            "- Growing discarded food wastes water, land, and energy\n" +
            "- Food waste contributes more carbon than the entire aviation industry\n\n" +
            "**What you can do:**\n" +
            "1. Plan meals and shop with a list\n" +
            "2. Store food correctly to extend shelf life\n" +
            "3. Understand 'best before' vs 'use by' dates\n" +
            "4. Use leftovers creatively or freeze them\n" +
            "5. Compost unavoidable scraps\n" +
            "6. Donate excess food to local food banks",
            "TIPS", admin
        );
        a5.setDifficulty("BEGINNER");
        a5.setThumbnailUrl("https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800");
        educationContentRepository.save(a5);

        EducationContent a6 = new EducationContent(
            "Zero-Waste Living: Intermediate Strategies",
            "Zero-waste is a philosophy that encourages redesigning our relationship with resources so that products are reused, and nothing ends up in a landfill or incinerator.\n\n" +
            "**Bathroom swaps:**\n" +
            "- Bamboo toothbrushes instead of plastic\n" +
            "- Shampoo bars instead of bottled shampoo\n" +
            "- Safety razors with replaceable blades\n" +
            "- Reusable cotton rounds instead of disposable wipes\n\n" +
            "**Kitchen swaps:**\n" +
            "- Beeswax wraps instead of cling film\n" +
            "- Glass or stainless steel containers for storage\n" +
            "- Silicone baking mats instead of parchment paper\n" +
            "- Reusable coffee filters\n\n" +
            "**Shopping habits:**\n" +
            "- Bring your own bags, containers, and produce bags\n" +
            "- Shop at bulk stores and farmers markets\n" +
            "- Choose products with minimal or plastic-free packaging\n\n" +
            "Starting with just one or two swaps makes the journey sustainable.",
            "TIPS", admin
        );
        a6.setDifficulty("INTERMEDIATE");
        a6.setThumbnailUrl("https://images.unsplash.com/photo-1542601906897-ecd432fcfb7d?w=800");
        educationContentRepository.save(a6);
    }
}
