import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  // API endpoint for Smart Policy & Financial Advisor powered by Gemini
  app.post('/api/ai-advisor', async (req, res) => {
    try {
      const { prompt, profile } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json({ 
          fallback: true,
          message: "API key not set, using built-in financial recommendation matrix." 
        });
      }

      const ai = new GoogleGenAI();
      const systemInstruction = `You are the smart AI Financial & Insurance Advisory Expert for "MFD-Fab Lucknow", an AMFI-registered Mutual Fund Distributor (ARN: 365660) and Insurance Services Consultant based in Spaze Corporate Park, Sector 70, Gurugram.
You provide clear, trustworthy, unbiased Indian financial planning following SEBI and IRDAI standards.
Key Services:
1. Health Insurance: Mediclaim, Family Floater, Base + Super Top-up strategy to save premium, cashless hospital network in Gurugram/NCR, zero room-rent capping.
2. Motor Insurance: Private Car, Two-wheeler, Comprehensive + Zero-Depreciation add-on, Engine Protect, 24x7 Roadside Assistance, NCB transfer up to 50%.
3. Term Insurance: Human Life Value (10-15x annual income + liabilities), pure term protection, critical illness riders.
4. Mutual Funds & Goal SIPs: Child education, retirement planning, emergency reserves, long-term wealth compounding.

Keep answers punchy, well-formatted with markdown bolding and bullet points, specific figures in INR (₹ Lakhs / Crores), and end with a courteous invitation to connect directly with MFD-Fab Lucknow on WhatsApp (+91 98185 45983) or visit the Gurugram office.`;

      const contents = prompt 
        ? prompt 
        : `User profile: ${JSON.stringify(profile)}. Please provide an immediate smart diagnostic assessment and prioritized action plan for Insurance (Health, Term, Motor) and Mutual Fund SIPs.`;

      let advice = '';
      try {
        const fetchPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
          }
        });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI request timeout')), 3500)
        );
        const response: any = await Promise.race([fetchPromise, timeoutPromise]);
        advice = response?.text || '';
      } catch (apiErr: any) {
        console.warn('Gemini API call timed out or failed, using instant smart advisory engine:', apiErr.message);
      }

      if (!advice) {
        // High quality heuristic financial advisor fallback
        const q = (prompt || '').toLowerCase();
        if (q.includes('corporate') || q.includes('health') || q.includes('mediclaim') || q.includes('top-up')) {
          advice = `**Smart Health Insurance Strategy (Gurugram):**\n• **Base + Super Top-up Combo:** Take a ₹10 Lakh Base + ₹40 Lakh Super Top-up (₹10L deductible). You get ₹50 Lakhs total coverage for ~₹16,500/year instead of ₹34,000/year, saving you over 50%.\n• **Corporate Cover Risk:** Employer policies terminate when switching jobs or retiring, and often cap room rent to 1% of the sum insured.\n• **Cashless Network:** Complete cashless pre-authorization available at Medanta, Fortis, Artemis, Max, and Paras.\n\n*Connect with MFD-Fab Lucknow on WhatsApp (+91 98185 45983) for customized quotes.*`;
        } else if (q.includes('term') || q.includes('life') || q.includes('hlv')) {
          advice = `**Human Life Value (HLV) Term Protection:**\n• **Target Sum Assured:** 15x annual income + outstanding home/car loans - liquid savings.\n• **Pure Protection:** Keep investments separate. A ₹1.5–₹2 Crore term plan costs only ~₹750–₹1,200/month, freeing surplus capital for Mutual Fund SIPs.\n• **Key Riders:** Add Critical Illness (lump-sum cash on diagnosis) and Waiver of Premium.\n\n*Contact MFD-Fab Lucknow (+91 98185 45983) to review policies with >98.5% Claim Settlement Ratios.*`;
        } else if (q.includes('motor') || q.includes('car') || q.includes('zero dep')) {
          advice = `**Motor Insurance Optimization:**\n• **Zero Depreciation:** Eliminates up to 50% deduction on plastic/metal parts during claims.\n• **Gurugram Monsoon Protection:** Add **Engine & Gearbox Protection** to shield against waterlogging hydrostatic lock.\n• **NCB Retainment:** Transfer up to 50% No Claim Bonus when renewing or upgrading your vehicle.\n\n*Get an instant renewal quote within 5 minutes via WhatsApp (+91 98185 45983).*`;
        } else {
          advice = `**Integrated Wealth & Protection Plan (MFD-Fab Lucknow):**\n1. **Health Shield:** ₹10L Base + ₹40L Super Top-up with zero room rent limits.\n2. **Income Shield:** 15x annual income in pure Term Life Insurance.\n3. **Asset Shield:** Comprehensive Motor Insurance with Zero-Dep and Engine Protect.\n4. **Wealth Creation:** Disciplined monthly SIPs across Flexicap and Hybrid mutual funds.\n\n*Visit our office in Spaze Corporate Park, Sector 70, Gurugram or chat on WhatsApp (+91 98185 45983).*`;
        }
      }

      return res.json({ advice });
    } catch (error: any) {
      console.error('Advisor error:', error);
      return res.status(200).json({ 
        fallback: true, 
        error: error.message || 'API temporarily unavailable',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'MFD-Fab Lucknow' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MFD-Fab Lucknow server running on http://0.0.0.0:${port}`);
  });
}

startServer();
