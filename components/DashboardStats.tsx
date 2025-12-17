'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, Clock, AlertCircle, BarChart3 } from 'lucide-react'

type Stats = {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  categoryStats: { [key: string]: number }
  priorityStats: { [key: string]: number }
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    categoryStats: {},
    priorityStats: {}
  })
  const supabase = createClient()

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('status, category, priority')
    
    if (data) {
      const totalTasks = data.length
      const completedTasks = data.filter(task => task.status === 'Done').length
      const inProgressTasks = data.filter(task => task.status === 'In Progress').length
      const todoTasks = data.filter(task => task.status === 'To Do').length
      
      // Category statistics
      const categoryStats = data.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
      
      // Priority statistics
      const priorityStats = data.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
      
      setStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        categoryStats,
        priorityStats
      })
    }
  }

  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel('stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalTasks}</p>
            </div>
            <BarChart3 className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">To Do</p>
              <p className="text-2xl font-bold text-gray-600">{stats.todoTasks}</p>
            </div>
            <AlertCircle className="text-gray-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTasks}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-black">Completion Rate</h3>
          <span className="text-sm font-medium text-gray-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>
      
      {/* Category & Priority Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Stats */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-black mb-3">Tasks by Category</h3>
          <div className="space-y-2">
            {Object.entries(stats.categoryStats).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-black">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Priority Stats */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-black mb-3">Tasks by Priority</h3>
          <div className="space-y-2">
            {Object.entries(stats.priorityStats).map(([priority, count]) => {
              const colorClass = priority === 'High' ? 'text-red-600' : 
                               priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              return (
                <div key={priority} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{priority}</span>
                  <span className={`text-sm font-medium ${colorClass}`}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}