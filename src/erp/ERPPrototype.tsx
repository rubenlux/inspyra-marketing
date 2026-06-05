// @ts-nocheck
import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, prospectsApi, validationsApi, researchApi, enrichmentApi, getStoredToken, setStoredToken, clearStoredToken } from '../api/inspyra'
import DashboardV2 from './DashboardV2'
import './erp.css'

// Shared icons + small UI atoms used across the ERP.
// Icons are inline strokes — tabler-style. 16px default.

const Ic = ({ d, size = 16, stroke = 1.6, fill = "none", ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round"
       style={{ display: "block", flexShrink: 0 }} {...rest}>
    {d}
  </svg>
);

const Icon = {
  search: (p) => <Ic {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  bell:   (p) => <Ic {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></>}/>,
  plus:   (p) => <Ic {...p} d={<><path d="M12 5v14M5 12h14"/></>}/>,
  filter: (p) => <Ic {...p} d={<><path d="M4 5h16l-6 8v6l-4-2v-4z"/></>}/>,
  sort:   (p) => <Ic {...p} d={<><path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/></>}/>,
  more:   (p) => <Ic {...p} d={<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>}/>,
  arrowUp: (p) => <Ic {...p} d={<><path d="M12 19V5M5 12l7-7 7 7"/></>}/>,
  arrowDown: (p) => <Ic {...p} d={<><path d="M12 5v14M5 12l7 7 7-7"/></>}/>,
  arrowRight: (p) => <Ic {...p} d={<><path d="M5 12h14M13 5l7 7-7 7"/></>}/>,
  chevronDown: (p) => <Ic {...p} d={<><path d="m6 9 6 6 6-6"/></>}/>,
  chevronRight: (p) => <Ic {...p} d={<><path d="m9 6 6 6-6 6"/></>}/>,
  check:  (p) => <Ic {...p} d={<><path d="m5 12 5 5L20 7"/></>}/>,
  x:      (p) => <Ic {...p} d={<><path d="M6 6l12 12M18 6 6 18"/></>}/>,
  dot:    (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="3" fill="currentColor"/></>}/>,
  user:   (p) => <Ic {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}/>,
  users:  (p) => <Ic {...p} d={<><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 11a4 4 0 0 0 0-8"/><path d="M22 21a7 7 0 0 0-5-6.7"/></>}/>,
  briefcase: (p) => <Ic {...p} d={<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></>}/>,
  grid:   (p) => <Ic {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>}/>,
  layers: (p) => <Ic {...p} d={<><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></>}/>,
  check2: (p) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 12 3 3 5-6"/></>}/>,
  flow:   (p) => <Ic {...p} d={<><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="5" cy="18" r="2"/><path d="M7 6h10M7 18h10M5 8v8M19 8v8"/></>}/>,
  server: (p) => <Ic {...p} d={<><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><circle cx="7" cy="7.5" r=".8" fill="currentColor"/><circle cx="7" cy="16.5" r=".8" fill="currentColor"/></>}/>,
  cube:   (p) => <Ic {...p} d={<><path d="m12 3 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5M12 13v10"/></>}/>,
  card:   (p) => <Ic {...p} d={<><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></>}/>,
  life:   (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="m4.9 4.9 4.3 4.3M14.8 14.8l4.3 4.3M4.9 19.1l4.3-4.3M14.8 9.2l4.3-4.3"/></>}/>,
  chart:  (p) => <Ic {...p} d={<><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3"/></>}/>,
  cog:    (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.2-1.6l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2.8-1.6L13 2h-4l-.6 2.8a7 7 0 0 0-2.8 1.6l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .6 0 1.1.2 1.6l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2.8 1.6L9 22h4l.6-2.8a7 7 0 0 0 2.8-1.6l2.4 1 2-3.4-2-1.6c.1-.5.2-1 .2-1.6z"/></>}/>,
  sparkles: (p) => <Ic {...p} d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></>}/>,
  beaker: (p) => <Ic {...p} d={<><path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 3h8"/><path d="M6 14h12"/></>}/>,
  globe:  (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 4 6 4 9s-1.5 6-4 9c-2.5-3-4-6-4-9s1.5-6 4-9z"/></>}/>,
  link:   (p) => <Ic {...p} d={<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17"/></>}/>,
  trend:  (p) => <Ic {...p} d={<><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></>}/>,
  bolt:   (p) => <Ic {...p} d={<><path d="M13 2 4 14h7l-2 8 9-12h-7z"/></>}/>,
  flag:   (p) => <Ic {...p} d={<><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></>}/>,
  calendar: (p) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>}/>,
  paperclip: (p) => <Ic {...p} d={<><path d="m21 12-9 9a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-1-1l8-8"/></>}/>,
  send:   (p) => <Ic {...p} d={<><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></>}/>,
  doc:    (p) => <Ic {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></>}/>,
  folder: (p) => <Ic {...p} d={<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>}/>,
  history: (p) => <Ic {...p} d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>}/>,
  pin:    (p) => <Ic {...p} d={<><path d="M12 17v5"/><path d="m9 3 6 0 1 8 3 2v2H5v-2l3-2 1-8z"/></>}/>,
  download: (p) => <Ic {...p} d={<><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></>}/>,
  external: (p) => <Ic {...p} d={<><path d="M15 3h6v6"/><path d="M10 14 21 3M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></>}/>,
  copy:   (p) => <Ic {...p} d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>}/>,
  command: (p) => <Ic {...p} d={<><path d="M6 9V6a2 2 0 1 1 2 2H6zM6 15v3a2 2 0 1 0 2-2H6zM18 9V6a2 2 0 1 0-2 2h2zM18 15v3a2 2 0 1 1-2-2h2zM6 9h12v6H6z"/></>}/>,
  lightning: (p) => <Ic {...p} d={<><path d="M13 2 4 14h7l-2 8 9-12h-7z"/></>}/>,
  shield: (p) => <Ic {...p} d={<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/></>}/>,
  inbox:  (p) => <Ic {...p} d={<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></>}/>,
  pulse:  (p) => <Ic {...p} d={<><path d="M3 12h4l3-8 4 16 3-8h4"/></>}/>,
  building: (p) => <Ic {...p} d={<><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></>}/>,
  rocket: (p) => <Ic {...p} d={<><path d="M14 4c5 0 6 2 6 6-3 0-4 1-6 3l-4 4-4-4 4-4c2-2 3-3 3-6 0 0 1-3 1 1z"/><path d="m6 16-2 4 4-2"/><circle cx="14" cy="10" r="1.4"/></>}/>,
  message:(p) => <Ic {...p} d={<><path d="M21 12a8 8 0 1 1-3.4-6.6L21 4l-1.4 3.4A8 8 0 0 1 21 12z"/></>}/>,
  flow2:  (p) => <Ic {...p} d={<><rect x="3" y="3" width="7" height="5" rx="1.2"/><rect x="14" y="9" width="7" height="5" rx="1.2"/><rect x="3" y="16" width="7" height="5" rx="1.2"/><path d="M10 5.5h2a2 2 0 0 1 2 2v1M10 18.5h2a2 2 0 0 0 2-2v-1"/></>}/>,
  phone:  (p) => <Ic {...p} d={<><path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L19 11l2 5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></>}/>,
  whatsapp: (p) => <Ic {...p} d={<><path d="M3 21l1.6-4.5A8 8 0 1 1 8 19.5z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5M9 9.5c0-.6.4-1 1-1s1.4 1.4 1.4 2M14.5 15c.6 0 1-.4 1-1s-1.4-1-2-1"/></>}/>,
  mail:   (p) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>}/>,
  video:  (p) => <Ic {...p} d={<><rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m16 10 5.5-3v10L16 14z"/></>}/>,
  robot:  (p) => <Ic {...p} d={<><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M12 8V4M12 4h-1.5M12 4h1.5"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M9.5 16.5h5M2 12v3M22 12v3"/></>}/>,
  funnel: (p) => <Ic {...p} d={<><path d="M3 5h18l-7 8v6l-4-2v-4z"/></>}/>,
  fire:   (p) => <Ic {...p} d={<><path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 7a8 8 0 0 1-16 0c0-4 3-6 5-8 1 1 1 2 1 3-1-1 1-2 3-2z"/></>}/>,
  clock:  (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  target: (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>}/>,
  refresh:(p) => <Ic {...p} d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>}/>,
  dollar: (p) => <Ic {...p} d={<><path d="M12 2v20M17 6.5c0-2-2-3.5-5-3.5s-5 1.3-5 3.5S9 10 12 10s5 1.3 5 3.5-2 3.5-5 3.5-5-1.5-5-3.5"/></>}/>,
  eye:    (p) => <Ic {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>}/>,
  calCheck: (p) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/></>}/>,
  zap:    (p) => <Ic {...p} d={<><path d="M13 2 4 14h7l-2 8 9-12h-7z"/></>}/>,
  play:   (p) => <Ic {...p} d={<><path d="M7 4v16l13-8z"/></>}/>,
  trophy: (p) => <Ic {...p} d={<><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 18h6M10 18l.5-3h3l.5 3M8 21h8"/></>}/>,
  thumbsDown: (p) => <Ic {...p} d={<><path d="M7 14V3H4v11zM7 14l3 7a2 2 0 0 0 3-2l-1-5h5a2 2 0 0 0 2-2.4l-1.5-6A2 2 0 0 0 17.5 3H7"/></>}/>,
};

// Badge
const Badge = ({ tone = "default", dot, children, className = "" }) => (
  <span className={`badge ${tone === "default" ? "" : tone} ${className}`}>
    {dot && <span className="dot"/>}
    {children}
  </span>
);

// Sparkline
const Spark = ({ data, color = "#0B0D12", w = 84, h = 28, fill }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / r) * (h - 4)]);
  const dPath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const dArea = fill ? `${dPath} L${w},${h} L0,${h} Z` : null;
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && <path d={dArea} fill={fill}/>}
      <path d={dPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Avatar
const Avatar = ({ name = "?", size = "sm", color, ring }) => {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  const palette = [
    "linear-gradient(135deg,#5B5BF7,#22D3EE)",
    "linear-gradient(135deg,#F472B6,#A78BFA)",
    "linear-gradient(135deg,#10B981,#22D3EE)",
    "linear-gradient(135deg,#F59E0B,#EF4444)",
    "linear-gradient(135deg,#0EA5E9,#5B5BF7)",
    "linear-gradient(135deg,#1F2128,#4B5363)",
  ];
  const idx = (name.charCodeAt(0) + name.length) % palette.length;
  return (
    <span className={`avatar ${size}`} style={{ background: color || palette[idx], boxShadow: ring ? "0 0 0 2px var(--surface)" : undefined }}>
      {initials}
    </span>
  );
};

const AvatarGroup = ({ names = [], size = "sm", extra = 0 }) => (
  <div className="avatar-group">
    {names.map((n, i) => <Avatar key={i} name={n} size={size} ring />)}
    {extra > 0 && (
      <span className={`avatar ${size}`} style={{ background: "var(--ink-100)", color: "var(--ink-700)" }}>+{extra}</span>
    )}
  </div>
);

// Priority
const Priority = ({ level = "med" }) => {
  const lv = { low: 1, med: 2, high: 3, urg: 4 }[level] || 2;
  const label = { low: "Low", med: "Medium", high: "High", urg: "Urgent" }[level] || "Medium";
  return (
    <span className={`pri ${level}`}>
      <span className={`pri-bar ${lv >= 1 ? "on" : ""}`}/>
      <span className={`pri-bar ${lv >= 2 ? "on" : ""}`}/>
      <span className={`pri-bar ${lv >= 3 ? "on" : ""}`}/>
      <span className={`pri-bar ${lv >= 4 ? "on" : ""}`}/>
      <span style={{ marginLeft: 4 }}>{label}</span>
    </span>
  );
};

// Progress
const Progress = ({ value = 50, tone = "" }) => (
  <div className={`progress ${tone}`}><div style={{ width: value + "%" }}/></div>
);

// Logo
const InspyraLogo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="ilg" x1="0" y1="0" x2="32" y2="32">
        <stop offset="0" stopColor="#5B5BF7"/>
        <stop offset="1" stopColor="#22D3EE"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#ilg)"/>
    <path d="M11 9v14M16 9v14M21 9v14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="11" cy="9" r="2" fill="white"/>
    <circle cx="21" cy="23" r="2" fill="white"/>
  </svg>
);

Object.assign(window, {
  Icon, Ic, Badge, Spark, Avatar, AvatarGroup, Priority, Progress, InspyraLogo,
});


const NAV = [
  { group: "Workspace", items: [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
  ]},
  { group: "Comercial", items: [
    { id: "prospects", label: "Prospectos", icon: "search", badge: "248" },
    { id: "campaigns", label: "Campañas", icon: "rocket" },
    { id: "followup", label: "Seguimiento", icon: "inbox", badge: "14" },
    { id: "pipeline", label: "Pipeline", icon: "flow" },
    { id: "meetings", label: "Reuniones", icon: "calendar", badge: "5" },
  ]},
  { group: "Delivery", items: [
    { id: "clients", label: "Clientes", icon: "building" },
    { id: "services", label: "Servicios", icon: "layers" },
    { id: "projects", label: "Proyectos", icon: "flow2" },
    { id: "tasks", label: "Tareas", icon: "check2", badge: "32" },
  ]},
  { group: "Studio", items: [
    { id: "lab", label: "Laboratorio IA", icon: "beaker", pin: true },
    { id: "politica", label: "Política Intelligence", icon: "flag" },
    { id: "metrics", label: "Metrics Hub", icon: "trend" },
  ]},
  { group: "Operations", items: [
    { id: "hosting", label: "HostingGuard", icon: "shield" },
    { id: "cloudInspyra", label: "Inspyra Cloud", icon: "server" },
    { id: "billing", label: "Facturación", icon: "card" },
    { id: "tickets", label: "Tickets", icon: "life", badge: "7" },
    { id: "reports", label: "Reportes", icon: "chart" },
  ]},
  { group: "Comunicación", items: [
    { id: "mailInspyra", label: "Inspyra Mail", icon: "inbox", badge: "12" },
    { id: "emailMarketing", label: "Email Marketing", icon: "mail" },
    { id: "social", label: "Social Hub", icon: "globe" },
  ]},
  { group: "Account", items: [
    { id: "team", label: "Equipo", icon: "users" },
    { id: "mcp", label: "MCP Gateway", icon: "command" },
    { id: "settings", label: "Configuración", icon: "cog" },
  ]},
];

function Sidebar({ active, onNav }) {
  const { data: sidebarKpis } = useQuery({
    queryKey: ["prospects", "kpis"],
    queryFn: prospectsApi.kpis,
    enabled: Boolean(getStoredToken()),
    staleTime: 60000,
  });

  return (
    <aside className="sb">
      <div className="sb-head">
        <div className="sb-brand">
          <InspyraLogo size={22} />
          <div className="sb-brand-text">
            <div className="sb-brand-name">Inspyra</div>
            <div className="sb-brand-sub">ERP — Internal</div>
          </div>
        </div>
        <button className="sb-cmd" title="Search / Command (⌘K)">
          <Icon.search size={13}/>
        </button>
      </div>

      <div className="sb-workspace">
        <div className="sb-ws">
          <div className="sb-ws-av">SI</div>
          <div className="sb-ws-body">
            <div className="sb-ws-name">Studio Inspyra</div>
            <div className="sb-ws-meta">12 members · Pro</div>
          </div>
          <Icon.chevronDown size={13} stroke={1.8}/>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((g) => (
          <div key={g.group} className="sb-group">
            <div className="sb-group-label">{g.group}</div>
            {g.items.map((it) => {
              const IconC = Icon[it.icon];
              const isActive = active === it.id;
              const badge = it.id === 'prospects' && sidebarKpis?.total != null
                ? String(sidebarKpis.total)
                : it.badge;
              return (
                <button
                  key={it.id}
                  className={`sb-item ${isActive ? "active" : ""} ${it.pin ? "pin" : ""}`}
                  onClick={() => onNav(it.id)}
                >
                  {IconC && <IconC size={15} stroke={1.6}/>}
                  <span className="sb-item-label">{it.label}</span>
                  {badge && <span className="sb-item-badge">{badge}</span>}
                  {it.pin && <span className="sb-item-pin">Lab</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-user">
          <Avatar name="Mateo López" size="sm"/>
          <div className="sb-user-body">
            <div className="sb-user-name">Mateo López</div>
            <div className="sb-user-role">Founder · Admin</div>
          </div>
          <Icon.more size={14}/>
        </div>
      </div>
    </aside>
  );
}

// Sidebar styles (scoped via class names)
const _sbStyles = `
.sb {
  background: var(--sb-bg);
  color: var(--sb-text);
  display: flex; flex-direction: column;
  border-right: 1px solid var(--sb-border);
  position: relative;
  overflow: hidden;
}
.sb::before {
  content: '';
  position: absolute; top: -120px; left: -80px;
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(91,91,247,.18), transparent 60%);
  pointer-events: none;
}
.sb-head {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 14px 10px;
  position: relative;
  z-index: 1;
}
.sb-brand { display: flex; align-items: center; gap: 9px; flex: 1; }
.sb-brand-name {
  font-family: var(--font-display);
  font-size: 14px; font-weight: 600;
  color: var(--sb-text-strong);
  letter-spacing: -0.005em;
  line-height: 1.1;
}
.sb-brand-sub {
  font-size: 10.5px;
  color: var(--sb-text-muted);
  letter-spacing: .04em;
  text-transform: uppercase;
}
.sb-cmd {
  width: 26px; height: 26px;
  border: 1px solid var(--sb-border);
  background: var(--sb-bg-2);
  color: var(--sb-text);
  border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
}
.sb-cmd:hover { color: white; }

.sb-workspace { padding: 4px 10px 10px; position: relative; z-index: 1; }
.sb-ws {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px;
  background: var(--sb-bg-2);
  border: 1px solid var(--sb-border);
  border-radius: 8px;
  cursor: pointer;
}
.sb-ws:hover { background: var(--sb-hover); }
.sb-ws-av {
  width: 24px; height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, #5B5BF7, #22D3EE);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
  letter-spacing: .03em;
}
.sb-ws-body { flex: 1; min-width: 0; }
.sb-ws-name { font-size: 12.5px; font-weight: 600; color: var(--sb-text-strong); }
.sb-ws-meta { font-size: 10.5px; color: var(--sb-text-muted); }

.sb-nav {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px 12px;
  position: relative; z-index: 1;
}
.sb-nav::-webkit-scrollbar { width: 6px; }
.sb-nav::-webkit-scrollbar-thumb { background: #2A2D36; border: none; }

.sb-group { padding: 10px 0 4px; }
.sb-group-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--sb-text-muted);
  padding: 4px 8px 6px;
  font-weight: 600;
}
.sb-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  background: transparent;
  border: 0;
  color: var(--sb-text);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  text-align: left;
  transition: background .12s, color .12s;
}
.sb-item:hover { background: var(--sb-hover); color: var(--sb-text-strong); }
.sb-item.active {
  background: var(--sb-active);
  color: var(--sb-text-strong);
  box-shadow: inset 2px 0 0 var(--primary);
}
.sb-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sb-item-badge {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #2A2D36;
  color: var(--sb-text);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.sb-item.active .sb-item-badge { background: #3A3D48; color: white; }
.sb-item.pin {
  background: linear-gradient(135deg, rgba(91,91,247,.16), rgba(34,211,238,.10));
  border: 1px solid rgba(91,91,247,.30);
  color: #DCDCFE;
}
.sb-item.pin:hover { background: linear-gradient(135deg, rgba(91,91,247,.26), rgba(34,211,238,.16)); color: white; }
.sb-item.pin.active { background: linear-gradient(135deg, rgba(91,91,247,.32), rgba(34,211,238,.20)); color: white; border-color: rgba(91,91,247,.5); box-shadow: none; }
.sb-item-pin {
  font-size: 9.5px;
  padding: 1px 6px;
  background: rgba(255,255,255,.12);
  border-radius: 4px;
  letter-spacing: .04em;
  font-weight: 600;
  color: #C7C7FE;
}

.sb-foot { padding: 10px; border-top: 1px solid var(--sb-border); position: relative; z-index: 1; }
.sb-user {
  display: flex; align-items: center; gap: 9px;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
}
.sb-user:hover { background: var(--sb-hover); }
.sb-user-body { flex: 1; min-width: 0; }
.sb-user-name { font-size: 12.5px; font-weight: 600; color: var(--sb-text-strong); }
.sb-user-role { font-size: 10.5px; color: var(--sb-text-muted); }
`;

if (!document.getElementById("sb-styles")) {
  const s = document.createElement("style");
  s.id = "sb-styles";
  s.textContent = _sbStyles;
  document.head.appendChild(s);
}


const useStateTB = useState;

const SCREEN_META = {
  dashboard: { crumbs: ["Workspace", "Dashboard"], title: "Dashboard", sub: "Overview · Today, May 24" },
  growth:    { crumbs: ["Comercial", "Pipeline"], title: "Pipeline", sub: "Embudo comercial" },
  prospects: { crumbs: ["Comercial", "Prospectos"], title: "Prospectos", sub: "Lead Discovery · Research Engine" },
  campaigns: { crumbs: ["Comercial", "Campañas"], title: "Campañas", sub: "Inbound Lead Engine — captación de Inspyra" },
  followup:  { crumbs: ["Comercial", "Seguimiento"], title: "Seguimiento", sub: "Follow-up Center — tu bandeja comercial diaria" },
  pipeline:  { crumbs: ["Comercial", "Pipeline"], title: "Pipeline", sub: "Sales Pipeline — todos los leads convergen acá" },
  meetings:  { crumbs: ["Comercial", "Reuniones"], title: "Reuniones", sub: "Sales Meetings Center — agenda comercial" },
  clients:   { crumbs: ["Delivery", "Clientes"], title: "Clientes", sub: "Active accounts" },
  services:  { crumbs: ["Delivery", "Servicios"], title: "Servicios", sub: "Contracted services" },
  projects:  { crumbs: ["Delivery", "Proyectos"], title: "Proyectos", sub: "Active project board" },
  tasks:     { crumbs: ["Delivery", "Tareas"], title: "Tareas", sub: "All assigned work" },
  lab:       { crumbs: ["Studio", "Laboratorio IA"], title: "Laboratorio IA", sub: "Creative AI workspace" },
  hosting:   { crumbs: ["Operations", "HostingGuard"], title: "HostingGuard", sub: "Deployments & infra" },
  billing:   { crumbs: ["Operations", "Facturación"], title: "Facturación", sub: "Revenue & invoices" },
  tickets:   { crumbs: ["Operations", "Tickets"], title: "Tickets", sub: "Support queue" },
  reports:   { crumbs: ["Operations", "Reportes"], title: "Reportes", sub: "Saved reports" },
  settings:  { crumbs: ["Account", "Configuración"], title: "Configuración", sub: "Workspace settings" },
};

function Topbar({ screen }) {
  const m = SCREEN_META[screen] || SCREEN_META.dashboard;
  return (
    <header className="topbar">
      <div className="topbar-crumbs">
        {m.crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumb-sep">/</span>}
            <span className={i === m.crumbs.length - 1 ? "crumb-current" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="topbar-search">
        <Icon.search size={14}/>
        <input placeholder="Search clients, projects, tickets…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button className="btn btn-sm btn-ghost"><Icon.lightning size={14}/> Quick actions</button>
        <span style={{ width: 1, height: 18, background: "var(--border)" }}/>
        <button className="icon-btn" title="Inbox"><Icon.inbox size={15}/></button>
        <button className="icon-btn" title="Notifications"><Icon.bell size={15}/><span className="dot"/></button>
        <button className="icon-btn" title="Help"><Icon.life size={15}/></button>
        <Avatar name="Mateo López" size="md"/>
      </div>
    </header>
  );
}


function Login({ onEnter }) {
  const [email, setEmail] = useState("admin@inspyra.io");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await authApi.login(email, password);
      setStoredToken(accessToken, refreshToken);
      onEnter();
    } catch (e) {
      setError(e.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="login-stage">
      <div className="login-form-side">
        <div className="login-form">
          <div className="login-brand">
            <InspyraLogo size={26}/>
            <div className="name">Inspyra</div>
            <span className="badge outline" style={{ marginLeft: 6, fontSize: 10, padding: "1px 7px" }}>ERP · Internal</span>
          </div>

          <div>
            <h1 className="login-h1">Bienvenido de vuelta.</h1>
            <p className="login-sub">Operá tu agencia desde un solo lugar — Growth, Delivery, Studio y Operations.</p>
          </div>

          <div className="field">
            <label>Email corporativo</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} style={{ height: 40 }}/>
          </div>

          <div className="field">
            <div className="row between">
              <label>Contraseña</label>
              <a style={{ fontSize: 11.5, color: "var(--primary-700)", textDecoration: "none" }}>¿Olvidaste tu contraseña?</a>
            </div>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" style={{ height: 40 }}/>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", background: "var(--danger-soft, #fff5f5)", border: "1px solid var(--danger)", borderRadius: 8, fontSize: 13, color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <label className="row gap-sm" style={{ fontSize: 12.5, color: "var(--ink-700)", cursor: "pointer" }}>
            <input type="checkbox" defaultChecked/>
            Mantenerme conectado en este equipo
          </label>

          <button className="btn btn-brand btn-lg" style={{ width: "100%", justifyContent: "center", height: 42, fontSize: 14, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando…" : <><span>Iniciar sesión</span> <Icon.arrowRight size={14}/></>}
          </button>

          <div style={{ position: "relative", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: "50% 0", height: 1, background: "var(--border)" }}/>
            <span style={{ position: "relative", background: "var(--bg)", padding: "0 12px", fontSize: 11.5, color: "var(--ink-500)" }}>o continuar con</span>
          </div>

          <div className="row gap-sm">
            <button className="btn btn-lg" style={{ flex: 1, justifyContent: "center", height: 40 }}>
              <span style={{ fontWeight: 700, color: "#4285F4" }}>G</span> Google
            </button>
            <button className="btn btn-lg" style={{ flex: 1, justifyContent: "center", height: 40 }}>
              <Icon.shield size={14}/> SSO Okta
            </button>
          </div>

          <div style={{ fontSize: 11.5, color: "var(--ink-500)", textAlign: "center", marginTop: 4 }}>
            Acceso solo para miembros del equipo. ¿No tenés cuenta? Pedile invitación a tu admin.
          </div>
        </div>
      </div>

      <div className="login-decor">
        <div className="gridlines"/>
        {/* floating cards collage */}
        <div style={{ position: "absolute", top: "12%", right: "10%", width: 280, transform: "rotate(-3deg)" }}>
          <FloatingCard
            title="Helia Energy"
            subtitle="Plataforma SaaS · v2.4 desplegada"
            footer="hace 2 min · build 1m 48s"
            accent="#5B5BF7"
          />
        </div>
        <div style={{ position: "absolute", top: "32%", left: "8%", width: 240, transform: "rotate(2deg)" }}>
          <FloatingCard
            title="Pipeline · USD 76.3k"
            subtitle="14 deals · 3 cerca de cierre"
            footer="Growth Q2"
            accent="#22D3EE"
            stat
          />
        </div>
        <div style={{ position: "absolute", bottom: "12%", right: "8%", width: 300, transform: "rotate(2deg)" }}>
          <FloatingCard
            title="Content Agent"
            subtitle="Generó 8 reels · calendario mayo · Helia Energy"
            footer="Laboratorio IA"
            accent="#A78BFA"
            agent
          />
        </div>

        <div className="quote">
          La agencia ya no se mide en horas. Se mide en deploys, ingresos recurrentes y contenido que mueve la aguja.
          <div className="quote-cite">— Filosofía operativa de Inspyra</div>
        </div>
      </div>
    </div>
  );
}

function FloatingCard({ title, subtitle, footer, accent, stat, agent }) {
  return (
    <div style={{
      background: "rgba(20,22,28,.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 12,
      padding: "12px 14px",
      color: "white",
      boxShadow: "0 24px 60px -16px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)",
    }}>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: accent + "33", border: `1px solid ${accent}55`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: accent }}>
          {agent ? <Icon.sparkles size={11}/> : stat ? <Icon.trend size={11}/> : <Icon.rocket size={11}/>}
        </span>
        <span style={{ fontSize: 10, color: accent, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600 }}>{footer.split(" ")[0]}</span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>{subtitle}</div>
      {stat && (
        <div className="row" style={{ gap: 3, marginTop: 8, alignItems: "flex-end", height: 24 }}>
          {[40, 55, 48, 70, 62, 78, 88, 72, 92, 85].map((v, i) => (
            <span key={i} style={{ flex: 1, background: i > 6 ? accent : "rgba(255,255,255,.15)", height: v + "%", borderRadius: 1.5 }}/>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", marginTop: 8 }}>{footer}</div>
    </div>
  );
}



const KPI = ({ icon, label, value, unit, delta, trend, chartColor = "#0B0D12", chartFill }) => {
  const IconC = Icon[icon];
  return (
    <div className="kpi">
      <div className="kpi-head">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="kpi-icon">{IconC && <IconC size={14}/>}</span>
          {label}
        </span>
        <button className="icon-btn" style={{ width: 22, height: 22, background: "transparent", border: 0 }}>
          <Icon.more size={14}/>
        </button>
      </div>
      <div className="kpi-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="row between">
        <span className={`kpi-delta ${delta?.dir || "flat"}`}>
          {delta?.dir === "up" && <Icon.arrowUp size={10} stroke={2.4}/>}
          {delta?.dir === "down" && <Icon.arrowDown size={10} stroke={2.4}/>}
          {delta?.value}
        </span>
        <Spark data={trend} color={chartColor} fill={chartFill} w={90} h={28}/>
      </div>
    </div>
  );
};

const PIPELINE = [
  { name: "Lead", color: "#9CA3AF", deals: [
    { co: "Aurora Café", contact: "Sofía Vidal", amt: "USD 1.4k", days: "Hoy", svc: "Web + SEO" },
    { co: "Nordic Studio", contact: "K. Lindqvist", amt: "USD 3.2k", days: "2d", svc: "Branding + Web" },
    { co: "Veleta Wines", contact: "P. Echeverría", amt: "USD 980", days: "3d", svc: "Redes" },
    { co: "Helix Robotics", contact: "L. Ortega", amt: "USD 6.4k", days: "5d", svc: "Software" },
  ]},
  { name: "Contactado", color: "#A78BFA", deals: [
    { co: "Bauer & Co", contact: "J. Bauer", amt: "USD 5.8k", days: "1d", svc: "Web · Hosting" },
    { co: "Lumen Salud", contact: "Dra. M. Roca", amt: "USD 2.7k", days: "2d", svc: "SEO local" },
    { co: "Forge Legal", contact: "T. Vega", amt: "USD 4.5k", days: "4d", svc: "Web + redes" },
  ]},
  { name: "Reunión", color: "#5B5BF7", deals: [
    { co: "Calá Inmobiliaria", contact: "R. Ferro", amt: "USD 8.2k", days: "Mañana", svc: "Plataforma + SEO" },
    { co: "Tessera Joyas", contact: "A. Tessera", amt: "USD 3.6k", days: "Hoy", svc: "Tienda online" },
  ]},
  { name: "Propuesta", color: "#22D3EE", deals: [
    { co: "Helia Energy", contact: "F. Cazenave", amt: "USD 14.5k", days: "Vence 3d", svc: "Software + AWS" },
    { co: "Norte Films", contact: "I. Saavedra", amt: "USD 6.8k", days: "Vence 5d", svc: "Plataforma" },
    { co: "Mira Cosmetics", contact: "C. Bregman", amt: "USD 4.2k", days: "Vence 1d", svc: "E-commerce" },
  ]},
  { name: "Ganado", color: "#10B981", deals: [
    { co: "Klein Studio", contact: "D. Klein", amt: "USD 9.4k", days: "Cerrado", svc: "Web + SEO + Redes" },
    { co: "Borealis Tours", contact: "M. Calderón", amt: "USD 5.1k", days: "Cerrado", svc: "Mantenimiento" },
  ]},
];

const PROJECTS = [
  { id: "P-2417", client: "Helia Energy", svc: "Plataforma SaaS", lead: "Mateo López", status: "En desarrollo", tone: "info", due: "12 Jun", pct: 64 },
  { id: "P-2412", client: "Tessera Joyas", svc: "E-commerce Shopify", lead: "Lucía Romero", status: "Revisión", tone: "warning", due: "29 May", pct: 88 },
  { id: "P-2408", client: "Calá Inmobiliaria", svc: "Web institucional", lead: "Pablo Ferré", status: "En diseño", tone: "brand", due: "5 Jun", pct: 32 },
  { id: "P-2404", client: "Klein Studio", svc: "SEO + Redes", lead: "Camila Vega", status: "Mantenimiento", tone: "default", due: "Recurrente", pct: 100 },
  { id: "P-2399", client: "Borealis Tours", svc: "Hosting + SSL", lead: "Diego Salas", status: "Entregado", tone: "success", due: "—", pct: 100 },
  { id: "P-2391", client: "Lumen Salud", svc: "Landing + Ads", lead: "Lucía Romero", status: "Pendiente", tone: "default", due: "8 Jun", pct: 8 },
];

const ACTIVITY = [
  { who: "Lucía Romero", what: "creó un cliente nuevo", obj: "Aurora Café", time: "hace 12 min", icon: "user", tone: "brand" },
  { who: "HostingGuard", what: "desplegó", obj: "tessera-joyas.com · v3.2", time: "hace 24 min", icon: "rocket", tone: "success" },
  { who: "Stripe", what: "recibió pago de", obj: "USD 4,500 — Klein Studio", time: "hace 1 h", icon: "card", tone: "success" },
  { who: "Diego Salas", what: "resolvió un ticket", obj: "#284 SSL renew — Borealis", time: "hace 2 h", icon: "shield", tone: "default" },
  { who: "Content Agent", what: "aprobó contenido", obj: "Calendario mayo · Helia Energy", time: "hace 3 h", icon: "sparkles", tone: "brand" },
  { who: "Pablo Ferré", what: "movió un proyecto a", obj: "Revisión — Tessera Joyas", time: "hace 4 h", icon: "flow", tone: "warning" },
  { who: "Mateo López", what: "ganó la oportunidad", obj: "Borealis Tours · USD 5.1k", time: "ayer", icon: "trend", tone: "success" },
];

const UPCOMING = [
  { kind: "Pago", label: "Helia Energy — Mantenimiento", amount: "USD 1,200", date: "26 May", in: "en 2 días", tone: "warning" },
  { kind: "Renovación", label: "Klein Studio — Hosting AWS", amount: "USD 480/yr", date: "28 May", in: "en 4 días", tone: "info" },
  { kind: "SSL", label: "tessera-joyas.com", amount: "Let's Encrypt", date: "30 May", in: "en 6 días", tone: "default" },
  { kind: "Mantenimiento", label: "Calá Inmobiliaria — Web", amount: "Mensual", date: "1 Jun", in: "en 8 días", tone: "brand" },
  { kind: "Pago", label: "Forge Legal — Setup", amount: "USD 2,400", date: "5 Jun", in: "atrasado 2d", tone: "danger" },
];

function Dashboard() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Buenos días, Mateo 👋</h1>
          <p>Resumen de tu agencia · Lunes 24 de mayo, 2026</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Este mes <Icon.chevronDown size={12}/></button>
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-primary"><Icon.plus size={14}/> Nuevo</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <KPI icon="sparkles" label="Leads nuevos" value="142" delta={{ dir: "up", value: "+18%" }}
             trend={[8,11,9,14,16,12,18,22,19,24,21,28]} chartColor="#5B5BF7"/>
        <KPI icon="building" label="Clientes activos" value="48" delta={{ dir: "up", value: "+3" }}
             trend={[40,41,42,43,44,44,45,46,46,47,47,48]} chartColor="#10B981"/>
        <KPI icon="flow" label="Proyectos activos" value="23" delta={{ dir: "flat", value: "Estable" }}
             trend={[22,24,21,23,22,24,23,22,23,24,23,23]} chartColor="#4B5363"/>
        <KPI icon="check2" label="Tareas pendientes" value="32" delta={{ dir: "down", value: "−6" }}
             trend={[44,42,40,38,38,36,34,33,34,32,33,32]} chartColor="#F59E0B"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <KPI icon="card" label="Ingresos del mes" value="86,420" unit="USD"
             delta={{ dir: "up", value: "+24%" }}
             trend={[18,28,22,35,32,44,48,52,58,66,74,86]} chartColor="#5B5BF7"
             chartFill="rgba(91,91,247,.10)"/>
        <KPI icon="trend" label="MRR" value="32,180" unit="USD/mes"
             delta={{ dir: "up", value: "+8.2%" }}
             trend={[24,25,25,26,27,28,29,30,30,31,32,32]} chartColor="#22D3EE"
             chartFill="rgba(34,211,238,.10)"/>
        <KPI icon="rocket" label="Deployments activos" value="124"
             delta={{ dir: "up", value: "+12" }}
             trend={[88,92,96,100,104,108,112,115,118,120,122,124]} chartColor="#0B0D12"/>
        <KPI icon="life" label="Tickets abiertos" value="7"
             delta={{ dir: "down", value: "−4" }}
             trend={[14,12,11,12,10,9,9,8,8,7,7,7]} chartColor="#EF4444"/>
      </div>

      {/* Pipeline */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            Pipeline comercial
            <span className="badge outline" style={{ marginLeft: 6 }}>14 deals · USD 76.3k</span>
          </div>
          <div className="row gap-sm">
            <button className="btn btn-sm btn-ghost"><Icon.filter size={13}/> Filtrar</button>
            <button className="btn btn-sm btn-ghost"><Icon.users size={13}/> Todos</button>
            <button className="btn btn-sm"><Icon.external size={13}/> Abrir Growth</button>
          </div>
        </div>
        <div className="card-body">
          <div className="pipeline">
            {PIPELINE.map((stage) => {
              const total = stage.deals.reduce((a, d) => a + parseFloat(d.amt.replace(/[^0-9.]/g, "")), 0);
              return (
                <div key={stage.name} className="pipeline-col">
                  <div className="pipeline-col-head">
                    <div className="h">
                      <span className="stagebar" style={{ background: stage.color }}/>
                      {stage.name}
                      <span className="count">{stage.deals.length}</span>
                    </div>
                    <span className="val">USD {total.toFixed(1)}k</span>
                  </div>
                  {stage.deals.map((d, i) => (
                    <div key={i} className="deal">
                      <div className="deal-name">{d.co}</div>
                      <div className="deal-meta">
                        <Avatar name={d.contact} size="sm"/>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.contact}</span>
                      </div>
                      <div className="deal-meta">
                        <Icon.layers size={11}/> {d.svc}
                      </div>
                      <div className="deal-foot">
                        <span className="deal-amount">{d.amt}</span>
                        <span className="badge outline" style={{ fontSize: 10 }}>{d.days}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginBottom: 16 }}>
        {/* Last projects */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Últimos proyectos</div>
            <div className="row gap-sm">
              <button className="btn btn-sm btn-ghost"><Icon.filter size={13}/></button>
              <button className="btn btn-sm">Ver todos</button>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th style={{ width: 90 }}>Deadline</th>
                <th style={{ width: 110 }}>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-strong">{p.svc}</div>
                    <div className="cell-muted" style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>{p.id}</div>
                  </td>
                  <td className="cell-strong">{p.client}</td>
                  <td><Badge tone={p.tone} dot>{p.status}</Badge></td>
                  <td>
                    <div className="row gap-sm">
                      <Avatar name={p.lead} size="sm"/>
                      <span>{p.lead.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="cell-muted col-num">{p.due}</td>
                  <td>
                    <div className="row gap-sm">
                      <div style={{ flex: 1 }}><Progress value={p.pct} tone={p.pct === 100 ? "success" : "brand"}/></div>
                      <span className="col-num" style={{ fontSize: 11.5, color: "var(--ink-500)", width: 28, textAlign: "right" }}>{p.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Actividad reciente</div>
            <button className="btn btn-sm btn-ghost"><Icon.more size={14}/></button>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <div className="timeline">
              {ACTIVITY.map((a, i) => {
                const IconC = Icon[a.icon] || Icon.dot;
                return (
                  <div key={i} className="timeline-item">
                    <span className={`timeline-dot ${a.tone}`}><IconC size={10} stroke={2}/></span>
                    <div className="timeline-content">
                      <span className="who">{a.who}</span> {a.what} <span style={{ color: "var(--ink-900)", fontWeight: 500 }}>{a.obj}</span>
                      <div className="timeline-meta">{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        {/* Upcoming */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Próximos vencimientos</div>
            <button className="btn btn-sm btn-ghost"><Icon.calendar size={13}/> Próximos 14 días</button>
          </div>
          <div style={{ padding: "4px 6px 6px" }}>
            {UPCOMING.map((u, i) => (
              <div key={i} className="row" style={{ padding: "10px 12px", borderBottom: i === UPCOMING.length - 1 ? "none" : "1px solid var(--border-soft)", gap: 12 }}>
                <Badge tone={u.tone}>{u.kind}</Badge>
                <div style={{ flex: 1 }}>
                  <div className="cell-strong" style={{ fontSize: 13 }}>{u.label}</div>
                  <div className="cell-muted" style={{ fontSize: 11.5 }}>{u.amount}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="cell-strong" style={{ fontSize: 12.5 }}>{u.date}</div>
                  <div className="cell-muted" style={{ fontSize: 11 }}>{u.in}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ingresos · últimos 6 meses</div>
            <div className="row gap-sm">
              <Badge tone="brand" dot>Mensual</Badge>
              <Badge tone="default" dot>Recurrente</Badge>
            </div>
          </div>
          <div className="card-body">
            <RevenueChart />
            <div className="row between" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
              <div>
                <div className="cell-muted" style={{ fontSize: 11.5 }}>Total semestre</div>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>USD 412,840</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="cell-muted" style={{ fontSize: 11.5 }}>Crecimiento</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--success-ink)" }}>+38.4% vs anterior</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueChart() {
  const data = [
    { m: "Dic", a: 42, b: 26 },
    { m: "Ene", a: 51, b: 28 },
    { m: "Feb", a: 58, b: 29 },
    { m: "Mar", a: 67, b: 30 },
    { m: "Abr", a: 74, b: 31 },
    { m: "May", a: 86, b: 32 },
  ];
  const W = 540, H = 180, P = 24;
  const max = 100;
  const xStep = (W - P * 2) / (data.length - 1);
  const yScale = (v) => H - P - (v / max) * (H - P * 2);

  const lineA = data.map((d, i) => [P + i * xStep, yScale(d.a)]);
  const lineB = data.map((d, i) => [P + i * xStep, yScale(d.b)]);
  const pathA = lineA.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const pathB = lineB.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaA = `${pathA} L${W - P},${H - P} L${P},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B5BF7" stopOpacity=".22"/>
          <stop offset="1" stopColor="#5B5BF7" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={P} x2={W - P} y1={P + i * ((H - P * 2) / 3)} y2={P + i * ((H - P * 2) / 3)}
              stroke="#EEF0F3" strokeWidth="1"/>
      ))}
      <path d={areaA} fill="url(#rev-grad)"/>
      <path d={pathA} fill="none" stroke="#5B5BF7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <path d={pathB} fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="3 3"/>
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={lineA[i][0]} cy={lineA[i][1]} r={3.5} fill="white" stroke="#5B5BF7" strokeWidth="2"/>
          <text x={P + i * xStep} y={H - 6} textAnchor="middle" fill="#6B7280" fontSize="10.5" fontFamily="var(--font-sans)">{d.m}</text>
        </g>
      ))}
    </svg>
  );
}


const useStateCom = useState;

/* Sub-navigation shared across all 5 Comercial sections.
   Reinforces "where am I" + the daily mental model: descubrir → captar → seguir → cerrar → reunirse. */
const COM_TABS = [
  { id: "prospects", label: "Prospectos", icon: "search", hint: "Los buscamos nosotros", badge: "248" },
  { id: "campaigns", label: "Campañas", icon: "rocket", hint: "Captación de Inspyra", badge: null },
  { id: "followup", label: "Seguimiento", icon: "inbox", hint: "Tu bandeja diaria", badge: "14", alert: true },
  { id: "pipeline", label: "Pipeline", icon: "funnel", hint: "Embudo de ventas", badge: null },
  { id: "meetings", label: "Reuniones", icon: "calendar", hint: "Agenda comercial", badge: "5" },
];

function ComercialTabs({ active, onNav }) {
  const { data: tabKpis } = useQuery({
    queryKey: ["prospects", "kpis"],
    queryFn: prospectsApi.kpis,
    enabled: Boolean(getStoredToken()),
    staleTime: 60000,
  });
  const prospectTotal = tabKpis?.total;

  return (
    <div className="com-tabs">
      {COM_TABS.map((t) => {
        const IconC = Icon[t.icon];
        const on = active === t.id;
        const badge = t.id === 'prospects' && prospectTotal != null ? String(prospectTotal) : t.badge;
        return (
          <button key={t.id} className={`com-tab ${on ? "active" : ""}`} onClick={() => onNav?.(t.id)}>
            <span className="com-tab-ic">{IconC && <IconC size={16}/>}</span>
            <span className="com-tab-text">
              <span className="com-tab-label">
                {t.label}
                {badge && <span className={`com-tab-badge ${t.alert ? "alert" : ""}`}>{badge}</span>}
              </span>
              <span className="com-tab-hint">{t.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* Origin channel — the spec's key differentiator. Every lead shows where it came from. */
const CHANNELS = {
  meta:      { label: "Meta Ads", color: "#1877F2", icon: "rocket" },
  fbmsg:     { label: "FB Messenger", color: "#0084FF", icon: "message" },
  igdm:      { label: "Instagram DM", color: "#E1306C", icon: "sparkles" },
  whatsapp:  { label: "WhatsApp", color: "#25D366", icon: "whatsapp" },
  webform:   { label: "Web Form", color: "#5B5BF7", icon: "globe" },
  google:    { label: "Google Ads", color: "#F9AB00", icon: "search" },
  outbound:  { label: "Outbound", color: "#6B7280", icon: "target" },
  referido:  { label: "Referido", color: "#F59E0B", icon: "users" },
  organico:  { label: "Orgánico", color: "#10B981", icon: "trend" },
};

function ChannelTag({ ch, sm }) {
  const c = CHANNELS[ch] || CHANNELS.outbound;
  const IconC = Icon[c.icon];
  return (
    <span className="channel-tag" style={{ "--ch": c.color, fontSize: sm ? 11 : 11.5 }}>
      <span className="channel-dot" style={{ background: c.color }}/>
      {IconC && <IconC size={sm ? 10 : 11}/>}
      {c.label}
    </span>
  );
}

/* Research Score ring — 0..100 with color band */
function Score({ v }) {
  const tone = v >= 90 ? "#10B981" : v >= 75 ? "#5B5BF7" : v >= 60 ? "#F59E0B" : "#9CA3AF";
  return (
    <span className="score">
      <span className="score-ring" style={{ "--p": v + "%", "--c": tone }}>
        <span className="score-num">{v}</span>
      </span>
    </span>
  );
}

/* Hot/temperature indicator */
function Temp({ level }) {
  const map = { hot: { c: "#EF4444", l: "Caliente", i: "fire" }, warm: { c: "#F59E0B", l: "Tibio", i: "clock" }, cold: { c: "#6B7280", l: "Frío", i: "clock" } };
  const t = map[level] || map.cold;
  const IconC = Icon[t.i];
  return (
    <span className="temp" style={{ color: t.c }}>
      <IconC size={12}/> {t.l}
    </span>
  );
}

/* Quick-action icon buttons used in Seguimiento */
function QuickActions({ compact }) {
  const acts = [
    { ic: "phone", t: "Llamar", c: "#10B981" },
    { ic: "whatsapp", t: "WhatsApp", c: "#25D366" },
    { ic: "mail", t: "Email", c: "#5B5BF7" },
    { ic: "calendar", t: "Reagendar", c: "#F59E0B" },
    { ic: "check", t: "Respondido", c: "#6B7280" },
  ];
  return (
    <div className="quick-actions">
      {acts.map((a) => {
        const IconC = Icon[a.ic];
        return (
          <button key={a.ic} className="qa-btn" title={a.t} style={{ "--qc": a.c }}>
            <IconC size={14}/>
          </button>
        );
      })}
    </div>
  );
}

/* THE AUTOMATION FLOW — the lead lifecycle, shown as a horizontal pipeline of automated steps */
function AutomationFlow({ compact }) {
  const steps = [
    { ic: "inbox", t: "Lead entra", s: "Bot captura", c: "#5B5BF7", auto: true },
    { ic: "zap", t: "Respuesta inmediata", s: "Auto-reply", c: "#22D3EE", auto: true },
    { ic: "refresh", t: "Sin respuesta", s: "Seguimiento auto", c: "#F59E0B", auto: true },
    { ic: "users", t: "Responde", s: "Asignación comercial", c: "#A78BFA", auto: false },
    { ic: "calendar", t: "Agenda", s: "→ Reuniones", c: "#0EA5E9", auto: false },
    { ic: "doc", t: "Propuesta", s: "→ Pipeline", c: "#5B5BF7", auto: false },
    { ic: "trophy", t: "Cierre", s: "→ Cliente", c: "#10B981", auto: false },
  ];
  return (
    <div className="auto-flow">
      {steps.map((st, i) => {
        const IconC = Icon[st.ic];
        return (
          <React.Fragment key={i}>
            <div className="auto-step">
              <span className="auto-step-ic" style={{ "--ac": st.c }}>
                <IconC size={16}/>
              </span>
              <div className="auto-step-text">
                <div className="auto-step-t">{st.t}</div>
                <div className="auto-step-s">
                  {st.auto && <span className="auto-badge"><Icon.robot size={9}/> auto</span>}
                  {st.s}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && <Icon.chevronRight size={14} className="auto-arrow"/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* Bots connection strip */
const BOTS = [
  { id: "meta", name: "Meta Ads Bot", desc: "Captura leads de anuncios", ch: "meta", on: true, today: 18 },
  { id: "fbmsg", name: "Messenger Bot", desc: "Captura y clasifica chats", ch: "fbmsg", on: true, today: 7 },
  { id: "igdm", name: "Instagram DM Bot", desc: "Mensajes comerciales", ch: "igdm", on: true, today: 12 },
  { id: "whatsapp", name: "WhatsApp Bot", desc: "Clasifica conversaciones", ch: "whatsapp", on: true, today: 24 },
  { id: "webform", name: "Web Form Bot", desc: "Leads de formularios", ch: "webform", on: true, today: 9 },
];

function BotsStrip() {
  return (
    <div className="bots-strip">
      {BOTS.map((b) => {
        const c = CHANNELS[b.ch];
        const IconC = Icon[c.icon];
        return (
          <div key={b.id} className="bot-card">
            <span className="bot-ic" style={{ background: c.color + "1A", color: c.color }}>
              <IconC size={16}/>
            </span>
            <div className="bot-body">
              <div className="bot-name">
                {b.name}
                <span className="bot-status" style={{ background: b.on ? "var(--success)" : "var(--ink-300)" }}/>
              </div>
              <div className="bot-desc">{b.desc}</div>
            </div>
            <div className="bot-stat">
              <div className="bot-stat-n">+{b.today}</div>
              <div className="bot-stat-l">hoy</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const _comStyles = `
.com-tabs {
  display: flex; gap: 6px;
  margin-bottom: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 6px;
  box-shadow: var(--sh-xs);
}
.com-tab {
  flex: 1;
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--r-md);
  text-align: left;
  transition: all .14s;
}
.com-tab:hover { background: var(--surface-hover); }
.com-tab.active {
  background: var(--ink-900);
  border-color: var(--ink-900);
}
.com-tab-ic {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: var(--bg-2);
  color: var(--ink-700);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.com-tab.active .com-tab-ic { background: rgba(255,255,255,.12); color: white; }
.com-tab-text { display: flex; flex-direction: column; min-width: 0; }
.com-tab-label {
  font-size: 13.5px; font-weight: 600; color: var(--ink-900);
  letter-spacing: -0.01em; display: flex; align-items: center; gap: 6px;
}
.com-tab.active .com-tab-label { color: white; }
.com-tab-hint { font-size: 11px; color: var(--ink-500); white-space: nowrap; }
.com-tab.active .com-tab-hint { color: rgba(255,255,255,.55); }
.com-tab-badge {
  font-size: 10px; font-weight: 600;
  padding: 0 6px; height: 16px;
  display: inline-flex; align-items: center;
  background: var(--ink-100); color: var(--ink-600);
  border-radius: 999px;
}
.com-tab-badge.alert { background: var(--danger-soft); color: var(--danger-ink); }
.com-tab.active .com-tab-badge { background: rgba(255,255,255,.16); color: white; }

.channel-tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 500;
  color: var(--ink-700);
  white-space: nowrap;
}
.channel-dot { width: 6px; height: 6px; border-radius: 50%; }

.score { display: inline-flex; align-items: center; }
.score-ring {
  width: 34px; height: 34px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: conic-gradient(var(--c) var(--p), var(--ink-100) 0);
  position: relative;
}
.score-ring::before {
  content: ''; position: absolute; inset: 3px;
  background: var(--surface); border-radius: 50%;
}
.score-num {
  position: relative; z-index: 1;
  font-size: 11.5px; font-weight: 700;
  color: var(--ink-900);
  font-variant-numeric: tabular-nums;
}

.temp { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 500; }

.quick-actions { display: flex; gap: 4px; }
.qa-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-600);
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .12s;
}
.qa-btn:hover { background: var(--qc); border-color: var(--qc); color: white; }

.auto-flow {
  display: flex; align-items: stretch; gap: 4px;
  overflow-x: auto;
  padding: 4px 2px;
}
.auto-step {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  flex: 1; min-width: 150px;
}
.auto-step-ic {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: var(--ac); color: white;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px -2px var(--ac);
}
.auto-step-t { font-size: 12.5px; font-weight: 600; color: var(--ink-900); }
.auto-step-s { font-size: 10.5px; color: var(--ink-500); display: flex; align-items: center; gap: 5px; margin-top: 1px; }
.auto-badge {
  display: inline-flex; align-items: center; gap: 3px;
  background: var(--primary-soft); color: var(--primary-700);
  font-size: 9px; font-weight: 600;
  padding: 1px 5px; border-radius: 999px;
}
.auto-arrow { color: var(--ink-300); flex-shrink: 0; align-self: center; }

.bots-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.bot-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-xs);
}
.bot-ic { width: 34px; height: 34px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bot-body { flex: 1; min-width: 0; }
.bot-name { font-size: 12.5px; font-weight: 600; color: var(--ink-900); display: flex; align-items: center; gap: 6px; }
.bot-status { width: 6px; height: 6px; border-radius: 50%; }
.bot-desc { font-size: 11px; color: var(--ink-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bot-stat { text-align: right; flex-shrink: 0; }
.bot-stat-n { font-size: 14px; font-weight: 700; color: var(--success-ink); font-variant-numeric: tabular-nums; }
.bot-stat-l { font-size: 10px; color: var(--ink-400); }
`;

if (!document.getElementById("com-styles")) {
  const s = document.createElement("style");
  s.id = "com-styles";
  s.textContent = _comStyles;
  document.head.appendChild(s);
}

Object.assign(window, { ComercialTabs, ChannelTag, Score, Temp, QuickActions, AutomationFlow, BotsStrip, CHANNELS, COM_TABS });

const useStateProsp = useState;

const PROSPECTS_DATA = [
  { co: "Estudio Bregman & Asoc.", rubro: "Estudio jurídico", web: "bregman-legal.com.ar", ig: "@bregmanlegal", city: "Buenos Aires", opp: "Web desactualizada · sin SSL · sin SEO", svc: "Web + SEO local", score: 88, state: "Nuevo", last: "—", next: "Hoy 15:00", who: "Lucía Romero" },
  { co: "Inmobiliaria Calá", rubro: "Inmobiliaria", web: "cala-propiedades.com", ig: "@cala.propiedades", city: "Mar del Plata", opp: "Sin landing por proyecto", svc: "Plataforma + SEO", score: 92, state: "Contactado", last: "Hace 2d", next: "27 May", who: "Mateo López" },
  { co: "Aurora Café", rubro: "Gastronomía", web: "—", ig: "@aurora.cafe", city: "Córdoba", opp: "Sin web · solo IG", svc: "Web + delivery", score: 71, state: "Reunión", last: "Ayer", next: "Mañana 11:00", who: "Pablo Ferré" },
  { co: "Helix Robotics", rubro: "Industrial", web: "helixrobotics.io", ig: "—", city: "Rosario", opp: "Sin software interno · alto ticket", svc: "Software a medida", score: 95, state: "Propuesta", last: "Hace 5d", next: "29 May", who: "Mateo López" },
  { co: "Nordic Studio", rubro: "Arquitectura", web: "nordic-studio.se", ig: "@nordicstudio", city: "Mendoza", opp: "Web lenta · mobile pobre · sin SEO", svc: "Branding + Web", score: 64, state: "Nuevo", last: "—", next: "—", who: "Camila Vega" },
  { co: "Forge Legal", rubro: "Estudio jurídico", web: "forgelegal.com", ig: "—", city: "La Plata", opp: "Sin presencia digital · sin redes", svc: "Web + redes", score: 79, state: "Contactado", last: "Hace 1d", next: "28 May", who: "Pablo Ferré" },
  { co: "Lumen Salud", rubro: "Salud", web: "lumensalud.com", ig: "@lumen.salud", city: "Buenos Aires", opp: "Sin agenda online · ads activas", svc: "Plataforma + Ads", score: 84, state: "Reunión", last: "Hoy", next: "30 May", who: "Mateo López" },
  { co: "Veleta Wines", rubro: "Bodega", web: "veletawines.com", ig: "@veletawines", city: "Mendoza", opp: "Web genérica · sin tienda online", svc: "Branding + E-commerce", score: 58, state: "Nuevo", last: "—", next: "—", who: "Camila Vega" },
  { co: "Dental Costa", rubro: "Salud · Odontología", web: "dentalcosta.com", ig: "@dental.costa", city: "Mar del Plata", opp: "Redes activas, sin agenda online", svc: "Plataforma + Ads", score: 81, state: "Nuevo", last: "—", next: "—", who: "Sofía Vidal" },
  { co: "Grupo Andén", rubro: "Inmobiliaria", web: "grupoanden.com.ar", ig: "@grupoanden", city: "Buenos Aires", opp: "Web vieja · sin filtros de búsqueda", svc: "Plataforma + SEO", score: 76, state: "Contactado", last: "Hace 3d", next: "31 May", who: "Sofía Vidal" },
];

// ── Estado labels y tones ─────────────────────────────────────────────────────
const ESTADO_LABEL = {
  NUEVO: "Nuevo", INVESTIGADO: "Investigado", ENRIQUECIDO: "Enriquecido",
  LISTO_OUTREACH: "Listo", CONTACTADO: "Contactado", RESPONDIO: "Respondió",
  REUNION_AGENDADA: "Reunión", PASO_A_PIPELINE: "Pipeline",
  CONVERTIDO: "Ganado", DESCARTADO: "Descartado", ARCHIVADO: "Archivado",
};
const ESTADO_TONE = {
  NUEVO: "default", INVESTIGADO: "info", ENRIQUECIDO: "info",
  LISTO_OUTREACH: "brand", CONTACTADO: "info", RESPONDIO: "warning",
  REUNION_AGENDADA: "brand", PASO_A_PIPELINE: "warning",
  CONVERTIDO: "success", DESCARTADO: "danger", ARCHIVADO: "default",
};
const VAL_TONE = { PENDING: "warning", VALIDATED: "success", REJECTED: "danger" };
const VAL_LABEL = { PENDING: "Pendiente", VALIDATED: "Aprobado", REJECTED: "Rechazado" };

const aiStateFromScore = (s: number | null | undefined) =>
  s == null ? "PENDIENTE_OPPORTUNITY" :
  s >= 90 ? "PRIORIDAD_MAXIMA" :
  s >= 75 ? "APROBADO_IA" :
  s >= 60 ? "REVISAR" :
  "DESCARTADO_IA";
const AI_STATE_LABEL = { PENDIENTE_OPPORTUNITY: "Pendiente Opp.", PRIORIDAD_MAXIMA: "Prioridad máxima", APROBADO_IA: "Aprobado IA", REVISAR: "Revisar", DESCARTADO_IA: "Descartado IA" };
const AI_STATE_TONE  = { PENDIENTE_OPPORTUNITY: "default", PRIORIDAD_MAXIMA: "success", APROBADO_IA: "brand", REVISAR: "warning", DESCARTADO_IA: "danger" };
const AI_STATE_COLOR = { PENDIENTE_OPPORTUNITY: "#D1D5DB", PRIORIDAD_MAXIMA: "#10B981", APROBADO_IA: "#5B5BF7", REVISAR: "#F59E0B", DESCARTADO_IA: "#9CA3AF" };

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((now - d) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 0) return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return `Hace ${diff}d`;
}

// ── Prospect Drawer — 5 tabs: General · AI Assessment · Contacto · Validación · Historial
function ProspectDrawer({ prospectId, rowData, validationById, onClose, onReviewEnrichment }) {
  const [tab, setTab] = useState("assessment");
  const [enrichingFromDrawer, setEnrichingFromDrawer] = useState(false);
  const qc = useQueryClient();

  const handleEnrichFromDrawer = async () => {
    setEnrichingFromDrawer(true);
    try {
      await enrichmentApi.createJob(prospectId);
      qc.invalidateQueries({ queryKey: ["prospects"] });
      qc.invalidateQueries({ queryKey: ["enrichment"] });
    } catch (e) {
      alert("Error al enriquecer: " + e.message);
    } finally {
      setEnrichingFromDrawer(false);
    }
  };

  const isRealId = Boolean(prospectId) && !String(prospectId).startsWith("demo-");

  const { data: fetchedProspect } = useQuery({
    queryKey: ["prospects", prospectId],
    queryFn: () => prospectsApi.get(prospectId),
    enabled: isRealId,
  });

  const { data: enrichmentJobs } = useQuery({
    queryKey: ["enrichment", "jobs", prospectId],
    queryFn: () => enrichmentApi.listJobs(prospectId),
    enabled: isRealId,
    refetchInterval: (data: any) =>
      data?.some((j: any) => j.status === 'PENDING' || j.status === 'RUNNING') ? 5000 : false,
  });
  const isEnriching = (enrichmentJobs ?? []).some(j => j.status === 'PENDING' || j.status === 'RUNNING');

  const { data: enrichmentResult } = useQuery({
    queryKey: ["enrichment", "result", prospectId],
    queryFn: () => enrichmentApi.getResult(prospectId),
    enabled: isRealId,
    refetchInterval: isEnriching ? 5000 : false,
  });

  // For demo rows, build a basic prospect shape from rowData
  const prospect = fetchedProspect ?? (rowData && !isRealId ? {
    nombreEmpresa: rowData.co,
    rubro: rowData.rubro,
    ciudad: rowData.city,
    website: rowData.web !== "—" ? rowData.web : undefined,
    instagram: rowData.ig !== "—" ? rowData.ig : undefined,
    oportunidadDetectada: rowData.opp,
    servicioSugerido: rowData.svc !== "—" ? rowData.svc : undefined,
    score: rowData.score,
    estado: "NUEVO",
    problemasEncontrados: [],
    createdAt: new Date().toISOString(),
  } : null);

  const validation = validationById?.[prospectId];
  const df = validation?.decisionFactors;

  // Review form state
  const [humanScore, setHumanScore] = useState(() => validation ? String(validation.agentScore) : "");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("SIN_PRESUPUESTO");
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Update humanScore default when validation loads
  React.useEffect(() => {
    if (validation && !humanScore) setHumanScore(String(validation.agentScore));
  }, [validation?.id]);

  const doReview = async (status) => {
    if (!validation?.id) return;
    const score = parseInt(humanScore);
    if (isNaN(score) || score < 0 || score > 100) { setReviewError("Score debe ser entre 0 y 100"); return; }
    if (status === "REJECTED" && !rejectionReason) { setReviewError("Seleccioná un motivo de rechazo"); return; }
    setReviewError("");
    setReviewing(true);
    try {
      await validationsApi.review(validation.id, {
        humanScore: score,
        status,
        notes: notes || undefined,
        rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
      });
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      setReviewError(e.message);
    } finally {
      setReviewing(false);
    }
  };

  const TABS = [
    { id: "general",    label: "General" },
    { id: "assessment", label: "AI Assessment" },
    { id: "contacto",   label: "Contacto" },
    { id: "validacion", label: "Validación" },
    { id: "historial",  label: "Historial" },
  ];

  const scoreColor = (s) => s >= 70 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--danger)";
  const SLabel = ({ children }) => (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{children}</div>
  );
  const Field = ({ label, value }) => value ? (
    <div style={{ marginBottom: 12 }}>
      <SLabel>{label}</SLabel>
      <div style={{ fontSize: 13, color: "var(--ink-800)" }}>{value}</div>
    </div>
  ) : null;

  return (
    <div style={{
      position: "fixed", top: 56, right: 0, bottom: 0, width: 480,
      background: "#ffffff", borderLeft: "1px solid #e5e7eb",
      zIndex: 99, display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 24px rgba(0,0,0,0.15)", overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {prospect?.nombreEmpresa ?? "Cargando…"}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>
            {[prospect?.rubro, prospect?.ciudad].filter(Boolean).join(" · ")}
          </div>
        </div>
        {prospect && (
          isEnriching
            ? <Badge tone="warning" dot>Enriqueciendo…</Badge>
            : <Badge tone={ESTADO_TONE[prospect.estado] ?? "default"} dot>{ESTADO_LABEL[prospect.estado] ?? prospect.estado}</Badge>
        )}
        <button onClick={onClose} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--ink-400)", padding: 6, borderRadius: 6, display: "flex" }}>
          <Icon.x size={16}/>
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)", flexShrink: 0, padding: "0 6px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", fontSize: 12.5, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? "var(--primary-700)" : "var(--ink-500)",
            background: "none", border: "none", borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
            cursor: "pointer", transition: "all 120ms",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>

        {/* ═══════════════════════════════════════════════
            TAB: GENERAL
        ═══════════════════════════════════════════════ */}
        {tab === "general" && prospect && (
          <div>
            {/* Identity */}
            <div style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" }}>
              <span style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary-soft)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                {prospect.nombreEmpresa.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-900)" }}>{prospect.nombreEmpresa}</div>
                <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{prospect.rubro ?? "—"}</div>
                <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{[prospect.ciudad, prospect.pais].filter(Boolean).join(", ")}</div>
              </div>
            </div>

            {/* Digital presence */}
            <SLabel>Presencia digital</SLabel>
            <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              {prospect.website
                ? <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}><Icon.globe size={13} color="var(--ink-400)"/><span style={{ fontSize: 12.5, color: "var(--primary-700)" }}>{prospect.website}</span></div>
                : <div style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 8 }}>Sin sitio web</div>}
              {prospect.instagram
                ? <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}><Icon.link size={13} color="var(--ink-400)"/><span style={{ fontSize: 12.5, color: "var(--ink-700)" }}>{prospect.instagram}</span></div>
                : null}
              {prospect.linkedin
                ? <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon.link size={13} color="var(--ink-400)"/><span style={{ fontSize: 12.5, color: "var(--ink-700)" }}>{prospect.linkedin}</span></div>
                : null}
            </div>

            {/* Contact */}
            {(prospect.nombreContacto || prospect.email || prospect.telefono) && (
              <>
                <SLabel>Contacto</SLabel>
                <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  {prospect.nombreContacto && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 4 }}>{prospect.nombreContacto}</div>}
                  {prospect.email && <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>{prospect.email}</div>}
                  {prospect.telefono && <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>{prospect.telefono}</div>}
                </div>
              </>
            )}

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: "10px 12px" }}>
                <SLabel>Score inicial</SLabel>
                <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(prospect.score) }}>{prospect.score}</div>
              </div>
              <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: "10px 12px" }}>
                <SLabel>Nivel oportunidad</SLabel>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-800)" }}>{prospect.nivelOportunidad ?? "—"}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: AI ASSESSMENT
        ═══════════════════════════════════════════════ */}
        {tab === "assessment" && (
          <div>
            {/* ── Research Agent ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 12px", background: "var(--bg-2)", borderRadius: 8 }}>
              <Icon.search size={13} color="var(--ink-500)"/>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-600)" }}>Research Agent</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-400)" }}>{prospect?.detectadoPor ?? "IA"}</span>
            </div>

            {/* Score chip */}
            {prospect && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                  <SLabel>Score research</SLabel>
                  <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor(prospect.score) }}>{prospect.score}</div>
                </div>
                {prospect.nivelOportunidad && (
                  <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                    <SLabel>Nivel</SLabel>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-800)", marginTop: 6 }}>{prospect.nivelOportunidad}</div>
                  </div>
                )}
              </div>
            )}

            {/* Problems */}
            {prospect?.problemasEncontrados?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SLabel>Problemas detectados ({prospect.problemasEncontrados.length})</SLabel>
                {prospect.problemasEncontrados.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "var(--bg-2)", borderRadius: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--warning-soft, #fef9c3)", color: "var(--warning-ink, #854d0e)", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>!</span>
                    <span style={{ fontSize: 13, color: "var(--ink-800)", lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Opportunity detected */}
            {prospect?.oportunidadDetectada && (
              <div style={{ marginBottom: 16 }}>
                <SLabel>Oportunidad detectada</SLabel>
                <div style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>
                  {prospect.oportunidadDetectada}
                </div>
              </div>
            )}

            {/* Suggested service from research */}
            {prospect?.servicioSugerido && (
              <div style={{ marginBottom: 20 }}>
                <SLabel>Servicio sugerido (Research)</SLabel>
                <Badge tone="brand">{prospect.servicioSugerido}</Badge>
              </div>
            )}

            {/* ── Opportunity Agent section ── */}
            {validation ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 12px", background: "var(--bg-2)", borderRadius: 8 }}>
                  <Icon.robot size={13} color="var(--primary-700)"/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary-700)" }}>Evaluador de oportunidad</span>
                  <span style={{ fontSize: 10, color: "var(--ink-400)", fontFamily: "monospace" }}>{validation.validationVersion ?? "v1"}</span>
                  <Badge tone={VAL_TONE[validation.status]} dot style={{ marginLeft: "auto" }}>{VAL_LABEL[validation.status]}</Badge>
                </div>

                {/* Score IA */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                    <SLabel>Score IA</SLabel>
                    <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor(validation.agentScore) }}>{validation.agentScore}</div>
                  </div>
                  {validation.humanScore !== null && (
                    <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                      <SLabel>Score humano</SLabel>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--ink-900)" }}>{validation.humanScore}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>
                        drift {validation.agentScore - validation.humanScore > 0 ? "+" : ""}{validation.agentScore - validation.humanScore}
                      </div>
                    </div>
                  )}
                </div>

                {/* Score breakdown */}
                {df && (
                  <div style={{ marginBottom: 16 }}>
                    <SLabel>Score breakdown</SLabel>
                    {[
                      { k: "problemScore",  l: "Problemas detectados" },
                      { k: "priorityScore", l: "Severidad de problemas" },
                      { k: "fitScore",      l: "Service fit" },
                      { k: "ticketScore",   l: "Tamaño de ticket" },
                    ].map(({ k, l }) => (
                      <div key={k} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "var(--ink-600)" }}>{l}</span>
                          <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{df[k] ?? 0}/25</span>
                        </div>
                        <div style={{ height: 5, background: "var(--border-soft)", borderRadius: 3 }}>
                          <div style={{ width: `${((df[k] ?? 0) / 25) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 3, transition: "width 400ms ease" }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Services & ticket */}
                {validation.servicesRecommended?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <SLabel>Servicios recomendados</SLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {validation.servicesRecommended.map((s, i) => <Badge key={i} tone="brand">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {validation.estimatedTicketUsd && (
                  <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <SLabel>Ticket estimado</SLabel>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)" }}>USD {Number(validation.estimatedTicketUsd).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-400)", textAlign: "right" }}>{validation.prioridad}</div>
                  </div>
                )}

                {/* Reasoning */}
                {validation.reasoning && (
                  <div>
                    <SLabel>Justificación del agente</SLabel>
                    <div style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.7, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>
                      {validation.reasoning}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginTop: 8, padding: "20px 16px", background: "var(--bg-2)", borderRadius: 10, textAlign: "center" }}>
                <Icon.robot size={28} style={{ opacity: 0.25, marginBottom: 10 }}/>
                <div style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600 }}>Opportunity Agent no procesó este prospecto</div>
                <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 4 }}>Pasá el prospecto a estado INVESTIGADO y corré el agente</div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: VALIDACIÓN
        ═══════════════════════════════════════════════ */}
        {tab === "validacion" && (
          <div>
            {!validation ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Icon.robot size={36} style={{ opacity: 0.2, marginBottom: 12 }}/>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-500)" }}>Sin análisis del Opportunity Agent</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 6, lineHeight: 1.6 }}>
                  El Opportunity Agent debe analizar este prospecto antes de poder validarlo.<br/>
                  El prospecto debe estar en estado INVESTIGADO.
                </div>
              </div>
            ) : validation.status !== "PENDING" ? (
              /* ── Already reviewed ── */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: validation.status === "VALIDATED" ? "var(--success-soft, #ecfdf5)" : "var(--danger-soft, #fff5f5)", borderRadius: 12, marginBottom: 20, border: `1px solid ${validation.status === "VALIDATED" ? "var(--success)" : "var(--danger)"}` }}>
                  <span style={{ fontSize: 20 }}>{validation.status === "VALIDATED" ? "✓" : "✗"}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: validation.status === "VALIDATED" ? "var(--success)" : "var(--danger)", fontSize: 14 }}>
                      {validation.status === "VALIDATED" ? "Análisis aprobado" : "Análisis rechazado"}
                    </div>
                    {validation.validatedAt && (
                      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>
                        {new Date(validation.validatedAt).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <SLabel>Score IA</SLabel>
                    <div style={{ fontSize: 26, fontWeight: 700, color: scoreColor(validation.agentScore) }}>{validation.agentScore}</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <SLabel>Tu score</SLabel>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink-900)" }}>
                      {validation.humanScore ?? "—"}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <SLabel>Drift</SLabel>
                    {validation.humanScore != null ? (
                      <div style={{ fontSize: 26, fontWeight: 700, color: Math.abs(validation.agentScore - validation.humanScore) <= 10 ? "var(--success)" : "var(--warning)" }}>
                        {validation.agentScore - validation.humanScore > 0 ? "+" : ""}{validation.agentScore - validation.humanScore}
                      </div>
                    ) : (
                      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink-400)" }}>—</div>
                    )}
                  </div>
                </div>

                {validation.feedback?.rejectionReason && (
                  <div style={{ marginBottom: 14 }}>
                    <SLabel>Motivo de rechazo</SLabel>
                    <div style={{ fontSize: 13, color: "var(--ink-800)", padding: "10px 12px", background: "var(--bg-2)", borderRadius: 8 }}>
                      {validation.feedback.rejectionReason.replace(/_/g, " ")}
                    </div>
                  </div>
                )}

                {validation.notes && (
                  <div style={{ marginBottom: 20 }}>
                    <SLabel>Notas</SLabel>
                    <div style={{ fontSize: 13, color: "var(--ink-700)", padding: "10px 12px", background: "var(--bg-2)", borderRadius: 8 }}>
                      {validation.notes}
                    </div>
                  </div>
                )}

                {validation.status === "VALIDATED" && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 1, background: "var(--border-soft)", marginBottom: 20 }}/>
                    <SLabel>Siguiente paso</SLabel>
                    {rowData?.estado === "LISTO_OUTREACH" ? (
                      <>
                        <button style={{
                          width: "100%", padding: "14px 0", borderRadius: 10, border: "1px dashed var(--border-soft)",
                          background: "var(--bg-2)", color: "var(--ink-400)", fontSize: 13.5, fontWeight: 600,
                          cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }} disabled>
                          <Icon.doc size={15}/>
                          Generar propuesta
                          <span style={{ fontSize: 10.5, background: "var(--border-soft)", borderRadius: 4, padding: "2px 6px" }}>Próximamente</span>
                        </button>
                        <div style={{ fontSize: 11.5, color: "var(--ink-400)", textAlign: "center", marginTop: 8 }}>
                          El Proposal Agent generará una propuesta para revisión
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleEnrichFromDrawer}
                          disabled={enrichingFromDrawer || isEnriching || rowData?.estado === "ENRIQUECIDO"}
                          style={{
                            width: "100%", padding: "14px 0", borderRadius: 10,
                            border: "1px solid #5B5BF7",
                            background: (isEnriching || rowData?.estado === "ENRIQUECIDO") ? "var(--bg-2)" : "#5B5BF7",
                            color: (isEnriching || rowData?.estado === "ENRIQUECIDO") ? "#5B5BF7" : "#fff",
                            fontSize: 13.5, fontWeight: 600,
                            cursor: (enrichingFromDrawer || isEnriching || rowData?.estado === "ENRIQUECIDO") ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            opacity: (isEnriching || rowData?.estado === "ENRIQUECIDO") ? 0.7 : 1,
                          }}>
                          <Icon.sparkles size={15}/>
                          {enrichingFromDrawer
                            ? "Iniciando…"
                            : (isEnriching || rowData?.estado === "ENRIQUECIDO")
                            ? "⏳ Enriquecimiento en curso"
                            : "Iniciar enriquecimiento"}
                        </button>
                        <div style={{ fontSize: 11.5, color: "var(--ink-400)", textAlign: "center", marginTop: 8 }}>
                          El Agente de Enriquecimiento buscará contactos y datos de la empresa
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ── Pending review form ── */
              <div>
                {/* Summary of what you're approving */}
                <div style={{ background: "var(--bg-2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <SLabel>Análisis del Opportunity Agent</SLabel>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(validation.agentScore) }}>{validation.agentScore}</div>
                    <div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-700)", fontWeight: 600 }}>{validation.prioridad}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>
                        {validation.servicesRecommended?.join(", ") ?? "—"}
                      </div>
                    </div>
                    {validation.estimatedTicketUsd && (
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "var(--ink-400)" }}>Ticket</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>USD {Number(validation.estimatedTicketUsd).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  {validation.reasoning && (
                    <div style={{ fontSize: 12.5, color: "var(--ink-600)", lineHeight: 1.6, borderTop: "1px solid var(--border-soft)", paddingTop: 10, marginTop: 4 }}>
                      {validation.reasoning}
                    </div>
                  )}
                </div>

                {/* Your score */}
                <div style={{ marginBottom: 16 }}>
                  <SLabel>Tu puntuación (0–100)</SLabel>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="number" min="0" max="100" value={humanScore} onChange={e => setHumanScore(e.target.value)}
                      style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", background: "var(--bg-2)", color: "var(--ink-900)", fontSize: 18, fontWeight: 700, textAlign: "center", boxSizing: "border-box" }}/>
                    <span style={{ fontSize: 12, color: "var(--ink-400)" }}>pre-cargado con score IA</span>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 16 }}>
                  <SLabel>Notas (opcional)</SLabel>
                  <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="¿Qué ves que el agente no vio?"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", background: "var(--bg-2)", color: "var(--ink-900)", fontSize: 13, resize: "none", boxSizing: "border-box" }}/>
                </div>

                {reviewError && (
                  <div style={{ marginBottom: 12, padding: "8px 12px", background: "var(--danger-soft, #fff5f5)", border: "1px solid var(--danger)", borderRadius: 8, fontSize: 12.5, color: "var(--danger)" }}>
                    {reviewError}
                  </div>
                )}

                {/* Approve / Reject */}
                {!isRejecting ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => doReview("VALIDATED")} disabled={reviewing}
                      style={{ flex: 2, padding: "14px 0", borderRadius: 10, border: "none", background: "var(--success)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: reviewing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Icon.check size={16}/> {reviewing ? "Guardando…" : "Aprobar análisis"}
                    </button>
                    <button onClick={() => setIsRejecting(true)}
                      style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <div style={{ background: "var(--danger-soft, #fff5f5)", borderRadius: 12, padding: "16px", border: "1px solid var(--danger)" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>Motivo de rechazo</div>
                    <select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--danger)", background: "var(--bg-1)", color: "var(--ink-900)", fontSize: 13, marginBottom: 12 }}>
                      <option value="SIN_PRESUPUESTO">Sin presupuesto</option>
                      <option value="SIN_DECISION_MAKER">Sin decisor</option>
                      <option value="EMPRESA_PEQUENA">Empresa muy pequeña</option>
                      <option value="MERCADO_INCORRECTO">Mercado incorrecto</option>
                      <option value="COMPETENCIA_FUERTE">Competencia muy fuerte</option>
                      <option value="YA_TIENE_PROVEEDOR">Ya tiene proveedor</option>
                      <option value="OTRO">Otro motivo</option>
                    </select>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setIsRejecting(false); setReviewError(""); }}
                        style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid var(--border-soft)", background: "transparent", color: "var(--ink-600)", cursor: "pointer", fontSize: 13 }}>
                        Cancelar
                      </button>
                      <button onClick={() => doReview("REJECTED")} disabled={reviewing}
                        style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: reviewing ? "not-allowed" : "pointer" }}>
                        {reviewing ? "Guardando…" : "Confirmar rechazo"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: CONTACTO (Enrichment Agent output)
        ═══════════════════════════════════════════════ */}
        {tab === "contacto" && prospect && (
          <div>
            {/* Commercial Score breakdown */}
            {(prospect.commercialScore != null || enrichmentResult) && (
              <div style={{ marginBottom: 20, padding: "14px 16px", background: "var(--bg-2)", borderRadius: 12 }}>
                <SLabel>Commercial Score</SLabel>
                {(() => {
                  const opp = prospect.score ?? 0;
                  const cont = enrichmentResult?.contactabilityScore ?? 0;
                  const cs = prospect.commercialScore ?? Math.floor((opp + cont) / 2);
                  const csColor = cs >= 70 ? "#10B981" : cs >= 45 ? "#F59E0B" : "#9CA3AF";
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: csColor, lineHeight: 1 }}>{cs}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 8, background: "var(--bg-3)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${cs}%`, height: "100%", background: csColor, borderRadius: 4, transition: "width 600ms ease" }}/>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-800)" }}>{opp}</div>
                          <div style={{ fontSize: 10, color: "var(--ink-400)", textTransform: "uppercase", fontWeight: 600 }}>Oportunidad</div>
                        </div>
                        <div style={{ color: "var(--ink-300)", alignSelf: "center", fontSize: 16 }}>+</div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-800)" }}>{cont}</div>
                          <div style={{ fontSize: 10, color: "var(--ink-400)", textTransform: "uppercase", fontWeight: 600 }}>Contactabilidad</div>
                        </div>
                        <div style={{ color: "var(--ink-300)", alignSelf: "center", fontSize: 16 }}>=</div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: csColor }}>{cs}</div>
                          <div style={{ fontSize: 10, color: csColor, textTransform: "uppercase", fontWeight: 600 }}>Commercial</div>
                        </div>
                        {enrichmentResult?.confianza && (
                          <div style={{ marginLeft: "auto", alignSelf: "center" }}>
                            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, fontWeight: 700,
                              background: enrichmentResult.confianza === "ALTA" ? "#d1fae5" : enrichmentResult.confianza === "MEDIA" ? "#fef3c7" : "#f3f4f6",
                              color: enrichmentResult.confianza === "ALTA" ? "#065f46" : enrichmentResult.confianza === "MEDIA" ? "#92400E" : "#6b7280",
                            }}>
                              {enrichmentResult.confianza}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* No enrichment yet */}
            {!enrichmentResult && (
              <div style={{ textAlign: "center", padding: "32px 20px", background: "var(--bg-2)", borderRadius: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-700)", marginBottom: 6 }}>Sin datos de contacto</div>
                <div style={{ fontSize: 13, color: "var(--ink-400)", lineHeight: 1.6 }}>
                  El Enrichment Agent aún no buscó datos de contacto para esta empresa.
                  {(prospect.score >= 75) && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                      Score {prospect.score} ≥ 75 — elegible para enriquecimiento
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact data */}
            {enrichmentResult && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <SLabel>Datos de contacto</SLabel>
                  {[
                    { icon: "✉", label: "Email",     value: enrichmentResult.email,         link: enrichmentResult.email ? `mailto:${enrichmentResult.email}` : undefined },
                    { icon: "📞", label: "Teléfono",  value: enrichmentResult.telefono,      link: enrichmentResult.telefono ? `tel:${enrichmentResult.telefono}` : undefined },
                    { icon: "💬", label: "WhatsApp",  value: enrichmentResult.whatsapp,      link: enrichmentResult.whatsapp ? `https://wa.me/${enrichmentResult.whatsapp.replace(/\D/g,"")}` : undefined },
                    { icon: "🌐", label: "Formulario",value: enrichmentResult.formularioWeb, link: enrichmentResult.formularioWeb },
                  ].map(({ icon, label, value, link }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
                      <span style={{ width: 26, textAlign: "center", fontSize: 14 }}>{icon}</span>
                      <span style={{ width: 80, fontSize: 12, color: "var(--ink-400)", flexShrink: 0 }}>{label}</span>
                      {value && link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, wordBreak: "break-all" }}>{value}</a>
                      ) : value ? (
                        <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 600 }}>{value}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--ink-300)", fontStyle: "italic" }}>no encontrado</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Digital presence */}
                {(enrichmentResult.googleBusiness || enrichmentResult.linkedin || enrichmentResult.facebook || enrichmentResult.instagram) && (
                  <div style={{ marginBottom: 18 }}>
                    <SLabel>Presencia digital</SLabel>
                    {[
                      { icon: "📍", label: "G. Business", value: enrichmentResult.googleBusiness },
                      { icon: "💼", label: "LinkedIn",    value: enrichmentResult.linkedin },
                      { icon: "👥", label: "Facebook",    value: enrichmentResult.facebook },
                      { icon: "📸", label: "Instagram",   value: enrichmentResult.instagram },
                    ].filter(x => x.value).map(({ icon, label, value }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border-soft)" }}>
                        <span style={{ width: 26, textAlign: "center", fontSize: 14 }}>{icon}</span>
                        <span style={{ width: 80, fontSize: 12, color: "var(--ink-400)", flexShrink: 0 }}>{label}</span>
                        <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{value}</a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Decision maker */}
                {enrichmentResult.nombreDecidsor && (
                  <div style={{ marginBottom: 18 }}>
                    <SLabel>Decisor</SLabel>
                    <div style={{ padding: "12px 14px", background: "var(--bg-2)", borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 999, background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                        {enrichmentResult.nombreDecidsor.split(" ").map(s => s[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{enrichmentResult.nombreDecidsor}</div>
                        {enrichmentResult.rolDecidsor && <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{enrichmentResult.rolDecidsor}</div>}
                        {enrichmentResult.linkedinDecidsor && (
                          <a href={enrichmentResult.linkedinDecidsor} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--primary)", marginTop: 4, display: "block" }}>Ver LinkedIn →</a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Review status + action */}
                <div style={{ marginTop: 8, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", marginBottom: 4 }}>Estado revisión</div>
                    <div style={{ fontSize: 13, fontWeight: 700,
                      color: enrichmentResult.reviewStatus === "APPROVED" ? "#10B981" : enrichmentResult.reviewStatus === "REJECTED" ? "#EF4444" : "#F59E0B",
                    }}>
                      {enrichmentResult.reviewStatus === "APPROVED" ? "✅ Aprobado → Outreach"
                       : enrichmentResult.reviewStatus === "REJECTED" ? "✗ Rechazado"
                       : "⏳ Pendiente revisión humana"}
                    </div>
                    {enrichmentResult.reviewNotes && <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 3 }}>{enrichmentResult.reviewNotes}</div>}
                  </div>
                  {enrichmentResult.reviewStatus === "PENDING" && onReviewEnrichment && (
                    <button
                      onClick={onReviewEnrichment}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #F59E0B", background: "transparent", color: "#92400E", cursor: "pointer", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}
                    >
                      Revisar datos
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: HISTORIAL
        ═══════════════════════════════════════════════ */}
        {tab === "historial" && prospect && (
          <div>
            <SLabel>Línea de tiempo</SLabel>
            <div style={{ position: "relative", paddingLeft: 24 }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "var(--border-soft)" }}/>

              {/* Event: Research Agent */}
              <div style={{ position: "relative", marginBottom: 24 }}>
                <div style={{ position: "absolute", left: -24, top: 0, width: 16, height: 16, borderRadius: 999, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon.search size={8} color="#fff"/>
                </div>
                <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-800)" }}>Research Agent</span>
                    <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{new Date(prospect.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-600)" }}>Encontró la empresa · Detectó {prospect.problemasEncontrados?.length ?? 0} problemas · Score inicial {prospect.score}</div>
                  {prospect.detectadoPor && <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 4 }}>via {prospect.detectadoPor}</div>}
                </div>
              </div>

              {/* Event: Opportunity Agent */}
              {validation && (
                <div style={{ position: "relative", marginBottom: 24 }}>
                  <div style={{ position: "absolute", left: -24, top: 0, width: 16, height: 16, borderRadius: 999, background: "var(--secondary, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.robot size={8} color="#fff"/>
                  </div>
                  <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-800)" }}>Opportunity Agent</span>
                      <span style={{ fontSize: 11, color: "var(--ink-400)" }}>Score IA: {validation.agentScore}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-600)" }}>
                      Calculó score {validation.agentScore} · Recomendó {validation.servicesRecommended?.length ?? 0} servicio(s)
                      {validation.estimatedTicketUsd && ` · Ticket USD ${Number(validation.estimatedTicketUsd).toLocaleString()}`}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Badge tone={VAL_TONE[validation.status]} dot>{VAL_LABEL[validation.status]}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Event: Human review */}
              {validation?.validatedAt && (
                <div style={{ position: "relative", marginBottom: 24 }}>
                  <div style={{ position: "absolute", left: -24, top: 0, width: 16, height: 16, borderRadius: 999, background: validation.status === "VALIDATED" ? "var(--success)" : "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.user size={8} color="#fff"/>
                  </div>
                  <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-800)" }}>Revisión humana</span>
                      <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{new Date(validation.validatedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-600)" }}>
                      {validation.status === "VALIDATED" ? "✓ Aprobó el análisis" : "✗ Rechazó el análisis"}
                      {validation.humanScore !== null && ` · Score asignado: ${validation.humanScore}`}
                      {validation.feedback?.rejectionReason && ` · Motivo: ${validation.feedback.rejectionReason.replace(/_/g, " ")}`}
                    </div>
                    {validation.notes && <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4, fontStyle: "italic" }}>"{validation.notes}"</div>}
                  </div>
                </div>
              )}

              {/* Future: Proposal Agent */}
              {validation?.status === "VALIDATED" && (
                <div style={{ position: "relative", opacity: 0.4 }}>
                  <div style={{ position: "absolute", left: -24, top: 0, width: 16, height: 16, borderRadius: 999, border: "2px dashed var(--border-soft)", background: "var(--bg-1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.doc size={8} color="var(--ink-300)"/>
                  </div>
                  <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: "12px 14px", border: "1px dashed var(--border-soft)" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-500)" }}>Proposal Agent</div>
                    <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 4 }}>Próxima etapa — genera propuesta preliminar para revisión</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Research Job Detail Drawer ────────────────────────────────────────────────

function ResearchJobDetailDrawer({ jobId, onClose }) {
  const [tab, setTab] = useState('discovered');

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['research-candidates', jobId],
    queryFn: () => researchApi.getCandidates(jobId),
    enabled: Boolean(jobId),
    staleTime: 60000,
  });

  const discovered = candidates ?? [];
  const promoted = discovered.filter(c => c.status === 'PROMOTED');
  const discarded = discovered.filter(c => c.status === 'DISCARDED');
  const pending = discovered.filter(c => c.status === 'DISCOVERED');

  const ScoreBar = ({ score }: { score?: number }) => {
    if (!score) return <span style={{ color: "var(--ink-400)", fontSize: 12 }}>—</span>;
    const color = score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: "var(--border-soft)", borderRadius: 2 }}>
          <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 2 }}/>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
      </div>
    );
  };

  const CandidateCard = ({ c }) => {
    const [open, setOpen] = useState(false);
    const statusColor = c.status === 'PROMOTED' ? "#059669" : c.status === 'DISCARDED' ? "#dc2626" : "#6b7280";
    const statusLabel = c.status === 'PROMOTED' ? "Promovido" : c.status === 'DISCARDED' ? "Descartado" : "Descubierto";

    return (
      <div style={{ border: "1px solid var(--border-soft)", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "var(--bg-1)" }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{c.nombreEmpresa}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: statusColor, background: `${statusColor}18`, padding: "2px 7px", borderRadius: 10 }}>{statusLabel}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
              {[c.rubro, c.ciudad, c.pais].filter(Boolean).join(" · ")}
            </div>
          </div>
          {c.score !== undefined && <ScoreBar score={c.score}/>}
          <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div style={{ padding: "12px 14px", background: "var(--bg-0)", borderTop: "1px solid var(--border-soft)" }}>
            {/* Digital presence */}
            {c.presenciaDigital && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {[
                  { k: "tieneWeb", label: "Web" }, { k: "tieneSeo", label: "SEO" },
                  { k: "tieneRedes", label: "Redes" }, { k: "tieneEcommerce", label: "Ecommerce" },
                  { k: "tieneAgendaOnline", label: "Agenda" },
                ].map(({ k, label }) => {
                  const has = c.presenciaDigital?.[k as keyof typeof c.presenciaDigital];
                  return (
                    <span key={k} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                      background: has ? "#d1fae5" : "#fee2e2", color: has ? "#065f46" : "#991b1b" }}>
                      {has ? "✓" : "✗"} {label}
                    </span>
                  );
                })}
              </div>
            )}
            {c.descripcion && <p style={{ fontSize: 12, color: "var(--ink-700)", margin: "0 0 8px", lineHeight: 1.5 }}>{c.descripcion}</p>}
            {/* Sonnet evaluation */}
            {c.reasoning && (
              <div style={{ background: "var(--bg-2)", borderRadius: 6, padding: "8px 10px", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-500)", marginBottom: 4 }}>EVALUACIÓN SONNET</div>
                <p style={{ fontSize: 12, color: "var(--ink-800)", margin: 0, lineHeight: 1.5 }}>{c.reasoning}</p>
              </div>
            )}
            {c.discardReason && (
              <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Motivo descarte: {c.discardReason}</div>
            )}
            {c.oportunidadDetectada && (
              <div style={{ fontSize: 12, color: "var(--ink-700)", marginTop: 6 }}>
                <strong>Oportunidad:</strong> {c.oportunidadDetectada}
              </div>
            )}
            {c.servicioSugerido && (
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 11, background: "var(--primary-soft)", color: "var(--primary)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{c.servicioSugerido}</span>
                {c.estimatedTicketUsd && <span style={{ fontSize: 11, color: "var(--ink-500)", marginLeft: 8 }}>~USD {c.estimatedTicketUsd}/mes</span>}
              </div>
            )}
            {c.problemasDetectados && c.problemasDetectados.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12, color: "var(--ink-600)" }}>
                {c.problemasDetectados.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
            {/* Score breakdown */}
            {c.scoreBreakdown && Object.keys(c.scoreBreakdown).length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.entries(c.scoreBreakdown).filter(([, v]) => v !== 0).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: Number(v) > 0 ? "#d1fae5" : "#fee2e2", color: Number(v) > 0 ? "#065f46" : "#991b1b", fontWeight: 600 }}>
                    {k}: {Number(v) > 0 ? "+" : ""}{v}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabItems: { id: typeof tab; label: string; count: number }[] = [
    { id: 'discovered', label: 'Descubiertos por Haiku', count: discovered.length },
    { id: 'evaluated', label: 'Evaluados por Sonnet', count: promoted.length + discarded.length },
    { id: 'promoted', label: 'Promovidos a CRM', count: promoted.length },
  ];

  const tabContent = tab === 'discovered' ? discovered
    : tab === 'evaluated' ? [...promoted, ...discarded]
    : promoted;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, top: 56, background: "rgba(0,0,0,0.35)", zIndex: 98 }}/>
      {/* Drawer */}
      <div style={{ position: "fixed", top: 56, right: 0, bottom: 0, width: 560, background: "#ffffff", zIndex: 99, display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.12)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Research Job Detail</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>Pipeline Haiku → Sonnet → CRM</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {/* Stats */}
        <div style={{ padding: "12px 20px", background: "var(--bg-2)", borderBottom: "1px solid var(--border-soft)", display: "flex", gap: 24 }}>
          {[
            { label: "Descubiertos", value: discovered.length, color: "#6b7280" },
            { label: "Descartados", value: discarded.length, color: "#dc2626" },
            { label: "Promovidos", value: promoted.length, color: "#059669" },
            { label: "Tasa", value: discovered.length ? `${Math.round(promoted.length / discovered.length * 100)}%` : "—", color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)", padding: "0 20px" }}>
          {tabItems.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "10px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? "var(--primary)" : "var(--ink-500)", borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent", whiteSpace: "nowrap" }}>
              {t.label} {t.count > 0 && <span style={{ marginLeft: 4, background: tab === t.id ? "var(--primary-soft)" : "var(--bg-2)", color: tab === t.id ? "var(--primary)" : "var(--ink-500)", borderRadius: 10, padding: "0 6px", fontSize: 10, fontWeight: 700 }}>{t.count}</span>}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {isLoading && <div style={{ textAlign: "center", padding: 40, color: "var(--ink-400)", fontSize: 13 }}>Cargando candidatos…</div>}
          {!isLoading && tabContent.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "var(--ink-400)", fontSize: 13 }}>
              {tab === 'promoted' ? "Ningún candidato promovido a CRM" : "Sin datos aún"}
            </div>
          )}
          {!isLoading && tabContent.map(c => <CandidateCard key={c.id} c={c}/>)}
        </div>
      </div>
    </>
  );
}

// ── Prospects ─────────────────────────────────────────────────────────────────

function Prospects({ onNav }) {
  const [query, setQuery] = useStateProsp("inmobiliarias en Buenos Aires con web desactualizada y sin SEO local");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('score');
  const [aiFilter, setAiFilter] = useState("ACTIVOS");
  const [jobDetailId, setJobDetailId] = useState(null);
  const hasToken = Boolean(getStoredToken());

  // ── Research job state ──
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const qc = useQueryClient();

  // Poll active job every 3s while PENDING/RUNNING
  React.useEffect(() => {
    if (!activeJobId || !hasToken) return;
    const running = activeJob?.status === 'PENDING' || activeJob?.status === 'RUNNING';
    if (!running && activeJob) return;
    const interval = setInterval(async () => {
      try {
        const job = await researchApi.getJob(activeJobId);
        setActiveJob(job);
        if (job.status === 'COMPLETED') {
          setPage(1);
          setSortBy('createdAt');
          qc.invalidateQueries({ queryKey: ['prospects'] });
          qc.invalidateQueries({ queryKey: ['prospects', 'kpis'] });
        }
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch { clearInterval(interval); }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeJobId, activeJob?.status, hasToken]);

  const handleDescubrir = async () => {
    if (!query.trim() || !hasToken) return;
    try {
      const job = await researchApi.createJob(query.trim());
      setActiveJobId(job.id);
      setActiveJob(job);
    } catch (e) {
      alert('Error al iniciar investigación: ' + e.message);
    }
  };

  const SUGGESTED = [
    "clínicas dentales con redes activas pero sin agenda online",
    "bodegas en Mendoza sin tienda online y con IG fuerte",
    "estudios jurídicos en La Plata sin presencia digital",
  ];

  // ── Real API data ─────────────────────────────────────────────────────────
  const { data: kpisData } = useQuery({
    queryKey: ["prospects", "kpis"],
    queryFn: prospectsApi.kpis,
    enabled: hasToken,
    staleTime: 60000,
  });

  const { data: prospectsData, isLoading, isError: listError, error: listErrorObj } = useQuery({
    queryKey: ["prospects", { page, limit: 20, sortBy }],
    queryFn: () => prospectsApi.list({ page, limit: 20, sortBy }),
    enabled: hasToken,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // Validation data is embedded in each prospect — no separate query needed.
  // validationById built from prospectsData to eliminate the race condition where
  // the table rendered with empty validations while the second query was in-flight.
  const validationById = React.useMemo(() => {
    const m: Record<string, any> = {};
    const items = Array.isArray(prospectsData) ? prospectsData : prospectsData?.data;
    if (items) {
      for (const p of items) {
        if (p.validation) m[p.id] = p.validation;
      }
    }
    return m;
  }, [prospectsData]);

  // ── Enrichment queue ─────────────────────────────────────────────────────────
  const { data: enrichQueue } = useQuery({
    queryKey: ["enrichment", "queue"],
    queryFn: enrichmentApi.getQueue,
    enabled: hasToken,
    staleTime: 15000,
    refetchInterval: 10000,
  });

  const { data: outreachQueue } = useQuery({
    queryKey: ["enrichment", "outreach-queue"],
    queryFn: enrichmentApi.getOutreachQueue,
    enabled: hasToken,
    staleTime: 30000,
  });

  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [reviewingProspectId, setReviewingProspectId] = useState<string | null>(null);
  const [qualifyingId, setQualifyingId] = useState<string | null>(null);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [batchQualifying, setBatchQualifying] = useState(false);

  const handleEnrich = async (prospectId: string) => {
    if (!hasToken || enrichingId) return;
    setEnrichingId(prospectId);
    try {
      await enrichmentApi.createJob(prospectId);
      qc.invalidateQueries({ queryKey: ["enrichment"] });
    } catch (e) {
      alert("Error al enriquecer: " + e.message);
    } finally {
      setEnrichingId(null);
    }
  };

  const handleRunAgent = async (prospectId: string) => {
    if (!hasToken || qualifyingId) return;
    setQualifyingId(prospectId);
    try {
      await validationsApi.runAgent(prospectId);
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      alert("Error al calificar: " + e.message);
    } finally {
      setQualifyingId(null);
    }
  };

  const handleRecalculate = async (prospectId: string) => {
    if (!hasToken || recalculatingId) return;
    setRecalculatingId(prospectId);
    try {
      await validationsApi.recalculate(prospectId);
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      alert("Error al recalcular: " + e.message);
    } finally {
      setRecalculatingId(null);
    }
  };

  const handleRunAllPending = async () => {
    if (!hasToken || batchQualifying) return;
    const pending = allRows.filter(r => r.isReal && r.aiState === "PENDIENTE_OPPORTUNITY" && r.estado === "INVESTIGADO");
    if (pending.length === 0) return;
    setBatchQualifying(true);
    let ok = 0;
    for (const row of pending) {
      try {
        await validationsApi.runAgent(row.id);
        ok++;
      } catch { /* skip already-validated or state mismatch */ }
    }
    qc.invalidateQueries({ queryKey: ["validations"] });
    qc.invalidateQueries({ queryKey: ["prospects"] });
    setBatchQualifying(false);
    if (ok > 0) alert(`Opportunity Agent calificó ${ok} prospectos.`);
  };

  // ── KPIs (real with mock fallback) ────────────────────────────────────────
  const total = kpisData?.total ?? (hasToken ? 0 : 248);
  const sinWeb = kpisData?.sinWeb ?? (hasToken ? 0 : 86);
  const scoreAlto = kpisData?.oportunidadAlta ?? (hasToken ? 0 : 64);
  const listosOutreach = kpisData?.listosOutreach ?? (hasToken ? 0 : 38);
  const nuevosEstaSemana = kpisData?.nuevosEstaSemana ?? 12;

  const NOW = Date.now();
  const H24 = 24 * 60 * 60 * 1000;

  // ── Table data ────────────────────────────────────────────────────────────────
  const allRows = React.useMemo(() => {
    if (!hasToken) {
      return PROSPECTS_DATA.map((p, i) => ({ ...p, id: `demo-${i}`, isReal: false, isNew: false, aiState: aiStateFromScore(p.score) }));
    }
    const items = Array.isArray(prospectsData) ? prospectsData : prospectsData?.data;
    if (!items?.length) return [];
    return items.map(p => ({
      id: p.id,
      co: p.nombreEmpresa,
      rubro: p.rubro ?? "—",
      city: [p.ciudad, p.pais].filter(Boolean).join(", ") || "—",
      web: p.website || "—",
      ig: p.instagram || "—",
      opp: p.oportunidadDetectada ?? p.problemasEncontrados?.slice(0, 2).join(" · ") ?? "—",
      svc: p.servicioSugerido ?? validationById[p.id]?.servicesRecommended?.[0] ?? "—",
      score: p.score,
      opportunityScore: validationById[p.id]?.agentScore ?? null,
      commercialScore: p.commercialScore ?? null,
      aiState: aiStateFromScore(validationById[p.id]?.agentScore),
      state: ESTADO_LABEL[p.estado] ?? p.estado,
      estado: p.estado,
      last: fmtDate(p.ultimoContacto),
      next: p.proximoSeguimiento ? new Date(p.proximoSeguimiento).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "—",
      who: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : "Sin asignar",
      validation: validationById[p.id] ?? null,
      isReal: true,
      isNew: NOW - new Date(p.createdAt).getTime() < H24,
    }));
  }, [prospectsData, validationById, hasToken]);

  const aiCounts = React.useMemo(() => {
    const c = { PENDIENTE_OPPORTUNITY: 0, PRIORIDAD_MAXIMA: 0, APROBADO_IA: 0, REVISAR: 0, DESCARTADO_IA: 0 };
    for (const r of allRows) c[r.aiState] = (c[r.aiState] ?? 0) + 1;
    return c;
  }, [allRows]);

  const tableRows = React.useMemo(() => {
    if (aiFilter === "TODOS") return allRows;
    if (aiFilter === "ACTIVOS") return allRows.filter(r => r.aiState !== "DESCARTADO_IA");
    return allRows.filter(r => r.aiState === aiFilter);
  }, [allRows, aiFilter]);

  // meta comes nested ({ data, meta }) or flat on json root via json.meta (old interceptor)
  const meta = Array.isArray(prospectsData) ? null : prospectsData?.meta;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Prospectos</h1>
          <p>Lead Discovery · los buscamos nosotros (outbound) · {total} prospectos · {nuevosEstaSemana} nuevos esta semana</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.download size={14}/> Exportar CSV</button>
          <button className="btn"><Icon.users size={14}/> Asignar lote</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo prospecto</button>
        </div>
      </div>

      <ComercialTabs active="prospects" onNav={onNav}/>

      {/* Research engine hero */}
      <div className="ai-box" style={{ marginBottom: 16, padding: "16px 18px" }}>
        <div className="ai-head">
          <span className="ai-ic"><Icon.search size={13}/></span>
          <span className="ai-title">Research Engine</span>
          <Badge tone="brand">Búsqueda inteligente</Badge>
          <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-500)" }}>IA · Google Maps · LinkedIn · 42 fuentes</span>
        </div>
        <div className="row gap-sm" style={{ marginBottom: 10 }}>
          <button className="seg-btn active">🔍 Buscar con IA</button>
          <button className="seg-btn">✋ Manual</button>
          <button className="seg-btn">📥 Importar CSV</button>
          <button className="seg-btn">🔗 Conectar fuente</button>
        </div>
        <div className="ai-input" style={{ background: "var(--bg-2)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
          <Icon.sparkles size={16}/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describí qué empresas buscás…"
            onKeyDown={(e) => e.key === 'Enter' && handleDescubrir()}
            disabled={activeJob?.status === 'PENDING' || activeJob?.status === 'RUNNING'}
          />
          <button
            className="btn btn-brand btn-sm"
            onClick={handleDescubrir}
            disabled={!hasToken || !query.trim() || activeJob?.status === 'PENDING' || activeJob?.status === 'RUNNING'}
          >
            <Icon.bolt size={13}/>
            {activeJob?.status === 'RUNNING' ? ' Investigando…' : activeJob?.status === 'PENDING' ? ' Iniciando…' : ' Descubrir'}
          </button>
        </div>

        {/* Job status banner */}
        {activeJob && (
          <div style={{
            marginTop: 10, padding: "10px 14px", borderRadius: 8,
            background: activeJob.status === 'COMPLETED' ? "var(--success-soft, #ecfdf5)"
              : activeJob.status === 'FAILED' ? "var(--danger-soft, #fff5f5)"
              : "var(--primary-soft)",
            border: `1px solid ${activeJob.status === 'COMPLETED' ? "var(--success)" : activeJob.status === 'FAILED' ? "var(--danger)" : "var(--primary)"}`,
            display: "flex", alignItems: "center", gap: 10, fontSize: 13,
          }}>
            {(activeJob.status === 'PENDING' || activeJob.status === 'RUNNING') && (
              <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}/>
            )}
            {activeJob.status === 'COMPLETED' && <span>✓</span>}
            {activeJob.status === 'FAILED' && <span>✗</span>}
            <span style={{ flex: 1, color: activeJob.status === 'FAILED' ? "var(--danger)" : "var(--ink-800)" }}>
              {activeJob.status === 'PENDING' && 'Iniciando Research Agent…'}
              {activeJob.status === 'RUNNING' && `Research Agent investigando: "${activeJob.query}"`}
              {activeJob.status === 'COMPLETED' && `Investigación completa — ${activeJob.candidatesFound ?? activeJob.limit} empresas analizadas, ${activeJob.prospectsFound} promovidos a prospecto`}
              {activeJob.status === 'FAILED' && `Error: ${activeJob.errorMessage ?? 'Investigación fallida'}`}
            </span>
            {activeJob.status === 'COMPLETED' && (
              <button
                onClick={() => setJobDetailId(activeJob.id)}
                style={{ background: "none", border: "1px solid var(--success)", borderRadius: 6, cursor: "pointer", color: "var(--success-ink, #166534)", fontSize: 12, padding: "3px 10px", fontWeight: 600 }}
              >Ver detalle</button>
            )}
          {(activeJob.status === 'COMPLETED' || activeJob.status === 'FAILED') && (
              <button onClick={() => { setActiveJob(null); setActiveJobId(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>
        )}

        <div className="ai-foot">
          Probá:
          {SUGGESTED.map((s, i) => (
            <button key={i} className="ai-suggest" onClick={() => setQuery(s)}>
              <Icon.sparkles size={11}/> {s}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div className="row" style={{ gap: 0, justifyContent: "space-between", flexWrap: "wrap" }}>
          {[
            { ic: "search", t: "Descubre", s: "Busca empresas por rubro y zona" },
            { ic: "layers", t: "Enriquece", s: "Web, IG, contacto, tamaño" },
            { ic: "trend", t: "Detecta oportunidad", s: "Qué les falta digitalmente" },
            { ic: "trend", t: "Califica (score)", s: "Prioridad comercial 0–100" },
            { ic: "users", t: "Asigna", s: "Reparte al equipo comercial" },
            { ic: "rocket", t: "Prepara outreach", s: "Listo para contactar" },
          ].map((st, i, arr) => {
            const IconC = Icon[st.ic] ?? Icon.trend;
            return (
              <React.Fragment key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 150 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary-soft)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconC size={15}/>
                  </span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-900)" }}>{st.t}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-500)" }}>{st.s}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <Icon.chevronRight size={14} color="var(--ink-300)" style={{ flexShrink: 0 }}/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* KPIs — real data */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <MiniStatP label="Resultados" value={String(total)} sub={`+${nuevosEstaSemana} esta semana`} c="var(--primary)"/>
        <MiniStatP label="Prioridad máxima" value={String(aiCounts.PRIORIDAD_MAXIMA)} sub="Opp. Agent ≥ 90 · asignar ya" c="#10B981"/>
        <MiniStatP label="Aprobados IA" value={String(aiCounts.APROBADO_IA)} sub="Opp. Agent 75–89 · ready outreach" c="#5B5BF7"/>
        <MiniStatP label="Pendiente Opp." value={String(aiCounts.PENDIENTE_OPPORTUNITY)} sub="Opportunity Agent no procesó" c="#9CA3AF"/>
      </div>

      {/* Enrichment Queue Panel */}
      {hasToken && enrichQueue && (enrichQueue.pending > 0 || enrichQueue.running > 0 || enrichQueue.completed > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "9px 14px", background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--border-soft)", fontSize: 12 }}>
          <Icon.sparkles size={13} color="var(--primary)"/>
          <span style={{ fontWeight: 600, color: "var(--ink-800)" }}>Cola de enriquecimiento</span>
          {enrichQueue.running > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#5B5BF7" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #5B5BF7", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}/>
              {enrichQueue.running} enriqueciendo
            </span>
          )}
          {enrichQueue.pending > 0 && <span style={{ color: "var(--ink-500)" }}>{enrichQueue.pending} en cola</span>}
          {enrichQueue.completed > 0 && <span style={{ color: "#10B981" }}>{enrichQueue.completed} completados</span>}
          {(enrichQueue.pendingReview ?? 0) > 0 && (
            <span style={{ color: "#92400E", fontWeight: 700, background: "#fef3c7", padding: "2px 8px", borderRadius: 10 }}>
              {enrichQueue.pendingReview} por revisar
            </span>
          )}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontWeight: 700, color: (enrichQueue.approved ?? enrichQueue.contactable) > 0 ? "#10B981" : "var(--ink-400)" }}>
            <Icon.check size={12}/> {enrichQueue.approved ?? enrichQueue.contactable} aprobados
          </span>
        </div>
      )}

      {/* Outreach Queue Panel — ranked by Commercial Score */}
      {hasToken && outreachQueue && outreachQueue.total > 0 && (
        <div style={{ marginBottom: 14, background: "var(--bg-1)", borderRadius: 12, border: "1px solid #10B98130", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "#d1fae510", borderBottom: "1px solid #10B98120", fontSize: 12 }}>
            <span style={{ fontSize: 14 }}>🚀</span>
            <span style={{ fontWeight: 700, color: "#065f46" }}>Cola Outreach · {outreachQueue.total} listos</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-400)" }}>ordenado por Commercial Score</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {outreachQueue.prospects.slice(0, 5).map((p, i) => {
              const cs = p.commercialScore ?? 0;
              const csColor = cs >= 70 ? "#10B981" : cs >= 45 ? "#F59E0B" : "#9CA3AF";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 14px", borderBottom: i < 4 ? "1px solid var(--border-soft)" : "none", fontSize: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--ink-500)", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombreEmpresa}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-400)", whiteSpace: "nowrap" }}>{p.rubro ?? "—"}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    {p.enrichmentResult ? (
                      <>
                        <span style={{ fontSize: 10, color: "var(--ink-400)" }}>Opp</span>
                        <span style={{ fontWeight: 700, color: "var(--ink-700)", fontSize: 12 }}>{p.score}</span>
                        <span style={{ fontSize: 10, color: "var(--ink-300)" }}>+</span>
                        <span style={{ fontSize: 10, color: "var(--ink-400)" }}>Cont</span>
                        <span style={{ fontWeight: 700, color: "var(--ink-700)", fontSize: 12 }}>{p.enrichmentResult.contactabilityScore}</span>
                        <span style={{ fontSize: 10, color: "var(--ink-300)" }}>=</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 10, color: "var(--ink-400)", fontStyle: "italic" }}>sin enriquecer ·</span>
                    )}
                    <span style={{ fontWeight: 800, color: csColor, fontSize: 14, minWidth: 28, textAlign: "right" }}>{cs || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch qualify button — appears when there are pending prospects */}
      {hasToken && aiCounts.PENDIENTE_OPPORTUNITY > 0 && (
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
            {aiCounts.PENDIENTE_OPPORTUNITY} prospecto{aiCounts.PENDIENTE_OPPORTUNITY !== 1 ? "s" : ""} sin calificar por el Opportunity Agent
          </div>
          <button
            onClick={handleRunAllPending}
            disabled={batchQualifying}
            style={{ fontSize: 12, padding: "5px 14px", borderRadius: 12, border: "1px solid #6366F1", background: batchQualifying ? "var(--bg-2)" : "#EEF2FF", color: "#4338CA", cursor: batchQualifying ? "not-allowed" : "pointer", fontWeight: 600 }}
          >
            {batchQualifying ? "Calificando…" : `Calificar todos (${aiCounts.PENDIENTE_OPPORTUNITY})`}
          </button>
        </div>
      )}

      {/* AI State Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {([
          { id: "ACTIVOS",         label: "Activos",          count: allRows.length - aiCounts.DESCARTADO_IA, color: "var(--primary)" },
          { id: "PRIORIDAD_MAXIMA",label: "Prioridad máxima", count: aiCounts.PRIORIDAD_MAXIMA, color: "#10B981" },
          { id: "APROBADO_IA",     label: "Aprobado IA",      count: aiCounts.APROBADO_IA,      color: "#5B5BF7" },
          { id: "REVISAR",         label: "Revisar",          count: aiCounts.REVISAR,          color: "#F59E0B" },
          { id: "PENDIENTE_OPPORTUNITY", label: "Pendiente Opp.", count: aiCounts.PENDIENTE_OPPORTUNITY, color: "#D1D5DB" },
          { id: "DESCARTADO_IA",   label: "Descartado IA",    count: aiCounts.DESCARTADO_IA,    color: "#9CA3AF" },
          { id: "TODOS",           label: "Todos",            count: allRows.length,            color: "var(--ink-400)" },
        ] as const).map(f => {
          const active = aiFilter === f.id;
          return (
            <button key={f.id} onClick={() => setAiFilter(f.id)} style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 400,
              background: active ? f.color : "var(--bg-2)",
              color: active ? "#fff" : "var(--ink-600)",
              border: `1px solid ${active ? f.color : "var(--border-soft)"}`,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, transition: "all 100ms",
            }}>
              {f.label}
              <span style={{ background: active ? "rgba(255,255,255,0.22)" : "var(--bg-3)", borderRadius: 10, padding: "0 5px", fontSize: 10, fontWeight: 700 }}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Prospects table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            Prospectos descubiertos
            <Badge tone="outline">{isLoading ? "Cargando…" : `${tableRows.length} visibles · ${meta?.total ?? total} totales`}</Badge>
            {!hasToken && <Badge tone="warning">Sin token · demo</Badge>}
            {hasToken && listError && <Badge tone="danger" title={listErrorObj?.message}>API error · {listErrorObj?.message ?? "ver consola"}</Badge>}
          </div>
          <div className="row gap-sm">
            <div className="topbar-search" style={{ width: 220, height: 30, padding: "4px 10px" }}>
              <Icon.search size={13}/>
              <input placeholder="Filtrar empresa..."/>
            </div>
            <button className="btn btn-sm"><Icon.filter size={13}/> Filtros</button>
            <button
              className={`btn btn-sm${sortBy === 'score' ? ' btn-brand' : ''}`}
              onClick={() => { setSortBy(s => s === 'score' ? 'createdAt' : 'score'); setPage(1); }}
              title={sortBy === 'score' ? 'Ordenando por score — click para ver más recientes' : 'Ordenando por fecha — click para volver a score'}
            >
              <Icon.sort size={13}/> {sortBy === 'score' ? 'Mayor score' : 'Recientes'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 28 }}><input type="checkbox"/></th>
                <th>Empresa</th>
                <th>Rubro</th>
                <th>Ubicación</th>
                <th>Web · IG</th>
                <th>Oportunidad detectada</th>
                <th>Servicio sugerido</th>
                <th style={{ width: 80 }}>Research · Opp.</th>
                <th style={{ width: 90 }}>Estado IA</th>
                <th>Estado</th>
                <th style={{ width: 80 }}>Contactable</th>
                <th style={{ width: 90 }}>Validación IA</th>
                <th>Últ. contacto</th>
                <th>Próx. seguim.</th>
                <th>Responsable</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={15} style={{ textAlign: "center", padding: 32, color: "var(--ink-400)", fontSize: 13 }}>Cargando prospectos…</td></tr>
              )}
              {!isLoading && tableRows.length === 0 && hasToken && (
                <tr><td colSpan={15} style={{ textAlign: "center", padding: 32, color: "var(--ink-400)", fontSize: 13 }}>Sin prospectos aún — usá el Research Engine para descubrir empresas</td></tr>
              )}
              {tableRows.map((p, i) => (
                <tr key={p.id ?? i}
                  onClick={() => { const next = selectedId === p.id ? null : p.id; setSelectedId(next); setSelectedRow(next ? p : null); }}
                  style={{ cursor: "pointer", background: selectedId === p.id ? "var(--primary-soft)" : p.isNew ? "rgba(16,185,129,0.04)" : undefined }}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox"/></td>
                  <td>
                    <div className="row gap-sm">
                      <span className="avatar sm" style={{ background: "var(--bg-2)", color: "var(--ink-700)", fontSize: 10 }}>
                        {p.co.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
                      </span>
                      <div>
                        <div className="cell-strong">{p.co}</div>
                        {p.isNew && <span style={{ fontSize: 9, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "1px 5px", borderRadius: 4 }}>NUEVO</span>}
                      </div>
                    </div>
                  </td>
                  <td className="cell-muted">{p.rubro}</td>
                  <td className="cell-muted">{p.city}</td>
                  <td>
                    {p.web && p.web !== "—" ? <span className="cell-mono" style={{ color: "var(--primary-700)" }}>{p.web}</span> : <span className="cell-muted">sin web</span>}
                    {p.ig && p.ig !== "—" && <div className="cell-muted" style={{ fontSize: 11 }}>{p.ig}</div>}
                  </td>
                  <td style={{ maxWidth: 200 }}><span style={{ fontSize: 12.5, color: "var(--ink-800)" }}>{p.opp}</span></td>
                  <td>{p.svc && p.svc !== "—" ? <Badge tone="brand">{p.svc}</Badge> : <span className="cell-muted">—</span>}</td>
                  <td style={{ textAlign: "center" }}>
                    <Score v={p.score}/>
                    {p.opportunityScore != null ? (
                      <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 1, color: AI_STATE_COLOR[aiStateFromScore(p.opportunityScore)] }}>
                        Opp {p.opportunityScore}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "var(--ink-300)", marginTop: 1 }}>Opp —</div>
                    )}
                  </td>
                  <td>
                    <Badge tone={AI_STATE_TONE[p.aiState]} dot>{AI_STATE_LABEL[p.aiState]}</Badge>
                  </td>
                  <td>
                    {p.isReal
                      ? <Badge tone={ESTADO_TONE[p.estado] ?? "default"} dot>{ESTADO_LABEL[p.estado] ?? p.state ?? p.estado}</Badge>
                      : <StateP s={p.state}/>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {p.isReal && (p.aiState === "APROBADO_IA" || p.aiState === "PRIORIDAD_MAXIMA") ? (
                      p.estado === "LISTO_OUTREACH" ? (
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>🚀 Listo</span>
                      ) : p.estado === "ENRIQUECIDO" ? (
                        <button
                          onClick={() => setReviewingProspectId(p.id)}
                          style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, border: "1px solid #F59E0B", background: "transparent", color: "#92400E", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          Revisar datos
                        </button>
                      ) : p.validation?.status === "VALIDATED" ? (
                        <button
                          onClick={() => handleEnrich(p.id)}
                          disabled={enrichingId === p.id}
                          style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, border: "1px solid #5B5BF7", background: "transparent", color: "#5B5BF7", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          {enrichingId === p.id ? "…" : "Enriquecer"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10.5, color: "var(--ink-400)" }}>
                          {p.validation ? "Pendiente revisión" : "—"}
                        </span>
                      )
                    ) : (
                      <span className="cell-muted" style={{ fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {p.validation
                      ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                          <Badge tone={VAL_TONE[p.validation.status]} dot>{VAL_LABEL[p.validation.status]}</Badge>
                          <button
                            onClick={() => handleRecalculate(p.id)}
                            disabled={recalculatingId === p.id}
                            style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, border: "1px solid var(--border-soft)", background: "transparent", color: "var(--ink-400)", cursor: "pointer", fontWeight: 500 }}
                          >
                            {recalculatingId === p.id ? "…" : `↺ ${p.validation.validationVersion ?? "v1"}`}
                          </button>
                        </div>
                      )
                      : p.isReal && p.estado === "INVESTIGADO"
                        ? (
                          <button
                            onClick={() => handleRunAgent(p.id)}
                            disabled={qualifyingId === p.id}
                            style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, border: "1px solid #6366F1", background: "transparent", color: "#4338CA", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                          >
                            {qualifyingId === p.id ? "…" : "Calificar"}
                          </button>
                        )
                        : <span className="cell-muted" style={{ fontSize: 11 }}>—</span>}
                  </td>
                  <td className="cell-muted col-num">{p.last}</td>
                  <td className="col-num" style={{ color: /Hoy|Mañana/.test(p.next) ? "var(--warning-ink)" : "var(--ink-800)", fontWeight: p.next.includes("Hoy") ? 600 : 400 }}>{p.next}</td>
                  <td><div className="row gap-sm"><Avatar name={p.who} size="sm"/><span>{p.who.split(" ")[0]}</span></div></td>
                  <td><button className="icon-btn" onClick={e => e.stopPropagation()} style={{ width: 26, height: 26, background: "transparent", border: 0 }}><Icon.more size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row between" style={{ padding: "10px 14px", borderTop: "1px solid var(--border-soft)", fontSize: 12, color: "var(--ink-500)" }}>
          <span>Mostrando {tableRows.length} de {meta?.total ?? total} · {listosOutreach} listos para outreach</span>
          <div className="row gap-sm">
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <span style={{ padding: "0 8px", lineHeight: "28px" }}>{page} / {meta?.totalPages ?? 1}</span>
            <button className="btn btn-sm btn-ghost" disabled={!meta || page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {/* Prospect detail drawer */}
      {selectedId && !jobDetailId && (
        <>
          <div onClick={() => { setSelectedId(null); setSelectedRow(null); }}
            style={{ position: "fixed", inset: 0, top: 56, background: "rgba(0,0,0,0.35)", zIndex: 98 }}
          />
          <ProspectDrawer
            prospectId={selectedId}
            rowData={selectedRow}
            validationById={validationById}
            onClose={() => { setSelectedId(null); setSelectedRow(null); }}
            onReviewEnrichment={selectedId && !selectedId.startsWith("demo-") ? () => setReviewingProspectId(selectedId) : undefined}
          />
        </>
      )}

      {/* Research Job Detail drawer */}
      {jobDetailId && (
        <ResearchJobDetailDrawer
          jobId={jobDetailId}
          onClose={() => setJobDetailId(null)}
        />
      )}

      {/* Enrichment Review Modal */}
      {reviewingProspectId && (
        <EnrichmentReviewModal
          prospectId={reviewingProspectId}
          onClose={() => setReviewingProspectId(null)}
        />
      )}
    </div>
  );
}

function StateP({ s }) {
  const map = { Nuevo: "default", Contactado: "info", Reunión: "brand", Propuesta: "warning", Ganado: "success", Perdido: "danger" };
  return <Badge tone={map[s] || "default"} dot>{s}</Badge>;
}

function MiniStatP({ label, value, sub, c }) {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: c }}/>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── Enrichment Review Modal ───────────────────────────────────────────────────

function EnrichmentReviewModal({ prospectId, onClose }: { prospectId: string; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["enrichment", "result", prospectId],
    queryFn: () => enrichmentApi.getResult(prospectId),
  });

  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const scoreColor = (s: number) => s >= 70 ? "#10B981" : s >= 40 ? "#F59E0B" : "#9CA3AF";

  const doReview = async (status: "APPROVED" | "REJECTED") => {
    if (!result?.id) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await enrichmentApi.reviewResult(result.id, status, reviewNotes || undefined);
      qc.invalidateQueries({ queryKey: ["prospects"] });
      qc.invalidateQueries({ queryKey: ["enrichment"] });
      onClose();
    } catch (e: any) {
      setSubmitError(e.message ?? "Error al revisar");
    } finally {
      setSubmitting(false);
    }
  };

  const FieldRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 12.5 }}>
      <span style={{ color: "var(--ink-400)", minWidth: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ color: value ? "var(--ink-900)" : "var(--ink-300)", fontWeight: value ? 600 : 400, wordBreak: "break-all" }}>
        {value || "—"}
      </span>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, top: 56, background: "rgba(0,0,0,0.45)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxHeight: "82vh", overflowY: "auto", background: "var(--bg-1)", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", zIndex: 111, padding: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Revisar datos de enriquecimiento</h3>
            <p style={{ fontSize: 12, color: "var(--ink-400)", margin: "3px 0 0" }}>Validación humana · Fase B</p>
          </div>
          <button onClick={onClose} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 20, color: "var(--ink-400)", lineHeight: 1 }}>×</button>
        </div>

        {isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--ink-400)" }}>Cargando datos...</div>
        )}

        {!isLoading && !result && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--ink-400)", fontSize: 13 }}>
            Sin datos de enriquecimiento para este prospecto.
          </div>
        )}

        {result && (
          <>
            {/* Contactability Score */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "12px 16px", background: "var(--bg-2)", borderRadius: 10 }}>
              <div style={{ textAlign: "center", minWidth: 56 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor(result.contactabilityScore ?? 0), lineHeight: 1 }}>
                  {result.contactabilityScore ?? 0}
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-400)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>Score</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: "var(--bg-3)", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
                  <div style={{ width: `${result.contactabilityScore ?? 0}%`, height: "100%", background: scoreColor(result.contactabilityScore ?? 0), borderRadius: 4, transition: "width 600ms ease" }}/>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>Confianza: <strong>{result.confianza ?? "N/A"}</strong></span>
                  <span>·</span>
                  {result.contactable
                    ? <span style={{ color: "#10B981", fontWeight: 600 }}>✔ Contactable</span>
                    : <span style={{ color: "#EF4444", fontWeight: 600 }}>✗ No contactable</span>
                  }
                  {result.reviewStatus !== "PENDING" && (
                    <>
                      <span>·</span>
                      <span style={{ color: result.reviewStatus === "APPROVED" ? "#10B981" : "#EF4444", fontWeight: 600 }}>
                        {result.reviewStatus === "APPROVED" ? "Aprobado" : "Rechazado"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Contact data */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Contacto</div>
              <FieldRow label="Email" value={result.email}/>
              <FieldRow label="Teléfono" value={result.telefono}/>
              <FieldRow label="WhatsApp" value={result.whatsapp}/>
              <FieldRow label="Formulario" value={result.formularioWeb}/>
            </div>

            {/* Digital presence */}
            {(result.googleBusiness || result.linkedin || result.facebook || result.instagram) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Presencia digital</div>
                {result.googleBusiness && <FieldRow label="Google Business" value={result.googleBusiness}/>}
                {result.linkedin && <FieldRow label="LinkedIn" value={result.linkedin}/>}
                {result.facebook && <FieldRow label="Facebook" value={result.facebook}/>}
                {result.instagram && <FieldRow label="Instagram" value={result.instagram}/>}
              </div>
            )}

            {/* Decision maker */}
            {result.nombreDecidsor && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Decisor</div>
                <div style={{ padding: "8px 12px", background: "var(--bg-2)", borderRadius: 8, fontSize: 13 }}>
                  <strong>{result.nombreDecidsor}</strong>
                  {result.rolDecidsor && <span style={{ color: "var(--ink-500)", marginLeft: 8 }}>· {result.rolDecidsor}</span>}
                  {result.linkedinDecidsor && (
                    <div style={{ marginTop: 4 }}>
                      <a href={result.linkedinDecidsor} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontSize: 12 }}>
                        Ver LinkedIn →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Notas de revisión</div>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Correcciones, observaciones, motivo de rechazo..."
                style={{ width: "100%", height: 68, padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "1px solid var(--border-soft)", background: "var(--bg-2)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", color: "var(--ink-900)" }}
              />
            </div>

            {/* AI recommendation banner */}
            {result.recommendedStatus && result.reviewStatus === "PENDING" && (
              <div style={{
                marginBottom: 14, padding: "10px 12px", borderRadius: 8, fontSize: 12,
                background: result.recommendedStatus === "SUGGEST_APPROVE" ? "#d1fae5" : "#fef3c7",
                borderLeft: `3px solid ${result.recommendedStatus === "SUGGEST_APPROVE" ? "#10B981" : "#F59E0B"}`,
              }}>
                <div style={{ fontWeight: 700, marginBottom: result.recommendNotes ? 4 : 0, color: result.recommendedStatus === "SUGGEST_APPROVE" ? "#065f46" : "#92400E" }}>
                  Agente IA sugiere: {result.recommendedStatus === "SUGGEST_APPROVE" ? "✔ Aprobar" : "✗ Rechazar"}
                </div>
                {result.recommendNotes && <div style={{ color: "var(--ink-600)", fontSize: 12 }}>{result.recommendNotes}</div>}
              </div>
            )}

            {result.reviewStatus !== "PENDING" && (
              <div style={{ marginBottom: 12, padding: "8px 12px", background: result.reviewStatus === "APPROVED" ? "#d1fae5" : "#fee2e2", borderRadius: 8, fontSize: 12, fontWeight: 600, color: result.reviewStatus === "APPROVED" ? "#065f46" : "#991b1b" }}>
                {result.reviewStatus === "APPROVED" ? "✅ Aprobado" : "✗ Rechazado"}{result.reviewNotes ? ` · ${result.reviewNotes}` : ""}
              </div>
            )}

            {submitError && (
              <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, padding: "6px 10px", background: "#fee2e2", borderRadius: 6 }}>
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => doReview("REJECTED")}
                disabled={submitting}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #EF4444", background: "transparent", color: "#EF4444", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                Rechazar
              </button>
              <button
                onClick={() => doReview("APPROVED")}
                disabled={submitting || !result.contactable}
                title={!result.contactable ? "No contactable — sin datos de contacto suficientes para aprobar" : ""}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: 0,
                  background: result.contactable ? "#10B981" : "var(--ink-200)",
                  color: result.contactable ? "#fff" : "var(--ink-400)",
                  cursor: result.contactable ? "pointer" : "not-allowed",
                  fontWeight: 700, fontSize: 13,
                }}
              >
                {submitting ? "…" : "Aprobar → Outreach"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// segmented button style
if (!document.getElementById("seg-styles")) {
  const s = document.createElement("style");
  s.id = "seg-styles";
  s.textContent = `
  .seg-btn { padding: 6px 12px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); font-size: 12.5px; font-weight: 500; color: var(--ink-700); }
  .seg-btn:hover { background: var(--surface-hover); }
  .seg-btn.active { background: var(--ink-900); color: white; border-color: var(--ink-900); }
  `;
  document.head.appendChild(s);
}



const CAMP_DATA = [
  { name: "Inmobiliarias — Lead Magnet", ch: "meta", status: "Activa", budget: 1200, spent: 842, leads: 64, cpl: 13.2, meetings: 9, clients: 3, roas: 4.2 },
  { name: "Search — Desarrollo web a medida", ch: "google", status: "Activa", budget: 1800, spent: 1340, leads: 48, cpl: 27.9, meetings: 12, clients: 4, roas: 5.1 },
  { name: "IG — Tiendas online retail", ch: "igdm", status: "Activa", budget: 900, spent: 610, leads: 52, cpl: 11.7, meetings: 7, clients: 2, roas: 3.4 },
  { name: "Remarketing — visitantes web", ch: "meta", status: "Activa", budget: 400, spent: 280, leads: 28, cpl: 10.0, meetings: 5, clients: 2, roas: 6.8 },
  { name: "Reactivación leads fríos", ch: "whatsapp", status: "Activa", budget: 0, spent: 0, leads: 34, cpl: 0, meetings: 11, clients: 4, roas: 12.0 },
  { name: "Clínicas — captación salud", ch: "meta", status: "Pausada", budget: 700, spent: 520, leads: 22, cpl: 23.6, meetings: 3, clients: 1, roas: 2.1 },
  { name: "Lookalike — clientes top", ch: "meta", status: "Borrador", budget: 1000, spent: 0, leads: 0, cpl: 0, meetings: 0, clients: 0, roas: 0 },
];

function Campaigns({ onNav }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Campañas</h1>
          <p>Inbound Lead Engine · captación de <strong>Inspyra</strong> (no de clientes) · 5 activas</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Mayo 2026 <Icon.chevronDown size={12}/></button>
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nueva campaña</button>
        </div>
      </div>

      <ComercialTabs active="campaigns" onNav={onNav}/>

      {/* Clarity note: these are NOT client campaigns */}
      <div className="info-banner" style={{ marginBottom: 16 }}>
        <Icon.eye size={15}/>
        <span>Estas son las campañas de captación de <strong>Inspyra</strong>. Las campañas <em>de clientes</em> viven dentro de la ficha de cada cliente, en su sección de Servicios.</span>
      </div>

      {/* KPIs */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: 16 }}>
        <CampKpi label="Leads generados" value="302" delta="+48 sem" icon="inbox" tone="brand"/>
        <CampKpi label="CPL medio" value="$16.4" delta="−$2.1" icon="dollar" tone="success"/>
        <CampKpi label="CTR medio" value="2.8%" delta="+0.3pp" icon="target" tone="info"/>
        <CampKpi label="Reuniones" value="47" delta="14 sem" icon="calendar" tone="brand"/>
        <CampKpi label="Coste / reunión" value="$84" delta="−$9" icon="video" tone="success"/>
        <CampKpi label="Coste / cliente" value="$412" delta="16 nuevos" icon="trophy" tone="info"/>
      </div>

      {/* Bots / automation capture */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            <Icon.robot size={15}/> Bots de captura
            <Badge tone="success" dot>5 activos</Badge>
          </div>
          <div className="row gap-sm">
            <span className="cell-muted" style={{ fontSize: 11.5 }}>Cada lead entra automáticamente al Pipeline y dispara respuesta inmediata</span>
            <button className="btn btn-sm"><Icon.cog size={13}/> Configurar bots</button>
          </div>
        </div>
        <div className="card-body">
          <BotsStrip/>
        </div>
      </div>

      {/* Campaign table */}
      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ border: 0, padding: 0, margin: "-4px 0" }}>
            <div className="tab active">Todas <span className="badge outline">12</span></div>
            <div className="tab">Activas <span className="badge success">5</span></div>
            <div className="tab">Pausadas <span className="badge warning">1</span></div>
            <div className="tab">Borradores <span className="badge outline">2</span></div>
          </div>
          <div className="topbar-search" style={{ width: 220, height: 30, padding: "4px 10px" }}>
            <Icon.search size={13}/>
            <input placeholder="Buscar campaña..."/>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Presupuesto</th>
              <th>Leads</th>
              <th>CPL</th>
              <th>Reuniones</th>
              <th>Clientes</th>
              <th>ROAS</th>
              <th style={{ width: 28 }}></th>
            </tr>
          </thead>
          <tbody>
            {CAMP_DATA.map((c, i) => (
              <tr key={i}>
                <td className="cell-strong">{c.name}</td>
                <td><ChannelTag ch={c.ch}/></td>
                <td>
                  {c.status === "Activa" && <Badge tone="success" dot>Activa</Badge>}
                  {c.status === "Pausada" && <Badge tone="warning" dot>Pausada</Badge>}
                  {c.status === "Borrador" && <Badge tone="outline" dot>Borrador</Badge>}
                </td>
                <td className="col-num">
                  {c.budget > 0 ? (
                    <div>
                      <div className="cell-strong">${c.spent} <span className="cell-muted" style={{ fontWeight: 400 }}>/ ${c.budget}</span></div>
                      <div style={{ height: 4, background: "var(--ink-100)", borderRadius: 999, marginTop: 3, width: 80 }}>
                        <div style={{ height: "100%", width: Math.min(100, c.spent / c.budget * 100) + "%", background: "var(--primary)", borderRadius: 999 }}/>
                      </div>
                    </div>
                  ) : <span className="cell-muted">Orgánico</span>}
                </td>
                <td className="col-num cell-strong">{c.leads}</td>
                <td className="col-num">{c.cpl > 0 ? `$${c.cpl}` : "—"}</td>
                <td className="col-num cell-strong">{c.meetings}</td>
                <td className="col-num">
                  {c.clients > 0 ? <Badge tone="success">{c.clients} nuevos</Badge> : <span className="cell-muted">—</span>}
                </td>
                <td className="col-num">
                  {c.roas > 0 ? <span style={{ fontWeight: 600, color: c.roas >= 4 ? "var(--success-ink)" : c.roas >= 2 ? "var(--warning-ink)" : "var(--danger-ink)" }}>{c.roas}x</span> : <span className="cell-muted">—</span>}
                </td>
                <td><button className="icon-btn" style={{ width: 26, height: 26, background: "transparent", border: 0 }}><Icon.more size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampKpi({ label, value, delta, icon, tone }) {
  const IconC = Icon[icon];
  const tones = { brand: "var(--primary)", success: "var(--success)", info: "var(--info)" };
  return (
    <div className="card" style={{ padding: "13px 14px" }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bg-2)", color: tones[tone], display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {IconC && <IconC size={12}/>}
        </span>
      </div>
      <div style={{ fontSize: 21, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--success-ink)", marginTop: 2, fontWeight: 500 }}>{delta}</div>
    </div>
  );
}

if (!document.getElementById("info-banner-styles")) {
  const s = document.createElement("style");
  s.id = "info-banner-styles";
  s.textContent = `
  .info-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px;
    background: var(--info-soft);
    border: 1px solid #BFDBFE;
    border-radius: var(--r-md);
    font-size: 12.5px; color: #1E40AF;
  }
  .info-banner strong { font-weight: 600; }
  .info-banner em { font-style: normal; font-weight: 600; }
  `;
  document.head.appendChild(s);
}


const useStateFu = useState;

const FU_GROUPS = [
  {
    id: "overdue", title: "Follow-ups vencidos", tone: "danger", icon: "flag",
    desc: "Atrasados — recontactar ya",
    rows: [
      { co: "Forge Legal", contact: "T. Vega", ch: "outbound", last: "Hace 6d", next: "Vencido 2d", who: "Pablo Ferré", pri: "urg", temp: "warm", state: "Contactado" },
      { co: "Veleta Wines", contact: "C. Bregman", ch: "igdm", last: "Hace 8d", next: "Vencido 3d", who: "Camila Vega", pri: "high", temp: "cold", state: "Nuevo" },
    ],
  },
  {
    id: "today", title: "Seguimientos de hoy", tone: "brand", icon: "calendar",
    desc: "Programados para hoy",
    rows: [
      { co: "Estudio Bregman", contact: "S. Bregman", ch: "outbound", last: "Hace 2d", next: "Hoy 15:00", who: "Lucía Romero", pri: "high", temp: "hot", state: "Reunión" },
      { co: "Lumen Salud", contact: "Dra. M. Roca", ch: "google", last: "Hoy 09:12", next: "Hoy 17:30", who: "Mateo López", pri: "urg", temp: "hot", state: "Propuesta" },
      { co: "Aurora Café", contact: "S. Vidal", ch: "igdm", last: "Ayer", next: "Hoy 11:00", who: "Pablo Ferré", pri: "med", temp: "warm", state: "Reunión" },
    ],
  },
  {
    id: "no24", title: "Sin respuesta · 24h", tone: "warning", icon: "clock",
    desc: "Esperando respuesta hace 1 día",
    rows: [
      { co: "Grupo Andén", contact: "R. Méndez", ch: "meta", last: "Ayer 14:20", next: "Auto en 4h", who: "Sofía Vidal", pri: "med", temp: "warm", state: "Respondió", auto: true },
      { co: "Dental Costa", contact: "Dr. Costa", ch: "meta", last: "Ayer 10:05", next: "Auto en 8h", who: "Sofía Vidal", pri: "med", temp: "warm", state: "Contactado", auto: true },
    ],
  },
  {
    id: "no48", title: "Sin respuesta · 48h", tone: "default", icon: "clock",
    desc: "Riesgo de enfriarse",
    rows: [
      { co: "Nordic Studio", contact: "K. Lindqvist", ch: "webform", last: "Hace 2d", next: "Auto enviado", who: "Camila Vega", pri: "low", temp: "cold", state: "Contactado", auto: true },
      { co: "Helix Robotics", contact: "L. Ortega", ch: "outbound", last: "Hace 2d", next: "Mañana", who: "Mateo López", pri: "high", temp: "warm", state: "Propuesta" },
    ],
  },
];

function Followup({ onNav }) {
  const [tab, setTab] = useStateFu("all");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Seguimiento</h1>
          <p>Follow-up Center · tu bandeja comercial diaria · que ningún lead quede olvidado</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.refresh size={14}/> Auto-seguimiento</button>
          <button className="btn btn-brand"><Icon.zap size={14}/> Trabajar la cola</button>
        </div>
      </div>

      <ComercialTabs active="followup" onNav={onNav}/>

      {/* Daily summary cards */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 16 }}>
        <FuStat label="Pendientes hoy" value="14" icon="calendar" tone="brand" big/>
        <FuStat label="Vencidos" value="4" icon="flag" tone="danger"/>
        <FuStat label="Sin respuesta 24h" value="6" icon="clock" tone="warning"/>
        <FuStat label="Leads calientes" value="8" icon="fire" tone="danger"/>
        <FuStat label="Recontactos auto" value="11" icon="robot" tone="default"/>
      </div>

      {/* Automation flow context */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title"><Icon.robot size={15}/> Flujo automático de seguimiento</div>
          <Badge tone="brand" dot>Activo</Badge>
        </div>
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <AutomationFlow/>
        </div>
      </div>

      {/* The work tray */}
      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ border: 0, padding: 0, margin: "-4px 0" }}>
            <div className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Toda la cola <span className="badge outline">14</span></div>
            <div className={`tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>Míos <span className="badge brand">6</span></div>
            <div className={`tab ${tab === "hot" ? "active" : ""}`} onClick={() => setTab("hot")}>Calientes <span className="badge danger">8</span></div>
          </div>
          <div className="row gap-sm">
            <button className="btn btn-sm"><Icon.filter size={13}/> Filtros</button>
            <button className="btn btn-sm"><Icon.sort size={13}/> Prioridad</button>
          </div>
        </div>

        <div style={{ padding: "4px 0" }}>
          {FU_GROUPS.map((g) => {
            const IconC = Icon[g.icon];
            const tones = { danger: "var(--danger)", brand: "var(--primary)", warning: "var(--warning)", default: "var(--ink-400)" };
            return (
              <div key={g.id}>
                <div className="fu-group-head">
                  <span className="fu-group-ic" style={{ color: tones[g.tone] }}><IconC size={14}/></span>
                  <span className="fu-group-title">{g.title}</span>
                  <span className="badge outline">{g.rows.length}</span>
                  <span className="fu-group-desc">{g.desc}</span>
                </div>
                {g.rows.map((r, i) => (
                  <div key={i} className="fu-row">
                    <div className="fu-cell-lead">
                      <span className="avatar sm" style={{ background: "var(--bg-2)", color: "var(--ink-700)", fontSize: 10 }}>
                        {r.co.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
                      </span>
                      <div>
                        <div className="cell-strong">{r.co}</div>
                        <div className="cell-muted" style={{ fontSize: 11 }}>{r.contact}</div>
                      </div>
                    </div>
                    <div className="fu-cell"><ChannelTag ch={r.ch} sm/></div>
                    <div className="fu-cell">
                      <div className="cell-muted" style={{ fontSize: 11 }}>Último</div>
                      <div style={{ fontSize: 12.5 }}>{r.last}</div>
                    </div>
                    <div className="fu-cell">
                      <div className="cell-muted" style={{ fontSize: 11 }}>Próximo</div>
                      <div style={{ fontSize: 12.5, color: r.next.includes("Vencido") ? "var(--danger-ink)" : r.next.includes("Hoy") ? "var(--warning-ink)" : "var(--ink-800)", fontWeight: /Vencido|Hoy/.test(r.next) ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                        {r.auto && <Icon.robot size={11} color="var(--primary)"/>}
                        {r.next}
                      </div>
                    </div>
                    <div className="fu-cell"><Temp level={r.temp}/></div>
                    <div className="fu-cell">
                      {r.pri === "urg" && <Badge tone="danger" dot>Urgente</Badge>}
                      {r.pri === "high" && <Badge tone="warning" dot>Alta</Badge>}
                      {r.pri === "med" && <Badge tone="info" dot>Media</Badge>}
                      {r.pri === "low" && <Badge tone="outline" dot>Baja</Badge>}
                    </div>
                    <div className="fu-cell"><div className="row gap-sm"><Avatar name={r.who} size="sm"/><span style={{ fontSize: 12.5 }}>{r.who.split(" ")[0]}</span></div></div>
                    <div className="fu-cell-actions"><QuickActions/></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FuStat({ label, value, icon, tone, big }) {
  const IconC = Icon[icon];
  const tones = { brand: "var(--primary)", danger: "var(--danger)", warning: "var(--warning)", default: "var(--ink-500)" };
  const softs = { brand: "var(--primary-soft)", danger: "var(--danger-soft)", warning: "var(--warning-soft)", default: "var(--bg-2)" };
  return (
    <div className="card" style={{ padding: "14px 16px", borderColor: big ? "var(--primary)" : undefined, boxShadow: big ? "var(--sh-glow)" : "var(--sh-xs)" }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: softs[tone], color: tones[tone], display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {IconC && <IconC size={13}/>}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: big ? "var(--primary-700)" : "var(--ink-900)" }}>{value}</div>
    </div>
  );
}

if (!document.getElementById("fu-styles")) {
  const s = document.createElement("style");
  s.id = "fu-styles";
  s.textContent = `
  .fu-group-head {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px 8px;
    background: var(--surface-2);
    border-top: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
  }
  .fu-group-ic { display: inline-flex; }
  .fu-group-title { font-size: 12px; font-weight: 600; color: var(--ink-900); }
  .fu-group-desc { font-size: 11px; color: var(--ink-500); margin-left: 4px; }
  .fu-row {
    display: grid;
    grid-template-columns: 1.6fr 1fr .9fr 1.1fr .9fr .9fr 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 11px 18px;
    border-bottom: 1px solid var(--border-soft);
  }
  .fu-row:hover { background: var(--surface-2); }
  .fu-cell-lead { display: flex; align-items: center; gap: 9px; }
  .fu-cell-actions { display: flex; justify-content: flex-end; }
  `;
  document.head.appendChild(s);
}



const PIPE_COLS = [
  { name: "Nuevo", color: "#9CA3AF", cards: [
    { co: "Dental Costa", contact: "Dr. Costa", ch: "meta", who: "Sofía Vidal", svc: "Plataforma + Ads", val: 3200, last: "Hace 2h" },
    { co: "Nordic Studio", contact: "K. Lindqvist", ch: "webform", who: "Camila Vega", svc: "Branding + Web", val: 4500, last: "Ayer" },
    { co: "Veleta Wines", contact: "C. Bregman", ch: "igdm", who: "Camila Vega", svc: "E-commerce", val: 2800, last: "Hace 3d" },
  ]},
  { name: "Contactado", color: "#0EA5E9", cards: [
    { co: "Forge Legal", contact: "T. Vega", ch: "outbound", who: "Pablo Ferré", svc: "Web + redes", val: 4500, last: "Hace 1d" },
    { co: "Grupo Andén", contact: "R. Méndez", ch: "meta", who: "Sofía Vidal", svc: "Plataforma + SEO", val: 6200, last: "Hace 3d" },
  ]},
  { name: "Respondió", color: "#A78BFA", cards: [
    { co: "Bauer & Co", contact: "J. Bauer", ch: "referido", who: "Camila Vega", svc: "Web · Hosting", val: 5800, last: "Hoy" },
    { co: "Mira Cosmetics", contact: "C. Bregman", ch: "igdm", who: "Pablo Ferré", svc: "E-commerce", val: 4200, last: "Hace 1d" },
  ]},
  { name: "Reunión agendada", color: "#5B5BF7", cards: [
    { co: "Estudio Bregman", contact: "S. Bregman", ch: "outbound", who: "Lucía Romero", svc: "Web + SEO local", val: 3600, last: "Hoy", hot: true },
    { co: "Aurora Café", contact: "S. Vidal", ch: "igdm", who: "Pablo Ferré", svc: "Web + delivery", val: 1800, last: "Mañana" },
  ]},
  { name: "Propuesta enviada", color: "#22D3EE", cards: [
    { co: "Helia Energy", contact: "F. Cazenave", ch: "referido", who: "Mateo López", svc: "Software + AWS", val: 14500, last: "Vence 3d", hot: true },
    { co: "Lumen Salud", contact: "Dra. Roca", ch: "google", who: "Mateo López", svc: "Plataforma + Ads", val: 4200, last: "Vence 1d", hot: true },
  ]},
  { name: "Negociación", color: "#F59E0B", cards: [
    { co: "Helix Robotics", contact: "L. Ortega", ch: "outbound", who: "Mateo López", svc: "Software a medida", val: 41600, last: "Hace 2d", hot: true },
  ]},
  { name: "Ganado", color: "#10B981", cards: [
    { co: "Tessera Joyas", contact: "A. Tessera", ch: "referido", who: "Lucía Romero", svc: "E-commerce", val: 8820, last: "Cerrado" },
    { co: "Klein Studio", contact: "D. Klein", ch: "organico", who: "Camila Vega", svc: "Web + SEO", val: 9400, last: "Cerrado" },
  ]},
  { name: "Perdido / No responde", color: "#EF4444", cards: [
    { co: "Norte Films", contact: "I. Saavedra", ch: "webform", who: "Lucía Romero", svc: "Plataforma", val: 6800, last: "Sin respuesta" },
  ]},
];

function Pipeline({ onNav }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pipeline</h1>
          <p>Sales Pipeline · acá convergen <strong>todos</strong> los leads — outbound, campañas, referidos, orgánico, WhatsApp</p>
        </div>
        <div className="row gap-sm">
          <div className="tabs" style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="tab active">Kanban</div>
            <div className="tab">Tabla</div>
            <div className="tab">Forecast</div>
          </div>
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo lead</button>
        </div>
      </div>

      <ComercialTabs active="pipeline" onNav={onNav}/>

      {/* Convergence legend */}
      <div className="card" style={{ marginBottom: 16, padding: "11px 16px" }}>
        <div className="row" style={{ gap: 18, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Canal de origen:</span>
          {["outbound", "meta", "google", "igdm", "fbmsg", "whatsapp", "webform", "referido", "organico"].map((ch) => (
            <ChannelTag key={ch} ch={ch} sm/>
          ))}
        </div>
      </div>

      {/* Pipeline value summary */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <PipeStat label="Valor del pipeline" value="USD 118.2k" sub="17 deals abiertos" c="var(--primary)"/>
        <PipeStat label="Ponderado (probabilidad)" value="USD 64.8k" sub="forecast Q2" c="var(--secondary)"/>
        <PipeStat label="Tasa de cierre" value="32%" sub="+4pp vs Q1" c="var(--success)"/>
        <PipeStat label="Ciclo medio" value="18 días" sub="lead → cierre" c="var(--ink-500)"/>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div className="kanban" style={{ gridTemplateColumns: "repeat(8, minmax(240px, 1fr))" }}>
          {PIPE_COLS.map((col) => {
            const total = col.cards.reduce((a, c) => a + c.val, 0);
            return (
              <div key={col.name} className="kanban-col">
                <div className="kanban-col-head">
                  <div className="h">
                    <span className="stagebar" style={{ background: col.color }}/>
                    {col.name}
                    <span style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 999, fontSize: 11, color: "var(--ink-600)" }}>{col.cards.length}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", padding: "0 4px 4px", fontVariantNumeric: "tabular-nums" }}>USD {(total / 1000).toFixed(1)}k</div>
                {col.cards.map((c, i) => (
                  <div key={i} className="k-card" style={{ borderLeft: c.hot ? "2px solid var(--danger)" : undefined }}>
                    <div className="row between">
                      <span className="k-title" style={{ fontSize: 13 }}>{c.co}</span>
                      {c.hot && <Icon.fire size={13} color="var(--danger)"/>}
                    </div>
                    <div className="cell-muted" style={{ fontSize: 11 }}>{c.contact}</div>
                    <ChannelTag ch={c.ch} sm/>
                    <div className="row gap-sm">
                      <span className="k-tag">{c.svc}</span>
                    </div>
                    <div className="k-foot">
                      <span className="deal-amount" style={{ fontSize: 12 }}>USD {(c.val / 1000).toFixed(1)}k</span>
                      <div className="row gap-sm">
                        <span style={{ fontSize: 10.5, color: "var(--ink-500)" }}>{c.last}</span>
                        <Avatar name={c.who} size="sm"/>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-sm btn-ghost" style={{ justifyContent: "flex-start", width: "100%" }}><Icon.plus size={12}/> Añadir</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipeStat({ label, value, sub, c }) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: c }}/>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 23, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}


const useStateMt = useState;

const MEETINGS = [
  { co: "Estudio Bregman", contact: "S. Bregman", date: "Hoy", time: "15:00", dur: "30m", who: "Lucía Romero", via: "meet", type: "Discovery", goal: "Entender necesidad web + SEO local", state: "Confirmada", ch: "outbound", prop: null },
  { co: "Lumen Salud", contact: "Dra. M. Roca", date: "Hoy", time: "17:30", dur: "45m", who: "Mateo López", via: "zoom", type: "Cierre", goal: "Revisar propuesta plataforma + ads", state: "Confirmada", ch: "google", prop: "PROP-118" },
  { co: "Aurora Café", contact: "S. Vidal", date: "Mañana", time: "11:00", dur: "30m", who: "Pablo Ferré", via: "presencial", type: "Discovery", goal: "Relevar marca y delivery", state: "Confirmada", ch: "igdm", prop: null },
  { co: "Helix Robotics", contact: "L. Ortega", date: "29 May", time: "10:00", dur: "60m", who: "Mateo López", via: "meet", type: "Demo", goal: "Demo de software a medida", state: "Confirmada", ch: "outbound", prop: "PROP-114" },
  { co: "Grupo Andén", contact: "R. Méndez", date: "31 May", time: "16:00", dur: "30m", who: "Sofía Vidal", via: "zoom", type: "Seguimiento", goal: "Segunda reunión · objeciones", state: "Por confirmar", ch: "meta", prop: null },
];

const PAST = [
  { co: "Tessera Joyas", contact: "A. Tessera", date: "22 May", who: "Lucía Romero", via: "meet", type: "Cierre", outcome: "Ganado", note: "Firmó setup e-commerce USD 8.8k" },
  { co: "Klein Studio", contact: "D. Klein", date: "20 May", who: "Camila Vega", via: "presencial", type: "Cierre", outcome: "Ganado", note: "Renovó web + SEO" },
  { co: "Bauer & Co", contact: "J. Bauer", date: "18 May", who: "Camila Vega", via: "zoom", type: "Discovery", outcome: "Avanza", note: "Pide propuesta formal" },
  { co: "Norte Films", contact: "I. Saavedra", date: "15 May", who: "Lucía Romero", via: "meet", type: "Demo", outcome: "Perdido", note: "Pausó por presupuesto" },
];

const VIA = {
  meet: { label: "Google Meet", color: "#00897B", icon: "video" },
  zoom: { label: "Zoom", color: "#2D8CFF", icon: "video" },
  presencial: { label: "Presencial", color: "#6B7280", icon: "building" },
};

function Meetings({ onNav }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reuniones</h1>
          <p>Sales Meetings Center · agenda comercial · discovery, demos, cierres y seguimientos</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Conectar calendario</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Agendar reunión</button>
        </div>
      </div>

      <ComercialTabs active="meetings" onNav={onNav}/>

      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 16 }}>
        <MtStat label="Hoy" value="2" icon="calendar" tone="brand" big/>
        <MtStat label="Esta semana" value="5" icon="calCheck" tone="default"/>
        <MtStat label="Discovery calls" value="3" icon="phone" tone="info"/>
        <MtStat label="Cierres" value="2" icon="trophy" tone="success"/>
        <MtStat label="Por confirmar" value="1" icon="clock" tone="warning"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* Upcoming */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Próximas reuniones <Badge tone="brand">5</Badge></div>
            <button className="btn btn-sm"><Icon.filter size={13}/> Filtros</button>
          </div>
          <div style={{ padding: "6px 0" }}>
            {MEETINGS.map((m, i) => {
              const via = VIA[m.via];
              const ViaIc = Icon[via.icon];
              return (
                <div key={i} className="mt-row">
                  <div className="mt-date">
                    <div className="mt-date-d">{m.date}</div>
                    <div className="mt-date-t">{m.time}</div>
                    <div className="mt-date-dur">{m.dur}</div>
                  </div>
                  <div className="mt-line" style={{ background: m.state === "Confirmada" ? "var(--success)" : "var(--warning)" }}/>
                  <div className="mt-body">
                    <div className="row between">
                      <div className="row gap-sm">
                        <span className="cell-strong" style={{ fontSize: 13.5 }}>{m.co}</span>
                        <Badge tone={m.type === "Cierre" ? "success" : m.type === "Demo" ? "brand" : m.type === "Discovery" ? "info" : "outline"}>{m.type}</Badge>
                      </div>
                      <span className="mt-via" style={{ color: via.color }}><ViaIc size={12}/> {via.label}</span>
                    </div>
                    <div className="cell-muted" style={{ fontSize: 12, marginTop: 2 }}>{m.contact} · <span style={{ color: "var(--ink-700)" }}>{m.goal}</span></div>
                    <div className="row between" style={{ marginTop: 8 }}>
                      <div className="row gap-sm">
                        <Avatar name={m.who} size="sm"/>
                        <span style={{ fontSize: 11.5, color: "var(--ink-600)" }}>{m.who.split(" ")[0]}</span>
                        <ChannelTag ch={m.ch} sm/>
                        {m.prop && <Badge tone="outline"><Icon.doc size={10}/> {m.prop}</Badge>}
                      </div>
                      <div className="row gap-sm">
                        {m.state === "Por confirmar" && <Badge tone="warning" dot>Por confirmar</Badge>}
                        <button className="btn btn-sm"><Icon.video size={12}/> Unirse</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Past + mini calendar */}
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Mayo 2026</div><div className="row gap-sm"><button className="icon-btn" style={{ width: 24, height: 24 }}><Icon.chevronRight size={12} style={{ transform: "rotate(180deg)" }}/></button><button className="icon-btn" style={{ width: 24, height: 24 }}><Icon.chevronRight size={12}/></button></div></div>
            <div className="card-body"><MiniCal/></div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Reuniones realizadas</div><button className="btn btn-sm btn-ghost">Ver todas</button></div>
            <div style={{ padding: "4px 0" }}>
              {PAST.map((p, i) => (
                <div key={i} className="row" style={{ padding: "10px 18px", gap: 10, borderBottom: i === PAST.length - 1 ? "none" : "1px solid var(--border-soft)" }}>
                  <Avatar name={p.contact} size="sm"/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ fontSize: 12.5 }}>{p.co}</div>
                    <div className="cell-muted" style={{ fontSize: 11 }}>{p.date} · {p.type} · {p.note}</div>
                  </div>
                  {p.outcome === "Ganado" && <Badge tone="success" dot>Ganado</Badge>}
                  {p.outcome === "Avanza" && <Badge tone="info" dot>Avanza</Badge>}
                  {p.outcome === "Perdido" && <Badge tone="danger" dot>Perdido</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MtStat({ label, value, icon, tone, big }) {
  const IconC = Icon[icon];
  const tones = { brand: "var(--primary)", success: "var(--success)", info: "var(--info)", warning: "var(--warning)", default: "var(--ink-500)" };
  return (
    <div className="card" style={{ padding: "14px 16px", borderColor: big ? "var(--primary)" : undefined, boxShadow: big ? "var(--sh-glow)" : "var(--sh-xs)" }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-2)", color: tones[tone], display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {IconC && <IconC size={13}/>}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: big ? "var(--primary-700)" : "var(--ink-900)" }}>{value}</div>
    </div>
  );
}

function MiniCal() {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const events = { 24: 2, 25: 1, 29: 1, 31: 1 };
  const cells = [];
  for (let i = 0; i < 3; i++) cells.push(null);
  for (let d = 1; d <= 31; d++) cells.push(d);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {days.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 10.5, color: "var(--ink-400)", fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => (
          <div key={i} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 7, fontSize: 12, position: "relative",
            background: d === 24 ? "var(--ink-900)" : events[d] ? "var(--primary-soft)" : "transparent",
            color: d === 24 ? "white" : d ? "var(--ink-700)" : "transparent",
            fontWeight: d === 24 ? 600 : 400 }}>
            {d || ""}
            {events[d] && d !== 24 && <span style={{ position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 50, background: "var(--primary)" }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

if (!document.getElementById("mt-styles")) {
  const s = document.createElement("style");
  s.id = "mt-styles";
  s.textContent = `
  .mt-row { display: flex; gap: 0; padding: 12px 18px; border-bottom: 1px solid var(--border-soft); }
  .mt-row:hover { background: var(--surface-2); }
  .mt-date { width: 62px; flex-shrink: 0; text-align: center; }
  .mt-date-d { font-size: 11.5px; font-weight: 600; color: var(--ink-900); }
  .mt-date-t { font-size: 16px; font-weight: 700; color: var(--ink-900); font-family: var(--font-display); letter-spacing: -0.02em; }
  .mt-date-dur { font-size: 10.5px; color: var(--ink-400); }
  .mt-line { width: 3px; border-radius: 999px; margin: 2px 14px; flex-shrink: 0; }
  .mt-body { flex: 1; min-width: 0; }
  .mt-via { font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
  `;
  document.head.appendChild(s);
}


const useStateCL = useState;

const CLIENTS = [
  { id: "C-0148", co: "Helia Energy", contact: "F. Cazenave", country: "🇦🇷 AR", svc: ["Software","AWS"], mrr: 2400, total: 28800, status: "Activo", since: "Mar 2024", health: 92, lead: "Mateo López" },
  { id: "C-0142", co: "Klein Studio", contact: "D. Klein", country: "🇦🇷 AR", svc: ["Web","SEO","Redes"], mrr: 1850, total: 22200, status: "Activo", since: "Ene 2024", health: 88, lead: "Camila Vega" },
  { id: "C-0139", co: "Tessera Joyas", contact: "A. Tessera", country: "🇦🇷 AR", svc: ["E-commerce","Hosting"], mrr: 980, total: 8820, status: "Onboarding", since: "May 2026", health: 76, lead: "Lucía Romero" },
  { id: "C-0136", co: "Calá Inmobiliaria", contact: "R. Ferro", country: "🇦🇷 AR", svc: ["Plataforma","SEO"], mrr: 1450, total: 14500, status: "Activo", since: "Ago 2025", health: 81, lead: "Pablo Ferré" },
  { id: "C-0128", co: "Borealis Tours", contact: "M. Calderón", country: "🇨🇱 CL", svc: ["Hosting","Mantenimiento"], mrr: 380, total: 4560, status: "Activo", since: "Jun 2024", health: 95, lead: "Diego Salas" },
  { id: "C-0122", co: "Lumen Salud", contact: "Dra. M. Roca", country: "🇦🇷 AR", svc: ["Web","Ads"], mrr: 1200, total: 7200, status: "Activo", since: "Nov 2025", health: 70, lead: "Mateo López" },
  { id: "C-0117", co: "Norte Films", contact: "I. Saavedra", country: "🇺🇾 UY", svc: ["Plataforma"], mrr: 0, total: 6800, status: "Pausado", since: "Oct 2025", health: 42, lead: "Lucía Romero" },
  { id: "C-0109", co: "Bauer & Co", contact: "J. Bauer", country: "🇪🇸 ES", svc: ["Web","Hosting"], mrr: 540, total: 11340, status: "Activo", since: "Jul 2023", health: 86, lead: "Camila Vega" },
  { id: "C-0102", co: "Mira Cosmetics", contact: "C. Bregman", country: "🇲🇽 MX", svc: ["E-commerce","SEO","Redes"], mrr: 2100, total: 25200, status: "Activo", since: "Jun 2023", health: 79, lead: "Pablo Ferré" },
  { id: "C-0094", co: "Helix Robotics", contact: "L. Ortega", country: "🇦🇷 AR", svc: ["Software a medida"], mrr: 3200, total: 41600, status: "Activo", since: "Abr 2023", health: 94, lead: "Mateo López" },
];

function HealthBar({ v }) {
  const tone = v >= 85 ? "success" : v >= 65 ? "brand" : v >= 50 ? "warning" : "danger";
  return (
    <div className="row gap-sm" style={{ width: 80 }}>
      <div style={{ flex: 1 }}><Progress value={v} tone={tone}/></div>
      <span className="col-num" style={{ fontSize: 11.5, color: "var(--ink-500)", width: 22, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function Clients({ onOpen }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>48 cuentas activas · MRR USD 32,180 · Health promedio 82</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo cliente</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <MiniCard label="Activos" value="48" delta="+3 este mes" tone="success"/>
        <MiniCard label="Onboarding" value="3" delta="2 esta semana" tone="brand"/>
        <MiniCard label="En riesgo" value="4" delta="health < 50" tone="warning"/>
        <MiniCard label="Pausados / Lost" value="2" delta="−1 vs anterior" tone="default"/>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ border: 0, padding: 0, margin: "-4px 0" }}>
            <div className="tab active">Todos <span className="badge outline">48</span></div>
            <div className="tab">Activos <span className="badge outline">42</span></div>
            <div className="tab">Onboarding <span className="badge outline">3</span></div>
            <div className="tab">En riesgo <span className="badge danger">4</span></div>
            <div className="tab">Pausados <span className="badge outline">2</span></div>
          </div>
          <div className="row gap-sm">
            <div className="topbar-search" style={{ width: 240, height: 30, padding: "4px 10px" }}>
              <Icon.search size={13}/>
              <input placeholder="Buscar cliente, contacto..."/>
            </div>
            <button className="btn btn-sm"><Icon.sort size={13}/></button>
            <button className="btn btn-sm"><Icon.grid size={13}/></button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 28 }}><input type="checkbox"/></th>
                <th>Cliente</th>
                <th>País</th>
                <th>Servicios</th>
                <th>MRR</th>
                <th>Total facturado</th>
                <th>Health</th>
                <th>Responsable</th>
                <th>Desde</th>
                <th>Estado</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.id} onClick={() => onOpen?.(c)} style={{ cursor: "pointer" }}>
                  <td><input type="checkbox" onClick={(e) => e.stopPropagation()}/></td>
                  <td>
                    <div className="row gap-sm">
                      <span className="avatar sm" style={{ background: "var(--bg-2)", color: "var(--ink-700)", fontSize: 10 }}>
                        {c.co.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
                      </span>
                      <div>
                        <div className="cell-strong">{c.co}</div>
                        <div className="cell-muted" style={{ fontSize: 11 }}>{c.contact} · {c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.country}</td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                      {c.svc.map((s, i) => <Badge key={i} tone="outline" className="">{s}</Badge>)}
                    </div>
                  </td>
                  <td className="cell-strong col-num">{c.mrr > 0 ? `USD ${c.mrr.toLocaleString()}` : "—"}</td>
                  <td className="col-num cell-muted">USD {c.total.toLocaleString()}</td>
                  <td><HealthBar v={c.health}/></td>
                  <td>
                    <div className="row gap-sm">
                      <Avatar name={c.lead} size="sm"/>
                      <span>{c.lead.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="cell-muted">{c.since}</td>
                  <td>
                    {c.status === "Activo" && <Badge tone="success" dot>Activo</Badge>}
                    {c.status === "Onboarding" && <Badge tone="brand" dot>Onboarding</Badge>}
                    {c.status === "Pausado" && <Badge tone="warning" dot>Pausado</Badge>}
                  </td>
                  <td><button className="icon-btn" style={{ width: 26, height: 26, background: "transparent", border: 0 }} onClick={(e) => e.stopPropagation()}><Icon.more size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, delta, tone }) {
  const tones = { success: "var(--success)", brand: "var(--primary)", warning: "var(--warning)", default: "var(--ink-300)" };
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: tones[tone] || tones.default }}/>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{delta}</div>
    </div>
  );
}

/* =============== CLIENT DETAIL DRAWER =============== */

function ClientDrawer({ client, onClose }) {
  if (!client) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div className="row gap-sm">
              <span className="cell-mono cell-muted" style={{ fontSize: 11 }}>{client.id}</span>
              <Badge tone="success" dot>Activo</Badge>
              <Badge tone="outline">Cliente desde {client.since}</Badge>
            </div>
            <div className="row gap-sm">
              <button className="icon-btn"><Icon.external size={14}/></button>
              <button className="icon-btn"><Icon.more size={14}/></button>
              <button className="icon-btn" onClick={onClose}><Icon.x size={14}/></button>
            </div>
          </div>
          <div className="row" style={{ gap: 14 }}>
            <span className="avatar lg" style={{ background: "linear-gradient(135deg,#5B5BF7,#22D3EE)", fontSize: 16 }}>
              {client.co.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
            </span>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.02em" }}>{client.co}</h2>
              <div style={{ color: "var(--ink-500)", fontSize: 13 }}>{client.contact} · {client.country} · MRR USD {client.mrr.toLocaleString()}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn btn-brand btn-sm"><Icon.message size={13}/> Mensaje</button>
            <button className="btn btn-sm"><Icon.calendar size={13}/> Agendar</button>
            <button className="btn btn-sm"><Icon.card size={13}/> Facturar</button>
            <button className="btn btn-sm"><Icon.flow size={13}/> Nuevo proyecto</button>
          </div>
        </div>

        <div className="tabs" style={{ padding: "0 24px" }}>
          <div className="tab active">Resumen</div>
          <div className="tab">Servicios <span className="badge outline">{client.svc.length}</span></div>
          <div className="tab">Proyectos <span className="badge outline">2</span></div>
          <div className="tab">Facturación</div>
          <div className="tab">Infraestructura</div>
          <div className="tab">Historial</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div className="section-title">Información general</div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "14px 18px", gap: "12px 24px" }}>
              <Field label="Empresa" value={client.co}/>
              <Field label="Contacto" value={client.contact}/>
              <Field label="Email" value="contact@" mono/>
              <Field label="Teléfono" value="+54 11 4567-8901" mono/>
              <Field label="País" value={client.country}/>
              <Field label="Industria" value="Energy & Tech"/>
            </div>
          </div>

          <div className="section-title">Servicios contratados</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
            <ServiceCard name="Software a medida" status="Activo" amount="USD 2,400/mes" icon="cube" tone="brand"/>
            <ServiceCard name="AWS — Infraestructura" status="Activo" amount="USD 380/mes" icon="server" tone="success"/>
            <ServiceCard name="SEO técnico" status="Mensual" amount="USD 600/mes" icon="trend" tone="default"/>
            <ServiceCard name="Mantenimiento" status="Recurrente" amount="USD 200/mes" icon="cog" tone="default"/>
          </div>

          <div className="section-title">Proyectos activos</div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: "10px 0" }}>
              <ProjectRow id="P-2417" name="Plataforma SaaS v2" status="En desarrollo" tone="info" pct={64} due="12 Jun" team={["Mateo López","Lucía Romero","Pablo Ferré"]}/>
              <ProjectRow id="P-2402" name="API Pública v1.0" status="En diseño" tone="brand" pct={22} due="20 Jul" team={["Mateo López","Camila Vega"]}/>
            </div>
          </div>

          <div className="section-title">Historial</div>
          <div className="card" style={{ padding: "14px 18px" }}>
            <div className="timeline">
              <TLI tone="success" who="Stripe" what="recibió pago de" obj="USD 2,400 — abril" time="hace 3d"/>
              <TLI tone="brand" who="Mateo López" what="creó proyecto" obj="API Pública v1.0" time="hace 6d"/>
              <TLI tone="default" who="HostingGuard" what="renovó SSL en" obj="helia-energy.com" time="hace 2 sem"/>
              <TLI tone="success" who="Lucía Romero" what="cerró ticket" obj="#271 — performance DB" time="hace 3 sem"/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--ink-900)", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{value}</div>
    </div>
  );
}

function ServiceCard({ name, status, amount, icon, tone }) {
  const IconC = Icon[icon];
  return (
    <div className="card" style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
      <span className="kpi-icon" style={{ width: 34, height: 34, background: tone === "brand" ? "var(--primary-soft)" : tone === "success" ? "var(--success-soft)" : "var(--bg-2)", color: tone === "brand" ? "var(--primary-700)" : tone === "success" ? "var(--success-ink)" : "var(--ink-700)" }}>
        {IconC && <IconC size={16}/>}
      </span>
      <div style={{ flex: 1 }}>
        <div className="cell-strong" style={{ fontSize: 13 }}>{name}</div>
        <div className="cell-muted" style={{ fontSize: 11.5 }}>{status} · {amount}</div>
      </div>
      <Icon.chevronRight size={14}/>
    </div>
  );
}

function ProjectRow({ id, name, status, tone, pct, due, team }) {
  return (
    <div className="row" style={{ padding: "10px 18px", gap: 12, borderBottom: "1px solid var(--border-soft)" }}>
      <span className="cell-mono" style={{ fontSize: 10.5, color: "var(--ink-400)", width: 50 }}>{id}</span>
      <div style={{ flex: 1 }}>
        <div className="cell-strong" style={{ fontSize: 13 }}>{name}</div>
        <div className="cell-muted" style={{ fontSize: 11.5 }}>Deadline {due}</div>
      </div>
      <Badge tone={tone}>{status}</Badge>
      <div style={{ width: 90 }}><Progress value={pct} tone="brand"/></div>
      <AvatarGroup names={team} size="sm"/>
    </div>
  );
}

function TLI({ tone, who, what, obj, time }) {
  return (
    <div className="timeline-item">
      <span className={`timeline-dot ${tone}`}><Icon.dot size={6}/></span>
      <div className="timeline-content">
        <span className="who">{who}</span> {what} <span style={{ color: "var(--ink-900)", fontWeight: 500 }}>{obj}</span>
        <div className="timeline-meta">{time}</div>
      </div>
    </div>
  );
}



const PROJ_KANBAN = {
  "Pendiente": { color: "#9CA3AF", items: [
    { id: "P-2391", client: "Lumen Salud", name: "Landing + Ads", svc: "Web", lead: "Lucía Romero", team: ["Lucía Romero","Pablo Ferré"], due: "8 Jun", pri: "med" },
    { id: "P-2388", client: "Veleta Wines", name: "Branding inicial", svc: "Branding", lead: "Camila Vega", team: ["Camila Vega"], due: "15 Jun", pri: "low" },
  ]},
  "En diseño": { color: "#A78BFA", items: [
    { id: "P-2408", client: "Calá Inmobiliaria", name: "Web institucional v2", svc: "Web", lead: "Pablo Ferré", team: ["Pablo Ferré","Camila Vega"], due: "5 Jun", pri: "high", pct: 32 },
    { id: "P-2402", client: "Helia Energy", name: "API Pública v1.0", svc: "Software", lead: "Mateo López", team: ["Mateo López","Camila Vega"], due: "20 Jul", pri: "med", pct: 22 },
  ]},
  "En desarrollo": { color: "#5B5BF7", items: [
    { id: "P-2417", client: "Helia Energy", name: "Plataforma SaaS v2", svc: "Software", lead: "Mateo López", team: ["Mateo López","Lucía Romero","Pablo Ferré"], due: "12 Jun", pri: "urg", pct: 64 },
    { id: "P-2410", client: "Norte Films", name: "Catálogo plataforma", svc: "Plataforma", lead: "Lucía Romero", team: ["Lucía Romero","Diego Salas"], due: "30 Jun", pri: "med", pct: 48 },
    { id: "P-2405", client: "Mira Cosmetics", name: "E-commerce migration", svc: "E-commerce", lead: "Pablo Ferré", team: ["Pablo Ferré"], due: "10 Jun", pri: "high", pct: 71 },
  ]},
  "Revisión": { color: "#F59E0B", items: [
    { id: "P-2412", client: "Tessera Joyas", name: "E-commerce Shopify", svc: "E-commerce", lead: "Lucía Romero", team: ["Lucía Romero","Pablo Ferré"], due: "29 May", pri: "urg", pct: 88 },
    { id: "P-2406", client: "Bauer & Co", name: "Web corporativa", svc: "Web", lead: "Camila Vega", team: ["Camila Vega"], due: "31 May", pri: "high", pct: 92 },
  ]},
  "Entregado": { color: "#10B981", items: [
    { id: "P-2399", client: "Borealis Tours", name: "Hosting + SSL", svc: "Hosting", lead: "Diego Salas", team: ["Diego Salas"], due: "—", pri: "low", pct: 100 },
    { id: "P-2395", client: "Klein Studio", name: "Rediseño web", svc: "Web", lead: "Camila Vega", team: ["Camila Vega","Pablo Ferré"], due: "—", pri: "med", pct: 100 },
  ]},
  "Mantenimiento": { color: "#4B5363", items: [
    { id: "P-2404", client: "Klein Studio", name: "SEO + Redes mensual", svc: "SEO", lead: "Camila Vega", team: ["Camila Vega"], due: "Recurr.", pri: "low", pct: 100 },
    { id: "P-2390", client: "Borealis Tours", name: "Mantenimiento web", svc: "Mant.", lead: "Diego Salas", team: ["Diego Salas"], due: "Recurr.", pri: "low", pct: 100 },
  ]},
};

function Projects() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Proyectos</h1>
          <p>23 activos · 6 en revisión · 2 atrasados</p>
        </div>
        <div className="row gap-sm">
          <div className="tabs" style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="tab active">Kanban</div>
            <div className="tab">Tabla</div>
            <div className="tab">Timeline</div>
            <div className="tab">Calendario</div>
          </div>
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo proyecto</button>
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div className="kanban">
          {Object.entries(PROJ_KANBAN).map(([name, col]) => (
            <div key={name} className="kanban-col">
              <div className="kanban-col-head">
                <div className="h">
                  <span className="stagebar" style={{ background: col.color }}/>
                  {name}
                  <span className="pipeline-col-head" style={{ display: "inline" }}>
                    <span className="count" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 999, fontSize: 11, color: "var(--ink-600)" }}>{col.items.length}</span>
                  </span>
                </div>
                <button className="icon-btn" style={{ width: 22, height: 22, background: "transparent", border: 0 }}><Icon.plus size={13}/></button>
              </div>
              {col.items.map((it) => (
                <div key={it.id} className="k-card">
                  <div className="row between">
                    <span className="k-id">{it.id}</span>
                    <Priority level={it.pri}/>
                  </div>
                  <div className="k-title">{it.name}</div>
                  <div className="row gap-sm">
                    <span className="k-tag">{it.svc}</span>
                    <span className="cell-muted" style={{ fontSize: 11 }}>{it.client}</span>
                  </div>
                  {it.pct != null && it.pct < 100 && (
                    <div style={{ marginTop: 2 }}><Progress value={it.pct} tone="brand"/></div>
                  )}
                  <div className="k-foot">
                    <div className="row gap-sm">
                      <Icon.calendar size={11}/>
                      <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{it.due}</span>
                    </div>
                    <AvatarGroup names={it.team} size="sm" extra={it.team.length > 3 ? it.team.length - 3 : 0}/>
                  </div>
                </div>
              ))}
              <button className="btn btn-sm btn-ghost" style={{ justifyContent: "flex-start", width: "100%" }}><Icon.plus size={12}/> Añadir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== TASKS — Linear-style ============== */

const TASK_COLS = {
  "Backlog": { color: "#9CA3AF", items: [
    { id: "INS-412", title: "Refactor del módulo de facturación recurrente", client: "Helia Energy", svc: "Software", pri: "med", due: "—", asn: "Mateo López", labels: ["backend","billing"] },
    { id: "INS-410", title: "Auditar Lighthouse y mejorar TBT en mobile", client: "Calá Inmobiliaria", svc: "Web", pri: "low", due: "—", asn: "Camila Vega", labels: ["perf"] },
    { id: "INS-406", title: "Reescribir guías de onboarding del Lab IA", client: "Internal", svc: "Lab", pri: "low", due: "—", asn: "Lucía Romero", labels: ["docs","internal"] },
  ]},
  "Todo": { color: "#5B5BF7", items: [
    { id: "INS-419", title: "Mockups landing Lumen Salud — versión médicos", client: "Lumen Salud", svc: "Web", pri: "high", due: "27 May", asn: "Pablo Ferré", labels: ["design"] },
    { id: "INS-418", title: "Configurar dominio + SSL para tessera-joyas.com", client: "Tessera Joyas", svc: "Hosting", pri: "urg", due: "Hoy", asn: "Diego Salas", labels: ["devops"] },
    { id: "INS-417", title: "Setup pipeline CI para nuevo repo API Pública", client: "Helia Energy", svc: "Software", pri: "med", due: "29 May", asn: "Mateo López", labels: ["devops","ci"] },
  ]},
  "In progress": { color: "#22D3EE", items: [
    { id: "INS-421", title: "Migración productos Shopify desde CSV", client: "Tessera Joyas", svc: "E-commerce", pri: "urg", due: "26 May", asn: "Lucía Romero", labels: ["migration"] },
    { id: "INS-420", title: "Implementar dashboard admin de la SaaS v2", client: "Helia Energy", svc: "Software", pri: "high", due: "5 Jun", asn: "Pablo Ferré", labels: ["frontend","admin"] },
    { id: "INS-415", title: "Calendario de contenido mayo + reels guion", client: "Klein Studio", svc: "Redes", pri: "med", due: "28 May", asn: "Camila Vega", labels: ["content"] },
  ]},
  "Review": { color: "#F59E0B", items: [
    { id: "INS-423", title: "Cierre QA pago con Stripe — Tessera", client: "Tessera Joyas", svc: "E-commerce", pri: "urg", due: "27 May", asn: "Pablo Ferré", labels: ["qa","payments"] },
    { id: "INS-414", title: "Revisión copy nueva home Bauer & Co", client: "Bauer & Co", svc: "Web", pri: "med", due: "29 May", asn: "Camila Vega", labels: ["copy"] },
  ]},
  "Done": { color: "#10B981", items: [
    { id: "INS-413", title: "Optimización imágenes home Klein", client: "Klein Studio", svc: "Web", pri: "low", due: "—", asn: "Camila Vega", labels: ["perf"] },
    { id: "INS-409", title: "Renovación SSL Borealis Tours", client: "Borealis Tours", svc: "Hosting", pri: "med", due: "—", asn: "Diego Salas", labels: ["ssl"] },
  ]},
  "Cancelled": { color: "#6B7280", items: [
    { id: "INS-401", title: "Migrar Norte Films a Wasabi (pausado)", client: "Norte Films", svc: "Plataforma", pri: "low", due: "—", asn: "Diego Salas", labels: ["paused"] },
  ]},
};

function Tasks() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tareas</h1>
          <p>32 abiertas · 6 mías · 4 vencen hoy</p>
        </div>
        <div className="row gap-sm">
          <div className="tabs" style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="tab active">Board</div>
            <div className="tab">List</div>
            <div className="tab">Mías <span className="badge brand">6</span></div>
          </div>
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nueva tarea</button>
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div className="kanban">
          {Object.entries(TASK_COLS).map(([name, col]) => (
            <div key={name} className="kanban-col">
              <div className="kanban-col-head">
                <div className="h">
                  <span className="stagebar" style={{ background: col.color }}/>
                  {name}
                  <span style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 999, fontSize: 11, color: "var(--ink-600)" }}>{col.items.length}</span>
                </div>
                <button className="icon-btn" style={{ width: 22, height: 22, background: "transparent", border: 0 }}><Icon.plus size={13}/></button>
              </div>
              {col.items.map((it) => (
                <div key={it.id} className="k-card">
                  <div className="row between">
                    <span className="k-id">{it.id}</span>
                    <Priority level={it.pri}/>
                  </div>
                  <div className="k-title">{it.title}</div>
                  <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                    {it.labels.map((l, i) => <span key={i} className="k-tag">{l}</span>)}
                  </div>
                  <div className="row gap-sm">
                    <Icon.building size={11}/>
                    <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{it.client}</span>
                  </div>
                  <div className="k-foot">
                    <div className="row gap-sm">
                      <Icon.calendar size={11}/>
                      <span style={{ fontSize: 11, color: it.due === "Hoy" ? "var(--danger-ink)" : "var(--ink-500)", fontWeight: it.due === "Hoy" ? 600 : 400 }}>{it.due}</span>
                    </div>
                    <Avatar name={it.asn} size="sm"/>
                  </div>
                </div>
              ))}
              <button className="btn btn-sm btn-ghost" style={{ justifyContent: "flex-start", width: "100%" }}><Icon.plus size={12}/> Añadir tarea</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



const SERVICES = [
  { name: "Desarrollo web", icon: "globe", color: "#5B5BF7", count: 18, mrr: 6480, ytd: 78400, churn: 1.2, clients: ["Helia Energy","Calá Inmobiliaria","Klein Studio","Bauer & Co","+14"] },
  { name: "Software a medida", icon: "cube", color: "#A78BFA", count: 6, mrr: 9800, ytd: 142000, churn: 0, clients: ["Helia Energy","Helix Robotics","Norte Films","+3"] },
  { name: "SEO", icon: "trend", color: "#22D3EE", count: 12, mrr: 5200, ytd: 58200, churn: 4.1, clients: ["Klein Studio","Lumen Salud","Mira Cosmetics","+9"] },
  { name: "Redes sociales", icon: "sparkles", color: "#F472B6", count: 9, mrr: 4100, ytd: 41800, churn: 2.8, clients: ["Klein Studio","Mira Cosmetics","Aurora Café","+6"] },
  { name: "Hosting", icon: "server", color: "#10B981", count: 24, mrr: 2200, ytd: 25400, churn: 0.4, clients: ["Borealis","Tessera","Klein","+21"] },
  { name: "VPS gestionado", icon: "server", color: "#0EA5E9", count: 8, mrr: 1680, ytd: 18900, churn: 0, clients: ["Helia","Norte Films","+6"] },
  { name: "AWS Infra", icon: "shield", color: "#F59E0B", count: 4, mrr: 1400, ytd: 16200, churn: 0, clients: ["Helia Energy","Helix Robotics","+2"] },
  { name: "Mantenimiento", icon: "cog", color: "#6B7280", count: 22, mrr: 1320, ytd: 14200, churn: 1.8, clients: ["Recurrentes","+22"] },
];

function Services() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Servicios</h1>
          <p>8 categorías · 103 servicios contratados · USD 32,180 MRR</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo servicio</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SvcStat label="MRR total" value="32,180" unit="USD" delta="+8.2%" tone="brand"/>
        <SvcStat label="Servicios activos" value="103" delta="+6 este mes" tone="success"/>
        <SvcStat label="Churn promedio" value="1.4" unit="%" delta="−0.3pp" tone="success"/>
        <SvcStat label="LTV promedio" value="14,820" unit="USD" delta="+12%" tone="info"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        {SERVICES.map((s) => {
          const IconC = Icon[s.icon];
          return (
            <div key={s.name} className="card" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: s.color, opacity: .08 }}/>
              <div className="row between" style={{ marginBottom: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "22", color: s.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {IconC && <IconC size={18}/>}
                </span>
                <button className="icon-btn" style={{ width: 22, height: 22, background: "transparent", border: 0 }}><Icon.more size={14}/></button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{s.name}</div>
              <div className="row between" style={{ marginTop: 10, alignItems: "baseline" }}>
                <div>
                  <div className="cell-muted" style={{ fontSize: 11 }}>Clientes</div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{s.count}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="cell-muted" style={{ fontSize: 11 }}>MRR</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>USD {s.mrr.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-500)" }}>
                <span>YTD <span style={{ color: "var(--ink-800)", fontWeight: 500 }}>USD {s.ytd.toLocaleString()}</span></span>
                <span>Churn <span style={{ color: s.churn < 2 ? "var(--success-ink)" : "var(--warning-ink)", fontWeight: 500 }}>{s.churn}%</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Todos los servicios contratados</div>
          <div className="row gap-sm">
            <div className="topbar-search" style={{ width: 240, height: 30, padding: "4px 10px" }}>
              <Icon.search size={13}/>
              <input placeholder="Buscar servicio o cliente..."/>
            </div>
            <button className="btn btn-sm"><Icon.sort size={13}/></button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Cliente</th>
              <th>Plan</th>
              <th>Monto</th>
              <th>Próxima factura</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th style={{ width: 28 }}></th>
            </tr>
          </thead>
          <tbody>
            {SVC_ROWS.map((r, i) => (
              <tr key={i}>
                <td>
                  <div className="row gap-sm">
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: r.color + "22", color: r.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {React.createElement(Icon[r.icon], { size: 14 })}
                    </span>
                    <div>
                      <div className="cell-strong">{r.svc}</div>
                      <div className="cell-muted" style={{ fontSize: 11 }}>{r.detail}</div>
                    </div>
                  </div>
                </td>
                <td className="cell-strong">{r.client}</td>
                <td><Badge tone="outline">{r.plan}</Badge></td>
                <td className="col-num cell-strong">USD {r.amount.toLocaleString()}<span className="cell-muted" style={{ fontWeight: 400, fontSize: 11 }}>/{r.unit}</span></td>
                <td className="cell-muted col-num">{r.next}</td>
                <td>
                  <div className="row gap-sm">
                    <Avatar name={r.who} size="sm"/>
                    <span>{r.who.split(" ")[0]}</span>
                  </div>
                </td>
                <td>
                  {r.status === "Activo" && <Badge tone="success" dot>Activo</Badge>}
                  {r.status === "Trial" && <Badge tone="brand" dot>Trial</Badge>}
                  {r.status === "Pausado" && <Badge tone="warning" dot>Pausado</Badge>}
                </td>
                <td><button className="icon-btn" style={{ width: 26, height: 26, background: "transparent", border: 0 }}><Icon.more size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SVC_ROWS = [
  { svc: "Plataforma SaaS Helia", detail: "Software a medida + AWS", client: "Helia Energy", plan: "Enterprise", amount: 2400, unit: "mes", next: "1 Jun", who: "Mateo López", status: "Activo", icon: "cube", color: "#A78BFA" },
  { svc: "E-commerce Shopify", detail: "Tienda + integraciones", client: "Tessera Joyas", plan: "Setup", amount: 4500, unit: "único", next: "26 May", who: "Lucía Romero", status: "Activo", icon: "globe", color: "#5B5BF7" },
  { svc: "SEO técnico mensual", detail: "Auditoría + contenido", client: "Klein Studio", plan: "Growth", amount: 600, unit: "mes", next: "3 Jun", who: "Camila Vega", status: "Activo", icon: "trend", color: "#22D3EE" },
  { svc: "Hosting AWS gestionado", detail: "EC2 + RDS + CloudFront", client: "Klein Studio", plan: "Pro", amount: 380, unit: "mes", next: "28 May", who: "Diego Salas", status: "Activo", icon: "server", color: "#F59E0B" },
  { svc: "Redes sociales", detail: "IG + TikTok content", client: "Mira Cosmetics", plan: "Premium", amount: 1800, unit: "mes", next: "1 Jun", who: "Camila Vega", status: "Activo", icon: "sparkles", color: "#F472B6" },
  { svc: "Web institucional", detail: "Next.js + Sanity CMS", client: "Calá Inmobiliaria", plan: "Setup", amount: 6800, unit: "único", next: "—", who: "Pablo Ferré", status: "Activo", icon: "globe", color: "#5B5BF7" },
  { svc: "Mantenimiento", detail: "Soporte 5h/mes", client: "Borealis Tours", plan: "Starter", amount: 180, unit: "mes", next: "1 Jun", who: "Diego Salas", status: "Activo", icon: "cog", color: "#6B7280" },
  { svc: "VPS dedicado", detail: "Hetzner CX42", client: "Norte Films", plan: "Pro", amount: 240, unit: "mes", next: "—", who: "Diego Salas", status: "Pausado", icon: "server", color: "#0EA5E9" },
  { svc: "Ads management", detail: "Google + Meta Ads", client: "Lumen Salud", plan: "Trial", amount: 850, unit: "mes", next: "30 May", who: "Pablo Ferré", status: "Trial", icon: "rocket", color: "#EF4444" },
];

function SvcStat({ label, value, unit, delta, tone }) {
  const tones = { brand: "var(--primary)", success: "var(--success)", info: "var(--info)", warning: "var(--warning)" };
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: tones[tone] || "var(--ink-300)" }}/>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        {value} {unit && <span style={{ fontSize: 13, color: "var(--ink-400)", fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--success-ink)", marginTop: 2, fontWeight: 500 }}>{delta}</div>
    </div>
  );
}



const INVOICES = [
  { id: "INV-2026-0118", client: "Helia Energy", svc: "Plataforma + AWS · Mayo", amount: 2780, due: "1 Jun", status: "Pendiente", emitted: "1 May" },
  { id: "INV-2026-0117", client: "Klein Studio", svc: "SEO + Hosting · Mayo", amount: 980, due: "28 May", status: "Atrasado", emitted: "1 May" },
  { id: "INV-2026-0116", client: "Tessera Joyas", svc: "E-commerce Setup", amount: 4500, due: "26 May", status: "Pagado", emitted: "5 May" },
  { id: "INV-2026-0115", client: "Mira Cosmetics", svc: "Redes + Ads · Mayo", amount: 2650, due: "1 Jun", status: "Pendiente", emitted: "1 May" },
  { id: "INV-2026-0114", client: "Bauer & Co", svc: "Web corporativa · Hito 2", amount: 3400, due: "—", status: "Pagado", emitted: "20 Abr" },
  { id: "INV-2026-0113", client: "Calá Inmobiliaria", svc: "Plataforma · Hito 1", amount: 2800, due: "30 May", status: "Pendiente", emitted: "30 Abr" },
  { id: "INV-2026-0112", client: "Borealis Tours", svc: "Hosting + Mantenimiento", amount: 380, due: "—", status: "Pagado", emitted: "18 Abr" },
  { id: "INV-2026-0111", client: "Helix Robotics", svc: "Software · Hito 3", amount: 8400, due: "—", status: "Pagado", emitted: "15 Abr" },
  { id: "INV-2026-0110", client: "Lumen Salud", svc: "Ads + Setup", amount: 850, due: "5 Jun", status: "Borrador", emitted: "—" },
  { id: "INV-2026-0109", client: "Forge Legal", svc: "Setup inicial", amount: 2400, due: "20 May", status: "Atrasado", emitted: "10 Abr" },
];

function Billing() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Facturación</h1>
          <p>Mayo 2026 · 18 facturas emitidas · USD 28,140 cobrados</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Mayo 2026 <Icon.chevronDown size={12}/></button>
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nueva factura</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <BillStat label="Ingresos del mes" value="86,420" delta="+24% vs Abril" tone="brand"/>
        <BillStat label="Ingresos recurrentes (MRR)" value="32,180" delta="+8.2%" tone="success"/>
        <BillStat label="Pagos pendientes" value="14,580" delta="6 facturas" tone="warning"/>
        <BillStat label="Atrasados" value="3,380" delta="2 facturas" tone="danger"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.7fr 1fr", marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cashflow · últimos 12 meses</div>
            <div className="row gap-sm">
              <Badge tone="brand" dot>Facturado</Badge>
              <Badge tone="success" dot>Cobrado</Badge>
              <Badge tone="warning" dot>Pendiente</Badge>
            </div>
          </div>
          <div className="card-body">
            <CashflowChart/>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Mix de ingresos · mayo</div>
          </div>
          <div className="card-body">
            <DonutMix/>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ border: 0, padding: 0, margin: "-4px 0" }}>
            <div className="tab active">Todas <span className="badge outline">126</span></div>
            <div className="tab">Pendientes <span className="badge warning">6</span></div>
            <div className="tab">Atrasadas <span className="badge danger">2</span></div>
            <div className="tab">Pagadas <span className="badge success">114</span></div>
            <div className="tab">Borradores <span className="badge outline">4</span></div>
          </div>
          <div className="row gap-sm">
            <div className="topbar-search" style={{ width: 240, height: 30, padding: "4px 10px" }}>
              <Icon.search size={13}/>
              <input placeholder="Buscar factura, cliente..."/>
            </div>
            <button className="btn btn-sm"><Icon.filter size={13}/></button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Emitida</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td><span className="cell-mono" style={{ color: "var(--ink-900)", fontWeight: 500 }}>{inv.id}</span></td>
                <td className="cell-strong">{inv.client}</td>
                <td className="cell-muted">{inv.svc}</td>
                <td className="cell-strong col-num">USD {inv.amount.toLocaleString()}</td>
                <td className="cell-muted col-num">{inv.emitted}</td>
                <td className={`col-num ${inv.status === "Atrasado" ? "" : "cell-muted"}`} style={{ color: inv.status === "Atrasado" ? "var(--danger-ink)" : undefined, fontWeight: inv.status === "Atrasado" ? 600 : undefined }}>{inv.due}</td>
                <td>
                  {inv.status === "Pagado" && <Badge tone="success" dot>Pagado</Badge>}
                  {inv.status === "Pendiente" && <Badge tone="warning" dot>Pendiente</Badge>}
                  {inv.status === "Atrasado" && <Badge tone="danger" dot>Atrasado</Badge>}
                  {inv.status === "Borrador" && <Badge tone="outline" dot>Borrador</Badge>}
                </td>
                <td>
                  <div className="row gap-sm">
                    <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon.download size={13}/></button>
                    <button className="icon-btn" style={{ width: 26, height: 26, background: "transparent", border: 0 }}><Icon.more size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillStat({ label, value, delta, tone }) {
  const tones = { brand: "var(--primary)", success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)" };
  const inks = { brand: "var(--primary-700)", success: "var(--success-ink)", warning: "var(--warning-ink)", danger: "var(--danger-ink)" };
  return (
    <div className="card" style={{ padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: tones[tone] }}/>
      <div className="row between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        USD <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div style={{ fontSize: 11.5, color: inks[tone], marginTop: 2, fontWeight: 500 }}>{delta}</div>
    </div>
  );
}

function CashflowChart() {
  const months = ["Jun","Jul","Ago","Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr","May"];
  const billed = [38,42,46,52,48,58,42,51,58,67,74,86];
  const paid   = [34,40,43,49,45,55,40,48,55,63,68,72];
  const W = 720, H = 220, P = 28;
  const max = 100;
  const bw = (W - P * 2) / months.length - 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={P} x2={W - P} y1={H - P - (g / max) * (H - P * 2)} y2={H - P - (g / max) * (H - P * 2)} stroke="#EEF0F3"/>
          <text x={P - 8} y={H - P - (g / max) * (H - P * 2) + 3} textAnchor="end" fontSize="10" fill="#98A0AE">{g}k</text>
        </g>
      ))}
      {months.map((m, i) => {
        const x = P + i * ((W - P * 2) / months.length) + 3;
        const yB = H - P - (billed[i] / max) * (H - P * 2);
        const yP = H - P - (paid[i] / max) * (H - P * 2);
        return (
          <g key={i}>
            <rect x={x} y={yB} width={bw * .45} height={H - P - yB} rx={2} fill="#E1E4E9"/>
            <rect x={x + bw * .5} y={yP} width={bw * .45} height={H - P - yP} rx={2} fill="#5B5BF7"/>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#6B7280">{m}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutMix() {
  const slices = [
    { name: "Software", v: 38, c: "#A78BFA" },
    { name: "Web", v: 22, c: "#5B5BF7" },
    { name: "E-commerce", v: 14, c: "#22D3EE" },
    { name: "SEO", v: 9, c: "#10B981" },
    { name: "Hosting", v: 8, c: "#F59E0B" },
    { name: "Redes", v: 6, c: "#F472B6" },
    { name: "Otros", v: 3, c: "#9CA3AF" },
  ];
  const total = slices.reduce((a, s) => a + s.v, 0);
  const R = 70, r = 50, CX = 90, CY = 90;
  let a0 = -Math.PI / 2;
  const arcs = slices.map((s) => {
    const a1 = a0 + (s.v / total) * Math.PI * 2;
    const x0 = CX + Math.cos(a0) * R, y0 = CY + Math.sin(a0) * R;
    const x1 = CX + Math.cos(a1) * R, y1 = CY + Math.sin(a1) * R;
    const xi0 = CX + Math.cos(a0) * r, yi0 = CY + Math.sin(a0) * r;
    const xi1 = CX + Math.cos(a1) * r, yi1 = CY + Math.sin(a1) * r;
    const lg = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${x0},${y0} A${R},${R} 0 ${lg} 1 ${x1},${y1} L${xi1},${yi1} A${r},${r} 0 ${lg} 0 ${xi0},${yi0} Z`;
    a0 = a1;
    return { d, ...s };
  });
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.c}/>)}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="11" fill="#6B7280">Total</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="16" fontWeight="600" fill="#0B0D12" fontFamily="var(--font-display)">86.4k</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {slices.map((s) => (
          <div key={s.name} className="row between" style={{ fontSize: 12.5 }}>
            <span className="row gap-sm"><span style={{ width: 8, height: 8, borderRadius: 2, background: s.c }}/> {s.name}</span>
            <span style={{ color: "var(--ink-500)", fontVariantNumeric: "tabular-nums" }}>{s.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}



const DEPLOYS = [
  { status: "live", domain: "helia-energy.app", svc: "Plataforma SaaS · Next.js", client: "Helia Energy", branch: "main", build: "2m 14s", uptime: "99.99%", ssl: "Valid · 78d", cpu: 32, mem: 58 },
  { status: "live", domain: "tessera-joyas.com", svc: "E-commerce · Shopify Hydrogen", client: "Tessera Joyas", branch: "main", build: "1m 48s", uptime: "99.97%", ssl: "Valid · 42d", cpu: 12, mem: 22 },
  { status: "warn", domain: "lumen-salud.com", svc: "Landing · Astro", client: "Lumen Salud", branch: "main", build: "42s", uptime: "99.82%", ssl: "Expira 12d", cpu: 8, mem: 18 },
  { status: "live", domain: "klein-studio.io", svc: "Portfolio · Next.js", client: "Klein Studio", branch: "main", build: "1m 06s", uptime: "100%", ssl: "Valid · 90d", cpu: 4, mem: 12 },
  { status: "live", domain: "cala-propiedades.com", svc: "Plataforma · Remix", client: "Calá Inmobiliaria", branch: "main", build: "3m 02s", uptime: "99.94%", ssl: "Valid · 156d", cpu: 18, mem: 34 },
  { status: "down", domain: "norte-films.tv", svc: "Catálogo · Sveltekit", client: "Norte Films", branch: "staging", build: "Failed", uptime: "—", ssl: "—", cpu: 0, mem: 0 },
  { status: "live", domain: "borealis-tours.com", svc: "Web · Astro", client: "Borealis Tours", branch: "main", build: "38s", uptime: "99.99%", ssl: "Valid · 64d", cpu: 2, mem: 8 },
  { status: "live", domain: "helix-robotics.io", svc: "Software · Node API", client: "Helix Robotics", branch: "main", build: "2m 48s", uptime: "99.98%", ssl: "Valid · 112d", cpu: 44, mem: 62 },
  { status: "live", domain: "mira-cosmetics.com", svc: "Shopify Plus", client: "Mira Cosmetics", branch: "main", build: "1m 12s", uptime: "99.95%", ssl: "Valid · 88d", cpu: 22, mem: 28 },
];

const LOGS = [
  { t: "12:42:08", lv: "INFO", svc: "tessera-joyas.com", msg: "Build #1284 succeeded · deployed to production" },
  { t: "12:38:47", lv: "WARN", svc: "lumen-salud.com", msg: "SSL certificate expires in 12 days · auto-renew scheduled" },
  { t: "12:34:21", lv: "ERROR", svc: "norte-films.tv", msg: "Build failed · TypeError in catalog/loader.ts:42" },
  { t: "12:18:55", lv: "INFO", svc: "helia-energy.app", msg: "Deploy #2418 · main@a4f1e2c → production" },
  { t: "11:54:02", lv: "INFO", svc: "klein-studio.io", msg: "Health check OK · response 84ms" },
  { t: "11:32:18", lv: "INFO", svc: "cala-propiedades.com", msg: "Cache invalidated · 132 keys purged" },
  { t: "10:48:09", lv: "WARN", svc: "helia-energy.app", msg: "DB CPU spike · 78% sustained 4min" },
  { t: "10:18:21", lv: "INFO", svc: "borealis-tours.com", msg: "Sitemap regenerated · 218 URLs" },
];

function HostingGuard() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="row gap-sm"><Icon.shield size={22} stroke={1.8}/> HostingGuard</h1>
          <p>Panel interno · 124 deployments · 9 dominios primarios · región AR + US-East</p>
        </div>
        <div className="row gap-sm">
          <Badge tone="success" dot>Todos los sistemas operando</Badge>
          <button className="btn"><Icon.history size={14}/> Audit log</button>
          <button className="btn btn-brand"><Icon.rocket size={14}/> Nuevo deploy</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 16 }}>
        <HgStat label="Deployments activos" value="124" trend="up" delta="+12 hoy" icon="rocket" tone="brand"/>
        <HgStat label="Uptime medio (30d)" value="99.94%" trend="up" delta="+0.02pp" icon="pulse" tone="success"/>
        <HgStat label="SSL próximos a expirar" value="3" trend="flat" delta="auto-renew" icon="shield" tone="warning"/>
        <HgStat label="Builds (24h)" value="42" trend="up" delta="2 failed" icon="bolt" tone="info"/>
        <HgStat label="Bandwidth (mes)" value="412" unit="GB" delta="68% del límite" icon="globe" tone="default"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tráfico · últimas 24h</div>
            <div className="row gap-sm">
              <Badge tone="brand" dot>Requests</Badge>
              <Badge tone="cyan" dot>Bandwidth</Badge>
            </div>
          </div>
          <div className="card-body">
            <TrafficChart/>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Uso de recursos</div>
            <span className="cell-muted" style={{ fontSize: 11 }}>Promedio fleet</span>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Resource name="CPU" value={36} max="64 vCPU" color="#5B5BF7"/>
            <Resource name="RAM" value={48} max="128 GB" color="#22D3EE"/>
            <Resource name="Storage" value={28} max="2 TB" color="#10B981"/>
            <Resource name="Egress" value={68} max="600 GB/mes" color="#F59E0B"/>
            <Resource name="Builds" value={42} max="200/mes" color="#A78BFA"/>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Deployments activos</div>
          <div className="row gap-sm">
            <div className="topbar-search" style={{ width: 240, height: 30, padding: "4px 10px" }}>
              <Icon.search size={13}/>
              <input placeholder="Buscar dominio o cliente..."/>
            </div>
            <button className="btn btn-sm"><Icon.filter size={13}/> Filtros</button>
          </div>
        </div>
        <div>
          <div className="hg-row hg-head">
            <span/>
            <span>Dominio · Servicio</span>
            <span>Cliente · Branch</span>
            <span>Último build</span>
            <span>Uptime</span>
            <span>SSL</span>
            <span>Recursos (CPU/RAM)</span>
            <span/>
          </div>
          {DEPLOYS.map((d) => (
            <div key={d.domain} className="hg-row">
              <span className={`status-dot ${d.status}`}/>
              <div>
                <div className="cell-strong cell-mono" style={{ fontSize: 12.5 }}>{d.domain}</div>
                <div className="cell-muted" style={{ fontSize: 11.5 }}>{d.svc}</div>
              </div>
              <div>
                <div className="cell-strong" style={{ fontSize: 13 }}>{d.client}</div>
                <div className="cell-muted cell-mono" style={{ fontSize: 11 }}>{d.branch}</div>
              </div>
              <div>
                <div className={`cell-mono ${d.build === "Failed" ? "" : "cell-strong"}`} style={{ fontSize: 12.5, color: d.build === "Failed" ? "var(--danger-ink)" : undefined, fontWeight: d.build === "Failed" ? 600 : undefined }}>{d.build}</div>
                <div className="cell-muted" style={{ fontSize: 11 }}>hace 12 min</div>
              </div>
              <div className="col-num cell-strong" style={{ fontSize: 13 }}>{d.uptime}</div>
              <div>
                {d.ssl === "—" ? <span className="cell-muted">—</span> :
                  d.ssl.startsWith("Expira") ? <Badge tone="warning" dot>{d.ssl}</Badge> : <span style={{ fontSize: 12, color: "var(--success-ink)" }}>● {d.ssl}</span>}
              </div>
              <MiniGauges cpu={d.cpu} mem={d.mem}/>
              <button className="icon-btn" style={{ width: 26, height: 26, background: "transparent", border: 0 }}><Icon.more size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Logs en vivo</div>
            <div className="row gap-sm">
              <Badge tone="success" dot>Stream activo</Badge>
              <button className="btn btn-sm btn-ghost"><Icon.filter size={13}/> Filtrar</button>
              <button className="btn btn-sm btn-ghost"><Icon.download size={13}/></button>
            </div>
          </div>
          <div style={{ background: "#0E0F13", color: "#D6D9E1", fontFamily: "var(--font-mono)", fontSize: 12, padding: "14px 18px", borderRadius: "0 0 var(--r-lg) var(--r-lg)" }}>
            {LOGS.map((l, i) => (
              <div key={i} style={{ padding: "3px 0", display: "flex", gap: 12 }}>
                <span style={{ color: "#5C626F" }}>{l.t}</span>
                <span style={{ color: l.lv === "ERROR" ? "#F87171" : l.lv === "WARN" ? "#FCD34D" : "#86EFAC", width: 50 }}>{l.lv}</span>
                <span style={{ color: "#A78BFA", width: 180 }}>{l.svc}</span>
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">SSL & Dominios</div>
            <button className="btn btn-sm btn-ghost">Ver todos</button>
          </div>
          <div style={{ padding: "4px 0" }}>
            <SslRow domain="lumen-salud.com" days={12} tone="warning"/>
            <SslRow domain="tessera-joyas.com" days={42} tone="default"/>
            <SslRow domain="cala-propiedades.com" days={156} tone="default"/>
            <SslRow domain="borealis-tours.com" days={64} tone="default"/>
            <SslRow domain="helia-energy.app" days={78} tone="default"/>
            <SslRow domain="klein-studio.io" days={90} tone="default"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function HgStat({ label, value, unit, delta, icon, tone }) {
  const IconC = Icon[icon];
  const tones = { brand: "var(--primary)", success: "var(--success)", warning: "var(--warning)", info: "var(--info)", default: "var(--ink-500)" };
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--bg-2)", color: tones[tone], display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {IconC && <IconC size={13}/>}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        {value} {unit && <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{delta}</div>
    </div>
  );
}

function Resource({ name, value, max, color }) {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: "var(--ink-700)", fontWeight: 500 }}>{name}</span>
        <span style={{ color: "var(--ink-500)", fontVariantNumeric: "tabular-nums" }}>{value}% <span style={{ color: "var(--ink-400)" }}>· {max}</span></span>
      </div>
      <div style={{ height: 6, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: value + "%", background: color, borderRadius: 999 }}/>
      </div>
    </div>
  );
}

function MiniGauges({ cpu, mem }) {
  return (
    <div className="row gap-sm" style={{ alignItems: "center", fontSize: 11 }}>
      <span style={{ width: 28, color: "var(--ink-500)" }}>CPU</span>
      <div style={{ flex: 1, height: 4, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: cpu + "%", background: cpu > 70 ? "var(--danger)" : cpu > 40 ? "var(--warning)" : "var(--primary)" }}/>
      </div>
      <span style={{ width: 24, color: "var(--ink-700)", fontVariantNumeric: "tabular-nums" }}>{cpu}%</span>
      <span style={{ width: 28, color: "var(--ink-500)" }}>MEM</span>
      <div style={{ flex: 1, height: 4, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: mem + "%", background: mem > 70 ? "var(--danger)" : mem > 40 ? "var(--warning)" : "var(--secondary)" }}/>
      </div>
      <span style={{ width: 24, color: "var(--ink-700)", fontVariantNumeric: "tabular-nums" }}>{mem}%</span>
    </div>
  );
}

function SslRow({ domain, days, tone }) {
  return (
    <div className="row" style={{ padding: "10px 18px", gap: 12, borderBottom: "1px solid var(--border-soft)" }}>
      <span className={`status-dot ${tone === "warning" ? "warn" : "live"}`}/>
      <span className="cell-mono" style={{ flex: 1, fontSize: 12.5, color: "var(--ink-900)" }}>{domain}</span>
      <span style={{ fontSize: 11.5, color: tone === "warning" ? "var(--warning-ink)" : "var(--ink-500)", fontWeight: tone === "warning" ? 600 : 400 }}>
        {tone === "warning" ? `Expira en ${days}d` : `Valid · ${days}d`}
      </span>
      <button className="btn btn-sm btn-ghost">{tone === "warning" ? "Renovar" : "Detalles"}</button>
    </div>
  );
}

function TrafficChart() {
  const W = 720, H = 180, P = 24;
  const reqs = [40,38,42,55,68,72,76,82,88,84,78,72,65,62,58,55,52,58,62,66,72,68,60,52];
  const bw   = [22,18,24,30,36,40,44,48,52,56,52,48,45,42,38,34,32,38,42,46,50,46,38,32];
  const max = 100;
  const xs = (W - P * 2) / (reqs.length - 1);
  const yScale = (v) => H - P - (v / max) * (H - P * 2);
  const pathR = reqs.map((v, i) => (i ? "L" : "M") + (P + i * xs).toFixed(1) + "," + yScale(v).toFixed(1)).join(" ");
  const pathB = bw.map((v, i) => (i ? "L" : "M") + (P + i * xs).toFixed(1) + "," + yScale(v).toFixed(1)).join(" ");
  const area = `${pathR} L${W - P},${H - P} L${P},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B5BF7" stopOpacity=".24"/>
          <stop offset="1" stopColor="#5B5BF7" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={P} x2={W - P} y1={P + i * ((H - P * 2) / 3)} y2={P + i * ((H - P * 2) / 3)} stroke="#EEF0F3"/>
      ))}
      <path d={area} fill="url(#tg)"/>
      <path d={pathR} fill="none" stroke="#5B5BF7" strokeWidth="2"/>
      <path d={pathB} fill="none" stroke="#22D3EE" strokeWidth="1.6" strokeDasharray="4 3"/>
      {[0, 6, 12, 18, 23].map((i) => (
        <text key={i} x={P + i * xs} y={H - 6} textAnchor="middle" fontSize="10.5" fill="#6B7280">{`${i.toString().padStart(2, "0")}:00`}</text>
      ))}
    </svg>
  );
}


const useStateLab = useState;

const LAB_CLIENTS = [
  { name: "Helia Energy", dot: "#5B5BF7", count: 18, active: true },
  { name: "Tessera Joyas", dot: "#F472B6", count: 12 },
  { name: "Klein Studio", dot: "#22D3EE", count: 9 },
  { name: "Calá Inmobiliaria", dot: "#10B981", count: 7 },
  { name: "Mira Cosmetics", dot: "#F59E0B", count: 14 },
  { name: "Bauer & Co", dot: "#A78BFA", count: 4 },
  { name: "Lumen Salud", dot: "#0EA5E9", count: 6 },
  { name: "Borealis Tours", dot: "#EF4444", count: 3 },
];

const PINNED = [
  { name: "Estrategia 2026", icon: "pin" },
  { name: "Calendario Q2", icon: "calendar" },
  { name: "Tone of voice — Helia", icon: "sparkles" },
];

const AGENTS = [
  { id: "marketing", name: "Marketing", desc: "Estrategia, campañas, ads", ic: "rocket",      bg: "linear-gradient(135deg,#F472B6,#A78BFA)" },
  { id: "content",   name: "Content",   desc: "Copy, posts, guiones",      ic: "sparkles",    bg: "linear-gradient(135deg,#5B5BF7,#22D3EE)", active: true },
  { id: "seo",       name: "SEO",       desc: "Keywords, contenido, audit", ic: "trend",      bg: "linear-gradient(135deg,#10B981,#22D3EE)" },
  { id: "business",  name: "Business",  desc: "Pricing, propuestas, deals", ic: "briefcase",  bg: "linear-gradient(135deg,#F59E0B,#EF4444)" },
  { id: "web",       name: "Web",       desc: "UI, copy, landing",          ic: "globe",      bg: "linear-gradient(135deg,#22D3EE,#5B5BF7)" },
  { id: "software",  name: "Software",  desc: "Specs, código, arquitectura", ic: "cube",      bg: "linear-gradient(135deg,#A78BFA,#5B5BF7)" },
  { id: "research",  name: "Research",  desc: "Mercados, competencia, datos", ic: "search",   bg: "linear-gradient(135deg,#0EA5E9,#10B981)" },
];

function Lab() {
  const [agent, setAgent] = useStateLab("content");
  const [client, setClient] = useStateLab("Helia Energy");
  const cur = AGENTS.find(a => a.id === agent);

  return (
    <div className="lab">
      {/* LEFT SIDEBAR — clients & history */}
      <aside className="lab-sidebar">
        <div className="row between" style={{ padding: "4px 8px 10px", borderBottom: "1px solid #1E2026", marginBottom: 8 }}>
          <div className="row gap-sm">
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#5B5BF7,#22D3EE)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon.beaker size={14} color="white"/>
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", letterSpacing: "-0.005em" }}>Laboratorio</div>
              <div style={{ fontSize: 10.5, color: "#5C626F", letterSpacing: ".05em", textTransform: "uppercase" }}>Studio AI · v2</div>
            </div>
          </div>
          <button className="icon-btn" style={{ background: "#16181F", border: "1px solid #2A2D36", color: "#B7BCC6", width: 26, height: 26 }}>
            <Icon.plus size={13}/>
          </button>
        </div>

        <div className="lab-section-title">Pinned</div>
        {PINNED.map((p) => (
          <div key={p.name} className="lab-item">
            <Icon.pin size={13} stroke={1.6}/>
            <span style={{ flex: 1, fontSize: 12.5 }}>{p.name}</span>
          </div>
        ))}

        <div className="lab-section-title" style={{ marginTop: 8 }}>Clientes</div>
        {LAB_CLIENTS.map((c) => (
          <div key={c.name} className={`lab-item ${c.name === client ? "active" : ""}`} onClick={() => setClient(c.name)}>
            <span className="lab-dot" style={{ background: c.dot }}/>
            <span style={{ flex: 1, fontSize: 12.5 }}>{c.name}</span>
            <span className="lab-meta">{c.count}</span>
          </div>
        ))}

        <div className="lab-section-title" style={{ marginTop: 8 }}>Recientes</div>
        {[
          { t: "Campaña reels mayo · Helia", time: "hace 12m" },
          { t: "Storytelling marca · Tessera", time: "hace 1h" },
          { t: "Auditoría SEO local · Calá", time: "hace 3h" },
          { t: "Brief landing · Lumen Salud", time: "ayer" },
          { t: "Tone of voice · Klein", time: "ayer" },
          { t: "Brief de pricing · Helix", time: "2 días" },
        ].map((r, i) => (
          <div key={i} className="lab-item">
            <Icon.message size={13} stroke={1.6}/>
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 12.5, color: "#D6D9E1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.t}</div>
              <div style={{ fontSize: 10.5, color: "#5C626F" }}>{r.time}</div>
            </div>
          </div>
        ))}
      </aside>

      {/* CENTER — chat workspace */}
      <main className="lab-main">
        <div className="lab-topbar">
          <div className="title">
            <Icon.message size={15}/> Campaña reels mayo
          </div>
          <span className="agent-pill">
            <span style={{ width: 8, height: 8, borderRadius: 50, background: "linear-gradient(135deg,#5B5BF7,#22D3EE)" }}/>
            {cur.name} Agent
          </span>
          <span className="badge" style={{ background: "#16181F", color: "#B7BCC6", border: "1px solid #2A2D36" }}>
            Cliente: <span style={{ color: "white", fontWeight: 500, marginLeft: 4 }}>{client}</span>
          </span>
          <div style={{ marginLeft: "auto" }} className="row gap-sm">
            <button className="btn btn-sm" style={{ background: "#16181F", color: "#B7BCC6", borderColor: "#2A2D36" }}><Icon.history size={13}/> Historial</button>
            <button className="btn btn-sm" style={{ background: "#16181F", color: "#B7BCC6", borderColor: "#2A2D36" }}><Icon.users size={13}/> Compartir</button>
            <button className="btn btn-sm" style={{ background: "#16181F", color: "#B7BCC6", borderColor: "#2A2D36" }}><Icon.more size={13}/></button>
          </div>
        </div>

        <div className="lab-chat">
          <div className="lab-msg user">
            <div className="lab-msg-av">ML</div>
            <div className="lab-msg-body">
              <div className="lab-msg-who">Mateo López · hace 4 min</div>
              <p style={{ margin: 0 }}>Necesito una campaña de reels para mayo de Helia Energy. La marca es B2B pero queremos sonar humanos. Foco en transición energética, casos de uso reales y educación. 8 piezas con guion corto, hook y CTA.</p>
              <div className="row gap-sm" style={{ marginTop: 8, flexWrap: "wrap" }}>
                <span className="chip"><Icon.paperclip size={11}/> brief-helia-q2.pdf</span>
                <span className="chip"><Icon.doc size={11}/> tone-of-voice.md</span>
                <span className="chip" style={{ background: "rgba(91,91,247,.18)", border: "1px solid rgba(91,91,247,.35)", color: "#C7C7FE" }}><Icon.building size={11}/> Helia Energy</span>
              </div>
            </div>
          </div>

          <div className="lab-msg agent">
            <div className="lab-msg-av">CA</div>
            <div className="lab-msg-body">
              <div className="lab-msg-who">Content Agent · usando Claude Sonnet · pensando 6s</div>
              <p style={{ margin: 0 }}>Listo. Generé 8 piezas estructuradas en 3 ejes: <strong style={{ color: "white" }}>educación</strong> (3), <strong style={{ color: "white" }}>casos reales</strong> (3) y <strong style={{ color: "white" }}>visión de marca</strong> (2). Cada una con hook (3s), desarrollo (15s) y CTA (5s).</p>
              <p style={{ marginTop: 10, marginBottom: 0 }}>El tono es directo, técnico pero accesible. Reemplacé "soluciones energéticas" por verbos concretos (ver panel derecho). ¿Querés que ajuste algo antes de exportar al calendario?</p>
              <div className="row gap-sm" style={{ marginTop: 12, flexWrap: "wrap" }}>
                <button className="chip" style={{ cursor: "pointer", background: "rgba(91,91,247,.18)", border: "1px solid rgba(91,91,247,.35)", color: "#C7C7FE" }}>
                  <Icon.bolt size={11}/> Ajustar tono
                </button>
                <button className="chip" style={{ cursor: "pointer" }}>
                  <Icon.calendar size={11}/> Enviar al calendario
                </button>
                <button className="chip" style={{ cursor: "pointer" }}>
                  <Icon.copy size={11}/> Copiar todo
                </button>
                <button className="chip" style={{ cursor: "pointer" }}>
                  <Icon.flag size={11}/> Crear tarea
                </button>
              </div>
            </div>
          </div>

          <div className="lab-msg user">
            <div className="lab-msg-av">ML</div>
            <div className="lab-msg-body">
              <div className="lab-msg-who">Mateo López · hace 1 min</div>
              <p style={{ margin: 0 }}>Buenísimo. ¿Podés generar también los thumbnails sugeridos y un calendario de publicación L–V? Y crear tareas para Camila para producción de cada reel.</p>
            </div>
          </div>

          <div className="lab-msg agent">
            <div className="lab-msg-av">
              <Icon.sparkles size={12}/>
            </div>
            <div className="lab-msg-body">
              <div className="lab-msg-who">Content Agent · trabajando…</div>
              <div style={{ padding: "10px 12px", background: "#16181F", border: "1px solid #2A2D36", borderRadius: 10, fontSize: 12.5, color: "#B7BCC6" }}>
                <div className="row gap-sm" style={{ marginBottom: 6 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(91,91,247,.2)", color: "#C7C7FE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon.check size={9} stroke={2.4}/></span>
                  Generando 8 thumbnails con prompt brief
                </div>
                <div className="row gap-sm" style={{ marginBottom: 6 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(91,91,247,.2)", color: "#C7C7FE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon.check size={9} stroke={2.4}/></span>
                  Calendario L–V (semana 1 de junio)
                </div>
                <div className="row gap-sm">
                  <span style={{ width: 14, height: 14, borderRadius: 50, border: "1.5px solid #5B5BF7", borderRightColor: "transparent", animation: "spin 0.8s linear infinite" }}/>
                  Creando 8 tareas asignadas a <strong style={{ color: "white" }}>Camila Vega</strong>…
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lab-composer">
          <div className="lab-input">
            <textarea placeholder={`Continuar con ${cur.name} Agent · escribí tu mensaje…`} defaultValue=""/>
            <div className="lab-input-foot">
              <span className="lab-tool-chip"><Icon.paperclip size={11}/> Adjuntar</span>
              <span className="lab-tool-chip"><Icon.building size={11}/> {client}</span>
              <span className="lab-tool-chip"><Icon.bolt size={11}/> {cur.name} Agent</span>
              <span className="lab-tool-chip" style={{ color: "#5C626F" }}><Icon.command size={11}/> ⌘ + Enter</span>
              <button className="lab-send"><Icon.send size={12}/> Enviar</button>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT — outputs */}
      <aside className="lab-right">
        <div className="lab-right-head">
          <div className="h"><Icon.sparkles size={14}/> Outputs</div>
          <div className="row gap-sm">
            <button className="icon-btn" style={{ background: "#16181F", border: "1px solid #2A2D36", color: "#B7BCC6", width: 26, height: 26 }}>
              <Icon.folder size={12}/>
            </button>
            <button className="icon-btn" style={{ background: "#16181F", border: "1px solid #2A2D36", color: "#B7BCC6", width: 26, height: 26 }}>
              <Icon.download size={12}/>
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 18px 8px" }}>
          <div className="lab-section-title" style={{ padding: 0, color: "#5C626F" }}>Agentes</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 12px 12px" }}>
          {AGENTS.map((a) => {
            const Ico = Icon[a.ic];
            return (
              <button key={a.id} className={`agent-card ${a.id === agent ? "active" : ""}`} onClick={() => setAgent(a.id)} style={{ background: a.id === agent ? undefined : undefined }}>
                <span className="ag-ic" style={{ background: a.bg }}><Ico size={14} color="white"/></span>
                <div style={{ minWidth: 0 }}>
                  <div className="ag-name">{a.name}</div>
                  <div className="ag-desc" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "8px 18px 6px" }}>
          <div className="row between">
            <div className="lab-section-title" style={{ padding: 0, color: "#5C626F" }}>Generados</div>
            <span style={{ fontSize: 10.5, color: "#5C626F" }}>5 ítems</span>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingBottom: 16 }}>
          <Output type="Calendario" title="Calendario reels mayo" body="L: Educación · transición energética · 30s reel. M: Caso real · cliente industrial · 25s. X: Mito vs realidad solar · 20s. J: Behind the scenes · 35s. V: Tip del experto · 18s." />
          <Output type="Copy" title="Hooks · 8 piezas" body="1. 'Tu factura no baja porque…'  2. 'Vimos esta planta y nos sorprendió'  3. 'Mito: los paneles no rinden si…'  4. '4 datos que no te dijeron sobre…'  5. 'Cómo Helia ayudó a [cliente]…'" />
          <Output type="Visual" title="Thumbnails sugeridos" body={null} thumbs/>
          <Output type="SEO" title="Cluster keywords · Q2" body="energía solar industrial · contratos PPA · autoconsumo empresas · transición energética B2B · paneles solares para fábricas · ROI energético…" />
          <Output type="Tareas" title="8 tareas creadas para Camila" body={null} tasks/>
        </div>
      </aside>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Output({ type, title, body, thumbs, tasks }) {
  return (
    <div className="lab-output">
      <div className="lo-head">
        <span className="lo-type">{type}</span>
        <span className="lo-title">{title}</span>
      </div>
      {body && <div className="lo-body">{body}</div>}
      {thumbs && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 6 }}>
          {[
            "linear-gradient(135deg,#5B5BF7,#0E0F13)",
            "linear-gradient(135deg,#22D3EE,#0E0F13)",
            "linear-gradient(135deg,#F472B6,#5B5BF7)",
            "linear-gradient(135deg,#10B981,#0E0F13)",
            "linear-gradient(135deg,#F59E0B,#EF4444)",
            "linear-gradient(135deg,#A78BFA,#22D3EE)",
            "linear-gradient(135deg,#0EA5E9,#0E0F13)",
            "linear-gradient(135deg,#EF4444,#0E0F13)",
          ].map((bg, i) => (
            <div key={i} style={{ aspectRatio: "9/16", borderRadius: 6, background: bg, position: "relative", overflow: "hidden", border: "1px solid #232631" }}>
              <div style={{ position: "absolute", bottom: 4, left: 5, right: 5, fontSize: 8.5, color: "white", fontWeight: 600 }}>Reel {String(i + 1).padStart(2, "0")}</div>
            </div>
          ))}
        </div>
      )}
      {tasks && (
        <div style={{ marginTop: 6 }}>
          {["Reel 01 — Educación", "Reel 02 — Caso real", "Reel 03 — Mito", "Reel 04 — BTS"].map((t, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: "5px 0", fontSize: 12, color: "#B7BCC6", borderBottom: i === 3 ? "none" : "1px solid #232631" }}>
              <span style={{ width: 14, height: 14, border: "1.5px solid #2A2E3A", borderRadius: 4 }}/>
              <span style={{ flex: 1 }}>{t}</span>
              <span style={{ fontSize: 10.5, color: "#5C626F" }}>CV</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#5C626F", paddingTop: 6 }}>+4 más</div>
        </div>
      )}
      <div className="lo-foot">
        <button className="chip" style={{ cursor: "pointer", background: "#1A1D26", border: "1px solid #2A2E3A", color: "#B7BCC6", padding: "1px 7px" }}><Icon.copy size={10}/> Copiar</button>
        <button className="chip" style={{ cursor: "pointer", background: "#1A1D26", border: "1px solid #2A2E3A", color: "#B7BCC6", padding: "1px 7px" }}><Icon.pin size={10}/> Guardar</button>
        <span style={{ marginLeft: "auto" }}>hace 1 min</span>
      </div>
    </div>
  );
}


const useStateSt = useState;

const SETTINGS_NAV = [
  { group: "Workspace", items: [
    { id: "general", label: "General", icon: "cog" },
    { id: "branding", label: "Branding", icon: "sparkles" },
    { id: "members", label: "Usuarios", icon: "users" },
    { id: "roles", label: "Roles & permisos", icon: "shield" },
  ]},
  { group: "Operaciones", items: [
    { id: "integrations", label: "Integraciones", icon: "link" },
    { id: "api", label: "API Keys", icon: "command" },
    { id: "webhooks", label: "Webhooks", icon: "bolt" },
    { id: "billing", label: "Facturación interna", icon: "card" },
  ]},
  { group: "Avanzado", items: [
    { id: "audit", label: "Audit logs", icon: "history" },
    { id: "danger", label: "Zona peligrosa", icon: "shield" },
  ]},
];

const MEMBERS = [
  { name: "Mateo López", email: "mateo@inspyra.studio", role: "Owner", status: "Activo", last: "Ahora", mfa: true },
  { name: "Lucía Romero", email: "lucia@inspyra.studio", role: "Admin", status: "Activo", last: "hace 12m", mfa: true },
  { name: "Pablo Ferré", email: "pablo@inspyra.studio", role: "Member · Delivery", status: "Activo", last: "hace 1h", mfa: true },
  { name: "Camila Vega", email: "camila@inspyra.studio", role: "Member · Studio", status: "Activo", last: "hace 2h", mfa: false },
  { name: "Diego Salas", email: "diego@inspyra.studio", role: "Member · DevOps", status: "Activo", last: "hace 4h", mfa: true },
  { name: "Sofía Vidal", email: "sofia@inspyra.studio", role: "Member · Growth", status: "Activo", last: "ayer", mfa: true },
  { name: "Bruno Téllez", email: "bruno@inspyra.studio", role: "Guest · Cliente", status: "Pendiente", last: "—", mfa: false },
];

const INTEGRATIONS = [
  { name: "Stripe", desc: "Cobros y suscripciones", color: "#635BFF", on: true, ic: "card", id: "stripe" },
  { name: "Slack", desc: "Notificaciones del equipo", color: "#4A154B", on: true, ic: "message", id: "slack" },
  { name: "Linear", desc: "Sync de tareas técnicas", color: "#5E6AD2", on: true, ic: "flow", id: "linear" },
  { name: "GitHub", desc: "Deploys & PRs", color: "#0B0D12", on: true, ic: "cube", id: "gh" },
  { name: "AWS", desc: "Infraestructura cloud", color: "#FF9900", on: true, ic: "server", id: "aws" },
  { name: "HubSpot", desc: "CRM legacy import", color: "#FF7A59", on: false, ic: "building", id: "hs" },
  { name: "Google Analytics 4", desc: "Métricas de clientes", color: "#F9AB00", on: true, ic: "chart", id: "ga4" },
  { name: "Meta Business", desc: "Ads & páginas", color: "#1877F2", on: false, ic: "rocket", id: "meta" },
  { name: "Notion", desc: "Documentación de proyectos", color: "#0B0D12", on: true, ic: "doc", id: "notion" },
  { name: "Cloudflare", desc: "DNS, CDN, R2", color: "#F38020", on: true, ic: "shield", id: "cf" },
  { name: "Shopify", desc: "Tiendas de clientes", color: "#95BF47", on: true, ic: "globe", id: "shopify" },
  { name: "Resend", desc: "Email transaccional", color: "#0B0D12", on: false, ic: "inbox", id: "resend" },
];

function Settings() {
  const [section, setSection] = useStateSt("members");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>Workspace Studio Inspyra · Plan Pro · Renovación 4 Feb 2027</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
        <nav style={{ position: "sticky", top: 0, alignSelf: "start" }}>
          {SETTINGS_NAV.map((g) => (
            <div key={g.group} style={{ marginBottom: 18 }}>
              <div className="section-title">{g.group}</div>
              {g.items.map((it) => {
                const IconC = Icon[it.icon];
                return (
                  <button key={it.id}
                    onClick={() => setSection(it.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      width: "100%", padding: "7px 10px",
                      border: 0, background: section === it.id ? "var(--surface)" : "transparent",
                      color: section === it.id ? "var(--ink-900)" : "var(--ink-700)",
                      fontSize: 13, fontWeight: section === it.id ? 600 : 500,
                      borderRadius: 6, cursor: "pointer",
                      boxShadow: section === it.id ? "var(--sh-xs)" : "none",
                    }}>
                    {IconC && <IconC size={14}/>} {it.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div>
          {section === "members" && <MembersPanel/>}
          {section === "integrations" && <IntegrationsPanel/>}
          {section === "general" && <GeneralPanel/>}
          {section !== "members" && section !== "integrations" && section !== "general" && <PlaceholderPanel section={section}/>}
        </div>
      </div>
    </div>
  );
}

function MembersPanel() {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Usuarios & permisos</h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13 }}>12 miembros activos · 1 invitación pendiente</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Invitar miembro</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Rol</th>
              <th>2FA</th>
              <th>Última actividad</th>
              <th>Estado</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m) => (
              <tr key={m.email}>
                <td>
                  <div className="row gap-sm">
                    <Avatar name={m.name} size="md"/>
                    <div>
                      <div className="cell-strong">{m.name}</div>
                      <div className="cell-muted cell-mono" style={{ fontSize: 11 }}>{m.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={m.role === "Owner" ? "brand" : m.role === "Admin" ? "info" : m.role.includes("Guest") ? "warning" : "outline"}>
                    {m.role}
                  </Badge>
                </td>
                <td>
                  {m.mfa ?
                    <span className="row gap-sm" style={{ fontSize: 12, color: "var(--success-ink)" }}><Icon.shield size={13}/> Activo</span> :
                    <span style={{ fontSize: 12, color: "var(--warning-ink)" }}>Sin configurar</span>}
                </td>
                <td className="cell-muted">{m.last}</td>
                <td>
                  {m.status === "Activo" ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="warning" dot>Pendiente</Badge>}
                </td>
                <td><button className="icon-btn" style={{ width: 26, height: 26, background: "transparent", border: 0 }}><Icon.more size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Roles</div>
          <button className="btn btn-sm"><Icon.plus size={13}/> Nuevo rol</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {[
            { name: "Owner", color: "var(--primary)", count: 1, can: "Todos los permisos" },
            { name: "Admin", color: "var(--info)", count: 2, can: "Gestionar usuarios y facturación" },
            { name: "Member", color: "var(--success)", count: 8, can: "Acceso por área (Growth, Delivery, Studio, DevOps)" },
            { name: "Guest", color: "var(--warning)", count: 1, can: "Solo lectura de su cliente" },
          ].map((r, i) => (
            <div key={r.name} style={{ padding: 18, borderRight: i < 3 ? "1px solid var(--border-soft)" : "none" }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="row gap-sm">
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: r.color }}/>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                </span>
                <span className="badge outline">{r.count}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{r.can}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsPanel() {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Integraciones</h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13 }}>8 conectadas · 4 disponibles · sync OK hace 2 min</p>
        </div>
        <div className="row gap-sm">
          <div className="topbar-search" style={{ width: 240, height: 30, padding: "4px 10px" }}>
            <Icon.search size={13}/>
            <input placeholder="Buscar integración..."/>
          </div>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nueva integración</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {INTEGRATIONS.map((it) => {
          const Ico = Icon[it.ic];
          return (
            <div key={it.id} className="card" style={{ padding: 16 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: it.color, color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico size={18}/>
                </span>
                <Toggle on={it.on}/>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{it.desc}</div>
              <div className="row between" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-soft)", fontSize: 11.5, color: "var(--ink-500)" }}>
                {it.on ? <span style={{ color: "var(--success-ink)" }}>● Conectado</span> : <span>Sin conectar</span>}
                <button className="btn btn-sm btn-ghost">{it.on ? "Configurar" : "Conectar"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GeneralPanel() {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>General</h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13 }}>Información del workspace</p>
        </div>
      </div>
      <div className="card">
        <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Setting label="Nombre del workspace" value="Studio Inspyra"/>
          <Setting label="Subdominio" value="inspyra.app" mono/>
          <Setting label="Zona horaria" value="(UTC−03:00) Buenos Aires"/>
          <Setting label="Moneda primaria" value="USD"/>
          <Setting label="Idioma del sistema" value="Español (LATAM)"/>
          <Setting label="Formato de fecha" value="DD MMM YYYY"/>
        </div>
        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn">Cancelar</button>
          <button className="btn btn-primary">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPanel({ section }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ width: 48, height: 48, margin: "0 auto 14px", borderRadius: 12, background: "var(--bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon.cog size={20}/>
      </div>
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>Sección: {section}</h3>
      <p style={{ color: "var(--ink-500)", fontSize: 13, marginTop: 4 }}>Configuración avanzada — disponible en este panel.</p>
    </div>
  );
}

function Setting({ label, value, mono }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input className="input" defaultValue={value} style={{ fontFamily: mono ? "var(--font-mono)" : undefined }}/>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <span style={{
      width: 32, height: 18, borderRadius: 999,
      background: on ? "var(--ink-900)" : "var(--ink-200)",
      display: "inline-flex", alignItems: "center",
      padding: 2, transition: "background .2s",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 50, background: "white",
        transform: on ? "translateX(14px)" : "translateX(0)",
        transition: "transform .2s",
        boxShadow: "0 1px 2px rgba(0,0,0,.2)",
      }}/>
    </span>
  );
}



// (old Campaigns + CAMPAIGNS removed — now in screens/com-campaigns.jsx)

const TICKETS = [
  { id: "#291", title: "Email transaccional no llega", client: "Helia Energy", svc: "Software", pri: "urg", assn: "Mateo López", created: "hace 22m", status: "Abierto", sla: "3h restantes" },
  { id: "#290", title: "Pedido perdido en checkout", client: "Tessera Joyas", svc: "E-commerce", pri: "urg", assn: "Pablo Ferré", created: "hace 1h", status: "En curso", sla: "4h restantes" },
  { id: "#289", title: "Cambiar tipografía en home", client: "Klein Studio", svc: "Web", pri: "low", assn: "Camila Vega", created: "hace 3h", status: "En curso", sla: "2d restantes" },
  { id: "#288", title: "Lentitud al subir imágenes", client: "Mira Cosmetics", svc: "E-commerce", pri: "high", assn: "Pablo Ferré", created: "hace 5h", status: "Abierto", sla: "8h restantes" },
  { id: "#287", title: "SSL en lumen-salud.com expira pronto", client: "Lumen Salud", svc: "Hosting", pri: "high", assn: "Diego Salas", created: "hace 8h", status: "En curso", sla: "12h restantes" },
  { id: "#286", title: "No recibo notificaciones de leads", client: "Calá Inmobiliaria", svc: "Software", pri: "med", assn: "Mateo López", created: "ayer", status: "Esperando cliente", sla: "—" },
  { id: "#285", title: "Pedido de cambio de plan", client: "Borealis Tours", svc: "Hosting", pri: "low", assn: "Diego Salas", created: "hace 2d", status: "Esperando cliente", sla: "—" },
];

function Tickets() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Cola de soporte · 7 abiertos · SLA 96% · MTTR 4.2h</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo ticket</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Abiertos" value="7" delta="2 urgentes" tone="warning"/>
        <SmallStat label="SLA cumplido (30d)" value="96%" delta="+1.2pp" tone="success"/>
        <SmallStat label="MTTR" value="4.2h" delta="−0.4h" tone="success"/>
        <SmallStat label="CSAT" value="4.8 / 5" delta="42 respuestas" tone="brand"/>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ border: 0, padding: 0, margin: "-4px 0" }}>
            <div className="tab active">Todos <span className="badge outline">7</span></div>
            <div className="tab">Urgentes <span className="badge danger">2</span></div>
            <div className="tab">Mis tickets <span className="badge outline">3</span></div>
            <div className="tab">Esperando cliente <span className="badge outline">2</span></div>
            <div className="tab">Cerrados</div>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Asunto</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Prioridad</th>
              <th>Asignado</th>
              <th>Creado</th>
              <th>SLA</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {TICKETS.map((t) => (
              <tr key={t.id}>
                <td className="cell-mono cell-muted">{t.id}</td>
                <td className="cell-strong">{t.title}</td>
                <td>{t.client}</td>
                <td><Badge tone="outline">{t.svc}</Badge></td>
                <td>
                  {t.pri === "urg" && <Badge tone="danger" dot>Urgente</Badge>}
                  {t.pri === "high" && <Badge tone="warning" dot>Alta</Badge>}
                  {t.pri === "med" && <Badge tone="info" dot>Media</Badge>}
                  {t.pri === "low" && <Badge tone="outline" dot>Baja</Badge>}
                </td>
                <td>
                  <div className="row gap-sm"><Avatar name={t.assn} size="sm"/>{t.assn.split(" ")[0]}</div>
                </td>
                <td className="cell-muted">{t.created}</td>
                <td className={t.sla.includes("h") && parseInt(t.sla) < 5 ? "" : "cell-muted"} style={{ color: t.sla.includes("h") && parseInt(t.sla) < 5 ? "var(--danger-ink)" : undefined, fontWeight: t.sla.includes("h") && parseInt(t.sla) < 5 ? 600 : undefined }}>{t.sla}</td>
                <td>
                  {t.status === "Abierto" && <Badge tone="danger" dot>Abierto</Badge>}
                  {t.status === "En curso" && <Badge tone="info" dot>En curso</Badge>}
                  {t.status === "Esperando cliente" && <Badge tone="warning" dot>Esperando cliente</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reportes</h1>
          <p>14 reportes guardados · auto-refresh diario · exportable a PDF y CSV</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Mayo 2026 <Icon.chevronDown size={12}/></button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo reporte</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { t: "Resumen ejecutivo · Mayo", desc: "MRR, ingresos, churn, pipeline", icon: "chart", color: "#5B5BF7" },
          { t: "Pipeline & forecast Q2", desc: "Deals por etapa, probabilidad", icon: "trend", color: "#22D3EE" },
          { t: "Health de clientes", desc: "Score, NPS, riesgo de churn", icon: "users", color: "#10B981" },
          { t: "Velocidad de proyectos", desc: "Cycle time, throughput, on-time", icon: "flow", color: "#A78BFA" },
          { t: "Performance de servicios", desc: "MRR por servicio, churn, LTV", icon: "layers", color: "#F59E0B" },
          { t: "Infraestructura · uptime", desc: "Por cliente y por dominio", icon: "shield", color: "#0EA5E9" },
          { t: "Soporte & SLA", desc: "Tickets, MTTR, CSAT por equipo", icon: "life", color: "#EF4444" },
          { t: "Eficacia outbound", desc: "Open/Reply/Meeting por campaña", icon: "rocket", color: "#F472B6" },
          { t: "Cashflow & cobros", desc: "Facturado, cobrado, atrasados", icon: "card", color: "#0B0D12" },
        ].map((r, i) => {
          const Ico = Icon[r.icon];
          return (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: r.color + "22", color: r.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico size={17}/>
                </span>
                <Badge tone="outline">Diario</Badge>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.t}</div>
              <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{r.desc}</div>
              <div style={{ height: 36, marginTop: 14 }}>
                <Spark data={[20, 28, 24, 32, 38, 36, 44, 52, 48, 58, 64, 70].map(v => v * (Math.random() + .5))} color={r.color} fill={r.color + "22"} w={280} h={36}/>
              </div>
              <div className="row between" style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 8 }}>
                <span>Actualizado hace 2h</span>
                <button className="btn btn-sm btn-ghost">Abrir <Icon.arrowRight size={11}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SmallStat({ label, value, delta, tone }) {
  const tones = { brand: "var(--primary)", success: "var(--success)", warning: "var(--warning)", info: "var(--info)" };
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: tones[tone] }}/>
        <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{delta}</div>
    </div>
  );
}

// ─── INSPYRA CLOUD (ERP-016) ──────────────────────────────────────────────

const useStateCloud = useState;

const CLOUD_WORKLOADS = [
  { id: "wk-01", name: "helia-energy-api", client: "Helia Energy", type: "Lambda", env: "production", cpu: 24, ram: 48, lat: 98, status: "running" },
  { id: "wk-02", name: "tessera-checkout", client: "Tessera Joyas", type: "Container", env: "production", cpu: 62, ram: 71, lat: 142, status: "running" },
  { id: "wk-03", name: "mira-cms-api", client: "Mira Cosmetics", type: "API GW", env: "production", cpu: 18, ram: 32, lat: 87, status: "running" },
  { id: "wk-04", name: "cala-crm-backend", client: "Calá Inmobiliaria", type: "ECS", env: "staging", cpu: 45, ram: 55, lat: 220, status: "running" },
  { id: "wk-05", name: "norte-films-cdn", client: "Norte Films", type: "CloudFront", env: "production", cpu: 8, ram: 12, lat: 34, status: "running" },
  { id: "wk-06", name: "inspyra-auth-svc", client: "Inspyra (interno)", type: "Lambda", env: "production", cpu: 88, ram: 76, lat: 67, status: "running" },
  { id: "wk-07", name: "veleta-wines-shop", client: "Veleta Wines", type: "Container", env: "production", cpu: 34, ram: 41, lat: 189, status: "error" },
  { id: "wk-08", name: "borealis-booking", client: "Borealis Tours", type: "Lambda", env: "dev", cpu: 12, ram: 20, lat: 310, status: "running" },
];

const CLOUD_COSTS = [
  { service: "Lambda", cost: "324", delta: 5.2, desc: "2.4M invocaciones · 128MB avg", sparkData: [80,100,110,95,120,130,115,140,155,145,160,170] },
  { service: "RDS (PostgreSQL)", cost: "481", delta: 2.1, desc: "db.t3.medium × 3 instancias", sparkData: [120,125,130,128,135,140,138,142,148,145,155,160] },
  { service: "ECS / Fargate", cost: "298", delta: 12.4, desc: "8 tasks corriendo en producción", sparkData: [60,70,80,90,100,110,130,145,160,175,190,200] },
  { service: "CloudFront", cost: "187", delta: -3.2, desc: "CDN + S3 · 4.2TB transferidos", sparkData: [200,190,180,175,170,168,165,162,160,158,155,152] },
  { service: "API Gateway", cost: "142", delta: 8.7, desc: "12.3M requests este mes", sparkData: [60,75,82,90,100,108,115,122,130,135,138,142] },
  { service: "S3 + transfers", cost: "210", delta: 1.5, desc: "890 GB almacenados · 1.8TB out", sparkData: [100,105,108,112,118,125,130,135,140,148,155,162] },
];

const CLOUD_DEPLOYS = [
  { sha: "a3f8c2d", workload: "helia-energy-api", by: "Diego Salas", time: "hace 12m", status: "success" },
  { sha: "b91e4a7", workload: "tessera-checkout", by: "Pablo Ferré", time: "hace 45m", status: "success" },
  { sha: "c22d9f1", workload: "veleta-wines-shop", by: "Diego Salas", time: "hace 2h", status: "failed" },
  { sha: "d54a8b3", workload: "inspyra-auth-svc", by: "Mateo López", time: "hace 4h", status: "success" },
  { sha: "e77c5d9", workload: "mira-cms-api", by: "Pablo Ferré", time: "hace 6h", status: "success" },
  { sha: "f19b3e6", workload: "cala-crm-backend", by: "Diego Salas", time: "ayer", status: "success" },
];

const CLOUD_ALERTS = [
  { title: "Lambda inspyra-auth-svc CPU > 85%", desc: "Umbral de CPU superado durante 15 min consecutivos. Considerar scaling.", severity: "warning", time: "hace 8m" },
  { title: "Container veleta-wines-shop crash loop", desc: "El servicio reinició 3 veces en los últimos 20 minutos. Último error: ENOMEM.", severity: "critical", time: "hace 2h" },
  { title: "RDS backup completado", desc: "Snapshot diario completado correctamente en todas las instancias.", severity: "info", time: "hace 3h" },
  { title: "CloudFront cache hit rate < 70%", desc: "El ratio de aciertos de caché bajó de 92% a 67%. Revisar reglas de caché.", severity: "warning", time: "hace 5h" },
];

function InspyraCloud() {
  const [tab, setTab] = useStateCloud("workloads");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Inspyra Cloud</h1>
          <p>8 workloads activos · AWS us-east-1 · sync hace 30s</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.refresh size={14}/> Sync ahora</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo workload</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Workloads activos" value="8" delta="1 con error" tone="warning"/>
        <SmallStat label="Costo AWS (mes)" value="$1,842" delta="+8.3% vs may" tone="warning"/>
        <SmallStat label="Uptime promedio" value="99.97%" delta="SLA OK" tone="brand"/>
        <SmallStat label="Lambdas invocadas" value="2.4M" delta="últimos 7 días" tone="info"/>
      </div>

      <div className="tabs">
        {[["workloads","Workloads"],["costos","Cost Explorer"],["deployments","Deployments"],["alertas","Alertas"]].map(([id,label]) => (
          <div key={id} className={`tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      {tab === "workloads" && (
        <div className="card">
          <table className="tbl">
            <thead><tr>
              <th>Workload</th><th>Cliente</th><th>Tipo</th><th>Entorno</th>
              <th style={{width:110}}>CPU</th><th style={{width:110}}>RAM</th><th>Latencia</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {CLOUD_WORKLOADS.map(w => (
                <tr key={w.id}>
                  <td className="cell-strong cell-mono" style={{fontSize:12}}>{w.name}</td>
                  <td>{w.client}</td>
                  <td><Badge tone="outline">{w.type}</Badge></td>
                  <td><Badge tone={w.env === "production" ? "brand" : w.env === "staging" ? "warning" : "info"}>{w.env}</Badge></td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <Progress value={w.cpu} tone={w.cpu > 80 ? "danger" : "success"}/>
                      <span style={{fontSize:10,color:"var(--ink-500)",minWidth:28}}>{w.cpu}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <Progress value={w.ram} tone={w.ram > 80 ? "danger" : "info"}/>
                      <span style={{fontSize:10,color:"var(--ink-500)",minWidth:28}}>{w.ram}%</span>
                    </div>
                  </td>
                  <td className="cell-mono" style={{color: w.lat > 300 ? "var(--warning-ink)" : "inherit"}}>{w.lat}ms</td>
                  <td>{w.status === "running" ? <Badge tone="success" dot>Running</Badge> : <Badge tone="danger" dot>Error</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "costos" && (
        <div>
          <div className="card" style={{padding:18, marginBottom:16, display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <span style={{fontSize:13,color:"var(--ink-500)"}}>Total AWS junio 2026</span>
              <div style={{fontSize:32,fontWeight:700,fontFamily:"var(--font-display)",letterSpacing:"-0.03em"}}>$1,842 <span style={{fontSize:16,color:"var(--warning-ink)",fontWeight:600}}>+8.3%</span></div>
            </div>
            <div className="row gap-sm">
              <button className="btn"><Icon.download size={14}/> Exportar</button>
              <button className="btn btn-ghost btn-sm">Por cliente</button>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {CLOUD_COSTS.map((c, i) => (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.service}</span>
                  <Badge tone={c.delta > 5 ? "warning" : c.delta < 0 ? "success" : "outline"}>{c.delta > 0 ? "+" : ""}{c.delta}%</Badge>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)" }}>${c.cost}<span style={{fontSize:12,color:"var(--ink-500)",fontWeight:400}}>/mes</span></div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 }}>{c.desc}</div>
                <div style={{ height: 36, marginTop: 12 }}>
                  <Spark data={c.sparkData} color="#5B5BF7" fill="#5B5BF722" w={240} h={36}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "deployments" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Historial de deployments</div>
            <Badge tone="outline">Últimos 30</Badge>
          </div>
          <table className="tbl">
            <thead><tr>
              <th style={{width:100}}>Commit</th><th>Workload</th><th>Deploy por</th><th>Fecha</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {CLOUD_DEPLOYS.map((d, i) => (
                <tr key={i}>
                  <td className="cell-mono" style={{fontSize:12,color:"var(--ink-500)"}}>{d.sha}</td>
                  <td className="cell-strong" style={{fontFamily:"var(--font-mono)",fontSize:12}}>{d.workload}</td>
                  <td><div className="row gap-sm"><Avatar name={d.by} size="sm"/>{d.by.split(" ")[0]}</div></td>
                  <td className="cell-muted">{d.time}</td>
                  <td>{d.status === "success" ? <Badge tone="success" dot>Success</Badge> : <Badge tone="danger" dot>Failed</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "alertas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CLOUD_ALERTS.map((a, i) => (
            <div key={i} className="card" style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: a.severity === "critical" ? "var(--danger-ink)" : a.severity === "warning" ? "var(--warning-ink)" : "var(--info)", marginTop: 2, flexShrink:0 }}>
                <Icon.pulse size={16}/>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 3 }}>{a.desc}</div>
              </div>
              <div className="row gap-sm" style={{flexShrink:0}}>
                <Badge tone={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"}>{a.severity}</Badge>
                <span style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── INSPYRA MAIL (ERP-017) ───────────────────────────────────────────────

const useStateMail = useState;

const MAIL_THREADS = [
  { id: "m-01", from: "contacto@heliaenergy.com", name: "Fernando Roca", subject: "Revisión del dashboard junio", preview: "Mateo, te envío los datos del mes...", time: "hace 8m", unread: true, tag: "Clientes" },
  { id: "m-02", from: "dra.roca@lumen-salud.com", name: "Dra. M. Roca", subject: "Propuesta contenidos Q3", preview: "Gracias por la reunión. Adjunto la...", time: "hace 35m", unread: true, tag: "Comercial" },
  { id: "m-03", from: "jbauer@bauernco.com", name: "J. Bauer", subject: "Re: Onboarding hosting", preview: "Ya completé el formulario. ¿Cuándo...", time: "hace 1h", unread: false, tag: "Soporte" },
  { id: "m-04", from: "tessera@joyastessera.com", name: "A. Tessera", subject: "Error en checkout — urgente", preview: "Los clientes reportan que no pueden...", time: "hace 2h", unread: true, tag: "Soporte" },
  { id: "m-05", from: "sofia.vidal@aurora-cafe.com", name: "Sofía Vidal", subject: "Nuevo diseño home aprobado", preview: "Todo perfecto! Pueden proceder con...", time: "hace 3h", unread: false, tag: "Proyectos" },
  { id: "m-06", from: "mcalderon@borealistours.com", name: "M. Calderón", subject: "Factura julio pendiente", preview: "Hola, me llega un recordatorio de...", time: "ayer", unread: false, tag: "Facturación" },
  { id: "m-07", from: "klein@kleinstudio.io", name: "D. Klein", subject: "Presupuesto branding 2027", preview: "Quedamos en que nos mandaban el...", time: "ayer", unread: false, tag: "Comercial" },
  { id: "m-08", from: "mira@miracosmetics.ar", name: "C. Bregman", subject: "Nuevas fotos para galería", preview: "Adjunto 48 fotos del shoot de ayer...", time: "hace 2d", unread: false, tag: "Proyectos" },
];

const MAIL_TAG_COLORS = { Clientes: "#10B981", Comercial: "#5B5BF7", Soporte: "#EF4444", Proyectos: "#A78BFA", Facturación: "#F59E0B" };

function InspyraMail() {
  const [active, setActive] = useStateMail("m-01");
  const [folder, setFolder] = useStateMail("inbox");
  const thread = MAIL_THREADS.find(t => t.id === active);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 300px 1fr", height: "100%", overflow: "hidden" }}>
      <div style={{ borderRight: "1px solid var(--border-soft)", padding: "16px 12px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        <button className="btn btn-brand" style={{marginBottom:12, justifyContent:"center"}}><Icon.plus size={14}/> Redactar</button>
        {[
          { id:"inbox", label:"Bandeja de entrada", icon:"inbox", count:3 },
          { id:"sent", label:"Enviados", icon:"send" },
          { id:"drafts", label:"Borradores", icon:"doc", count:2 },
          { id:"starred", label:"Destacados", icon:"pin" },
          { id:"spam", label:"Spam", icon:"shield" },
          { id:"trash", label:"Papelera", icon:"x" },
        ].map(f => {
          const Ico2 = Icon[f.icon];
          return (
            <button key={f.id} onClick={() => setFolder(f.id)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",border:0,background:folder===f.id?"var(--surface)":"transparent",
                color:folder===f.id?"var(--ink-900)":"var(--ink-600)",fontSize:13,fontWeight:folder===f.id?600:500,borderRadius:6,cursor:"pointer",width:"100%"}}>
              {Ico2 && <Ico2 size={14}/>} {f.label}
              {f.count && <span className="badge danger" style={{marginLeft:"auto"}}>{f.count}</span>}
            </button>
          );
        })}
        <div style={{borderTop:"1px solid var(--border-soft)",marginTop:12,paddingTop:12}}>
          <div className="section-title" style={{marginBottom:6}}>Etiquetas</div>
          {Object.entries(MAIL_TAG_COLORS).map(([tag, color]) => (
            <button key={tag} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",border:0,background:"transparent",
              color:"var(--ink-600)",fontSize:12,borderRadius:6,cursor:"pointer",width:"100%"}}>
              <span style={{width:8,height:8,borderRadius:50,background:color,flexShrink:0}}/>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderRight: "1px solid var(--border-soft)", overflowY:"auto" }}>
        <div style={{ padding:"12px", borderBottom:"1px solid var(--border-soft)", position:"sticky",top:0,background:"var(--bg)",zIndex:1 }}>
          <div className="topbar-search" style={{width:"100%", padding:"6px 10px"}}>
            <Icon.search size={13}/><input placeholder="Buscar emails..."/>
          </div>
        </div>
        {MAIL_THREADS.map(t => (
          <div key={t.id} onClick={() => setActive(t.id)}
            style={{padding:"12px 14px", cursor:"pointer", borderBottom:"1px solid var(--border-soft)",
              background: active===t.id ? "var(--surface)" : "transparent",
              borderLeft: active===t.id ? "3px solid var(--primary)" : "3px solid transparent"}}>
            <div className="row between" style={{marginBottom:3}}>
              <span style={{fontWeight: t.unread?700:500,fontSize:13}}>{t.name}</span>
              <span style={{fontSize:11,color:"var(--ink-400)"}}>{t.time}</span>
            </div>
            <div style={{fontWeight:t.unread?600:500,fontSize:12.5,marginBottom:3,color:"var(--ink-800)"}}>{t.subject}</div>
            <div style={{fontSize:12,color:"var(--ink-500)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.preview}</div>
            <div style={{marginTop:5}}>
              <span style={{fontSize:10.5,padding:"1px 7px",borderRadius:999,background:MAIL_TAG_COLORS[t.tag]+"22",color:MAIL_TAG_COLORS[t.tag],fontWeight:600}}>{t.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {thread && (
        <div style={{ padding:28, overflowY:"auto" }}>
          <div className="row between" style={{marginBottom:20}}>
            <div>
              <h2 style={{margin:0,fontFamily:"var(--font-display)",fontWeight:700,fontSize:20,letterSpacing:"-0.02em"}}>{thread.subject}</h2>
              <div style={{fontSize:13,color:"var(--ink-500)",marginTop:4}}>De: {thread.from} · {thread.time}</div>
            </div>
            <div className="row gap-sm">
              <button className="btn btn-sm"><Icon.arrowRight size={13}/> Asignar</button>
              <button className="btn btn-sm btn-ghost"><Icon.more size={14}/></button>
            </div>
          </div>
          <div className="card" style={{padding:24,marginBottom:20,fontSize:14,lineHeight:1.7,color:"var(--ink-700)"}}>
            <p>Hola Mateo,</p>
            <p>Espero que estés bien. Te escribo para dar seguimiento a lo que estuvimos conversando la semana pasada.</p>
            <p>Adjunto los datos actualizados del mes. Nos gustaría poder revisar el dashboard juntos antes del cierre del trimestre.</p>
            <p>¿Tienes disponibilidad esta semana?</p>
            <p>Saludos,<br/><strong>{thread.name}</strong></p>
          </div>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:12,color:"var(--ink-500)",marginBottom:8}}>Responder a {thread.name}</div>
            <textarea rows={4} style={{width:"100%",background:"transparent",border:0,resize:"none",fontSize:13,color:"var(--ink-800)",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}} placeholder="Escribe tu respuesta..."/>
            <div className="row between" style={{marginTop:8,borderTop:"1px solid var(--border-soft)",paddingTop:8}}>
              <div className="row gap-sm">
                <button className="btn btn-sm btn-ghost"><Icon.paperclip size={13}/></button>
                <button className="btn btn-sm btn-ghost"><Icon.sparkles size={13}/> IA</button>
              </div>
              <button className="btn btn-brand btn-sm"><Icon.send size={13}/> Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EQUIPO & COLABORADORES (ERP-018) ─────────────────────────────────────

const useStateTeam = useState;

const TEAM_DATA = [
  { name: "Mateo López", role: "Founder · Admin", area: "Management", avatar: "ML", status: "online", tasks: 8, projects: 5, score: 94, hours: 38, load: 85 },
  { name: "Lucía Romero", role: "Account Manager", area: "Growth", avatar: "LR", status: "online", tasks: 12, projects: 6, score: 91, hours: 40, load: 92 },
  { name: "Pablo Ferré", role: "Dev Lead", area: "Delivery", avatar: "PF", status: "online", tasks: 15, projects: 4, score: 88, hours: 42, load: 96 },
  { name: "Camila Vega", role: "Motion Designer", area: "Studio", avatar: "CV", status: "away", tasks: 9, projects: 3, score: 87, hours: 35, load: 78 },
  { name: "Diego Salas", role: "DevOps", area: "Delivery", avatar: "DS", status: "online", tasks: 6, projects: 7, score: 90, hours: 40, load: 88 },
  { name: "Sofía Vidal", role: "Growth Manager", area: "Growth", avatar: "SV", status: "offline", tasks: 11, projects: 4, score: 86, hours: 32, load: 70 },
];

function Team() {
  const [view, setView] = useStateTeam("members");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Equipo</h1>
          <p>6 miembros activos · carga promedio 85% · 1 saturado</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.download size={14}/> Exportar</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Invitar</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Miembros activos" value="6" delta="+1 invitación pendiente" tone="success"/>
        <SmallStat label="Carga promedio" value="85%" delta="1 saturado >95%" tone="warning"/>
        <SmallStat label="Tareas asignadas" value="61" delta="esta semana" tone="info"/>
        <SmallStat label="Score promedio" value="89.3" delta="+2.1 vs mes ant." tone="brand"/>
      </div>

      <div className="tabs">
        {[["members","Miembros"],["workload","Carga operativa"],["performance","Performance"]].map(([id,label]) => (
          <div key={id} className={`tab${view === id ? " active" : ""}`} onClick={() => setView(id)}>{label}</div>
        ))}
      </div>

      {view === "members" && (
        <div className="card">
          <table className="tbl">
            <thead><tr>
              <th>Miembro</th><th>Área</th><th>Estado</th><th>Tareas</th><th>Proyectos</th><th>Score</th><th style={{width:40}}></th>
            </tr></thead>
            <tbody>
              {TEAM_DATA.map(m => (
                <tr key={m.name}>
                  <td>
                    <div className="row gap-sm">
                      <div style={{position:"relative"}}>
                        <Avatar name={m.avatar} size="md"/>
                        <span style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:50,border:"2px solid var(--bg)",
                          background: m.status==="online"?"var(--success)":m.status==="away"?"var(--warning)":"var(--ink-300)"}}/>
                      </div>
                      <div>
                        <div className="cell-strong">{m.name}</div>
                        <div className="cell-muted" style={{fontSize:11}}>{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge tone="outline">{m.area}</Badge></td>
                  <td>
                    {m.status === "online" ? <Badge tone="success" dot>Online</Badge> :
                     m.status === "away" ? <Badge tone="warning" dot>Away</Badge> :
                     <Badge dot>Offline</Badge>}
                  </td>
                  <td style={{fontWeight:600}}>{m.tasks}</td>
                  <td style={{fontWeight:600}}>{m.projects}</td>
                  <td>
                    <span style={{fontWeight:700,color: m.score>=90?"var(--success-ink)":m.score>=80?"var(--primary)":"var(--warning-ink)"}}>{m.score}</span>
                    <span style={{fontSize:11,color:"var(--ink-400)"}}>/100</span>
                  </td>
                  <td><button className="icon-btn" style={{width:26,height:26,background:"transparent",border:0}}><Icon.more size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "workload" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {TEAM_DATA.map(m => (
            <div key={m.name} className="card" style={{padding:"14px 18px"}}>
              <div className="row between" style={{marginBottom:10}}>
                <div className="row gap-sm">
                  <Avatar name={m.avatar} size="md"/>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{m.name}</div>
                    <div style={{fontSize:12,color:"var(--ink-500)"}}>{m.area} · {m.tasks} tareas · {m.hours}h esta semana</div>
                  </div>
                </div>
                <Badge tone={m.load>90?"danger":m.load>80?"warning":"success"}>{m.load}% carga</Badge>
              </div>
              <Progress value={m.load} tone={m.load>90?"danger":m.load>80?"warning":"success"}/>
            </div>
          ))}
        </div>
      )}

      {view === "performance" && (
        <div className="grid" style={{gridTemplateColumns:"repeat(3, 1fr)"}}>
          {TEAM_DATA.map(m => (
            <div key={m.name} className="card" style={{padding:20}}>
              <div className="row gap-sm" style={{marginBottom:16}}>
                <Avatar name={m.avatar} size="lg"/>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                  <div style={{fontSize:12,color:"var(--ink-500)"}}>{m.role}</div>
                </div>
              </div>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:40,fontWeight:800,fontFamily:"var(--font-display)",
                  color: m.score>=90?"var(--success-ink)":m.score>=80?"var(--primary)":"var(--warning-ink)"}}>{m.score}</div>
                <div style={{fontSize:12,color:"var(--ink-500)"}}>Score de rendimiento</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[["Tareas completadas",m.tasks*6,100],["Proyectos activos",m.projects*14,100],["Horas registradas",m.hours,48]].map(([label,val,max]) => (
                  <div key={label}>
                    <div className="row between" style={{fontSize:12,marginBottom:3}}>
                      <span style={{color:"var(--ink-500)"}}>{label}</span>
                      <span style={{fontWeight:600}}>{val}{label.includes("Horas")?"h":""}</span>
                    </div>
                    <Progress value={Math.min(100,(val/max)*100)} tone="brand"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SOCIAL & PUBLISHING HUB (ERP-020) ───────────────────────────────────

const useStateSocial = useState;

const SOCIAL_POSTS = [
  { id:"sp-01", client:"Mira Cosmetics", platform:"instagram", content:"Nueva colección primavera ✨ Descubrí los nuevos tonos...", media:"imagen", scheduled:"Lunes 3 Jun · 10:00", status:"scheduled", author:"Camila Vega" },
  { id:"sp-02", client:"Helia Energy", platform:"linkedin", content:"¿Cómo elegir el proveedor de energía adecuado para tu empresa?", media:"artículo", scheduled:"Lunes 3 Jun · 14:00", status:"scheduled", author:"Lucía Romero" },
  { id:"sp-03", client:"Tessera Joyas", platform:"instagram", content:"Reel: Historia de cada pieza artesanal 🎨", media:"reel", scheduled:"Martes 4 Jun · 18:00", status:"draft", author:"Camila Vega" },
  { id:"sp-04", client:"Borealis Tours", platform:"facebook", content:"Oferta especial — Patagonia antes del invierno!", media:"imagen", scheduled:"Miércoles 5 Jun · 09:30", status:"approved", author:"Sofía Vidal" },
  { id:"sp-05", client:"Klein Studio", platform:"linkedin", content:"Caso de estudio: rediseño identidad visual completa", media:"documento", scheduled:"Jueves 6 Jun · 11:00", status:"scheduled", author:"Camila Vega" },
  { id:"sp-06", client:"Aurora Café", platform:"instagram", content:"Buenos días ☀️ ¿Cuál es tu café favorito?", media:"imagen", scheduled:"Vie 7 Jun · 08:00", status:"published", author:"Sofía Vidal" },
];

const SOCIAL_NET_ICONS = { instagram: "📷", linkedin: "💼", facebook: "👥", tiktok: "🎵", youtube: "📺", twitter: "🐦" };
const SOCIAL_METRICS_DATA = [
  { platform: "Instagram", followers: "14.2K", posts: 48, reach: "82K", engagement: "4.8%", color: "#E1306C" },
  { platform: "LinkedIn", followers: "3.1K", posts: 22, reach: "28K", engagement: "3.2%", color: "#0A66C2" },
  { platform: "Facebook", followers: "8.4K", posts: 31, reach: "45K", engagement: "2.1%", color: "#1877F2" },
  { platform: "TikTok", followers: "2.6K", posts: 14, reach: "65K", engagement: "6.3%", color: "#010101" },
];

function Social() {
  const [view, setView] = useStateSocial("calendario");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Social & Publishing Hub</h1>
          <p>12 cuentas conectadas · 6 publicaciones esta semana · calendario editorial activo</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Junio 2026</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nuevo post</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Posts pendientes" value="8" delta="próximos 7 días" tone="info"/>
        <SmallStat label="Alcance total (30d)" value="220K" delta="+14% vs mayo" tone="success"/>
        <SmallStat label="Engagement promedio" value="4.1%" delta="+0.3pp" tone="brand"/>
        <SmallStat label="Posts publicados (mes)" value="115" delta="12 clientes" tone="outline"/>
      </div>

      <div className="tabs">
        {[["calendario","Calendario"],["posts","Cola de publicaciones"],["metricas","Métricas"],["cuentas","Cuentas"]].map(([id,label]) => (
          <div key={id} className={`tab${view === id ? " active" : ""}`} onClick={() => setView(id)}>{label}</div>
        ))}
      </div>

      {view === "calendario" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Semana 2–8 junio 2026</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:1, background:"var(--border-soft)" }}>
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
              <div key={d} style={{ padding:"8px 12px", background:"var(--bg)", textAlign:"center", fontSize:12, fontWeight:600, color:"var(--ink-500)" }}>{d}</div>
            ))}
            {Array.from({length:7}).map((_,di) => {
              const days = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
              const dayPosts = SOCIAL_POSTS.filter(p => p.scheduled.startsWith(days[di]));
              return (
                <div key={di} style={{ minHeight:120, padding:8, background:"var(--bg)", display:"flex", flexDirection:"column", gap:4 }}>
                  <span style={{fontSize:12,color:"var(--ink-400)",marginBottom:4}}>{di+2}</span>
                  {dayPosts.map(p => (
                    <div key={p.id} style={{ fontSize:11,padding:"4px 7px",borderRadius:6,cursor:"pointer",
                      background: p.status==="published"?"var(--success-bg)":p.status==="approved"?"var(--primary-10)":p.status==="scheduled"?"#22D3EE22":"var(--bg-2)",
                      color: p.status==="published"?"var(--success-ink)":p.status==="approved"?"var(--primary)":"var(--ink-700)",
                      fontWeight:500 }}>
                      <span style={{marginRight:4}}>{SOCIAL_NET_ICONS[p.platform]}</span>
                      {p.client} · {p.scheduled.split("·")[1]?.trim()}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "posts" && (
        <div className="card">
          <table className="tbl">
            <thead><tr>
              <th>Cliente</th><th>Red</th><th>Contenido</th><th>Media</th><th>Programado</th><th>Por</th><th>Estado</th><th></th>
            </tr></thead>
            <tbody>
              {SOCIAL_POSTS.map(p => (
                <tr key={p.id}>
                  <td className="cell-strong">{p.client}</td>
                  <td><span style={{fontSize:16}}>{SOCIAL_NET_ICONS[p.platform]}</span></td>
                  <td style={{maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:12,color:"var(--ink-600)"}}>{p.content}</td>
                  <td><Badge tone="outline">{p.media}</Badge></td>
                  <td style={{fontSize:12,color:"var(--ink-500)"}}>{p.scheduled}</td>
                  <td><div className="row gap-sm"><Avatar name={p.author} size="sm"/>{p.author.split(" ")[0]}</div></td>
                  <td>
                    {p.status==="published"&&<Badge tone="success" dot>Publicado</Badge>}
                    {p.status==="scheduled"&&<Badge tone="info" dot>Programado</Badge>}
                    {p.status==="approved"&&<Badge tone="brand" dot>Aprobado</Badge>}
                    {p.status==="draft"&&<Badge tone="outline" dot>Borrador</Badge>}
                  </td>
                  <td><button className="icon-btn" style={{width:26,height:26,background:"transparent",border:0}}><Icon.more size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "metricas" && (
        <div className="grid" style={{gridTemplateColumns:"repeat(2, 1fr)"}}>
          {SOCIAL_METRICS_DATA.map((m,i) => (
            <div key={i} className="card" style={{padding:20}}>
              <div className="row between" style={{marginBottom:16}}>
                <div className="row gap-sm">
                  <span style={{fontSize:22}}>{SOCIAL_NET_ICONS[m.platform.toLowerCase()]||"🌐"}</span>
                  <span style={{fontWeight:700,fontSize:16}}>{m.platform}</span>
                </div>
                <Badge tone="success">Conectado</Badge>
              </div>
              <div className="grid" style={{gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {[["Seguidores",m.followers],["Posts este mes",m.posts],["Alcance orgánico",m.reach],["Engagement",m.engagement]].map(([label,val]) => (
                  <div key={label} style={{background:"var(--bg-2)",borderRadius:8,padding:12}}>
                    <div style={{fontSize:11,color:"var(--ink-500)",marginBottom:2}}>{label}</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--font-display)"}}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{height:48,marginTop:14}}>
                <Spark data={[40,55,48,62,70,58,75,68,82,90,85,95].map(v => v * (Math.random()+0.5))} color={m.color} fill={m.color+"22"} w={400} h={48}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "cuentas" && (
        <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
          {[
            { client:"Mira Cosmetics", nets:["instagram","facebook","tiktok"], status:"ok" },
            { client:"Helia Energy", nets:["linkedin","twitter"], status:"ok" },
            { client:"Tessera Joyas", nets:["instagram","facebook"], status:"ok" },
            { client:"Borealis Tours", nets:["instagram","facebook","youtube"], status:"ok" },
            { client:"Klein Studio", nets:["linkedin","instagram"], status:"expiring" },
            { client:"Aurora Café", nets:["instagram","facebook"], status:"ok" },
          ].map((c,i) => (
            <div key={i} className="card" style={{padding:18}}>
              <div className="row between" style={{marginBottom:10}}>
                <span style={{fontWeight:600,fontSize:14}}>{c.client}</span>
                <Badge tone={c.status==="ok"?"success":"warning"}>{c.status==="ok"?"Token OK":"Token expira"}</Badge>
              </div>
              <div className="row gap-sm" style={{flexWrap:"wrap",gap:8}}>
                {c.nets.map(n => <span key={n} style={{fontSize:20}} title={n}>{SOCIAL_NET_ICONS[n]}</span>)}
              </div>
              <button className="btn btn-sm" style={{marginTop:12,width:"100%"}}>Gestionar cuentas</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EMAIL MARKETING (ERP-021) ────────────────────────────────────────────

const useStateEM = useState;

const EMAIL_CAMPAIGNS = [
  { id:"ec-01", name:"Newsletter Junio — Mira Cosmetics", client:"Mira Cosmetics", type:"newsletter", status:"sent", sent:4820, openRate:38.4, ctr:6.2, unsub:0.3, date:"1 Jun 2026" },
  { id:"ec-02", name:"Lanzamiento Colección Verano", client:"Tessera Joyas", type:"lanzamiento", status:"scheduled", sent:0, openRate:0, ctr:0, unsub:0, date:"5 Jun 2026" },
  { id:"ec-03", name:"Recuperación leads fríos — B2B", client:"Helia Energy", type:"secuencia", status:"active", sent:1240, openRate:22.1, ctr:4.8, unsub:0.8, date:"Activo" },
  { id:"ec-04", name:"Onboarding nuevos suscriptores", client:"Borealis Tours", type:"automatización", status:"active", sent:380, openRate:51.3, ctr:12.4, unsub:0.1, date:"Activo" },
  { id:"ec-05", name:"Remarketing abandono carrito", client:"Mira Cosmetics", type:"remarketing", status:"draft", sent:0, openRate:0, ctr:0, unsub:0, date:"—" },
  { id:"ec-06", name:"Post-venta fidelización", client:"Klein Studio", type:"automatización", status:"paused", sent:216, openRate:29.7, ctr:3.1, unsub:0.5, date:"Pausada" },
];

function EmailMarketing() {
  const [view, setView] = useStateEM("campanas");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Email Marketing</h1>
          <p>6 campañas · 3 activas · SES bulk pool · 12K contactos totales</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.filter size={14}/> Filtros</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nueva campaña</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Emails enviados (mes)" value="6.7K" delta="+22% vs mayo" tone="success"/>
        <SmallStat label="Open rate promedio" value="35.2%" delta="+3pp vs industria" tone="brand"/>
        <SmallStat label="CTR promedio" value="6.8%" delta="benchmark: 2.6%" tone="info"/>
        <SmallStat label="Unsubscribe rate" value="0.4%" delta="< 0.5% OK" tone="success"/>
      </div>

      <div className="tabs">
        {[["campanas","Campañas"],["listas","Listas & Segmentos"],["automatizaciones","Automatizaciones"],["templates","Templates"]].map(([id,label]) => (
          <div key={id} className={`tab${view === id ? " active" : ""}`} onClick={() => setView(id)}>{label}</div>
        ))}
      </div>

      {view === "campanas" && (
        <div className="card">
          <table className="tbl">
            <thead><tr>
              <th>Campaña</th><th>Cliente</th><th>Tipo</th><th>Enviados</th><th>Open rate</th><th>CTR</th><th>Unsub</th><th>Fecha</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {EMAIL_CAMPAIGNS.map(c => (
                <tr key={c.id}>
                  <td className="cell-strong">{c.name}</td>
                  <td>{c.client}</td>
                  <td><Badge tone="outline">{c.type}</Badge></td>
                  <td>{c.sent > 0 ? c.sent.toLocaleString() : "—"}</td>
                  <td style={{fontWeight:c.openRate>30?600:400,color:c.openRate>30?"var(--success-ink)":undefined}}>{c.openRate>0?c.openRate+"%":"—"}</td>
                  <td style={{fontWeight:c.ctr>5?600:400,color:c.ctr>5?"var(--primary)":undefined}}>{c.ctr>0?c.ctr+"%":"—"}</td>
                  <td style={{color:c.unsub>0.5?"var(--warning-ink)":undefined}}>{c.unsub>0?c.unsub+"%":"—"}</td>
                  <td className="cell-muted">{c.date}</td>
                  <td>
                    {c.status==="sent"&&<Badge tone="success" dot>Enviada</Badge>}
                    {c.status==="scheduled"&&<Badge tone="info" dot>Programada</Badge>}
                    {c.status==="active"&&<Badge tone="brand" dot>Activa</Badge>}
                    {c.status==="draft"&&<Badge tone="outline" dot>Borrador</Badge>}
                    {c.status==="paused"&&<Badge tone="warning" dot>Pausada</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "listas" && (
        <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
          {[
            { name:"Clientes activos", count:1240, tag:"CRM", growth:"+48 este mes", health:94 },
            { name:"Leads newsletter", count:3820, tag:"Orgánico", growth:"+120 este mes", health:88 },
            { name:"Suscriptores Mira", count:4820, tag:"Ecommerce", growth:"+240 este mes", health:92 },
            { name:"Prospectos B2B", count:890, tag:"Outbound", growth:"+35 este mes", health:76 },
            { name:"Abandono carrito", count:652, tag:"Remarketing", growth:"variable", health:82 },
            { name:"Reactivación cold", count:1180, tag:"Re-engage", growth:"+0 (cerrada)", health:65 },
          ].map((l,i) => (
            <div key={i} className="card" style={{padding:18}}>
              <div className="row between" style={{marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:14}}>{l.name}</span>
                <Badge tone="outline">{l.tag}</Badge>
              </div>
              <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--font-display)"}}>{l.count.toLocaleString()}</div>
              <div style={{fontSize:12,color:"var(--ink-500)",marginTop:2}}>{l.growth}</div>
              <div style={{marginTop:12}}>
                <div className="row between" style={{fontSize:11,marginBottom:4}}>
                  <span style={{color:"var(--ink-500)"}}>Health score</span>
                  <span style={{fontWeight:600,color:l.health>85?"var(--success-ink)":l.health>70?"var(--warning-ink)":"var(--danger-ink)"}}>{l.health}%</span>
                </div>
                <Progress value={l.health} tone={l.health>85?"success":l.health>70?"warning":"danger"}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "automatizaciones" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            { name:"Onboarding bienvenida", trigger:"Nuevo suscriptor", steps:4, active:true, sent:380, rate:"51.3%" },
            { name:"Recuperación carrito", trigger:"Carrito abandonado > 24h", steps:3, active:true, sent:265, rate:"18.2%" },
            { name:"Re-engagement cold", trigger:"Sin apertura > 60 días", steps:5, active:false, sent:0, rate:"—" },
            { name:"Post compra fidelización", trigger:"Compra confirmada", steps:3, active:true, sent:148, rate:"44.1%" },
            { name:"Lead nurturing B2B", trigger:"Form contacto descargado", steps:7, active:false, sent:0, rate:"—" },
          ].map((a,i) => (
            <div key={i} className="card" style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:16}}>
              <span style={{width:36,height:36,borderRadius:10,background:"var(--primary-10)",color:"var(--primary)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon.flow2 size={17}/>
              </span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{a.name}</div>
                <div style={{fontSize:12,color:"var(--ink-500)",marginTop:2}}>Disparador: {a.trigger} · {a.steps} pasos</div>
              </div>
              <div className="row gap-sm" style={{flexShrink:0}}>
                {a.active&&<><span style={{fontSize:13,fontWeight:600}}>{a.sent} enviados</span><span style={{fontSize:12,color:"var(--ink-500)"}}>· open {a.rate}</span></>}
                <Badge tone={a.active?"success":"outline"}>{a.active?"Activa":"Inactiva"}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "templates" && (
        <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
          {[
            { name:"Newsletter mensual", type:"newsletter", uses:24, updated:"hace 3d" },
            { name:"Bienvenida onboarding", type:"transaccional", uses:380, updated:"hace 1 sem" },
            { name:"Oferta especial", type:"comercial", uses:8, updated:"hace 2 sem" },
            { name:"Re-engagement", type:"retención", uses:12, updated:"hace 1 mes" },
            { name:"Factura adjunta", type:"administrativo", uses:142, updated:"hace 2d" },
            { name:"Confirmación cita", type:"operativo", uses:64, updated:"hace 5d" },
          ].map((t,i) => (
            <div key={i} className="card" style={{padding:18}}>
              <div className="row between" style={{marginBottom:8}}>
                <span style={{fontWeight:600,fontSize:14}}>{t.name}</span>
                <Badge tone="outline">{t.type}</Badge>
              </div>
              <div style={{height:80,background:"var(--bg-2)",borderRadius:8,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon.doc size={24} stroke={1.2}/>
              </div>
              <div className="row between" style={{fontSize:12,color:"var(--ink-500)"}}>
                <span>Usado {t.uses}x</span><span>{t.updated}</span>
              </div>
              <div className="row gap-sm" style={{marginTop:10}}>
                <button className="btn btn-sm" style={{flex:1}}>Editar</button>
                <button className="btn btn-sm btn-ghost"><Icon.copy size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MCP & AI TOOL GATEWAY (ERP-022) ─────────────────────────────────────

const useStateMCP = useState;

const MCP_TOOLS_DATA = [
  { id:"mcp-01", name:"Google Maps MCP", category:"Prospección", status:"connected", calls_today:142, cost_today:"$0.28", agent:"Sales Agent", latency:230 },
  { id:"mcp-02", name:"Apollo Lead API", category:"Enrichment", status:"connected", calls_today:87, cost_today:"$1.74", agent:"Sales Agent", latency:410 },
  { id:"mcp-03", name:"Website Scraper", category:"Research", status:"connected", calls_today:215, cost_today:"$0.43", agent:"Research Agent", latency:1840 },
  { id:"mcp-04", name:"LinkedIn Enrichment", category:"Enrichment", status:"error", calls_today:0, cost_today:"$0.00", agent:"Sales Agent", latency:0 },
  { id:"mcp-05", name:"Notion Write API", category:"Operaciones", status:"connected", calls_today:34, cost_today:"$0.00", agent:"Ops Agent", latency:180 },
  { id:"mcp-06", name:"GitHub Actions", category:"DevOps", status:"connected", calls_today:12, cost_today:"$0.00", agent:"DevOps Agent", latency:320 },
  { id:"mcp-07", name:"Stripe MCP", category:"Facturación", status:"connected", calls_today:28, cost_today:"$0.00", agent:"Billing Agent", latency:145 },
  { id:"mcp-08", name:"Google Calendar", category:"Reuniones", status:"connected", calls_today:22, cost_today:"$0.00", agent:"Assistant Agent", latency:120 },
  { id:"mcp-09", name:"Email Finder (Hunter)", category:"Prospección", status:"limit", calls_today:0, cost_today:"$0.00", agent:"Sales Agent", latency:0 },
  { id:"mcp-10", name:"AWS Lambda Invoker", category:"Infraestructura", status:"connected", calls_today:8, cost_today:"$0.02", agent:"DevOps Agent", latency:290 },
];

function MCPGateway() {
  const [view, setView] = useStateMCP("tools");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>MCP & AI Tool Gateway</h1>
          <p>10 tools registradas · 8 conectadas · 548 llamadas hoy · $2.47 costo IA hoy</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.download size={14}/> Exportar logs</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Registrar tool</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Tools activas" value="8/10" delta="1 error · 1 sin quota" tone="warning"/>
        <SmallStat label="Llamadas hoy" value="548" delta="avg 420" tone="info"/>
        <SmallStat label="Costo IA (mes)" value="$47.2" delta="budget $200" tone="success"/>
        <SmallStat label="Agentes corriendo" value="5" delta="2 en espera" tone="brand"/>
      </div>

      <div className="tabs">
        {[["tools","Tool Registry"],["agentes","Agentes activos"],["logs","Audit logs"],["costos","Costos IA"]].map(([id,label]) => (
          <div key={id} className={`tab${view === id ? " active" : ""}`} onClick={() => setView(id)}>{label}</div>
        ))}
      </div>

      {view === "tools" && (
        <div className="card">
          <table className="tbl">
            <thead><tr>
              <th>Tool</th><th>Categoría</th><th>Agente</th><th>Llamadas hoy</th><th>Costo hoy</th><th>Latencia</th><th>Estado</th><th></th>
            </tr></thead>
            <tbody>
              {MCP_TOOLS_DATA.map(t => (
                <tr key={t.id}>
                  <td className="cell-strong">{t.name}</td>
                  <td><Badge tone="outline">{t.category}</Badge></td>
                  <td style={{fontSize:12,color:"var(--ink-600)"}}>{t.agent}</td>
                  <td style={{fontWeight:600}}>{t.calls_today}</td>
                  <td className="cell-mono">{t.cost_today}</td>
                  <td className="cell-mono" style={{color:t.latency>1000?"var(--warning-ink)":undefined}}>{t.latency>0?t.latency+"ms":"—"}</td>
                  <td>
                    {t.status==="connected"&&<Badge tone="success" dot>Connected</Badge>}
                    {t.status==="error"&&<Badge tone="danger" dot>Error</Badge>}
                    {t.status==="limit"&&<Badge tone="warning" dot>Sin quota</Badge>}
                  </td>
                  <td><button className="icon-btn" style={{width:26,height:26,background:"transparent",border:0}}><Icon.cog size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "agentes" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            { name:"Sales Agent", desc:"Prospección, lead gen, calificación y creación de prospectos en ERP", tools:["Google Maps MCP","Apollo Lead API","LinkedIn Enrichment","Email Finder"], runs:28, last:"hace 12m", status:"running" },
            { name:"Research Agent", desc:"Análisis de sitios web, scraping de datos públicos e investigación de mercado", tools:["Website Scraper","Google Maps MCP"], runs:14, last:"hace 45m", status:"idle" },
            { name:"Ops Agent", desc:"Sincronización de notas, documentos y tareas entre herramientas internas", tools:["Notion Write API","Google Calendar"], runs:8, last:"hace 2h", status:"idle" },
            { name:"DevOps Agent", desc:"Deploys, monitoreo de infraestructura y gestión de workloads cloud", tools:["GitHub Actions","AWS Lambda Invoker"], runs:4, last:"hace 4h", status:"idle" },
            { name:"Billing Agent", desc:"Creación de facturas, sync de pagos y verificación de cobros en Stripe", tools:["Stripe MCP"], runs:6, last:"hace 1h", status:"running" },
          ].map((a,i) => (
            <div key={i} className="card" style={{padding:20}}>
              <div className="row between" style={{marginBottom:10}}>
                <div className="row gap-sm">
                  <span style={{width:40,height:40,borderRadius:12,background:"var(--primary-10)",color:"var(--primary)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon.robot size={20}/>
                  </span>
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{a.name}</div>
                    <div style={{fontSize:12,color:"var(--ink-500)",marginTop:1}}>{a.desc}</div>
                  </div>
                </div>
                <div className="row gap-sm">
                  <Badge tone={a.status==="running"?"success":"outline"}>{a.status==="running"?"Corriendo":"Idle"}</Badge>
                  <button className="btn btn-sm"><Icon.play size={13}/> Ejecutar</button>
                </div>
              </div>
              <div className="row between" style={{paddingTop:12,borderTop:"1px solid var(--border-soft)"}}>
                <div className="row gap-sm" style={{flexWrap:"wrap",gap:6}}>
                  {a.tools.map(t => <Badge key={t} tone="outline">{t}</Badge>)}
                </div>
                <span style={{fontSize:11.5,color:"var(--ink-500)"}}>{a.runs} ejecuciones · último {a.last}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "logs" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Audit log — últimas acciones</div>
            <button className="btn btn-sm"><Icon.filter size={13}/> Filtrar</button>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Timestamp</th><th>Agente</th><th>Tool</th><th>Acción</th><th>Resultado</th><th>Costo</th>
            </tr></thead>
            <tbody>
              {[
                { ts:"14:32:08", agent:"Sales Agent", tool:"Google Maps MCP", action:"search_businesses", result:"12 resultados", cost:"$0.002" },
                { ts:"14:31:55", agent:"Billing Agent", tool:"Stripe MCP", action:"create_invoice", result:"inv_9x2k4", cost:"$0.000" },
                { ts:"14:30:22", agent:"Sales Agent", tool:"Apollo Lead API", action:"enrich_contact", result:"ok · 8 fields", cost:"$0.020" },
                { ts:"14:28:14", agent:"Research Agent", tool:"Website Scraper", action:"scrape_url", result:"1,240 chars", cost:"$0.002" },
                { ts:"14:25:03", agent:"DevOps Agent", tool:"GitHub Actions", action:"trigger_workflow", result:"run #1482", cost:"$0.000" },
                { ts:"14:20:41", agent:"Ops Agent", tool:"Notion Write API", action:"create_page", result:"page_id: 4ac3", cost:"$0.000" },
                { ts:"14:18:09", agent:"Sales Agent", tool:"LinkedIn Enrichment", action:"lookup_profile", result:"ERROR 429", cost:"$0.000" },
              ].map((l,i) => (
                <tr key={i}>
                  <td className="cell-mono" style={{fontSize:11.5,color:"var(--ink-400)"}}>{l.ts}</td>
                  <td><Badge tone="outline">{l.agent}</Badge></td>
                  <td style={{fontSize:12,color:"var(--ink-600)"}}>{l.tool}</td>
                  <td className="cell-mono" style={{fontSize:12}}>{l.action}</td>
                  <td style={{fontSize:12,color:l.result.includes("ERROR")?"var(--danger-ink)":"var(--success-ink)"}}>{l.result}</td>
                  <td className="cell-mono" style={{fontSize:12}}>{l.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "costos" && (
        <div>
          <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
            {[
              { label:"Anthropic Claude", cost:"$28.40", pct:60, desc:"Labs IA + Agentes" },
              { label:"OpenAI (fallback)", cost:"$9.20", pct:20, desc:"GPT-4o · imágenes" },
              { label:"APIs externas", cost:"$9.60", pct:20, desc:"Apollo, Maps, Hunter" },
            ].map((c,i) => (
              <div key={i} className="card" style={{padding:18}}>
                <div className="row between" style={{marginBottom:6}}>
                  <span style={{fontWeight:600,fontSize:14}}>{c.label}</span>
                  <Badge tone="outline">{c.pct}%</Badge>
                </div>
                <div style={{fontSize:28,fontWeight:700,fontFamily:"var(--font-display)"}}>{c.cost}<span style={{fontSize:12,fontWeight:400,color:"var(--ink-500)"}}>/mes</span></div>
                <div style={{fontSize:12,color:"var(--ink-500)",marginTop:4,marginBottom:12}}>{c.desc}</div>
                <Progress value={c.pct*2} tone="brand"/>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Costo IA por cliente</div></div>
            <table className="tbl">
              <thead><tr><th>Cliente</th><th>Tokens entrada</th><th>Tokens salida</th><th>Imágenes</th><th>Costo total</th></tr></thead>
              <tbody>
                {[
                  { client:"Helia Energy", in:"420K", out:"185K", img:"—", cost:"$4.80" },
                  { client:"Mira Cosmetics", in:"380K", out:"210K", img:"48", cost:"$8.20" },
                  { client:"Tessera Joyas", in:"210K", out:"88K", img:"22", cost:"$3.60" },
                  { client:"Borealis Tours", in:"180K", out:"72K", img:"—", cost:"$2.10" },
                  { client:"Inspyra (interno)", in:"640K", out:"320K", img:"84", cost:"$14.80" },
                ].map((r,i) => (
                  <tr key={i}>
                    <td className="cell-strong">{r.client}</td>
                    <td className="cell-mono">{r.in}</td>
                    <td className="cell-mono">{r.out}</td>
                    <td className="cell-muted">{r.img}</td>
                    <td style={{fontWeight:700}}>{r.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── POLÍTICA INTELLIGENCE HUB (ERP-024) ─────────────────────────────────

const useStatePol = useState;

const POL_CANDIDATES = [
  { name:"Laura Méndez", partido:"Frente Renovador", cargo:"Candidata Intendente", intencion:38.4, delta:2.1, imagen:72, menciones:1240 },
  { name:"Carlos Ibarra", partido:"Unión Ciudadana", cargo:"Candidato Gobernador", intencion:31.2, delta:-0.8, imagen:64, menciones:880 },
  { name:"Patricia Suárez", partido:"Alianza Progresista", cargo:"Candidata Senadora", intencion:22.6, delta:1.4, imagen:68, menciones:620 },
];

function PoliticaHub() {
  const [view, setView] = useStatePol("overview");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Política Intelligence Hub</h1>
          <p>3 campañas activas · monitoreo en tiempo real · elecciones 22 Oct 2026</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.download size={14}/> Exportar reporte</button>
          <button className="btn btn-brand"><Icon.plus size={14}/> Nueva campaña</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        <SmallStat label="Días para elecciones" value="142" delta="22 Oct 2026" tone="brand"/>
        <SmallStat label="Intención voto — top" value="38.4%" delta="+2.1pp vs sem ant" tone="success"/>
        <SmallStat label="Menciones sociales (24h)" value="2,740" delta="+12% vs ayer" tone="info"/>
        <SmallStat label="Alertas reputacionales" value="2" delta="1 crítica" tone="warning"/>
      </div>

      <div className="tabs">
        {[["overview","Overview"],["encuestas","Encuestas"],["territorio","Territorio"],["warroom","War Room"],["social","Social listening"]].map(([id,label]) => (
          <div key={id} className={`tab${view === id ? " active" : ""}`} onClick={() => setView(id)}>{label}</div>
        ))}
      </div>

      {view === "overview" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {POL_CANDIDATES.map((c,i) => (
            <div key={i} className="card" style={{padding:20}}>
              <div className="row between" style={{marginBottom:14}}>
                <div className="row gap-sm">
                  <Avatar name={c.name} size="lg"/>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>{c.name}</div>
                    <div style={{fontSize:12,color:"var(--ink-500)",marginTop:2}}>{c.cargo} · {c.partido}</div>
                  </div>
                </div>
                <Badge tone="brand">Campaña activa</Badge>
              </div>
              <div className="grid" style={{gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                <div style={{background:"var(--bg-2)",borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"var(--ink-500)",marginBottom:4}}>Intención de voto</div>
                  <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--font-display)",color:"var(--primary)"}}>{c.intencion}%</div>
                  <Badge tone={c.delta>0?"success":"danger"}>{c.delta>0?"+":""}{c.delta}pp</Badge>
                </div>
                <div style={{background:"var(--bg-2)",borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"var(--ink-500)",marginBottom:4}}>Imagen positiva</div>
                  <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--font-display)"}}>{c.imagen}%</div>
                  <Progress value={c.imagen} tone="brand"/>
                </div>
                <div style={{background:"var(--bg-2)",borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"var(--ink-500)",marginBottom:4}}>Menciones (24h)</div>
                  <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--font-display)"}}>{c.menciones.toLocaleString()}</div>
                  <div style={{fontSize:11,color:"var(--ink-400)"}}>redes sociales</div>
                </div>
                <div style={{background:"var(--bg-2)",borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,color:"var(--ink-500)",marginBottom:6}}>Evolución intención</div>
                  <Spark data={[32,33,34,33,35,36,36,37,37,38,38,c.intencion].map(v=>v+(Math.random()-0.5)*0.5)} color="var(--primary)" fill="var(--primary-10)" w={140} h={40}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "encuestas" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            { title:"Encuesta nacional — Intención de voto Q2", date:"28 May 2026", size:"n=1,200", method:"Telefónica", status:"published" },
            { title:"Encuesta territorial — Zona norte urbana", date:"25 May 2026", size:"n=600", method:"Presencial", status:"published" },
            { title:"Sondeo urgente — Crisis reputacional", date:"20 May 2026", size:"n=400", method:"Online panel", status:"published" },
            { title:"Encuesta imagen candidatos", date:"15 May 2026", size:"n=800", method:"Mixta", status:"published" },
            { title:"Encuesta Q3 — julio 2026", date:"1 Jul 2026", size:"n=1,500 plan", method:"Telefónica", status:"planned" },
          ].map((e,i) => (
            <div key={i} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:16}}>
              <span style={{width:36,height:36,borderRadius:10,background:"var(--info-bg)",color:"var(--info)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon.chart size={17}/>
              </span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{e.title}</div>
                <div style={{fontSize:12,color:"var(--ink-500)",marginTop:2}}>{e.date} · {e.size} · {e.method}</div>
              </div>
              <Badge tone={e.status==="published"?"success":"info"}>{e.status==="published"?"Publicada":"Planificada"}</Badge>
            </div>
          ))}
        </div>
      )}

      {view === "warroom" && (
        <div>
          <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div className="card" style={{padding:18,borderLeft:"3px solid var(--danger)"}}>
              <div className="row between" style={{marginBottom:10}}>
                <span style={{fontWeight:700,fontSize:14,color:"var(--danger-ink)"}}>Alerta crítica activa</span>
                <Badge tone="danger">Crítica</Badge>
              </div>
              <div style={{fontWeight:600,marginBottom:6}}>Nota de prensa adversaria — declaraciones fuera de contexto</div>
              <div style={{fontSize:12,color:"var(--ink-500)",marginBottom:12}}>Canal: Medios digitales · Alcance estimado: 42K · hace 3h 20m</div>
              <div className="row gap-sm">
                <button className="btn btn-sm btn-brand"><Icon.sparkles size={13}/> Respuesta IA</button>
                <button className="btn btn-sm">Monitorear</button>
              </div>
            </div>
            <div className="card" style={{padding:18,borderLeft:"3px solid var(--warning)"}}>
              <div className="row between" style={{marginBottom:10}}>
                <span style={{fontWeight:700,fontSize:14,color:"var(--warning-ink)"}}>Alerta media</span>
                <Badge tone="warning">Media</Badge>
              </div>
              <div style={{fontWeight:600,marginBottom:6}}>Hashtag adversario trending — zona oeste</div>
              <div style={{fontSize:12,color:"var(--ink-500)",marginBottom:12}}>Canal: Twitter/X · 480 menciones en 2h · hace 1h 10m</div>
              <div className="row gap-sm">
                <button className="btn btn-sm btn-brand"><Icon.sparkles size={13}/> Respuesta IA</button>
                <button className="btn btn-sm">Monitorear</button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Feed en tiempo real</div>
              <Badge tone="danger" dot>Live</Badge>
            </div>
            {[
              { platform:"Instagram", text:"Gran discurso de Laura Méndez hoy en la plaza!", sentiment:"positivo", time:"hace 2m" },
              { platform:"Twitter/X", text:"#IBarra2026 trending — zona norte · 340 tweets/h", sentiment:"neutral", time:"hace 8m" },
              { platform:"Facebook", text:"Me preocupa la postura de Suárez sobre educación...", sentiment:"negativo", time:"hace 14m" },
              { platform:"Noticias online", text:"Encuesta revela empate técnico entre Méndez e Ibarra", sentiment:"neutral", time:"hace 22m" },
            ].map((f,i) => (
              <div key={i} style={{padding:"12px 18px",borderTop:"1px solid var(--border-soft)",display:"flex",gap:12,alignItems:"center"}}>
                <span style={{color:f.sentiment==="positivo"?"var(--success-ink)":f.sentiment==="negativo"?"var(--danger-ink)":"var(--ink-400)",flexShrink:0,fontSize:14}}>
                  {f.sentiment==="positivo"?"▲":f.sentiment==="negativo"?"▼":"●"}
                </span>
                <div style={{flex:1}}>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--ink-600)"}}>[{f.platform}]</span>
                  <span style={{fontSize:12,marginLeft:6}}>{f.text}</span>
                </div>
                <span style={{fontSize:11,color:"var(--ink-400)",flexShrink:0}}>{f.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "territorio" && (
        <div className="card" style={{padding:40,textAlign:"center"}}>
          <div style={{width:48,height:48,margin:"0 auto 14px",borderRadius:12,background:"var(--primary-10)",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
            <Icon.globe size={22} stroke={1.4}/>
          </div>
          <h3 style={{margin:0,fontFamily:"var(--font-display)",fontSize:16,fontWeight:600}}>Mapa territorial interactivo</h3>
          <p style={{color:"var(--ink-500)",fontSize:13,marginTop:4}}>Intención de voto por distrito · KPIs electorales por circuito · 48 distritos cargados</p>
          <button className="btn btn-brand" style={{margin:"16px auto 0"}}>Abrir mapa completo</button>
        </div>
      )}

      {view === "social" && (
        <div>
          <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:16}}>
            <SmallStat label="Menciones totales (24h)" value="2,740" delta="+12% vs ayer" tone="info"/>
            <SmallStat label="Sentimiento positivo" value="58%" delta="+4pp" tone="success"/>
            <SmallStat label="Temas emergentes" value="5" delta="2 requieren acción" tone="warning"/>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Temas más mencionados (últimas 24h)</div></div>
            {[
              { topic:"Educación pública", mentions:840, sentiment:72, trend:"up" },
              { topic:"Seguridad urbana", mentions:620, sentiment:45, trend:"up" },
              { topic:"Infraestructura vial", mentions:480, sentiment:58, trend:"flat" },
              { topic:"Propuesta económica", mentions:410, sentiment:63, trend:"up" },
              { topic:"Declaraciones controversiales", mentions:390, sentiment:28, trend:"down" },
            ].map((t,i) => (
              <div key={i} style={{padding:"12px 18px",borderTop:"1px solid var(--border-soft)",display:"flex",gap:16,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{t.topic}</div>
                  <div style={{fontSize:12,color:"var(--ink-500)",marginTop:2}}>{t.mentions.toLocaleString()} menciones</div>
                </div>
                <div style={{width:140}}>
                  <div className="row between" style={{fontSize:11,marginBottom:3}}>
                    <span style={{color:"var(--ink-500)"}}>Sentimiento</span>
                    <span style={{fontWeight:600,color:t.sentiment>60?"var(--success-ink)":t.sentiment>40?"var(--warning-ink)":"var(--danger-ink)"}}>{t.sentiment}%</span>
                  </div>
                  <Progress value={t.sentiment} tone={t.sentiment>60?"success":t.sentiment>40?"warning":"danger"}/>
                </div>
                <Badge tone={t.trend==="up"?"success":t.trend==="down"?"danger":"outline"}>{t.trend==="up"?"↑":t.trend==="down"?"↓":"→"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── METRICS INTELLIGENCE HUB (ERP-025) ──────────────────────────────────

const useStateMetrics = useState;

function MetricsHub() {
  const [view, setView] = useStateMetrics("executive");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Metrics Intelligence Hub</h1>
          <p>Inteligencia de negocio · datos en tiempo real · Studio Inspyra</p>
        </div>
        <div className="row gap-sm">
          <button className="btn"><Icon.calendar size={14}/> Junio 2026 <Icon.chevronDown size={12}/></button>
          <button className="btn btn-brand"><Icon.download size={14}/> Exportar</button>
        </div>
      </div>

      <div className="tabs">
        {[["executive","Ejecutivo"],["rentabilidad","Rentabilidad"],["clientes","Clientes"],["ia","Costos IA"],["equipo","Productividad"]].map(([id,label]) => (
          <div key={id} className={`tab${view === id ? " active" : ""}`} onClick={() => setView(id)}>{label}</div>
        ))}
      </div>

      {view === "executive" && (
        <div>
          <div className="grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:16}}>
            <SmallStat label="MRR" value="$32,180" delta="+8.2% vs mayo" tone="success"/>
            <SmallStat label="Ingresos junio" value="$86,420" delta="+24% vs 2025" tone="brand"/>
            <SmallStat label="Margen bruto" value="64.2%" delta="+1.8pp" tone="success"/>
            <SmallStat label="Churn rate" value="1.4%" delta="-0.3pp" tone="success"/>
          </div>
          <div className="grid" style={{gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
            <div className="card" style={{padding:18}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>MRR · últimos 12 meses</div>
              <Spark data={[18200,19400,20800,22100,23500,25200,26400,27800,29100,30200,31400,32180]} color="var(--primary)" fill="var(--primary-10)" w={560} h={80}/>
              <div className="row between" style={{marginTop:8,fontSize:12,color:"var(--ink-500)"}}>
                <span>Jul 2025</span><span>Jun 2026</span>
              </div>
            </div>
            <div className="card" style={{padding:18}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Pipeline value</div>
              {[
                { stage:"Lead", value:991000, pct:52 },
                { stage:"Propuesta", value:255000, pct:13 },
                { stage:"Reunión", value:118000, pct:6 },
                { stage:"Ganado", value:145000, pct:8 },
              ].map((s,i) => (
                <div key={i} style={{marginBottom:10}}>
                  <div className="row between" style={{fontSize:12,marginBottom:4}}>
                    <span style={{color:"var(--ink-500)"}}>{s.stage}</span>
                    <span style={{fontWeight:600}}>${(s.value/1000).toFixed(0)}K</span>
                  </div>
                  <Progress value={s.pct} tone="brand"/>
                </div>
              ))}
            </div>
          </div>
          <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
            {[
              { label:"LTV promedio", value:"$8,240", delta:"+12%", tone:"brand" },
              { label:"CAC (costo adq.)", value:"$380", delta:"-5%", tone:"success" },
              { label:"LTV:CAC ratio", value:"21.7x", delta:"objetivo 3x OK", tone:"success" },
              { label:"NRR (net revenue)", value:"112%", delta:"+4pp", tone:"brand" },
              { label:"Proyectos on-time", value:"87%", delta:"+3pp", tone:"success" },
              { label:"Proyección MRR Q3", value:"$38,500", delta:"+19.6%", tone:"info" },
            ].map((m,i) => (
              <SmallStat key={i} label={m.label} value={m.value} delta={m.delta} tone={m.tone}/>
            ))}
          </div>
        </div>
      )}

      {view === "rentabilidad" && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header">
              <div className="card-title">Rentabilidad por cliente</div>
              <Badge tone="success">Junio 2026</Badge>
            </div>
            <table className="tbl">
              <thead><tr>
                <th>Cliente</th><th>Ingresos</th><th>Costo directo</th><th>Costo IA</th><th>Margen</th><th>Margen %</th>
              </tr></thead>
              <tbody>
                {[
                  { client:"Helia Energy", rev:12400, cost:4200, ai:480, margin:7720, pct:62.3 },
                  { client:"Tessera Joyas", rev:9800, cost:3800, ai:360, margin:5640, pct:57.6 },
                  { client:"Mira Cosmetics", rev:8200, cost:2900, ai:820, margin:4480, pct:54.6 },
                  { client:"Borealis Tours", rev:6400, cost:2100, ai:210, margin:4090, pct:63.9 },
                  { client:"Klein Studio", rev:5800, cost:2400, ai:180, margin:3220, pct:55.5 },
                  { client:"Norte Films", rev:4200, cost:1800, ai:120, margin:2280, pct:54.3 },
                ].map((r,i) => (
                  <tr key={i}>
                    <td className="cell-strong">{r.client}</td>
                    <td style={{fontWeight:600}}>${r.rev.toLocaleString()}</td>
                    <td className="cell-muted">${r.cost.toLocaleString()}</td>
                    <td style={{color:"var(--warning-ink)"}}>${r.ai}</td>
                    <td style={{fontWeight:700,color:"var(--success-ink)"}}>${r.margin.toLocaleString()}</td>
                    <td>
                      <div className="row gap-sm">
                        <Progress value={r.pct} tone={r.pct>60?"success":"brand"}/>
                        <span style={{fontSize:12,fontWeight:600}}>{r.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Rentabilidad por servicio</div></div>
            <table className="tbl">
              <thead><tr>
                <th>Servicio</th><th>Clientes</th><th>MRR</th><th>Margen bruto</th><th>Churn</th>
              </tr></thead>
              <tbody>
                {[
                  { svc:"Web + SEO", clients:12, mrr:8400, margin:68, churn:"0.8%" },
                  { svc:"Hosting (HostingGuard)", clients:38, mrr:9800, margin:82, churn:"1.2%" },
                  { svc:"Software / SaaS", clients:6, mrr:7200, margin:74, churn:"0%" },
                  { svc:"Social Media", clients:9, mrr:3600, margin:61, churn:"2.1%" },
                  { svc:"Branding", clients:4, mrr:2200, margin:72, churn:"0%" },
                  { svc:"Consultoría", clients:3, mrr:980, margin:88, churn:"0%" },
                ].map((s,i) => (
                  <tr key={i}>
                    <td className="cell-strong">{s.svc}</td>
                    <td>{s.clients}</td>
                    <td style={{fontWeight:600}}>${s.mrr.toLocaleString()}</td>
                    <td>
                      <div className="row gap-sm">
                        <Progress value={s.margin} tone={s.margin>70?"success":"brand"}/>
                        <span style={{fontSize:12,fontWeight:600,color:s.margin>70?"var(--success-ink)":undefined}}>{s.margin}%</span>
                      </div>
                    </td>
                    <td style={{color:parseFloat(s.churn)>1.5?"var(--danger-ink)":undefined}}>{s.churn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "clientes" && (
        <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
          {[
            { client:"Helia Energy", health:88, ltv:14200, mrr:1240, risk:"bajo" },
            { client:"Tessera Joyas", health:92, ltv:9800, mrr:820, risk:"bajo" },
            { client:"Mira Cosmetics", health:76, ltv:8200, mrr:680, risk:"medio" },
            { client:"Borealis Tours", health:94, ltv:6400, mrr:540, risk:"bajo" },
            { client:"Klein Studio", health:71, ltv:5800, mrr:480, risk:"medio" },
            { client:"Norte Films", health:85, ltv:4200, mrr:360, risk:"bajo" },
          ].map((c,i) => (
            <div key={i} className="card" style={{padding:18}}>
              <div className="row between" style={{marginBottom:12}}>
                <div className="row gap-sm">
                  <Avatar name={c.client} size="md"/>
                  <span style={{fontWeight:600,fontSize:14}}>{c.client}</span>
                </div>
                <Badge tone={c.risk==="bajo"?"success":c.risk==="medio"?"warning":"danger"}>Riesgo {c.risk}</Badge>
              </div>
              <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{background:"var(--bg-2)",borderRadius:8,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:10,color:"var(--ink-500)",marginBottom:2}}>Health Score</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:"var(--font-display)",color:c.health>85?"var(--success-ink)":c.health>70?"var(--warning-ink)":"var(--danger-ink)"}}>{c.health}</div>
                </div>
                <div style={{background:"var(--bg-2)",borderRadius:8,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:10,color:"var(--ink-500)",marginBottom:2}}>MRR</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:"var(--font-display)"}}>${c.mrr}</div>
                </div>
              </div>
              <div style={{marginTop:10,fontSize:12,color:"var(--ink-500)"}}>LTV: <strong style={{color:"var(--ink-700)"}}>${c.ltv.toLocaleString()}</strong></div>
            </div>
          ))}
        </div>
      )}

      {view === "ia" && (
        <div>
          <div className="grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:16}}>
            <SmallStat label="Costo IA total (mes)" value="$47.2" delta="budget $200" tone="success"/>
            <SmallStat label="Tokens procesados" value="4.8M" delta="claude-sonnet-4-6" tone="info"/>
            <SmallStat label="Costo por cliente" value="$0.94" delta="avg por cliente" tone="brand"/>
            <SmallStat label="ROI sobre IA" value="18.4x" delta="vs revenue generado" tone="success"/>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Consumo IA por agente y módulo</div></div>
            <table className="tbl">
              <thead><tr>
                <th>Agente / Módulo</th><th>Modelo</th><th>Tokens entrada</th><th>Tokens salida</th><th>Costo</th><th>% del total</th>
              </tr></thead>
              <tbody>
                {[
                  { name:"Laboratorio IA (ERP-010)", model:"claude-sonnet-4-6", in:"1.8M", out:"640K", cost:"$21.40", pct:45 },
                  { name:"Sales Agent (MCP)", model:"claude-opus-4-8", in:"420K", out:"185K", cost:"$8.80", pct:19 },
                  { name:"Research Agent (MCP)", model:"claude-sonnet-4-6", in:"380K", out:"120K", cost:"$4.20", pct:9 },
                  { name:"Email Marketing IA", model:"claude-haiku-4-5", in:"640K", out:"280K", cost:"$3.60", pct:8 },
                  { name:"Política Intelligence", model:"claude-sonnet-4-6", in:"310K", out:"140K", cost:"$4.80", pct:10 },
                  { name:"Otros módulos", model:"varios", in:"240K", out:"95K", cost:"$4.40", pct:9 },
                ].map((r,i) => (
                  <tr key={i}>
                    <td className="cell-strong">{r.name}</td>
                    <td><Badge tone="outline">{r.model}</Badge></td>
                    <td className="cell-mono">{r.in}</td>
                    <td className="cell-mono">{r.out}</td>
                    <td style={{fontWeight:700}}>{r.cost}</td>
                    <td>
                      <div className="row gap-sm">
                        <Progress value={r.pct*2} tone="brand"/>
                        <span style={{fontSize:12}}>{r.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "equipo" && (
        <div>
          <div className="grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:16}}>
            <SmallStat label="Horas totales (semana)" value="227h" delta="6 personas" tone="info"/>
            <SmallStat label="Tareas completadas" value="48" delta="de 61 asignadas" tone="success"/>
            <SmallStat label="Proyectos on-time" value="87%" delta="+3pp vs mayo" tone="brand"/>
            <SmallStat label="Carga máxima" value="Pablo 96%" delta="1 saturado" tone="warning"/>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Productividad individual</div></div>
            <table className="tbl">
              <thead><tr>
                <th>Colaborador</th><th>Área</th><th>Horas</th><th>Tareas</th><th>Proyectos</th><th>Score</th><th>Carga</th>
              </tr></thead>
              <tbody>
                {TEAM_DATA.map((r,i) => (
                  <tr key={i}>
                    <td><div className="row gap-sm"><Avatar name={r.avatar} size="sm"/>{r.name}</div></td>
                    <td><Badge tone="outline">{r.area}</Badge></td>
                    <td style={{fontWeight:600}}>{r.hours}h</td>
                    <td>{r.tasks}</td>
                    <td>{r.projects}</td>
                    <td style={{fontWeight:700,color:r.score>=90?"var(--success-ink)":r.score>=85?"var(--primary)":"var(--warning-ink)"}}>{r.score}</td>
                    <td>
                      <div className="row gap-sm">
                        <Progress value={r.load} tone={r.load>90?"danger":r.load>85?"warning":"success"}/>
                        <span style={{fontSize:12,fontWeight:600}}>{r.load}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// (Campaigns moved to screens/com-campaigns.jsx — Inbound Lead Engine)

const ROUTE_BY_SCREEN = {
  dashboard: "/erp/dashboard",
  prospects: "/erp/comercial/prospectos",
  growth: "/erp/comercial/pipeline",
  campaigns: "/erp/comercial/campanas",
  followup: "/erp/comercial/seguimiento",
  pipeline: "/erp/comercial/pipeline",
  meetings: "/erp/comercial/reuniones",
  clients: "/erp/clientes",
  services: "/erp/delivery/servicios",
  projects: "/erp/proyectos",
  tasks: "/erp/tareas",
  lab: "/erp/laboratorio",
  hosting: "/erp/hostingguard",
  cloudInspyra: "/erp/inspyra-cloud",
  billing: "/erp/facturacion",
  tickets: "/erp/tickets",
  reports: "/erp/reportes",
  mailInspyra: "/erp/inspyra-mail",
  emailMarketing: "/erp/email-marketing",
  social: "/erp/integraciones-sociales",
  team: "/erp/equipo",
  mcp: "/erp/mcp",
  politica: "/erp/politica-intelligence",
  metrics: "/erp/metrics-hub",
  settings: "/erp/configuracion",
};

const SCREEN_BY_ROUTE = Object.fromEntries(
  Object.entries(ROUTE_BY_SCREEN).map(([screen, route]) => [route, screen])
);

function getScreenFromPath(pathname) {
  return SCREEN_BY_ROUTE[pathname] || "dashboard";
}


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => Boolean(getStoredToken()));
  const [screen, setScreen] = useState(() => getScreenFromPath(location.pathname));
  const [clientDrawer, setClientDrawer] = useState(null);

  const handleNav = (nextScreen) => {
    setScreen(nextScreen);
    navigate(ROUTE_BY_SCREEN[nextScreen] || "/erp/dashboard");
  };

  useEffect(() => {
    setScreen(getScreenFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => { localStorage.setItem("inspyra-screen", screen); }, [screen]);

  if (!authed) {
    return <Login onEnter={() => { setAuthed(true); handleNav("dashboard"); }}/>;
  }

  // Full-bleed screens (own layout without .main wrapper)
  if (screen === "lab") {
    return (
      <div className="app" data-screen-label="Lab IA">
        <Sidebar active={screen} onNav={handleNav}/>
        <Lab/>
      </div>
    );
  }

  if (screen === "mailInspyra") {
    return (
      <div className="app" data-screen-label="Inspyra Mail">
        <Sidebar active={screen} onNav={handleNav}/>
        <InspyraMail/>
      </div>
    );
  }

  return (
    <div className="app" data-screen-label={screen}>
      <Sidebar active={screen} onNav={handleNav}/>
      <main className="main">
        <Topbar screen={screen}/>
        {screen === "dashboard" && <DashboardV2/>}
        {screen === "prospects" && <Prospects onNav={handleNav}/>}
        {screen === "growth" && <Pipeline onNav={handleNav}/>}
        {screen === "campaigns" && <Campaigns onNav={handleNav}/>}
        {screen === "followup" && <Followup onNav={handleNav}/>}
        {screen === "pipeline" && <Pipeline onNav={handleNav}/>}
        {screen === "meetings" && <Meetings onNav={handleNav}/>}
        {screen === "clients" && <Clients onOpen={setClientDrawer}/>}
        {screen === "services" && <Services/>}
        {screen === "projects" && <Projects/>}
        {screen === "tasks" && <Tasks/>}
        {screen === "hosting" && <HostingGuard/>}
        {screen === "cloudInspyra" && <InspyraCloud/>}
        {screen === "billing" && <Billing/>}
        {screen === "tickets" && <Tickets/>}
        {screen === "reports" && <Reports/>}
        {screen === "emailMarketing" && <EmailMarketing/>}
        {screen === "social" && <Social/>}
        {screen === "team" && <Team/>}
        {screen === "mcp" && <MCPGateway/>}
        {screen === "politica" && <PoliticaHub/>}
        {screen === "metrics" && <MetricsHub/>}
        {screen === "settings" && <Settings/>}
        <button
          onClick={() => { setAuthed(false); }}
          style={{
            position: "fixed", bottom: 16, right: 16, zIndex: 20,
            padding: "6px 12px", borderRadius: 999, fontSize: 11.5,
            background: "rgba(11,13,18,.85)", color: "white", border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(8px)", display: "inline-flex", alignItems: "center", gap: 6,
          }}
          title="View login screen"
        >
          ↩ Ver Login
        </button>
      </main>
      {clientDrawer && <ClientDrawer client={clientDrawer} onClose={() => setClientDrawer(null)}/>}
    </div>
  );
}

export default App;
