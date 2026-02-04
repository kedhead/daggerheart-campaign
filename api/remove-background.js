/**
 * Vercel Serverless Function - Background Removal
 * Uses 1min.ai API to remove backgrounds from images
 */

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing required field: imageUrl' });
    }

    // Get API key from environment
    const apiKey = process.env.min_api || process.env.MIN_API_KEY || process.env.MIN_API || process.env.ONEMIN_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Removing background from image:', imageUrl.substring(0, 100) + '...');

    // Call 1min.ai Stable Image Background Remover API
    // Docs: https://docs.1min.ai/docs/api/ai-for-image/background-remover/stable-image-background-remover
    const requestBody = {
      type: 'BACKGROUND_REMOVER',
      model: 'stable-image',
      promptObject: {
        imageUrl: imageUrl,
        output_format: 'png'
      }
    };

    console.log('1min.ai remove-background request:', JSON.stringify(requestBody));

    const response = await fetch('https://api.1min.ai/api/features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1min.ai background removal error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      return res.status(response.status).json({
        error: 'Background removal failed',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('1min.ai background removal response keys:', Object.keys(data));
    console.log('1min.ai response:', JSON.stringify(data).substring(0, 1000));

    // Extract the result URL
    const resultUrl = extractImageUrl(data);

    if (!resultUrl) {
      console.error('Could not find result URL in response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Could not extract result URL from response',
        response: data
      });
    }

    return res.status(200).json({
      imageUrl: resultUrl,
      original: imageUrl
    });

  } catch (error) {
    console.error('Background removal error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Extract image URL from 1min.ai response
 */
function extractImageUrl(data) {
  // Check temporaryUrl first
  if (data.aiRecord?.temporaryUrl) {
    const tempUrl = data.aiRecord.temporaryUrl;
    if (tempUrl.startsWith('http')) {
      return tempUrl;
    }
  }

  // Check resultUrl
  if (data.aiRecord?.aiRecordDetail?.resultUrl) {
    return data.aiRecord.aiRecordDetail.resultUrl;
  }

  // Check result
  if (data.aiRecord?.aiRecordDetail?.result) {
    const result = data.aiRecord.aiRecordDetail.result;
    if (typeof result === 'string' && result.startsWith('http')) {
      return result;
    }
    if (Array.isArray(result) && result[0]) {
      return result[0];
    }
  }

  // Check resultObject
  if (data.aiRecord?.aiRecordDetail?.resultObject) {
    const resultObj = data.aiRecord.aiRecordDetail.resultObject;
    if (typeof resultObj === 'string' && resultObj.startsWith('http')) {
      return resultObj;
    }
    if (Array.isArray(resultObj) && resultObj[0]) {
      return resultObj[0];
    }
    if (resultObj?.url) {
      return resultObj.url;
    }
  }

  // Direct fields
  if (data.resultUrl) return data.resultUrl;
  if (data.result) return data.result;
  if (data.url) return data.url;
  if (data.imageUrl) return data.imageUrl;

  return null;
}
