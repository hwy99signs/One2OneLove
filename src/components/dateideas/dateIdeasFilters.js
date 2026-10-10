export const matchesDateIdeaFilter = (idea, filter, value) => {
  if (value === 'all') return true;
  if (filter === 'budget') return idea.budget === value;

  const aliases = {
    category: ['categories', 'category'],
    location: ['locations', 'location_type'],
    occasion: ['occasions', 'occasion'],
    stage: ['stages', 'relationship_stage']
  };

  const [arrayKey, scalarKey] = aliases[filter] || [];
  const list = Array.isArray(idea?.[arrayKey])
    ? idea[arrayKey]
    : idea?.[scalarKey]
      ? [idea[scalarKey]]
      : [];

  return list.includes(value) || (filter === 'stage' && list.includes('any'));
};

