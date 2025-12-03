// Restaurant Information for Chatbot Training

export interface RestaurantInfo {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  specialHours?: {
    date: string;
    hours: string;
    note: string;
  }[];
  deliveryInfo: {
    available: boolean;
    minimumOrder: number;
    deliveryFee: number;
    estimatedTime: string;
    deliveryRadius: string;
  };
  pickupInfo: {
    available: boolean;
    estimatedTime: string;
  };
  policies: {
    cancellation: string;
    refund: string;
    allergies: string;
  };
}

export const restaurantInfo: RestaurantInfo = {
  name: "Aru Sushi",
  description: "Authentic Japanese cuisine featuring fresh sushi, sashimi, and traditional dishes. We pride ourselves on using the highest quality ingredients and traditional preparation methods.",
  phone: "(555) 123-4567",
  email: "info@arusushi.com",
  address: {
    street: "123 Main Street",
    city: "Your City",
    state: "ST",
    zip: "12345"
  },
  hours: {
    monday: "11:00 AM - 9:00 PM",
    tuesday: "11:00 AM - 9:00 PM",
    wednesday: "11:00 AM - 9:00 PM",
    thursday: "11:00 AM - 9:00 PM",
    friday: "11:00 AM - 10:00 PM",
    saturday: "12:00 PM - 10:00 PM",
    sunday: "12:00 PM - 9:00 PM"
  },
  specialHours: [
    {
      date: "2024-12-25",
      hours: "Closed",
      note: "Christmas Day"
    },
    {
      date: "2024-12-31",
      hours: "11:00 AM - 6:00 PM",
      note: "New Year's Eve"
    }
  ],
  deliveryInfo: {
    available: true,
    minimumOrder: 15,
    deliveryFee: 5,
    estimatedTime: "45-60 minutes",
    deliveryRadius: "5 miles"
  },
  pickupInfo: {
    available: true,
    estimatedTime: "20-30 minutes"
  },
  policies: {
    cancellation: "Orders can be cancelled within 5 minutes of placement for a full refund. After 5 minutes, cancellations are subject to a 20% processing fee.",
    refund: "We offer full refunds for incorrect orders or quality issues. Please contact us within 24 hours of delivery.",
    allergies: "Please inform us of any allergies or dietary restrictions. While we take precautions, we cannot guarantee that cross-contamination will not occur."
  }
};

// Popular items that the chatbot can recommend
export const popularItems = [
  {
    name: "California Roll",
    category: "Basic Rolls",
    reason: "Customer favorite, great for sushi beginners"
  },
  {
    name: "Spicy Tuna Roll",
    category: "House Special Rolls",
    reason: "Most ordered roll, perfect balance of flavor and heat"
  },
  {
    name: "Rainbow Roll",
    category: "House Special Rolls",
    reason: "Beautiful presentation, variety of fresh fish"
  },
  {
    name: "Salmon Sashimi",
    category: "Sashimi",
    reason: "Freshest cuts, highly rated by customers"
  },
  {
    name: "Chirashi Bowl",
    category: "Rice Bowls",
    reason: "Great value, assorted fresh sashimi over rice"
  },
  {
    name: "Dragon Roll",
    category: "House Special Rolls",
    reason: "Signature item, eel and avocado perfection"
  },
  {
    name: "Tempura Udon",
    category: "Udon/Noodles",
    reason: "Comfort food favorite, hearty and satisfying"
  },
  {
    name: "Lunch Sushi Combo",
    category: "Combinations",
    reason: "Best lunch value, includes variety"
  }
];

// Menu item suggestions by preference
export const menuSuggestions = {
  beginner: [
    "California Roll",
    "Chicken Teriyaki",
    "Tempura Shrimp",
    "Gyoza",
    "Edamame"
  ],
  adventurous: [
    "Uni (Sea Urchin)",
    "Octopus Sashimi",
    "Spicy Tuna Tartare",
    "Chirashi Bowl",
    "Sashimi Boat"
  ],
  vegetarian: [
    "Avocado Roll",
    "Cucumber Roll",
    "Vegetable Tempura",
    "Edamame",
    "Seaweed Salad",
    "Miso Soup"
  ],
  spicy: [
    "Spicy Tuna Roll",
    "Spicy Salmon Roll",
    "Volcano Roll",
    "Spicy Edamame"
  ],
  cooked: [
    "California Roll",
    "Shrimp Tempura Roll",
    "Chicken Teriyaki",
    "Beef Teriyaki",
    "Eel Avocado Roll",
    "Tempura Udon"
  ],
  valueMeal: [
    "Lunch Sushi Combo",
    "Lunch Sashimi Combo",
    "Chirashi Bowl",
    "Dinner Combination A",
    "Roll Combination"
  ]
};
