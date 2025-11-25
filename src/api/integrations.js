// Base44 has been removed - all integrations now use Supabase
// This file is kept for backwards compatibility

export const Core = {
  InvokeLLM: () => Promise.reject(new Error('Base44 removed. Use Supabase functions instead.')),
  SendEmail: () => Promise.reject(new Error('Base44 removed. Use Supabase functions instead.')),
  UploadFile: () => Promise.reject(new Error('Base44 removed. Use Supabase Storage instead.')),
  GenerateImage: () => Promise.reject(new Error('Base44 removed. Use Supabase functions instead.')),
  ExtractDataFromUploadedFile: () => Promise.reject(new Error('Base44 removed. Use Supabase functions instead.')),
  CreateFileSignedUrl: () => Promise.reject(new Error('Base44 removed. Use Supabase Storage instead.')),
  UploadPrivateFile: () => Promise.reject(new Error('Base44 removed. Use Supabase Storage instead.')),
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;






