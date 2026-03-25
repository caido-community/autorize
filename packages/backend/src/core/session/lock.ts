import { debugLog } from "../../utils";

type Release = () => void;

class SessionLockManager {
  private locks = new Map<string, Promise<void>>();
  private refreshVersions = new Map<string, number>();

  getRefreshVersion(profileId: string): number {
    return this.refreshVersions.get(profileId) ?? 0;
  }

  incrementRefreshVersion(profileId: string): void {
    const current = this.getRefreshVersion(profileId);
    this.refreshVersions.set(profileId, current + 1);
  }

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
