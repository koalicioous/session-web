import {
    ActorRefWithDeprecatedState,
    assign,
    send,
    spawn,
    actions,
    createMachine,
} from 'xstate'
import TimerMachine from '../TimerMachine'
import { TimerEventStart, TimerMachineContext, TimerMachineEvent, TimerMachineEventType } from '../TimerMachine/types'

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

type SessionMachineEvent =
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


const sessionMachineInitialState: SessionMachineContext = {
    timerRef: undefined,
    startDate: new Date(),
    pauseDate: new Date(),
    pauses: [],
    title: "",
    sessions: []
}

export enum SessionMachineEventType {
    PAUSE = "PAUSE",
}

export type SessionEventPause = {
    type: SessionMachineEventType.PAUSE
    startDate: Date
    endDate: Date
}

const appendPauses = assign<
    SessionMachineContext,
    SessionEventPause
>((ctx, event) => ({
    pauses: [
        ...ctx.pauses,
        {
            startDate: event.startDate,
            endDate: event.endDate
        }
    ],
}))

const spawnTimer = [
    assign<SessionMachineContext>((ctx) => ({
        timerRef: spawn(TimerMachine, "timer"),
        startDate: new Date()
    })),
    send<TimerMachineContext,TimerEventStart>(
        (_,ev) => ({
            type: TimerMachineEventType.START,
            durationSecond: ev.durationSecond ?? 999
        })
    ),
    {
        to: "timer"
    }
]

const commitTimer = (type: "session" | "rest" ) =>
    assign<SessionMachineContext>((ctx) => ({
        sessions: [
            ...ctx.sessions,
            {
                type,
                title: ctx.title,
                startDate: ctx.startDate,
                endDate: new Date(),
                note: "",
                projectId: "",
                pauses: ctx.pauses
            }
        ]
    }))

const resetTimerActions = [
    actions.stop("timer"),
    assign<SessionMachineContext>({
        timerRef: undefined,
        title: "",
        pauses: []
    })
]

const SessionMachine = createMachine<
    SessionMachineContext,
    SessionMachineEvent
>({},{})

export default SessionMachine;