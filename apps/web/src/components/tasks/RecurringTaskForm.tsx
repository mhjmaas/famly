import { Repeat } from "lucide-react";
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
import type { TaskFormData } from "@/hooks/useTaskForm";

interface RecurringTaskFormProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
  selectedDays: number[];
  toggleDay: (day: string) => void;
  dayMap: Record<string, number>;
  weekFrequency: string;
  setWeekFrequency: (frequency: string) => void;
  dict: any;
}

export function RecurringTaskForm({
  formData,
  setFormData,
  selectedDays,
  toggleDay,
  dayMap,
  weekFrequency,
  setWeekFrequency,
  dict,
}: RecurringTaskFormProps) {
  const nameId = useId();
  const frequencyId = useId();

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
    </div>
  );
}
