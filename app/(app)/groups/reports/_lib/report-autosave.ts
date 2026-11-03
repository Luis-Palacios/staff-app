/**
 * Report auto-save (auto-save rules 6–9, 11): the save queue, the device outbox and the status the
 * indicator shows. `ReportAutosave` is a plain class with no React in it, so it can be tested on its
 * own; `useReportAutosave` is the thin hook the editor uses.
 *
 * - Every change is written to the device first (`localStorage`), then sent; the device copy is
 *   removed once the server confirms the latest change.
 * - One request in flight at a time. Changes made meanwhile go out together, as one save of the
 *   latest snapshot, when it returns: two saves at once would collide on their own version.
 * - Taps go out after `TAP_DELAY_MS` (quick taps coalesce), typing after `TEXT_DELAY_MS` without a
 *   keystroke, a field losing focus at once.
 * - A failed request (offline) or a retryable failure (5xx, 429) is retried with `RETRY_DELAYS_MS`,
 *   and at once when the browser comes back online.
 * - A 409 `changed since` stops the queue: the device copy stays until the leader reloads.
 * - A 422 `attendance` asks the editor to reload the roster, then sends the rebuilt report.
 */

import type { ReportInput } from "@/api/small-groups-api/types";
import type {
  CreateReportResult,
  ReportFailure,
  SaveReportResult,
} from "@/app/(app)/groups/reports/_actions/report-actions";
import type { ReportConflict } from "@/lib/api-error-message";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/** Quick taps (yes / no, mode, an item added) coalesce into one save. */
export const TAP_DELAY_MS = 300;
/** Typing saves after this long without a keystroke (rule 6: about 3 s). */
export const TEXT_DELAY_MS = 3000;
/** Waits between retries; the last one repeats. */
export const RETRY_DELAYS_MS = [2000, 5000, 15000, 30000] as const;
/** Roster reloads in a row before a 422 `attendance` is shown as an error instead. */
const MAX_ROSTER_RELOADS = 2;

const OUTBOX_PREFIX = "ekk-report-outbox:";

/** How a change was made, which decides how soon it is sent. */
export type ChangeKind = "tap" | "text" | "blur";

export type SaveState =
  /** `savedAt` is null when nothing was saved in this visit yet (it shows "Saved"). */
  | { status: "saved"; savedAt: string | null }
  | { status: "saving" }
  /** The change is on the device and will go out when the connection is back. */
  | { status: "offline" }
  /**
   * The API refused or failed. `retrying`: a 5xx or 429, tried again on its own; otherwise the
   * next change (or Retry) tries again. `message` is already translated.
   */
  | { status: "error"; retrying: boolean; message: string }
  /**
   * A submitted report with someone unanswered (its date or roster changed): it can't be saved
   * until everyone is answered (rule 5), so the change waits on the device.
   */
  | { status: "held" }
  /** Someone saved first (rule 9): nothing is sent until the leader reloads. */
  | { status: "conflict"; conflict: ReportConflict };

/** What the device keeps for a report until the server has it. */
export interface OutboxEntry<TForm> {
  /** Null for a report that isn't created yet. */
  reportId: number | null;
  /** The server version the change is based on; null before the report exists. */
  baseVersion: number | null;
  body: ReportInput;
  /** The editor's own state, to restore the screen (names of tagged people, unsent notes). */
  form: TForm;
  /** ISO timestamp. */
  changedAt: string;
}

/** The outbox key of a saved report, or of a new one (group and date) before it is created. */
export function outboxKey(
  target: { reportId: number } | { groupId: number; date: string },
): string {
  return "reportId" in target
    ? `${OUTBOX_PREFIX}${target.reportId}`
    : `${OUTBOX_PREFIX}new:${target.groupId}:${target.date}`;
}

// Storage is a buffer, never required: private windows and blocked storage throw, and then the
// engine just works without a device copy.
function readOutbox<TForm>(key: string): OutboxEntry<TForm> | null {
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as OutboxEntry<TForm>;

    return typeof parsed === "object" && parsed !== null && parsed.body
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function writeOutbox<TForm>(key: string, entry: OutboxEntry<TForm>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Full or blocked: the save still goes to the server.
  }
}

function removeOutbox(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}

/** The device copy of a report, for the editor to restore on open. */
export function loadOutbox<TForm>(
  target: Parameters<typeof outboxKey>[0],
): OutboxEntry<TForm> | null {
  return typeof window === "undefined" ? null : readOutbox(outboxKey(target));
}

