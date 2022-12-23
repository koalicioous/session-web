
import { ActorRefWithDeprecatedState } from 'xstate'
import { TimerMachineContext, TimerMachineEvent } from '../TimerMachine/types'

export type WithStartAndEndDate = {
    startDate: Date
    endDate: Date
}

export type Session = {
    type: "session" | "rest",
    title: string
    note: string
    projectId: string
    pauses: WithStartAndEndDate[],
} & WithStartAndEndDate;

export type SessionMachineContext = {
    timerRef?: ActorRefWithDeprecatedState<
        TimerMachineContext,
        TimerMachineEvent,
        any,
        any
    >
    sessions: Session[]
    startDate: Date
    pauseDate: Date
    pauses: WithStartAndEndDate[]
    title: string
}

export type SessionMachineEvent =
  | {
      type: "INIT_FOCUS";
      second: number;
      startDate: Date;
    }
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
  | ({
      type: "RECORD_PAUSE";
      nextTarget?: "idle" | "rest";
    } & WithStartAndEndDate)
  | { type: "TAKE_A_BREAK"; second: number };

export enum SessionMachineStates {
    IDLE = "IDLE",
}

export enum SessionMachineEventType {
    PAUSE = "PAUSE",
}

export type SessionEventPause = {
    type: SessionMachineEventType.PAUSE
    startDate: Date
    endDate: Date
}