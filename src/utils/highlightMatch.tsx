import React from 'react';

interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export function HighlightMatch({
  text,
  query,
  className = '',
  highlightClassName = 'bg-yellow-200 text-on-surface font-bold',
}: HighlightMatchProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters and split by whitespace for multiple terms
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (terms.some(term => new RegExp(term, 'i').test(part))) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}

// Utility function for fuzzy matching score
export function fuzzyMatchScore(text: string, query: string): number {
  if (!query.trim()) return 0;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return 100;
  
  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 80;
  
  // Contains query gets medium score
  if (textLower.includes(queryLower)) return 60;
  
  // Fuzzy match - check if all query characters appear in order
  let textIndex = 0;
  let matchCount = 0;
  
  for (const char of queryLower) {
    const foundIndex = textLower.indexOf(char, textIndex);
    if (foundIndex !== -1) {
      matchCount++;
      textIndex = foundIndex + 1;
    }
  }
  
  if (matchCount === queryLower.length) {
    return 40;
  }
  
  return 0;
}

// Sort items by relevance
export function sortByRelevance<T>(
  items: T[],
  query: string,
  getSearchableFields: (item: T) => string[]
): T[] {
  if (!query.trim()) return items;
  
  return items
    .map(item => ({
      item,
      score: getSearchableFields(item).reduce(
        (maxScore, field) => Math.max(maxScore, fuzzyMatchScore(field, query)),
        0
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
