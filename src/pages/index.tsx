import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../styles/Home.module.css";
import { useActor, useMachine } from "@xstate/react";
import SessionMachine from "../Machines/SessionMachine";
import { ActorRefWithDeprecatedState } from "xstate";
import {
  TimerMachineContext,
  TimerMachineEvent,
  TimerMachineStates,
} from "../Machines/TimerMachine/types";
import {
  SessionMachineEventType,
  SessionMachineStates,
} from "../Machines/SessionMachine/types";
import { useState } from "react";

const splitSecondToHourMinuteAndSecond = (
  totalSecond: number
): {
  hour: number;
  minute: number;
  second: number;
} => {
  let totalSeconds = Math.floor(totalSecond);
  let totalMinute = totalSeconds / 60;
  let hour = Math.floor(totalMinute / 60);
  let minute = Math.floor(totalMinute % 60);
  let second = Math.max(0, totalSeconds % 60);

  return {
    hour,
    minute,
    second,
  };
};

const appendZero = (digit: number | string): string => {
  const res = String(digit).split("");
  if (res.length >= 2) return res.join("");
  return `0${res}`;
};

const convertSecondToClockString = (timeRemaining: number): string => {
  const { hour, minute, second } =
    splitSecondToHourMinuteAndSecond(timeRemaining);

  if (hour > 0)
    return `${appendZero(hour)}:${appendZero(minute)}:${appendZero(second)}`;
  return `${appendZero(minute)}:${appendZero(second)}`;
};

type TTimerViewProps = {
  timerActor: ActorRefWithDeprecatedState<
    TimerMachineContext,
    TimerMachineEvent,
    any,
    any
  >;
};

const TimerView = ({ timerActor }: TTimerViewProps) => {
  const [timerCurrent] = useActor(timerActor);
  return (
    <div>
      <h1>{timerCurrent.toStrings()}</h1>
      <p>
        {convertSecondToClockString(
          Date.now() / 1000 -
            timerCurrent.context.startDate.getTime() / 1000 -
            timerCurrent.context.pauseBuffer
        )}
      </p>
      <h1>
        Time left:{" "}
        {timerCurrent.matches(TimerMachineStates.OVERFLOWED)
          ? convertSecondToClockString(
              Date.now() / 1000 -
                timerCurrent.context.startDate.getTime() / 1000 -
                timerCurrent.context.pauseBuffer
            )
          : convertSecondToClockString(timerCurrent.context.secondRemaining)}
      </h1>
      <p>Date: {timerCurrent.context.startDate.getTime()}</p>
      <p>Total second: {timerCurrent.context.durationSecond}</p>
      <p>Pause buffer: {timerCurrent.context.pauseBuffer}</p>
    </div>
  );
};

export default function Home() {
  const [current, send] = useMachine(SessionMachine);
  const [duration, setDuration] = useState(0);
  const [newStartDate, setNewStartDate] = useState(0);
  return (
    <>
      <Head>
        <title>Session Web</title>
      </Head>
      <main className={styles.main}>
        <div>
          <h1>State: {current.toStrings()}</h1>
          {current.context.timerRef && (
            <TimerView timerActor={current.context.timerRef} />
          )}
          {current.matches(SessionMachineStates.IDLE) && (
            <div>
              {/* <input
                value={current.context.title}
                onChange={(e) =>
                  send({ type: "OVERRIDE_STATE", state: { title: e.target.value } })
                }
              /> */}
              <div>
                <label>Duration (seconds)</label>
                <input
                  type="number"
                  name="duration"
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
              <div>{convertSecondToClockString(duration)}</div>
              <button
                onClick={() => {
                  send(SessionMachineEventType.INIT_FOCUS, {
                    second: duration,
                  });
                }}
              >
                Start Session
              </button>
            </div>
          )}
          {current.matches(SessionMachineStates.BREATHE) && (
            <div>
              <button onClick={() => send(SessionMachineEventType.BREATHE_END)}>
                Skip Breathe
              </button>
              <button
                onClick={() => send(SessionMachineEventType.ABANDON_SESSION)}
              >
                Cancel Session
              </button>
            </div>
          )}
          {(current.matches(SessionMachineStates.SESSION) ||
            current.matches(SessionMachineStates.SESSION_END) ||
            current.matches(SessionMachineStates.SESSION_PAUSED)) && (
            <div>
              <div>
                <label>Started at:</label>
                <input
                  type="time"
                  onChange={(e) => {
                    const [hour, minute] = String(e.target.value).split(":");
                    const startDate = new Date().setHours(
                      Number(hour),
                      Number(minute),
                      0,
                      0
                    );
                    setNewStartDate(startDate);
                  }}
                  min="21:00:00"
                />
              </div>
              <div>
                <button
                  onClick={() => {
                    // Work on the line below
                    // console.log(newStartDate);
                    // send({
                    //   type: "OVERRIDE_STATE",
                    //   state: {
                    //     startDate: newStartDate
                    //   }
                    // });
                  }}
                >
                  Submit
                </button>
              </div>
              <div>
                {current.matches(SessionMachineStates.SESSION_PAUSED) ? (
                  <button onClick={() => send(SessionMachineEventType.UNPAUSE)}>
                    Unpause
                  </button>
                ) : (
                  <button onClick={() => send(SessionMachineEventType.PAUSE)}>
                    Pause
                  </button>
                )}
                <button
                  onClick={() =>
                    send(SessionMachineEventType.TAKE_A_BREAK, { second: 600 })
                  }
                >
                  Break
                </button>
                <button
                  onClick={() => send(SessionMachineEventType.STOP_WORKING)}
                >
                  Stop working
                </button>
              </div>
              <div>
                <button
                  onClick={() =>
                    send(SessionMachineEventType.DECREMENT, { second: 15 })
                  }
                >
                  -15
                </button>
                <button
                  onClick={() =>
                    send(SessionMachineEventType.INCREMENT, { second: 15 })
                  }
                >
                  +15
                </button>
              </div>
            </div>
          )}
          {current.matches(SessionMachineStates.IDLE) && (
            <div>
              <button
                onClick={() => {
                  send(SessionMachineEventType.INIT_FOCUS, {
                    second: duration,
                  });
                }}
              >
                Start Session
              </button>
              <button
                onClick={() => send(SessionMachineEventType.STOP_WORKING)}
              >
                Stop working
              </button>
            </div>
          )}
          <div>
            {current.context.sessions.map((session) => {
              return (
                <div key={session.startDate.getTime()}>
                  <p>
                    title: {session.type} - {session.title}
                  </p>
                  <p>pauses: {session.pauses.length}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
