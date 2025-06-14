'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import TopBar from '@/components/blocks/top-bar';
import Spacer from '@/components/ui/spacer';
import TaskInput from '@/components/blocks/task-input';

import { useUser } from '@/context/UserContext';
import TimeBasedGreeting from '@/lib/time-based-greeting';
import { taskCallbacks } from '@/lib/callbacks';

export default function Dashboard() {
  const router = useRouter();
  const [task, setTask] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { userData, loading } = useUser();

  useEffect(() => {
    if (taskSubmitting && task) {
      taskCallbacks.handleTaskSubmit(task, router, setError);
    }
  }, [taskSubmitting, task, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='min-h-screen'>
        <TopBar userData={userData} />

        <div className='h-[calc(100vh-3.5rem)] flex items-center justify-center text-center -mt-10'>
          <div>
            <p className='text-[32px] font-medium text-neutral-700'>
              {userData && `${TimeBasedGreeting() + ", " + userData.first_name + " " + userData.last_name}`}.
            </p>
            <p className='text-[32px] font-medium text-[#777777]'>How can we help you today?</p>
            <Spacer direction='vertical' size={50} />
            <TaskInput task={task} setTask={setTask} setTaskSubmitting={setTaskSubmitting} taskSubmitting={taskSubmitting} />
          </div>
        </div>

      </div>
    </>
  );
}