export function clearOutbox(target: Parameters<typeof outboxKey>[0]) {
  removeOutbox(outboxKey(target));
}

export interface AutosaveOptions<TForm> {
  /** The report being edited; null for a new one, created (as a draft) by the first save. */
  reportId: number | null;
  /** The server version the editor opened; ignored without `reportId`. */
  version: number;
  /** When the opened report was last saved, for the first "Saved · time". */
  savedAt?: string | null;
  /** Group and date of a new report: the outbox key until it has an id. */
  newTarget?: { groupId: number; date: string };
  save: (
    id: number,
    version: number,
    body: ReportInput,
  ) => Promise<SaveReportResult>;
  /** Creates the draft; required without `reportId`. */
  create?: (body: ReportInput) => Promise<CreateReportResult>;
  /** The report now exists (the editor moves to its URL). */
  onCreated?: (id: number, version: number) => void;
  /**
   * A 422 `attendance`: the roster for the date changed (rule 11). The editor reloads it, adds the
   * new people unanswered, drops the ones gone, and returns the rebuilt report and form (null when
   * the roster can't be read).
   */
  onRosterChanged?: () => Promise<{ body: ReportInput; form: TForm } | null>;
  /** Any other failure the editor handles itself (a date taken, a draft in progress). */
  onFailure?: (failure: ReportFailure) => void;
  /** False holds the change on the device (a submitted report with someone unanswered). */
  canSend?: (body: ReportInput) => boolean;
  /** For tests; defaults to `navigator.onLine`. */
  isOnline?: () => boolean;
}

/** Retry `n` (0-based) waits this long. */
function retryDelay(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
}

export class ReportAutosave<TForm> {
  private state: SaveState = { status: "saved", savedAt: null };
  private readonly listeners = new Set<() => void>();
  private reportId: number | null;
  private version: number;
  private key: string;
  /** The latest snapshot, sent by the next save. */
  private latest: { body: ReportInput; form: TForm; changedAt: string } | null =
    null;
  /** True while the snapshot has changes the server hasn't confirmed. */
  private dirty = false;
  private inFlight = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** When the pending send is due, and whether a tap (sooner) set it. */
  private dueKind: ChangeKind | null = null;
  private attempt = 0;
  private rosterReloads = 0;
  private stopped = false;
  private disposed = false;
  private waiters: ((version: number | null) => void)[] = [];

  constructor(private readonly options: AutosaveOptions<TForm>) {
    this.reportId = options.reportId;
    this.version = options.version;
    this.state = { status: "saved", savedAt: options.savedAt ?? null };
    this.key =
      options.reportId !== null
        ? outboxKey({ reportId: options.reportId })
        : outboxKey(options.newTarget ?? { groupId: 0, date: "" });
  }

  // ---- For the hook (useSyncExternalStore). ----

