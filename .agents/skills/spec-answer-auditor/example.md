# 실제 실행 예시 — Navigator 답변 감사

- 실행일: 2026-10-29
- 실행 환경: Navigator 답변을 생성한 동일한 Codex 대화에서 명시적으로 Skill 호출
- 감사 입력: [직전 Navigator 질문·답변 기록](../spec-requirement-navigator/example.md)의 최종 답변 전체
- 원문: [합성 규격 V2](../../../data/demo/spec-v2.json)
- 방법: 로컬 JSON에서 인용 ID·Section·본문 및 참조 조항을 확인. Python으로 6개 ID의 실재 여부와 인용문 부분 문자열 일치를 검사하고, 해석은 주장별로 검토함.
- 기록 범위: 사용자의 질문과 최종 답변. 도구 출력과 진행 메시지는 제외하고, 파일 링크만 저장소 상대 경로로 변경함.

**가상/합성 규격에 대한 실행 기록이며 실제 CCC 규정이 아닙니다.** 이 사례는 명시적 Skill 호출을 확인한 한 건의 수동 실행입니다. 같은 Codex 대화의 후속 감사이므로 별도 모델이나 별도 에이전트의 독립 검토로 해석하지 않습니다. 허위 ID·오인용·버전 혼동 등의 전체 회귀 테스트를 통과했다는 뜻도 아닙니다.

## 사용자 질문

```text
$spec-answer-auditor
방금 생성한 답변의 모든 핵심 주장을 실제 합성 규격 원문과 비교해 검증해줘. 근거가 충분한 주장과 추가 해석이 필요한 주장을 구분해줘.
```

## 최종 답변

**감사 대상:** 직전 답변과 [합성 규격 V2 원문](../../../data/demo/spec-v2.json). 원문과 관련 참조 조항에 접근해 검증했습니다. **실제 CCC 규정에 대한 감사는 아닙니다.**

인용된 **6개 ID와 Section은 모두 일치**하며, **6개 영문 인용도 원문과 정확히 일치**합니다. 아래 판정은 인용의 정확성과 별도로 주장에 대한 논리적 지원을 검토한 결과입니다.

표의 근거 ID는 모두 `SRC:DKSI-SYNTHETIC:V2:` 접두사를 갖습니다.

| 핵심 주장 | 판정 | 근거 ID | 이유 |
| --- | --- | --- | --- |
| UWB ranging 사용 불가 또는 신뢰도 부족 시 passive entry를 중단해야 한다 | Supported | `DEMO-V2-REQ-010` | 해당 조건과 `SHALL stop`이 명시되어 있습니다. |
| NFC entry 권한이 있으면 사용자가 NFC 접근을 시도할 수 있다 | Supported | `DEMO-V2-REQ-010` | `MAY attempt`와 `only when the credential permits NFC entry`를 정확히 반영했습니다. |
| NFC 접근 시 유효한 credential과 명시적 tap을 검증해야 한다 | Supported | `DEMO-V2-REQ-011` | 두 검증 대상과 `SHALL`이 명시되어 있습니다. |
| NFC 접근에 이전 UWB 세션이 필요하지 않다 | Supported | `DEMO-V2-REQ-011` | `SHALL NOT depend on a prior UWB session`과 일치합니다. |
| 일시정지된 credential은 거부해야 한다 | Supported | `DEMO-V2-REQ-011` | `a suspended credential SHALL be rejected`가 직접 뒷받침합니다. |
| NFC fallback에도 허용 작업과 채널 제한을 적용해야 한다 | Supported | `DEMO-V2-REQ-012` | `Every fictional access request`에 적용되므로 NFC 접근도 포함됩니다. |
| Entry-only 또는 NFC-only 권한만으로 시동 권한을 추정할 수 없다 | Supported | `DEMO-V2-REQ-012` | `SHALL NOT imply vehicle-start permission`과 일치합니다. 별도 시동 권한까지 금지한다는 뜻은 아닙니다. |
| 폐기된 credential은 무선 인증 성공 여부와 관계없이 이후 작업을 거부한다 | Supported | `DEMO-V2-REQ-005` | 원문에 직접 명시되어 있습니다. 파생 invitation도 적용 대상입니다. |
| 일시정지는 위임 credential도 차단하며 Owner 승인 재개 이벤트까지 유지된다 | Supported | `DEMO-V2-REQ-006` | 참조 조항의 차단 대상과 해제 조건을 정확히 반영했습니다. |
| 활성 시간대가 설정된 공유 credential은 시간대 밖에서 접근을 거부한다 | Supported | `DEMO-V2-REQ-013` | 공유 credential이라는 적용 범위와 시간대 설정 조건을 보존했습니다. |
| 자동 전환이나 접근 성공을 보장하는 조항은 아니다 | Needs Interpretation | `DEMO-V2-REQ-010`, `011`, `012` | 사용자에게 시도를 허용하고 추가 검증을 요구합니다. 다만 **자동 전환을 명시적으로 금지하지는 않습니다**. “보장 근거가 없다”는 문서 해석으로 한정해야 합니다. |
| UWB 신뢰도 임계값·NFC 재시도 횟수·자동 전환 절차가 정의되어 있지 않다 | Supported — 확인 범위 한정 | V2 전체 | 확인한 V2에는 해당 정의가 없습니다. `REQ-008`의 최대 2회 재시도는 **BLE 연결**에만 적용되므로 NFC에 옮겨 적용할 수 없습니다. |

**핵심 결함:** 원문과 모순되는 주장, 허위 인용, 버전 혼동은 발견하지 못했습니다. 다만 “자동 전환이나 성공을 보장하지 않는다”는 표현은 **명시적 금지 규정이 아니라, 그러한 보장을 도출할 근거가 없다는 해석**임을 더 분명히 하면 좋습니다.

또한 `REQ-010`이 참조하는 `REQ-009`의 UWB 거리·인증 세션 조건은 **passive entry의 조건**입니다. 이를 NFC에 그대로 추가하면, 이전 UWB 세션에 의존하지 말라는 `REQ-011`과의 구분이 흐려집니다. 직전 답변은 이 조건을 NFC에 잘못 적용하지 않았습니다.

**권장 수정:**  
“가상 V2에서는 UWB ranging 사용 불가 또는 신뢰도 부족 시 passive entry를 중단해야 한다. NFC entry 권한이 있는 사용자는 명시적 tap으로 NFC 접근을 시도할 수 있으며, 유효성·권한·채널 제한 및 해당 정지·폐기·시간 제한을 충족해야 한다. 이 원문만으로 자동 전환 의무나 접근 성공을 도출할 수는 없다.”

**검증 한계:** 합성 V2의 문구와 참조 관계를 검증한 결과입니다. 실제 구현의 적합성이나 실제 CCC 준수를 입증하지 않습니다.
