"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import TopBar from "@/components/blocks/top-bar";
import { useUser } from "@/context/UserContext";
import SessionReplayer from "@/components/blocks/session-replayer";
import Spinner from "@/components/ui/spinner";
import SessionLivePlayer from "@/components/blocks/session-live-player";

export default function TaskDetails({ params }) {
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [events, setEvents] = useState(null);
  const unwrappedParams = React.use(params);
  const { userData, loading } = useUser();
  const [taskSteps, setTaskSteps] = useState([]);
  const [taskCompleted, setTaskCompleted] = useState(null);
  const [alreadySubscribedToSSE, setAlreadySubscribedToSSE] = useState(false); // to avoid double subscription

  // Fetch task details from /tasks/:id endpoint
  const fetchTask = useCallback(async () => {
    try {
      const response = await api.tasks.getById(unwrappedParams.id);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Task not found");
        } else {
          throw new Error("Failed to fetch task");
        }
        return;
      }

      const data = await response.json();
      setTask(data);

      // If task is invalid, show validation error with the reason
      if (data && data.isTaskValid === "false") {
        setValidationError(data.reason || "Task cannot be processed");
      }
    } catch (error) {
      setError("Failed to fetch task details");
      console.error("Error:", error);
    }
  }, [unwrappedParams.id]);

  // Fetch task steps from /tasks/:taskId/steps endpoint
  const fetchTaskSteps = useCallback(async () => {
    try {
      const response = await api.tasks.getSteps(unwrappedParams.id);

      if (!response.ok) {
        throw new Error("Failed to fetch task steps");
      }

      const data = await response.json();
      setTaskSteps(data);

      // Check if task is completed
      if (data.some((step) => step.name === "Task Completed")) {
        setTaskCompleted(true);
      }

      // Update task state from steps data
      updateTaskStateFromSteps(data);
    } catch (error) {
      console.error("Error fetching task steps:", error);
    }
  }, [unwrappedParams.id]);

  // Fetch session recording
  const fetchSessionRecording = useCallback(async (browserSessionId) => {
    try {
      const response = await fetch("/api/recording", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: browserSessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch recording");
      }
      setEvents(data);
    } catch (err) {
      console.error("Error fetching session recording:", err);
      setError("Failed to load session recording");
    }
  }, []);

  // Parse JSON data safely
  const parseData = (dataString) => {
    if (!dataString) return null;
    try {
      return JSON.parse(dataString);
    } catch (e) {
      return dataString;
    }
  };

  // Function to extract task validation details from steps
  const extractTaskValidation = useCallback((steps) => {
    const validationStep = steps.find(
      (step) => step.name === "Task Validation",
    );
    if (validationStep) {
      const parsedData = parseData(validationStep.data);
      if (parsedData && parsedData.validation) {
        return {
          isTaskValid: parsedData.validation.isTaskValid.toString(),
          reason: parsedData.validation.reason,
        };
      }
    }
    return null;
  }, []);

  // Function to extract browser session ID from steps
  const extractBrowserSessionId = useCallback((steps) => {
    const sessionStep = steps.find(
      (step) => step.name === "Browser Session Created",
    );
    if (sessionStep) {
      const parsedData = parseData(sessionStep.data);
      return parsedData?.sessionId || null;
    }
    return null;
  }, []);

  // Function to extract browser connection URL from steps
  const extractBrowserConnectUrl = useCallback((steps) => {
    const connectionStep = steps.find(
      (step) => step.name === "Browser Connection Starting",
    );
    if (connectionStep) {
      const parsedData = parseData(connectionStep.data);
      return parsedData?.connectUrl || null;
    }
    return null;
  }, []);

  // Function to extract browser live view URL from steps
  const extractLiveViewUrl = useCallback((steps) => {
    const liveViewStep = steps.find(
      (step) => step.name === "Browser Session Created",
    );
    if (liveViewStep) {
      const parsedData = parseData(liveViewStep.data);
      return parsedData?.liveViewUrl || null;
    }
    return null;
  });

  // Update task state from steps data
  const updateTaskStateFromSteps = useCallback(
    (steps) => {
      setTask((prevTask) => {
        if (!prevTask) return prevTask;

        // Create a new task object with updated fields
        const updatedTask = { ...prevTask };

        // Extract and update validation info
        const validation = extractTaskValidation(steps);
        if (validation) {
          updatedTask.isTaskValid = validation.isTaskValid;
          updatedTask.reason = validation.reason;
        }

        // Extract and update browser session ID
        const browserSessionId = extractBrowserSessionId(steps);
        if (browserSessionId && !updatedTask.browser_session_id) {
          updatedTask.browser_session_id = browserSessionId;
        }

        // Extract and update browser connect URL
        const browserConnectUrl = extractBrowserConnectUrl(steps);
        if (browserConnectUrl && !updatedTask.browser_connect_url) {
          updatedTask.browser_connect_url = browserConnectUrl;
        }

        // Extract and update live view URL
        const liveViewUrl = extractLiveViewUrl(steps);
        if (liveViewUrl && !updatedTask.live_view_url) {
          updatedTask.live_view_url = liveViewUrl;
        }

        // Check if task is completed based on steps
        if (
          steps.some(
            (step) =>
              step.name === "Task Completed" || step.name === "Task Failed",
          )
        ) {
          updatedTask.status = "COMPLETED";
        }

        return updatedTask;
      });
    },
    [
      extractTaskValidation,
      extractBrowserSessionId,
      extractBrowserConnectUrl,
      extractLiveViewUrl,
    ],
  );

  // Subscribe to SSE for task updates
  const subscribeToSSE = useCallback(() => {
    if (alreadySubscribedToSSE || taskCompleted) {
      return () => {}; // Return empty cleanup function if already subscribed
    }

    setAlreadySubscribedToSSE(true);
    const eventSource = new EventSource(
      `http://localhost:8000/task/${unwrappedParams.id}/sse`,
    );

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      console.log("Received this update: ", JSON.stringify(update, null, 2));
      if (update.type === "step") {
        // Add new step to taskSteps state
        setTaskSteps((prevSteps) => {
          const newSteps = [...prevSteps, update.step];
          // Update task state from updated steps
          updateTaskStateFromSteps(newSteps);
          return newSteps;
        });
      } else if (update.type === "status") {
        // Update task status directly
        setTask((prevTask) => ({
          ...prevTask,
          status: update.status,
        }));

        if (update.status === "completed" || update.status === "error") {
          setTaskCompleted(true);
          eventSource.close();
        }
      } else if (update.type === "validation") {
        // Update task validation directly
        setTask((prevTask) => ({
          ...prevTask,
          isTaskValid: update.isTaskValid.toString(),
          reason: update.reason,
        }));

        if (!update.isTaskValid) {
          setValidationError(update.reason || "Task cannot be processed");
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [unwrappedParams.id, alreadySubscribedToSSE, updateTaskStateFromSteps]);

  useEffect(() => {
    // Only fetch when we don't have the data yet
    if (!task) {
      fetchTask();
      fetchTaskSteps();
    }
  }, [fetchTask, fetchTaskSteps, task]);

  useEffect(() => {
    // Subscribe to SSE if task is valid and not completed or errored
    if (task && taskCompleted !== null) {
      subscribeToSSE();
    }
  }, [task, taskCompleted, subscribeToSSE]);

  useEffect(() => {
    // Fetch session recording when task is completed
    if (taskCompleted) {
      if (!task.browser_session_id) {
        fetchTask();
      }
      task.browser_session_id && fetchSessionRecording(task.browser_session_id);
    }
  }, [taskCompleted, fetchSessionRecording, task]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <TopBar userData={userData} />
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort steps by sequence
  const sortedSteps = [...(taskSteps || [])].sort(
    (a, b) => a.sequence - b.sequence,
  );

  return (
    <div className="min-h-screen scrollbar-hide bg-gray-50 flex flex-col">
      <div className="border-b border-neutral-300">
        <TopBar userData={userData} />
      </div>

      {task && (
        <div className="flex-grow grid grid-cols-12 overflow-visible">
          <div className="col-span-7 overflow-scroll h-[calc(100vh-56px)] p-6">
            <h1 className="text-3xl font-medium text-neutral-700 mb-4 tracking-wide">
              {task.name}
            </h1>
            <p className="mt-4 text-neutral-400">ID: {task.id}</p>

            {taskCompleted ? (
              <>
                {events ? (
                  <SessionReplayer events={events} />
                ) : (
                  <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded">
                    <p className="text-gray-500">
                      Loading session recording...
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {task.live_view_url !== null ? (
                  <SessionLivePlayer
                    url={task.live_view_url}
                    readOnly={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded">
                    <p className="text-gray-500">
                      Validating task and connecting to a browser...
                    </p>
                  </div>
                )}
              </>
            )}

            <details className="rounded p-2 bg-neutral-200 mt-6">
              <summary>State</summary>
              <details className="rounded pt-2 px-5">
                <summary>Task Details</summary>
                <pre>{JSON.stringify(task, null, 2)}</pre>
              </details>
              <details className="rounded pt-2 px-5">
                <summary>Steps Details</summary>
                <pre>{JSON.stringify(taskSteps, null, 2)}</pre>
              </details>
            </details>
          </div>
          <div className="col-span-5 border-l p-6 border-neutral-300 h-[calc(100vh-56px)] overflow-scroll">
            {validationError && (
              <div className="bg-red-50 shadow border border-red-200 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      We cannot process this task
                      <br />
                      <br />
                      {validationError}
                      <br />
                      <br />
                      If you think this is a mistake, please contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Task steps */}
            {sortedSteps.length > 0 ? (
              <>
                <h2 className="text-xl font-light text-gray-900 mb-3">Steps</h2>
                <div className="space-y-4">
                  {sortedSteps.map((step) => {
                    const parsedData = parseData(step.data);
                    return (
                      <div
                        key={step.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {step.name}
                            </h3>
                            {step.sequence && (
                              <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                                Sequence: {step.sequence}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(step.created_at)}
                          </p>
                        </div>
                        {parsedData && (
                          <div className="px-4 py-3">
                            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-40">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                {typeof parsedData === "object"
                                  ? JSON.stringify(parsedData, null, 2)
                                  : parsedData}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {taskCompleted && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Task completed successfully!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* task has started but the first step is pending, so we show a non ideal state UI here */}
                <div className="flex gap-1 items-center justify-center h-full">
                  <Spinner color="#888888" className="size-6" />
                  <p className="text-sm font-medium text-neutral-500">
                    Processing Task
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
