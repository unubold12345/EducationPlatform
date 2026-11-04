"use client";

import { useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

type ProfileTab = { id: string; label: string; content: ReactNode };

const HASH_EVENT = "profile-tab-change";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener(HASH_EVENT, callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener(HASH_EVENT, callback);
  };
}

function getHash() {
  return window.location.hash.slice(1);
}

export function ProfileTabs({ tabs }: { tabs: ProfileTab[] }) {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const active = tabs.some(tab => tab.id === hash) ? hash : tabs[0]?.id;

  function select(id: string) {
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new Event(HASH_EVENT));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex(tab => tab.id === active);
    if (current < 0) return;
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const id = tabs[next].id;
    select(id);
    document.getElementById(`profile-tab-${id}`)?.focus();
  }

  return <div className="profile-tabs">
    <div className="profile-tablist" role="tablist" aria-label="Профайлын хэсгүүд" onKeyDown={onKeyDown}>
      {tabs.map(tab => <button className="profile-tab" key={tab.id} id={`profile-tab-${tab.id}`} type="button" role="tab" aria-selected={active===tab.id} aria-controls={`profile-panel-${tab.id}`} tabIndex={active===tab.id?0:-1} onClick={()=>select(tab.id)}>{tab.label}</button>)}
    </div>
    {tabs.map(tab => <div className="profile-tab-panel" key={tab.id} id={`profile-panel-${tab.id}`} role="tabpanel" aria-labelledby={`profile-tab-${tab.id}`} hidden={active!==tab.id}>
      {tab.content}
    </div>)}
  </div>;
}
