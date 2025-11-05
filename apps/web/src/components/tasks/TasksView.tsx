"use client";

import { format, isSameDay, isToday, isYesterday, startOfDay } from "date-fns";
import {
  Calendar,
  Clock,
  Edit,
  MoreVertical,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  User,
  UsersIcon,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectKarmaBalance } from "@/store/slices/karma.slice";
import {
  completeTask,
  createSchedule,
  createTask,
  deleteSchedule,
  deleteTask,
  fetchSchedules,
  fetchTasks,
  reopenTask,
  selectSchedules,
  selectTasks,
  selectTasksError,
  selectTasksLoading,
  updateTask,
} from "@/store/slices/tasks.slice";
import type { Task, TaskAssignment } from "@/types/api.types";

type FilterType = "my-tasks" | "all" | "active" | "completed";
type TaskType = "single" | "recurring";

interface TasksViewProps {
  dict: any;
  familyId: string;
  userId: string;
  userRole: "parent" | "child";
  familyMembers: Array<{ id: string; name: string; role: "parent" | "child" }>;
}

interface TaskFormData {
  name: string;
  description: string;
  dueDate: string;
  assignTo: string;
  karma: string;
}

export function TasksView({
  dict,
  familyId,
  userId,
  userRole,
  familyMembers,
}: TasksViewProps) {
  const dispatch = useAppDispatch();

  // Generate unique IDs for form fields
  const nameId = useId();
  const descriptionId = useId();
  const dueDateId = useId();
  const assignToId = useId();
  const karmaId = useId();
  const recurringNameId = useId();
  const frequencyId = useId();
  const editNameId = useId();
  const editDescriptionId = useId();
  const editDueDateId = useId();
  const editAssignToId = useId();
  const editKarmaId = useId();

  const tasks = useAppSelector(selectTasks);
  const _schedules = useAppSelector(selectSchedules);
  const isLoading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const _karmaBalance = useAppSelector(selectKarmaBalance(userId));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>("my-tasks");
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>("single");
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    dueDate: "",
    assignTo: "unassigned",
    karma: "",
  });

  const [showDescription, setShowDescription] = useState(false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showKarma, setShowKarma] = useState(false);

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [weekFrequency, setWeekFrequency] = useState("1");

  useEffect(() => {
    if (familyId) {
      dispatch(fetchTasks(familyId));
      dispatch(fetchSchedules(familyId));
    }
  }, [dispatch, familyId]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dueDate: "",
      assignTo: "unassigned",
      karma: "",
    });
    setEditingTask(null);
    setTaskType("single");
    setShowDescription(false);
    setShowDueDate(false);
    setShowAssignment(false);
    setShowKarma(false);
    setSelectedDays([]);
    setWeekFrequency("1");
  };

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const toggleDay = (day: string) => {
    const dayNum = dayMap[day];
    setSelectedDays((prev) =>
      prev.includes(dayNum)
        ? prev.filter((d) => d !== dayNum)
        : [...prev, dayNum],
    );
  };

  const buildAssignment = (): TaskAssignment => {
    if (formData.assignTo === "unassigned") {
      return { type: "unassigned" };
    }
    if (formData.assignTo === "all-parents") {
      return { type: "role", role: "parent" };
    }
    if (formData.assignTo === "all-children") {
      return { type: "role", role: "child" };
    }
    return { type: "member", memberId: formData.assignTo };
  };

  const isTaskAssignedToCurrentUser = useCallback(
    (task: Task) => {
      if (task.assignment.type === "member") {
        return task.assignment.memberId === userId;
      }
      if (task.assignment.type === "role") {
        return task.assignment.role === userRole;
      }
      return false;
    },
    [userId, userRole],
  );

  const taskCounts = useMemo(() => {
    let myTasks = 0;
    let active = 0;
    let completed = 0;

    tasks.forEach((task) => {
      if (isTaskAssignedToCurrentUser(task)) {
        myTasks += 1;
      }
      if (task.completedAt) {
        completed += 1;
      } else {
        active += 1;
      }
    });

    return {
      myTasks,
      all: tasks.length,
      active,
      completed,
    };
  }, [isTaskAssignedToCurrentUser, tasks]);

  useEffect(() => {
    if (hasInitializedFilter) return;
    if (isLoading) return;

    const defaultFilter: FilterType =
      taskCounts.myTasks > 0 ? "my-tasks" : "all";

    if (filter !== defaultFilter) {
      setFilter(defaultFilter);
    }
    setHasInitializedFilter(true);
  }, [filter, hasInitializedFilter, isLoading, taskCounts.myTasks]);

  const handleCreateTask = async () => {
    if (!formData.name.trim()) {
      toast.error(dict.dashboard.pages.tasks.create.fields.name.required);
      return;
    }

    try {
      await dispatch(
        createTask({
          familyId,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            assignment: buildAssignment(),
            metadata: formData.karma
              ? { karma: Number.parseInt(formData.karma, 10) }
              : undefined,
          },
        }),
      ).unwrap();

      setIsCreateOpen(false);
      resetForm();
      toast.success(dict.dashboard.pages.tasks.create.success);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.create.error);
    }
  };

  const handleCreateSchedule = async () => {
    if (!formData.name.trim()) {
      toast.error(dict.dashboard.pages.tasks.create.fields.name.required);
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    try {
      await dispatch(
        createSchedule({
          familyId,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            assignment: buildAssignment(),
            schedule: {
              daysOfWeek: selectedDays,
              weeklyInterval: Number.parseInt(weekFrequency, 10),
              startDate: new Date().toISOString().split("T")[0],
            },
            timeOfDay: formData.dueDate || undefined,
            metadata: formData.karma
              ? { karma: Number.parseInt(formData.karma, 10) }
              : undefined,
          },
        }),
      ).unwrap();

      setIsCreateOpen(false);
      resetForm();
      toast.success(dict.dashboard.pages.tasks.create.success);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.create.error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.name.trim()) return;

    try {
      await dispatch(
        updateTask({
          familyId,
          taskId: editingTask._id,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            assignment: buildAssignment(),
            metadata: formData.karma
              ? { karma: Number.parseInt(formData.karma, 10) }
              : undefined,
          },
        }),
      ).unwrap();

      setIsCreateOpen(false);
      resetForm();
      toast.success(dict.dashboard.pages.tasks.edit.success);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.edit.error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);

    let assignTo = "unassigned";
    if (task.assignment.type === "member") {
      assignTo = task.assignment.memberId;
    } else if (task.assignment.type === "role") {
      assignTo =
        task.assignment.role === "parent" ? "all-parents" : "all-children";
    }

    setFormData({
      name: task.name,
      description: task.description || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      assignTo,
      karma: task.metadata?.karma?.toString() || "",
    });

    setShowDescription(!!task.description);
    setShowDueDate(!!task.dueDate);
    setShowAssignment(task.assignment.type !== "unassigned");
    setShowKarma(!!task.metadata?.karma);

    setIsCreateOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    if (task.scheduleId) {
      setDeleteConfirmTask(task);
    } else {
      dispatch(deleteTask({ familyId, taskId: task._id }));
      toast.success(dict.dashboard.pages.tasks.delete.successSingle);
    }
  };

  const handleDeleteSingleInstance = async () => {
    if (!deleteConfirmTask) return;

    try {
      await dispatch(
        deleteTask({ familyId, taskId: deleteConfirmTask._id }),
      ).unwrap();
      setDeleteConfirmTask(null);
      toast.success(dict.dashboard.pages.tasks.delete.successSingle);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.delete.error);
    }
  };

  const handleDeleteAllRecurring = async () => {
    if (!deleteConfirmTask?.scheduleId) return;

    try {
      await dispatch(
        deleteSchedule({ familyId, scheduleId: deleteConfirmTask.scheduleId }),
      ).unwrap();
      const tasksToDelete = tasks.filter(
        (t) => t.scheduleId === deleteConfirmTask.scheduleId,
      );
      await Promise.all(
        tasksToDelete.map((t) =>
          dispatch(deleteTask({ familyId, taskId: t._id })),
        ),
      );
      setDeleteConfirmTask(null);
      toast.success(dict.dashboard.pages.tasks.delete.successRecurring);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.delete.error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleting = !task.completedAt;

    try {
      if (isCompleting) {
        await dispatch(
          completeTask({
            familyId,
            taskId: task._id,
            userId,
            karma: task.metadata?.karma,
          }),
        ).unwrap();

        if (task.metadata?.karma) {
          toast.success(
            dict.dashboard.pages.tasks.complete.successWithKarma.replace(
              "{karma}",
              task.metadata.karma.toString(),
            ),
          );
        } else {
          toast.success(dict.dashboard.pages.tasks.complete.success);
        }
      } else {
        await dispatch(
          reopenTask({
            familyId,
            taskId: task._id,
            userId,
            karma: task.metadata?.karma,
          }),
        ).unwrap();
        toast.success(dict.dashboard.pages.tasks.complete.reopen);
      }
    } catch (_err) {
      toast.error("Failed to update task");
    }
  };

  const handleClaimTask = async (task: Task) => {
    try {
      await dispatch(
        updateTask({
          familyId,
          taskId: task._id,
          data: {
            assignment: { type: "member", memberId: userId },
          },
        }),
      ).unwrap();
      toast.success(
        dict.dashboard.pages.tasks.claim.success.replace("{name}", task.name),
      );
    } catch (_err) {
      toast.error("Failed to claim task");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "my-tasks") {
        return isTaskAssignedToCurrentUser(task);
      }
      if (filter === "active") return !task.completedAt;
      if (filter === "completed") return !!task.completedAt;
      return true;
    });
  }, [filter, isTaskAssignedToCurrentUser, tasks]);

  const groupTasksByCompletionDate = (tasks: Task[]) => {
    const groups: { date: Date | null; tasks: Task[] }[] = [];

    const completedTasks = tasks
      .filter((t) => t.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      );

    const activeTasks = tasks.filter((t) => !t.completedAt);

    if (activeTasks.length > 0) {
      groups.push({ date: null, tasks: activeTasks });
    }

    completedTasks.forEach((task) => {
      if (!task.completedAt) return;
      const taskDate = startOfDay(new Date(task.completedAt));
      const existingGroup = groups.find(
        (g) => g.date && isSameDay(g.date, taskDate),
      );

      if (existingGroup) {
        existingGroup.tasks.push(task);
      } else {
        groups.push({ date: taskDate, tasks: [task] });
      }
    });

    return groups;
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const shouldShowDateSeparators = filter !== "active";
  const taskGroups = shouldShowDateSeparators
    ? groupTasksByCompletionDate(filteredTasks)
    : [{ date: null, tasks: filteredTasks }];

  const getAssignmentDisplay = (assignment: TaskAssignment) => {
    if (assignment.type === "member") {
      const member = familyMembers.find((m) => m.id === assignment.memberId);
      return (
        <Badge variant="secondary" className="gap-1 h-7">
          <User className="h-3 w-3" />
          {member?.name || "Unknown"}
        </Badge>
      );
    }
    if (assignment.type === "role") {
      return (
        <Badge variant="secondary" className="gap-1 h-7">
          <UsersIcon className="h-3 w-3" />
          {assignment.role === "parent"
            ? dict.dashboard.pages.tasks.badges.allParents
            : dict.dashboard.pages.tasks.badges.allChildren}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 h-7">
        {dict.dashboard.pages.tasks.badges.unassigned}
      </Badge>
    );
  };

  const getDueDateDisplay = (task: Task) => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && !task.completedAt;
    return (
      <Badge
        variant={isOverdue ? "destructive" : "outline"}
        className="gap-1 h-7"
      >
        <Clock className="h-3 w-3" />
        {format(dueDate, "MMM d")}
      </Badge>
    );
  };

  const isTaskClaimable = (task: Task) => {
    return (
      !task.completedAt &&
      (task.assignment.type === "unassigned" || task.assignment.type === "role")
    );
  };

  const t = dict.dashboard.pages.tasks;

  const TabBadge = ({ count }: { count: number }) => {
    if (count < 1) return null;
    return (
      <span className="bg-muted-foreground/10 text-muted-foreground inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none">
        {count}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.newTask}
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as FilterType);
          setHasInitializedFilter(true);
        }}
      >
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="my-tasks">
            {t.filters.myTasks}
            <TabBadge count={taskCounts.myTasks} />
          </TabsTrigger>
          <TabsTrigger value="all">
            {t.filters.all}
            <TabBadge count={taskCounts.all} />
          </TabsTrigger>
          <TabsTrigger value="active">
            {t.filters.active}
            <TabBadge count={taskCounts.active} />
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t.filters.completed}
            <TabBadge count={taskCounts.completed} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {isLoading && <div className="text-center py-12">{t.loading}</div>}
          {error && (
            <div className="text-center py-12 text-destructive">{error}</div>
          )}

          {!isLoading && !error && filteredTasks.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t.emptyState.title}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {filter === "my-tasks"
                    ? t.emptyState.myTasks
                    : t.emptyState.default}
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t.emptyState.cta}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {taskGroups.map((group) => (
                <div
                  key={group.tasks.map((task) => task._id).join(",")}
                  className="space-y-3"
                >
                  {group.date && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px bg-border flex-1" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Completed {formatDateSeparator(group.date)}
                      </span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                  {group.tasks.map((task) => (
                    <Card
                      key={task._id}
                      className={task.completedAt ? "opacity-60" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={!!task.completedAt}
                            onCheckedChange={() => handleToggleComplete(task)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className={`font-semibold mb-1 ${
                                    task.completedAt
                                      ? "line-through text-muted-foreground"
                                      : ""
                                  }`}
                                >
                                  {task.name}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  {isTaskClaimable(task) ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleClaimTask(task)}
                                      className="gap-1.5 h-7 text-xs font-medium border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                                    >
                                      <User className="h-3 w-3" />
                                      {t.claim.button}
                                    </Button>
                                  ) : (
                                    getAssignmentDisplay(task.assignment)
                                  )}
                                  {getDueDateDisplay(task)}
                                  {task.scheduleId && (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 h-7"
                                    >
                                      <Repeat className="h-3 w-3" />
                                      {t.badges.recurring}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {task.metadata?.karma && (
                                  <div className="flex items-center gap-2 text-base font-semibold">
                                    <Sparkles
                                      className={`h-5 w-5 ${
                                        task.completedAt
                                          ? "text-muted-foreground"
                                          : "text-primary fill-current"
                                      }`}
                                    />
                                    <span
                                      className={
                                        task.completedAt
                                          ? "text-muted-foreground"
                                          : "text-foreground"
                                      }
                                    >
                                      {task.metadata.karma}
                                    </span>
                                  </div>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleEditTask(task)}
                                      className="gap-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                      {t.menu.edit}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTask(task)}
                                      className="gap-2 text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t.menu.delete}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={isCreateOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTask(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? t.edit.title : t.create.title}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? t.edit.description : t.create.description}
            </DialogDescription>
          </DialogHeader>

          {!editingTask && (
            <Tabs
              value={taskType}
              onValueChange={(v) => setTaskType(v as TaskType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">{t.create.tabs.single}</TabsTrigger>
                <TabsTrigger value="recurring">
                  {t.create.tabs.recurring}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor={nameId}>
                    {t.create.fields.name.label}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={nameId}
                    placeholder={t.create.fields.name.placeholder}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    maxLength={200}
                  />
                </div>

                {!showDescription ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowDescription(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.description.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={descriptionId}>
                      {t.create.fields.description.label}
                    </Label>
                    <Textarea
                      id={descriptionId}
                      placeholder={t.create.fields.description.placeholder}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      maxLength={2000}
                      rows={3}
                    />
                  </div>
                )}

                {!showDueDate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setShowDueDate(true);
                      if (!formData.dueDate) {
                        setFormData({
                          ...formData,
                          dueDate: format(new Date(), "yyyy-MM-dd"),
                        });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.dueDate.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={dueDateId}>
                      {t.create.fields.dueDate.label}
                    </Label>
                    <Input
                      id={dueDateId}
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                )}

                {!showAssignment ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAssignment(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.assignment.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={assignToId}>
                      {t.create.fields.assignment.label}
                    </Label>
                    <Select
                      value={formData.assignTo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assignTo: value })
                      }
                    >
                      <SelectTrigger id={assignToId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          {t.create.fields.assignment.unassigned}
                        </SelectItem>
                        <SelectItem value="all-parents">
                          {t.create.fields.assignment.allParents}
                        </SelectItem>
                        <SelectItem value="all-children">
                          {t.create.fields.assignment.allChildren}
                        </SelectItem>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!showKarma ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowKarma(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t.create.fields.karma.add}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={karmaId}>
                      {t.create.fields.karma.label}
                    </Label>
                    <Input
                      id={karmaId}
                      type="number"
                      min="0"
                      max="1000"
                      placeholder={t.create.fields.karma.placeholder}
                      value={formData.karma}
                      onChange={(e) =>
                        setFormData({ ...formData, karma: e.target.value })
                      }
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recurring" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor={recurringNameId}>
                    {t.create.fields.name.label}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={recurringNameId}
                    placeholder={t.create.fields.name.placeholder}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    maxLength={200}
                  />
                </div>

                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Repeat className="h-4 w-4" />
                    {t.create.fields.schedule.title}
                  </div>
                  <div className="space-y-2">
                    <Label>{t.create.fields.schedule.repeatOn}</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={
                              selectedDays.includes(dayMap[day])
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className="h-10 px-0"
                            onClick={() => toggleDay(day)}
                          >
                            {t.days[day.toLowerCase() as keyof typeof t.days]}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={frequencyId}>
                      {t.create.fields.schedule.frequency}
                    </Label>
                    <Select
                      value={weekFrequency}
                      onValueChange={setWeekFrequency}
                    >
                      <SelectTrigger id={frequencyId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          {t.create.fields.schedule.every1Week}
                        </SelectItem>
                        <SelectItem value="2">
                          {t.create.fields.schedule.every2Weeks}
                        </SelectItem>
                        <SelectItem value="3">
                          {t.create.fields.schedule.every3Weeks}
                        </SelectItem>
                        <SelectItem value="4">
                          {t.create.fields.schedule.every4Weeks}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={editNameId}>
                  {t.create.fields.name.label}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={editNameId}
                  placeholder={t.create.fields.name.placeholder}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  maxLength={200}
                />
              </div>

              {!showDescription ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowDescription(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t.create.fields.description.add}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={editDescriptionId}>
                    {t.create.fields.description.label}
                  </Label>
                  <Textarea
                    id={editDescriptionId}
                    placeholder={t.create.fields.description.placeholder}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    maxLength={2000}
                    rows={3}
                  />
                </div>
              )}

              {!showDueDate ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowDueDate(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t.create.fields.dueDate.add}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={editDueDateId}>
                    {t.create.fields.dueDate.label}
                  </Label>
                  <Input
                    id={editDueDateId}
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              )}

              {!showAssignment ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAssignment(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t.create.fields.assignment.add}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={editAssignToId}>
                    {t.create.fields.assignment.label}
                  </Label>
                  <Select
                    value={formData.assignTo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignTo: value })
                    }
                  >
                    <SelectTrigger id={editAssignToId}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        {t.create.fields.assignment.unassigned}
                      </SelectItem>
                      <SelectItem value="all-parents">
                        {t.create.fields.assignment.allParents}
                      </SelectItem>
                      <SelectItem value="all-children">
                        {t.create.fields.assignment.allChildren}
                      </SelectItem>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!showKarma ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKarma(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t.create.fields.karma.add}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={editKarmaId}>
                    {t.create.fields.karma.label}
                  </Label>
                  <Input
                    id={editKarmaId}
                    type="number"
                    min="0"
                    max="1000"
                    placeholder={t.create.fields.karma.placeholder}
                    value={formData.karma}
                    onChange={(e) =>
                      setFormData({ ...formData, karma: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTask(null);
                resetForm();
              }}
            >
              {t.create.buttons.cancel}
            </Button>
            <Button
              onClick={
                editingTask
                  ? handleUpdateTask
                  : taskType === "single"
                    ? handleCreateTask
                    : handleCreateSchedule
              }
            >
              {editingTask ? t.edit.buttons.update : t.create.buttons.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteConfirmTask}
        onOpenChange={(open) => !open && setDeleteConfirmTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.delete.recurringTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.delete.recurringDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.delete.buttons.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingleInstance}>
              {t.delete.buttons.deleteOne}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleDeleteAllRecurring}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete.buttons.deleteAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
