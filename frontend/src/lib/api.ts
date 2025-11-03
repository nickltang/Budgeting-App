const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        // Skip ngrok warning page for automated requests
        'ngrok-skip-browser-warning': 'true',
        ...options?.headers,
      },
    });

    // Check if response is HTML (ngrok warning page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Received HTML instead of JSON. This might be ngrok\'s warning page. Try visiting the ngrok URL directly in a browser first.');
    }

    if (!response.ok) {
      const error = await response.json().catch(async () => {
        // If JSON parsing fails, try to get text
        const text = await response.text().catch(() => 'Unknown error');
        return { error: text || `HTTP ${response.status}` };
      });
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors (backend not running, CORS issues, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${API_URL}. Make sure the backend is running and ngrok is active.`);
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

