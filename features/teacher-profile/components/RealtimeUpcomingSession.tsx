"use client";

import React from "react";
import { Clock, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { UpcomingSession } from "@/lib/types/teacher-dashboard.types";

interface RealtimeUpcomingSessionProps {
  session: UpcomingSession | null;
  loading: boolean;
}

export function RealtimeUpcomingSession({ session, loading }: RealtimeUpcomingSessionProps) {
  if (loading) {
    return (
      <Card className="lg:col-span-3">
        <CardHeader className="bg-teal-600 border-none pb-8 text-white rounded-t-md">
          <CardTitle className="text-white">Upcoming Session</CardTitle>
        </CardHeader>
        <CardContent className="-mt-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="lg:col-span-3">
        <CardHeader className="bg-teal-600 border-none pb-8 text-white rounded-t-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal-50 uppercase tracking-[0.2em] text-[10px] font-bold">Upcoming Session</p>
              <CardTitle className="text-white mt-1">No Sessions Today</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="-mt-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <p className="text-text-muted text-center py-8">
              You have no sessions scheduled for today. Check your full schedule for upcoming classes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessionDate = new Date(session.date);
  const timeString = `${session.startTime} - ${session.endTime}`;
  const dateString = sessionDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const getTimeUntilBadge = () => {
    if (!session.minutesUntilStart) return "Today";
    if (session.minutesUntilStart < 0) return "In progress";
    if (session.minutesUntilStart < 60) return `In ${session.minutesUntilStart} mins`;
    const hours = Math.floor(session.minutesUntilStart / 60);
    const mins = session.minutesUntilStart % 60;
    return `In ${hours}h ${mins}m`;
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="bg-teal-600 border-none pb-8 text-white rounded-t-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-teal-50 uppercase tracking-[0.2em] text-[10px] font-bold">Upcoming Session</p>
            <CardTitle className="text-white mt-1">{session.courseName}</CardTitle>
          </div>
          <Badge className="bg-white/20 border-none text-white backdrop-blur-sm">
            {getTimeUntilBadge()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="-mt-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-text">{timeString}</p>
              <p className="text-text-muted text-xs">{dateString}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-text">
                {session.isOnline ? "Online" : session.room}
              </p>
              <p className="text-text-muted text-xs">
                {session.isOnline ? "Virtual Session" : session.building}
              </p>
            </div>
          </div>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 mt-2">
            Launch Session Materials
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
