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
            className={`
                w-full text-left px-4 py-3 border-2 border-black font-bold uppercase tracking-wide transition-all duration-200 relative
                ${isSelected 
                    ? 'bg-[#C8102E] text-white shadow-none translate-x-[2px] translate-y-[2px]' 
                    : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
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
