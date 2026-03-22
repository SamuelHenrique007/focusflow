import { api } from "./api";

export type TaskStatus = "pendente" | "em_progresso" | "concluida";
export type TaskCategory = "estudo" | "trabalho" | "pessoal";
export type TaskPriority = "alta" | "media" | "baixa";

export type TaskSubtask = {
  id?: number;
  title: string;
};

type TaskApi = {
  id: number;
  title: string;
  description?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  due_label: string;
  pomodoro_total: number;
  pomodoro_done: number;
  progress: number;
  subtasks: TaskSubtask[];
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueLabel: string;
  pomodoroDone: number;
  pomodoroTotal: number;
  progress?: number;
  status: TaskStatus;
  subtasks?: string[];
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskRequest = {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  pomodoro_total: number;
  pomodoro_done?: number;
  subtasks?: TaskSubtask[];
};

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

function mapTaskFromApi(task: TaskApi): Task {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description ?? undefined,
    category: task.category,
    priority: task.priority,
    dueLabel: task.due_label,
    pomodoroDone: task.pomodoro_done,
    pomodoroTotal: task.pomodoro_total,
    progress: typeof task.progress === "number" ? task.progress : undefined,
    status: task.status,
    subtasks: task.subtasks?.map((item) => item.title) ?? [],
    dueDate: task.due_date ?? null,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

export async function listTasks(): Promise<Task[]> {
  const response = await api.get<TaskApi[]>("/tasks/");
  return response.data.map(mapTaskFromApi);
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const response = await api.post<TaskApi>("/tasks/", data);
  return mapTaskFromApi(response.data);
}

export async function updateTask(
  id: string | number,
  data: UpdateTaskRequest,
): Promise<Task> {
  const response = await api.patch<TaskApi>(`/tasks/${id}/`, data);
  return mapTaskFromApi(response.data);
}

export async function deleteTask(id: string | number): Promise<void> {
  await api.delete(`/tasks/${id}/`);
}