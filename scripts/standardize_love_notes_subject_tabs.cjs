const fs = require('fs');
const path = 'src/pages/LoveNotes.jsx';
let page = fs.readFileSync(path, 'utf8');

const importAnchor = 'import { additionalLoveNotesData } from "../components/lovenotes/additional";';
if (!page.includes(importAnchor)) throw new Error('Love Notes additional data import anchor not found');
page = page.replace(importAnchor, `${importAnchor}\nimport { subjectSupplementalNotes } from "../components/lovenotes/additional/LoveNotesSubjectSupplemental";`);

const oldSubjectBlock = /const allHolidayLabels = \{[\s\S]*?\n\};\n\nconst holidaySubcategoryAssignments = \[[\s\S]*?\n\];/;
if (!oldSubjectBlock.test(page)) throw new Error('Holiday subcategory constants block not found');
const newSubjectBlock = `const allSubjectLabels = {
  en: 'All',
  es: 'Todas',
  fr: 'Toutes',
  it: 'Tutte',
  de: 'Alle',
};

const casualSubjectLabels = {
  en: 'Casual',
  es: 'Casual',
  fr: 'Amical',
  it: 'Informale',
  de: 'Locker',
};

const standardSubjectAssignments = [
  'romantic', 'romantic', 'romantic', 'romantic', 'romantic',
  'family', 'family', 'family', 'family', 'family',
  'casual', 'casual', 'casual', 'casual', 'casual',
];

const dominantSubjectByCategory = {
  romantic: 'romantic',
  lgbtqRomantic: 'romantic',
  family: 'family',
  friends: 'casual',
  dateIdeas: 'romantic',
};

const holidaySubjectAssignments = [
  'romantic', 'romantic', 'romantic', 'family', 'family', 'romantic', 'romantic', 'family', 'casual', 'romantic',
  'romantic', 'romantic', 'casual', 'family', 'casual', 'romantic', 'family', 'casual', 'family', 'romantic',
  'romantic', 'romantic', 'romantic', 'romantic', 'romantic',
  'family', 'family', 'family', 'family', 'family', 'family', 'family', 'family', 'family',
  'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual',
];

const missingYouSubjectAssignments = [
  'romantic', 'romantic', 'romantic', 'romantic', 'romantic',
  'family', 'family', 'family', 'family', 'family',
  'casual', 'casual', 'casual', 'casual', 'casual',
];

const getSubjectForNote = (category, noteIndex, note) => {
  if (note?.subject && ['romantic', 'family', 'casual'].includes(note.subject)) return note.subject;
  if (category === 'holiday') return holidaySubjectAssignments[noteIndex] || standardSubjectAssignments[noteIndex % standardSubjectAssignments.length];
  if (category === 'missingYou') return missingYouSubjectAssignments[noteIndex] || standardSubjectAssignments[noteIndex % standardSubjectAssignments.length];
  if (dominantSubjectByCategory[category]) return dominantSubjectByCategory[category];
  return standardSubjectAssignments[noteIndex % standardSubjectAssignments.length];
};`;
page = page.replace(oldSubjectBlock, newSubjectBlock);

const oldGenerateBlock = `      data[category].forEach((note, noteIndex) => {
        const holidaySubcategory = category === 'holiday'
          ? holidaySubcategoryAssignments[noteIndex]
          : undefined;
        notes.push({
          id: id++,
          ...note,
          category: category,
          ...(holidaySubcategory ? { holidaySubcategory } : {})
        });
      });`;
const newGenerateBlock = `      data[category].forEach((note, noteIndex) => {
        notes.push({
          id: id++,
          ...note,
          category: category,
          subject: getSubjectForNote(category, noteIndex, note),
        });
      });`;
if (!page.includes(oldGenerateBlock)) throw new Error('Existing generateNotes category block not found');
page = page.replace(oldGenerateBlock, newGenerateBlock);

