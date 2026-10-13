import { addDays, localIsoDate, weekdayOf } from "./dates";
import type { DB } from "./db";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./demo";
import { hashPasswordSync } from "./passwords";
import { quoteBooking } from "./pricing";
import type { AvailabilityWindow, BookingStatus, GroceryOption } from "./types";

// Demo marketplace: eight chefs in three cities, a handful of customers, and
// bookings spread around today so every screen has something to show.

const CUSTOMERS = [
  { name: DEMO_ACCOUNTS[0].name, email: DEMO_ACCOUNTS[0].email, address: "1204 Maple Ave, Apt 3B" },
  { name: "Taylor Brooks", email: "taylor@prepchef.test", address: "88 Riverside Dr" },
  { name: "Morgan Patel", email: "morgan@prepchef.test", address: "4517 Cedar Ln" },
  { name: "Casey Nguyen", email: "casey@prepchef.test", address: "301 Oak St, Unit 12" },
  { name: "Riley Johnson", email: "riley@prepchef.test", address: "1650 Lakeview Blvd" },
  { name: "Avery Thompson", email: "avery@prepchef.test", address: "92 Hillcrest Rd" },
];
const [JORDAN, TAYLOR, MORGAN, CASEY, RILEY, AVERY] = [0, 1, 2, 3, 4, 5];

interface SeedPackage {
  name: string;
  description: string;
  dishes: number;
  portions: number;
  hours: number;
  price: number;
  groceries: number;
}

interface SeedChef {
  name: string;
  email: string;
  city: string;
  headline: string;
  bio: string;
  years: number;
  cuisines: string[];
  dietary: string[];
  /** [weekdays, "HH:MM" start, "HH:MM" end] */
  hours: [number[], string, string][];
  packages: SeedPackage[];
  reviews: { by: number; rating: number; comment: string; daysAgo: number }[];
}

