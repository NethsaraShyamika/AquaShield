// CaseManagement.jsx — AquaShield Admin Panel.
// Manages user cases displays, filters, paginates, and handles create/read/update/delete actions.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Fish, LayoutDashboard, Users, FileText, Briefcase, Settings,
  LogOut, LayoutGrid, Plus, Search, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, AlertCircle, Scale, CheckCircle,
  MapPin, Loader2, RefreshCw, Lock, Gavel, CircleDot,
  XCircle, AlertTriangle, ChevronDown, Zap, Filter, X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
function getToken() { return localStorage.getItem("token"); }
const authHeader = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const P = {
  oceanDeep: "#061e35",
  cardBg:    "rgba(255,255,255,0.05)",
  cyan:      "#06b6d4",
  cyanLight: "#22d3ee",
  blue:      "#2563eb",
  text:      "#ffffff",
  muted:     "rgba(255,255,255,0.40)",
  muted2:    "rgba(255,255,255,0.22)",
  border:    "rgba(255,255,255,0.10)",
  divider:   "rgba(255,255,255,0.05)",
};

const NAV = [
  { id:"dashboard", label:"Dashboard",          icon:LayoutDashboard, path:"/admin/dashboard" },
  { id:"users",     label:"User Management",    icon:Users,           path:"/admin/users"     },
  { id:"species",   label:"Species Management", icon:Fish,            path:"/admin/species"   },
  { id:"reports",   label:"Report Management",  icon:FileText,        path:"/admin/reports"   },
  { id:"cases",     label:"Case Management",    icon:Briefcase,       path:"/admin/cases"     },
  { id:"settings",  label:"Settings",           icon:Settings,        path:"/admin/settings"  },
];

//  Status metadata: badge colour, icon and label for each case status
const STATUS_META = {
  OPEN:                 { label:"Open",             icon:CircleDot,   color:"#22d3ee", bg:"rgba(34,211,238,0.12)",  border:"rgba(34,211,238,0.28)"  },
  UNDER_INVESTIGATION:  { label:"Investigating",    icon:Search,      color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.28)"  },
  LEGAL_ACTION_STARTED: { label:"Legal Action",     icon:Scale,       color:"#a78bfa", bg:"rgba(167,139,250,0.12)", border:"rgba(167,139,250,0.28)" },
  COURT_PROCEEDING:     { label:"Court Proceeding", icon:Gavel,       color:"#f472b6", bg:"rgba(244,114,182,0.12)", border:"rgba(244,114,182,0.28)" },
  CLOSED:               { label:"Closed",           icon:CheckCircle, color:"#34d399", bg:"rgba(52,211,153,0.12)",  border:"rgba(52,211,153,0.28)"  },
  REJECTED:             { label:"Rejected",         icon:XCircle,     color:"#f87171", bg:"rgba(248,113,113,0.12)", border:"rgba(248,113,113,0.28)" },
};

const PRIORITY_META = {
  HIGH:   { color:"#f87171", bg:"rgba(248,113,113,0.12)" },
  MEDIUM: { color:"#fbbf24", bg:"rgba(251,191,36,0.12)"  },
  LOW:    { color:"#34d399", bg:"rgba(52,211,153,0.12)"  },
};

const STATUS_FLOW = ["OPEN","UNDER_INVESTIGATION","LEGAL_ACTION_STARTED","COURT_PROCEEDING","CLOSED"];
const STATUSES    = Object.keys(STATUS_META);
const PRIORITIES  = ["HIGH","MEDIUM","LOW"];
const PER_PAGE    = 8;

const fmtDate     = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtDateTime = d => d ? new Date(d).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const timeAgo     = d => {
  if(!d) return "—";
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)       return "just now";
  if(s<3600)     return `${Math.floor(s/60)}m ago`;
  if(s<86400)    return `${Math.floor(s/3600)}h ago`;
  if(s<2592000)  return `${Math.floor(s/86400)}d ago`;
  return fmtDate(d);
};

//  Safely unwraps any backend response shape into an array
const extractArray = (res, hints=[]) => {
  if(Array.isArray(res)) return res;
  if(res && typeof res==="object") {
    for(const k of hints) if(Array.isArray(res[k])) return res[k];
    for(const k of Object.keys(res)) if(Array.isArray(res[k])) return res[k];
  }
  return null;
};

//  Pulls {lat,lng} from GeoJSON, nested object, or flat report fields
function extractCoords(r) {
  const c = r?.location?.coordinates;
  if(c?.length===2)                return { lat:c[1],                  lng:c[0]                  };
  if(r?.location?.latitude!=null)  return { lat:r.location.latitude,   lng:r.location.longitude  };
  if(r?.latitude!=null)            return { lat:r.latitude,            lng:r.longitude            };
  return null;
}

//  Reverse geocodes GPS to readable city/country via free OpenStreetMap Nominatim (cached)
const _geocache = {};
async function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if(_geocache[key]) return _geocache[key];
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers:{"Accept-Language":"en","User-Agent":"AquaShield/1.0"} }
    );
    const d = await r.json();
    const a = d.address||{};
    const parts = [a.city||a.town||a.village||a.county, a.state, a.country].filter(Boolean);
    const label = parts.slice(0,2).join(", ")
                || d.display_name?.split(",").slice(0,2).join(",").trim()
                || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    _geocache[key] = label;
    return label;
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
}

//  All API calls — JWT token attached via authHeader()
const api = {
  getCases:   ()     => fetch(`${API_BASE}/cases`,       {headers:authHeader()}).then(r=>r.json()),
  getReports: ()     => fetch(`${API_BASE}/reports`,     {headers:authHeader()}).then(r=>r.json()),
  createCase: data   => fetch(`${API_BASE}/cases`,       {method:"POST",  headers:authHeader(),body:JSON.stringify(data)}).then(r=>r.json()),
  updateCase: (id,d) => fetch(`${API_BASE}/cases/${id}`, {method:"PUT",   headers:authHeader(),body:JSON.stringify(d)}).then(r=>r.json()),
  deleteCase: id     => fetch(`${API_BASE}/cases/${id}`, {method:"DELETE",headers:authHeader()}).then(r=>r.json()),
};

// Auto-generates next CASE-001 style number from existing case list
function nextCaseNumber(existingCases) {
  const nums = existingCases
    .map(c => { const m=String(c.caseNumber||"").match(/^CASE-(\d+)$/i); return m?parseInt(m[1],10):0; })
    .filter(n=>n>0);
  const max = nums.length>0 ? Math.max(...nums) : 0;
  return `CASE-${String(max+1).padStart(3,"0")}`;
}

//  Today as YYYY-MM-DD — used as min on date inputs so past dates are disabled
const todayStr = () => new Date().toISOString().split("T")[0];

