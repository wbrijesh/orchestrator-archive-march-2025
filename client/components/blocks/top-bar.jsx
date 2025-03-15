import { History, Inbox } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import LogoIcon from "@/components/ui/logo-icon";
import { authCallbacks } from "@/lib/callbacks";

const TopBar = ({ userData }) => {
  const router = useRouter();

  const handleLogout = () => {
    authCallbacks.handleLogout();
    router.push("/auth/login");
  };

  const getInitials = () => {
    return `${userData.first_name[0]}${userData.last_name[0]}`;
  };

  const getFullName = () => {
    return `${userData.first_name} ${userData.last_name}`;
  };

  return (
    userData.id && (
      <>
        <div className="flex h-14 px-5 items-center justify-between">
          <Link href={"/app"}>
            <LogoIcon className="h-12 -mx-2" />
          </Link>
          <div className="flex items-center gap-4">
            <Inbox className="size-6 text-muted-foreground" />
            <History className="size-6 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback className="bg-amber-900 text-white text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{getFullName()}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </>
    )
  );
};

export default TopBar;
