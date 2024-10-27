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

    const total = expenses.results.reduce((sum, expense) => {
      return sum + (expense.properties.Amount.number || 0);
    }, 0);

    await notion.pages.update({
      page_id: process.env.DESTINATION_PAGE_ID,
      properties: {
        "Total": {
          number: total
        }
      }
    });

    res.status(200).json({ success: true, total });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}