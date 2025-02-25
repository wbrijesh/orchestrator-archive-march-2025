'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import { History, Inbox, ArrowUp } from 'lucide-react';
import Spacer from '@/components/ui/spacer';

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await api.userData(token);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.details || data.error || 'Failed to fetch user data');
        }

        const responseData = await res.json();
        localStorage.setItem('userData', JSON.stringify(responseData.user));
        setUserData(responseData.user);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('token') || err.message.includes('unauthorized')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          router.push('/auth/login');
        }
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    router.push('/auth/login');
  };

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
        <div className='flex h-14 px-5 items-center justify-between'>
          <p className='text-lg font-medium'>Orchestrator</p>
          <div className='flex items-center gap-4'>
            <Inbox className='h-6 w-6 text-neutral-600' />
            <History className='h-6 w-6 text-neutral-600' />
            <Image src={'/a.jpeg'} className='rounded-full' width={25} height={25} alt='avatar' />
          </div>
        </div>
        <div className='h-[calc(100vh-3.5rem)] flex items-center justify-center text-center -mt-10'>
          <div>
          <p className='text-[32px] font-medium text-neutral-700'>
            Good evening, {userData && `${userData.first_name} ${userData.last_name}`}.
          </p>
          <p className='text-[32px] font-medium text-[#777777]'>How can we help you today?</p>
          <Spacer direction='vertical' size={50} />
          <TaskInput />
          </div>
        </div>
      </div>
    </>
  );
}

const TaskInput = () => {
  const [rows, setRows] = useState(2);

  const handleTextareaChange = (e) => {
    const textareaLineHeight = 24;
    const previousRows = e.target.rows;
    e.target.rows = 2;
    const currentRows = ~~(e.target.scrollHeight / textareaLineHeight);
    if (currentRows === previousRows) {
      e.target.rows = currentRows;
    }
    setRows(currentRows);
  };

  return (
    <div className='border border-neutral-200 rounded-4xl p-6 bg-white w-[800px]'>
      <textarea
        className='w-full border-none outline-none resize-none overflow-hidden'
        placeholder='Type something...'
        rows={rows}
        onChange={handleTextareaChange}
        style={{ minHeight: '48px' }}
      />
      <div className='flex items-center justify-between mt-4'>
        <p className='text-neutral-400'>Pick platforms if any</p>
        <div className='rounded-full bg-[#E77F56] text-white p-1'>
          <ArrowUp className='h-6 w-6' />
        </div>
      </div>
    </div>
  )
}