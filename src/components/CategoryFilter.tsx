'use client';

import { EventCategory } from '@/types';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'Tümü' },
    { value: 'Sanat', label: 'Sanat' },
    { value: 'Spor', label: 'Spor' },
    { value: 'Teknoloji', label: 'Teknoloji' },
    { value: 'Girişimcilik', label: 'Girişimcilik' },
  ];

  return (
    <div className="flex flex-col gap-4 mb-8 w-full">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.value;
        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            style={isSelected ? { backgroundColor: 'var(--primary-color)' } : undefined}
            className={`
                w-full text-left px-4 py-3 border-2 border-black font-bold uppercase tracking-wide transition-all duration-200 relative
                ${isSelected 
                    ? 'bg-primary text-white shadow-none translate-x-[2px] translate-y-[2px]' 
                    : 'bg-white dark:bg-neutral-900 text-black dark:text-white border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                }
            `}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
