export interface MenuItemData {
  name: string;
  price: number;
  description?: string;
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
        price: 18.95,
        description:
          '*Served with miso soup, rice, and salad. (1st choice: Chicken Teriyaki, Beef Teriyaki, Chicken Cutlet, Spicy Sesame Chicken, Salmon Teriyaki, Shrimp & Veggie Tempura) (2nd choice: Sashimi, Sushi, California roll, Spicy Albacore Roll)',
      },
      {
        name: 'Special Combination',
        price: 21.9,
        description:
          "*Served with miso soup and rice. 5pcs sushi of Chef's choice & customer's choice of 1 roll (911 roll, Alaskan roll, Aloha roll, Caterpillar roll, Crunchy roll, Dragon roll, Fire Cracker roll, Shrimp roll, Baked Salmon roll, Rainbow roll, Red Dragon roll)",
      },
      {
        name: 'Choose Any 2 Different Items',
        price: 19.95,
        description:
          '*Served with miso soup and rice. Beef Teriyaki, Chicken Teriyaki, Salmon Teriyaki, Spicy Pork, Shrimp & Vegetable Tempura, Gyoza, Chicken Cutlet, California & Spicy Tuna roll, Sushi 5pcs',
      },
      {
        name: 'Choose Any 3 Different Items',
        price: 24.95,
        description:
          '*Served with miso soup and rice. Beef Teriyaki, Chicken Teriyaki, Salmon Teriyaki, Spicy Pork, Shrimp & Vegetable Tempura, Gyoza, Chicken Cutlet, California & Spicy Tuna roll, Sushi 5pcs',
      },
    ],
  },
  {
    category: 'Salads',
    image: '/img/Salads.png',
    items: [
      { name: 'Sashimi Salad', price: 14.95 },
      { name: 'Tofu Salad', price: 7.95 },
      { name: 'Seaweed Salad', price: 6.5 },
      { name: 'Squid Salad', price: 7.95 },
    ],
  },
  {
    category: 'Appetizers',
    image: '/img/Appetizers.png',
    items: [
      { name: 'Edamame', price: 6.5 },
      { name: 'Gyoza (6pcs)', price: 8.5 },
      { name: 'Agedashi Tofu', price: 7.95 },
      { name: 'Tempura (Shrimp & Veggie)', price: 9.95 },
      { name: 'Veggie Tempura', price: 7.95 },
      { name: 'Soft Shell Crab', price: 12.95 },
      { name: 'Chicken Karaage', price: 9.95 },
      { name: 'Takoyaki (6pcs)', price: 8.95 },
      { name: 'Jalapeño Bomb (6pcs)', price: 9.95, description: 'Spicy tuna, cream cheese' },
    ],
  },
];

export const dinnerMenu: MenuCategory[] = [
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
    category: 'Sashimi (5pcs)',
    image: '/img/sashimi.png',
    items: [
      { name: 'Albacore', price: 13.95 },
      { name: 'Salmon', price: 15.95 },
      { name: 'Tuna', price: 16.95 },
      { name: 'Yellowtail', price: 16.95 },
      { name: 'Octopus', price: 13.95 },
    ],
  },
  {
    category: 'Basic Rolls',
    image: '/img/rolls.png',
    items: [
      { name: 'California Roll', price: 7.95 },
      { name: 'Spicy Tuna Roll', price: 8.95 },
      { name: 'Spicy Salmon Roll', price: 8.95 },
      { name: 'Spicy Albacore Roll', price: 7.95 },
      { name: 'Salmon Skin Roll', price: 7.5 },
      { name: 'Philadelphia Roll', price: 8.95 },
      { name: 'Vegetable Roll', price: 6.95 },
      { name: 'Cucumber Roll', price: 5.95 },
      { name: 'Avocado Roll', price: 5.95 },
    ],
  },
  {
    category: 'Specialty Rolls',
    image: '/img/specialtyRolls.png',
    items: [
      {
        name: 'Dragon Roll',
        price: 15.95,
        description: 'Crab, avocado, cucumber, topped with eel & avocado',
      },
      {
        name: 'Rainbow Roll',
        price: 15.95,
        description: 'Crab, avocado, cucumber, topped with assorted fish',
      },
      {
        name: 'Caterpillar Roll',
        price: 14.95,
        description: 'Eel, cucumber, topped with avocado',
      },
      {
        name: 'Spider Roll',
        price: 14.95,
        description: 'Soft shell crab, avocado, cucumber, gobo',
      },
      { name: 'Crunchy Roll', price: 12.95, description: 'Shrimp tempura, avocado, cucumber' },
      {
        name: 'Baked Salmon Roll',
        price: 13.95,
        description: 'Crab, avocado, cucumber, topped with baked salmon',
      },
      {
        name: 'Lion King Roll',
        price: 14.95,
        description: 'Crab, avocado, cucumber, topped with baked salmon & special sauce',
      },
    ],
  },
  {
    category: 'Teriyaki',
    image: '/img/teriyaki.png',
    items: [
      { name: 'Chicken Teriyaki', price: 15.95, description: 'Served with rice & salad' },
      { name: 'Beef Teriyaki', price: 17.95, description: 'Served with rice & salad' },
      { name: 'Salmon Teriyaki', price: 18.95, description: 'Served with rice & salad' },
      { name: 'Combination Teriyaki', price: 19.95, description: 'Chicken & Beef, served with rice & salad' },
    ],
  },
];