  getState = (): SaveState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };

  /** The server version of the report as last confirmed. */
  getVersion(): number {
    return this.version;
  }

  getReportId(): number | null {
    return this.reportId;
  }

  /** True while a change is only on the device (the page warns before leaving). */
  hasUnsent(): boolean {
    return this.dirty || this.inFlight;
  }

  // ---- What the editor calls. ----

  /** A change: the whole report as it is now. Written to the device at once, sent per `kind`. */
  change(body: ReportInput, form: TForm, kind: ChangeKind) {
    if (this.disposed) return;

    this.latest = { body, form, changedAt: new Date().toISOString() };
    this.dirty = true;
    this.writeDevice();

    // After a conflict nothing goes out until Reload (rule 9); the device copy is still updated.
    if (this.stopped) return;

    if (!this.online()) {
      this.setState({ status: "offline" });

      return;
    }

    this.schedule(kind);
  }

  /** A field lost focus: typing waiting for its pause goes out now (rule 6). */
  blur() {
    if (this.dueKind === "text") this.schedule("blur");
  }

  /** Retry now (the Retry and Try again buttons, the `online` event). */
  retry() {
    if (this.stopped || this.disposed || !this.dirty) return;

    this.attempt = 0;
    this.schedule("blur");
  }

  /**
   * Sends anything pending and waits for the queue to empty. Resolves with the confirmed version,
   * or null when the change couldn't be saved (submit uses it, rule: flush before submitting).
   */
  flush(): Promise<number | null> {
    if (this.stopped) return Promise.resolve(null);

    if (!this.dirty && !this.inFlight) return Promise.resolve(this.version);

    const done = new Promise<number | null>((resolve) =>
      this.waiters.push(resolve),
    );

    if (!this.inFlight) this.schedule("blur");

    return done;
  }

  /** Reload after a conflict: the device copy is dropped, as the banner says. */
  discardDevice() {
    removeOutbox(this.key);
    this.dirty = false;
  }

  /**
   * A new report's group or date changed before it was created: its device copy follows. Does
   * nothing once the report exists (its date then changes through a save).
   */
  retarget(target: { groupId: number; date: string }) {
    if (this.reportId !== null) return;

    const next = outboxKey(target);

    if (next === this.key) return;

    removeOutbox(this.key);
    this.key = next;
    this.writeDevice();
  }

  /** The editor learned the report's newer version some other way (submit). */
  setVersion(version: number) {
    this.version = version;
  }

  /** The leader is done with this report (submit, discard): nothing more to send. */
  dispose() {
    this.disposed = true;
    this.clearTimer();
    this.resolveWaiters(null);
  }

  /**
   * The editor unmounts (another page): a change still waiting for its timer goes out now rather
   * than waiting on the device until the report is opened again. The engine stays usable, since
   * React may mount the same editor again (StrictMode, back navigation).
   */
  detach() {
    if (this.timer !== null && this.dueKind !== null) {
      this.clearTimer();
      void this.send();
    }
  }

  /** Shows the conflict banner without a request: the device copy is older than the server's. */
  markConflict(conflict: ReportConflict) {
    this.stopped = true;
    this.clearTimer();
    this.setState({ status: "conflict", conflict });
  }

  /** Starts with a device copy the server doesn't have yet: it goes out at once. */
  resume(body: ReportInput, form: TForm) {
    this.change(body, form, "blur");
  }

  /** The browser went offline: say so while something is unsent. */
  handleOffline() {
    if (this.hasUnsent() && !this.stopped) this.setState({ status: "offline" });
  }

  /** The browser came back online. */
  handleOnline() {
    if (this.state.status === "offline" || this.state.status === "error") {
      this.retry();
    }
  }

  // ---- Inside. ----

  private online(): boolean {
    if (this.options.isOnline) return this.options.isOnline();

    return typeof navigator === "undefined" || navigator.onLine !== false;
  }

  private setState(next: SaveState) {
    this.state = next;
    for (const listener of this.listeners) listener();
  }

  private writeDevice() {
    if (!this.latest) return;

    writeOutbox<TForm>(this.key, {
      reportId: this.reportId,
      baseVersion: this.reportId === null ? null : this.version,
      ...this.latest,
    });
  }

  private clearTimer() {
    if (this.timer !== null) clearTimeout(this.timer);

    this.timer = null;
    this.dueKind = null;
  }

  private schedule(kind: ChangeKind) {
    if (this.inFlight) return; // The request's return sends the rest.

    // A pending tap or blur is sooner than typing: keep it. Typing pushes a typing save out.
    if (this.timer !== null && kind === "text" && this.dueKind !== "text") {
      return;
    }

    // A save due at once is already pending.
    if (kind === "blur" && this.dueKind === "blur") return;

    this.clearTimer();
    this.dueKind = kind;

    const delay =
      kind === "blur" ? 0 : kind === "tap" ? TAP_DELAY_MS : TEXT_DELAY_MS;

    this.timer = setTimeout(() => {
      this.timer = null;
      this.dueKind = null;
      void this.send();
    }, delay);
  }

  private scheduleRetry() {
    const delay = retryDelay(this.attempt);

    this.attempt += 1;
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.send();
    }, delay);
  }

  private resolveWaiters(version: number | null) {
    const waiters = this.waiters;

    this.waiters = [];
    for (const resolve of waiters) resolve(version);
  }

  private async send() {
    if (this.inFlight || this.stopped || this.disposed || !this.latest) return;

    if (!this.dirty) {
      this.resolveWaiters(this.version);

      return;
    }

    if (!this.online()) {
      this.setState({ status: "offline" });
      this.resolveWaiters(null);

      return;
    }

    if (this.options.canSend && !this.options.canSend(this.latest.body)) {
      this.setState({ status: "held" });
      this.resolveWaiters(null);

      return;
    }

    const snapshot = this.latest;

    this.inFlight = true;
    this.dirty = false;
    this.setState({ status: "saving" });

    let result: SaveReportResult | CreateReportResult;

    try {
      result =
        this.reportId === null
          ? await this.createDraft(snapshot.body)
          : await this.options.save(this.reportId, this.version, snapshot.body);
    } catch {
      // The server action itself couldn't be reached: offline, or the connection dropped.
      this.inFlight = false;
      this.dirty = true;
      this.setState({ status: "offline" });
      this.resolveWaiters(null);
      this.scheduleRetry();

      return;
    }

    this.inFlight = false;

    if (this.disposed) return;

    if (result.ok) {
      this.handleSaved(result);

      return;
    }

    this.dirty = true;
    await this.handleFailure(result);
  }

  private async createDraft(body: ReportInput): Promise<CreateReportResult> {
    if (!this.options.create) throw new Error("No create for a new report.");

    const result = await this.options.create({ ...body, status: "draft" });

    if (result.ok) {
      // The device copy follows the report to its own key.
      removeOutbox(this.key);
      this.reportId = result.id;
      this.version = result.version;
      this.key = outboxKey({ reportId: result.id });
      this.writeDevice();
      this.options.onCreated?.(result.id, result.version);
    }

    return result;
  }

  private handleSaved(result: SaveReportResult | CreateReportResult) {
    if (!result.ok) return;

    this.version = result.version;
    this.attempt = 0;
    this.rosterReloads = 0;

    if (this.dirty) {
      // Changes arrived while this one was out: they go now, as one save.
      this.writeDevice();
      this.setState({ status: "saving" });
      void this.send();

      return;
    }

    removeOutbox(this.key);
    this.setState({
      status: "saved",
      savedAt: "savedAt" in result ? result.savedAt : new Date().toISOString(),
    });
    this.resolveWaiters(this.version);
  }

  private async handleFailure(failure: ReportFailure) {
    if (failure.kind === "conflict") {
      this.markConflict(
        failure.conflict ?? {
          version: null,
          lastEditedBy: null,
          lastEditedAt: null,
        },
      );
      this.resolveWaiters(null);

      return;
    }

    if (
      failure.kind === "rosterChanged" &&
      this.options.onRosterChanged &&
      this.rosterReloads < MAX_ROSTER_RELOADS
    ) {
      this.rosterReloads += 1;

      const rebuilt = await this.options.onRosterChanged();

      if (rebuilt && !this.disposed) {
        this.latest = { ...rebuilt, changedAt: new Date().toISOString() };
        this.dirty = true;
        this.writeDevice();
        void this.send();

        return;
      }
    }

    if (failure.kind === "network") {
      this.setState({
        status: "error",
        retrying: true,
        message: failure.message,
      });
      this.resolveWaiters(null);
      this.scheduleRetry();

      return;
    }

    // Retrying the same report won't help (a date taken, too many items): the next change or
    // Retry tries again, and the editor may handle it.
    this.setState({
      status: "error",
      retrying: false,
      message: failure.message,
    });
    this.options.onFailure?.(failure);
    this.resolveWaiters(null);
  }
}

