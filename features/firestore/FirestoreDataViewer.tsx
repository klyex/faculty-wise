'use client';

import { useUsers, useSchedules, useCourses, useRooms } from '@/lib/hooks/useFirestore';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';

export function FirestoreDataViewer() {
  const { data: users, loading: usersLoading, error: usersError } = useUsers();
  const { data: schedules, loading: schedulesLoading, error: schedulesError } = useSchedules();
  const { data: courses, loading: coursesLoading, error: coursesError } = useCourses();
  const { data: rooms, loading: roomsLoading, error: roomsError } = useRooms();

  const [activeTab, setActiveTab] = useState<'users' | 'schedules' | 'courses' | 'rooms'>('users');

  const tabs = [
    { id: 'users', label: 'Users', count: users.length },
    { id: 'schedules', label: 'Schedules', count: schedules.length },
    { id: 'courses', label: 'Courses', count: courses.length },
    { id: 'rooms', label: 'Rooms', count: rooms.length },
  ] as const;

  return (
    <div className="w-full space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-900">✅ Firebase Firestore Connected</h2>
        <p className="text-sm text-green-700 mt-1">Project ID: zenvibe-b70f0</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm font-normal">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'users' && (
          <>
            {usersLoading && <p className="text-gray-600">Loading users...</p>}
            {usersError && <p className="text-red-600">Error: {usersError.message}</p>}
            <div className="grid gap-4">
              {users.map(user => (
                <Card key={user.id} className="p-4">
                  <h3 className="font-semibold">{user.displayName}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{user.role}</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{user.departmentId}</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'schedules' && (
          <>
            {schedulesLoading && <p className="text-gray-600">Loading schedules...</p>}
            {schedulesError && <p className="text-red-600">Error: {schedulesError.message}</p>}
            <div className="grid gap-4">
              {schedules.map(schedule => (
                <Card key={schedule.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{schedule.courseId}</h3>
                      <p className="text-sm text-gray-600">{schedule.dayOfWeek}</p>
                    </div>
                    <span className="text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Teacher</p>
                      <p className="font-medium">{schedule.teacherId}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Room</p>
                      <p className="font-medium">{schedule.roomId}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Semester</p>
                      <p className="font-medium">{schedule.semester}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'courses' && (
          <>
            {coursesLoading && <p className="text-gray-600">Loading courses...</p>}
            {coursesError && <p className="text-red-600">Error: {coursesError.message}</p>}
            <div className="grid gap-4">
              {courses.map(course => (
                <Card key={course.id} className="p-4">
                  <h3 className="font-semibold">{course.name}</h3>
                  <p className="text-sm text-gray-600">{course.id}</p>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Department</p>
                      <p className="font-medium">{course.department}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Credits</p>
                      <p className="font-medium">{course.credits}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Capacity</p>
                      <p className="font-medium">{course.capacity} students</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'rooms' && (
          <>
            {roomsLoading && <p className="text-gray-600">Loading rooms...</p>}
            {roomsError && <p className="text-red-600">Error: {roomsError.message}</p>}
            <div className="grid gap-4">
              {rooms.map(room => (
                <Card key={room.id} className="p-4">
                  <h3 className="font-semibold">{room.name}</h3>
                  <p className="text-sm text-gray-600">{room.building}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Type</p>
                      <p className="font-medium capitalize">{room.type}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Capacity</p>
                      <p className="font-medium">{room.capacity}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
