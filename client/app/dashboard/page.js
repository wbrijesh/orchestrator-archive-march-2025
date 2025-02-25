'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { History, Inbox, ArrowUp } from 'lucide-react';
import Spacer from '@/components/ui/spacer';
import TaskInput from '@/components/blocks/task-input';
import { getCookie, setCookie, removeCookie } from '@/lib/cookie';
import TimeBasedGreeting from '@/lib/time-based-greeting';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  const [task, setTask] = useState('');
  const [taskActive, setTaskActive] = useState(false);

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const storedUserData = getCookie('userData');
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
        setCookie('userData', JSON.stringify(responseData.user));
        setUserData(responseData.user);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('token') || err.message.includes('unauthorized')) {
          removeCookie('token');
          removeCookie('userData');
          router.push('/auth/login');
        }
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    removeCookie('token');
    removeCookie('userData');
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
    userData &&
    <>
      <div className='min-h-screen'>
        <div className='flex h-14 px-5 items-center justify-between'>
          <p className='text-lg font-medium text-neutral-700'>
            Orchestrator
          </p>
          <div className='flex items-center gap-4'>
            <Inbox className='size-6 text-muted-foreground' />
            <History className='size-6 text-muted-foreground' />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback className='bg-amber-900 text-white text-sm'>
                    {userData && `${userData.first_name[0]}${userData.last_name[0]}`}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className='h-[calc(100vh-3.5rem)] flex items-center justify-center text-center -mt-10'>
          <div>
            <p className='text-[32px] font-medium text-neutral-700'>
              {
                TimeBasedGreeting()
              }, {userData && `${userData.first_name} ${userData.last_name}`}.
            </p>
            <p className='text-[32px] font-medium text-[#777777]'>How can we help you today?</p>
            <Spacer direction='vertical' size={50} />
            <TaskInput task={task} setTask={setTask} setActive={setTaskActive} />
          </div>
        </div>
      </div>
    </>
  );
}