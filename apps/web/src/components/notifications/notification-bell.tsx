"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Check, Inbox } from "lucide-react";

import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

import styles from "./notification-bell.module.css";

interface AppNotification {
  _id: string;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

function humanize(value?: string) {
  if (!value) return "";

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function titleFor(notification: AppNotification) {
  return (
    notification.title ||
    humanize(notification.type) ||
    "Future Fit update"
  );
}

function messageFor(notification: AppNotification) {
  return (
    notification.message ||
    notification.body ||
    "There is a new update on your Future Fit account."
  );
}

function dateFor(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export function NotificationBell() {
  const user = useAuthStore((state) => state.user);

  const notifications = useQuery({
    queryKey: ["notification-bell", user?.id],
    queryFn: () => apiRequest<AppNotification[]>("/notifications"),
    enabled: !!user,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await notifications.refetch();
    },
  });

  const records = notifications.data ?? [];
  const unread = records.filter((item) => !item.read).length;

  return (
    <details className={styles.wrapper}>
      <summary
        className={styles.trigger}
        aria-label={
          unread
            ? `${unread} unread notification${unread === 1 ? "" : "s"}`
            : "Notifications"
        }
      >
        <Bell size={18} />
        {unread ? (
          <span className={styles.badge}>
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </summary>

      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <strong>Notifications</strong>
            <span>
              {unread
                ? `${unread} unread`
                : "You are all caught up"}
            </span>
          </div>
          <Bell size={17} />
        </header>

        <div className={styles.list}>
          {notifications.isLoading ? (
            <p className={styles.state}>Loading notifications…</p>
          ) : notifications.error ? (
            <p className={styles.error}>
              {notifications.error.message}
            </p>
          ) : records.length === 0 ? (
            <div className={styles.empty}>
              <Inbox size={24} />
              <strong>No notifications yet</strong>
              <span>
                Important account, assessment and school updates will appear
                here.
              </span>
            </div>
          ) : (
            records.slice(0, 10).map((notification) => (
              <article
                key={notification._id}
                className={
                  notification.read
                    ? styles.itemRead
                    : styles.itemUnread
                }
              >
                <div className={styles.itemCopy}>
                  <strong>{titleFor(notification)}</strong>
                  <p>{messageFor(notification)}</p>
                  {notification.createdAt ? (
                    <time dateTime={notification.createdAt}>
                      {dateFor(notification.createdAt)}
                    </time>
                  ) : null}
                </div>

                {!notification.read ? (
                  <button
                    type="button"
                    className={styles.readButton}
                    disabled={markRead.isPending}
                    aria-label="Mark notification as read"
                    onClick={() => markRead.mutate(notification._id)}
                  >
                    <Check size={15} />
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>

        {records.length > 10 ? (
          <p className={styles.footer}>
            Showing the latest 10 of {records.length} notifications.
          </p>
        ) : null}
      </div>
    </details>
  );
}
