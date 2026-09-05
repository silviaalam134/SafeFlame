const express = require('express');

const router = express.Router();

// POST /api/detect-fire
// Sends a base64 image to Roboflow and returns its prediction response.
router.post('/detect-fire', async (req, res) => {
  const { image } = req.body;
  const modelUrl = process.env.ROBOFLOW_MODEL_URL;
  const apiKey = process.env.ROBOFLOW_API_KEY;

  // Reject incomplete requests before making an external API call.
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ message: 'A base64 image is required' });
  }

  if (!modelUrl || !apiKey) {
    return res.status(500).json({ message: 'Roboflow configuration is missing' });
  }

  try {
    // Roboflow Hosted Inference expects the raw base64 string, not JSON or multipart data.
    const roboflowResponse = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: image
    });

    const responseText = await roboflowResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { message: responseText || 'Invalid response from Roboflow' };
    }

    if (!roboflowResponse.ok) {
      return res.status(roboflowResponse.status).json({
        message: 'Roboflow inference request failed',
        details: responseData
      });
    }

    return res.json(responseData);
  } catch (error) {
    // Network and other unexpected failures should not crash the Express process.
    console.error('Roboflow inference error:', error.message);
    return res.status(502).json({ message: 'Unable to reach Roboflow inference service' });
  }
});

module.exports = router;
