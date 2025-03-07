const ANALYTICS_BASE_URL = 'https://api.3learn.xyz';

export interface AnalyticsMetrics {
  total_entries: number;
  average_attentiveness: number;
  average_eye_contact: number;
  average_posture: number;
  total_focus_duration: number;
  latest_comment: string;
}

export interface AnalyticsResponse {
  timestamp: string;
  attentiveness_rating: number;
  eye_contact_score: number;
  posture_score: number;
  focus_duration: number;
  comment: string;
}

export const submitStudentImages = async (meetingId: string, userId: string, imageUrls: string[]) => {
  try {
    const response = await fetch(`${ANALYTICS_BASE_URL}/analyze_student_images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        job_id: `${meetingId}_${userId}`,
        image_urls: imageUrls,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analysis API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to submit student images for analysis: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to submit student images:', error);
    throw error;
  }
};

export const getAnalysisResults = async (meetingId: string, userId: string): Promise<AnalyticsResponse> => {
  try {
    const response = await fetch(`${ANALYTICS_BASE_URL}/job_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        job_id: `${meetingId}_${userId}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Job status API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get analysis results: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get analysis results:', error);
    throw error;
  }
}; 