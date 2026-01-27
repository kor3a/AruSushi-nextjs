export interface MenuItemOption {
  label: string;
  name: string;
  required: boolean;
  choices: string[];
  choicePrices?: { [key: string]: number };
}

export interface MenuItemData {
  name: string;
  price: number;
  description?: string;
  options?: MenuItemOption[];
}

export interface MenuCategory {
  category: string;
  image: string;
  items: MenuItemData[];
}

export const lunchMenu: MenuCategory[] = [
  {
    category: 'Lunch Combination',
    image: '/img/bento.png',
    items: [
      {
        name: 'Lunch Bento Special: Choice of 2 Items below',
        price: 19.95,
        description:
          '*Served with miso soup, rice, and salad. (1st choice: Chicken Teriyaki, Beef Teriyaki, Chicken Cutlet, Spicy Sesame Chicken, Salmon Teriyaki, Shrimp & Veggie Tempura) (2nd choice: Sashimi, Sushi, California roll, Spicy Albacore Roll)',
        options: [
          {
            label: '1st Choice',
            name: 'firstChoice',
            required: true,
            choices: [
              'Chicken Teriyaki',
              'Beef Teriyaki',
              'Chicken Cutlet',
              'Spicy Sesame Chicken',
              'Salmon Teriyaki',
              'Shrimp & Veggie Tempura'
            ]
          },
          {
            label: '2nd Choice',
            name: 'secondChoice',
            required: true,
            choices: [
              'Sashimi',
              'Sushi',
              'California Roll',
              'Spicy Albacore Roll'
            ]
          }
        ]
      },
      {
        name: 'Special Combination',
        price: 24.95,
        description:
          "5pcs sushi of Chef's choice & customer's choice of 1 roll (911 roll, Alaskan roll, Aloha roll, Caterpillar roll, Crunchy roll, Dragon roll, Fire Cracker roll, Shrimp roll, Baked Salmon roll, Rainbow roll, Red Dragon roll)",
        options: [
          {
            label: 'Choice',
            name: 'Roll Choice',
            required: true,
            choices: [
              '911 roll',
              'Alaskan roll',
              'Aloha roll',
              'Caterpillar roll',
              'Crunchy roll',
              'Dragon roll',
              'Fire Cracker roll',
              'Shrimp roll',
              'Baked Salmon roll',
              'Rainbow roll',
              'Red Dragon roll',
            ]
          },
        ]
      },
      {
        name: 'Choose Any 2 Different Items',
        price: 21.95,
        description:
          'Beef Teriyaki, Chicken Teriyaki, Salmon Teriyaki, Spicy Pork, Shrimp & Vegetable Tempura, Gyoza, Chicken Cutlet, California & Spicy Tuna roll, Sushi 5pcs',
        options: [
          {
            label: '1st Choice',
            name: 'firstChoice',
            required: true,
            choices: [
              'Chicken Teriyaki',
              'Beef Teriyaki',
              'Chicken Cutlet',
              'Spicy Pork',
              'Salmon Teriyaki',
              'Shrimp & Veggie Tempura',
              'Gyoza',
              'California & Spicy Tuna roll',
              'Sushi 5pcs'
            ]
          },
          {
            label: '2nd Choice',
            name: 'secondChoice',
            required: true,
            choices: [
              'Chicken Teriyaki',
              'Beef Teriyaki',
              'Chicken Cutlet',
              'Spicy Pork',
              'Salmon Teriyaki',
              'Shrimp & Veggie Tempura',
              'Gyoza',
              'California & Spicy Tuna roll',
              'Sushi 5pcs'
            ]
          }
        ]
      },
      {
        name: 'Choose Any 3 Different Items',
        price: 26.95,
        description:
          'Beef Teriyaki, Chicken Teriyaki, Salmon Teriyaki, Spicy Pork, Shrimp & Vegetable Tempura, Gyoza, Chicken Cutlet, California & Spicy Tuna roll, Sushi 5pcs',
        options: [
          {
            label: '1st Choice',
            name: 'firstChoice',
            required: true,
            choices: [
              'Chicken Teriyaki',
              'Beef Teriyaki',
              'Chicken Cutlet',
              'Spicy Pork',
              'Salmon Teriyaki',
              'Shrimp & Veggie Tempura',
              'Gyoza',
              'California & Spicy Tuna roll',
              'Sushi 5pcs'
            ]
          },
          {
            label: '2nd Choice',
            name: 'secondChoice',
            required: true,
            choices: [
              'Chicken Teriyaki',
              'Beef Teriyaki',
              'Chicken Cutlet',
              'Spicy Pork',
              'Salmon Teriyaki',
              'Shrimp & Veggie Tempura',
              'Gyoza',
              'California & Spicy Tuna roll',
              'Sushi 5pcs'
            ]
          },
          {
            label: '3rd Choice',
            name: 'thirdChoice',
            required: true,
            choices: [
              'Chicken Teriyaki',
              'Beef Teriyaki',
              'Chicken Cutlet',
              'Spicy Pork',
              'Salmon Teriyaki',
              'Shrimp & Veggie Tempura',
              'Gyoza',
              'California & Spicy Tuna roll',
              'Sushi 5pcs'
            ]
          },
        ]
      },
    ],
  },
  {
    category: 'Salads',
    image: '/img/Salads.png',
    items: [
      {
        name: 'Sashimi Salad',
        price: 21.95,
        description: 'Assorted fish with mixed salad and ginger dressing'
      },
    ],
  },
  {
    category: 'A La Carte',
    image: '/img/carte.png',
    items: [
      { name: 'Sashimi Combination', price: 29.50 },
      {
        name: 'Fried Rice',
        price: 15.95,
        description: 'Chicken, shrimp, and vegetables'
      },
    ],
  },
  {
    category: 'Udon/Noodles',
    image: '/img/Noodles.png',
    items: [
      {
        name: 'Udon with choice of one item below',
        price: 19.95,
        description: 'Roll (California or Spicy tuna) or Shrimp & Vegetable Tempura'
      },
      {
        name: 'Ramen',
        price: 13.50,
        description: 'Mild or Spicy Korean style ramen noodle (Add-ons: ham(+$1.50), cheese(+$1.00), egg(+$1.00), rice cake(+$1.00))'
      },
    ],
  },
  {
    category: 'Rice Bowls',
    image: '/img/Rice_bowl.png',
    items: [
      {
        name: 'Bulgogi Bowl',
        price: 19.95,
        description: 'Korean marinated beef bulgogi & vegetables over rice'
      },
      {
        name: 'Chicken Bowl',
        price: 15.95,
        description: 'Marinated chicken & vegetables over rice'
      },
      {
        name: 'Katsu Don',
        price: 17.95,
        description: 'Pork cutlet with sauteed vegetables and egg over rice'
      },
      {
        name: 'Unagi Don',
        price: 25.95,
        description: 'Broiled eel served over rice'
      },
      {
        name: 'Chirashi Sushi',
        price: 27.5,
        description: 'A variety of sashimi over sushi rice'
      },
    ],
  },
];

