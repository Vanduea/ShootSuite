/**
 * Task Management Page
 */

'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, Plus, Check, X } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*, tasks(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function TasksPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const [newTask, setNewTask] = useState({
    description: '',
    due_date: '',
    priority: 'Medium',
  })
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          job_id: jobId,
          description: newTask.description,
          due_date: newTask.due_date || null,
          priority: newTask.priority,
          is_done: false,
        })

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      setNewTask({ description: '', due_date: '', priority: 'Medium' })
      setShowAddForm(false)
    } catch (err: any) {
      alert(err.message || 'Failed to add task')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_done: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', taskId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to delete task')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-body text-text-muted">Loading...</p>
      </Card>
    )
  }

  const tasks = job?.tasks || []
  const pendingTasks = tasks.filter((t: any) => !t.is_done)
  const completedTasks = tasks.filter((t: any) => t.is_done)

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/jobs/${jobId}`} className="inline-flex items-center text-body text-secondary hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">Tasks</h1>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <Card>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                required
                disabled={isAdding}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-card-title text-text-dark mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  disabled={isAdding}
                />
              </div>

              <div>
                <label className="block text-card-title text-text-dark mb-2">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  disabled={isAdding}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" isLoading={isAdding}>
                Add Task
              </Button>
              <Button
                type="button"
                variant="tertiary"
                onClick={() => {
                  setShowAddForm(false)
                  setNewTask({ description: '', due_date: '', priority: 'Medium' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Pending Tasks */}
      <Card>
        <h2 className="text-section-header text-primary mb-4">
          Pending ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <p className="text-body text-text-muted">No pending tasks.</p>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded border border-border-gray hover:bg-bg-light"
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.is_done)}
                  className="mt-0.5 flex-shrink-0 w-5 h-5 border-2 border-secondary rounded flex items-center justify-center hover:bg-secondary/10 transition-colors"
                >
                  {task.is_done && <Check className="w-3 h-3 text-secondary" />}
                </button>
                <div className="flex-1">
                  <p className="text-body text-text-dark">{task.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {task.due_date && (
                      <span className="text-caption text-text-muted">
                        Due: {formatDate(task.due_date)}
                      </span>
                    )}
                    <span className={`text-caption px-2 py-0.5 rounded ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <h2 className="text-section-header text-primary mb-4">
            Completed ({completedTasks.length})
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded border border-border-gray bg-gray-50"
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.is_done)}
                  className="mt-0.5 flex-shrink-0 w-5 h-5 border-2 border-secondary bg-secondary rounded flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </button>
                <div className="flex-1">
                  <p className="text-body text-text-muted line-through">{task.description}</p>
                  {task.completed_at && (
                    <span className="text-caption text-text-muted">
                      Completed: {formatDate(task.completed_at)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

