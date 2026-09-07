export const createCloudflareFunctions = (getAccessToken) => ({
  async invoke(name, options = {}) {
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/functions/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(options?.body || {}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          data: null,
          error: new Error(data?.error || `Function ${name} failed`),
        };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
});
