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
import {
    SessionMachineContext,
    SessionMachineEvent,
    SessionMachineStates,
    SessionEventPause
} from './types'

const sessionMachineInitialState: SessionMachineContext = {
    timerRef: undefined,
    startDate: new Date(),
    pauseDate: new Date(),
    pauses: [],
    title: "",
    sessions: []
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
>({
    predictableActionArguments: true,
    id: "session",
    initial: SessionMachineStates.IDLE,
    context: sessionMachineInitialState,
    states: {
        [SessionMachineStates.IDLE]: {}
    }
},{})

export default SessionMachine;