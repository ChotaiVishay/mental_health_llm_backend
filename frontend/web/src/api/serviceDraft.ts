// web/src/api/serviceDraft.ts
import { VITE } from '@/utils/env';

const API_BASE_URL = 
  VITE.VITE_API_BASE_URL?.trim() || 
  'https://d1hfq1dvtow5bt.cloudfront.net';

const SERVICE_DRAFT_URL = `${API_BASE_URL}/api/v1/chat/service-draft`;

export interface ServiceDraftResponse {
  message: string;
  data: Record<string, unknown>;
}

export async function submitServiceDraft(
  form: Record<string, unknown>,
  sessionId: string | null,
): Promise<ServiceDraftResponse> {
  try {
    const payload = {
      session_id: sessionId,
      data: form,
    };

    console.log('Submitting service draft to:', SERVICE_DRAFT_URL);
    console.log('Draft payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(SERVICE_DRAFT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Service draft submission error:', text);
      throw new Error(
        `HTTP ${response.status} submitting service draft: ${text || response.statusText}`
      );
    }

    const result = await response.json() as ServiceDraftResponse;
    console.log('Service draft submitted successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Error submitting service draft:', error);
    throw error;
  }
}