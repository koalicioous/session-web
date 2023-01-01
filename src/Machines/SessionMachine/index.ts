import {
  ActorRefWithDeprecatedState,
  assign,
  send,
  spawn,
  actions,
  createMachine,
} from "xstate";
import TimerMachine from "../TimerMachine";
import {
  TimerEventStart,
  TimerMachineContext,
  TimerMachineEvent,
  TimerMachineEventType,
  TimerMachineStates,
} from "../TimerMachine/types";
import {
  SessionMachineContext,
  SessionMachineEvent,
  SessionMachineStates,
  SessionEventPause,
  SessionMachineEventType,
  TakeABreakEvent,
  InitFocusEvent,
  RecordPauseEvent,
} from "./types";

const sessionMachineInitialState: SessionMachineContext = {
  timerRef: undefined,
  startDate: new Date(),
  pauseDate: new Date(),
  pauses: [],
  title: "",
  sessions: [],
};

const appendPauses = assign<SessionMachineContext, SessionEventPause>(
  (ctx, event) => ({
    pauses: [
      ...ctx.pauses,
      {
        startDate: event.startDate,
        endDate: event.endDate,
      },
    ],
  })
);

const spawnTimer = [
  assign<
    SessionMachineContext,
    TakeABreakEvent | InitFocusEvent | RecordPauseEvent
  >(() => ({
    timerRef: spawn(TimerMachine, "timer"),
    startDate: new Date(),
  })),
  //  Recheck here later for passed values
  send(
    (_, ev: TakeABreakEvent | InitFocusEvent | RecordPauseEvent) => ({
      type: TimerMachineEventType.START,
      durationSecond: ev.second,
    }),
    { to: "timer" }
  ),
];

const commitTimer = (type: "session" | "rest") =>
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
        pauses: ctx.pauses,
      },
    ],
  }));

const resetTimerActions = [
  actions.stop("timer"),
  assign<SessionMachineContext>({
    timerRef: undefined,
    title: "",
    pauses: [],
  }),
];

const SessionMachine = createMachine<
  SessionMachineContext,
  SessionMachineEvent
