import {
    createMachine,
    assign,
    send,
    sendParent,
} from 'xstate'
import {
    TimerMachineContext,
    TimerMachineEventType,
    TimerMachineEvent,
    TimerMachineStates,
    TimerEventStart,
    TimerEventTick
} from './types'

const timerMachineInitialState: TimerMachineContext = {
    startDate: new Date,
    durationSecond: 0,
    secondRemaining: 0,
    pauseBuffer: 0,
    pauseDate: new Date()
}

const resetToInitialState = assign(() => timerMachineInitialState)

const startSession = assign<TimerMachineContext, TimerEventStart>((_, event) => ({
    startDate: new Date(),
    durationSecond: event.durationSecond,
    secondRemaining: event.durationSecond
}))

const setSecondRemaining = assign<TimerMachineContext, TimerEventTick>((context) => {
    let relativeSecondElapsed =
        (Date.now() - context.startDate.getTime() - context.pauseBuffer * 1000) /
        1000;
    let secondRemaining = context.durationSecond - relativeSecondElapsed;
    return {
        secondRemaining: Number(secondRemaining.toFixed(0))
    }
})

const TimerMachine = createMachine<TimerMachineContext, TimerMachineEvent>(
    {
        predictableActionArguments: true,
        id: "timer",
        initial: TimerMachineStates.IDLE,
        context: timerMachineInitialState,
        invoke: {
            src: () => send => {
                let interval = setInterval(() => {
                    send(TimerMachineEventType.TICK);
                  }, 1000);
                  return () => clearInterval(interval);
            }
        },
        states: {
            [TimerMachineStates.IDLE]: {
                entry: resetToInitialState,
                on: {
                    [TimerMachineEventType.START]: {
                        target: TimerMachineStates.RUNNING,
                        actions: startSession
                    }
                }
            },
            [TimerMachineStates.RUNNING]: {
                on: {
                    [TimerMachineEventType.PAUSE]: {
                        target: TimerMachineStates.PAUSED
                    }
                },
                always: [
                    {
                        target: TimerMachineStates.OVERFLOWED,
                        cond: (ctx,ev) => ctx.secondRemaining < 0
                    }
                ]
            },
            [TimerMachineStates.OVERFLOWED]: {
                entry: sendParent("TIMER_END"),
                always: [
                    {
                        target: TimerMachineStates.RUNNING,
                        cond: (ctx) => ctx.secondRemaining >= 0,
                        actions: sendParent("OVERFLOW_REVERSED")
                    }
                ],
                on: {
                    [TimerMachineEventType.INCREMENT]: {
                        actions: [
                            assign((ctx,ev) => ({
                                durationSecond: 
                                    (Date.now() - ctx.startDate.getTime()) / 1000 + ev.second
                            })),
                            send(TimerMachineEventType.TICK)
                        ]
                    },
                    [TimerMachineEventType.PAUSE]: {
                        target: TimerMachineStates.PAUSED
                    },
                }
            },
            [TimerMachineStates.PAUSED]: {
                entry: [
                    assign((ctx, ev) => ({
                        pauseDate: new Date()
                    })),
                    sendParent({
                        type: "OVERRIDE_STATE",
                        state: { pauseDate: new Date() }
                    })
                ],
                on: {
                    [TimerMachineEventType.PAUSE]: undefined,
                    [TimerMachineEventType.TICK]: {
                        actions: setSecondRemaining
                    },
                    [TimerMachineEventType.UNPAUSE]: {
                        target: TimerMachineStates.RUNNING,
                        actions: [
                            assign((ctx, ev) => ({
                                pauseBuffer:
                                  ctx.pauseBuffer +
                                  (Date.now() - ctx.pauseDate.getTime()) / 1000
                              })),
                              sendParent((ctx, ev) => ({
                                ...ev,
                                type: "RECORD_PAUSE",
                                startDate: ctx.pauseDate,
                                endDate: new Date()
                            }))
                        ]
                    }
                }
            },
        },
        on: {
            [TimerMachineEventType.STOP]: {
                target: TimerMachineStates.IDLE
            },
            [TimerMachineEventType.TICK]: {
                actions: assign((context) => {
                    let relativeSecondElapsed =
                        (Date.now() - context.startDate.getTime() - context.pauseBuffer * 1000) /
                        1000;
                    let secondRemaining = context.durationSecond - relativeSecondElapsed;
                    return {
                        secondRemaining: Number(secondRemaining.toFixed(0))
                    }
                })
            },
            [TimerMachineEventType.INCREMENT]: {
                actions: [
                    assign((ctx,ev) => ({
                        durationSecond: ctx.durationSecond + ev.second
                    })),
                    send(TimerMachineEventType.TICK)
                ]
            },
            [TimerMachineEventType.DECREMENT]: {
                actions: [
                    assign((ctx, ev) => ({
                        durationSecond: Math.max(ctx.durationSecond - ev.second, 0)
                      })),
                      send(TimerMachineEventType.TICK)
                ]
            },
            [TimerMachineEventType.OVERRIDE_STATE]: {
                actions: () => console.log('test')
            }
        }
    }
)

export default TimerMachine