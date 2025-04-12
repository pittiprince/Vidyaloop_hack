import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const router = express.Router();

const genAI = new GoogleGenerativeAI("AIzaSyA9EVwiXEIQRRLafxtzd_oEucZG4_f5p2A"); // best to use env variable

router.post('/justification', async (req, res) => {
  try {
    const { question, wrongAnswer, correctAnswer } = req.body;

    if (!question || !wrongAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `
You are an AI assistant helping a teacher understand feedback given on a lesson.
Here is the title of the video lesson: "${question}"

Here is the transcript of the video:
"""
${wrongAnswer}
"""

And here is the feedback provided on the lesson:
"""
${correctAnswer}
"""

Please generate a detailed explanation or justification for this feedback based on the transcript. Highlight specific moments, themes, or content from the transcript that support the feedback points. Be clear and concise.
`;

    // Get the right model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Correct call to generateContent
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const justification = await response.text();

    return res.json({ justification });
  } catch (error) {
    console.error('Error generating justification:', error?.message || error);
    return res.status(500).json({
      error: 'Failed to generate justification',
      details: error?.message || 'Unknown error',
    });
  }
});

export default router;
