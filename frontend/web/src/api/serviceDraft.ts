const SERVICE_DRAFT_URL = 'https://mental-health-prod-v2.eba-cxhtfs2h.us-east-1.elasticbeanstalk.com/api/v1/chat/service-draft';

export interface ServiceDraftResponse {
  message: string;
  data: Record<string, unknown>;
}

export async function submitServiceDraft(
  form: Record<string, unknown>,
  sessionId: string | null,
): Promise<ServiceDraftResponse> {
  const payload = {
    session_id: sessionId,
    data: form,
  };

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
    throw new Error(`HTTP ${response.status} submitting service draft: ${text || response.statusText}`);
  }

  return response.json() as Promise<ServiceDraftResponse>;
}
