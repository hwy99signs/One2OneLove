// Base44 has been removed from this application
// All base44 functionality has been migrated to Supabase
// This file is kept for backwards compatibility but exports nothing

console.warn('⚠️ base44Client.js is deprecated. All functionality has been migrated to Supabase.');

// Export empty mock objects to prevent import errors
export const base44 = {
  auth: {
    me: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase authentication.')),
    updateMe: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
  },
  entities: {},
  integrations: {
    Core: {
      InvokeLLM: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
      SendEmail: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
      UploadFile: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
      GenerateImage: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
      ExtractDataFromUploadedFile: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
      CreateFileSignedUrl: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
      UploadPrivateFile: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
    }
  },
  agents: {
    listConversations: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
    createConversation: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
    deleteConversation: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
    subscribeToConversation: () => () => {},
    getConversation: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
    addMessage: () => Promise.reject(new Error('Base44 has been removed. Please use Supabase.')),
  }
};
