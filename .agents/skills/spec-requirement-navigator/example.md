# 실제 실행 예시 — 가상 V2 UWB/NFC fallback

- 실행일: 2026-10-29
- 실행 환경: 이 저장소를 읽을 수 있는 Codex 대화에서 명시적으로 Skill 호출
- 원문: [합성 규격 V2](../../../data/demo/spec-v2.json)
- 방법: 로컬 JSON 직접 검색 및 참조 조항 확인. MiniSearch·MCP·외부 API는 사용하지 않음.
- 기록 범위: 사용자의 질문과 최종 답변. 도구 출력과 진행 메시지는 제외하고, 파일 링크만 저장소 상대 경로로 변경함.

**가상/합성 규격에 대한 실행 기록이며 실제 CCC 규정이 아닙니다.** 이 사례는 명시적 Skill 호출을 확인한 한 건의 수동 실행입니다. 자동 활성화·비활성화, 다른 버전, 허위 ID 거부 등 전체 회귀 테스트의 통과를 뜻하지 않습니다.

이 답변을 같은 대화에서 검토한 [Auditor 질문·답변 기록](../spec-answer-auditor/example.md)도 함께 보세요. 감사 결과를 소급 반영하지 않고 당시 답변을 보존했습니다.

## 사용자 질문

```text
$spec-requirement-navigator
가상 V2 스펙에서 UWB ranging 실패 시 NFC fallback이 가능한 조건을 찾아줘. 관련 Requirement ID와 예외 조건을 원문 근거와 함께 설명해줘.
```

## 최종 답변

**가상/합성 규격에 대한 답변 — 실제 CCC 규정이 아님**

**검색 범위:** *Fictional Vehicle Digital Access Specification — Educational Demo Only*, **V2만** 확인했습니다. 검색 코어는 아직 구현되지 않아 [원본 JSON](../../../data/demo/spec-v2.json)을 직접 검색하고 참조 조항을 확인했습니다.

**결론:** UWB ranging을 사용할 수 없거나 신뢰도가 부족하면 **passive entry는 중단해야 합니다**. 이때 credential이 NFC entry를 허용하면 사용자는 **NFC tap-to-access를 시도할 수 있습니다(MAY)**. 자동 전환이나 접근 성공을 보장하는 조항은 아닙니다.

**근거와 적용 조건**

1. **DEMO-V2-REQ-010 · §3.2.2 — fallback 허용 조건**  
   [SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-010]
   > If fictional UWB ranging is unavailable or confidence is insufficient, passive entry SHALL stop. The user MAY attempt NFC tap-to-access only when the credential permits NFC entry.

   UWB 사용 불가 또는 신뢰도 부족이 중단 조건이며, **NFC entry 권한이 있어야** 대체 접근을 시도할 수 있습니다.

2. **DEMO-V2-REQ-011 · §3.3.1 — NFC 검증 조건과 정지 예외**  
   [SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-011]
   > For fictional NFC entry, a valid credential and explicit tap SHALL be verified; NFC access SHALL NOT depend on a prior UWB session, but a suspended credential SHALL be rejected.

   **유효한 credential과 명시적 tap**을 검증해야 합니다. 이전 UWB 세션은 필요하지 않지만, **일시정지된 credential은 거부**해야 합니다.

3. **DEMO-V2-REQ-012 · §4.1.1 — 권한·채널 제한**  
   [SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-012]
   > Every fictional access request SHALL be checked against the credential's allowed operations and channel restrictions. Entry-only or NFC-only permission SHALL NOT imply vehicle-start permission.

   NFC fallback에도 **허용 작업과 채널 제한**을 적용해야 합니다. Entry-only 또는 NFC-only 권한으로 **시동 권한까지 있다고 판단할 수 없습니다**.

**추가 예외·거부 조건**

- **폐기된 credential:** 무선 인증에 성공해도 이후 작업을 거부합니다.  
  **DEMO-V2-REQ-005 · §2.3.1**  
  [SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-005]
  > After a fictional key is marked revoked, the access controller SHALL reject subsequent operations using that credential and any invitations derived from it, even if radio authentication succeeds.

- **위임 credential의 일시정지 전파:** Owner가 승인한 재개 이벤트가 완료될 때까지 위임 credential도 차단합니다.  
  **DEMO-V2-REQ-006 · §2.3.2**  
  [SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-006]
  > Suspension SHALL also block delegated credentials until an owner-approved resume event is completed.

- **공유 credential의 허용 시간 밖:** 활성 시간대가 설정되어 있다면 그 밖의 접근은 거부합니다.  
  **DEMO-V2-REQ-013 · §4.1.2**  
  [SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-013]
  > When a fictional shared credential has an active-time window, the vehicle SHALL reject access outside that window, including for delegated invitations, regardless of radio discovery success.

**미확인 사항:** 이 조항들은 UWB 신뢰도 임계값, NFC 재시도 횟수, 자동 전환 절차를 정의하지 않습니다. 따라서 해당 동작이나 수치를 추가로 단정할 근거는 없습니다.
