"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getPlatform, triggerInstallPrompt } from "@/lib/pwa/install";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hideInstallDrawerAction,
  selectShowInstallDrawer,
  setCanInstall,
} from "@/store/slices/notifications.slice";

interface InstallPromptDrawerProps {
  dictionary: {
    title: string;
    description: string;
    iosInstructions: string;
    install: string;
    later: string;
  };
}

export function InstallPromptDrawer({ dictionary }: InstallPromptDrawerProps) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectShowInstallDrawer);
  const [isIOS, setIsIOS] = useState(false);

  // Detect platform on client side only to avoid SSR issues
  useEffect(() => {
    setIsIOS(getPlatform() === "ios");
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install
      return;
    }

    const result = await triggerInstallPrompt();
    if (result?.outcome === "accepted") {
      dispatch(setCanInstall(false));
      dispatch(hideInstallDrawerAction());
    }
  };

  const handleDismiss = () => {
    dispatch(hideInstallDrawerAction());
    // Store dismissal in localStorage to avoid re-prompting too soon
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && handleDismiss()}
      repositionInputs={false}
    >
      <DrawerContent data-testid="pwa-install-drawer">
        <DrawerHeader className="text-left">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <DrawerTitle>{dictionary.title}</DrawerTitle>
          <DrawerDescription>{dictionary.description}</DrawerDescription>
        </DrawerHeader>

        {isIOS && (
          <div className="px-4 pb-4" data-testid="pwa-install-ios-instructions">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <Share className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {dictionary.iosInstructions}
                </p>
              </div>
            </div>
          </div>
        )}

        <DrawerFooter className="pt-2">
          {!isIOS && (
            <Button
              onClick={handleInstall}
              data-testid="pwa-install-button"
              className="w-full"
            >
              {dictionary.install}
            </Button>
          )}
          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={handleDismiss}
              data-testid="pwa-install-dismiss"
              className="w-full"
            >
              {dictionary.later}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