const CHEFS: SeedChef[] = [
  {
    name: DEMO_ACCOUNTS[1].name,
    email: DEMO_ACCOUNTS[1].email,
    city: "Austin, TX",
    headline: "Bright, family-style Mexican meal prep",
    bio: "I grew up cooking with my abuela in San Antonio and spent a decade on the line in Austin restaurants before going private. My meal preps are built around bold, fresh flavors that still taste great on day four: citrus-marinated proteins, slow-cooked beans, salsas made from scratch and plenty of vegetables.\n\nGluten-free and dairy-free swaps are always on the table.",
    years: 12,
    cuisines: ["Mexican", "Latin American"],
    dietary: ["Gluten-free", "Dairy-free", "High-protein"],
    hours: [
      [[1, 2, 3, 4, 5], "09:00", "17:00"],
      [[0], "10:00", "16:00"],
    ],
    packages: [
      {
        name: "Weekday Essentials",
        description: "Four mains with sides, portioned into individual containers for lunches and dinners.",
        dishes: 4,
        portions: 4,
        hours: 3,
        price: 165,
        groceries: 70,
      },
      {
        name: "Family Fiesta",
        description: "Five family-size dishes plus two fresh salsas, built for households of four or more.",
        dishes: 5,
        portions: 6,
        hours: 4,
        price: 245,
        groceries: 120,
      },
      {
        name: "Taco Night Kit",
        description: "Build-your-own taco and bowl components: two proteins, beans, rice and toppings.",
        dishes: 3,
        portions: 4,
        hours: 2,
        price: 110,
        groceries: 45,
      },
    ],
    reviews: [
      {
        by: TAYLOR,
        rating: 5,
        comment:
          "Maria's chipotle chicken and cilantro-lime rice got us through a brutal work week. The kitchen was cleaner than when she arrived!",
        daysAgo: 12,
      },
      {
        by: MORGAN,
        rating: 5,
        comment:
          "We have a gluten-free kid and a picky teenager. Maria planned a menu both of them loved, and we've already booked again.",
        daysAgo: 33,
      },
      {
        by: CASEY,
        rating: 4,
        comment: "Delicious food and generous portions. She arrived about 15 minutes late but texted ahead.",
        daysAgo: 61,
      },
    ],
  },
  {
    name: "Hiro Tanaka",
    email: "hiro@prepchef.test",
    city: "Seattle, WA",
    headline: "Japanese home cooking with a high-protein twist",
    bio: "Trained in Osaka and Seattle, I focus on clean, balanced meals: miso-glazed salmon, chicken teriyaki bowls, soba salads and vegetable-packed sides. Everything is portioned for easy reheating, and every container is labeled with reheating tips.",
    years: 9,
    cuisines: ["Japanese", "Korean"],
    dietary: ["High-protein", "Dairy-free", "Pescatarian"],
    hours: [[[2, 3, 4, 5, 6], "10:00", "18:00"]],
    packages: [
      {
        name: "Bento Week",
        description: "Bento-style lunches with a protein, a grain and two vegetable sides.",
        dishes: 4,
        portions: 3,
        hours: 3,
        price: 150,
        groceries: 75,
      },
      {
        name: "High-Protein Prep",
        description: "Four protein-forward mains with rice or soba, with macros listed on every label.",
        dishes: 4,
        portions: 5,
        hours: 3.5,
        price: 195,
        groceries: 95,
      },
    ],
    reviews: [
      {
        by: RILEY,
        rating: 5,
        comment:
          "The miso salmon is unreal. Hiro labeled everything with macros, which made my training block so much easier.",
        daysAgo: 8,
      },
      { by: AVERY, rating: 5, comment: "Thoughtful, quiet and efficient. Best soba salad I've had.", daysAgo: 40 },
    ],
  },
  {
    name: "Priya Raman",
    email: "priya@prepchef.test",
    city: "Austin, TX",
    headline: "Plant-forward Indian meals that reheat beautifully",
    bio: "Curries and dals taste even better the next day, which makes Indian food perfect for meal prep. I cook vegetarian and vegan dishes from across India: chana masala, palak paneer (or tofu), lemon rice and roasted vegetable sabzis. Spice levels are tuned to your household.",
    years: 8,
    cuisines: ["Indian"],
    dietary: ["Vegetarian", "Vegan", "Gluten-free", "Nut-free"],
    hours: [[[1, 3, 4, 6], "09:00", "15:00"]],
    packages: [
      {
        name: "Curry Club",
        description: "Four curries or dals with basmati rice and a fresh raita.",
        dishes: 4,
        portions: 4,
        hours: 3,
        price: 140,
        groceries: 55,
      },
      {
        name: "Plant-Powered Week",
        description: "Six vegan dishes with grains and chutneys for a full week of lunches and dinners.",
        dishes: 6,
        portions: 4,
        hours: 4,
        price: 210,
        groceries: 80,
      },
    ],
    reviews: [
      {
        by: JORDAN,
        rating: 5,
        comment: "We've had Priya three times now. Her chana masala has become a staple in our house.",
        daysAgo: 26,
      },
      {
        by: TAYLOR,
        rating: 5,
        comment: "Perfect spice level and so many vegetables. My fridge has never looked this good.",
        daysAgo: 47,
      },
      {
        by: MORGAN,
        rating: 4,
        comment: "Fantastic dal makhani. I'd love a bit more variety in the grains next time.",
        daysAgo: 75,
      },
    ],
  },
  {
    name: "Luca Bianchi",
    email: "luca@prepchef.test",
    city: "Denver, CO",
    headline: "Rustic Italian and Mediterranean weekly menus",
    bio: "Fifteen years in kitchens from Bologna to Denver taught me that simple food, done well, is what people want to come home to. Expect slow-braised ragù, roasted vegetable lasagna, herby farro salads and lemony fish, all portioned and ready for the week.",
    years: 15,
    cuisines: ["Italian", "Mediterranean"],
    dietary: ["Vegetarian", "Pescatarian"],
    hours: [
      [[1, 2, 3, 4], "11:00", "19:00"],
      [[6], "09:00", "15:00"],
    ],
    packages: [
      {
        name: "Trattoria at Home",
        description: "Four Italian classics with seasonal sides.",
        dishes: 4,
        portions: 4,
        hours: 3,
        price: 175,
        groceries: 80,
      },
      {
        name: "Mediterranean Reset",
        description: "Five lighter dishes: grain salads, roasted fish and vegetable mains.",
        dishes: 5,
        portions: 3,
        hours: 3,
        price: 160,
        groceries: 85,
      },
      {
        name: "Pasta Night Starter",
        description: "Two sauces, a baked pasta and a big salad for a cozy week.",
        dishes: 3,
        portions: 4,
        hours: 2,
        price: 105,
        groceries: 40,
      },
    ],
    reviews: [
      { by: CASEY, rating: 5, comment: "The ragù alone was worth it. Luca is a pro and super friendly.", daysAgo: 15 },
      {
        by: AVERY,
        rating: 5,
        comment: "Mediterranean Reset was exactly what I needed after the holidays.",
        daysAgo: 52,
      },
    ],
  },
  {
    name: "Amara Okafor",
    email: "amara@prepchef.test",
    city: "Seattle, WA",
    headline: "West African and Caribbean comfort food, prepped for the week",
    bio: "Jollof rice, suya-spiced chicken, peanut stew, jerk vegetables and plantains: I cook the food I grew up with in Lagos and London, with all the warmth and none of the weeknight effort. All proteins are halal, and most dishes are naturally dairy-free.",
    years: 7,
    cuisines: ["West African", "Caribbean"],
    dietary: ["Halal", "Dairy-free", "Gluten-free"],
    hours: [[[0, 3, 4, 5, 6], "10:00", "18:00"]],
    packages: [
      {
        name: "Comfort Classics",
        description: "Four hearty mains with rice, plantains or greens.",
        dishes: 4,
        portions: 4,
        hours: 3,
        price: 155,
        groceries: 75,
      },
      {
        name: "Spice Route Family",
        description: "Five dishes in family portions, plus a pepper sauce on the side.",
        dishes: 5,
        portions: 6,
        hours: 4,
        price: 235,
        groceries: 125,
      },
    ],
    reviews: [
      {
        by: MORGAN,
        rating: 5,
        comment: "Jollof that tastes like a celebration on a random Tuesday. Amara is wonderful.",
        daysAgo: 19,
      },
      { by: RILEY, rating: 5, comment: "Huge portions, deep flavors. The peanut stew is my new favorite.", daysAgo: 44 },
      { by: TAYLOR, rating: 5, comment: "Every single dish was a hit with my family.", daysAgo: 90 },
    ],
  },
  {
    name: "Sam Carter",
    email: "sam@prepchef.test",
    city: "Denver, CO",
    headline: "Macro-counted meal prep for athletes and busy pros",
    bio: "I'm a former college athlete turned chef, and I cook for marathoners, lifters and anyone who wants to hit their numbers without eating sad chicken. Tell me your macros and I'll build a menu around them: grilled meats, roasted vegetables, smart carbs and sauces that keep things interesting.",
    years: 6,
    cuisines: ["American", "Mediterranean"],
    dietary: ["High-protein", "Keto", "Paleo", "Gluten-free", "Low-carb"],
    hours: [[[1, 2, 3, 4, 5], "06:00", "14:00"]],
    packages: [
      {
        name: "Macro Basics",
        description: "Four macro-balanced meals, weighed and labeled with protein, carbs and fat.",
        dishes: 4,
        portions: 5,
        hours: 3,
        price: 150,
        groceries: 90,
      },
      {
        name: "Athlete Fuel",
        description: "Six high-protein meals portioned for two-a-day training weeks.",
        dishes: 6,
        portions: 5,
        hours: 4.5,
        price: 240,
        groceries: 150,
      },
    ],
    reviews: [
      {
        by: RILEY,
        rating: 5,
        comment: "Stronger in the gym and finally consistent. Sam's macro labels made tracking effortless.",
        daysAgo: 22,
      },
      { by: CASEY, rating: 4, comment: "Great food and very consistent. A little light on sauces for my taste.", daysAgo: 58 },
    ],
  },
  {
    name: "Lina Haddad",
    email: "lina@prepchef.test",
    city: "Austin, TX",
    headline: "Fresh Middle Eastern mezze, grain bowls and stews",
    bio: "I cook the bright, generous food of the Levant: herby tabbouleh, slow-cooked lentil stews, chicken shawarma bowls, roasted cauliflower with tahini and a hummus you'll want by the spoonful. Lots of plant-based options, and everything is halal.",
    years: 10,
    cuisines: ["Middle Eastern", "Mediterranean"],
    dietary: ["Vegetarian", "Vegan", "Halal", "Dairy-free"],
    hours: [[[2, 3, 4, 5, 6], "11:00", "19:00"]],
    packages: [
      {
        name: "Mezze & Mains",
        description: "Three mains plus a mezze spread of dips, salads and pickles.",
        dishes: 5,
        portions: 4,
        hours: 3.5,
        price: 185,
        groceries: 85,
      },
      {
        name: "Plant-Based Levant",
        description: "Four vegan dishes with grains and two dips.",
        dishes: 4,
        portions: 4,
        hours: 3,
        price: 150,
        groceries: 60,
      },
    ],
    reviews: [
      {
        by: AVERY,
        rating: 5,
        comment: "The shawarma bowls were incredible, and the tahini sauce lasted all week.",
        daysAgo: 10,
      },
      { by: MORGAN, rating: 5, comment: "Lina is warm, organized and an amazing cook. Our new go-to.", daysAgo: 36 },
    ],
  },
  {
    name: "Grace Kim",
    email: "grace@prepchef.test",
    city: "Seattle, WA",
    headline: "Korean banchan and rice bowls for busy weeks",
    bio: "Growing up, our fridge was always full of banchan, the little side dishes you mix and match all week. I bring that to your kitchen with bulgogi, gochujang chicken, japchae, seasoned vegetables and quick pickles. Gluten-free tamari is available on request.",
    years: 5,
    cuisines: ["Korean"],
    dietary: ["Gluten-free", "Dairy-free", "Nut-free"],
    hours: [
      [[1, 2, 3], "12:00", "20:00"],
      [[0, 6], "10:00", "16:00"],
    ],
    packages: [
      {
        name: "Banchan Box",
        description: "Six banchan side dishes plus two mains to mix and match.",
        dishes: 8,
        portions: 3,
        hours: 3.5,
        price: 170,
        groceries: 70,
      },
      {
        name: "Bowl Week",
        description: "Rice bowls with protein, vegetables and sauce, portioned for lunches.",
        dishes: 4,
        portions: 4,
        hours: 2.5,
        price: 130,
        groceries: 60,
      },
    ],
    reviews: [
      {
        by: TAYLOR,
        rating: 5,
        comment: "The bulgogi was perfect, and the banchan made every meal feel special.",
        daysAgo: 17,
      },
      { by: JORDAN, rating: 4, comment: "Loved the japchae. Would book again for sure.", daysAgo: 64 },
    ],
  },
];

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

