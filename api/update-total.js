const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

export default async function handler(req, res) {
  try {
    let allExpenses = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: process.env.EXPENSES_DATABASE_ID,
        filter: {
          property: "Amount",
          number: {
            is_not_empty: true
          }
        },
        start_cursor: startCursor,
        page_size: 100
      });

      allExpenses = [...allExpenses, ...response.results];
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    console.log(`Found total of ${allExpenses.length} expenses`);

    const total = allExpenses.reduce((sum, expense) => {
      return sum + (expense.properties.Amount.number || 0);
    }, 0);

    console.log('Calculated total:', total);

    await notion.pages.create({
      parent: {
        database_id: process.env.DESTINATION_DATABASE_ID
      },
      properties: {
        "Total": {
          number: total
        },
        "Date": {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    });

    res.status(200).json({ success: true, total });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}