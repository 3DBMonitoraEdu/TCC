export interface Computer {
  id: string;
  name: string;
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  status: "online" | "offline" | "warning";
}

export const computersData: Computer[] = [
  { id: "1", name: "Laboratório 01 - PC 01", cpuUsage: 45, ramUsage: 62, storageUsage: 75, status: "online" },
  { id: "2", name: "Laboratório 01 - PC 02", cpuUsage: 88, ramUsage: 91, storageUsage: 82, status: "warning" },
  { id: "3", name: "Laboratório 01 - PC 03", cpuUsage: 25, ramUsage: 35, storageUsage: 45, status: "online" },
  { id: "4", name: "Laboratório 01 - PC 04", cpuUsage: 0, ramUsage: 0, storageUsage: 60, status: "offline" },
  { id: "5", name: "Laboratório 01 - PC 05", cpuUsage: 55, ramUsage: 68, storageUsage: 55, status: "online" },
];
