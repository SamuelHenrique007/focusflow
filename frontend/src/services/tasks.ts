import { api } from "./api";

export type TaskStatus = "pendente" | "em_andamento" | "concluida";
export type TaskCategory = "estudo" | "trabalho" | "pessoal";
export type TaskPriority = "alta" | "media" | "baixa";

export type TaskSubtaskApi = {
  id?: number;
  title: string;
  isCompleted?: boolean;
};

export type TaskSubtask = {
  id?: number;
  title: string;
  isCompleted?: boolean;
};

type TaskApi = {
  id: number;
  title: string;
  description?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  dueLabel: string;
  pomodoroEstimated: number;
  pomodoroCompleted: number;
  progress: number;
  completedAt?: string | null;
  subtasks: TaskSubtaskApi[];
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: number;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueLabel: string;
  dueDate?: string | null;
  pomodoroEstimated: number;
  pomodoroCompleted: number;
  progress: number;
  completedAt?: string | null;
  subtasks: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskRequest = {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string | null;
  pomodoroEstimated: number;
  pomodoroCompleted?: number;
  subtasks?: TaskSubtask[];
};

export type UpdateTaskRequest = Partial<CreateTaskRequest> & {
  completedAt?: string | null;
};

function mapSubtaskFromApi(subtask: TaskSubtaskApi): TaskSubtask {
  return {
    id: subtask.id,
    title: subtask.title,
    isCompleted: subtask.isCompleted ?? false,
  };
}

function mapSubtaskToApi(subtask: TaskSubtask): TaskSubtaskApi {
  return {
    id: subtask.id,
    title: subtask.title,
    isCompleted: subtask.isCompleted ?? false,
  };
}

function mapTaskFromApi(task: TaskApi): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    category: task.category,
    priority: task.priority,
    status: task.status,
    dueLabel: task.dueLabel,
    dueDate: task.dueDate ?? null,
    pomodoroEstimated: task.pomodoroEstimated,
    pomodoroCompleted: task.pomodoroCompleted,
    progress: typeof task.progress === "number" ? task.progress : 0,
    completedAt: task.completedAt ?? null,
    subtasks: task.subtasks?.map(mapSubtaskFromApi) ?? [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function mapCreateTaskToApi(data: CreateTaskRequest): CreateTaskRequest {
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    dueDate: data.dueDate,
    pomodoroEstimated: data.pomodoroEstimated,
    pomodoroCompleted: data.pomodoroCompleted ?? 0,
    subtasks: data.subtasks?.map(mapSubtaskToApi) ?? [],
  };
}

function mapUpdateTaskToApi(data: UpdateTaskRequest): UpdateTaskRequest {
  return {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.priority !== undefined && { priority: data.priority }),
    ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
    ...(data.pomodoroEstimated !== undefined && {
      pomodoroEstimated: data.pomodoroEstimated,
    }),
    ...(data.pomodoroCompleted !== undefined && {
      pomodoroCompleted: data.pomodoroCompleted,
    }),
    ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    ...(data.subtasks !== undefined && {
      subtasks: data.subtasks.map(mapSubtaskToApi),
    }),
  };
}

export async function listTasks(): Promise<Task[]> {
  const response = await api.get<TaskApi[]>("/tasks/");
  return response.data.map(mapTaskFromApi);
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const payload = mapCreateTaskToApi(data);
  const response = await api.post<TaskApi>("/tasks/", payload);
  return mapTaskFromApi(response.data);
}

export async function updateTask(
  id: string | number,
  data: UpdateTaskRequest,
): Promise<Task> {
  const payload = mapUpdateTaskToApi(data);
  const response = await api.patch<TaskApi>(`/tasks/${id}/`, payload);
  return mapTaskFromApi(response.data);
}

export async function deleteTask(id: string | number): Promise<void> {
  await api.delete(`/tasks/${id}/`);
}