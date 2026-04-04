/**
 * Price Analysis Service
 * Analyzes mandi prices and provides insights for farmers
 */

import { GEMINI_API_KEY, GEMINI_MODEL_NAME } from '../config/localSecrets';

/**
 * Analyze price trends and provide recommendations
 * @param {Array} priceData - Array of mandi price items
 * @param {Object} userContext - User's crops, location etc
 * @param {string} language - Target language for response
 * @returns {Object} Analysis result
 */
/**
 * Analyze price trends and provide recommendations
 * @param {Array} priceData - Array of mandi price items
 * @param {Object} userContext - User's crops, location etc
 * @param {string} language - Target language for response
 * @param {string} mode - 'sell' (find best selling price) or 'buy' (find cheapest mandi)
 * @returns {Object} Analysis result
 */
export async function analyzePrices(priceData, userContext, language = 'English', mode = 'sell') {
  if (!priceData || priceData.length === 0) {
    return {
      summary: language === 'Hindi' 
        ? 'विश्लेषण के लिए कोई मूल्य डेटा उपलब्ध नहीं है।'
        : 'No price data available for analysis.',
      bestMarket: null,
      priceRange: null,
      recommendation: language === 'Hindi'
        ? 'विश्लेषण देखने के लिए कृपया कीमतें रिफ्रेश करें।'
        : 'Please refresh prices to see analysis.',
      trends: [],
      mode,
    };
  }

  // Calculate basic statistics locally (fast)
  const stats = calculatePriceStats(priceData, mode);
  stats.mode = mode;

  // Use AI for intelligent analysis
  try {
    const aiAnalysis = await getAIAnalysis(priceData, userContext, language, stats, mode);
    return {
      ...stats,
      ...aiAnalysis,
      mode,
    };
  } catch (error) {
    // Fallback to local analysis if AI fails
    return {
      ...stats,
      recommendation: getLocalRecommendation(stats, language, mode),
      trends: [],
      aiError: true,
      mode,
    };
  }
}

/**
 * Calculate price statistics locally
 * @param {Array} priceData - Price data to analyze
 * @param {string} mode - 'sell' for finding best selling price, 'buy' for cheapest buying price
 */
function calculatePriceStats(priceData, mode = 'sell') {
  const modalPrices = priceData
    .map(item => parseFloat(item.modal_price || item.modalPrice || 0))
    .filter(p => p > 0);

  const minPrices = priceData
    .map(item => parseFloat(item.min_price || item.minPrice || 0))
    .filter(p => p > 0);

  const maxPrices = priceData
     .map(item => parseFloat(item.max_price || item.maxPrice || 0))
    .filter(p => p > 0);

  const avgModalPrice = modalPrices.length > 0
    ? modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length
    : 0;

  const overallMin = minPrices.length > 0 ? Math.min(...minPrices) : 0;
  const overallMax = maxPrices.length > 0 ? Math.max(...maxPrices) : 0;

  // Prepare market data
  const marketData = priceData
    .map(item => ({
      market: item.market || item.marketName,
      crop: item.commodity || item.cropName,
      price: parseFloat(item.modal_price || item.modalPrice || 0),
      district: item.district,
      minPrice: parseFloat(item.min_price || item.minPrice || 0),
      maxPrice: parseFloat(item.max_price || item.maxPrice || 0),
    }))
    .filter(m => m.price > 0);

  // Sort based on mode
  // SELL mode: highest price first (best for selling)
  // BUY mode: lowest price first (best for buying inputs)
  const rankedMarkets = mode === 'buy'
    ? [...marketData].sort((a, b) => a.price - b.price)  // Lowest first
    : [...marketData].sort((a, b) => b.price - a.price); // Highest first

  // Best market depends on mode
  const bestMarket = rankedMarkets[0] || null;
  
  // Worst market is opposite of best
  const worstMarket = rankedMarkets[rankedMarkets.length - 1] || null;

  // Group by crop for crop-wise analysis
  const cropAnalysis = {};
  priceData.forEach(item => {
    const crop = item.commodity || item.cropName || 'Unknown';
    if (!cropAnalysis[crop]) {
      cropAnalysis[crop] = {
        prices: [],
        markets: [],
        items: [],
      };
    }
    cropAnalysis[crop].prices.push(parseFloat(item.modal_price || item.modalPrice || 0));
    cropAnalysis[crop].markets.push(item.market || item.marketName);
    cropAnalysis[crop].items.push({
      market: item.market || item.marketName,
      price: parseFloat(item.modal_price || item.modalPrice || 0),
    });
  });

  // Calculate crop averages with best/worst markets
  const cropSummaries = Object.entries(cropAnalysis).map(([crop, data]) => {
    const validPrices = data.prices.filter(p => p > 0);
    const sortedItems = data.items.filter(i => i.price > 0).sort((a, b) => b.price - a.price);
    return {
      crop,
      avgPrice: validPrices.length > 0
        ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
        : 0,
      marketCount: data.markets.length,
      priceSpread: validPrices.length > 1
        ? Math.round(Math.max(...validPrices) - Math.min(...validPrices))
        : 0,
      bestMarket: sortedItems[0] || null,
      worstMarket: sortedItems[sortedItems.length - 1] || null,
    };
  });

  return {
    summary: `Analyzing ${priceData.length} price records across multiple markets`,
    avgPrice: Math.round(avgModalPrice),
    priceRange: {
      min: Math.round(overallMin),
      max: Math.round(overallMax),
    },
    bestMarket,
    worstMarket,
    rankedMarkets: rankedMarkets.slice(0, 10), // Top 10 markets
    cropSummaries,
    totalRecords: priceData.length,
  };
}

