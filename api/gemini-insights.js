import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';

// Robustly resolve GOOGLE_APPLICATION_CREDENTIALS if it is set
let credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let projectId = '';

if (credsPath) {
  // Check if it's a raw JSON string containing credentials instead of a file path
  if (credsPath.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(credsPath);
      if (parsed.project_id) {
        projectId = parsed.project_id;
      }
      // Vercel serverless environment has a writable /tmp directory
      const tempCredsPath = path.join('/tmp', 'gcp-service-account.json');
      fs.writeFileSync(tempCredsPath, credsPath, 'utf8');
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredsPath;
      credsPath = tempCredsPath;
    } catch (err) {
      console.error('Failed to parse and write raw JSON GOOGLE_APPLICATION_CREDENTIALS:', err);
    }
  } else {
    // It's a file path or folder path
    const absolutePath = path.resolve(process.cwd(), credsPath);
    if (fs.existsSync(absolutePath)) {
      const stat = fs.statSync(absolutePath);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(absolutePath);
        const jsonFile = files.find(f => f.endsWith('.json'));
        if (jsonFile) {
          process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(absolutePath, jsonFile);
          credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }
      } else {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = absolutePath;
        credsPath = absolutePath;
      }
    }
    
    // Read project_id from file
    if (credsPath && fs.existsSync(credsPath) && !fs.statSync(credsPath).isDirectory()) {
      try {
        const credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (credentials.project_id) {
          projectId = credentials.project_id;
        }
      } catch (err) {
        console.error('Failed to read project_id from GOOGLE_APPLICATION_CREDENTIALS file:', err);
      }
    }
  }
}

if (!projectId && process.env.GOOGLE_CLOUD_PROJECT) {
  projectId = process.env.GOOGLE_CLOUD_PROJECT;
}


export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { transactions, lifeEnergyRate } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Missing or invalid "transactions" array in request body.' });
    }

    if (!projectId) {
      return res.status(500).json({ error: 'Gemini insights are not configured: set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT' });
    }

    // Initialize Vertex AI with the resolved project ID and regional location us-central1
    const vertexAI = new VertexAI({
      project: projectId,
      location: 'us-central1'
    });

    const hasLifeEnergy = typeof lifeEnergyRate === 'number' && lifeEnergyRate > 0;
    const formattedRate = hasLifeEnergy ? `$${lifeEnergyRate.toFixed(2)}/hr` : 'Not Set';

    // Group transactions by category to help context
    const categoryTotals = {};
    let totalExpense = 0;
    let totalIncome = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (amount < 0) {
        totalExpense += Math.abs(amount);
        const cat = t.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(amount);
      } else {
        totalIncome += amount;
      }
    });

    // Sort categories by expenditure
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, total]) => {
        const lifeEnergyStr = hasLifeEnergy 
          ? ` (≈ ${(total / lifeEnergyRate).toFixed(1)} hrs of Life Energy)` 
          : '';
        return `- **${cat}**: $${total.toFixed(2)}${lifeEnergyStr}`;
      })
      .join('\n');

    // Create the transaction list string
    const transactionListStr = transactions
      .map(t => {
        const amt = Number(t.amount) || 0;
        const sign = amt < 0 ? '-' : '+';
        const absAmt = Math.abs(amt).toFixed(2);
        return `- ${t.date} | ${t.description} | Category: ${t.category || 'None'} | ${sign}$${absAmt}`;
      })
      .join('\n');

    // Build the analysis prompt
    // Build the highly concise analysis prompt
    const prompt = `You are an expert personal finance coach specializing in the 'Your Money or Your Life' (YMYL) financial independence philosophy.
Analyze the user's spending patterns for the last 90 days.

### User Financial Context:
- **Life Energy Rate**: ${formattedRate} (This represents their net hourly wage. If set, every dollar spent is equivalent to spending a portion of their active life energy/time worked).
- **Total Income (last 90 days)**: $${totalIncome.toFixed(2)}
- **Total Expenses (last 90 days)**: $${totalExpense.toFixed(2)}
- **Net Flow (last 90 days)**: $${(totalIncome - totalExpense).toFixed(2)}

### Top Expense Categories:
${topCategories || 'None detected'}

### All Transactions (last 90 days):
${transactionListStr || 'No transactions found.'}

---

Please provide exactly 3 to 5 bullet point insights maximum, each no longer than 2 sentences. 
Keep the YMYL life energy framing (converting top expenditures into 'hours of life energy' worked if the Life Energy Rate is set, or encouraging them to set it if not).
Make the output extremely scannable, direct, and action-oriented. 
Do NOT include any long section headers, lengthy explanations, intro/outro remarks, or markdown headers. Just return a plain list of 3-5 bullet points with appropriate emojis.`;

    // Attempt generation with a prioritized list of candidate models for fallback robustness
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-001',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let insights = '';
    let successModel = '';
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting to generate insights using model: ${modelName} in us-central1`);
        const generativeModel = vertexAI.getGenerativeModel({
          model: modelName,
        });

        const response = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const textResult = response.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResult) {
          insights = textResult;
          successModel = modelName;
          console.log(`Successfully generated insights using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Failed to generate insights using model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (!insights) {
      throw new Error(`All candidate models failed to generate content. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    }

    return res.status(200).json({ insights, model: successModel });
  } catch (error) {
    console.error('Error generating Gemini spending insights:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