const iS    = {width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${P.border}`,outline:"none",background:"rgba(255,255,255,0.06)",color:P.text,fontSize:14};
const lS    = {display:"block",fontSize:12,fontWeight:700,color:"rgba(34,211,238,0.8)",marginBottom:8};
const errTxt= {margin:"5px 0 0",fontSize:11,color:"#f87171"};

function StatusBadge({status}) {
  const m=STATUS_META[status]; if(!m) return null; const Icon=m.icon;
  return (
    <span style={{background:m.bg,border:`1px solid ${m.border}`,color:m.color,borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
      <Icon size={9}/>{m.label}
    </span>
  );
}

function PriorityBadge({priority}) {
  const m=PRIORITY_META[priority]; if(!m) return null;
  return (
    <span style={{background:m.bg,color:m.color,borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:m.color,flexShrink:0}}/>{priority}
    </span>
  );
}

//  Builds chronological activity log shown in the View modal Timeline tab
function CaseTimeline({c}) {
  const evs=[];
  evs.push({date:c.createdAt,label:"Case Opened",detail:`Case ${c.caseNumber} created`,color:"#22d3ee",icon:Briefcase});
  const idx=STATUS_FLOW.indexOf(c.status);
  if(idx>=1) evs.push({date:c.updatedAt||c.createdAt,label:"Under Investigation",detail:c.assignedOfficer?`Assigned to ${c.assignedOfficer}`:"Investigation started",color:"#fbbf24",icon:Search});
  if(idx>=2) evs.push({date:c.updatedAt||c.createdAt,label:"Legal Action",detail:c.legalAction?.courtName?`Filed at ${c.legalAction.courtName}`:"Legal proceedings initiated",color:"#a78bfa",icon:Scale});
  if(idx>=3) evs.push({date:c.legalAction?.courtDate||c.updatedAt,label:"Court Proceeding",detail:c.legalAction?.courtDate?`Hearing: ${fmtDate(c.legalAction.courtDate)}`:"Court began",color:"#f472b6",icon:Gavel});
  if(c.status==="CLOSED")   evs.push({date:c.updatedAt,label:"Case Closed",  detail:c.legalAction?.fineAmount?`Fine: LKR ${Number(c.legalAction.fineAmount).toLocaleString()}`:"Resolved",color:"#34d399",icon:CheckCircle});
  if(c.status==="REJECTED") evs.push({date:c.updatedAt,label:"Case Rejected",detail:"Case was rejected",color:"#f87171",icon:XCircle});
  if(c.legalAction?.fineAmount&&c.status!=="CLOSED") evs.push({date:c.updatedAt,label:"Fine Issued",detail:`LKR ${Number(c.legalAction.fineAmount).toLocaleString()}`,color:"#fb923c",icon:Zap});
  if(c.legalAction?.jailDuration) evs.push({date:c.updatedAt,label:"Detention Order",detail:c.legalAction.jailDuration,color:"#f87171",icon:Lock});
  evs.sort((a,b)=>new Date(a.date)-new Date(b.date));
  return (
    <div>
      <p style={{fontSize:11,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14}}>Activity Log</p>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:11,top:8,bottom:8,width:1,background:P.divider,borderRadius:99}}/>
        {evs.map((ev,i)=>{const Icon=ev.icon;const isLast=i===evs.length-1;return(
          <div key={i} style={{display:"flex",gap:12,paddingBottom:12}}>
            <div style={{width:23,height:23,borderRadius:7,background:`${ev.color}18`,border:`1.5px solid ${ev.color}50`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,boxShadow:isLast?`0 0 8px ${ev.color}40`:"none"}}>
              <Icon size={10} style={{color:ev.color}}/>
            </div>
            <div style={{flex:1,background:isLast?`${ev.color}08`:"rgba(255,255,255,0.02)",border:`1px solid ${isLast?ev.color+"28":P.divider}`,borderRadius:10,padding:"8px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:isLast?ev.color:P.text}}>{ev.label}</span>
                <span style={{fontSize:10,color:P.muted,flexShrink:0}}>{timeAgo(ev.date)}</span>
              </div>
              <p style={{margin:"2px 0 0",fontSize:11,color:P.muted}}>{ev.detail}</p>
              <p style={{margin:"2px 0 0",fontSize:10,color:P.muted2,fontFamily:"monospace"}}>{fmtDateTime(ev.date)}</p>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function ViewModal({c,isAdmin,isStaff,onClose,onEdit,onDelete}) {
  const [tab,setTab]=useState("details");
  if(!c) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(2,14,31,0.80)",backdropFilter:"blur(16px)"}}>
      <div style={{width:"100%",maxWidth:520,maxHeight:"92vh",background:P.oceanDeep,border:`1px solid ${P.border}`,borderRadius:20,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 30px 80px rgba(0,0,0,0.5)"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${P.divider}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <p style={{margin:0,fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700}}>Case Details</p>
            <h2 style={{margin:"4px 0 8px",fontSize:26,fontWeight:800,color:P.cyanLight,letterSpacing:1}}>{c.caseNumber}</h2>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><StatusBadge status={c.status}/><PriorityBadge priority={c.priority}/></div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:P.muted,fontSize:22,lineHeight:1,padding:4}}>×</button>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${P.divider}`,padding:"0 22px"}}>
          {[{key:"details",label:"Details"},{key:"timeline",label:"Timeline"}].map(({key,label})=>(
            <button key={key} onClick={()=>setTab(key)} style={{background:"none",border:"none",cursor:"pointer",padding:"12px 14px",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:tab===key?P.cyanLight:P.muted,borderBottom:tab===key?`2px solid ${P.cyanLight}`:"2px solid transparent",transition:"all 0.2s",fontFamily:"Inter,sans-serif"}}>{label}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:22}}>
          {tab==="details"?(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{label:"Case Number",value:c.caseNumber},{label:"Officer",value:c.assignedOfficer||"—"},{label:"Location",value:c.locationName||"—"},{label:"Created",value:fmtDate(c.createdAt)}].map(({label,value})=>(
                  <div key={label} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${P.divider}`,borderRadius:12,padding:"10px 14px"}}>
                    <p style={{margin:0,fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>{label}</p>
                    <p style={{margin:"4px 0 0",fontSize:13,color:P.text,fontWeight:600}}>{value}</p>
                  </div>
                ))}
              </div>
              {c.notes&&(
                <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${P.divider}`,borderRadius:12,padding:"12px 14px"}}>
                  <p style={{margin:"0 0 6px",fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Notes</p>
                  <p style={{margin:0,fontSize:13,color:P.muted,lineHeight:1.6}}>{c.notes}</p>
                </div>
              )}
              {c.legalAction&&(c.legalAction.courtName||c.legalAction.fineAmount)&&(
                <div style={{background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:"12px 14px"}}>
                  <p style={{margin:"0 0 8px",fontSize:10,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Legal Action</p>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {c.legalAction.courtName    && <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:P.muted}}>Court</span><span style={{color:P.text,fontWeight:600}}>{c.legalAction.courtName}</span></div>}
                    {c.legalAction.courtDate    && <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:P.muted}}>Court Date</span><span style={{color:P.text,fontWeight:600}}>{fmtDate(c.legalAction.courtDate)}</span></div>}
                    {c.legalAction.fineAmount   && <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:P.muted}}>Fine</span><span style={{color:"#34d399",fontWeight:700}}>LKR {Number(c.legalAction.fineAmount).toLocaleString()}</span></div>}
                    {c.legalAction.jailDuration && <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:P.muted}}>Jail Duration</span><span style={{color:"#f87171",fontWeight:600}}>{c.legalAction.jailDuration}</span></div>}
                  </div>
                </div>
              )}
            </div>
          ):<CaseTimeline c={c}/>}
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${P.divider}`,display:"flex",gap:10}}>
          {(isAdmin||isStaff)&&<button onClick={()=>{onClose();onEdit(c);}} style={{flex:1,padding:"9px 0",borderRadius:12,border:"1px solid rgba(34,211,238,0.3)",background:"rgba(34,211,238,0.1)",color:P.cyanLight,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontFamily:"Inter,sans-serif"}}><Pencil size={13}/> Edit Case</button>}
          {isAdmin&&<button onClick={()=>{onClose();onDelete(c);}} style={{padding:"9px 16px",borderRadius:12,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.1)",color:"#f87171",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"Inter,sans-serif"}}><Trash2 size={13}/> Delete</button>}
        </div>
      </div>
    </div>
  );
}

// Create modal — auto case number, report GPS→address, input restrictions + validation
function CreateModal({onClose,onCreate,saving,existingCases}) {
  const [form,setForm]=useState({
    caseNumber:      nextCaseNumber(existingCases),
    reportId:        "",
    assignedOfficer: "",
    status:          "OPEN",
    priority:        "MEDIUM",
    notes:           "",
    legalAction:     {courtName:"",courtDate:"",fineAmount:"",jailDuration:""},
  });
  const [reports,   setReports]   = useState([]);
  const [rLoading,  setRLoading]  = useState(true);
  const [rError,    setRError]    = useState("");
  const [loc,       setLoc]       = useState({text:"",resolving:false});
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);

  const fetchReports = async () => {
    setRLoading(true); setRError("");
    try {
      const res  = await api.getReports();
      const list = extractArray(res,["reports","data","result","results"]);
      if(!list) { setRError("Unexpected server response."); return; }
      setReports(list);
      if(list.length===0) setRError("No reports found.");
    } catch { setRError("Failed to connect to server."); }
    finally   { setRLoading(false); }
  };
  useEffect(()=>{fetchReports();},[]);

  const set      = (k,v) => { setForm(f=>({...f,[k]:v}));                                if(submitted) setErrors(e=>({...e,[k]:""})); };
  const setLegal = (k,v) => { setForm(f=>({...f,legalAction:{...f.legalAction,[k]:v}})); if(submitted) setErrors(e=>({...e,[`legal_${k}`]:""})); };

  const handleReportSelect = async id => {
    set("reportId",id);
    if(!id) { setLoc({text:"",resolving:false}); return; }
    const r = reports.find(r=>r._id===id);
    if(!r)  { setLoc({text:"Report not found.",resolving:false}); return; }
    const coords = extractCoords(r);
    if(!coords) { setLoc({text:"No GPS coordinates in this report.",resolving:false}); return; }
    setLoc({text:`${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E`,resolving:true});
    const address = await reverseGeocode(coords.lat,coords.lng);
    setLoc({text:address,resolving:false});
  };

  //  Validation rules for the Create form
  const validate = () => {
    const e = {};
    if(!form.caseNumber.trim())
      e.caseNumber = "Case number is required.";
    else if(!/^[A-Z0-9][A-Z0-9\-]{1,18}[A-Z0-9]$/.test(form.caseNumber.trim()))
      e.caseNumber = "Use uppercase letters, numbers and hyphens only (e.g. CASE-001).";
    if(!form.reportId)
      e.reportId = "Please select a linked report.";
    if(!form.assignedOfficer.trim())
      e.assignedOfficer = "Assigned officer name is required.";
    else if(form.assignedOfficer.trim().length<3)
      e.assignedOfficer = "Officer name must be at least 3 characters.";
    if(form.notes.trim()&&form.notes.trim().length<10)
      e.notes = "Notes must be at least 10 characters if provided.";
    const la = form.legalAction;
    const anyLegal = la.courtName||la.courtDate||la.fineAmount||la.jailDuration;
    if(anyLegal) {
      if(!la.courtName.trim()) e.legal_courtName = "Court name is required when legal action is filled.";
      if(!la.courtDate)        e.legal_courtDate = "Court date is required when legal action is filled.";
      if(la.fineAmount!==""&&(isNaN(Number(la.fineAmount))||Number(la.fineAmount)<0))
        e.legal_fineAmount = "Fine must be a positive number.";
    }
    return e;
  };

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    if(Object.keys(errs).length>0) { setErrors(errs); return; }
    onCreate(form);
  };

  const reportLabel = r => `${r.incidentType||r.type||"Report"} — ${fmtDate(r.incidentDate||r.createdAt)}${r.status?` [${r.status}]`:""}`;
  const hasGood     = loc.text&&!loc.text.includes("No")&&!loc.text.includes("not found");
  const errCount    = Object.keys(errors).filter(k=>errors[k]).length;
  const fS          = key => ({...iS,border:`1px solid ${errors[key]?"#f87171":P.border}`});

  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(2,14,31,0.80)",backdropFilter:"blur(16px)"}}>
      <div style={{width:"100%",maxWidth:500,borderRadius:20,border:`1px solid ${P.border}`,overflow:"hidden",background:P.cardBg,boxShadow:"0 30px 80px rgba(0,0,0,0.35)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:`1px solid ${P.divider}`}}>
          <div>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,color:P.text}}>Create New Case</h3>
            <p style={{margin:"2px 0 0",fontSize:12,color:P.muted}}>Fields marked <span style={{color:"#f87171"}}>*</span> are required</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:22}}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{padding:"16px 22px",display:"flex",flexDirection:"column",gap:14,maxHeight:"68vh",overflowY:"auto"}}>
            {submitted&&errCount>0&&(
              <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.28)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <AlertTriangle size={15} style={{color:"#f87171",flexShrink:0}}/>
                <p style={{margin:0,fontSize:12,color:"#f87171",fontWeight:600}}>Please fix {errCount} {errCount===1?"error":"errors"} before submitting.</p>
              </div>
            )}
            <div>
              <label style={lS}>Case Number <span style={{color:"#f87171"}}>*</span> <span style={{fontWeight:400,fontSize:11,color:P.muted2}}>auto-filled, you can edit</span></label>
              <input value={form.caseNumber} onChange={e=>set("caseNumber",e.target.value.toUpperCase())} placeholder="CASE-001" maxLength={20} style={{...fS("caseNumber"),fontFamily:"monospace",letterSpacing:2,color:P.cyanLight}}/>
              {errors.caseNumber&&<p style={errTxt}>{errors.caseNumber}</p>}
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <label style={{...lS,marginBottom:0}}>Select Report <span style={{color:"#f87171"}}>*</span></label>
                <button type="button" onClick={fetchReports} disabled={rLoading} style={{background:"rgba(34,211,238,0.08)",border:"1px solid rgba(34,211,238,0.25)",color:P.cyanLight,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,opacity:rLoading?0.6:1,fontFamily:"Inter,sans-serif"}}>
                  <RefreshCw size={10} style={{animation:rLoading?"spin 1s linear infinite":"none"}}/>{rLoading?"Loading...":`Refresh (${reports.length})`}
                </button>
              </div>
              {rError&&(
                <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:10,padding:"8px 12px",marginBottom:8}}>
                  <p style={{margin:0,fontSize:12,color:"#f87171"}}>{rError}</p>
                  <p style={{margin:"2px 0 0",fontSize:10,color:"rgba(248,113,113,0.6)"}}>Open console (F12) for details.</p>
                </div>
              )}
              {rLoading
                ?<div style={{...iS,display:"flex",alignItems:"center",gap:8}}><Loader2 size={13} style={{color:P.cyanLight,animation:"spin 1s linear infinite"}}/><span style={{fontSize:13,color:P.muted}}>Loading reports…</span></div>
                :<select value={form.reportId} onChange={e=>handleReportSelect(e.target.value)} style={{...fS("reportId"),cursor:"pointer"}} disabled={reports.length===0}>
                  <option value="" style={{background:"#0f172a"}}>{reports.length===0?"— No reports —":"— Select a Report —"}</option>
                  {reports.map(r=><option key={r._id} value={r._id} style={{background:"#0f172a"}}>{reportLabel(r)}</option>)}
                </select>
              }
              {errors.reportId&&<p style={errTxt}>{errors.reportId}</p>}
            </div>
            <div>
              <label style={lS}><span style={{display:"flex",alignItems:"center",gap:6}}><Lock size={10} style={{color:P.muted}}/> Location <span style={{fontWeight:400,fontSize:11,color:P.muted2}}>— auto-filled from GPS</span></span></label>
              <div style={{...iS,display:"flex",alignItems:"center",gap:9,minHeight:42}}>
                <MapPin size={13} style={{color:hasGood?"#34d399":P.muted,flexShrink:0}}/>
                {loc.resolving
                  ?<span style={{fontSize:12,color:P.muted,display:"flex",alignItems:"center",gap:6}}><Loader2 size={11} style={{animation:"spin 1s linear infinite",color:P.cyanLight}}/> Resolving address…</span>
                  :loc.text
                    ?<span style={{fontSize:13,color:loc.text.includes("No")?"#fbbf24":"#34d399",fontWeight:600}}>{loc.text}</span>
                    :<span style={{fontSize:12,color:P.muted2,fontStyle:"italic"}}>Select a report above…</span>
                }
              </div>
            </div>
            <div>
              <label style={lS}>Assigned Officer <span style={{color:"#f87171"}}>*</span></label>
              <input value={form.assignedOfficer} onChange={e=>set("assignedOfficer",e.target.value.replace(/[0-9]/g,""))} placeholder="Officer full name…" style={fS("assignedOfficer")}/>
              {errors.assignedOfficer&&<p style={errTxt}>{errors.assignedOfficer}</p>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={lS}>Status</label>
                <select value={form.status} onChange={e=>set("status",e.target.value)} style={{...iS,cursor:"pointer"}}>
                  {STATUSES.map(s=><option key={s} value={s} style={{background:"#0f172a"}}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
              <div>
                <label style={lS}>Priority</label>
                <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={{...iS,cursor:"pointer"}}>
                  {PRIORITIES.map(p=><option key={p} value={p} style={{background:"#0f172a"}}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={lS}>Notes <span style={{fontWeight:400,color:P.muted2,fontSize:11}}>(optional — min 10 chars if provided)</span></label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Add relevant case notes…" style={{...fS("notes"),resize:"none"}}/>
              {errors.notes&&<p style={errTxt}>{errors.notes}</p>}
            </div>
            <div style={{background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:12,padding:14}}>
              <p style={{margin:"0 0 4px",fontSize:12,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.12em"}}>Legal Action</p>
              <p style={{margin:"0 0 12px",fontSize:11,color:P.muted2}}>Optional — if any field is filled, Court Name and Court Date become required.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{...lS,fontSize:11}}>Court Name</label>
                  <input type="text" value={form.legalAction.courtName} onChange={e=>setLegal("courtName",e.target.value.replace(/[0-9]/g,""))} placeholder="e.g. Colombo High Court" style={{...iS,padding:"8px 10px",fontSize:13,border:`1px solid ${errors.legal_courtName?"#f87171":P.border}`}}/>
                  {errors.legal_courtName&&<p style={{...errTxt,fontSize:10}}>{errors.legal_courtName}</p>}
                </div>
                <div>
                  <label style={{...lS,fontSize:11}}>Court Date</label>
                  <input type="date" value={form.legalAction.courtDate} min={todayStr()} onChange={e=>setLegal("courtDate",e.target.value)} style={{...iS,padding:"8px 10px",fontSize:13,border:`1px solid ${errors.legal_courtDate?"#f87171":P.border}`}}/>
                  {errors.legal_courtDate&&<p style={{...errTxt,fontSize:10}}>{errors.legal_courtDate}</p>}
                </div>
                <div>
                  <label style={{...lS,fontSize:11}}>Fine (LKR)</label>
                  <input type="text" inputMode="numeric" value={form.legalAction.fineAmount} onChange={e=>setLegal("fineAmount",e.target.value.replace(/[^0-9]/g,""))} placeholder="e.g. 50000" style={{...iS,padding:"8px 10px",fontSize:13,border:`1px solid ${errors.legal_fineAmount?"#f87171":P.border}`}}/>
                  {errors.legal_fineAmount&&<p style={{...errTxt,fontSize:10}}>{errors.legal_fineAmount}</p>}
                </div>
                <div>
                  <label style={{...lS,fontSize:11}}>Jail Duration</label>
                  <input type="text" value={form.legalAction.jailDuration} onChange={e=>setLegal("jailDuration",e.target.value)} placeholder="e.g. 6 months" style={{...iS,padding:"8px 10px",fontSize:13}}/>
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:"14px 22px",borderTop:`1px solid ${P.divider}`,display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button type="button" onClick={onClose} style={{padding:"9px 20px",borderRadius:12,border:`1px solid ${P.border}`,background:"rgba(255,255,255,0.04)",color:P.muted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Cancel</button>
            <button type="submit" disabled={saving} style={{padding:"9px 22px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${P.cyan} 0%,${P.blue} 100%)`,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:saving?0.5:1,display:"flex",alignItems:"center",gap:8,boxShadow:"0 10px 24px rgba(6,182,212,0.28)",fontFamily:"Inter,sans-serif"}}>
              {saving?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>Creating…</>:<><Plus size={13}/>Create Case</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//  Edit modal — same restrictions as Create; Case Number and Location are read-only
function EditModal({c,onClose,onSave,saving}) {
  const [form,setForm]=useState({
    assignedOfficer: c?.assignedOfficer||"",
    status:          c?.status||"OPEN",
    priority:        c?.priority||"MEDIUM",
    notes:           c?.notes||"",
    legalAction: {
      courtName:    c?.legalAction?.courtName||"",
      courtDate:    c?.legalAction?.courtDate?new Date(c.legalAction.courtDate).toISOString().split("T")[0]:"",
      fineAmount:   c?.legalAction?.fineAmount||"",
      jailDuration: c?.legalAction?.jailDuration||"",
    },
  });
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set      = (k,v) => { setForm(f=>({...f,[k]:v}));                                if(submitted) setErrors(e=>({...e,[k]:""})); };
  const setLegal = (k,v) => { setForm(f=>({...f,legalAction:{...f.legalAction,[k]:v}})); if(submitted) setErrors(e=>({...e,[`legal_${k}`]:""})); };

  const validate = () => {
    const e = {};
    if(!form.assignedOfficer.trim())
      e.assignedOfficer = "Assigned officer name is required.";
    else if(form.assignedOfficer.trim().length<3)
      e.assignedOfficer = "Officer name must be at least 3 characters.";
    if(form.notes.trim()&&form.notes.trim().length<10)
      e.notes = "Notes must be at least 10 characters if provided.";
    const la = form.legalAction;
    const anyLegal = la.courtName||la.courtDate||la.fineAmount||la.jailDuration;
    if(anyLegal) {
      if(!la.courtName.trim()) e.legal_courtName = "Court name is required when legal action is filled.";
      if(!la.courtDate)        e.legal_courtDate = "Court date is required when legal action is filled.";
      if(la.fineAmount!==""&&(isNaN(Number(la.fineAmount))||Number(la.fineAmount)<0))
        e.legal_fineAmount = "Fine must be a positive number.";
    }
    return e;
  };

  const handleSave = () => {
    setSubmitted(true);
    const errs = validate();
    if(Object.keys(errs).length>0) { setErrors(errs); return; }
    onSave(c._id,form);
  };

  const errCount = Object.keys(errors).filter(k=>errors[k]).length;
  const fS       = key => ({...iS,border:`1px solid ${errors[key]?"#f87171":P.border}`});

  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(2,14,31,0.80)",backdropFilter:"blur(16px)"}}>
      <div style={{width:"100%",maxWidth:500,borderRadius:20,border:`1px solid ${P.border}`,overflow:"hidden",background:P.cardBg,boxShadow:"0 30px 80px rgba(0,0,0,0.35)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:`1px solid ${P.divider}`}}>
          <div>
            <p style={{margin:0,fontSize:11,color:P.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Editing Case</p>
            <h3 style={{margin:"2px 0 0",fontSize:20,fontWeight:800,color:P.cyanLight,letterSpacing:1}}>{c?.caseNumber}</h3>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:22}}>×</button>
        </div>
        <div style={{padding:"16px 22px",display:"flex",flexDirection:"column",gap:14,maxHeight:"68vh",overflowY:"auto"}}>
          {submitted&&errCount>0&&(
            <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.28)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <AlertTriangle size={15} style={{color:"#f87171",flexShrink:0}}/>
              <p style={{margin:0,fontSize:12,color:"#f87171",fontWeight:600}}>Please fix {errCount} {errCount===1?"error":"errors"} before saving.</p>
            </div>
          )}
          <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${P.divider}`,borderRadius:12,padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <p style={{margin:0,fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Case Number</p>
              <p style={{margin:"3px 0 0",fontSize:13,fontFamily:"monospace",color:P.cyanLight,fontWeight:700}}>{c?.caseNumber}</p>
            </div>
            <div>
              <p style={{margin:0,fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Location</p>
              <p style={{margin:"3px 0 0",fontSize:13,color:P.muted,fontWeight:600}}>{c?.locationName||"—"}</p>
            </div>
          </div>
          <div>
            <label style={lS}>Assigned Officer <span style={{color:"#f87171"}}>*</span></label>
            <input value={form.assignedOfficer} onChange={e=>set("assignedOfficer",e.target.value.replace(/[0-9]/g,""))} placeholder="Officer name…" style={fS("assignedOfficer")}/>
            {errors.assignedOfficer&&<p style={errTxt}>{errors.assignedOfficer}</p>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={lS}>Status</label>
              <select value={form.status} onChange={e=>set("status",e.target.value)} style={{...iS,cursor:"pointer"}}>
                {STATUSES.map(s=><option key={s} value={s} style={{background:"#0f172a"}}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={lS}>Priority</label>
              <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={{...iS,cursor:"pointer"}}>
                {PRIORITIES.map(p=><option key={p} value={p} style={{background:"#0f172a"}}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lS}>Notes <span style={{fontWeight:400,color:P.muted2,fontSize:11}}>(optional — min 10 chars if provided)</span></label>
            <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Case notes…" style={{...fS("notes"),resize:"none"}}/>
            {errors.notes&&<p style={errTxt}>{errors.notes}</p>}
          </div>
          <div style={{background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:12,padding:14}}>
            <p style={{margin:"0 0 4px",fontSize:12,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.12em"}}>Legal Action</p>
            <p style={{margin:"0 0 12px",fontSize:11,color:P.muted2}}>Optional — if any field is filled, Court Name and Court Date become required.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{...lS,fontSize:11}}>Court Name</label>
                <input type="text" value={form.legalAction.courtName} onChange={e=>setLegal("courtName",e.target.value.replace(/[0-9]/g,""))} placeholder="Court name…" style={{...iS,padding:"8px 10px",fontSize:13,border:`1px solid ${errors.legal_courtName?"#f87171":P.border}`}}/>
                {errors.legal_courtName&&<p style={{...errTxt,fontSize:10}}>{errors.legal_courtName}</p>}
              </div>
              <div>
                <label style={{...lS,fontSize:11}}>Court Date</label>
                <input type="date" value={form.legalAction.courtDate} min={todayStr()} onChange={e=>setLegal("courtDate",e.target.value)} style={{...iS,padding:"8px 10px",fontSize:13,border:`1px solid ${errors.legal_courtDate?"#f87171":P.border}`}}/>
                {errors.legal_courtDate&&<p style={{...errTxt,fontSize:10}}>{errors.legal_courtDate}</p>}
              </div>
              <div>
                <label style={{...lS,fontSize:11}}>Fine (LKR)</label>
                <input type="text" inputMode="numeric" value={form.legalAction.fineAmount} onChange={e=>setLegal("fineAmount",e.target.value.replace(/[^0-9]/g,""))} placeholder="0" style={{...iS,padding:"8px 10px",fontSize:13,border:`1px solid ${errors.legal_fineAmount?"#f87171":P.border}`}}/>
                {errors.legal_fineAmount&&<p style={{...errTxt,fontSize:10}}>{errors.legal_fineAmount}</p>}
              </div>
              <div>
                <label style={{...lS,fontSize:11}}>Jail Duration</label>
                <input type="text" value={form.legalAction.jailDuration} onChange={e=>setLegal("jailDuration",e.target.value)} placeholder="e.g. 6 months" style={{...iS,padding:"8px 10px",fontSize:13}}/>
              </div>
            </div>
          </div>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${P.divider}`,display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:12,border:`1px solid ${P.border}`,background:"rgba(255,255,255,0.04)",color:P.muted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{padding:"9px 22px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${P.cyan} 0%,${P.blue} 100%)`,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:saving?0.5:1,display:"flex",alignItems:"center",gap:8,boxShadow:"0 10px 24px rgba(6,182,212,0.28)",fontFamily:"Inter,sans-serif"}}>
            {saving?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>Saving…</>:"Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({c,onClose,onConfirm,deleting}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(2,14,31,0.80)",backdropFilter:"blur(16px)"}}>
      <div style={{width:"100%",maxWidth:380,borderRadius:20,border:"1px solid rgba(248,113,113,0.25)",overflow:"hidden",background:P.oceanDeep,boxShadow:"0 30px 80px rgba(0,0,0,0.5)",padding:28,textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:16,background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Trash2 size={22} style={{color:"#f87171"}}/></div>
        <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:P.text}}>Delete Case?</h3>
        <p style={{margin:"0 0 4px",fontSize:13,color:P.muted}}>Permanently deleting</p>
        <p style={{margin:"0 0 6px",fontSize:20,fontWeight:800,color:"#f87171",letterSpacing:1}}>{c?.caseNumber}</p>
        <p style={{margin:"0 0 22px",fontSize:12,color:P.muted2}}>This action cannot be undone.</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"10px 0",borderRadius:12,border:`1px solid ${P.border}`,background:"rgba(255,255,255,0.04)",color:P.muted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Cancel</button>
          <button onClick={()=>onConfirm(c._id)} disabled={deleting} style={{flex:1,padding:"10px 0",borderRadius:12,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.14)",color:"#f87171",fontWeight:700,fontSize:13,cursor:"pointer",opacity:deleting?0.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"Inter,sans-serif"}}>
            {deleting?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>Deleting…</>:"Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Main page — loads cases, handles filter/search/sort, opens modals
export default function CaseManagement() {
  const navigate = useNavigate();
  const [activeNav,      setActiveNav]      = useState("cases");
  const [cases,          setCases]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [page,           setPage]           = useState(1);
  const [viewing,        setViewing]        = useState(null);
  const [editing,        setEditing]        = useState(null);
  const [deleting,       setDeleting]       = useState(null);
  const [creating,       setCreating]       = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [deletingId,     setDeletingId]     = useState(false);
  const [toast,          setToast]          = useState(null);

  const showToast = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  const user    = (()=>{ try { const t=getToken(); return t?JSON.parse(atob(t.split(".")[1])):null; } catch { return null; } })();
  const isAdmin = user?.isAdmin===true;
  const isStaff = !isAdmin&&!!user;

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.getCases();
      const list = extractArray(res,["cases","data","result","results"]);
      setCases(list??[]);
    } catch { setCases([]); }
    finally   { setLoading(false); }
  },[]);

  useEffect(()=>{ if(!getToken()){ navigate("/login",{replace:true}); return; } loadCases(); },[loadCases,navigate]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    let list = cases;
    if(q)                      list = list.filter(c=>[c.caseNumber,c.assignedOfficer,c.locationName,c.notes].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)));
    if(filterStatus!=="ALL")   list = list.filter(c=>c.status===filterStatus);
    if(filterPriority!=="ALL") list = list.filter(c=>c.priority===filterPriority);
    return [...list].sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
  },[search,filterStatus,filterPriority,cases]);

  useEffect(()=>{ setPage(1); },[search,filterStatus,filterPriority]);

  const totalPages = Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const paged      = filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);

  const stats = useMemo(()=>({
    total:  cases.length,
    open:   cases.filter(c=>c.status==="OPEN").length,
    high:   cases.filter(c=>c.priority==="HIGH").length,
    closed: cases.filter(c=>c.status==="CLOSED").length,
  }),[cases]);

  const handleCreate = async data => {
    setSaving(true);
    try {
      const n = await api.createCase(data);
      if(n._id) { setCases(cs=>[...cs,n]); setCreating(false); showToast(`✅ Case ${n.caseNumber} created!`); }
      else showToast(n.message||"Failed.","error");
    } catch { showToast("Failed to create.","error"); }
    finally   { setSaving(false); }
  };

  const handleSave = async (id,data) => {
    setSaving(true);
    try {
      const u = await api.updateCase(id,data);
      setCases(cs=>cs.map(c=>c._id===id?{...c,...u}:c));
      setEditing(null); showToast("Case updated!");
    } catch { showToast("Failed to update.","error"); }
    finally   { setSaving(false); }
  };

  const handleDelete = async id => {
    setDeletingId(true);
    try {
      await api.deleteCase(id);
      setCases(cs=>cs.filter(c=>c._id!==id));
      setDeleting(null); showToast("Case deleted.");
    } catch { showToast("Failed to delete.","error"); }
    finally   { setDeletingId(false); }
  };

  const handleNav    = (id,path) => { setActiveNav(id); navigate(path); };
  const handleLogout = ()         => { localStorage.removeItem("token"); localStorage.removeItem("user"); sessionStorage.clear(); navigate("/login",{replace:true}); };

  return (
    <div className="cm-page" style={{color:P.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes toastIn { from { transform:translateY(20px) scale(.95); opacity:0 } to { transform:translateY(0) scale(1); opacity:1 } }
        :root { --ocean-start:#1E3A5F; --ocean-end:#0C1423; --glass-bg:rgba(255,255,255,0.08); --glass-border:rgba(255,255,255,0.18) }
        .cm-page { position:relative; min-height:100vh; overflow:hidden; background:linear-gradient(135deg,var(--ocean-start) 0%,var(--ocean-end) 100%) }
        .cm-page::before,.cm-page::after { content:""; position:absolute; border-radius:999px; pointer-events:none; filter:blur(70px) }
        .cm-page::before { width:380px; height:380px; top:-120px; left:-100px; background:rgba(59,130,246,0.2) }
        .cm-page::after  { width:460px; height:460px; right:-140px; bottom:-170px; background:rgba(30,58,95,0.3) }
        .cm-layout  { position:relative; z-index:1; display:flex; min-height:100vh }
        .cm-sidebar { width:260px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.08); background:rgba(6,15,30,0.88); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); padding:22px 14px; display:flex; flex-direction:column; gap:10px; position:fixed; top:0; left:0; height:100vh; z-index:20; overflow-y:auto }
        .cm-sidebar-logo   { display:flex; align-items:center; gap:10px; padding:8px 10px 16px; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.08) }
        .cm-nav-btn        { width:100%; border:none; display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; cursor:pointer; text-align:left; color:rgba(255,255,255,0.62); background:transparent; transition:all 180ms ease; font-size:14px; font-weight:600; font-family:Inter,sans-serif }
        .cm-nav-btn:hover  { background:rgba(255,255,255,0.06); color:#fff }
        .cm-nav-active     { background:rgba(34,211,238,0.14); color:#22d3ee; box-shadow:inset 0 0 0 1px rgba(34,211,238,0.28) }
        .cm-sidebar-footer { margin-top:auto; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08) }
        .cm-content  { position:relative; z-index:1; flex:1; margin-left:260px; width:calc(100% - 260px) }
        .cm-inner    { font-family:Inter,sans-serif; max-width:1180px; margin:0 auto; padding:20px 24px }
        .cm-card     { background:var(--glass-bg); border:1px solid var(--glass-border); box-shadow:0 12px 34px rgba(0,0,0,0.32); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px) }
        .cm-btn-primary       { background:linear-gradient(135deg,#22d3ee,#2563eb); color:#fff; box-shadow:0 10px 24px rgba(6,182,212,0.3); border:none; cursor:pointer; font-family:Inter,sans-serif; font-weight:700 }
        .cm-btn-primary:hover { filter:brightness(1.06) }
        .cm-table th,.cm-table td { padding:13px 14px; border-bottom:1px solid rgba(255,255,255,0.05) }
        .cm-table th   { font-size:11px; color:rgba(255,255,255,0.40); text-align:left; background:rgba(255,255,255,0.02); font-weight:700; letter-spacing:0.1em; text-transform:uppercase }
        .cm-row:hover  { background:rgba(255,255,255,0.025) }
        .cm-action-btn { background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:600; font-family:Inter,sans-serif; padding:0; transition:opacity 0.15s }
        .cm-action-btn:hover { opacity:0.75 }
        .cm-fade  { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both }
        .cm-toast { animation:toastIn .3s cubic-bezier(.16,1,.3,1) both }
        select option { background:#0d1f35 }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.5) }
      `}</style>

      <div className="cm-layout">
        <aside className="cm-sidebar">
          <div className="cm-sidebar-logo">
            <div style={{display:"inline-flex",width:36,height:36,alignItems:"center",justifyContent:"center",borderRadius:12,background:"linear-gradient(135deg,rgba(34,211,238,0.24),rgba(37,99,235,0.24))",border:"1px solid rgba(34,211,238,0.28)"}}>
              <Briefcase size={17} style={{color:"#22d3ee"}}/>
            </div>
            <div>
              <p style={{margin:0,fontSize:14,fontWeight:800,color:"#fff"}}>AquaShield</p>
              <p style={{margin:0,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.45)"}}>Admin Panel</p>
            </div>
          </div>
          {NAV.map(({id,label,icon:Icon,path})=>(
            <button key={id} type="button" className={`cm-nav-btn ${activeNav===id?"cm-nav-active":""}`} onClick={()=>handleNav(id,path)}>
              <Icon size={15}/><span>{label}</span>
            </button>
          ))}
          <div className="cm-sidebar-footer">
            <button type="button" className="cm-nav-btn" onClick={handleLogout}><LogOut size={15}/><span>Logout</span></button>
          </div>
        </aside>

        <div className="cm-content">
          <div className="cm-inner">

            <header className="cm-card cm-fade" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,borderRadius:24,padding:"18px 24px",animationDelay:"0ms"}}>
              <div>
                <div style={{marginBottom:8,display:"inline-flex",alignItems:"center",gap:8,borderRadius:999,padding:"4px 12px",fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",border:`1px solid ${P.border}`,background:"rgba(255,255,255,0.04)",color:P.cyanLight}}>
                  <LayoutGrid size={12}/> Admin Panel
                </div>
                <h1 style={{margin:0,fontSize:28,fontWeight:800,color:P.text,letterSpacing:-0.5}}>Case Management</h1>
                <p style={{margin:"4px 0 0",fontSize:13,color:P.muted}}>Investigate, manage and track pollution cases</p>
              </div>
              {(isAdmin||isStaff)&&(
                <button onClick={()=>setCreating(true)} className="cm-btn-primary" style={{display:"inline-flex",alignItems:"center",gap:8,borderRadius:16,padding:"10px 20px",fontSize:13}}>
                  <Plus size={16}/> Create New Case
                </button>
              )}
            </header>

            <section className="cm-fade" style={{marginTop:18,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,animationDelay:"50ms"}}>
              {[
                {label:"Total Cases",   value:stats.total,  color:P.cyanLight, icon:Briefcase   },
                {label:"Open Cases",    value:stats.open,   color:"#fbbf24",   icon:CircleDot   },
                {label:"High Priority", value:stats.high,   color:"#f87171",   icon:AlertCircle },
                {label:"Closed",        value:stats.closed, color:"#34d399",   icon:CheckCircle },
              ].map(({label,value,color,icon:Icon})=>(
                <div key={label} className="cm-card" style={{borderRadius:18,padding:"16px 20px"}}>
                  <div style={{marginBottom:12,width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:`${color}14`,border:`1px solid ${color}22`}}>
                    <Icon size={18} style={{color}}/>
                  </div>
                  <p style={{margin:0,fontSize:13,color:P.muted}}>{label}</p>
                  <p style={{margin:"2px 0 0",fontSize:30,fontWeight:800,color:P.text}}>{loading?"—":value}</p>
                </div>
              ))}
            </section>

            <section className="cm-card cm-fade" style={{marginTop:18,borderRadius:24,overflow:"hidden",animationDelay:"100ms"}}>
              <div style={{padding:"16px 22px",borderBottom:`1px solid ${P.divider}`}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div>
                    <h2 style={{margin:0,fontSize:19,fontWeight:800,color:P.text}}>Cases</h2>
                    <p style={{margin:"2px 0 0",fontSize:12,color:P.muted}}>
                      {filtered.length} {filtered.length===1?"case":"cases"}
                      {(filterStatus!=="ALL"||filterPriority!=="ALL")&&<span style={{color:P.cyanLight}}> (filtered)</span>}
                    </p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={loadCases} disabled={loading} className="cm-btn-primary" style={{display:"inline-flex",alignItems:"center",gap:6,borderRadius:12,padding:"9px 14px",fontSize:12,opacity:loading?0.6:1}}>
                      <RefreshCw size={12} style={{animation:loading?"spin 1s linear infinite":"none"}}/> Refresh
                    </button>
                    {(isAdmin||isStaff)&&(
                      <button onClick={()=>setCreating(true)} className="cm-btn-primary" style={{display:"inline-flex",alignItems:"center",gap:6,borderRadius:12,padding:"9px 16px",fontSize:13}}>
                        <Plus size={14}/> Add Case
                      </button>
                    )}
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
                  <div style={{position:"relative",flex:"1",minWidth:200}}>
                    <Search size={14} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:P.muted,pointerEvents:"none"}}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by case no., officer, location…"
                      style={{width:"100%",borderRadius:12,padding:"9px 34px 9px 34px",fontSize:13,border:`1px solid ${P.border}`,background:"rgba(255,255,255,0.05)",color:P.text,outline:"none",boxSizing:"border-box"}}/>
                    {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:P.muted,display:"flex",alignItems:"center",padding:0}}><X size={13}/></button>}
                  </div>
                  <div style={{position:"relative"}}>
                    <Filter size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:P.muted,pointerEvents:"none"}}/>
                    <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                      style={{appearance:"none",paddingLeft:28,paddingRight:28,paddingTop:9,paddingBottom:9,borderRadius:12,border:`1px solid ${filterStatus!=="ALL"?P.cyanLight:P.border}`,background:filterStatus!=="ALL"?"rgba(34,211,238,0.08)":"rgba(255,255,255,0.05)",color:filterStatus!=="ALL"?P.cyanLight:P.muted,fontSize:13,outline:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,minWidth:148}}>
                      <option value="ALL" style={{background:"#0d1f35",color:"#fff"}}>All Statuses</option>
                      {STATUSES.map(s=><option key={s} value={s} style={{background:"#0d1f35",color:"#fff"}}>{STATUS_META[s].label}</option>)}
                    </select>
                    <ChevronDown size={12} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",color:P.muted,pointerEvents:"none"}}/>
                  </div>
                  <div style={{position:"relative"}}>
                    <Filter size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:P.muted,pointerEvents:"none"}}/>
                    <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}
                      style={{appearance:"none",paddingLeft:28,paddingRight:28,paddingTop:9,paddingBottom:9,borderRadius:12,border:`1px solid ${filterPriority!=="ALL"?P.cyanLight:P.border}`,background:filterPriority!=="ALL"?"rgba(34,211,238,0.08)":"rgba(255,255,255,0.05)",color:filterPriority!=="ALL"?P.cyanLight:P.muted,fontSize:13,outline:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600,minWidth:140}}>
                      <option value="ALL" style={{background:"#0d1f35",color:"#fff"}}>All Priorities</option>
                      {PRIORITIES.map(p=><option key={p} value={p} style={{background:"#0d1f35",color:"#fff"}}>{p}</option>)}
                    </select>
                    <ChevronDown size={12} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",color:P.muted,pointerEvents:"none"}}/>
                  </div>
                </div>
              </div>

              {loading?(
                <div style={{padding:48,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(34,211,238,0.15)",borderTopColor:"#22d3ee",animation:"spin 1s linear infinite"}}/>
                  <p style={{color:P.muted,fontSize:13,margin:0}}>Loading cases…</p>
                </div>
              ):(
                <>
                  <div style={{overflowX:"auto"}}>
                    <table className="cm-table" style={{width:"100%",minWidth:860,borderCollapse:"collapse"}}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Case No.</th>
                          <th>Officer</th>
                          <th>Location</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((c,i)=>{
                          const rowNum = (page-1)*PER_PAGE+i+1;
                          return (
                            <tr key={c._id} className="cm-row">
                              <td style={{color:P.muted2,fontSize:12,fontWeight:600,width:40}}>{rowNum}</td>
                              <td><span style={{fontFamily:"monospace",fontWeight:800,color:P.cyanLight,fontSize:13,letterSpacing:0.5}}>{c.caseNumber}</span></td>
                              <td>
                                <div style={{display:"flex",alignItems:"center",gap:9}}>
                                  <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,rgba(34,211,238,0.12),rgba(6,182,212,0.05))",border:"1px solid rgba(34,211,238,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:P.cyanLight,flexShrink:0}}>
                                    {c.assignedOfficer?c.assignedOfficer[0].toUpperCase():"?"}
                                  </div>
                                  <span style={{fontSize:13,color:P.text,fontWeight:500}}>{c.assignedOfficer||<span style={{color:P.muted2,fontStyle:"italic",fontSize:12}}>Unassigned</span>}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:P.muted}}>
                                  <MapPin size={11} style={{color:P.muted2,flexShrink:0}}/>
                                  <span style={{maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.locationName||"—"}</span>
                                </span>
                              </td>
                              <td><PriorityBadge priority={c.priority}/></td>
                              <td><StatusBadge status={c.status}/></td>
                              <td>
                                <span style={{fontSize:12,color:P.muted}}>{fmtDate(c.createdAt)}</span>
                                <p style={{margin:"2px 0 0",fontSize:10,color:P.muted2}}>{timeAgo(c.createdAt)}</p>
                              </td>
                              <td>
                                <div style={{display:"flex",alignItems:"center",gap:14}}>
                                  <button className="cm-action-btn" style={{color:P.cyanLight}} onClick={()=>setViewing(c)}><Eye size={14}/> View</button>
                                  {(isAdmin||isStaff)&&<button className="cm-action-btn" style={{color:"#a78bfa"}} onClick={()=>setEditing(c)}><Pencil size={14}/> Edit</button>}
                                  {isAdmin&&<button className="cm-action-btn" style={{color:"#fb7185"}} onClick={()=>setDeleting(c)}><Trash2 size={14}/> Delete</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {paged.length===0&&(
                          <tr><td colSpan={8} style={{textAlign:"center",padding:56,color:P.muted,fontSize:14}}>
                            {search||filterStatus!=="ALL"||filterPriority!=="ALL"?"No cases match your filters.":"No cases found."}
                            {(search||filterStatus!=="ALL"||filterPriority!=="ALL")&&(
                              <div style={{marginTop:10}}>
                                <button onClick={()=>{setSearch("");setFilterStatus("ALL");setFilterPriority("ALL");}} style={{display:"inline-flex",alignItems:"center",gap:5,borderRadius:12,padding:"7px 14px",fontSize:12,border:`1px solid ${P.border}`,color:P.muted,background:"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600}}><X size={11}/> Clear Filters</button>
                              </div>
                            )}
                            {!search&&filterStatus==="ALL"&&filterPriority==="ALL"&&(isAdmin||isStaff)&&(
                              <div style={{marginTop:12}}>
                                <button onClick={()=>setCreating(true)} className="cm-btn-primary" style={{display:"inline-flex",alignItems:"center",gap:6,borderRadius:12,padding:"8px 18px",fontSize:12}}><Plus size={13}/> Create First Case</button>
                              </div>
                            )}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 22px",borderTop:`1px solid ${P.divider}`}}>
                    <p style={{margin:0,fontSize:13,color:P.muted}}>Page {page} of {totalPages} · {filtered.length} cases</p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{display:"inline-flex",alignItems:"center",gap:5,borderRadius:12,padding:"8px 14px",fontSize:13,border:`1px solid ${P.border}`,color:P.muted,background:"rgba(255,255,255,0.04)",cursor:"pointer",opacity:page===1?0.4:1,fontFamily:"Inter,sans-serif",fontWeight:600}}>
                        <ChevronLeft size={15}/> Previous
                      </button>
                      <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} style={{display:"inline-flex",alignItems:"center",gap:5,borderRadius:12,padding:"8px 14px",fontSize:13,border:`1px solid ${P.border}`,color:P.muted,background:"rgba(255,255,255,0.04)",cursor:"pointer",opacity:page>=totalPages?0.4:1,fontFamily:"Inter,sans-serif",fontWeight:600}}>
                        Next <ChevronRight size={15}/>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {creating && <CreateModal onClose={()=>setCreating(false)} onCreate={handleCreate} saving={saving} existingCases={cases}/>}
      {viewing  && <ViewModal   c={viewing}  isAdmin={isAdmin} isStaff={isStaff} onClose={()=>setViewing(null)}  onEdit={setEditing} onDelete={setDeleting}/>}
      {editing  && <EditModal   c={editing}  onClose={()=>setEditing(null)}   onSave={handleSave}     saving={saving}/>}
      {deleting && <DeleteModal c={deleting} onClose={()=>setDeleting(null)}  onConfirm={handleDelete} deleting={deletingId}/>}

      {toast&&(
        <div className="cm-toast" style={{position:"fixed",bottom:24,right:24,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderRadius:14,fontSize:13,fontWeight:700,fontFamily:"Inter,sans-serif",backdropFilter:"blur(12px)",background:toast.type==="success"?"rgba(52,211,153,0.12)":"rgba(248,113,113,0.12)",border:`1px solid ${toast.type==="success"?"rgba(52,211,153,0.35)":"rgba(248,113,113,0.35)"}`,color:toast.type==="success"?"#34d399":"#f87171",boxShadow:"0 10px 30px rgba(0,0,0,0.3)"}}>
            {toast.type==="success"?<CheckCircle size={15}/>:<AlertTriangle size={15}/>}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
