export interface Computer {
  id: string;
  name: string;
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  status: "online" | "offline" | "warning";
  openApps: string[];
  recentApps: string[];
}

export interface Room {
  id: string;
  name: string;
  computers: Computer[];
}

export const initialRooms: Room[] = [
  {
    id: "1",
    name: "Laboratório de Informática 01",
    computers: [
      { 
        id: "c1", 
        name: "PC-01", 
        cpuUsage: 45, 
        ramUsage: 62, 
        storageUsage: 75, 
        status: "online",
        openApps: ["Google Chrome (4 abas)", "Bloco de Notas"],
        recentApps: ["Microsoft Word", "Calculadora"]
      },
      { 
        id: "c2", 
        name: "PC-02", 
        cpuUsage: 88, 
        ramUsage: 91, 
        storageUsage: 82, 
        status: "warning",
        openApps: ["LibreOffice Impress", "VLC Media Player"],
        recentApps: ["Google Chrome", "Explorador de Arquivos"]
      },
      { 
        id: "c3", 
        name: "PC-03", 
        cpuUsage: 25, 
        ramUsage: 35, 
        storageUsage: 45, 
        status: "online",
        openApps: ["Paint"],
        recentApps: ["Microsoft Edge", "WordPad"]
      },
    ]
  },
  {
    id: "2",
    name: "Sala de Multimídia",
    computers: [
      { 
        id: "c4", 
        name: "Workstation-01", 
        cpuUsage: 15, 
        ramUsage: 40, 
        storageUsage: 50, 
        status: "online",
        openApps: ["OBS Studio", "Discord"],
        recentApps: ["Google Chrome", "Spotify"]
      },
      { 
        id: "c5", 
        name: "Workstation-02", 
        cpuUsage: 0, 
        ramUsage: 0, 
        storageUsage: 60, 
        status: "offline",
        openApps: [],
        recentApps: ["Google Chrome", "Microsoft Word"]
      },
    ]
  }
];
