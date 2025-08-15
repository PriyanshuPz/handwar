import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Player, GameRoom } from "../types";

interface OnlineLobbyState {
  isFindingMatch: boolean;
  isCustomRoomDialogOpen: boolean;
  isRoomMemberView: boolean;
  roomId: string | null;
  gameRoom: GameRoom | null;
  members: Player[];
  isHost: boolean;
  setFindingMatch: (isFinding: boolean) => void;
  setCustomRoomDialogOpen: (isOpen: boolean) => void;
  setRoomMemberView: (isMemberView: boolean) => void;
  setRoomId: (id: string | null) => void;
  setGameRoom: (room: GameRoom | null) => void;
  setMembers: (members: Player[]) => void;
  setIsHost: (isHost: boolean) => void;
  reset: () => void;
}

const initialState = {
  isFindingMatch: false,
  isCustomRoomDialogOpen: false,
  isRoomMemberView: false,
  roomId: null,
  gameRoom: null,
  members: [],
  isHost: false,
};

export const useOnlineLobbyStore = create<OnlineLobbyState>()(
  persist(
    (set) => ({
      ...initialState,
      setFindingMatch: (isFinding) => set({ isFindingMatch: isFinding }),
      setCustomRoomDialogOpen: (isOpen) =>
        set({ isCustomRoomDialogOpen: isOpen }),
      setRoomMemberView: (isMemberView) =>
        set({ isRoomMemberView: isMemberView }),
      setRoomId: (id) => set({ roomId: id }),
      setGameRoom: (room) => set({ gameRoom: room }),
      setMembers: (members) => set({ members }),
      setIsHost: (isHost) => set({ isHost }),
      reset: () => set(initialState),
    }),
    {
      name: "online-lobby-storage",
      partialize: (state) => ({
        isRoomMemberView: state.isRoomMemberView,
        roomId: state.roomId,
        gameRoom: state.gameRoom,
        isHost: state.isHost,
      }),
    }
  )
);
