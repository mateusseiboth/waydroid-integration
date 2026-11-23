export const ContainerState = {
  RUNNING: "RUNNING",
  FREEZING: "FREEZING",
  FROZEN: "FROZEN",
  STOPPED: "STOPPED",
} as const;
export type ContainerState = (typeof ContainerState)[keyof typeof ContainerState];