/**
 * The editor's side of auto-save. Create one per report: a new `reportId` (after the first save of
 * a new report) keeps the same engine, which already moved to it.
 */
export function useReportAutosave<TForm>(options: AutosaveOptions<TForm>) {
  // The callbacks run later (after a request), so they read the latest options.
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  // One engine for the editor's lifetime.
  const [instance] = useState(
    () =>
      new ReportAutosave<TForm>({
        ...options,
        save: (...args) => latest.current.save(...args),
        create: (...args) =>
          latest.current.create
            ? latest.current.create(...args)
            : Promise.reject(new Error("No create for a saved report.")),
        onCreated: (...args) => latest.current.onCreated?.(...args),
        onRosterChanged: () =>
          latest.current.onRosterChanged?.() ?? Promise.resolve(null),
        onFailure: (failure) => latest.current.onFailure?.(failure),
        canSend: (body) => latest.current.canSend?.(body) ?? true,
      }),
  );

  const state = useSyncExternalStore(
    instance.subscribe,
    instance.getState,
    instance.getState,
  );

  useEffect(() => {
    const online = () => instance.handleOnline();
    const offline = () => instance.handleOffline();
    // Rule: warn before leaving only while a change is still only on this device.
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!instance.hasUnsent()) return;

      event.preventDefault();
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [instance]);

  useEffect(() => () => instance.detach(), [instance]);

  const change = useCallback(
    (body: ReportInput, form: TForm, kind: ChangeKind) =>
      instance.change(body, form, kind),
    [instance],
  );

  return { state, change, engine: instance };
}