const returnAnchor = `  return notes;\n};`;
if (!page.includes(returnAnchor)) throw new Error('generateNotes return anchor not found');
const supplementalBlock = `  const subjectSupplements = subjectSupplementalNotes[lang] || subjectSupplementalNotes.en;
  Object.entries(subjectSupplements).forEach(([category, bySubject]) => {
    Object.entries(bySubject).forEach(([subject, extraNotes]) => {
      extraNotes.forEach(note => {
        notes.push({
          id: id++,
          ...note,
          category,
          subject,
        });
      });
    });
  });

  return notes;
};`;
page = page.replace(returnAnchor, supplementalBlock);

const oldTabsBlock = /  const holidaySubcategories = \[[\s\S]*?\n  \];\n  const queryClient = useQueryClient\(\);/;
if (!oldTabsBlock.test(page)) throw new Error('Holiday subcategory UI definition not found');
const newTabsBlock = `  const subjectTabs = [
    {
      id: 'all',
      name: allSubjectLabels[currentLanguage] || allSubjectLabels.en,
      neonClass: 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.95),0_0_18px_rgba(34,211,238,0.65)]',
      activeClass: 'border-cyan-200 bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,1),0_0_26px_rgba(34,211,238,0.9)]',
    },
    {
      id: 'romantic',
      name: t.categories.romantic,
      neonClass: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 shadow-[0_0_8px_rgba(232,121,249,0.95),0_0_18px_rgba(217,70,239,0.65)]',
      activeClass: 'border-fuchsia-200 bg-fuchsia-400 text-slate-950 shadow-[0_0_12px_rgba(232,121,249,1),0_0_26px_rgba(217,70,239,0.9)]',
    },
    {
      id: 'family',
      name: t.categories.family,
      neonClass: 'border-lime-300 bg-lime-50 text-lime-700 shadow-[0_0_8px_rgba(163,230,53,0.95),0_0_18px_rgba(132,204,22,0.65)]',
      activeClass: 'border-lime-200 bg-lime-400 text-slate-950 shadow-[0_0_12px_rgba(163,230,53,1),0_0_26px_rgba(132,204,22,0.9)]',
    },
    {
      id: 'casual',
      name: casualSubjectLabels[currentLanguage] || casualSubjectLabels.en,
      neonClass: 'border-violet-300 bg-violet-50 text-violet-700 shadow-[0_0_8px_rgba(196,181,253,0.95),0_0_18px_rgba(139,92,246,0.65)]',
      activeClass: 'border-violet-200 bg-violet-400 text-white shadow-[0_0_12px_rgba(196,181,253,1),0_0_26px_rgba(139,92,246,0.9)]',
    },
  ];
  const queryClient = useQueryClient();`;
page = page.replace(oldTabsBlock, newTabsBlock);

page = page.replaceAll('selectedHolidaySubcategory', 'selectedSubject');
page = page.replaceAll('setSelectedHolidaySubcategory', 'setSelectedSubject');
page = page.replaceAll('holidaySubcategories', 'subjectTabs');

const oldFilter = `    if (selectedCategory === 'holiday' && selectedSubject !== 'all') {
      filtered = filtered.filter(note => note.holidaySubcategory === selectedSubject);
    }`;
const newFilter = `    if (selectedSubject !== 'all') {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }`;
if (!page.includes(oldFilter)) throw new Error('Holiday-only filtering block not found after state rename');
page = page.replace(oldFilter, newFilter);

const oldConditional = `{selectedCategory === 'holiday' && (`;
if (!page.includes(oldConditional)) throw new Error('Holiday-only tab visibility condition not found');
page = page.replace(oldConditional, `{(`);
page = page.replace('aria-label="Holiday note subcategories"', 'aria-label="Love note subjects"');

if (page.includes('holidaySubcategory')) throw new Error('Obsolete holidaySubcategory implementation remains');
if (page.includes('selectedHolidaySubcategory')) throw new Error('Obsolete Holiday-only state remains');
if (!page.includes("id: 'casual'")) throw new Error('Casual subject tab missing');
if (!page.includes("filtered = filtered.filter(note => note.subject === selectedSubject)")) throw new Error('Global subject filter missing');
if (!page.includes('subjectSupplementalNotes')) throw new Error('Subject supplement integration missing');

fs.writeFileSync(path, page);
console.log('Love Notes standardized to global All / Romantic / Family / Casual subject tabs.');
