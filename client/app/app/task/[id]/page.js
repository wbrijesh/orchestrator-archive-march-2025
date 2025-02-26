'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookie';
import { api } from '@/lib/api';
import TopBar from '@/components/blocks/top-bar';
import { useUser } from '@/context/UserContext';
import SessionReplayer from '@/components/blocks/session-replayer';

export default function TaskDetails({ params }) {
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState(null);
  const unwrappedParams = React.use(params);
  const { userData, loading } = useUser();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = getCookie('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await api.tasks.getById(token, unwrappedParams.id);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Task not found');
          } else {
            throw new Error('Failed to fetch task');
          }
          return;
        }

        const data = await response.json();
        setTask(data);
      } catch (error) {
        setError('Failed to fetch task details');
        console.error('Error:', error);
      }
    };

    const fetchSessionRecording = async () => {
      try {
        const response = await fetch('/api/recording');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch recording');
        }
        setEvents(data);
      } catch (err) {
        console.error('Error fetching session recording:', err);
        setError('Failed to load session recording');
      }
    };

    if (unwrappedParams.id) {
      fetchTask();
      fetchSessionRecording();
    }
  }, [unwrappedParams.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <TopBar userData={userData} />
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar userData={userData} />
      <div className="flex-grow grid grid-cols-12 gap-6 px-6 pb-6">
        <div className="col-span-5 bg-white shadow rounded-lg p-6 h-full">
          {task && (
            <>
              <h1 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">{task.name}</h1>
              <p className="mt-4 text-neutral-400">ID: {task.id}</p>
            </>
          )}
        </div>
        <div className="col-span-7 h-full">
          {/* <h2 className="text-lg text-gray-700 mb-4">Session Recording</h2> */}
          {events ? (
            <SessionReplayer events={events} />
          ) : (
            <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded">
              <p className="text-gray-500">Loading session recording...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}