from pathlib import Path
import re

p = Path('src/pages/DateIdeas.jsx')
s = p.read_text()

s = s.replace(
    'import { Heart, Coffee, Utensils, Film, Music, MapPin, Star, Sparkles, Home, TreePine, Waves, Mountain, Plus, Filter, ArrowLeft, Bookmark, Share2, Check } from "lucide-react";',
    'import { Heart, Coffee, Utensils, Film, Music, MapPin, Star, Sparkles, Home, TreePine, Waves, Mountain, Plus, Filter, ArrowLeft, Bookmark, Share2, Check, X } from "lucide-react";',
    1
)

anchor = 'import CustomDateForm from "../components/dateideas/CustomDateForm";'
replacement = anchor + '\nimport { getDateIdeasForLanguage, matchesDateIdeaFilter } from "../components/dateideas/dateIdeasLibrary";'
if anchor not in s:
    raise SystemExit('CustomDateForm import anchor not found')
s = s.replace(anchor, replacement, 1)

s = s.replace(
    'subtitle: "Discover creative and romantic ways to spend quality time together",',
    'subtitle: "52 date ideas — one for every week of the year",',
    1
)

copy_anchor = '    customDateCreated: "Custom date created!",'
copy_replacement = '''    customDateCreated: "Custom date created!",
    week: "Week",
    close: "Close",
    locations: "Location",
    occasions: "Occasion",
    stages: "Relationship Stage",'''
if copy_anchor not in s:
    raise SystemExit('English copy anchor not found')
s = s.replace(copy_anchor, copy_replacement, 1)

state_anchor = "  const [viewMode, setViewMode] = useState('all'); // 'all', 'custom', 'saved'"
state_replacement = state_anchor + "\n  const [selectedIdea, setSelectedIdea] = useState(null);"
if state_anchor not in s:
    raise SystemExit('viewMode state anchor not found')
s = s.replace(state_anchor, state_replacement, 1)

predefined_pattern = re.compile(r"  const predefinedDateIdeas = \[.*?\n  \];\n\n  const allIdeas", re.S)
predefined_replacement = '''  const iconMap = {
    heart: Heart,
    coffee: Coffee,
    utensils: Utensils,
    film: Film,
    music: Music,
    map: MapPin,
    star: Star,
    sparkles: Sparkles,
    home: Home,
    tree: TreePine,
    waves: Waves,
    mountain: Mountain,
  };

  const dateIdeaColors = [
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-amber-500 to-orange-500',
    'from-blue-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-green-500 to-emerald-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-cyan-500',
  ];

  const predefinedDateIdeas = getDateIdeasForLanguage(currentLanguage).map((idea, index) => ({
    ...idea,
    icon: iconMap[idea.iconKey] || Heart,
    color: dateIdeaColors[index % dateIdeaColors.length]
  }));

  const allIdeas'''
s, count = predefined_pattern.subn(predefined_replacement, s, count=1)
if count != 1:
    raise SystemExit(f'Expected to replace predefinedDateIdeas once, replaced {count}')

old_filter = '''  const filteredIdeas = allIdeas.filter(idea => {
    const categoryMatch = selectedCategory === 'all' || idea.category === selectedCategory;
    const budgetMatch = selectedBudget === 'all' || idea.budget === selectedBudget;
    const locationMatch = selectedLocation === 'all' || idea.location_type === selectedLocation;
    const occasionMatch = selectedOccasion === 'all' || idea.occasion === selectedOccasion;
    const stageMatch = selectedStage === 'all' || idea.relationship_stage === selectedStage || idea.relationship_stage === 'any';
    return categoryMatch && budgetMatch && locationMatch && occasionMatch && stageMatch;
  });'''
new_filter = '''  const filteredIdeas = allIdeas.filter(idea => (
    matchesDateIdeaFilter(idea, 'category', selectedCategory) &&
    matchesDateIdeaFilter(idea, 'budget', selectedBudget) &&
    matchesDateIdeaFilter(idea, 'location', selectedLocation) &&
    matchesDateIdeaFilter(idea, 'occasion', selectedOccasion) &&
    matchesDateIdeaFilter(idea, 'stage', selectedStage)
  ));'''
if old_filter not in s:
    raise SystemExit('Original filter block not found')
s = s.replace(old_filter, new_filter, 1)

return_anchor = '''  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">'''
helper_block = '''  const formatOptionList = (values, optionMap) => {
    const list = Array.isArray(values) ? values : values ? [values] : [];
    return list.map(value => optionMap?.[value] || String(value).replaceAll('_', ' ')).join(' • ');
  };

  const formatDifficulty = (value) => {
    if (!value) return '';
    const text = String(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">'''
