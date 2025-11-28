"use client";

import { useEffect, useRef } from "react";
import { useStickToBottomContext } from "@/components/ai-elements/conversation";
import { useAppDispatch } from "@/store/hooks";
import { fetchMoreMessages } from "@/store/slices/chat.slice";

/**
 * Inner component that handles infinite scroll detection
 * Must be rendered inside a Conversation (StickToBottom) component
 */
export function InfiniteScrollHandler({
  chatId,
  hasMoreMessages,
  loadingMore,
}: {
  chatId: string;
  hasMoreMessages: boolean;
  loadingMore: boolean;
}) {
  const dispatch = useAppDispatch();
  const { scrollRef, stopScroll } = useStickToBottomContext();
  const previousScrollHeightRef = useRef<number>(0);
  const previousScrollTopRef = useRef<number>(0);

  // Set up scroll event listener for infinite scroll
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      if (loadingMore || !hasMoreMessages) return;

      // Trigger load when within 100px of the top
      if (scrollElement.scrollTop < 100) {
        // Store current scroll state before loading
        previousScrollHeightRef.current = scrollElement.scrollHeight;
        previousScrollTopRef.current = scrollElement.scrollTop;
        // Stop the auto-scroll behavior so it doesn't jump to bottom
        stopScroll();
        dispatch(fetchMoreMessages({ chatId }));
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [scrollRef, chatId, hasMoreMessages, loadingMore, dispatch, stopScroll]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (
      !scrollElement ||
      loadingMore ||
      previousScrollHeightRef.current === 0
    ) {
      return;
    }

    // Calculate how much content was added and adjust scroll position
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const newScrollHeight = scrollElement.scrollHeight;
      const heightDiff = newScrollHeight - previousScrollHeightRef.current;

      if (heightDiff > 0) {
        // Restore scroll position: add the height difference to maintain visual position
        scrollElement.scrollTop = previousScrollTopRef.current + heightDiff;
      }

      previousScrollHeightRef.current = 0;
      previousScrollTopRef.current = 0;
    });
  }, [scrollRef, loadingMore]);

  return null;
}
