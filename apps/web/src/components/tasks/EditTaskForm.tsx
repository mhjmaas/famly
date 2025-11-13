import { Plus } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskFormData } from "@/hooks/useTaskForm";
import type { Dictionary } from "@/i18n/types";

interface EditTaskFormProps {
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
  familyMembers: Array<{ id: string; name: string; role: "parent" | "child" }>;
  dict: Dictionary;
}

export function EditTaskForm({
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
  familyMembers,
  dict,
}: EditTaskFormProps) {
  const nameId = useId();
  const descriptionId = useId();
  const dueDateId = useId();
  const assignToId = useId();
  const karmaId = useId();

  const t = dict.dashboard.pages.tasks;

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={nameId}>
          {t.create.fields.name.label}{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id={nameId}
          placeholder={t.create.fields.name.placeholder}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          maxLength={200}
          data-testid="task-name-input"
        />
      </div>

      {!showDescription ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowDescription(true)}
          data-testid="task-add-description"
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
              setFormData({ ...formData, description: e.target.value })
            }
            maxLength={2000}
            rows={3}
            data-testid="task-description-input"
          />
        </div>
      )}

      {!showDueDate ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowDueDate(true)}
          data-testid="task-add-due-date"
        >
          <Plus className="h-4 w-4" />
          {t.create.fields.dueDate.add}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={dueDateId}>{t.create.fields.dueDate.label}</Label>
          <Input
            id={dueDateId}
            type="date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            data-testid="task-due-date-input"
          />
        </div>
      )}

      {!showAssignment ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowAssignment(true)}
          data-testid="task-add-assignment"
        >
          <Plus className="h-4 w-4" />
          {t.create.fields.assignment.add}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={assignToId}>{t.create.fields.assignment.label}</Label>
          <Select
            value={formData.assignTo}
            onValueChange={(value) =>
              setFormData({ ...formData, assignTo: value })
            }
          >
            <SelectTrigger id={assignToId} data-testid="task-assignment-select">
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
          data-testid="task-add-karma"
        >
          <Plus className="h-4 w-4" />
          {t.create.fields.karma.add}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={karmaId}>{t.create.fields.karma.label}</Label>
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
            data-testid="task-karma-input"
          />
        </div>
      )}
    </div>
  );
}
