import { create } from 'zustand'

interface NotificationItem {
  id: string
  title: string
  read: boolean
}

interface AppStoreState {
  authed: boolean
  sidebarCollapsed: boolean
  activeWorkspace: string
  theme: 'system' | 'light' | 'dark'
  notifications: NotificationItem[]
  setAuthed: (authed: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveWorkspace: (workspace: string) => void
  setTheme: (theme: AppStoreState['theme']) => void
  markNotificationRead: (id: string) => void
}

export const useAppStore = create<AppStoreState>((set) => ({
  authed: true,
  sidebarCollapsed: false,
  activeWorkspace: 'Studio Inspyra',
  theme: 'system',
  notifications: [
    { id: 'notif-001', title: 'Nuevo lead calificado', read: false },
    { id: 'notif-002', title: 'Factura proxima a vencer', read: false },
  ],
  setAuthed: (authed) => set({ authed }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setTheme: (theme) => set({ theme }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    })),
}))
