// Confirmed stock remaining after proofer preparation. These are individual pastries.
window.CONFIRMED_STOCK_HISTORY = [ {
  date: '2026-09-30',
  revision: '2026-09-30-confirmed-stock-1',
  afterProoferDeduction: true,
  quantities: {
    'Butter Croissant': 40,
    'Pain au Chocolat': 53,
    'Gianduja Bowtie': 51,
    'Labneh Twist': 19,
    'Cinnamon Bun': 25,
    'Yemeny Honey Brioche': 105,
    'Adani Chai Bun': 59,
    'Pistachio Flan': 13,
    'Olive & Goat Cheese Suisse': 42,
    'Strawberry & Lemon Verbena Danish': 43,
    'Red Croissant': 51,
    'Cruffin': 32,
    'Dark Chocolate Cookie': 50,
    'Pistachio Cookie': 2,
    'Pecan Cookie': 50
  }
}];

// Friday count after preparing pastries for Saturday, before Saturday delivery.
window.CONFIRMED_STOCK = {
  date: '2026-10-09',
  revision: '2026-10-09-after-saturday-preparation-1',
  afterProoferDeduction: true,
  quantities: {
    'Butter Croissant': 32,
    'Pain au Chocolat': 34,
    'Gianduja Bowtie': 25,
    'Labneh Twist': 23,
    'Cinnamon Bun': 32,
    'Yemeny Honey Brioche': 18,
    'Adani Chai Bun': 13,
    'Pistachio Flan': 26,
    'Olive & Goat Cheese Suisse': 24,
    'Strawberry & Lemon Verbena Danish': 10,
    'Red Croissant': 13,
    'Cruffin': 23,
    'Dark Chocolate Cookie': 37,
    'Pistachio Cookie': 44,
    'Pecan Cookie': 37
  }
};

// Delivery received 1 October; quantities are individual pastries, not boxes.
window.CONFIRMED_DELIVERIES = [{
  id: '2026-10-01-received-1',
  date: '2026-10-01',
  quantities: {
    'Butter Croissant': 50,
    'Pain au Chocolat': 25,
    'Labneh Twist': 50,
    'Cinnamon Bun': 50,
    'Pistachio Flan': 25,
    'Strawberry & Lemon Verbena Danish': 25
  }
}];
