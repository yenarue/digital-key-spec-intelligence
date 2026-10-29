"use client";
import { useId, useRef, type ReactNode } from "react";

// Skill 설계 카드의 이름 버튼으로 여는 상세 팝업. 내용은 서버에서 그린 children을 그대로 보여주기만 한다.
export function SkillDialog({ id, name, closeLabel, children }: { id: string; name: string; closeLabel: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <h3><button className="skill-open" type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{name}</button></h3>
    <dialog ref={dialog} id={id} className="skill-dialog" aria-labelledby={titleId}
      onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="skill-dialog-body">
        <div className="skill-dialog-head">
          <h2 id={titleId}>{name}</h2>
          <button className="skill-dialog-close" type="button" aria-label={closeLabel} onClick={() => dialog.current?.close()}>×</button>
        </div>
        {children}
      </div>
    </dialog>
  </>;
}

// 열린 팝업 안에서 다른 Skill 팝업으로 바꿔 연다.
export function SkillDialogSwitch({ targetId, label, children }: { targetId: string; label: string; children: ReactNode }) {
  return <button className="skill-pair-link" type="button" aria-label={label} onClick={event => {
    event.currentTarget.closest("dialog")?.close();
    (document.getElementById(targetId) as HTMLDialogElement | null)?.showModal();
  }}>{children}</button>;
}
