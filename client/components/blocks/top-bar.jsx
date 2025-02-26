import { History, Inbox } from 'lucide-react';
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
import { removeCookie } from '@/lib/cookie';
import { useRouter } from 'next/navigation';




const TopBar = () => {
    const router = useRouter();

    const handleLogout = () => {
        removeCookie('token');
        removeCookie('userData');
        router.push('/auth/login');
      };
    return (
        <>

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
            </div></>
    )
}

export default TopBar