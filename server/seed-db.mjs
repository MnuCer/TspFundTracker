/**
 * Database seeding script for development
 * Generates mock TSP fund data for testing
 */

import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3]?.split('?')[0] || 'tsp_tracker',
});

const funds = ['G', 'C', 'S', 'I'];
const fundNames = {
  G: 'Government Securities',
  C: 'Common Stock',
  S: 'Small Cap Stock',
  I: 'International Stock',
};

// Generate mock data for the last 90 days
const generateMockData = () => {
  const data = [];
  const basePrice = { G: 19.7, C: 104.0, S: 97.0, I: 55.0 };
  const today = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const fund of funds) {
      // Generate realistic price changes
      const change = (Math.random() - 0.5) * 2; // -1% to +1%
      const price = basePrice[fund] + change;
      const dailyChange = (change / basePrice[fund]) * 100;

      data.push({
        fundSymbol: fund,
        priceDate: date.toISOString().split('T')[0],
        sharePrice: price.toFixed(4),
        dailyPercentChange: dailyChange.toFixed(4),
      });

      basePrice[fund] = price;
    }
  }

  return data;
};

try {
  console.log('Seeding database with mock TSP fund data...');

  const mockData = generateMockData();

  // Insert mock data
  for (const record of mockData) {
    const query = `
      INSERT INTO fundPrices (fundSymbol, priceDate, sharePrice, dailyPercentChange)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sharePrice = VALUES(sharePrice),
        dailyPercentChange = VALUES(dailyPercentChange),
        updatedAt = NOW()
    `;

    await connection.execute(query, [
      record.fundSymbol,
      record.priceDate,
      record.sharePrice,
      record.dailyPercentChange,
    ]);
  }

  console.log(`✓ Seeded ${mockData.length} fund price records`);

  // Calculate and store indicators for recent dates
  const recentDates = new Set();
  mockData.slice(-20).forEach(record => {
    recentDates.add(record.priceDate);
  });

  for (const fund of funds) {
    const fundData = mockData.filter(d => d.fundSymbol === fund);
    
    if (fundData.length > 0) {
      const latestDate = fundData[fundData.length - 1].priceDate;
      const prices = fundData.map(d => parseFloat(d.sharePrice));

      // Simple momentum calculation
      const current = prices[prices.length - 1];
      const oneMonthAgo = prices[Math.max(0, prices.length - 21)];
      const twoWeeksAgo = prices[Math.max(0, prices.length - 10)];
      const threeMonthsAgo = prices[0];

      const momentum1Month = ((current - oneMonthAgo) / oneMonthAgo) * 100;
      const momentum2Week = ((current - twoWeeksAgo) / twoWeeksAgo) * 100;
      const momentum3Month = ((current - threeMonthsAgo) / threeMonthsAgo) * 100;

      const query = `
        INSERT INTO fundIndicators (fundSymbol, indicatorDate, momentum1Month, momentum2Week, momentum3Month)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          momentum1Month = VALUES(momentum1Month),
          momentum2Week = VALUES(momentum2Week),
          momentum3Month = VALUES(momentum3Month),
          updatedAt = NOW()
      `;

      await connection.execute(query, [
        fund,
        latestDate,
        momentum1Month.toFixed(4),
        momentum2Week.toFixed(4),
        momentum3Month.toFixed(4),
      ]);
    }
  }

  console.log(`✓ Seeded momentum indicators for all funds`);
  console.log('✓ Database seeding complete!');

  await connection.end();
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
}
