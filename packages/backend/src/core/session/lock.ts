import { debugLog } from "../../utils";

type Release = () => void;

class SessionLockManager {
  private locks = new Map<string, Promise<void>>();

  async acquire(profileId: string): Promise<Release> {
    while (this.locks.has(profileId)) {
      debugLog(`Waiting for session lock on profile ${profileId}`);
      await this.locks.get(profileId);
    }

    let releaseRef: Release = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseRef = resolve;
    });

    this.locks.set(profileId, lockPromise);
    debugLog(`Session lock acquired for profile ${profileId}`);

    return () => {
      this.locks.delete(profileId);
      releaseRef();
      debugLog(`Session lock released for profile ${profileId}`);
    };
  }
}

export const sessionLockManager = new SessionLockManager();