export const dinnerMenu: MenuCategory[] = [
  {
    category: 'Appetizers',
    image: '/img/Appetizer.png',
    items: [
      {
        name: 'Gyoza',
        price: 8.95,
        description: 'Fried ground shrimp or chicken wrapped in wonton'
      },
      {
        name: 'Agedashi Tofu',
        price: 7.5,
        description: 'Deep fried tofu served with ponzu sauce'
      },
      {
        name: 'Yakitori',
        price: 7.95,
        description: 'Charbroiled skewered chicken, served with teriyaki sauce on top'
      },
      { name: 'Fried Calamari', price: 8.5 },
      {
        name: 'Soft Shell Crab',
        price: 11.95,
        description: 'Deep fried soft shell crab'
      },
      { name: 'Baked Yellowtail Collar', price: 13.95 },
      { name: 'Baked Salmon Collar', price: 11.95 },
      { name: 'Edamame', price: 5.95 },
      { name: 'Garlic Edamame', price: 7.95 },
      { name: 'Spicy Edamame', price: 7.95 },
      {
        name: 'Baked Green Mussels',
        price: 9.95,
        description: 'Baked green mussels with spicy mayo, eel sauce on top'
      },
      {
        name: 'Half Shell Oyster',
        price: 16.95,
        description: '6 pieces of oyster with green onions, spicy & ponzu sauce'
      },
      { name: 'Egg Roll', price: 7.95 },
      {
        name: 'Monkey Brain',
        price: 8.95,
        description: 'Deep fried -- spicy crabmeat, cream cheese, mushroom inside with mayo and eel sauce on top'
      },
      {
        name: 'Oyster Shooter',
        price: 9.5,
        description: 'Oyster with sake, masago, spicy ponzu sauce'
      },
      {
        name: 'Uni Shooter',
        price: 12.95,
        description: 'Uni with sake, masago, spicy ponzu sauce'
      },
      {
        name: 'Dynamite',
        price: 10.5,
        description: 'Baked -- Crabmeat, mixed vegetable, baby crawfish and scallop with eel & mayo sauce on top'
      },
      { name: 'Shrimp & Vegetable Tempura', price: 12.5 },
      {
        name: 'Heart Attack',
        price: 10.95,
        description: 'Fried jalapeños stuffed with cream cheese, spicy tuna inside with eel and mayo sauce'
      },
    ],
  },
  {
    category: 'Salads',
    image: '/img/Salads.png',
    items: [
      {
        name: 'Garden Salad',
        price: 6.5,
        description: 'Spring mixed salad served with house dressing'
      },
      {
        name: 'Seaweed Salad',
        price: 9.95,
        description: 'Seasoned seaweed salad'
      },
      {
        name: 'Sashimi Salad',
        price: 19.95,
        description: 'Assorted fish with mixed salad and ginger dressing'
      },
      {
        name: 'Poki Salad',
        price: 17.95,
        description: 'Japanese style tuna salad - mild to medium spicy'
      },
      {
        name: 'Tako Salad',
        price: 11.5,
        description: 'Marinated octopus with mixed salad'
      },
      {
        name: 'Cucumber Salad',
        price: 6.95,
        description: 'Cucumber vinaigrette with stick crab on top'
      },
    ],
  },
  {
    category: 'House Special Rolls',
    image: '/img/Rolls1.png',
    items: [
      {
        name: 'Aloha Roll',
        price: 15.95,
        description: 'Spicy tuna and cucumber inside and tuna, ponzu sauce on top'
      },
      {
        name: 'Super Volcano Roll',
        price: 17.5,
        description: 'Baked -- California roll with salmon & spicy tuna on top. Baked with eel sauce on top'
      },
      {
        name: 'Spider Roll',
        price: 15.95,
        description: 'Crabmeat, soft shell crab, avocado, gobo, sprout radish and eel sauce'
      },
      {
        name: 'Baked Salmon Roll',
        price: 14.95,
        description: 'Baked -- California roll with baked salmon on top. Eel sauce on top'
      },
      {
        name: 'Caterpillar Roll',
        price: 15.95,
        description: 'Eel, crabmeat inside with avocado & eel sauce on top'
      },
      {
        name: 'Shrimp Killer Roll',
        price: 15.95,
        description: 'Inside: Crabmeat, cucumber, shrimp tempura;  Outside: Ebi shrimp, avocado on top with eel sauce, spicy mayo sauce'
      },
      {
        name: 'Baked Dynamite Roll',
        price: 15.95,
        description: 'Baked -- California roll with crabmeat, scallop, vegetable mix on top. Eel sauce on top'
      },
      {
        name: 'Rainbow Roll',
        price: 15.95,
        description: 'A House Favorite! California roll wrapped with assorted pieces of fish and avocado on top'
      },
      {
        name: 'OMG Roll',
        price: 18.5,
        description: 'Inside: Shrimp tempura, crabmeat, cucumber;  Outside: Fried crawfish, masago, avocado with eel sauce on top'
      },
      {
        name: 'Japanese Lasagña',
        price: 14.95,
        description: 'Baked -- California roll with baked cream cheese and eel sauce on top'
      },
      {
        name: 'Alaskan Roll',
        price: 15.5,
        description: 'California roll with asparagus inside and fresh salmon on top. No sauce'
      },
      {
        name: 'Sunshine Roll',
        price: 15.5,
        description: 'California roll topped with assorted fish marinated in house spicy sauce'
      },
      {
        name: 'Drunken Tiger Roll',
        price: 16.95,
        description: 'Baked -- Inside: Spicy tuna, albacore;  Outside: Salmon, eel sauce, spicy mayo on top'
      },
      {
        name: 'Philadelphia Roll',
        price: 16.95,
        description: 'Inside: Salmon, cream cheese, asparagus, avocado;  Outside: Salmon, masago, and mustard sauce'
      },
      {
        name: '911 Roll',
        price: 16.95,
        description: 'Baked -- Inside: Spicy tuna, albacore;  Outside: Salmon, eel sauce, spicy mayo on top'
      },
      {
        name: 'Green Salmon Roll',
        price: 14.5,
        description: 'No rice roll. Salmon, asparagus, radish beets, avocado, gobo, sprouts inside wrapped with cucumber. Ginger sauce on top'
      },
      {
        name: 'Red Dragon Roll',
        price: 15.95,
        description: 'Crabmeat and eel inside, topped with spicy tuna, eel sauce on top'
      },
      {
        name: 'Creamy Hamachi Roll',
        price: 16.95,
        description: 'Spicy crabmeat, avocado, shrimp tempura inside and yellowtail, creamy sauce outside'
      },
      {
        name: 'Oh Tiger Roll',
        price: 15.95,
        description: 'Spicy crabmeat, avocado, asparagus inside. Roll deep fried with eel sauce & white sauce on top'
      },
      {
        name: 'Vegas Roll',
        price: 14.5,
        description: 'Inside: Spicy tuna, cream cheese, salmon avocado. Roll deep fried with mayo and eel sauce on top'
      },
      {
        name: 'Dragon Roll',
        price: 16.5,
        description: 'California roll with fresh water eel and avocado on top, served with eel sauce on top'
      },
      {
        name: 'Fire Cracker Roll',
        price: 16.5,
        description: 'Spicy crabmeat, cucumber inside with spicy tuna, jalapeño on top with hot sauce'
      },
      {
        name: 'Yakuza Roll',
        price: 16.5,
        description: 'Spicy tuna, cucumber inside with salmon, tuna, jalapeño on top with hot sauce'
      },
      {
        name: 'Something Wrong Roll',
        price: 17.95,
        description: 'Spicy tuna, shrimp tempura, cucumber inside and albacore, avocado, fried onion outside on top'
      },
      {
        name: 'Avocado Bomb',
        price: 16.5,
        description: 'Not a roll. A ball of spicy tuna, shrimp tempura covered with avocado. Served with chips around. Mayo and eel sauce on top'
      },
      {
        name: 'Vegetarian Roll',
        price: 14.95,
        description: 'Assorted vegetables (yellow radish, asparagus, gobo, sprouts, seaweed), avocado wrapped with cucumber. Ginger sauce'
      },
      {
        name: 'La Geisha Roll',
        price: 16.95,
        description: 'Spicy crabmeat, spicy tuna inside and wrapped with tuna, salmon outside with rayu mustard sauce on top'
      },
      {
        name: 'Tarantula Roll',
        price: 16.95,
        description: 'Fried soft shell crab and crabmeat wrapped with avocado on top. Served with bonito flakes & eel sauce'
      },
      {
        name: 'Jalama Beach Roll',
        price: 16.95,
        description: 'Spicy tuna and cucumber inside and yellowtail, thin sliced lemons and ponzu sauce on top'
      },
      {
        name: 'Lobster Roll',
        price: 15.95,
        description: 'Baked -- California roll topped with baked crawfish and eel sauce'
      },
      {
        name: 'Baked Scallop Roll',
        price: 15.95,
        description: 'Baked -- California roll topped with baked scallop and eel sauce'
      },
      {
        name: 'Vegetable Tempura Roll',
        price: 12.5,
        description: 'Deep fried vegetable tempura wrapped in seaweed paper and rice with eel sauce on top'
      },
      {
        name: 'Crazy Boy Roll',
        price: 15.95,
        description: 'No rice roll. Whole roll deep fried -- spicy crabmeat, cilantro, jalapeño, cream cheese wrapped with tortilla with eel, mayo and hot sauce.'
      },
      {
        name: 'Special Combination',
        price: 34.95,
        description: "8 pieces of sushi on Chef's choice with Customer's choice of 1 House Special Roll. Served with garden salad & miso soup (911 Roll, Alaskan Roll, Albacore Delight Roll, Caterpillar Roll, Crunchy Roll, Dragon Roll, Fire Cracker Roll, Golden California Roll, Hot Night Roll, Rainbow Roll, Red Dragon Roll)(**substitute for any other roll for extra charge)"
      },
    ],
  },
  {
    category: 'Basic Rolls',
    image: '/img/Rolls.png',
    items: [
      {
        name: 'Tuna Roll',
        price: 11.5,
        description: 'Hand: $9.50 | Cut: $11.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 9.5, 'Cut Roll': 11.5 }
          }
        ]
      },
      {
        name: 'California Roll',
        price: 10.5,
        description: 'Hand: $9.50 | Cut: $10.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 9.5, 'Cut Roll': 10.5 }
          }
        ]
      },
      {
        name: 'Spicy Tuna Roll',
        price: 9.5,
        description: 'Hand: $8.50 | Cut: $9.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 8.5, 'Cut Roll': 9.5 }
          }
        ]
      },
      {
        name: 'Cucumber Roll',
        price: 7.95,
        description: 'Hand: $5.50 | Cut: $7.95',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 5.5, 'Cut Roll': 7.95 }
          }
        ]
      },
      {
        name: 'Salmon Skin Roll',
        price: 8.95,
        description: 'Hand: $7.50 | Cut: $8.95',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 7.5, 'Cut Roll': 8.95 }
          }
        ]
      },
      {
        name: 'Scallop Roll',
        price: 9.5,
        description: 'Hand: $7.50 | Cut: $9.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 7.5, 'Cut Roll': 9.5 }
          }
        ]
      },
      {
        name: 'Yellowtail Roll',
        price: 10.95,
        description: 'Hand: $9.50 | Cut: $10.95',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 9.5, 'Cut Roll': 10.95 }
          }
        ]
      },
      {
        name: 'Salmon Roll',
        price: 9.5,
        description: 'Hand: $8.50 | Cut: $9.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 8.5, 'Cut Roll': 9.5 }
          }
        ]
      },
      {
        name: 'Avocado Roll',
        price: 8.5,
        description: 'Hand: $7.50 | Cut: $8.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 7.5, 'Cut Roll': 8.5 }
          }
        ]
      },
      {
        name: 'Unagi Roll',
        price: 11.5,
        description: 'Hand: $9.50 | Cut: $11.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 9.5, 'Cut Roll': 11.5 }
          }
        ]
      },
      {
        name: 'Shrimp Tempura Roll',
        price: 13.5,
        description: 'Hand: $9.50 | Cut: $13.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 9.5, 'Cut Roll': 13.5 }
          }
        ]
      },
      {
        name: 'Albacore Tempura Roll',
        price: 12.5,
        description: 'Hand: $9.50 | Cut: $12.50',
        options: [
          {
            label: 'Roll Type',
            name: 'rollType',
            required: true,
            choices: ['Hand Roll', 'Cut Roll'],
            choicePrices: { 'Hand Roll': 9.5, 'Cut Roll': 12.5 }
          }
        ]
      },
    ],
  },
  {
    category: 'Sashimi',
    image: '/img/Sashimi.png',
    items: [
      { name: 'Tuna', price: 19.5 },
      { name: 'Salmon', price: 17.5 },
      { name: 'Albacore', price: 17.5 },
      { name: 'Halibut', price: 24.95 },
      { name: 'Yellowtail', price: 19.5 },
      { name: 'Mackerel', price: 16.5 },
      { name: 'Octopus', price: 15.5 },
      { name: 'Escolar', price: 16.95 },
      { name: 'Combination #1', price: 26.5, description: "12 pieces of Chef's choice" },
      { name: 'Combination #2', price: 29.95, description: "16 pieces of Chef's choice" },
      { name: 'Combination #3', price: 37.5, description: "24 pieces of Chef's choice" },
      { name: 'Tuna Tataki', price: 19.95, description: 'Seared tuna with Japanese dressing' },
      { name: 'Halibut Carpaccio', price: 25.5, description: 'With olive oil sea salt, pepper and carpaccio sauce' },
      { name: 'Albacore Tataki', price: 19.5, description: 'Seared albacore with Japanese dressing' },
    ],
  },
  {
    category: 'Sushi (2pcs)',
    image: '/img/sushi.png',
    items: [
      { name: 'Albacore', price: 5.95 },
      { name: 'Salmon', price: 6.5 },
      { name: 'Tuna', price: 6.95 },
      { name: 'Yellowtail', price: 6.95 },
      { name: 'Shrimp', price: 5.5 },
      { name: 'Eel', price: 6.5 },
      { name: 'Octopus', price: 5.95 },
      { name: 'Mackerel', price: 5.5 },
      { name: 'Squid', price: 5.5 },
      { name: 'Smelt Egg', price: 5.5 },
      { name: 'Salmon Egg', price: 6.95 },
      { name: 'Scallop', price: 6.95 },
      { name: 'Sweet Shrimp', price: 7.95 },
    ],
  },
  {
    category: 'Rice Bowls',
    image: '/img/Rice_bowl.png',
    items: [
      {
        name: 'Bulgogi Bowl',
        price: 16.95,
        description: 'Korean marinated beef bulgogi & vegetables over rice'
      },
      {
        name: 'Chicken Bowl',
        price: 15.95,
        description: 'Marinated chicken & vegetables over rice'
      },
      {
        name: 'Katsu Don',
        price: 17.95,
        description: 'Pork cutlet with sauteed vegetables and egg over rice'
      },
      {
        name: 'Hot Stone Bibimbap',
        price: 21.95,
        description: 'Korean style beef, vegetables and egg over rice'
      },
      {
        name: 'Unagi Don',
        price: 25.75,
        description: 'Broiled eel served over rice'
      },
      {
        name: 'Chirashi Sushi',
        price: 27.95,
        description: 'A variety of sashimi over sushi rice'
      },
    ],
  },
  {
    category: 'Dinner Combination',
    image: '/img/dinner_comb.png',
    items: [
      {
        name: 'Dinner Combination #1',
        price: 25.95,
        description: 'Choose any 2 different items from the list: Beef teriyaki, chicken teriyaki, salmon teriyaki, spicy pork, short rib bbq (+$3.00), shrimp & vegetable tempura, gyoza, chicken cutlet'
      },
      {
        name: 'Dinner Combination #2',
        price: 29.95,
        description: 'Choose any 3 different items from the list: Beef teriyaki, chicken teriyaki, salmon teriyaki, spicy pork, short rib bbq (+$3.00), shrimp & vegetable tempura, gyoza, chicken cutlet'
      },
    ],
  },
  {
    category: 'Udon/Noodles',
    image: '/img/Noodles.png',
    items: [
      {
        name: 'Tempura Udon',
        price: 17.95,
        description: 'Udon soup served with tempura on the side'
      },
      {
        name: 'Yakisoba',
        price: 15.95,
        description: 'Sauteed Japanese noodles with vegetables, chicken and shrimp. No soup'
      },
      {
        name: 'Nabeyaki Udon',
        price: 18.95,
        description: 'Seafood udon soup with egg inside'
      },
      {
        name: 'Ramen',
        price: 13.5,
        description: 'Spicy or Mild Korean style ramen noodle (Add-ons: Ham(+$1.50), Cheese(+$1.00), Egg(+$1.00), Rice Cake(+$1.00))'
      },
    ],
  },
  {
    category: 'A La Carte',
    image: '/img/carte.png',
    items: [
      {
        name: 'Vegetable Tempura',
        price: 16.95,
        description: 'Assorted fresh vegetable tempura'
      },
      {
        name: 'Shrimp Tempura',
        price: 18.95,
        description: 'Shrimp and vegetable tempura'
      },
      {
        name: 'Beef Teriyaki',
        price: 29.95,
        description: 'USDA Choice ribeye with sauteed vegetables'
      },
      {
        name: 'Bulgogi Teriyaki',
        price: 21.95,
        description: 'Korean style marinated beef stir-fried with sauteed vegetables'
      },
      {
        name: 'Chicken Teriyaki',
        price: 19.5,
        description: 'Grilled chicken breast with sauteed vegetables'
      },
      { name: 'Salmon Teriyaki', price: 21.95 },
      {
        name: 'Curry/Tonkatsu Chicken',
        price: 21.95,
        description: 'Chicken tonkatsu curry over rice'
      },
      {
        name: 'Curry/Tonkatsu Pork',
        price: 22.95,
        description: 'Pork tonkatsu curry over rice'
      },
      {
        name: 'Short Rib BBQ',
        price: 32.95,
        description: 'Grilled short ribs marinated with house sauce'
      },
      { name: 'Pork Cutlet', price: 19.95 },
      { name: 'Chicken Cutlet', price: 19.9 },
      {
        name: 'Combination Seafood Teriyaki',
        price: 25.95,
        description: 'Seafood assorted (shrimp, scallops, white fish) with sauteed vegetables'
      },
    ],
  },
  {
    category: 'Boat Combinations',
    image: '/img/Boat.png',
    items: [
      {
        name: "Children's Platter",
        price: 13.95,
        description: 'Assorted fresh vegetable tempura and gyoza (12 & under please)'
      },
      {
        name: 'Kitchen Boat',
        price: 89.95,
        description: 'CA roll, salmon, beef, chicken, tempura, short rib, gyoza selected daily by the chef (minimum order by two persons)'
      },
      {
        name: 'Love Boat',
        price: 95.95,
        description: "Chef's choice of 10 pieces of sushi, 20 pieces sashimi, 2 house special rolls"
      },
    ],
  },
  {
    category: 'Sides & Desserts',
    image: '/img/desserts.png',
    items: [
      { name: 'White Rice', price: 2.5 },
      { name: 'Sushi Rice', price: 3.0 },
      { name: 'Miso Soup', price: 2.5 },
      { name: 'Kimchi', price: 5.95 },
      {
        name: 'Mochi Ice cream',
        price: 4.95,
        description: 'Chocolate, strawberry, mango, green tea'
      },
      {
        name: 'Tempura Cheesecake',
        price: 6.95,
        description: 'Deep fried cheesecake'
      },
    ],
  },
  {
    category: 'Beverages (Non-alcoholic)',
    image: '/img/beverage.png',
    items: [
      { name: 'Ramune', price: 4.75 },
      { name: 'Hot Tea', price: 1.75 },
      {
        name: 'Iced Tea',
        price: 3.0,
        description: 'Raspberry, Peach, Sweet, Unsweetened, Ice Green Tea'
      },
      { name: 'Soda', price: 3.0 },
      { name: 'San Pelligrino Sparkling Water', price: 3.75 },
      { name: 'Perrier Sparkling Water', price: 3.75 },
    ],
  },
  {
    category: 'Beer',
    image: '/img/alcohol.png',
    items: [
      { name: 'Sapporo', price: 8.5, description: 'Small: $4.50 | Large: $8.50' },
      { name: 'Sapporo Light', price: 8.5, description: 'Small: $4.50 | Large: $8.50' },
      { name: 'Asahi', price: 8.5, description: 'Small: $4.50 | Large: $8.50' },
      { name: 'Asahi Light', price: 8.5, description: 'Small: $4.50 | Large: $8.50' },
      { name: 'Kirin Ichiban', price: 8.5, description: 'Small: $4.50 | Large: $8.50' },
      { name: 'Kirin Ichiban Light', price: 8.5, description: 'Small: $4.50 | Large: $8.50' },
      { name: 'Coors Light', price: 4.0 },
      { name: 'Pacifico', price: 4.0 },
      { name: 'Corona', price: 4.0 },
      { name: 'Modelo', price: 4.0 },
      { name: 'Figueroa Mountain', price: 4.0 },
      { name: '805', price: 4.0 },
      { name: 'Sapporo on Tap (Pitcher)', price: 4.5 },
      { name: 'Sapporo on Tap (32oz)', price: 9.5 },
    ],
  },
  {
    category: 'Sake',
    image: '/img/sake.png',
    items: [
      { name: 'Hot Sake', price: 9.0, description: 'Small: $7.00 | Large: $9.00' },
      {
        name: 'Sho Chiku Bai Nigori',
        price: 12.95,
        description: 'Bold, sweet, robust flavor with a clean finish'
      },
      {
        name: 'Hakutsuru Superior',
        price: 15.95,
        description: 'A graceful Sake with fruity scents and a velvety smoothness'
      },
      {
        name: 'Sho Chiku Bai Ginjo',
        price: 12.95,
        description: 'Delicate, dry and silky smooth. Rich flavor with fruity flavor'
      },
      { name: 'Sayuri Nigori Sake', price: 13.95 },
      { name: 'Junmai Ginjo Kikusui', price: 14.0 },
      { name: 'Mio Sparkling Sake', price: 16.5 },
      { name: 'Michinoku Onikoroshi', price: 23.0 },
      { name: 'Otokoyama', price: 52.5 },
    ],
  },
];
