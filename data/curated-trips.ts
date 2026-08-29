type CuratedStop = {
  time: string;
  title: string;
  area: string;
  notes: string;
  mapQuery: string;
};

type CuratedDay = {
  day: number;
  theme: string;
  stops: CuratedStop[];
};

export type CuratedTrip = {
  slug: string;
  title: string;
  destination: string;
  budget: string;
  start_date: null;
  end_date: null;
  generated_plan: {
    input: {
      destination: string;
      days: number;
      people: "family";
      budget: "budget" | "mid";
      interests: string[];
    };
    seo: {
      seoTitle: string;
      seoDescription: string;
      h1: string;
      introParagraph: string;
      overviewBullets: string[];
    };
    itinerary: CuratedDay[];
  };
};

export const CURATED_TRIPS: CuratedTrip[] = [
  {
    slug: "singapore-3-day-family-budget-itinerary",
    title: "Singapore 3 Day Family Itinerary",
    destination: "Singapore",
    budget: "Budget-friendly",
    start_date: null,
    end_date: null,
    generated_plan: {
      input: {
        destination: "Singapore",
        days: 3,
        people: "family",
        budget: "budget",
        interests: ["Food", "Family attractions", "City sights"],
      },
      seo: {
        seoTitle: "Singapore 3 Day Family Itinerary (2026) | Itenora",
        seoDescription:
          "A practical 3 day Singapore family itinerary covering Marina Bay, wildlife parks, Sentosa and local food, with easy daily routes.",
        h1: "Singapore 3 Day Family Itinerary (2026)",
        introParagraph:
          "This three-day Singapore plan balances famous attractions, child-friendly experiences and affordable local food without making each day feel rushed.",
        overviewBullets: [
          "Day 1 keeps Marina Bay sights together to reduce travel time.",
          "Day 2 focuses on Singapore's wildlife parks in the Mandai area.",
          "Day 3 combines Sentosa attractions, the beach and an easy dinner stop.",
          "Use MRT and public buses for the most budget-friendly transport.",
        ],
      },
      itinerary: [
        {
          day: 1,
          theme: "Marina Bay icons and hawker food",
          stops: [
            {
              time: "09:00",
              title: "Merlion Park and Marina Bay waterfront",
              area: "Marina Bay",
              notes:
                "Start early for cooler weather and family photos, then follow the waterfront towards the gardens.",
              mapQuery: "Merlion Park Singapore",
            },
            {
              time: "11:00",
              title: "Gardens by the Bay",
              area: "Marina Bay",
              notes:
                "Explore the outdoor gardens for free or add the Cloud Forest and Flower Dome if they suit your budget.",
              mapQuery: "Gardens by the Bay Singapore",
            },
            {
              time: "16:30",
              title: "Supertree Grove",
              area: "Marina Bay",
              notes:
                "Take a relaxed break before the evening light show. Check the current show time before visiting.",
              mapQuery: "Supertree Grove Singapore",
            },
            {
              time: "19:00",
              title: "Dinner at Lau Pa Sat",
              area: "Downtown Core",
              notes:
                "Choose dishes from several stalls so the family can share and try different Singapore favourites.",
              mapQuery: "Lau Pa Sat Singapore",
            },
          ],
        },
        {
          day: 2,
          theme: "Wildlife day at Mandai",
          stops: [
            {
              time: "09:00",
              title: "Singapore Zoo",
              area: "Mandai",
              notes:
                "Arrive near opening time and prioritise the exhibits your children most want to see.",
              mapQuery: "Singapore Zoo",
            },
            {
              time: "14:30",
              title: "River Wonders",
              area: "Mandai",
              notes:
                "A convenient second attraction next to the zoo with shaded areas and family-friendly exhibits.",
              mapQuery: "River Wonders Singapore",
            },
            {
              time: "18:00",
              title: "Early dinner and rest",
              area: "Mandai",
              notes:
                "Have an early meal and allow some quiet time before the evening attraction.",
              mapQuery: "Mandai Wildlife West Singapore",
            },
            {
              time: "19:15",
              title: "Night Safari",
              area: "Mandai",
              notes:
                "Book a suitable entry time in advance and use the tram first if younger children are tired.",
              mapQuery: "Night Safari Singapore",
            },
          ],
        },
        {
          day: 3,
          theme: "Sentosa attractions and beach time",
          stops: [
            {
              time: "09:00",
              title: "Universal Studios Singapore",
              area: "Sentosa",
              notes:
                "Arrive before opening and begin with the family's highest-priority rides and shows.",
              mapQuery: "Universal Studios Singapore",
            },
            {
              time: "16:30",
              title: "Palawan Beach",
              area: "Sentosa",
              notes:
                "Slow the pace with beach time after the theme park. Bring sun protection and water.",
              mapQuery: "Palawan Beach Singapore",
            },
            {
              time: "18:30",
              title: "VivoCity dinner",
              area: "HarbourFront",
              notes:
                "Return towards the city and choose from the broad range of family-friendly dining options.",
              mapQuery: "VivoCity Singapore",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "tokyo-7-day-family-itinerary",
    title: "Tokyo 7 Day Family Itinerary",
    destination: "Tokyo, Japan",
    budget: "Mid-range",
    start_date: null,
    end_date: null,
    generated_plan: {
      input: {
        destination: "Tokyo, Japan",
        days: 7,
        people: "family",
        budget: "mid",
        interests: ["Anime", "Food", "Family attractions"],
      },
      seo: {
        seoTitle: "Tokyo 7 Day Family Itinerary (2026) | Itenora",
        seoDescription:
          "A practical 7 day Tokyo family itinerary covering Asakusa, Akihabara, Shibuya, Disney, teamLab, Shinjuku and central Tokyo.",
        h1: "Tokyo 7 Day Family Itinerary (2026)",
        introParagraph:
          "This seven-day Tokyo itinerary groups nearby neighbourhoods together and mixes iconic sights, anime shopping, food experiences and child-friendly attractions.",
        overviewBullets: [
          "Each day focuses on one part of Tokyo to avoid unnecessary train changes.",
          "The pace leaves room for meals, queues and breaks with children.",
          "Reserve Disney, teamLab, Ghibli and observation attractions ahead of time.",
          "Use an IC transport card for easy train and convenience-store payments.",
        ],
      },
      itinerary: [
        {
          day: 1,
          theme: "Traditional Tokyo and skyline views",
          stops: [
            {
              time: "09:00",
              title: "Senso-ji Temple",
              area: "Asakusa",
              notes:
                "Visit early before the busiest period, then explore the temple grounds at a relaxed pace.",
              mapQuery: "Senso-ji Temple Tokyo",
            },
            {
              time: "10:30",
              title: "Nakamise Shopping Street",
              area: "Asakusa",
              notes:
                "Browse traditional snacks and small souvenirs while walking back from the temple.",
              mapQuery: "Nakamise Shopping Street Tokyo",
            },
            {
              time: "14:00",
              title: "Tokyo Skytree observation deck",
              area: "Oshiage",
              notes:
                "Choose a timed ticket and allow extra time for the shopping and dining complex below.",
              mapQuery: "Tokyo Skytree",
            },
            {
              time: "17:30",
              title: "Sumida Park riverside walk",
              area: "Asakusa",
              notes:
                "Finish with an easy walk and views across the river before dinner.",
              mapQuery: "Sumida Park Tokyo",
            },
          ],
        },
        {
          day: 2,
          theme: "Ueno culture and Akihabara anime",
          stops: [
            {
              time: "09:00",
              title: "Ueno Park",
              area: "Ueno",
              notes:
                "Start with open space and choose one museum rather than trying to visit everything.",
              mapQuery: "Ueno Park Tokyo",
            },
            {
              time: "10:30",
              title: "Tokyo National Museum",
              area: "Ueno",
              notes:
                "Focus on selected galleries to keep the visit manageable for younger travellers.",
              mapQuery: "Tokyo National Museum",
            },
            {
              time: "13:30",
              title: "Ameyoko Market",
              area: "Ueno",
              notes:
                "Stop for an informal lunch and browse the lively market streets.",
              mapQuery: "Ameyoko Market Tokyo",
            },
            {
              time: "15:30",
              title: "Akihabara anime and gaming district",
              area: "Akihabara",
              notes:
                "Pick a few priority stores and set a family meeting point before exploring larger buildings.",
              mapQuery: "Akihabara Electric Town Tokyo",
            },
          ],
        },
        {
          day: 3,
          theme: "Harajuku and Shibuya",
          stops: [
            {
              time: "09:00",
              title: "Meiji Shrine",
              area: "Harajuku",
              notes:
                "Enjoy the shaded forest path before the shopping streets become busy.",
              mapQuery: "Meiji Shrine Tokyo",
            },
            {
              time: "11:00",
              title: "Takeshita Street",
              area: "Harajuku",
              notes:
                "Browse colourful shops and share a snack, but expect crowds around lunchtime.",
              mapQuery: "Takeshita Street Tokyo",
            },
            {
              time: "14:30",
              title: "Shibuya Crossing and Hachiko",
              area: "Shibuya",
              notes:
                "See the crossing from street level and allow time for nearby shops and cafés.",
              mapQuery: "Shibuya Crossing Tokyo",
            },
            {
              time: "17:30",
              title: "Shibuya Sky observation deck",
              area: "Shibuya",
              notes:
                "Book a sunset time well ahead and arrive early enough for the timed entry.",
              mapQuery: "Shibuya Sky Tokyo",
            },
          ],
        },
        {
          day: 4,
          theme: "Tokyo Disney day",
          stops: [
            {
              time: "08:00",
              title: "Tokyo Disneyland",
              area: "Maihama",
              notes:
                "Allow a full day. Confirm opening hours, tickets and the current priority-pass system before travelling.",
              mapQuery: "Tokyo Disneyland",
            },
            {
              time: "19:30",
              title: "Ikspiari dinner",
              area: "Maihama",
              notes:
                "Choose an easy dinner outside the park before returning to your hotel.",
              mapQuery: "Ikspiari Maihama",
            },
          ],
        },
        {
          day: 5,
          theme: "Toyosu and Odaiba",
          stops: [
            {
              time: "09:00",
              title: "teamLab Planets Tokyo",
              area: "Toyosu",
              notes:
                "Book a timed entry and check clothing and footwear guidance before your visit.",
              mapQuery: "teamLab Planets Tokyo",
            },
            {
              time: "11:30",
              title: "Toyosu Market lunch",
              area: "Toyosu",
              notes:
                "Have an early lunch and choose a restaurant with a shorter queue if travelling with children.",
              mapQuery: "Toyosu Market Tokyo",
            },
            {
              time: "14:00",
              title: "Odaiba Seaside Park",
              area: "Odaiba",
              notes:
                "Take a waterfront break with Rainbow Bridge views before shopping.",
              mapQuery: "Odaiba Seaside Park Tokyo",
            },
            {
              time: "16:00",
              title: "DiverCity Tokyo Plaza",
              area: "Odaiba",
              notes:
                "See the life-size Unicorn Gundam and browse the family-friendly shopping centre.",
              mapQuery: "DiverCity Tokyo Plaza",
            },
          ],
        },
        {
          day: 6,
          theme: "Ghibli and Shinjuku",
          stops: [
            {
              time: "10:00",
              title: "Ghibli Museum",
              area: "Mitaka",
              notes:
                "Tickets are advance-only and can sell out. Allow travel time from central Tokyo.",
              mapQuery: "Ghibli Museum Mitaka",
            },
            {
              time: "14:00",
              title: "Shinjuku Gyoen National Garden",
              area: "Shinjuku",
              notes:
                "Use the gardens as a calm afternoon break after the museum journey.",
              mapQuery: "Shinjuku Gyoen National Garden",
            },
            {
              time: "16:30",
              title: "Tokyo Metropolitan Government Building observation deck",
              area: "Shinjuku",
              notes:
                "Check current opening information for this free city viewpoint.",
              mapQuery: "Tokyo Metropolitan Government Building observation deck",
            },
            {
              time: "18:30",
              title: "Omoide Yokocho area",
              area: "Shinjuku",
              notes:
                "Walk through for the atmosphere, then choose a more spacious nearby restaurant for a family dinner.",
              mapQuery: "Omoide Yokocho Tokyo",
            },
          ],
        },
        {
          day: 7,
          theme: "Markets, Ginza and Tokyo Station",
          stops: [
            {
              time: "09:00",
              title: "Tsukiji Outer Market",
              area: "Tsukiji",
              notes:
                "Arrive hungry, share small dishes and keep pathways clear in the busy market.",
              mapQuery: "Tsukiji Outer Market Tokyo",
            },
            {
              time: "11:30",
              title: "Ginza",
              area: "Ginza",
              notes:
                "Browse flagship shops or visit a department-store food hall for lunch options.",
              mapQuery: "Ginza Tokyo",
            },
            {
              time: "14:30",
              title: "Imperial Palace East Gardens",
              area: "Marunouchi",
              notes:
                "Check closure days, then enjoy an easy outdoor walk close to Tokyo Station.",
              mapQuery: "Imperial Palace East Gardens Tokyo",
            },
            {
              time: "16:30",
              title: "Tokyo Character Street",
              area: "Tokyo Station",
              notes:
                "Finish with character shops and an early dinner before preparing for departure.",
              mapQuery: "Tokyo Character Street",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "sydney-3-day-family-budget-itinerary",
    title: "Sydney 3 Day Family Itinerary",
    destination: "Sydney, Australia",
    budget: "Budget-friendly",
    start_date: null,
    end_date: null,
    generated_plan: {
      input: {
        destination: "Sydney, Australia",
        days: 3,
        people: "family",
        budget: "budget",
        interests: ["Harbour sights", "Beaches", "Family attractions"],
      },
      seo: {
        seoTitle: "Sydney 3 Day Family Itinerary (2026) | Itenora",
        seoDescription:
          "A practical 3 day Sydney family itinerary covering Circular Quay, Darling Harbour, Bondi Beach and easy city highlights.",
        h1: "Sydney 3 Day Family Itinerary (2026)",
        introParagraph:
          "This three-day Sydney itinerary combines famous harbour sights, family attractions and beach time while grouping nearby stops into sensible daily routes.",
        overviewBullets: [
          "Day 1 covers Circular Quay, the Opera House and The Rocks on foot.",
          "Day 2 keeps Darling Harbour's family attractions together.",
          "Day 3 adds Bondi Beach, a coastal walk and a final city viewpoint.",
          "Use ferries and public transport as part of the sightseeing experience.",
        ],
      },
      itinerary: [
        {
          day: 1,
          theme: "Sydney Harbour icons",
          stops: [
            {
              time: "09:00",
              title: "Sydney Opera House and Circular Quay",
              area: "Circular Quay",
              notes:
                "Start with the harbour icons before the promenade becomes busy, then continue on foot.",
              mapQuery: "Sydney Opera House",
            },
            {
              time: "10:30",
              title: "Royal Botanic Garden",
              area: "Sydney CBD",
              notes:
                "Enjoy a free garden walk and harbour viewpoints with plenty of room for children.",
              mapQuery: "Royal Botanic Garden Sydney",
            },
            {
              time: "14:00",
              title: "The Rocks",
              area: "The Rocks",
              notes:
                "Explore the historic lanes and check whether the weekend market is operating.",
              mapQuery: "The Rocks Sydney",
            },
            {
              time: "16:00",
              title: "Sydney Harbour cruise or ferry ride",
              area: "Circular Quay",
              notes:
                "Choose a harbour cruise or use a public ferry for a lower-cost water view of the city.",
              mapQuery: "Circular Quay ferry wharf Sydney",
            },
          ],
        },
        {
          day: 2,
          theme: "Darling Harbour family attractions",
          stops: [
            {
              time: "09:30",
              title: "SEA LIFE Sydney Aquarium",
              area: "Darling Harbour",
              notes:
                "Arrive near opening time and allow around two hours for a comfortable family visit.",
              mapQuery: "SEA LIFE Sydney Aquarium",
            },
            {
              time: "12:00",
              title: "Darling Harbour lunch",
              area: "Darling Harbour",
              notes:
                "Pick a quick lunch and leave time for the playground and waterfront areas.",
              mapQuery: "Darling Harbour Sydney",
            },
            {
              time: "14:00",
              title: "WILD LIFE Sydney Zoo",
              area: "Darling Harbour",
              notes:
                "A compact indoor option that introduces Australian animals without a long journey from the city.",
              mapQuery: "WILD LIFE Sydney Zoo",
            },
            {
              time: "16:30",
              title: "Barangaroo Reserve",
              area: "Barangaroo",
              notes:
                "Finish with a free harbour walk and open space before dinner.",
              mapQuery: "Barangaroo Reserve Sydney",
            },
          ],
        },
        {
          day: 3,
          theme: "Bondi coast and city views",
          stops: [
            {
              time: "09:00",
              title: "Bondi Beach",
              area: "Bondi",
              notes:
                "Visit early, stay between the flags if swimming and use strong sun protection.",
              mapQuery: "Bondi Beach Sydney",
            },
            {
              time: "10:30",
              title: "Bondi to Coogee coastal walk",
              area: "Bondi",
              notes:
                "Walk only a comfortable section with younger children, then return by bus if needed.",
              mapQuery: "Bondi to Coogee Coastal Walk",
            },
            {
              time: "14:30",
              title: "Paddington and Oxford Street",
              area: "Paddington",
              notes:
                "Pause for lunch and browse the neighbourhood before returning to the city centre.",
              mapQuery: "Paddington Sydney",
            },
            {
              time: "17:00",
              title: "Sydney Tower Eye observation deck",
              area: "Sydney CBD",
              notes:
                "Finish with a city panorama and allow extra time around sunset or during school holidays.",
              mapQuery: "Sydney Tower Eye",
            },
          ],
        },
      ],
    },
  },
];

export const CURATED_TRIP_SLUGS = CURATED_TRIPS.map((trip) => trip.slug);

export function getCuratedTripBySlug(slug: string) {
  return CURATED_TRIPS.find((trip) => trip.slug === slug) ?? null;
}
