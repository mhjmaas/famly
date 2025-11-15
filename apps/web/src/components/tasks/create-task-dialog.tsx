import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { TaskFormData } from "@/hooks/useTaskForm";
import type { Dictionary } from "@/i18n/types";
import type { Task } from "@/types/api.types";
import { EditTaskForm } from "./EditTaskForm";
import { RecurringTaskForm } from "./RecurringTaskForm";
import { SingleTaskForm } from "./SingleTaskForm";

type TaskType = "single" | "recurring";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
  showDescription: boolean;
  setShowDescription: (show: boolean) => void;
  showDueDate: boolean;
  setShowDueDate: (show: boolean) => void;
  showAssignment: boolean;
  setShowAssignment: (show: boolean) => void;
  showKarma: boolean;
  setShowKarma: (show: boolean) => void;
  selectedDays: number[];
  toggleDay: (day: string) => void;
  dayMap: Record<string, number>;
  weekFrequency: string;
  setWeekFrequency: (frequency: string) => void;
  resetForm: () => void;
  handleCreateTask: () => Promise<void>;
  handleCreateSchedule: () => Promise<void>;
  handleUpdateTask: (taskId: string) => Promise<void>;
  familyMembers: Array<{ id: string; name: string; role: "parent" | "child" }>;
  dict: Dictionary;
}

export function CreateTaskDialog({
  isOpen,
  onClose,
  editingTask,
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
  toggleDay,
  dayMap,
  weekFrequency,
  setWeekFrequency,
  resetForm,
  handleCreateTask,
  handleCreateSchedule,
  handleUpdateTask,
  familyMembers,
  dict,
}: CreateTaskDialogProps) {
  const [taskType, setTaskType] = useState<TaskType>("single");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const t = dict.dashboard.pages.tasks;

  const handleClose = () => {
    onClose();
    resetForm();
    setTaskType("single");
  };

  // Shared content component
  const TaskContent = (
    <>
      {!editingTask && (
        <Tabs
          value={taskType}
          onValueChange={(v) => setTaskType(v as TaskType)}
          className="w-full"
          data-testid="task-dialog-tabs"
        >
          <TabsList
            className="grid w-full grid-cols-2"
            data-testid="task-dialog-type-tabs"
          >
            <TabsTrigger value="single" data-testid="task-type-single">
              {t.create.tabs.single}
            </TabsTrigger>
            <TabsTrigger value="recurring" data-testid="task-type-recurring">
              {t.create.tabs.recurring}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            <SingleTaskForm
              formData={formData}
              setFormData={setFormData}
              showDescription={showDescription}
              setShowDescription={setShowDescription}
              showDueDate={showDueDate}
              setShowDueDate={setShowDueDate}
              showAssignment={showAssignment}
              setShowAssignment={setShowAssignment}
              showKarma={showKarma}
              setShowKarma={setShowKarma}
              familyMembers={familyMembers}
              dict={dict}
            />
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4 mt-4">
            <RecurringTaskForm
              formData={formData}
              setFormData={setFormData}
              selectedDays={selectedDays}
              toggleDay={toggleDay}
              dayMap={dayMap}
              weekFrequency={weekFrequency}
              setWeekFrequency={setWeekFrequency}
              showDescription={showDescription}
              setShowDescription={setShowDescription}
              showAssignment={showAssignment}
              setShowAssignment={setShowAssignment}
              showKarma={showKarma}
              setShowKarma={setShowKarma}
              familyMembers={familyMembers}
              dict={dict}
            />
          </TabsContent>
        </Tabs>
      )}

      {editingTask && (
        <EditTaskForm
          formData={formData}
          setFormData={setFormData}
          showDescription={showDescription}
          setShowDescription={setShowDescription}
          showDueDate={showDueDate}
          setShowDueDate={setShowDueDate}
          showAssignment={showAssignment}
          setShowAssignment={setShowAssignment}
          showKarma={showKarma}
          setShowKarma={setShowKarma}
          familyMembers={familyMembers}
          dict={dict}
        />
      )}
    </>
  );

  const header = (
    <>
      <DialogTitle data-testid="task-dialog-title">
        {editingTask ? t.edit.title : t.create.title}
      </DialogTitle>
      <DialogDescription data-testid="task-dialog-description">
        {editingTask ? t.edit.description : t.create.description}
      </DialogDescription>
    </>
  );

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={handleClose}
        data-testid="task-dialog-cancel"
      >
        {t.create.buttons.cancel}
      </Button>
      <Button
        onClick={
          editingTask
            ? () => handleUpdateTask(editingTask._id)
            : taskType === "single"
              ? handleCreateTask
              : handleCreateSchedule
        }
        data-testid="task-dialog-submit"
      >
        {editingTask ? t.edit.buttons.update : t.create.buttons.create}
      </Button>
    </>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
          data-testid="task-dialog"
        >
          <DialogHeader>{header}</DialogHeader>
          {TaskContent}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent data-testid="task-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
          {TaskContent}
        </div>
        <DrawerFooter className="pt-2">
          <Button
            onClick={
              editingTask
                ? () => handleUpdateTask(editingTask._id)
                : taskType === "single"
                  ? handleCreateTask
                  : handleCreateSchedule
            }
            data-testid="task-dialog-submit"
          >
            {editingTask ? t.edit.buttons.update : t.create.buttons.create}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="task-dialog-cancel"
            >
              {t.create.buttons.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
