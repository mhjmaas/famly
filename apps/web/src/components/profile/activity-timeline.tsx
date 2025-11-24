"use client";

import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useNotificationTranslations } from "@/hooks/use-notification-translations";
import type { ActivityEvent } from "@/lib/api-client";
import {
  formatActivityFromTemplate,
  formatActivityTime,
  getActivityEventBgColor,
  getActivityEventColor,
  getActivityEventIcon,
  groupEventsByDate,
  shouldShowKarma,
} from "@/lib/utils/activity-utils";

interface ActivityTimelineProps {
  events: ActivityEvent[];
  dict: {
    title: string;
    subtitle: string;
    noEvents: string;
  };
  locale: string;
  timeZone?: string;
}

export function ActivityTimeline({
  events,
  dict,
  locale,
  timeZone = "UTC",
}: ActivityTimelineProps) {
  const t = useNotificationTranslations();
  const eventGroups = groupEventsByDate(events);

  if (events.length === 0) {
    return (
      <div className="space-y-4" data-testid="activity-timeline">
        <div>
          <h2 className="text-xl font-semibold" data-testid="activity-title">
            {dict.title}
          </h2>
          <p
            className="text-sm text-muted-foreground"
            data-testid="activity-subtitle"
          >
            {dict.subtitle}
          </p>
        </div>
        <div
          className="text-center py-12 text-muted-foreground"
          data-testid="activity-no-events"
        >
          {dict.noEvents}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="activity-timeline">
      <div>
        <h2 className="text-xl font-semibold" data-testid="activity-title">
          {dict.title}
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-testid="activity-subtitle"
        >
          {dict.subtitle}
        </p>
      </div>

      <div className="space-y-6">
        {eventGroups.map((group) => (
          <div key={group.date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm font-medium text-muted-foreground">
                {group.displayDate}
              </span>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* Events for this date */}
            <div className="space-y-3">
              {group.events.map((event) => {
                const Icon = getActivityEventIcon(event.type);
                const karma = event.metadata?.karma;
                const colorClass = getActivityEventColor(karma);
                const bgColorClass = getActivityEventBgColor(event.type);

                const formatted = formatActivityFromTemplate(event, t);

                const title = formatted?.title ?? event.title;
                const description = formatted?.description ?? event.description;

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid="activity-event"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 rounded-full p-3 ${bgColorClass}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{title}</h3>
                            {description && (
                              <p className="text-sm text-muted-foreground">
                                {description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatActivityTime(event.createdAt, {
                                locale,
                                timeZone,
                              })}
                            </p>
                          </div>

                          {/* Karma Change */}
                          {shouldShowKarma(event) && karma !== undefined && (
                            <div
                              className={`flex items-center gap-2 font-semibold text-base ${colorClass}`}
                            >
                              {karma > 0 ? (
                                <TrendingUp
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <TrendingDown
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                {karma > 0 ? "+" : ""}
                                {karma}
                              </span>
                              <Sparkles
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
