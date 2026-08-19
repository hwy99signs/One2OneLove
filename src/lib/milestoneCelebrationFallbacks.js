const fallbacks = {
  en: {
    loveNotes: [
      'This moment is part of the story we are building together, and I am grateful I get to share it with you.',
      'Celebrating this milestone reminds me how much our journey means to me. Thank you for being part of it.',
      'Every meaningful chapter deserves to be noticed. I love the life and memories we continue creating together.'
    ],
    dates: [
      'Revisit a place that represents this chapter of your relationship and talk about what you remember most.',
      'Plan a simple celebration meal and each share one favorite memory from this milestone.',
      'Create a new tradition you can repeat whenever this milestone comes around again.'
    ],
    gifts: [
      'A printed photo or small keepsake connected to the milestone',
      'A handwritten letter dated for this celebration',
      'A simple memory box for photos, notes, and small reminders of this chapter'
    ]
  },
  es: {
    loveNotes: [
      'Este momento forma parte de la historia que estamos construyendo juntos, y agradezco poder compartirlo contigo.',
      'Celebrar este hito me recuerda cuánto significa nuestro camino para mí. Gracias por ser parte de él.',
      'Cada capítulo importante merece ser reconocido. Amo la vida y los recuerdos que seguimos creando juntos.'
    ],
    dates: [
      'Vuelvan a un lugar que represente esta etapa de su relación y hablen de lo que más recuerdan.',
      'Planeen una comida sencilla de celebración y compartan cada uno un recuerdo favorito de este hito.',
      'Creen una nueva tradición que puedan repetir cada vez que llegue nuevamente este hito.'
    ],
    gifts: [
      'Una foto impresa o pequeño recuerdo relacionado con el hito',
      'Una carta escrita a mano con la fecha de esta celebración',
      'Una caja de recuerdos sencilla para fotos, notas y pequeños objetos de esta etapa'
    ]
  },
  fr: {
    loveNotes: [
      'Ce moment fait partie de l’histoire que nous construisons ensemble, et je suis reconnaissant de pouvoir le partager avec toi.',
      'Célébrer ce jalon me rappelle combien notre parcours compte pour moi. Merci d’en faire partie.',
      'Chaque chapitre important mérite d’être reconnu. J’aime la vie et les souvenirs que nous continuons à créer ensemble.'
    ],
    dates: [
      'Retournez dans un lieu qui représente cette étape de votre relation et partagez ce dont vous vous souvenez le plus.',
      'Prévoyez un repas simple pour célébrer et partagez chacun un souvenir préféré lié à ce jalon.',
      'Créez une nouvelle tradition que vous pourrez répéter lorsque ce jalon reviendra.'
    ],
    gifts: [
      'Une photo imprimée ou un petit souvenir lié à ce jalon',
      'Une lettre écrite à la main et datée pour cette célébration',
      'Une petite boîte à souvenirs pour conserver photos, notes et objets de cette étape'
    ]
  },
  it: {
    loveNotes: [
      'Questo momento fa parte della storia che stiamo costruendo insieme e sono grato di poterlo condividere con te.',
      'Celebrare questo traguardo mi ricorda quanto significhi per me il nostro percorso. Grazie per farne parte.',
      'Ogni capitolo importante merita di essere riconosciuto. Amo la vita e i ricordi che continuiamo a creare insieme.'
    ],
    dates: [
      'Tornate in un luogo che rappresenta questa fase della relazione e raccontate ciò che ricordate di più.',
      'Organizzate un semplice pasto di festa e condividete ciascuno un ricordo preferito legato a questo traguardo.',
      'Create una nuova tradizione da ripetere ogni volta che questo traguardo ritorna.'
    ],
    gifts: [
      'Una foto stampata o un piccolo ricordo collegato al traguardo',
      'Una lettera scritta a mano e datata per questa celebrazione',
      'Una semplice scatola dei ricordi per foto, note e piccoli oggetti di questa fase'
    ]
  },
  de: {
    loveNotes: [
      'Dieser Moment gehört zu der Geschichte, die wir gemeinsam aufbauen, und ich bin dankbar, ihn mit dir teilen zu dürfen.',
      'Diesen Meilenstein zu feiern erinnert mich daran, wie viel mir unser gemeinsamer Weg bedeutet. Danke, dass du ein Teil davon bist.',
      'Jedes wichtige Kapitel verdient Aufmerksamkeit. Ich liebe das Leben und die Erinnerungen, die wir weiterhin gemeinsam schaffen.'
    ],
    dates: [
      'Besucht einen Ort, der für diesen Abschnitt eurer Beziehung steht, und erzählt euch, woran ihr euch am liebsten erinnert.',
      'Plant ein einfaches gemeinsames Essen und teilt jeweils eine Lieblingserinnerung an diesen Meilenstein.',
      'Schafft eine neue Tradition, die ihr wiederholen könnt, wenn dieser Meilenstein erneut ansteht.'
    ],
    gifts: [
      'Ein gedrucktes Foto oder ein kleines Erinnerungsstück zu diesem Meilenstein',
      'Ein handgeschriebener Brief mit dem Datum dieser Feier',
      'Eine kleine Erinnerungsbox für Fotos, Notizen und Dinge aus diesem Abschnitt'
    ]
  }
};

export const getMilestoneCelebrationFallback = (language) => fallbacks[language] || fallbacks.en;
