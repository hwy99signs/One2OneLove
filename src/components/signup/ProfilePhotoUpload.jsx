import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Profile Photo (Optional)',
    description: 'Add a photo to personalize your profile. You can also add or change it later.',
    upload: 'Click to upload or drag and drop',
    formats: 'PNG, JPG, GIF, or WEBP up to 5 MB',
    remove: 'Remove photo',
    footer: 'Choose a clear image you are comfortable using on your One2OneLove profile.',
    previewAlt: 'Profile photo preview',
    tooLarge: 'The image must be smaller than 5 MB.',
    invalidType: 'Please choose an image file.',
  },
  es: {
    title: 'Foto de Perfil (Opcional)',
    description: 'Agrega una foto para personalizar tu perfil. También puedes añadirla o cambiarla más adelante.',
    upload: 'Haz clic para subir o arrastra y suelta',
    formats: 'PNG, JPG, GIF o WEBP de hasta 5 MB',
    remove: 'Eliminar foto',
    footer: 'Elige una imagen clara que te resulte cómoda para usar en tu perfil de One2OneLove.',
    previewAlt: 'Vista previa de la foto de perfil',
    tooLarge: 'La imagen debe pesar menos de 5 MB.',
    invalidType: 'Elige un archivo de imagen.',
  },
  fr: {
    title: 'Photo de Profil (Facultatif)',
    description: 'Ajoutez une photo pour personnaliser votre profil. Vous pourrez aussi l’ajouter ou la modifier plus tard.',
    upload: 'Cliquez pour importer ou glissez-déposez',
    formats: 'PNG, JPG, GIF ou WEBP jusqu’à 5 Mo',
    remove: 'Supprimer la photo',
    footer: 'Choisissez une image claire que vous acceptez d’utiliser sur votre profil One2OneLove.',
    previewAlt: 'Aperçu de la photo de profil',
    tooLarge: 'L’image doit faire moins de 5 Mo.',
    invalidType: 'Veuillez choisir un fichier image.',
  },
  it: {
    title: 'Foto Profilo (Facoltativa)',
    description: 'Aggiungi una foto per personalizzare il profilo. Potrai anche aggiungerla o cambiarla in seguito.',
    upload: 'Fai clic per caricare oppure trascina e rilascia',
    formats: 'PNG, JPG, GIF o WEBP fino a 5 MB',
    remove: 'Rimuovi foto',
    footer: 'Scegli un’immagine chiara che ti senti a tuo agio a usare sul profilo One2OneLove.',
    previewAlt: 'Anteprima della foto profilo',
    tooLarge: 'L’immagine deve essere inferiore a 5 MB.',
    invalidType: 'Scegli un file immagine.',
  },
  de: {
    title: 'Profilfoto (Optional)',
    description: 'Füge ein Foto hinzu, um dein Profil persönlicher zu machen. Du kannst es auch später hinzufügen oder ändern.',
    upload: 'Zum Hochladen klicken oder Datei hierher ziehen',
    formats: 'PNG, JPG, GIF oder WEBP bis 5 MB',
    remove: 'Foto entfernen',
    footer: 'Wähle ein klares Bild, das du gerne in deinem One2OneLove-Profil verwendest.',
    previewAlt: 'Vorschau des Profilfotos',
    tooLarge: 'Das Bild muss kleiner als 5 MB sein.',
    invalidType: 'Bitte wähle eine Bilddatei aus.',
  },
};

export default function ProfilePhotoUpload({
  photoFile,
  setPhotoFile,
  photoPreview,
  setPhotoPreview,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const handleFileChange = (file) => {
    setErrorMessage('');
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage(t.invalidType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(t.tooLarge);
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === 'dragenter' || event.type === 'dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files?.[0]) handleFileChange(event.dataTransfer.files[0]);
  };

  const handleRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrorMessage('');
  };

  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <h3 className="flex items-center text-lg font-semibold text-gray-800">
        <Camera aria-hidden="true" className="mr-2 text-blue-600" size={20} />
        {t.title}
      </h3>
      <p className="text-sm text-gray-600">{t.description}</p>

      {errorMessage && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}

      {!photoPreview ? (
        <div
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            aria-label={t.upload}
            onChange={(event) => event.target.files?.[0] && handleFileChange(event.target.files[0])}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center space-y-3" aria-hidden="true">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Upload className="text-blue-600" size={32} />
            </div>
            <div>
              <p className="font-medium text-gray-700">{t.upload}</p>
              <p className="mt-1 text-sm text-gray-500">{t.formats}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg">
            <img src={photoPreview} alt={t.previewAlt} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">{photoFile?.name}</p>
            <p className="mt-1 text-xs text-gray-500">{photoFile ? `${(photoFile.size / 1024).toFixed(1)} KB` : ''}</p>
            <button type="button" onClick={handleRemove} className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
              <X aria-hidden="true" size={16} />
              <span>{t.remove}</span>
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">{t.footer}</p>
    </div>
  );
}