if return_anchor not in s:
    raise SystemExit('return anchor not found')
s = s.replace(return_anchor, helper_block, 1)

grid_pattern = re.compile(r'''        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">.*?        </div>\n\n        \{filteredIdeas.length === 0 && \(''', re.S)
compact_grid = '''        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea, index) => {
            const Icon = idea.icon || Heart;
            return (
              <motion.button
                type="button"
                key={idea.id || `${idea.title}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.015, 0.25) }}
                onClick={() => setSelectedIdea(idea)}
                className="w-full min-h-[86px] bg-white rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-200 px-4 py-4 text-left flex items-center gap-4"
              >
                <div className={`w-11 h-11 flex-shrink-0 bg-gradient-to-br ${idea.color || 'from-pink-500 to-purple-600'} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-gray-900 leading-snug">{idea.title}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedIdea && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-4"
              onClick={() => setSelectedIdea(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-2xl"
                onClick={(event) => event.stopPropagation()}
                onMouseLeave={() => setSelectedIdea(null)}
              >
                <Card className="bg-white shadow-2xl border-2 border-pink-100 max-h-[85vh] overflow-y-auto">
                  <CardHeader className="relative pr-14">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t.close || 'Close'}
                      onClick={() => setSelectedIdea(null)}
                      className="absolute right-3 top-3 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                      {(() => {
                        const DetailIcon = selectedIdea.icon || Heart;
                        return (
                          <div className={`w-14 h-14 flex-shrink-0 bg-gradient-to-br ${selectedIdea.color || 'from-pink-500 to-purple-600'} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <DetailIcon className="w-7 h-7 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        {selectedIdea.week && (
                          <p className="text-sm font-semibold text-pink-600 mb-1">{t.week || 'Week'} {selectedIdea.week} / 52</p>
                        )}
                        <CardTitle className="text-2xl font-bold text-gray-900">{selectedIdea.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{selectedIdea.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
                      <div><span className="text-gray-500">{t.difficulty}:</span> <span className="font-semibold text-gray-800">{formatDifficulty(selectedIdea.difficulty)}</span></div>
                      <div><span className="text-gray-500">{t.duration}:</span> <span className="font-semibold text-gray-800">{selectedIdea.duration || (selectedIdea.duration_hours ? `${selectedIdea.duration_hours}h` : '')}</span></div>
                      <div><span className="text-gray-500">{t.budget}:</span> <span className="font-semibold text-gray-800">{t.budgetOptions?.[selectedIdea.budget] || selectedIdea.budget}</span></div>
                      <div><span className="text-gray-500">{t.locations || t.locationLabel}:</span> <span className="font-semibold text-gray-800">{formatOptionList(selectedIdea.locations || selectedIdea.location_type, t.locationOptions)}</span></div>
                      <div className="sm:col-span-2"><span className="text-gray-500">{t.occasions || t.occasionLabel}:</span> <span className="font-semibold text-gray-800">{formatOptionList(selectedIdea.occasions || selectedIdea.occasion, t.occasionOptions)}</span></div>
                      <div className="sm:col-span-2"><span className="text-gray-500">{t.stages || t.stageLabel}:</span> <span className="font-semibold text-gray-800">{formatOptionList(selectedIdea.stages || selectedIdea.relationship_stage, t.stageOptions)}</span></div>
                    </div>

                    {selectedIdea.created_by === currentUser?.email && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <Button size="sm" variant="outline" onClick={() => handleSaveDate(selectedIdea)} className={selectedIdea.is_favorite ? 'bg-pink-50 border-pink-300' : ''}>
                          <Bookmark className={`w-4 h-4 mr-2 ${selectedIdea.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                          {t.addToSaved}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShareDate(selectedIdea)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          {t.shareWithPartner}
                        </Button>
                        {!selectedIdea.completed && (
                          <Button size="sm" variant="outline" onClick={() => handleCompleteDate(selectedIdea)}>
                            <Check className="w-4 h-4 mr-2" />
                            {t.markComplete}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredIdeas.length === 0 && ('''
s, count = grid_pattern.subn(compact_grid, s, count=1)
if count != 1:
    raise SystemExit(f'Expected to replace date card grid once, replaced {count}')

p.write_text(s)
print('Date Ideas page rebuilt as compact 52-title library with click-to-open details and multi-value filters.')
