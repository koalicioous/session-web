
export type TimerMachineContext = {
    startDate: Date
    durationSecond: number
    secondRemaining: number
    pauseBuffer: number
    pauseDate: Date
}

export enum TimerMachineEventType {
    OVERRIDE_TIMER = "OVERRIDE_TIMER",
    STOP = "STOP",
    PAUSE = "PAUSE",
    OVERRIDE_PAUSE = "OVERRIDE_PAUSE",
    UNPAUSE = "UNPAUSE",
    START = "START",
    TICK = "TICK",
    TIMER_ENDED = "TIMER_ENDED",
    INCREMENT = "INCREMENT",
    DECREMENT = "DECREMENT",
    OVERRIDE_STATE = "OVERRIDE_STATE"
}

export type TimerEventStart = {
    type: TimerMachineEventType.START,
    durationSecond: number,
    startDate: Date
}

export type TimerEventTick = {
    type: TimerMachineEventType.TICK
}

export type TimerMachineEvent = 
    | TimerEventStart
    | TimerEventTick
    | { type: TimerMachineEventType.OVERRIDE_TIMER }
    | { type: TimerMachineEventType.STOP }
    | { type: TimerMachineEventType.PAUSE }
    | { type: TimerMachineEventType.OVERRIDE_PAUSE }
    | { type: TimerMachineEventType.UNPAUSE }
    | { type: TimerMachineEventType.TIMER_ENDED }
    | { type: TimerMachineEventType.INCREMENT, second: number }
    | { type: TimerMachineEventType.DECREMENT, second: number }
    | { type: TimerMachineEventType.OVERRIDE_STATE } & Partial<TimerMachineContext>

export enum TimerMachineStates {
    IDLE = "IDLE",
    RUNNING = "RUNNING",
    OVERFLOWED = "OVERFLOWED",
    PAUSED = "PAUSED",
    REST = "REST"
}