const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

export default async function handler(req, res) {
  try {
    const expenses = await notion.databases.query({
      database_id: process.env.EXPENSES_DATABASE_ID,
      filter: {
        property: "Amount",
        number: {
          is_not_empty: true
        }
      }
    });

    // Log each expense amount for debugging
    console.log('Found expenses:', expenses.results.map(expense => ({
      amount: expense.properties.Amount.number,
      // Add any other relevant properties you want to check
    })));

    const total = expenses.results.reduce((sum, expense) => {
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