>(
  {
    predictableActionArguments: true,
    id: "session",
    initial: SessionMachineStates.IDLE,
    context: sessionMachineInitialState,
    states: {
      [SessionMachineStates.IDLE]: {
        entry: resetTimerActions,
        on: {
          [SessionMachineEventType.TAKE_A_BREAK]: {
            target: SessionMachineStates.REST,
            actions: spawnTimer,
          },
          [SessionMachineEventType.INIT_FOCUS]: {
            target: SessionMachineStates.BREATHE,
            actions: [
              assign<SessionMachineContext, InitFocusEvent>(() => ({
                timerRef: spawn(TimerMachine, "timer"),
                startDate: new Date(),
              })),
              //  Recheck here later for passed values
              send(
                (_, ev) => ({
                  type: TimerMachineEventType.START,
                  durationSecond: ev.second,
                }),
                { to: "timer" }
              ),
            ],
          },
        },
      },
      [SessionMachineStates.BREATHE]: {
        invoke: {
          src: (ctx, ev) => (cb) => {
            let timeout = setTimeout(() => {
              cb(SessionMachineEventType.BREATHE_END);
              // Reset to default later: 5000
            }, 1000);
            return () => clearTimeout(timeout);
          },
        },
        on: {
          [SessionMachineEventType.BREATHE_END]: SessionMachineStates.SESSION,
          [SessionMachineEventType.ABANDON_SESSION]: SessionMachineStates.IDLE,
        },
      },
      [SessionMachineStates.SESSION]: {
        on: {
          [SessionMachineEventType.STOP_WORKING]: {
            target: SessionMachineStates.IDLE,
            actions: "commitSession",
          },
          [SessionMachineEventType.TAKE_A_BREAK]: {
            target: SessionMachineStates.REST,
            actions: ["commitSession", ...resetTimerActions, ...spawnTimer],
          },
          [SessionMachineEventType.PAUSE]: SessionMachineStates.SESSION_PAUSED,
          [SessionMachineEventType.TIMER_END]: SessionMachineStates.SESSION_END,
        },
      },
      [SessionMachineStates.SESSION_PAUSED]: {
        entry: send(TimerMachineEventType.PAUSE, { to: "timer" }),
        on: {
          [SessionMachineEventType.STOP_WORKING]: {
            actions: [
              send(
                {
                  type: TimerMachineEventType.UNPAUSE,
                  nextTarget: TimerMachineStates.IDLE,
                },
                { to: "timer" }
              ),
            ],
          },
          [SessionMachineEventType.TAKE_A_BREAK]: {
            actions: [
              send(
                {
                  type: TimerMachineEventType.UNPAUSE,
                  nextTarget: TimerMachineStates.REST,
                },
                { to: "timer" }
              ),
            ],
          },
          [SessionMachineEventType.UNPAUSE]: {
            actions: [
              send(
                {
                  type: TimerMachineEventType.UNPAUSE,
                },
                { to: "timer" }
              ),
            ],
            target: SessionMachineStates.SESSION,
          },
        },
      },
      [SessionMachineStates.SESSION_END]: {
        on: {
          [SessionMachineEventType.STOP_WORKING]: {
            target: SessionMachineStates.IDLE,
            actions: "commitSession",
          },
          [SessionMachineEventType.TAKE_A_BREAK]: {
            target: SessionMachineStates.REST,
            actions: ["commitSession", ...resetTimerActions, ...spawnTimer],
          },
          [SessionMachineEventType.COMPLETE_TASK]: SessionMachineStates.REST,
          [SessionMachineEventType.OVERFLOW_REVERSED]:
            SessionMachineStates.SESSION,
          [SessionMachineEventType.PAUSE]: SessionMachineStates.SESSION_PAUSED,
        },
      },
      [SessionMachineStates.REST]: {
        on: {
          [SessionMachineEventType.STOP_WORKING]: {
            target: SessionMachineStates.IDLE,
            actions: "commitRest",
          },
          [SessionMachineEventType.INIT_FOCUS]: {
            target: SessionMachineStates.BREATHE,
            actions: ["commitRest", ...resetTimerActions, ...spawnTimer],
          },
          [SessionMachineEventType.TIMER_END]: SessionMachineStates.REST_END,
        },
      },
      [SessionMachineStates.REST_END]: {
        on: {
          [SessionMachineEventType.TIMER_END]: {
            target: SessionMachineStates.IDLE,
            actions: "commitRest",
          },
        },
      },
    },
    on: {
      [SessionMachineEventType.ABANDON_SESSION]: SessionMachineStates.IDLE,
      [SessionMachineEventType.INCREMENT]: {
        actions: send(
          (_, ev) => ({
            type: SessionMachineEventType.INCREMENT,
            second: ev.second,
          }),
          { to: "timer" }
        ),
      },
      [SessionMachineEventType.DECREMENT]: {
        actions: send(
          (_, ev) => ({
            type: SessionMachineEventType.INCREMENT,
            second: ev.second,
          }),
          { to: "timer" }
        ),
      },
      [SessionMachineEventType.OVERRIDE_STATE]: {
        actions: [assign((_, event) => event.state)],
      },
      [SessionMachineEventType.RECORD_PAUSE]: [
        {
          target: SessionMachineStates.IDLE,
          actions: [
            "appendPauses",
            "commitSession",
            ...resetTimerActions,
            ...spawnTimer,
          ],
          cond: (_, ev) => ev.nextTarget === "idle",
        },
        {
          target: SessionMachineStates.REST,
          actions: [
            "appendPauses",
            "commitSession",
            ...resetTimerActions,
            ...spawnTimer,
          ],
          cond: (_, ev) => ev.nextTarget === "rest",
        },
        {
          actions: "appendPauses",
        },
      ],
    },
  },
  {
    actions: {
      commitSession: commitTimer("session"),
      commitRest: commitTimer("rest"),
      appendPauses,
    },
  }
);

export default SessionMachine;
