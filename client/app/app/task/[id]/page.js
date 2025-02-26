'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookie';
import { api } from '@/lib/api';
import TopBar from '@/components/blocks/top-bar';
import { useUser } from '@/context/UserContext';

export default function TaskDetails({ params }) {
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
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

    if (unwrappedParams.id) {
      fetchTask();
    }
  }, [unwrappedParams.id]);

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

  if (!task) {
    return (
      <div className="min-h-screen">
        <TopBar userData={userData} />
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar userData={userData} />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">{task.name}</h1>
            <div className="text-sm text-gray-500">
              Created at: {new Date(task.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
