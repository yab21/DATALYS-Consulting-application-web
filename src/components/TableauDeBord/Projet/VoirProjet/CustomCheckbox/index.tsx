import React from "react";
import { Checkbox, Link, User, Chip, cn } from "@heroui/react";

interface UserType {
  name: string;
  username: string;
  url: string;
  role: string;
}

interface CustomCheckboxProps {
  user: UserType;
  value: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ user, value }) => {
  return (
    <Checkbox
      aria-label={user.name}
      classNames={{
        base: cn(
          "inline-flex max-w-2xl w-full hover:bg-gray-3 bg-gray-2 dark:bg-dark-2 m-0",
          "dark:hover:bg-dark-3 items-center justify-start",
          "cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
          "data-[selected=true]:border-primary",
        ),
        label: "w-full",
      }}
     
    >
      <div className="flex w-full justify-between gap-2">
        <User
          description={
            <Link isExternal href={user.url} size="sm">
              @{user.username}
            </Link>
          }
          name={user.name}
        />
        <div className="flex flex-col items-end gap-1">
          <span className="text-tiny text-default-500">{user.role}</span>
        </div>
      </div>
    </Checkbox>
  );
};
