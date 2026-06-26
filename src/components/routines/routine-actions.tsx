"use client";

import { useTransition } from "react";
import { deleteRoutine, toggleRoutineActive } from "@/lib/actions/routine-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MoreHorizontal, Trash2, Pause, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface RoutineActionsProps {
  routineId: string;
  isActive: boolean;
}

export function RoutineActions({ routineId, isActive }: RoutineActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      await toggleRoutineActive(routineId);
      toast.success(isActive ? "Routine paused" : "Routine activated");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRoutine(routineId);
      toast.success("Routine deleted");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
            {isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Routine
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate Routine
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Routine
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Routine</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All steps and progress logs for this
              routine will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
