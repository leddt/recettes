import { useAuthActions } from "@convex-dev/auth/react";
import { LogOutIcon, MoreVerticalIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderSettingsMenu() {
  const { signOut } = useAuthActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            variant="outline"
            className="sm:hidden"
            aria-label="Menu"
          />
        }
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem nativeButton={false} render={<Link to="/settings" />}>
            <SettingsIcon />
            Paramètres
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void signOut()}
        >
          <LogOutIcon />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
