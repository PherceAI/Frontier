<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use App\Models\TaskTemplate;
use App\Models\TaskChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends ApiController
{
    /**
     * GET /tasks — List tasks with filters
     */
    public function index(Request $request)
    {
        $query = Task::with(['assignee:id,full_name,employee_code', 'area:id,name,type', 'checklistItems'])
            ->where('company_id', $this->getCompanyId($request));

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('area_id')) {
            $query->where('area_id', $request->input('area_id'));
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->input('assigned_to'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }
        if ($request->filled('due_date')) {
            $query->whereDate('due_date', $request->input('due_date'));
        }
        if ($request->filled('from')) {
            $query->whereDate('due_date', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('due_date', '<=', $request->input('to'));
        }

        $tasks = $query->orderByRaw("CASE status
            WHEN 'OVERDUE' THEN 1
            WHEN 'IN_PROGRESS' THEN 2
            WHEN 'PENDING' THEN 3
            WHEN 'COMPLETED' THEN 4
            WHEN 'CANCELLED' THEN 5
            END")
            ->orderBy('priority')
            ->orderBy('due_date')
            ->paginate($request->input('limit', 50));

        return $this->success($tasks);
    }

    /**
     * POST /tasks — Create task (ad-hoc or from template)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'area_id' => 'nullable|uuid|exists:operational_areas,id',
            'assigned_to' => 'nullable|uuid|exists:employees,id',
            'template_id' => 'nullable|uuid|exists:task_templates,id',
            'priority' => 'nullable|integer|in:1,2,3',
            'due_date' => 'nullable|date',
            'due_time' => 'nullable|date_format:H:i',
            'checklist' => 'nullable|array',
            'checklist.*.label' => 'required_with:checklist|string|max:255',
            'checklist.*.is_required' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('VALIDATION_ERROR', $validator->errors()->first(), 422, $validator->errors());
        }

        $companyId = $this->getCompanyId($request);
        $data = $validator->validated();

        // If creating from template, load template defaults
        $checklist = $data['checklist'] ?? [];
        if (!empty($data['template_id'])) {
            $template = TaskTemplate::find($data['template_id']);
            if ($template && empty($checklist)) {
                $checklist = $template->checklist_template ?? [];
            }
            if ($template && empty($data['area_id'])) {
                $data['area_id'] = $template->area_id;
            }
        }

        $task = Task::create([
            'company_id' => $companyId,
            'template_id' => $data['template_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'area_id' => $data['area_id'] ?? null,
            'assigned_to' => $data['assigned_to'] ?? null,
            'assigned_by' => $request->user->id ?? null,
            'status' => Task::STATUS_PENDING,
            'priority' => $data['priority'] ?? 2,
            'due_date' => $data['due_date'] ?? null,
            'due_time' => $data['due_time'] ?? null,
        ]);

        // Create checklist items
        foreach ($checklist as $i => $item) {
            TaskChecklistItem::create([
                'task_id' => $task->id,
                'label' => $item['label'],
                'is_required' => $item['is_required'] ?? $item['required'] ?? false,
                'sort_order' => $i,
            ]);
        }

        $task->load(['assignee:id,full_name,employee_code', 'area:id,name,type', 'checklistItems']);

        return $this->success($task, 201);
    }

    /**
     * PATCH /tasks/{id} — Update task
     */
    public function update(Request $request, string $id)
    {
        $task = Task::where('company_id', $this->getCompanyId($request))->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'area_id' => 'nullable|uuid|exists:operational_areas,id',
            'assigned_to' => 'nullable|uuid|exists:employees,id',
            'priority' => 'nullable|integer|in:1,2,3',
            'status' => 'nullable|string|in:PENDING,IN_PROGRESS,COMPLETED,OVERDUE,CANCELLED',
            'due_date' => 'nullable|date',
            'due_time' => 'nullable|date_format:H:i',
            'completion_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('VALIDATION_ERROR', $validator->errors()->first(), 422);
        }

        $data = $validator->validated();

        // Auto-set timestamps based on status
        if (isset($data['status'])) {
            if ($data['status'] === Task::STATUS_IN_PROGRESS && !$task->started_at) {
                $data['started_at'] = now();
            }
            if ($data['status'] === Task::STATUS_COMPLETED) {
                $data['completed_at'] = now();
            }
        }

        $task->update($data);
        $task->load(['assignee:id,full_name,employee_code', 'area:id,name,type', 'checklistItems']);

        return $this->success($task);
    }

    /**
     * DELETE /tasks/{id} — Cancel task (soft)
     */
    public function destroy(Request $request, string $id)
    {
        $task = Task::where('company_id', $this->getCompanyId($request))->findOrFail($id);
        $task->update(['status' => Task::STATUS_CANCELLED]);

        return $this->success(['message' => 'Tarea cancelada']);
    }

    /**
     * GET /tasks/stats — Compliance statistics
     */
    public function stats(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $from = $request->input('from', now()->startOfWeek()->toDateString());
        $to = $request->input('to', now()->toDateString());

        $tasks = Task::where('company_id', $companyId)
            ->whereBetween('due_date', [$from, $to])
            ->get();

        $total = $tasks->count();
        $completed = $tasks->where('status', Task::STATUS_COMPLETED)->count();
        $overdue = $tasks->where('status', Task::STATUS_OVERDUE)->count();
        $pending = $tasks->where('status', Task::STATUS_PENDING)->count();
        $inProgress = $tasks->where('status', Task::STATUS_IN_PROGRESS)->count();

        return $this->success([
            'period' => ['from' => $from, 'to' => $to],
            'total' => $total,
            'completed' => $completed,
            'overdue' => $overdue,
            'pending' => $pending,
            'in_progress' => $inProgress,
            'compliance_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
        ]);
    }

    // ─── Task Templates ──────────────────────

    /**
     * GET /task-templates
     */
    public function indexTemplates(Request $request)
    {
        $templates = TaskTemplate::with('area:id,name,type')
            ->where('company_id', $this->getCompanyId($request))
            ->where('is_active', true)
            ->orderBy('title')
            ->get();

        return $this->success($templates);
    }

    /**
     * POST /task-templates
     */
    public function storeTemplate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'area_id' => 'nullable|uuid|exists:operational_areas,id',
            'priority' => 'nullable|integer|in:1,2,3',
            'estimated_minutes' => 'nullable|integer|min:1',
            'recurrence_rule' => 'nullable|string|max:100',
            'checklist_template' => 'nullable|array',
            'checklist_template.*.label' => 'required_with:checklist_template|string|max:255',
            'checklist_template.*.required' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('VALIDATION_ERROR', $validator->errors()->first(), 422);
        }

        $template = TaskTemplate::create([
            'company_id' => $this->getCompanyId($request),
            ...$validator->validated(),
        ]);

        $template->load('area:id,name,type');
        return $this->success($template, 201);
    }

    /**
     * PATCH /task-templates/{id}
     */
    public function updateTemplate(Request $request, string $id)
    {
        $template = TaskTemplate::where('company_id', $this->getCompanyId($request))->findOrFail($id);
        $template->update($request->only([
            'title',
            'description',
            'area_id',
            'priority',
            'estimated_minutes',
            'recurrence_rule',
            'checklist_template',
            'is_active',
        ]));

        $template->load('area:id,name,type');
        return $this->success($template);
    }

    /**
     * DELETE /task-templates/{id}
     */
    public function destroyTemplate(Request $request, string $id)
    {
        $template = TaskTemplate::where('company_id', $this->getCompanyId($request))->findOrFail($id);
        $template->update(['is_active' => false]);

        return $this->success(['message' => 'Plantilla desactivada']);
    }

    /**
     * Extract company_id from authenticated admin user
     */
    private function getCompanyId(Request $request): string
    {
        return $request->user->company_id;
    }
}
