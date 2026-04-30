export async function analyzeResume(resumeText, jobDescription, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert AI Resume Analyzer and Career Coach. 
I am going to provide you with the text of a resume and an optional job description.
Your task is to analyze the resume, optionally comparing it to the job description if provided, and return a comprehensive analysis in JSON format.

Resume Text:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}` : 'No specific job description provided. Please analyze based on general best practices for the role implied in the resume.'}

Please return ONLY a valid JSON object with the following structure:
{
  "score": number (0-100, representing overall strength or match),
  "summary": "A brief 2-3 sentence overall evaluation",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "missingKeywords": ["keyword 1", "keyword 2", ...],
  "suggestions": ["actionable advice 1", "actionable advice 2", ...]
}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // The response is supposed to be JSON, but we should parse it safely.
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
}
