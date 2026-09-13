const fs = require('fs');
const path = 'src/pages/LoveNotes.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const count = src.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  src = src.replace(oldText, newText);
}

replaceOnce(
`  ];\n  const queryClient = useQueryClient();`,
`  ];\n  const missingYouSubcategories = holidaySubcategories.filter((subcategory) => subcategory.id !== 'all');\n  const queryClient = useQueryClient();`,
'Missing You subcategory definitions'
);

replaceOnce(
`  const [selectedHolidaySubcategory, setSelectedHolidaySubcategory] = useState('all');\n  const [searchQuery, setSearchQuery] = useState('');`,
`  const [selectedHolidaySubcategory, setSelectedHolidaySubcategory] = useState('all');\n  const [selectedMissingYouSubcategory, setSelectedMissingYouSubcategory] = useState('all');\n  const [searchQuery, setSearchQuery] = useState('');`,
'Missing You state'
);

replaceOnce(
`    if (selectedCategory === 'holiday' && selectedHolidaySubcategory !== 'all') {\n      filtered = filtered.filter(note => note.holidaySubcategory === selectedHolidaySubcategory);\n    }\n\n    const personalizedNotes = filtered.map(note => personalizeNote(note));`,
`    if (selectedCategory === 'holiday' && selectedHolidaySubcategory !== 'all') {\n      filtered = filtered.filter(note => note.holidaySubcategory === selectedHolidaySubcategory);\n    }\n\n    if (selectedCategory === 'missingYou' && selectedMissingYouSubcategory !== 'all') {\n      filtered = filtered.filter(note => Array.isArray(note.tags) && note.tags.includes(selectedMissingYouSubcategory));\n    }\n\n    const personalizedNotes = filtered.map(note => personalizeNote(note));`,
'Missing You filter'
);

replaceOnce(
`  }, [selectedCategory, selectedHolidaySubcategory, searchQuery, partnerName, petName, specialPlace, allNotes]);`,
`  }, [selectedCategory, selectedHolidaySubcategory, selectedMissingYouSubcategory, searchQuery, partnerName, petName, specialPlace, allNotes]);`,
'Missing You memo dependency'
);

replaceOnce(
`    setSelectedCategory(categoryId);\n    setSelectedHolidaySubcategory('all');\n    setSearchQuery('');`,
`    setSelectedCategory(categoryId);\n    setSelectedHolidaySubcategory('all');\n    setSelectedMissingYouSubcategory('all');\n    setSearchQuery('');`,
'Random category reset'
);

replaceOnce(
`                  setSelectedCategory(category.id);\n                  setSelectedHolidaySubcategory('all');\n                  setSearchQuery('');`,
`                  setSelectedCategory(category.id);\n                  setSelectedHolidaySubcategory('all');\n                  setSelectedMissingYouSubcategory('all');\n                  setSearchQuery('');`,
'Category button reset'
);

const holidayRender = `        {selectedCategory === 'holiday' && (\n          <div className="mb-5 flex justify-center">\n            <div\n              className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 p-1.5 shadow-sm"\n              role="tablist"\n              aria-label="Holiday note subcategories"\n            >\n              {holidaySubcategories.map((subcategory) => (\n                <button\n                  key={subcategory.id}\n                  type="button"\n                  role="tab"\n                  aria-selected={selectedHolidaySubcategory === subcategory.id}\n                  onClick={() => {\n                    setSelectedHolidaySubcategory(subcategory.id);\n                    setSearchQuery('');\n                  }}\n                  className={\`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold tracking-wide transition-all animate-pulse motion-reduce:animate-none hover:scale-105 \${\n                    selectedHolidaySubcategory === subcategory.id\n                      ? subcategory.activeClass\n                      : subcategory.neonClass\n                  }\`}\n                  style={{ animationDuration: '0.9s' }}\n                >\n                  {subcategory.name}\n                </button>\n              ))}\n            </div>\n          </div>\n        )}`;

const missingYouRender = `${holidayRender}\n\n        {selectedCategory === 'missingYou' && (\n          <div className="mb-5 flex justify-center">\n            <div\n              className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 p-1.5 shadow-sm"\n              role="tablist"\n              aria-label="Missing You note subcategories"\n            >\n              {missingYouSubcategories.map((subcategory) => (\n                <button\n                  key={subcategory.id}\n                  type="button"\n                  role="tab"\n                  aria-selected={selectedMissingYouSubcategory === subcategory.id}\n                  onClick={() => {\n                    setSelectedMissingYouSubcategory((current) => current === subcategory.id ? 'all' : subcategory.id);\n                    setSearchQuery('');\n                  }}\n                  className={\`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold tracking-wide transition-all animate-pulse motion-reduce:animate-none hover:scale-105 \${\n                    selectedMissingYouSubcategory === subcategory.id\n                      ? subcategory.activeClass\n                      : subcategory.neonClass\n                  }\`}\n                  style={{ animationDuration: '0.9s' }}\n                >\n                  {subcategory.name}\n                </button>\n              ))}\n            </div>\n          </div>\n        )}`;

replaceOnce(holidayRender, missingYouRender, 'Missing You neon tab renderer');

fs.writeFileSync(path, src);

for (const marker of [
  "selectedCategory === 'missingYou'",
  'missingYouSubcategories.map',
  'selectedMissingYouSubcategory',
  "note.tags.includes(selectedMissingYouSubcategory)",
  'aria-label="Missing You note subcategories"'
]) {
  if (!src.includes(marker)) throw new Error(`Missing marker after patch: ${marker}`);
}

console.log('Missing You Romantic / Family / Friends neon tabs wired successfully.');
