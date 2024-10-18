import React from 'react'

export default function Sidebar({ categories, activeCategory, onCategoryChange }) {
  return (
    <aside className="w-full md:w-64 mb-8 md:mb-0">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        <div className="space-y-2">
          {categories.map(category => (
            <button
              key={category}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeCategory === category
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}