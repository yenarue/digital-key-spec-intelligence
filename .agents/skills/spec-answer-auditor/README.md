# Spec Answer Auditor

**AI가 만든 Spec 해석의 주장·인용·버전을 실제 근거와 대조하는 Codex Skill**

[에이전트 지침 보기 (SKILL.md)](./SKILL.md) · [전체 Skill 계획](../../../docs/skills-plan.md) · [Navigator 안내](../spec-requirement-navigator/README.md)

## 무엇을 해결하나요?

AI가 정확한 Requirement ID를 붙였다고 해서 해석까지 맞는 것은 아닙니다. 이 Skill은 **검색된 출처가 실제 존재하는지**와 **그 출처가 답변의 주장을 정말 뒷받침하는지**를 나눠 점검합니다.

- 존재하지 않는 Requirement ID / 잘못된 인용문 탐지
- V1과 V2의 요구사항 혼동 탐지
- `SHALL`(필수)과 `MAY`(선택 가능)를 바꿔 말한 경우 확인
- 조건부 허용을 '항상 허용'이라고 일반화한 경우 지적
- 추가 Section 확인이나 담당자 검토가 필요한 부분 표시

검토 결과는 **Supported / Needs Interpretation / Unsupported**의 세 상태로 표시합니다. 이것은 AI 기반 검토이므로 최종적인 적합성·법률 판단이나 전문 엔지니어 리뷰를 대체하지 않습니다.

> **현재 Skill의 검증 대상은 독립 창작 합성 V1/V2 규격입니다.** 이 저장소에는 실제 CCC 3.1.4/4.1.0 문서가 없으며, 해당 문서에 접근할 수 없으면 실제 CCC 답변을 검증했다고 주장하지 않습니다.

## 사용 준비

1. 이 저장소를 로컬에 클론하고 **저장소 루트에서 Codex**를 사용합니다.
2. 검토할 AI 답변과 **인용된 근거 ID 또는 원문**을 준비합니다.
3. Skill을 명확히 선택하려면 프롬프트 첫 줄에 `$spec-answer-auditor`를 넣습니다.
4. 현재는 `data/demo/spec-v1.json`, `data/demo/spec-v2.json`을 직접 확인할 수 있어야 합니다. Vercel, OpenRouter 키, Local MCP 서버는 Skill 데모에 필요하지 않습니다.

## 사용 예시 ① — Navigator의 답변 검토

[실제 Codex 실행 기록: 질문과 감사 답변](./example.md) — 2026-10-29 같은 대화의 Navigator 답변을 합성 V2 원문과 대조한 사례입니다. 아래는 재실행용 안내입니다.

먼저 [Navigator Skill](../spec-requirement-navigator/README.md)로 합성 V2의 UWB/NFC fallback 조건을 질문한 뒤 **같은 Codex 대화에서** 다음을 입력합니다.

```text
$spec-answer-auditor

방금 spec-requirement-navigator가 작성한 답변을 검증해줘.
핵심 주장을 하나씩 나누고, 실제 가상 V2 요구사항 원문과 비교해서
Supported / Needs Interpretation / Unsupported로 평가해줘.
근거 ID와 원문 일치 여부, 누락된 조건도 알려줘.
```

다른 세션에서 실행한다면 검토할 답변을 프롬프트에 **직접 붙여 넣어야** 합니다. '방금 답변'이라는 참조만으로 과거 대화 내용을 자동 조회하지는 않습니다.

**기대 결과:** 주장별 판정표, 누락·오인용 목록, 근거가 있는 수정 문장.

## 사용 예시 ② — 의도적으로 틀린 답변 검증

다음 문장은 **오답 테스트를 위해 만든 주장**이며 실제 CCC 요구사항을 설명하지 않습니다.

```text
$spec-answer-auditor

다음 답변의 인용과 해석을 가상 V2 규격으로 검증해줘.

"가상 V2에서는 UWB ranging이 실패하면 모든 사용자가 NFC로
조건 없이 차량에 접근할 수 있다.
근거: SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-010"

각 주장에 Supported / Needs Interpretation / Unsupported 판정을 해주고,
누락한 조건과 정확한 관련 Requirement를 알려줘.
```

**기대하는 검증 포인트**

- `REQ-010` 자체가 실제로 존재하더라도 **'조건 없이 누구나 접근'**을 뒷받침하지 않습니다.
- `REQ-010` 외에 `REQ-011`(탭 등 조건), `REQ-012`(채널·동작 권한)를 함께 검토해야 합니다.
- 단순 인용 ID 일치와 의미상 타당성은 별도로 판단해야 합니다.

## 사용 예시 ③ — 존재하지 않는 출처

```text
$spec-answer-auditor

가상 V2에 다음과 같은 답변이 있다고 가정하고 검증해줘.

"모든 Friend Device는 무제한 재공유가 필수다.
근거: SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-999"

요구사항 ID의 실재 여부와 주장 해석을 따로 판정해줘.
```

**기대 결과:** `REQ-999`는 해당 가상 규격에 없으므로 인용 오류를 보고하고, 실제로 확인한 `REQ-004` 등의 위임 조건을 검토하도록 제안해야 합니다.

## 결과 판정 예시

| 판정 | 의미 | 예시 |
| --- | --- | --- |
| **Supported** | 관련 원문이 주장과 적용 범위를 직접 뒷받침함 | V2에 적힌 조건을 조건 그대로 설명 |
| **Needs Interpretation** | 관련 근거는 있으나 참조 조항·예외 확인이 더 필요 | NFC 동작과 권한 요건을 일부만 확인 |
| **Unsupported** | 근거 누락·버전 오류·잘못된 인용·과도한 일반화 | 존재하지 않는 `REQ-999` 인용 |

## 검증 완료 체크리스트

- [ ] 핵심 주장을 독립된 문장으로 나눴나요?
- [ ] Requirement ID와 Version이 실제 데이터와 일치하나요?
- [ ] 원문 발췌가 **정확히 일치**하나요?
- [ ] 원문에 있는 제한·조건·예외까지 반영했나요?
- [ ] 유효한 인용이지만 잘못된 해석인 경우를 구분했나요?
- [ ] 검증이 불가능한 정보는 정직하게 남겼나요?

## Web RAG 및 향후 Local MCP와의 관계

이 Skill은 **감사 워크플로**이며 Vercel 웹앱의 코드나 MCP 서버가 아닙니다. 웹앱에서 만든 합성 데이터 답변도 Codex로 가져와 검토할 수 있습니다. 향후 승인된 로컬 MCP에서 `get_requirement` 및 관련 Section을 제공하면 실제 규격의 근거 검증 절차로 확장할 수 있습니다.

사내 계약된 Codex·Claude·Gemini를 통한 실제 CCC 자료 검토는 조직의 승인 조건 안에서 진행해야 합니다. **실제 CCC 원문 및 인덱스를 Public GitHub·Vercel·개인 OpenRouter에 올리지 않습니다.**

## 관련 파일

- [SKILL.md](./SKILL.md): 실제 에이전트 감사 지침
- [Navigator README](../spec-requirement-navigator/README.md): 답변을 먼저 만드는 Skill
- [가상 V1](../../../data/demo/spec-v1.json) / [가상 V2](../../../data/demo/spec-v2.json): 감사 대상의 원문
- [Skill 로드맵](../../../docs/skills-plan.md): 평가 및 후속 확장 계획
