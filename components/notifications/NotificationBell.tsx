'use client';

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { 
  Bell, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Check, 
  CheckCheck,
  Clock, 
  Loader2,
  Trash2
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { notificationService } from "@/features/notifications/notifications.service";
import { Notification } from "@/lib/types/notification.types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = notificationService.subscribeNotifications(
      profile.id,
      (data) => {
        setNotifications(data);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAsRead = async (id: string, read: boolean) => {
    if (read) return;
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id || unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead(profile.id);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotifIcon = (type: Notification['type']) => {
    switch (type) {
      case 'schedule_update':
        return (
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="h-4.5 w-4.5" />
          </div>
        );
      case 'assignment_change':
        return (
          <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Users className="h-4.5 w-4.5" />
          </div>
        );
      case 'system_alert':
        return (
          <div className="h-8 w-8 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-surface-alt text-text-muted flex items-center justify-center shrink-0">
            <Bell className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <Button 
        onClick={handleToggle}
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-surface-alt/75 rounded-full transition-all duration-300 h-10 w-10 flex items-center justify-center"
      >
        <Bell className="h-5.5 w-5.5 text-text-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 rounded-full bg-danger text-[9px] font-bold text-white items-center justify-center border border-surface shadow-[0_0_8px_rgba(192,57,43,0.5)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-border bg-surface p-0 shadow-lg z-50 overflow-hidden font-manrope animate-in fade-in slide-in-from-top-3 duration-250">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-surface-alt/20">
            <div>
              <h3 className="font-bold text-sm text-text">Live In-app Alerts</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{unreadCount} unread notifications</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs font-semibold text-primary hover:text-primary-strong hover:underline flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex border-b border-border/40 px-3 bg-surface">
            <button 
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all ${
                filter === 'all' 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              All Alerts
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all relative ${
                filter === 'unread' 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-danger/10 text-danger border border-danger/10">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 bg-surface">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-text-muted">
                <div className="h-12 w-12 rounded-full bg-surface-alt flex items-center justify-center text-text-muted/40 mb-3 border border-dashed border-border">
                  <Bell className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-text">No alerts here</h4>
                <p className="text-[10px] text-text-muted/80 mt-1 max-w-[200px]">
                  {filter === 'unread' 
                    ? "You have completed all actions! Excellent." 
                    : "When administrative changes occur, real-time alerts appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.read)}
                  className={`flex gap-3 p-4 hover:bg-surface-alt/30 transition-colors duration-200 cursor-pointer relative ${
                    !notif.read ? 'bg-primary/[0.02]' : ''
                  }`}
                >
                  {/* Icon */}
                  {getNotifIcon(notif.type)}

                  {/* Text Content */}
                  <div className="space-y-1 flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className={`text-xs truncate leading-normal ${!notif.read ? 'font-bold text-text' : 'font-medium text-text/80'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary mt-1.5 shadow-[0_0_6px_rgba(15,107,168,0.8)]" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed font-normal">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-text-muted mt-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(new Date(notif.createdAt))}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/50 text-center bg-surface-alt/10">
            <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
              FacultyWise Alert Pipeline Active
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
export default NotificationBell;
