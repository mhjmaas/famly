import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  createSchedule,
  createTask,
  updateTask,
} from "@/store/slices/tasks.slice";
import type { AppDispatch } from "@/store/store";
import type { Task } from "@/types/api.types";

export interface TaskFormData {
  name: string;
  description: string;
  dueDate: string;
  assignTo: string;
  karma: string;
}

interface UseTaskFormParams {
  familyId: string;
  dict: any;
  dispatch: AppDispatch;
  buildAssignment: (assignTo: string) => any;
  onSuccess: () => void;
}

export function useTaskForm({
  familyId,
  dict,
  dispatch,
  buildAssignment,
  onSuccess,
}: UseTaskFormParams) {
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dueDate: "",
      assignTo: "unassigned",
      karma: "",
    });
    setShowDescription(false);
    setShowDueDate(false);
    setShowAssignment(false);
    setShowKarma(false);
    setSelectedDays([]);
    setWeekFrequency("1");
  };

  const loadTaskForEdit = (task: Task) => {
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
  };

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
            assignment: buildAssignment(formData.assignTo),
            metadata: formData.karma
              ? { karma: Number.parseInt(formData.karma, 10) }
              : undefined,
          },
        }),
      ).unwrap();

      onSuccess();
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
            assignment: buildAssignment(formData.assignTo),
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

      onSuccess();
      resetForm();
      toast.success(dict.dashboard.pages.tasks.create.success);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.create.error);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    if (!formData.name.trim()) return;

    try {
      await dispatch(
        updateTask({
          familyId,
          taskId,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            assignment: buildAssignment(formData.assignTo),
            metadata: formData.karma
              ? { karma: Number.parseInt(formData.karma, 10) }
              : undefined,
          },
        }),
      ).unwrap();

      onSuccess();
      resetForm();
      toast.success(dict.dashboard.pages.tasks.edit.success);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.edit.error);
    }
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

  return {
    formData,
    setFormData,
    showDescription,
    setShowDescription,
    showDueDate,
    setShowDueDate,
    showAssignment,
    setShowAssignment,
    showKarma,
    setShowKarma,
    selectedDays,
    weekFrequency,
    setWeekFrequency,
    toggleDay,
    dayMap,
    resetForm,
    loadTaskForEdit,
    handleCreateTask,
    handleCreateSchedule,
    handleUpdateTask,
  };
}