interface SeededChef {
  chefId: number;
  windows: AvailabilityWindow[];
  packages: { id: number; name: string; dishes: number; portions: number; durationMinutes: number; priceCents: number; groceryEstimateCents: number }[];
}

export function seedDemoData(db: DB, now: Date): void {
  const today = localIsoDate(now);
  const passwordHash = hashPasswordSync(DEMO_PASSWORD);

  db.transaction(() => {
    const insertUser = db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)");
    const customerIds = CUSTOMERS.map((customer) =>
      Number(insertUser.run(customer.email, customer.name, passwordHash, "customer").lastInsertRowid),
    );

    const chefs: SeededChef[] = CHEFS.map((chef) => {
      const userId = Number(insertUser.run(chef.email, chef.name, passwordHash, "chef").lastInsertRowid);
      const chefId = Number(
        db
          .prepare(
            `INSERT INTO chefs (user_id, headline, bio, city, years_experience, cuisines, dietary)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(userId, chef.headline, chef.bio, chef.city, chef.years, JSON.stringify(chef.cuisines), JSON.stringify(chef.dietary))
          .lastInsertRowid,
      );

      const windows: AvailabilityWindow[] = chef.hours.flatMap(([weekdays, start, end]) =>
        weekdays.map((weekday) => ({ weekday, startMinute: toMinutes(start), endMinute: toMinutes(end) })),
      );
      for (const window of windows) {
        db.prepare("INSERT INTO availability (chef_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?)").run(
          chefId,
          window.weekday,
          window.startMinute,
          window.endMinute,
        );
      }

      const packages = chef.packages.map((pkg) => {
        const seeded = {
          name: pkg.name,
          dishes: pkg.dishes,
          portions: pkg.portions,
          durationMinutes: Math.round(pkg.hours * 60),
          priceCents: pkg.price * 100,
          groceryEstimateCents: pkg.groceries * 100,
        };
        const id = Number(
          db
            .prepare(
              `INSERT INTO packages (chef_id, name, description, dishes, portions_per_dish, duration_minutes,
                                     price_cents, grocery_estimate_cents)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(chefId, pkg.name, pkg.description, pkg.dishes, pkg.portions, seeded.durationMinutes, seeded.priceCents, seeded.groceryEstimateCents)
            .lastInsertRowid,
        );
        return { id, ...seeded };
      });

      return { chefId, windows, packages };
    });

    // Each chef gets at most one session per day, on a day they work.
    const taken = new Set<string>();
    const pickDate = (chef: SeededChef, offsetDays: number, direction: 1 | -1) => {
      let date = addDays(today, offsetDays);
      for (;;) {
        const works = chef.windows.some((window) => window.weekday === weekdayOf(date));
        const key = `${chef.chefId}:${date}`;
        if (works && !taken.has(key)) {
          taken.add(key);
          return date;
        }
        date = addDays(date, direction);
      }
    };

    const insertBooking = db.prepare(
      `INSERT INTO bookings (
         customer_id, chef_id, package_id, package_name, dishes, portions_per_dish, date, start_minute,
         end_minute, address, groceries, dietary, allergies, notes, chef_fee_cents, grocery_estimate_cents,
         service_fee_cents, total_cents, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const book = (
      chef: SeededChef,
      packageIndex: number,
      customer: number,
      date: string,
      status: BookingStatus,
      details: { groceries?: GroceryOption; dietary?: string[]; allergies?: string; notes?: string } = {},
    ) => {
      const pkg = chef.packages[packageIndex];
      const window = chef.windows.find((w) => w.weekday === weekdayOf(date));
      if (!window) throw new Error(`Seed booking on ${date} falls outside the chef's hours`);
      const groceries = details.groceries ?? "chef";
      const quote = quoteBooking(pkg, groceries);
      const createdAt = `${addDays(date, -6)} 10:15:00`;
      return Number(
        insertBooking.run(
          customerIds[customer],
          chef.chefId,
          pkg.id,
          pkg.name,
          pkg.dishes,
          pkg.portions,
          date,
          window.startMinute,
          window.startMinute + pkg.durationMinutes,
          CUSTOMERS[customer].address,
          groceries,
          JSON.stringify(details.dietary ?? []),
          details.allergies ?? "",
          details.notes ?? "",
          quote.chefFeeCents,
          quote.groceryEstimateCents,
          quote.serviceFeeCents,
          quote.totalCents,
          status,
          createdAt,
          createdAt,
        ).lastInsertRowid,
      );
    };

    // Past sessions, each with the review the customer left.
    const insertReview = db.prepare(
      "INSERT INTO reviews (booking_id, chef_id, customer_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    CHEFS.forEach((seedChef, index) => {
      const chef = chefs[index];
      seedChef.reviews.forEach((review, reviewIndex) => {
        const date = pickDate(chef, -review.daysAgo, -1);
        const packageIndex = reviewIndex % chef.packages.length;
        const bookingId = book(chef, packageIndex, review.by, date, "completed");
        insertReview.run(bookingId, chef.chefId, customerIds[review.by], review.rating, review.comment, `${addDays(date, 1)} 19:30:00`);
      });
    });

    const [maria, , priya, luca, amara] = chefs;

    // The demo customer: one confirmed, one waiting on the chef, one ready to review.
    book(maria, 0, JORDAN, pickDate(maria, 5, 1), "confirmed", {
      dietary: ["Gluten-free"],
      notes: "Gate code is 2580. Please leave the containers on the second fridge shelf.",
    });
    book(amara, 0, JORDAN, pickDate(amara, 10, 1), "pending", {
      groceries: "customer",
      allergies: "Shellfish",
    });
    book(luca, 1, JORDAN, pickDate(luca, -9, -1), "completed");
    book(priya, 1, JORDAN, pickDate(priya, -40, -1), "cancelled");

    // The demo chef: new requests, upcoming sessions and one to mark completed.
    book(maria, 1, TAYLOR, pickDate(maria, 3, 1), "pending", {
      dietary: ["Dairy-free"],
      allergies: "Tree nuts",
      notes: "Two adults and two kids (8 and 11). Mild spice, please!",
    });
    book(maria, 2, RILEY, pickDate(maria, 8, 1), "pending", {
      groceries: "customer",
      dietary: ["High-protein"],
      notes: "Training for a marathon, so extra rice is welcome.",
    });
    book(maria, 0, CASEY, pickDate(maria, 12, 1), "confirmed");
    book(maria, 0, MORGAN, pickDate(maria, -1, -1), "confirmed", { dietary: ["Gluten-free"] });
    book(maria, 1, AVERY, pickDate(maria, -20, -1), "declined");
  })();
}
