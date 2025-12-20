'use client'
import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

type TaskFiltersProps = {
  onSearchChange: (query: string) => void
  onCategoryChange: (category: string) => void
  onStatusChange: (status: string) => void
  onPriorityChange: (priority: string) => void
  onSortChange: (sort: string) => void
}

export default function TaskFilters({ onSearchChange, onCategoryChange, onStatusChange, onPriorityChange, onSortChange }: TaskFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [selectedSort, setSelectedSort] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearchChange(query)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value
    setSelectedCategory(category)
    onCategoryChange(category)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value
    setSelectedStatus(status)
    onStatusChange(status)
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value
    setSelectedPriority(priority)
    onPriorityChange(priority)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value
    setSelectedSort(sort)
    onSortChange(sort)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedStatus('')
    setSelectedPriority('')
    setSelectedSort('')
    onSearchChange('')
    onCategoryChange('')
    onStatusChange('')
    onPriorityChange('')
    onSortChange('')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="">All Categories</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Health">Health</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={selectedPriority}
            onChange={handlePriorityChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="">All Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <select
            value={selectedSort}
            onChange={handleSortChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="">Default Sort</option>
            <option value="deadline-asc">Deadline (Urgent First)</option>
            <option value="priority-desc">Priority (High First)</option>
            <option value="created-desc">Newest First</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedCategory || selectedStatus || selectedPriority || selectedSort) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}