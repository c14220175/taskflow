'use client'
import { Search, Filter, SortAsc } from 'lucide-react'

type TaskFiltersProps = {
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onSortChange: (value: string) => void

  searchQuery: string
  categoryFilter: string
  statusFilter: string
  priorityFilter: string
  sortFilter: string
}

export default function TaskFilters({
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  searchQuery,
  categoryFilter,
  statusFilter,
  priorityFilter,
  sortFilter
}: TaskFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={categoryFilter} // Bind value
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white text-black focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Study">Study</option>
            </select>
          </div>
        </div>

        <div className="flex-1">
          <select
            value={statusFilter} // Bind value
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div className="flex-1">
          <select
            value={priorityFilter} // Bind value
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="flex-1">
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={sortFilter} // Bind value
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white text-black focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sort By</option>
              <option value="deadline-asc">Deadline (Earliest)</option>
              <option value="priority-desc">Priority (Highest)</option>
              <option value="created-desc">Created (Newest)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}