/**
 * Get AI-powered analysis using Gemini
 */
async function getAIAnalysis(priceData, userContext, language, stats, mode = 'sell') {
  const userCrops = userContext.crops || [];
  const userDistrict = userContext.district || 'your district';
  const userState = userContext.state || 'your state';

  // Prepare price summary for AI
  const priceSummary = priceData.slice(0, 10).map(item => ({
    crop: item.commodity || item.cropName,
    market: item.market || item.marketName,
    modal: item.modal_price || item.modalPrice,
    min: item.min_price || item.minPrice,
    max: item.max_price || item.maxPrice,
  }));

  const modeContext = mode === 'buy'
    ? `The farmer wants to BUY inputs/goods. Help find the CHEAPEST market to buy from.`
    : `The farmer wants to SELL crops. Help find the BEST market with HIGHEST prices.`;

  const prompt = `You are an agricultural market analyst helping farmers in India.

${modeContext}

Analyze these mandi prices:
${JSON.stringify(priceSummary, null, 2)}

Farmer's context:
- Location: ${userDistrict}, ${userState}
- Crops grown: ${userCrops.length > 0 ? userCrops.join(', ') : 'Not specified'}
- Mode: ${mode === 'buy' ? 'BUYING goods' : 'SELLING crops'}

Statistics:
- Average modal price: ₹${stats.avgPrice}
- Price range: ₹${stats.priceRange.min} - ₹${stats.priceRange.max}
- ${mode === 'buy' ? 'Cheapest' : 'Best'} market: ${stats.bestMarket?.market || 'N/A'} at ₹${stats.bestMarket?.price || 0}

Provide response in ${language} language with:
1. "recommendation": One clear actionable recommendation for ${mode === 'buy' ? 'buying at lowest price' : 'selling at highest price'} (2 sentences max)
2. "${mode === 'buy' ? 'buySignal' : 'sellSignal'}": Either "${mode === 'buy' ? 'BUY_NOW' : 'SELL_NOW'}", "HOLD", or "WAIT" with one reason
3. "bestTime": Best time to ${mode === 'buy' ? 'buy' : 'sell'} (morning/afternoon/specific day)
4. "priceOutlook": Brief outlook - "rising", "stable", or "falling"
5. "tips": Array of 2 practical tips for ${mode === 'buy' ? 'saving money while buying' : 'getting better prices'}
${mode === 'buy' ? '6. "savingsTip": One tip on how to save more money' : ''}

Respond ONLY with valid JSON object, no other text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('AI analysis unavailable');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Local recommendation fallback
 */
function getLocalRecommendation(stats, language, mode = 'sell') {
  if (!stats.bestMarket) {
    return language === 'Hindi'
      ? 'कीमतें लोड करें और विश्लेषण देखें'
      : 'Load prices to see analysis';
  }

  const spread = stats.priceRange.max - stats.priceRange.min;
  const spreadPercent = ((spread / stats.avgPrice) * 100).toFixed(0);

  if (mode === 'buy') {
    if (language === 'Hindi') {
      if (spreadPercent > 20) {
        return `${stats.bestMarket.market} में ₹${stats.bestMarket.price} सबसे सस्ती कीमत है। ${spreadPercent}% बचत संभव है!`;
      }
      return `कीमतें समान हैं। ${stats.bestMarket.market} से खरीदें।`;
    }
    if (spreadPercent > 20) {
      return `${stats.bestMarket.market} offers cheapest price at ₹${stats.bestMarket.price}. Save up to ${spreadPercent}%!`;
    }
    return `Prices are similar. Buy from ${stats.bestMarket.market}.`;
  }

  // Sell mode (default)
  if (language === 'Hindi') {
    if (spreadPercent > 20) {
      return `${stats.bestMarket.market} में ₹${stats.bestMarket.price} सबसे अच्छी कीमत है। कीमतों में ${spreadPercent}% का अंतर है - अच्छी मंडी चुनें।`;
    }
    return `कीमतें स्थिर हैं। ${stats.bestMarket.market} में बेचें।`;
  }

  if (spreadPercent > 20) {
    return `${stats.bestMarket.market} offers best price at ₹${stats.bestMarket.price}. Prices vary by ${spreadPercent}% - choose your market wisely.`;
  }
  return `Prices are stable across markets. Consider selling at ${stats.bestMarket.market}.`;
}

/**
 * Get price trend indicator
 */
export function getPriceTrend(currentPrice, historicalAvg) {
  if (!historicalAvg || historicalAvg === 0) return 'stable';
  const change = ((currentPrice - historicalAvg) / historicalAvg) * 100;
  if (change > 5) return 'rising';
  if (change < -5) return 'falling';
  return 'stable';
}

/**
 * Format price for display
 */
export function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
}
