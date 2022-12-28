import { ActorRefWithDeprecatedState } from "xstate";
import { TimerMachineContext, TimerMachineEvent } from "../TimerMachine/types";

export type WithStartAndEndDate = {
  startDate: Date;
  endDate: Date;
};

export type Session = {
  type: "session" | "rest";
  title: string;
  note: string;
  projectId: string;
  pauses: WithStartAndEndDate[];
} & WithStartAndEndDate;

export type SessionMachineContext = {
  timerRef?: ActorRefWithDeprecatedState<
    TimerMachineContext,
    TimerMachineEvent,
    any,
    any
  >;
  sessions: Session[];
  startDate: Date;
  pauseDate: Date;
  pauses: WithStartAndEndDate[];
  title: string;
};

export enum SessionMachineEventType {
  INIT_FOCUS = "INIT_FOCUS",
  BREATHE_END = "BREATHE_END",
  TIMER_END = "TIMER_END",
  OVERFLOW_REVERSED = "OVERFLOW_REVERSED",
  STOP_WORKING = "STOP_WORKING",
  COMPLETE_TASK = "COMPLETE_TASK",
  PAUSE = "PAUSE",
  UNPAUSE = "UNPAUSE",
  INCREMENT = "INCREMENT",
  DECREMENT = "DECREMENT",
  ABANDON_SESSION = "ABANDON_SESSION",
  OVERRIDE_STATE = "OVERRIDE_STATE",
  RECORD_PAUSE = "RECORD_PAUSE",
  TAKE_A_BREAK = "TAKE_A_BREAK",
}

export type TakeABreakEvent = {
  type: SessionMachineEventType.TAKE_A_BREAK;
  second: number;
};
export type InitFocusEvent = {
  type: SessionMachineEventType.INIT_FOCUS;
  second: number;
  startDate: Date;
};
export type RecordPauseEvent = {
  type: SessionMachineEventType.RECORD_PAUSE;
  second: number;
  nextTarget: "idle" | "rest";
} & WithStartAndEndDate;

export type SessionMachineEvent =
  | InitFocusEvent
  | {
      type: "BREATHE_END";
    }
  | {
      type: "TIMER_END";
    }
  | { type: "OVERFLOW_REVERSED" }
  | {
      type: "STOP_WORKING";
    }
  | {
      type: "COMPLETE_TASK";
    }
  | { type: "PAUSE" }
  | { type: "UNPAUSE" }
  | { type: "INCREMENT"; second: number }
  | { type: "DECREMENT"; second: number }
  | { type: "ABANDON_SESSION" }
  | { type: "OVERRIDE_STATE"; state: Partial<SessionMachineContext> }
  | RecordPauseEvent
  | TakeABreakEvent;

export enum SessionMachineStates {
  IDLE = "IDLE",
  BREATHE = "BREATHE",
  SESSION = "SESSION",
  SESSION_PAUSED = "SESSION_PAUSED",
  SESSION_END = "SESSION_END",
  REST = "REST",
  REST_END = "REST_END",
}

export type SessionEventPause = {
  type: SessionMachineEventType.PAUSE;
  startDate: Date;
  endDate: Date;
};
