<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use App\Models\TaskChecklistItem;
use Illuminate\Http\Request;

class MyTaskController extends ApiController
{
    /**
     * GET /my-tasks — Employee's tasks for today
     */
    public function index(Request $request)
    {
        $employee = $request->employee;
        $status = $request->input('status'); // Optional filter

        $query = Task::with(['area:id,name,type', 'checklistItems', 'assigner:id,full_name'])
            ->where('assigned_to', $employee->id)
            ->where(function ($q) {
                $q->whereDate('due_date', now()->toDateString())
                    ->orWhere(function ($q2) {
                        // Also show overdue tasks from previous days
                        $q2->where('status', Task::STATUS_OVERDUE);
                    })
                    ->orWhere(function ($q2) {
                        // Show in-progress tasks regardless of date
                        $q2->where('status', Task::STATUS_IN_PROGRESS);
                    })
                    ->orWhereNull('due_date'); // Tasks without due date always show
            });

        if ($status) {
            $query->where('status', $status);
        }

        $tasks = $query->orderByRaw("CASE status
                WHEN 'IN_PROGRESS' THEN 1
                WHEN 'OVERDUE' THEN 2
                WHEN 'PENDING' THEN 3
                WHEN 'COMPLETED' THEN 4
                END")
            ->orderBy('priority')
            ->orderBy('due_time')
            ->get();

        // Group by status for the frontend
        $grouped = [
            'in_progress' => $tasks->where('status', Task::STATUS_IN_PROGRESS)->values(),
            'pending' => $tasks->where('status', Task::STATUS_PENDING)->values(),
            'overdue' => $tasks->where('status', Task::STATUS_OVERDUE)->values(),
            'completed' => $tasks->where('status', Task::STATUS_COMPLETED)->values(),
        ];

        return $this->success([
            'tasks' => $grouped,
            'summary' => [
                'total' => $tasks->count(),
                'pending' => $tasks->where('status', Task::STATUS_PENDING)->count(),
                'in_progress' => $tasks->where('status', Task::STATUS_IN_PROGRESS)->count(),
                'completed' => $tasks->where('status', Task::STATUS_COMPLETED)->count(),
                'overdue' => $tasks->where('status', Task::STATUS_OVERDUE)->count(),
            ],
        ]);
    }

    /**
     * PATCH /my-tasks/{id}/start — Start a task
     */
    public function start(Request $request, string $id)
    {
        $employee = $request->employee;
        $task = Task::where('assigned_to', $employee->id)->findOrFail($id);

        if (!in_array($task->status, [Task::STATUS_PENDING, Task::STATUS_OVERDUE])) {
            return $this->error('TASK_INVALID_STATUS', 'Solo se pueden iniciar tareas pendientes', 422);
        }

        $task->update([
            'status' => Task::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ]);

        $task->load(['area:id,name,type', 'checklistItems']);

        return $this->success($task);
    }

    /**
     * PATCH /my-tasks/{id}/complete — Complete a task
     */
    public function complete(Request $request, string $id)
    {
        $employee = $request->employee;
        $task = Task::with('checklistItems')->where('assigned_to', $employee->id)->findOrFail($id);

        if ($task->status !== Task::STATUS_IN_PROGRESS) {
            return $this->error('TASK_INVALID_STATUS', 'Solo se pueden completar tareas en progreso', 422);
        }

        // Check required checklist items
        $requiredIncomplete = $task->checklistItems
            ->where('is_required', true)
            ->where('is_completed', false)
            ->count();

        if ($requiredIncomplete > 0) {
            return $this->error('CHECKLIST_INCOMPLETE', "Faltan {$requiredIncomplete} items obligatorios del checklist", 422);
        }

        $task->update([
            'status' => Task::STATUS_COMPLETED,
            'completed_at' => now(),
            'completion_notes' => $request->input('notes'),
        ]);

        $task->load(['area:id,name,type', 'checklistItems']);

        return $this->success($task);
    }

    /**
     * PATCH /my-tasks/{id}/checklist/{itemId} — Toggle checklist item
     */
    public function toggleChecklist(Request $request, string $id, string $itemId)
    {
        $employee = $request->employee;
        $task = Task::where('assigned_to', $employee->id)->findOrFail($id);

        if (!in_array($task->status, [Task::STATUS_IN_PROGRESS, Task::STATUS_PENDING])) {
            return $this->error('TASK_INVALID_STATUS', 'No se puede modificar el checklist de esta tarea', 422);
        }

        $item = TaskChecklistItem::where('task_id', $task->id)->findOrFail($itemId);

        $item->update([
            'is_completed' => !$item->is_completed,
            'completed_at' => !$item->is_completed ? now() : null,
        ]);

        // Return updated task with all checklist items
        $task->load('checklistItems');

        return $this->success([
            'item' => $item->fresh(),
            'checklist_progress' => [
                'total' => $task->checklistItems->count(),
                'completed' => $task->checklistItems->where('is_completed', true)->count(),
            ],
        ]);
    }
}
