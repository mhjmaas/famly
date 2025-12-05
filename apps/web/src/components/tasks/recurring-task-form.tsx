import { Plus, Repeat } from "lucide-react";
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

interface RecurringTaskFormProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
  selectedDays: number[];
  toggleDay: (day: string) => void;
  dayMap: Record<string, number>;
  weekFrequency: string;
  setWeekFrequency: (frequency: string) => void;
  showDescription: boolean;
  setShowDescription: (show: boolean) => void;
  showAssignment: boolean;
  setShowAssignment: (show: boolean) => void;
  showKarma: boolean;
  setShowKarma: (show: boolean) => void;
  familyMembers: Array<{ id: string; name: string; role: "parent" | "child" }>;
  userRole: "parent" | "child";
  dict: Dictionary;
}

export function RecurringTaskForm({
  formData,
  setFormData,
  selectedDays,
  toggleDay,
  dayMap,
  weekFrequency,
  setWeekFrequency,
  showDescription,
  setShowDescription,
  showAssignment,
  setShowAssignment,
  showKarma,
  setShowKarma,
  familyMembers,
  userRole,
  dict,
}: RecurringTaskFormProps) {
  const nameId = useId();
  const descriptionId = useId();
  const frequencyId = useId();
  const assignToId = useId();
  const karmaId = useId();

  const t = dict.dashboard.pages.tasks;

  return (
    <div className="space-y-4">
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

      <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Repeat className="h-4 w-4" />
          {t.create.fields.schedule.title}
        </div>
        <div className="space-y-2">
          <Label>{t.create.fields.schedule.repeatOn}</Label>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Button
                key={day}
                type="button"
                variant={
                  selectedDays.includes(dayMap[day]) ? "default" : "outline"
                }
                size="sm"
                className="h-10 px-0"
                onClick={() => toggleDay(day)}
                data-testid={`task-repeat-${day.toLowerCase()}`}
              >
                {t.days[day.toLowerCase() as keyof typeof t.days]}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={frequencyId}>
            {t.create.fields.schedule.frequency}
          </Label>
          <Select value={weekFrequency} onValueChange={setWeekFrequency}>
            <SelectTrigger id={frequencyId} data-testid="task-frequency-select">
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

      {userRole === "parent" &&
        (!showKarma ? (
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
        ))}
    </div>
  );
}
