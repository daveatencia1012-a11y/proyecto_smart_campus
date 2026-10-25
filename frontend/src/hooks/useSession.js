import { useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribe } from "../services/session";

function useSession() {
  return useSyncExternalStore(subscribe, getSessionSnapshot, getSessionSnapshot);
}

export default useSession;
